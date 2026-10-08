import duckdb, os
DB = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'transfermarkt-datasets.duckdb')
LEAGUES = ['GB1','ES1','IT1','L1','FR1','ARG1','BRA1','PO1','NL1','MLS1']

def connect():
    return duckdb.connect(DB, read_only=True)

def show(con, sql):
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print(' | '.join(cols))
    for r in rows:
        print(' | '.join(str(x) for x in r))
    print()
