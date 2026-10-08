"""Valida si la tabla transfers permite inferir club-temporadas, comparando contra las aristas derivadas de partidos."""
from graph import *
from datetime import date, timedelta
con = connect()
game_edges = set(build_edges(con, 'all'))
def season(d):
    return d.year if d.month >= 7 else d.year - 1
rows = con.execute("""select player_id, transfer_date, from_club_id, to_club_id from transfers
  where transfer_date is not null order by player_id, transfer_date""").fetchall()
clubs = set(r[0] for r in con.execute("select club_id::int from clubs").fetchall())
by_p = defaultdict(list)
for p, d, f, t in rows: by_p[p].append((d, f, t))
CAP = 2025
inferred = set()
for p, lst in by_p.items():
    for i, (d, f, t) in enumerate(lst):
        start = season(d + timedelta(days=60))
        if i + 1 < len(lst):
            end = season(lst[i+1][0] - timedelta(days=60))
        else:
            end = CAP
        for s in range(start, min(end, CAP) + 1):
            if t in clubs: inferred.add((p, t, str(s)))
# comparar en temporadas/ clubes donde hay datos de partidos completos (ligas con cobertura 2012-2025)
full = set(r[0] for r in con.execute(f"select club_id::int from clubs where domestic_competition_id in ('GB1','ES1','IT1','L1','FR1','PO1','NL1')").fetchall())
ge = {e for e in game_edges if e[1] in full and 2012 <= int(e[2]) <= 2024}
ie = {e for e in inferred if e[1] in full and 2012 <= int(e[2]) <= 2024}
tp = len(ge & ie)
print(f'aristas por partidos={len(ge)} inferidas por transfers={len(ie)} coinciden={tp}')
print(f'recall (partidos encontrados por transfers)={tp/len(ge):.1%}  precision (transfers confirmadas por partidos)={tp/len(ie):.1%}')
# aporte potencial: aristas inferidas en ligas/temporadas sin datos de partidos
arg = set(r[0] for r in con.execute("select club_id::int from clubs where domestic_competition_id in ('ARG1','BRA1','MLS1')").fetchall())
extra = {e for e in inferred if e not in game_edges}
print('aristas extra inferidas (no estan en partidos):', len(extra), ' de las cuales en clubes ARG/BRA/MLS:', len([e for e in extra if e[1] in arg]))
print('antes de 2012:', len([e for e in extra if int(e[2]) < 2012]))
