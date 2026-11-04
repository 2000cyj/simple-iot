#!/usr/bin/env python3
"""
校验 doc/sql/init.sql 中的表与 iot-server 实体类 (@TableName) 是否一一对应。

用法:
    python scripts/verify_schema.py [sql文件路径]

输出:
    - 表数量对比 (实体数 vs SQL 表数)
    - 表名级别: 实体缺表 / SQL 多表
    - 列级别: 实体字段在表中缺失 / 表中多余列
"""
import re
import sys
import glob
import os

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITY_DIR = os.path.join(ROOT, 'iot-server/src/main/java/com/github/dingdaoyi/entity')
BASE_FIELDS = {'create_time', 'update_time'}   # BaseEntity 继承字段


def snake(name: str) -> str:
    """camelCase -> snake_case, 与 MyBatis-Plus 默认映射一致"""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def parse_entities():
    """返回 {表名: {'entity': 文件名, 'cols': set(列名)}}

    只统计顶层实体类的字段: 嵌套静态类(RuleChain.RuleNode 等)的字段不是表列,
    static 常量也不是。BaseEntity 的 create_time/update_time 仅在实体真正
    extends BaseEntity 时才算数。
    """
    tables = {}
    for path in sorted(glob.glob(os.path.join(ENTITY_DIR, '*.java'))):
        src = open(path, encoding='utf-8').read()
        m = re.search(r'@TableName\s*\(\s*(?:value\s*=\s*)?"([^"]+)"', src)
        if not m:
            continue
        table = m.group(1)

        # 顶层类声明, 取得类体范围
        cm = re.search(r'\b(?:public\s+)?class\s+\w+[^{]*\{', src)
        if not cm:
            continue
        body_start = cm.end()

        cols = set(BASE_FIELDS) if 'extends BaseEntity' in src else set()

        for fm in re.finditer(
            r'((?:(?:@[\w.]+(?:\([^)]*\))?|//[^\n]*|/\*.*?\*/)\s*)*)'
            r'(private|protected|public)\s+(?!static)'
            r'([^;={}]+?)\s+(\w+)\s*(?:=|;)',
            src,
        ):
            if fm.start() < body_start:
                continue
            # 花括号深度: 顶层类体内部深度为 0, 嵌套类为 >=1
            depth = src[body_start:fm.start()].count('{') - src[body_start:fm.start()].count('}')
            if depth != 0:
                continue

            ann, field = fm.group(1) or '', fm.group(4)
            # 只认 @TableId / @TableField 上的列名, 其余注解(@Schema 等)忽略
            tm = re.search(r'@Table(?:Id|Field)\s*\(([^)]*)\)', ann)
            if tm:
                args = tm.group(1)
                if 'exist = false' in args or 'exist=false' in args:
                    continue
                vm = re.search(r'value\s*=\s*"((?:[^"\\]|\\.)*)"', args)
                if vm:
                    # 兼容 @TableField(value = "\"name\"") 这种带转义引号的写法
                    col = vm.group(1).replace('\\', '').strip('"')
                else:
                    sm = re.search(r'@Table(?:Id|Field)\s*\(\s*"([^"]+)"', ann)
                    col = sm.group(1) if sm else snake(field)
            else:
                col = snake(field)
            cols.add(col)

        tables[table] = {'entity': os.path.basename(path), 'cols': cols}
    return tables


def parse_sql(path):
    """返回 {表名: set(列名)}，只解析 CREATE TABLE"""
    src = open(path, encoding='utf-8').read()
    tables = {}
    for m in re.finditer(
        r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?'
        r'(?:"?public"?\."?)?(\w+)"?\s*\((.*?)\n\)\s*;',
        src,
        re.S | re.I,
    ):
        name, body = m.group(1).lower(), m.group(2)
        cols = set()
        for line in body.split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            cm = re.match(r'"?(\w+)"?\s+\S', line)
            if cm:
                cols.add(cm.group(1).lower())
        tables[name] = cols
    return tables


def main():
    sql_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'doc/sql/init.sql')
    ents = parse_entities()
    sqls = parse_sql(sql_path)

    ent_names = set(ents)
    sql_names = set(sqls)

    print(f'实体类表数: {len(ent_names)}    {os.path.basename(sql_path)} 表数: {len(sql_names)}')
    print()

    missing = sorted(ent_names - sql_names)
    extra = sorted(sql_names - ent_names)

    print(f'=== 表名级别 ===')
    if missing:
        print(f'实体引用但 SQL 缺失 ({len(missing)}):')
        for t in missing:
            print(f'  - {t:32} <- {ents[t]["entity"]}')
    else:
        print('  所有实体表在 SQL 中均已建表')

    if extra:
        print(f'SQL 有但无实体引用 ({len(extra)}):')
        for t in extra:
            print(f'  - {t}')
    else:
        print('  SQL 无多余表')
    print()

    print('=== 列级别 ===')
    problems = 0
    for t in sorted(ent_names & sql_names):
        ec, sc = ents[t]['cols'], sqls[t]
        lack = sorted(ec - sc)
        extra_c = sorted(sc - ec)
        if lack or extra_c:
            problems += 1
            print(f'  {t} ({ents[t]["entity"]})')
            if lack:
                print(f'      实体有表中无: {", ".join(lack)}')
            if extra_c:
                print(f'      表中有实体无: {", ".join(extra_c)}')
    if problems == 0:
        print('  所有匹配表的列完全一致')
    print()

    ok = not missing and not extra and problems == 0
    print('结果: ' + ('✅ 通过 —— 表与实体一一对应，列级一致' if ok else '❌ 不一致'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
