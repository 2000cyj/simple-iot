# Database migrations

For fresh installs use `doc/sql/init.sql` (it contains the full latest schema —
all 35 tables, verified against the entity classes).

For existing installs running an older version, apply the files in this
directory **in filename order** to upgrade. Each file is idempotent
(`IF NOT EXISTS` guards), so re-running a migration is safe.

```bash
# example: apply against a running compose stack
docker compose exec -T postgres \
  psql -U postgres -d simple < doc/sql/migrations/20260622_001_push_config_hmac.sql
```

## Index

| Date       | File                                       | Description                            |
|------------|--------------------------------------------|----------------------------------------|
| 2026-06-22 | `20260622_001_push_config_hmac.sql`        | Add HMAC signing columns to push cfg.  |
| 2026-07-09 | `20260709_001_push_log.sql`                | Add `tb_push_log` (push delivery log). |
| 2026-07-14 | `20260714_001_device_group_tag.sql`        | Add `tb_device_group` / `tb_device_tag` + relations. |
| 2026-07-14 | `20260714_002_alarm_comment.sql`           | Add `tb_alarm_comment` (comments / acknowledge). |
| 2026-07-14 | `20260714_003_rule_execution_log.sql`      | Add `tb_rule_execution_log` (rule chain v2). |
| 2026-07-15 | `20260715_001_dashboard.sql`               | Add `tb_dashboard` (custom dashboards). |
| 2026-07-15 | `20260715_002_ota_firmware.sql`            | Add `tb_firmware` / `tb_ota_task`. |
| 2026-07-15 | `20260715_003_modbus.sql`                  | Add `tb_modbus_config` (Modbus TCP driver). |
| 2026-07-20 | `20260720_001_webhook_ingress.sql`         | Add `tb_webhook_ingress` (signed HTTP ingress). |
| 2026-07-22 | `20260722_001_auth_hardening.sql`          | Add `tb_user.force_change_pwd` + admin password reset. |
| 2026-07-22 | `20260722_002_device_shadow.sql`           | Add `tb_device_shadow` (desired / reported state). |
| 2026-07-22 | `20260722_003_audit_log.sql`               | Add `tb_audit_log` (operation audit trail). |
| 2026-07-23 | `20260723_001_sprint3_im_push_device_topology.sql` | Add `tb_im_push_config` + `tb_device.parent_id`. |
| 2026-08-03 | `V20260803__opcua_config.sql`              | Add `tb_opcua_config` (OPC UA / Eclipse Milo). |

## Naming convention

`YYYYMMDD_NNN_description.sql` — the sequence number orders same-day migrations.

> `V20260803__opcua_config.sql` predates this convention (Flyway-style
> `V<date>__<name>.sql`). It is kept as-is so existing deployments that
> already applied it do not re-run it. New migrations should follow the
> `YYYYMMDD_NNN_` form.

## Verification

Two zero-dependency checkers keep `init.sql` and the entity classes in sync:

```bash
python scripts/verify_schema.py   # 表/列 与 @TableName 实体类一一对应
python scripts/verify_sql.py      # 括号配平 / 幂等性 / 引用完整性 / INSERT 列存在
```

Run both after adding an entity class or changing a migration.
