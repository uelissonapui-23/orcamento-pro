#!/usr/bin/env python3
"""Orçamento Pro only: validated SQL, one transaction, no retries. Python stdlib + psql."""
import argparse
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

PROJECT = "aiblckekbiudkyrkywnz"
LOCK = (1869639538, 808)
NAME = re.compile(r"([0-9]{14})_[a-z0-9_]+\.sql\Z")


class Invalid(ValueError):
    pass


def statements(sql):
    """Lex only outer SQL; strings, identifiers, dollar bodies and comments are opaque."""
    result, words, start = [], [], None
    i = 0
    while i < len(sql):
        c = sql[i]
        if c.isspace():
            i += 1
            continue
        if sql.startswith('--', i):
            end = sql.find('\n', i)
            i = len(sql) if end < 0 else end + 1
            continue
        if sql.startswith('/*', i):
            depth = 1
            i += 2
            while i < len(sql) and depth:
                if sql.startswith('/*', i):
                    depth += 1
                    i += 2
                elif sql.startswith('*/', i):
                    depth -= 1
                    i += 2
                else:
                    i += 1
            if depth:
                raise Invalid('Unterminated comment')
            continue
        if start is None:
            start = i
        if c == '\\':
            raise Invalid('psql commands are not allowed in migration files')
        if c in "'\"":
            quote = c
            escaped = quote == "'" and i > 0 and sql[i - 1] in 'eE'
            i += 1
            while i < len(sql):
                if escaped and sql[i] == '\\':
                    i += 2
                elif sql[i] == quote:
                    if i + 1 < len(sql) and sql[i + 1] == quote:
                        i += 2
                    else:
                        i += 1
                        break
                else:
                    i += 1
            else:
                raise Invalid('Unterminated quoted value')
            words.append('<quoted>')
            continue
        dollar = re.match(r'\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$', sql[i:])
        if dollar:
            tag = dollar.group()
            end = sql.find(tag, i + len(tag))
            if end < 0:
                raise Invalid('Unterminated dollar body')
            i = end + len(tag)
            words.append('<body>')
            continue
        if c == ';':
            if words:
                result.append((start, i + 1, words))
            else:
                raise Invalid('Empty SQL statement')
            words, start = [], None
            i += 1
            continue
        word = re.match(r'[A-Za-z_][A-Za-z_0-9$]*', sql[i:])
        if word:
            words.append(word.group().lower())
            i += len(word.group())
        else:
            words.append(c)
            i += 1
    if words:
        raise Invalid('Every statement must end with a semicolon')
    return result


def normalize(sql):
    if '\x00' in sql:
        raise Invalid('NUL bytes are not supported')
    parts = statements(sql)
    if not parts:
        raise Invalid('Empty migration')
    wrapped = parts[0][2] == ['begin'] and parts[-1][2] == ['commit']
    inner = parts[1:-1] if wrapped else parts
    if not inner:
        raise Invalid('Empty transaction')
    allowed = {'create', 'alter', 'drop', 'insert', 'update', 'delete', 'grant', 'revoke', 'comment', 'notify', 'do', 'select'}
    for _, _, words in inner:
        if words[0] not in allowed:
            raise Invalid('Unsupported outer SQL statement: ' + words[0])
        if any(w in words for w in ('concurrently', 'database', 'tablespace', 'subscription')):
            raise Invalid('Nontransactional or out-of-contract SQL')
    if wrapped:
        # Only the two token spans are removed; comments/function bodies remain byte-for-byte.
        for a, b, _ in reversed([parts[0], parts[-1]]):
            sql = sql[:a] + sql[b:]
    return sql, wrapped


def inventory(folder):
    files, versions = [], set()
    for path in sorted(Path(folder).iterdir()):
        if path.suffix != '.sql':
            continue
        match = NAME.fullmatch(path.name)
        if not match or path.is_symlink() or not path.is_file():
            raise Invalid('Invalid migration path/name')
        version = match[1]
        if version in versions:
            raise Invalid('Duplicate migration version')
        versions.add(version)
        sql, wrapped = normalize(path.read_bytes().decode('utf-8'))
        files.append((version, path.name, sql, wrapped))
    if not files:
        raise Invalid('No migrations found')
    return files


