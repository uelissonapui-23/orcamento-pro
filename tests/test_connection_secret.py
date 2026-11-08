"""All values are fabricated; no inherited credential is read by these tests."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import socket
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import apply_migrations as runner
import validate_connection_secret as diagnostic

DIRECT = f'postgresql://postgres:SYNTHETIC-password@db.{runner.PROJECT}.supabase.co:5432/postgres'
POOLER = f'postgresql://postgres.{runner.PROJECT}:SYNTHETIC-password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'


class SecretDiagnosticTests(unittest.TestCase):
    def check(self, dsn, expected, code):
        out, err = io.StringIO(), io.StringIO()
        with patch.dict(os.environ, {'SUPABASE_DB_URL': dsn or ''}, clear=True), contextlib.redirect_stdout(out), contextlib.redirect_stderr(err), patch.object(subprocess, 'run', side_effect=AssertionError('No processes')) as process, patch.object(subprocess, 'Popen', side_effect=AssertionError('No processes')) as popen, patch.object(socket, 'create_connection', side_effect=AssertionError('No network')) as network, patch.object(socket.socket, 'connect', side_effect=AssertionError('No network')) as connect, patch.object(runner, 'main', side_effect=AssertionError('No executor')) as executor:
            self.assertEqual(diagnostic.main(), code)
        self.assertEqual(out.getvalue(), expected + '\n')
        self.assertEqual(err.getvalue(), '')
        for spy in [process, popen, network, connect, executor]:
            spy.assert_not_called()
        for sensitive in ['SYNTHETIC-password','db.' + runner.PROJECT, 'aws-0-sa-east-1', 'postgresql://', 'postgres.' + runner.PROJECT]:
            self.assertNotIn(sensitive, out.getvalue() + err.getvalue())

    def test_direct(self): self.check(DIRECT, 'COMPATÍVEL', 0)
    def test_pooler(self): self.check(POOLER, 'COMPATÍVEL', 0)
    def test_query_parameters(self): self.check(DIRECT + '?sslmode=require', 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1)
    def test_wrong_host(self): self.check(DIRECT.replace('.supabase.co', '.invalid'), 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1)
    def test_wrong_user(self): self.check(DIRECT.replace('postgres:', 'other:', 1), 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1)
    def test_wrong_database(self): self.check(DIRECT.replace('/postgres', '/other'), 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1)
    def test_wrong_port(self): self.check(DIRECT.replace(':5432/', ':9999/'), 'INCOMPATÍVEL: URI fora do contrato OP-08.', 1)
    def test_empty(self): self.check('', 'NÃO VERIFICÁVEL: secret ausente ou vazio.', 2)

    def test_missing(self):
        with patch.dict(os.environ, {}, clear=True), contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(diagnostic.main(), 2)
        self.assertEqual(out.getvalue(), 'NÃO VERIFICÁVEL: secret ausente ou vazio.\n')

    def test_unexpected_failure_is_sanitized(self):
        def failing(*args):
            print(DIRECT)
            print(DIRECT, file=sys.stderr)
            raise failure(DIRECT)
        for failure in [RuntimeError, SystemExit, KeyboardInterrupt]:
            with self.subTest(failure=failure.__name__), patch.object(runner, 'connection_env', side_effect=failing):
                self.check(DIRECT, 'NÃO VERIFICÁVEL: falha interna na validação.', 2)

    def test_reuses_production_contract_without_local_mode(self):
        with patch.object(runner, 'connection_env', wraps=runner.connection_env) as validate:
            self.check(DIRECT, 'COMPATÍVEL', 0)
        validate.assert_called_once_with(DIRECT, runner.PROJECT, False)

    def test_manual_workflow_boundary(self):
        s=(ROOT/'.github/workflows/validate-connection-secret.yml').read_text()
        events=s.split('on:\n',1)[1].split('permissions:',1)[0]
        self.assertEqual(events.strip(),'workflow_dispatch:')
        self.assertIn("github.ref == 'refs/heads/main'",s)
        self.assertIn("github.event_name == 'workflow_dispatch'",s)
        self.assertIn("github.repository == 'uelissonapui-23/orcamento-pro'",s)
        self.assertIn('ref: ${{ github.sha }}',s)
        self.assertIn('persist-credentials: false',s)
        self.assertNotIn('inputs:',s)
        self.assertNotIn('psql',s)
        self.assertNotIn('upload-artifact',s)
        self.assertEqual(s.count('secrets.SUPABASE_DB_URL'),1)
        qa=(ROOT/'.github/workflows/test-connection-secret.yml').read_text()
        self.assertNotIn('secrets.',qa)
        self.assertNotIn('SUPABASE_DB_URL',qa)


if __name__ == '__main__': unittest.main()
