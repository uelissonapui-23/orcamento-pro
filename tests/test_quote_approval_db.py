"""Real PostgreSQL QA; synthetic auth.uid adapter, no Supabase Auth server.
Only a loopback op08_test database is accepted. Product SQL comes from Git.
"""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import unittest
from test_migration_runner import runner

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / 'supabase/migrations'
PATCH = MIG / '20261107210000_quote_save_editable_statuses.sql'
U = '00000000-0000-0000-0000-000000000001'
OUTSIDER = '00000000-0000-0000-0000-000000000002'
W = '10000000-0000-0000-0000-000000000001'
OTHER = '10000000-0000-0000-0000-000000000002'
C = '20000000-0000-0000-0000-000000000001'


def historical(prefix):
    return next(MIG.glob(prefix + '*.sql')).read_text()


def function(sql, name):
    return re.search(r'create or replace function orcamento_app\.' + name + r'\(.*?\$\$;', sql, re.S).group()


def literal(value):
    return "'" + json.dumps(value).replace("'", "''") + "'::jsonb"


@unittest.skipUnless(os.environ.get('OP01_TEST_DB_URL') and shutil.which('psql'), 'Requires disposable PostgreSQL')
class QuoteApprovalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = runner.connection_env(os.environ['OP01_TEST_DB_URL'], '', True)

    def sql(self, sql, ok=True, user=None):
        if user is not None:
            sql = f"SET ROLE authenticated; SET request.jwt.claim.sub='{user}';\n" + sql
        p = subprocess.run(['psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], input=sql, text=True, capture_output=True, env=self.env)
        self.assertEqual(p.returncode == 0, ok, p.stderr)
        return p.stdout.strip() if ok else p.stderr

    def setUp(self):
        self.sql("DROP SCHEMA IF EXISTS orcamento_app CASCADE; DROP SCHEMA IF EXISTS auth CASCADE; DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; END $$; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA auth TO authenticated;")
        self.sql(historical('20260808000100'))
        security = historical('20260808000200')
        self.sql(function(security, 'set_updated_at') + function(security, 'is_workspace_admin'))
        for prefix in ['20260808000400','20260808000500','20260808000800','20260808000900','20260808001000','20260808001100','20260813203000']:
            self.sql(historical(prefix))
        self.sql(PATCH.read_text())
        self.sql(f"GRANT USAGE ON SCHEMA orcamento_app TO authenticated; INSERT INTO auth.users VALUES('{U}'),('{OUTSIDER}'); INSERT INTO orcamento_app.workspaces(id,name,owner_user_id) VALUES('{W}','QA','{U}'),('{OTHER}','Other','{OUTSIDER}'); INSERT INTO orcamento_app.workspace_members(workspace_id,user_id) VALUES('{W}','{U}'),('{OTHER}','{OUTSIDER}'); INSERT INTO orcamento_app.clients(id,workspace_id,name) VALUES('{C}','{W}','Synthetic');")

    def payload(self, status='draft'):
        return dict(status=status, client_id=C, issue_date='2026-11-07', valid_until='2026-12-07', expected_delivery_date='2026-11-10')

    def save(self, status='draft', quote=None, items=None, ok=True, user=U, workspace=W):
        items = items if items is not None else [dict(description='Synthetic item', quantity=1, unit_price=10, total_price=10)]
        items = [dict(calculation_mode='manual', **item) for item in items]
        return self.sql(f"SELECT orcamento_app.save_quote_with_items('{workspace}',{repr(quote) if quote else 'NULL'},{literal(self.payload(status))},{literal(items)});", ok=ok, user=user)

    def approve(self, quote, ok=True, user=U, workspace=W):
        return self.sql(f"SELECT orcamento_app.approve_quote_and_create_work_order('{workspace}','{quote}');",ok=ok,user=user)

    def snapshot(self, quote):
        return self.sql(f"SELECT row_to_json(q)::text FROM orcamento_app.quotes q WHERE id='{quote}'; SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.sort_order),'[]') FROM orcamento_app.quote_items i WHERE quote_id='{quote}';")

    def test_draft_creation_and_items(self):
        q=self.save(); self.assertEqual(self.sql(f"SELECT status||':'||total FROM orcamento_app.quotes WHERE id='{q}';"),'draft:10.00')
        self.assertEqual(self.sql(f"SELECT description FROM orcamento_app.quote_items WHERE quote_id='{q}';"),'Synthetic item')

    def test_edit_and_awaiting_response(self):
        q=self.save(); self.save('awaiting_response',q,[dict(description='Edited',total_price=20)])
        self.assertEqual(self.sql(f"SELECT status||':'||total FROM orcamento_app.quotes WHERE id='{q}';"),'awaiting_response:20.00')
        self.assertEqual(self.sql(f"SELECT count(*) FROM orcamento_app.quote_items WHERE quote_id='{q}';"),'1')

    def test_reject_reserved_creation(self):
        for status in ['approved','cancelled']:
            self.assertIn('dedicated workflow',self.save(status,ok=False))
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.quotes;'),'0')
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.quote_items;'),'0')

    def test_reject_reserved_edit_preserves_everything(self):
        q=self.save(); before=self.snapshot(q)
        for status in ['approved','cancelled']:
            self.save(status,q,ok=False); self.assertEqual(self.snapshot(q),before)

    def test_item_failure_rolls_back_create(self):
        self.save(items=[dict(description='valid',total_price=10),dict(description='',total_price=20)],ok=False)
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.quotes;'),'0')
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.quote_items;'),'0')

    def test_item_failure_rolls_back_edit(self):
        q=self.save(); before=self.snapshot(q)
        self.save('awaiting_response',q,[dict(description='',total_price=20)],ok=False)
        self.assertEqual(self.snapshot(q),before)

    def test_approval_creates_order_and_is_idempotent(self):
        q=self.save('awaiting_response'); order=self.approve(q); self.assertEqual(self.approve(q),order)
        self.assertEqual(self.sql(f"SELECT status FROM orcamento_app.quotes WHERE id='{q}';"),'approved')
        self.assertEqual(self.sql(f"SELECT count(*) FROM orcamento_app.work_orders WHERE quote_id='{q}' AND workspace_id='{W}';"),'1')
        self.assertEqual(self.sql(f"SELECT total||':'||jsonb_array_length(items_snapshot_json) FROM orcamento_app.work_orders WHERE id='{order}';"),'10.00:1')

    def test_official_approval_failure_rolls_back_order(self):
        q=self.save('awaiting_response'); before=self.snapshot(q)
        self.sql("CREATE FUNCTION orcamento_app.qa_fail_approval() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='approved' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER qa_fail BEFORE UPDATE ON orcamento_app.quotes FOR EACH ROW EXECUTE FUNCTION orcamento_app.qa_fail_approval();")
        self.approve(q,False); self.assertEqual(self.snapshot(q),before)
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.work_orders;'),'0')

    def test_unauthorized_user(self):
        q=self.save('awaiting_response'); before=self.snapshot(q)
        self.save(quote=q,ok=False,user=OUTSIDER); self.approve(q,False,user=OUTSIDER)
        self.assertEqual(self.snapshot(q),before)

    def test_missing_auth(self):
        self.save(ok=False,user='')

    def test_cross_workspace(self):
        q=self.save('awaiting_response'); self.approve(q,False,user=OUTSIDER,workspace=OTHER)
        self.save(quote=q,workspace=OTHER,user=OUTSIDER,ok=False)

    def test_final_records_stay_locked(self):
        q=self.save('awaiting_response'); self.approve(q); before=self.snapshot(q)
        self.save(quote=q,ok=False); self.assertEqual(self.snapshot(q),before)

    def test_cancel_and_reopen_dedicated(self):
        q=self.save(); self.sql(f"SELECT orcamento_app.cancel_quote('{W}','{q}','synthetic');",user=U)
        self.assertEqual(self.sql(f"SELECT status FROM orcamento_app.quotes WHERE id='{q}';"),'cancelled')
        self.sql(f"SELECT orcamento_app.reopen_quote('{W}','{q}');",user=U); self.save(quote=q)

    def test_draft_cannot_use_approval(self):
        q=self.save(); self.approve(q,False)
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.work_orders;'),'0')

    def test_direct_table_write_denied(self):
        q=self.save(); self.sql(f"UPDATE orcamento_app.quotes SET status='approved' WHERE id='{q}';",ok=False,user=U)

    def test_existing_inconsistent_record_not_repaired(self):
        q=self.save('awaiting_response'); self.sql(f"UPDATE orcamento_app.quotes SET status='approved' WHERE id='{q}';")
        self.assertIn('missing its work order',self.approve(q,False))
        self.assertEqual(self.sql('SELECT count(*) FROM orcamento_app.work_orders;'),'0')


if __name__ == '__main__':
    unittest.main()