def connection_env(dsn, project, local):
    try:
        u = urlsplit(dsn)
        host, port = u.hostname, u.port or 5432
        user, password = unquote(u.username or ''), unquote(u.password or '')
    except ValueError:
        raise Invalid('Invalid connection configuration') from None
    if u.scheme not in ('postgres', 'postgresql') or not host or not user or u.query or u.fragment:
        raise Invalid('Use a PostgreSQL URI without query options')
    database = unquote(u.path.removeprefix('/'))
    if local:
        if host not in ('127.0.0.1', 'localhost', '::1') or not database.startswith('op08_test'):
            raise Invalid('Disposable tests require loopback and an op08_test database')
    else:
        direct = host == f'db.{PROJECT}.supabase.co' and user == 'postgres'
        pooler = bool(re.fullmatch(r'aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com', host)) and user == f'postgres.{PROJECT}'
        if project != PROJECT or database != 'postgres' or port not in (5432, 6543) or not (direct or pooler):
            raise Invalid('Project/host/user/database does not match Orçamento Pro')
    # Never pass credentials in argv or accept inherited PGOPTIONS/service files.
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    env.update(PGHOST=host, PGPORT=str(port), PGUSER=user, PGPASSWORD=password,
               PGDATABASE=database, PGSSLMODE='disable' if local else 'require',
               PGCONNECT_TIMEOUT='10', PGAPPNAME='orcamento-pro-migrations', PGPASSFILE=os.devnull)
    return env


def batch(files):
    values = ','.join(f"('{v}','{name}')" for v, name, _, _ in files)
    lines = ["\\set ON_ERROR_STOP on", "BEGIN ISOLATION LEVEL READ COMMITTED;", "SET LOCAL standard_conforming_strings = on;",
             "SET LOCAL lock_timeout = '10s';", "SET LOCAL statement_timeout = '120s';",
             f'SELECT pg_advisory_xact_lock({LOCK[0]}, {LOCK[1]});',
             'CREATE SCHEMA IF NOT EXISTS orcamento_app;',
             'CREATE TABLE IF NOT EXISTS orcamento_app._app_migration_history (version text PRIMARY KEY, filename text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());',
             f"DO $op08_history$ BEGIN IF EXISTS (SELECT 1 FROM orcamento_app._app_migration_history h LEFT JOIN (VALUES {values}) f(version,filename) ON f.version=h.version AND f.filename=h.filename WHERE f.version IS NULL) OR EXISTS (SELECT 1 FROM orcamento_app._app_migration_history GROUP BY version HAVING count(*)>1) THEN RAISE EXCEPTION 'Inconsistent migration history'; END IF; END $op08_history$;"]
    for v, name, sql, _ in files:
        lines.extend([f"SELECT EXISTS (SELECT 1 FROM orcamento_app._app_migration_history WHERE version='{v}') AS applied \\gset",
                      '\\if :applied', f'\\echo OP08_SKIP {name}', '\\else',
                      f'\\echo OP08_APPLY {name}', sql,
                      f"INSERT INTO orcamento_app._app_migration_history(version,filename) VALUES ('{v}','{name}');", '\\endif'])
    lines.extend(['COMMIT;', '\\echo OP08_COMMIT_CONFIRMED'])
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--migrations', default=str(Path(__file__).resolve().parents[1] / 'supabase/migrations'))
    parser.add_argument('--plan', action='store_true')
    parser.add_argument('--local-test', action='store_true')
    args = parser.parse_args()
    try:
        files = inventory(args.migrations)
        if args.plan:
            print(f'OP08_PLAN files={len(files)} wrapped={sum(f[3] for f in files)}')
            return 0
        env = connection_env(os.environ.get('SUPABASE_DB_URL', ''), os.environ.get('SUPABASE_PROJECT_ID', ''), args.local_test)
        proc = subprocess.run(['psql', '-X', '-q', '-w', '-v', 'ON_ERROR_STOP=1'],
                              input=batch(files), text=True, capture_output=True, env=env)
        # SQL output/error details may contain secrets or business data: emit only our progress.
        for line in proc.stdout.splitlines():
            if line.startswith(('OP08_SKIP ', 'OP08_APPLY ', 'OP08_COMMIT_CONFIRMED')):
                print(line)
        if proc.returncode or 'OP08_COMMIT_CONFIRMED' not in proc.stdout:
            print('OP08_UNCONFIRMED: inspect history by read-only access before any retry; no automatic retry.', file=sys.stderr)
            return 2
        return 0
    except (Invalid, OSError, UnicodeError):
        print('OP08_PREFLIGHT_OR_CONNECTION_FAILED: validate names, SQL format and target; credentials omitted.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
