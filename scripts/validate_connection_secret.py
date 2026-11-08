#!/usr/bin/env python3
"""Offline syntax diagnostic only. Never call the migration entrypoint."""
import contextlib
import io
import os


def diagnose(dsn):
    if not dsn:
        return 'NÃO VERIFICÁVEL: secret ausente ou vazio.', 2
    # Neither exception messages nor incidental Python diagnostics may reach logs.
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            from apply_migrations import PROJECT, Invalid, connection_env
            try:
                connection_env(dsn, PROJECT, False)
            except Invalid:
                return 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1
    except BaseException:
        return 'NÃO VERIFICÁVEL: falha interna na validação.', 2
    return 'COMPATÍVEL', 0


def main():
    result, code = diagnose(os.environ.get('SUPABASE_DB_URL'))
    print(result)
    return code


if __name__ == '__main__':
    raise SystemExit(main())
