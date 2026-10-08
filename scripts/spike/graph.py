"""Construye el grafo bipartito jugador <-> club-temporada a partir del dataset y calcula estadisticas."""
from common import *
from collections import defaultdict, deque
import statistics, random, sys

def build_edges(con, scope='all'):
    inl = ','.join("'%s'" % x for x in LEAGUES)
    club_filter = ''
    if scope == 'leagues':
        club_filter = f"and c.domestic_competition_id in ({inl})"
    sql = f"""
    with ev as (
      select l.player_id, l.club_id, g.season from game_lineups l join games g on g.game_id::int = l.game_id
      union
      select a.player_id, a.player_club_id, g.season from appearances a join games g on g.game_id::int = a.game_id
    )
    select distinct ev.player_id, ev.club_id, ev.season
    from ev join clubs c on c.club_id::int = ev.club_id
    where ev.club_id is not null {club_filter}
    """
    return con.execute(sql).fetchall()

def make_graph(edges):
    p2cs = defaultdict(set); cs2p = defaultdict(set)
    for p, c, s in edges:
        cs = (c, s)
        p2cs[p].add(cs); cs2p[cs].add(p)
    return p2cs, cs2p

def bfs(p2cs, cs2p, src, dst=None):
    dist = {('p', src): 0}; prev = {}
    dq = deque([('p', src)])
    while dq:
        node = dq.popleft(); d = dist[node]
        nxt = p2cs[node[1]] if node[0] == 'p' else cs2p[node[1]]
        for n in nxt:
            key = ('c', n) if node[0] == 'p' else ('p', n)
            if key not in dist:
                dist[key] = d + 1; prev[key] = node; dq.append(key)
                if dst is not None and key == ('p', dst):
                    return dist, prev
    return dist, prev

def components(p2cs, cs2p):
    seen = set(); sizes = []
    for p in p2cs:
        if ('p', p) in seen: continue
        dist, _ = bfs(p2cs, cs2p, p)
        seen.update(dist.keys()); sizes.append(sum(1 for k in dist if k[0] == 'p'))
    return sorted(sizes, reverse=True)

if __name__ == '__main__':
    scope = sys.argv[1] if len(sys.argv) > 1 else 'all'
    con = connect()
    edges = build_edges(con, scope)
    p2cs, cs2p = make_graph(edges)
    print(f'scope={scope} aristas={len(edges)} jugadores={len(p2cs)} club_temporadas={len(cs2p)}')
    pcs = [len(v) for v in p2cs.values()]; cps = [len(v) for v in cs2p.values()]
    print('club-temporadas por jugador: media %.1f mediana %d max %d' % (statistics.mean(pcs), statistics.median(pcs), max(pcs)))
    print('jugadores por club-temporada: media %.1f mediana %d min %d max %d' % (statistics.mean(cps), statistics.median(cps), min(cps), max(cps)))
    comps = components(p2cs, cs2p)
    print('componentes: %d ; mayor: %d jugadores (%.1f%%)' % (len(comps), comps[0], 100 * comps[0] / len(p2cs)), comps[:5])
