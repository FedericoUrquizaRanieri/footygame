from graph import *
con = connect()
edges = build_edges(con, 'all'); p2cs, cs2p = make_graph(edges)
names = dict(con.execute("select player_id, name from players").fetchall())
clubs = dict(con.execute("select club_id::int, name from clubs").fetchall())
def find(n):
    return con.execute("select player_id, name, highest_market_value_in_eur from players where name ilike ? order by highest_market_value_in_eur desc nulls last limit 3", [n]).fetchall()
def career(pid):
    return sorted([(s, clubs.get(c, c)) for c, s in p2cs.get(pid, [])])
def label(k): return (names.get(k[1]) if k[0]=='p' else f"{clubs.get(k[1][0],k[1][0])} {k[1][1]}")
for n in ['Lionel Messi','Ángel Di María','Enzo Copetti','Julián Álvarez']:
    r = find(n); print(n, r)
ids = {n: find(n)[0][0] for n in ['Lionel Messi','Enzo Copetti']}
print('\nCarrera Messi:', career(ids['Lionel Messi']))
print('Carrera Copetti:', career(ids['Enzo Copetti']))
d, prev = bfs(p2cs, cs2p, ids['Lionel Messi'], ids['Enzo Copetti'])
k = ('p', ids['Enzo Copetti'])
if k in d:
    path = [k]
    while path[-1] in prev: path.append(prev[path[-1]])
    print('\nCamino mínimo Messi->Copetti (%d saltos):' % d[k], ' -> '.join(label(x) for x in reversed(path)))
else: print('\nSin camino Messi->Copetti')
# distribución de caminos entre top jugadores
top = [r[0] for r in con.execute("select player_id from players where highest_market_value_in_eur is not null order by highest_market_value_in_eur desc limit 1500").fetchall() if r[0] in p2cs]
random.seed(1); hist = defaultdict(int); N = 400
for _ in range(N):
    a, b = random.sample(top, 2)
    d, _ = bfs(p2cs, cs2p, a, b); hist[d.get(('p', b), -1)] += 1
print('\nDistribución de saltos mínimos entre pares al azar del top-1500 (n=%d):' % N, dict(sorted(hist.items())))
