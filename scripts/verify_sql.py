#!/usr/bin/env python3
"""
init.sql 静态校验器 (零依赖)。

检查项:
  1. 括号配平 / 语句可切分
  2. 幂等性: CREATE TABLE / CREATE INDEX / ALTER..ADD COLUMN 是否可重复执行
  3. 引用完整性: 索引/约束/外键指向的表是否存在
  4. 每张表是否有主键
  5. INSERT 语句的列名是否存在于目标表  <- 能抓出 like(parentid -> parent_id) 这类漂移

用法:
    python scripts/verify_sql.py [sql文件路径]
"""
import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def strip_noise(sql: str) -> str:
    """去掉注释与字符串字面量, 保留结构 (字符串替换为等长空格以免错位)"""
    out = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if c == '-' and i + 1 < n and sql[i + 1] == '-':
            j = sql.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i))
            i = j
        elif c == '/' and i + 1 < n and sql[i + 1] == '*':
            j = sql.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(' ' * (j - i))
            i = j
        elif c == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'":
                    if j + 1 < n and sql[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            j = min(j + 1, n)
            out.append(' ' * (j - i))
            i = j
        else:
            out.append(c)
            i += 1
    return ''.join(out)


def split_statements(sql: str):
    """按顶层分号切分, 返回 [(起始行号, 语句文本)]"""
    stmts = []
    buf = []
    line = 1
    start_line = 1
    in_dollar = False
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if c == '\n':
            line += 1
        if sql.startswith('$$', i):
            in_dollar = not in_dollar
            buf.append('  ')
            i += 2
            continue
        if c == ';' and not in_dollar:
            stmts.append((start_line, ''.join(buf)))
            buf = []
            start_line = line
            i += 1
            continue
        buf.append(c)
        i += 1
    if ''.join(buf).strip():
        stmts.append((start_line, ''.join(buf)))
    return stmts


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'doc/sql/init.sql')
    raw = open(path, encoding='utf-8').read()
    clean = strip_noise(raw)
    errors = []
    warnings = []

    # 1. 括号配平
    depth = 0
    for ln, line in enumerate(clean.split('\n'), 1):
        d = line.count('(') - line.count(')')
        depth += d
        if depth < 0:
            errors.append(f'第 {ln} 行: 右括号多余')
            depth = 0
    if depth != 0:
        errors.append(f'文件结束时括号未配平, 剩余 {depth} 个左括号')

    stmts = split_statements(clean)

    # 收集表定义
    created = {}      # 表名 -> (行号, 是否有 IF NOT EXISTS)
    dropped = set()
    for ln, st in stmts:
        s = st.strip()
        if not s:
            continue
        m = re.match(r'DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:"?public"?\."?)?(\w+)"?', s, re.I)
        if m:
            dropped.add(m.group(1).lower())
        m = re.match(r'CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?:"?public"?\."?)?(\w+)"?', s, re.I)
        if m:
            created[m.group(2).lower()] = (ln, bool(m.group(1)))

    # 2. 幂等性
    for ln, st in stmts:
        s = ' '.join(st.strip().split())
        if not s:
            continue
        m = re.match(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?public"?\."?)?(\w+)"?', s, re.I)
        if m:
            name = m.group(1).lower()
            if not created.get(name, (0, False))[1] and name not in dropped:
                errors.append(f'第 {ln} 行: CREATE TABLE {name} 既无 IF NOT EXISTS 也无 DROP, 重复执行会报错')
        if re.match(r'CREATE\s+(UNIQUE\s+)?INDEX\s+', s, re.I) and not re.match(
                r'CREATE\s+(UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+', s, re.I):
            # 目标表若每次都被 DROP 重建, 索引会随之消失, 无需 IF NOT EXISTS
            im = re.search(r'\bON\s+(?:"?public"?\."?)?(\w+)"?', s, re.I)
            target = im.group(1).lower() if im else None
            if target and target not in dropped:
                errors.append(f'第 {ln} 行: CREATE INDEX {target} 缺少 IF NOT EXISTS, '
                              f'该表不重建, 重复执行会报错')
        if re.match(r'ALTER\s+TABLE\s+.*ADD\s+COLUMN', s, re.I) and not re.search(
                r'ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS', s, re.I):
            errors.append(f'第 {ln} 行: ALTER TABLE ADD COLUMN 缺少 IF NOT EXISTS')
        if re.match(r'ALTER\s+SEQUENCE', s, re.I):
            warnings.append(f'第 {ln} 行: ALTER SEQUENCE (重复执行会因已存在而报错, 但 init.sql 对序列均先 DROP)')

    # 3. 引用完整性: 索引 / 约束 / 外键引用的表
    #    \bON 防止 json / description 这类以 "on" 结尾的词被误判
    KEYWORDS = {'column', 'table', 'constraint', 'sequence', 'schema', 'index',
                'delete', 'update', 'action', 'no', 'cascade', 'restrict', 'set'}
    for ln, st in stmts:
        s = ' '.join(st.strip().split())
        for m in re.finditer(
                r'(?:\bON\s+(?:"?public"?\."?)?(\w+)"?|REFERENCES\s+(?:"?public"?\."?)?(\w+)"?)',
                s, re.I):
            t = (m.group(1) or m.group(2))
            if not t:
                continue
            if m.group(1) and t.lower() in KEYWORDS:
                continue          # COMMENT ON COLUMN / ON DELETE CASCADE 等
            if t.lower() not in created:
                errors.append(f'第 {ln} 行: 引用了未定义的表 {t}')

    # 4. 每表主键
    pk_tables = set()
    for ln, st in stmts:
        s = ' '.join(st.strip().split())
        m = re.match(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?public"?\."?)?(\w+)"?\s*\((.*)\)\s*$',
                     s, re.I | re.S)
        if m and re.search(r'\bPRIMARY\s+KEY\b', m.group(2), re.I):
            pk_tables.add(m.group(1).lower())
        m = re.search(r'ALTER\s+TABLE\s+(?:"?public"?\."?)?(\w+)"?\s+ADD\s+CONSTRAINT.*PRIMARY\s+KEY',
                      s, re.I)
        if m:
            pk_tables.add(m.group(1).lower())
    for t in sorted(created):
        if t not in pk_tables:
            warnings.append(f'表 {t} 未定义主键')

    # 5. INSERT 列名必须存在于目标表
    cols_of = {}
    for ln, st in stmts:
        s = st.strip()
        m = re.match(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?public"?\."?)?(\w+)"?\s*\((.*?)\n\)\s*;?\s*$',
                     s, re.I | re.S)
        if not m:
            continue
        cols = set()
        for line in m.group(2).split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            cm = re.match(r'"?(\w+)"?\s+\S', line)
            if cm:
                cols.add(cm.group(1).lower())
        cols_of[m.group(1).lower()] = cols

    for ln, st in stmts:
        s = ' '.join(st.strip().split())
        m = re.match(r'INSERT\s+INTO\s+(?:"?public"?\."?)?(\w+)"?\s*\(([^)]*)\)', s, re.I)
        if not m:
            continue
        table = m.group(1).lower()
        if table not in cols_of:
            continue
        named = [c.strip().strip('"').lower() for c in m.group(2).split(',')]
        missing = [c for c in named if c and c not in cols_of[table]]
        if missing:
            errors.append(f'第 {ln} 行: INSERT INTO {table} 的列 {missing} 在建表语句中不存在')

    # 输出
    print(f'文件: {os.path.relpath(path, ROOT)}   语句数: {len(stmts)}   表数: {len(created)}')
    print()
    print(f'=== 错误 ({len(errors)}) ===')
    for e in errors:
        print(f'  ✗ {e}')
    if not errors:
        print('  无')
    print()
    print(f'=== 提示 ({len(warnings)}) ===')
    for w in warnings:
        print(f'  ! {w}')
    if not warnings:
        print('  无')
    print()
    print('结果: ' + ('✅ 通过' if not errors else '❌ 存在错误'))
    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main())
