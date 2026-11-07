import contextlib
import importlib.util
import io
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('runner', ROOT / 'scripts/apply_migrations.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class PreflightTests(unittest.TestCase):
    def test_historical_files(self):
        files = runner.inventory(ROOT / 'supabase/migrations')
        self.assertEqual(len(files), 21)
        self.assertEqual(sum(f[3] for f in files), 19)

    def test_wrapped_and_plain_preserve_bodies(self):
        body = "\nCREATE FUNCTION f() RETURNS text LANGUAGE sql AS $$SELECT 'BEGIN; COMMIT;';$$;\n"
        self.assertEqual(runner.normalize('BEGIN;' + body + 'COMMIT;'), (body, True))
        self.assertEqual(runner.normalize(body), (body, False))
        crlf = body.replace('\n', '\r\n')
        self.assertEqual(runner.normalize('BEGIN;' + crlf + 'COMMIT;'), (crlf, True))
        self.assertIn('-- commit;', runner.normalize('-- commit;\nBEGIN;\nSELECT 1;\nCOMMIT;')[0])

    def test_reject_ambiguous_or_nontransactional(self):
        for sql in ['BEGIN; SELECT 1;', 'SELECT 1; COMMIT;', 'BEGIN; COMMIT; SELECT 1;',
                    'BEGIN; SELECT 1; COMMIT; BEGIN; SELECT 2; COMMIT;',
                    'CREATE INDEX CONCURRENTLY i ON t(a);', 'VACUUM;',
                    'SELECT 1; \\connect other', "SELECT 'unterminated", '/* no end',
                    'SELECT 1', 'SET ROLE postgres;', 'CREATE DATABASE other;', 'SELECT 1;\x00']:
            with self.subTest(sql=sql), self.assertRaises(runner.Invalid):
                runner.normalize(sql)

    def test_duplicate_versions_and_bad_names(self):
        with tempfile.TemporaryDirectory() as d:
            for name in ['20261106000001_a.sql', '20261106000001_b.sql']:
                Path(d, name).write_text('SELECT 1;')
            with self.assertRaises(runner.Invalid):
                runner.inventory(d)
            Path(d, '20261106000001_b.sql').unlink()
            Path(d, 'bad.sql').write_text('SELECT 1;')
            with self.assertRaises(runner.Invalid):
                runner.inventory(d)

    def test_target_validation(self):
        good = f'postgresql://postgres:synthetic@db.{runner.PROJECT}.supabase.co/postgres'
        env = runner.connection_env(good, runner.PROJECT, False)
        self.assertEqual(env['PGSSLMODE'], 'require')
        for uri, project, local in [
            (good, 'wrong', False),
            (good.replace('.supabase.co', '.supabase.co.evil.invalid'), runner.PROJECT, False),
            (good, runner.PROJECT, True),
            ('postgresql://postgres@127.0.0.1/production', '', True),
            (good + '?options=malicious', runner.PROJECT, False),
        ]:
            with self.assertRaises(runner.Invalid):
                runner.connection_env(uri, project, local)

    def test_uncertain_outcome_never_retries_or_prints_secret(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, '20261106000001_test.sql').write_text('SELECT 1;')
            proc = subprocess.CompletedProcess([], 2, 'OP08_APPLY synthetic.sql\n', 'secret-password')
            output = io.StringIO()
            with patch.dict(os.environ, {'SUPABASE_DB_URL': 'postgresql://postgres:secret-password@localhost/op08_test'}), patch.object(runner.subprocess, 'run', return_value=proc) as run, patch('sys.argv', ['runner', '--migrations', d, '--local-test']), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                self.assertEqual(runner.main(), 2)
            run.assert_called_once()
            self.assertNotIn('secret-password', output.getvalue())
            self.assertIn('OP08_UNCONFIRMED', output.getvalue())


@unittest.skipUnless(os.environ.get('OP08_TEST_DB_URL') and shutil.which('psql'), 'Requires disposable PostgreSQL and psql')
class PostgreSQLTests(unittest.TestCase):
    def setUp(self):
        self.dsn = os.environ['OP08_TEST_DB_URL']
        self.env = runner.connection_env(self.dsn, '', True)
        self.sql('DROP SCHEMA IF EXISTS orcamento_app CASCADE;')
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def tearDown(self):
        self.sql('DROP SCHEMA IF EXISTS orcamento_app CASCADE;')

    def sql(self, sql):
        p = subprocess.run(['psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], input=sql, text=True, capture_output=True, env=self.env)
        self.assertEqual(p.returncode, 0, p.stderr)
        return p.stdout.strip()

    def migration(self, n, sql):
        Path(self.tmp.name, f'202611060000{n:02d}_test.sql').write_text(sql)

    def start(self, env=None):
        e = dict(os.environ, SUPABASE_DB_URL=self.dsn)
        e.update(env or {})
        return subprocess.Popen(['python3', str(ROOT / 'scripts/apply_migrations.py'), '--local-test', '--migrations', self.tmp.name], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=e)

    def finish(self, p, success=True):
        out, err = p.communicate(timeout=30)
        self.assertEqual(p.returncode == 0, success, out + err)
        return out, err

    def absent(self):
        self.assertEqual(self.sql("SELECT to_regclass('orcamento_app.test');"), '')

    def test_atomic_apply_register_and_repeat(self):
        self.migration(1, 'BEGIN; CREATE TABLE orcamento_app.test(a int); INSERT INTO orcamento_app.test VALUES(1); COMMIT;')
        self.finish(self.start())
        self.finish(self.start())
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.test;'), '1')
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app._app_migration_history;'), '1')

    def test_sql_error_rolls_back(self):
        self.migration(1, 'CREATE TABLE orcamento_app.test(a int); SELECT 1/0;')
        self.finish(self.start(), False)
        self.absent()
        self.assertEqual(self.sql("SELECT to_regclass('orcamento_app._app_migration_history');"), '')

    def test_second_file_rolls_back_batch(self):
        self.migration(1, 'CREATE TABLE orcamento_app.test(a int);')
        self.migration(2, 'SELECT 1/0;')
        self.finish(self.start(), False)
        self.absent()
        self.assertEqual(self.sql("SELECT to_regclass('orcamento_app._app_migration_history');"), '')

    def test_registration_failure_rolls_back(self):
        self.migration(1, "CREATE TABLE orcamento_app.test(a int); CREATE FUNCTION orcamento_app.fail_history() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic'; END;$$; CREATE TRIGGER fail_history BEFORE INSERT ON orcamento_app._app_migration_history FOR EACH ROW EXECUTE FUNCTION orcamento_app.fail_history();")
        self.finish(self.start(), False)
        self.absent()
        self.assertEqual(self.sql("SELECT to_regclass('orcamento_app._app_migration_history');"), '')

    def test_concurrent_executors_apply_once(self):
        self.migration(1, 'SELECT pg_sleep(1); CREATE TABLE orcamento_app.test(a int); INSERT INTO orcamento_app.test VALUES(1);')
        a, b = self.start(), self.start()
        out_a, _ = self.finish(a)
        out_b, _ = self.finish(b)
        self.assertEqual((out_a + out_b).count('OP08_APPLY '), 1)
        self.assertEqual((out_a + out_b).count('OP08_SKIP '), 1)
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.test;'), '1')
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app._app_migration_history;'), '1')

    def test_unrelated_objects_are_preserved(self):
        self.sql('CREATE SCHEMA op08_sentinel; CREATE TABLE op08_sentinel.keep(value int); INSERT INTO op08_sentinel.keep VALUES(7);')
        self.addCleanup(self.sql, 'DROP SCHEMA op08_sentinel CASCADE;')
        self.migration(1, 'CREATE TABLE orcamento_app.test(a int);')
        self.finish(self.start())
        self.assertEqual(self.sql('SELECT value FROM op08_sentinel.keep;'), '7')

    def test_inconsistent_history(self):
        self.migration(1, 'CREATE TABLE orcamento_app.test(a int);')
        self.sql("CREATE SCHEMA orcamento_app; CREATE TABLE orcamento_app._app_migration_history(version text primary key, filename text not null, applied_at timestamptz default now()); INSERT INTO orcamento_app._app_migration_history VALUES('20261106000001','renamed.sql',now());")
        self.finish(self.start(), False)
        self.absent()

    def test_connection_failure(self):
        self.migration(1, 'SELECT 1;')
        self.finish(self.start({'SUPABASE_DB_URL': 'postgresql://postgres@127.0.0.1:1/op08_test'}), False)

    def test_commit_happened_but_ack_is_lost(self):
        self.migration(1, 'CREATE TABLE orcamento_app.test(a int); INSERT INTO orcamento_app.test VALUES(1);')
        real = shutil.which('psql')
        with tempfile.TemporaryDirectory() as d:
            proxy = Path(d, 'psql')
            proxy.write_text('#!/usr/bin/env python3\nimport subprocess,sys\np=subprocess.run(' + repr([real, '-X', '-q', '-w', '-v', 'ON_ERROR_STOP=1']) + ',input=sys.stdin.read(),text=True,capture_output=True)\nsys.stdout.write(p.stdout.replace("OP08_COMMIT_CONFIRMED", ""))\nsys.exit(2)\n')
            proxy.chmod(0o700)
            out, err = self.finish(self.start({'PATH': d + os.pathsep + os.environ['PATH']}), False)
        self.assertIn('OP08_UNCONFIRMED', err)
        self.assertEqual(out.count('OP08_APPLY '), 1)
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.test;'), '1')
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app._app_migration_history;'), '1')


if __name__ == '__main__':
    unittest.main()
