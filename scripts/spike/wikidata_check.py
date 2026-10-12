"""Convierte los tramos P54 de Wikidata en aristas (jugador, club, temporada) y las compara contra las derivadas de partidos."""
from graph import *
from wikidata_fetch import OUT
from datetime import date, timedelta
import json

CAP = 2025
FULL = ('GB1', 'ES1', 'IT1', 'L1', 'FR1', 'PO1', 'NL1')  # ligas con partidos 2012-2025

def parse(s):
    """'2004-01-01T00:00:00Z' -> (date, year_only). Wikidata guarda 1 de enero cuando solo se conoce el anio."""
    d = date(int(s[0:4]), int(s[5:7]), int(s[8:10]))
    return d, (d.month == 1 and d.day == 1)

def season(d):
    return d.year if d.month >= 7 else d.year - 1

def seasons_of(s, e):
    """Temporadas (anio de inicio) cubiertas por un tramo. Anio solo: 'Y1-Y2' = temporadas Y1..Y2-1 (convencion de Wikipedia)."""
    if s is None or not s[:4].isdigit(): return []
    sd, s_year = parse(s)
    start = sd.year if s_year else season(sd + timedelta(days=60))
    if e is None:
        end = CAP
    elif not e[:4].isdigit():  # fin "desconocido": no extender el tramo
        end = start
    else:
        ed, e_year = parse(e)
        end = ed.year - 1 if e_year else season(ed - timedelta(days=60))
    end = max(end, start)  # tramo dentro del mismo anio (cesion): al menos una temporada
    return range(start, min(end, CAP) + 1)

def load():
    spans, done = [], set()
    with open(OUT, encoding='utf-8') as f:
        for line in f:
            r = json.loads(line)
            if 'done' in r: done.update(r['done'])
            else: spans.append(r)
    return spans, done

if __name__ == '__main__':
    con = connect()
    spans, done = load()
    clubs = {r[0]: r[1] for r in con.execute("select club_id::int, domestic_competition_id from clubs").fetchall()}
    game_edges = set(build_edges(con, 'all'))
    value = dict(con.execute("select player_id, coalesce(highest_market_value_in_eur, 0) from players").fetchall())

    with_spans = {int(r['tm']) for r in spans}
    print(f'jugadores consultados={len(done)} con algun tramo en Wikidata={len(with_spans)} ({len(with_spans)/len(done):.1%})')
    top = sorted(done, key=lambda p: -value.get(p, 0))[:1500]
    print(f'  top 1.500 por valor: con tramos={len([p for p in top if p in with_spans])/len(top):.1%}')

    mapped = [r for r in spans if r.get('teamTm') and int(r['teamTm']) in clubs]
    print(f'tramos={len(spans)} con club mapeado a Transfermarkt y presente en el dataset={len(mapped)} ({len(mapped)/len(spans):.1%})')
    no_id = [r for r in spans if not r.get('teamTm')]
    print(f'  equipos sin P7223 (selecciones, juveniles, clubes sin ID...)={len(no_id)} ({len(no_id)/len(spans):.1%})')
    from collections import Counter
    print('  equipos sin ID mas frecuentes:', Counter(r.get('teamLabel', r['team']) for r in no_id).most_common(8))
    print('  sin fecha de inicio:', len([r for r in mapped if 's' not in r]))

    wd = set()
    for r in mapped:
        for s in seasons_of(r.get('s'), r.get('e')):
            wd.add((int(r['tm']), int(r['teamTm']), str(s)))

    # --- precision y recall contra la verdad (partidos), solo ligas con cobertura completa 2012-2024
    full = {c for c, comp in clubs.items() if comp in FULL}
    def sel(edges, lo=2012, hi=2024, cl=full): return {e for e in edges if e[1] in cl and lo <= int(e[2]) <= hi}
    queried = set(done)
    truth = {e for e in sel(game_edges) if e[0] in queried}
    pred = sel(wd)
    tp = len(truth & pred)
    print(f'\n== Aristas 2012-2024, 7 ligas con cobertura completa (solo jugadores consultados) ==')
    print(f'verdad={len(truth)} wikidata={len(pred)} coinciden={tp}  recall={tp/len(truth):.1%}  precision={tp/len(pred):.1%}')
    # misma comparacion limitada a los jugadores que tienen datos en Wikidata
    wp = {e for e in truth if e[0] in with_spans}
    print(f'  recall entre jugadores con datos en Wikidata: {len(wp & pred)/len(wp):.1%}')
    # top 1.500
    tt = {e for e in truth if e[0] in set(top)}; tp2 = {e for e in pred if e[0] in set(top)}
    print(f'  top 1.500: verdad={len(tt)} wd={len(tp2)} recall={len(tt & tp2)/len(tt):.1%} precision={len(tt & tp2)/len(tp2):.1%}')
    # ruido: precision por duracion del tramo / por si hay fecha exacta
    # error de borde: cuantas falsas son vecinas (+-1 temporada) de una verdadera
    fp = pred - truth
    near = sum(1 for (p, c, s) in fp if (p, c, str(int(s) - 1)) in truth or (p, c, str(int(s) + 1)) in truth)
    print(f'  falsos positivos={len(fp)}, de los cuales a +-1 temporada de una verdadera: {near} ({near/max(len(fp),1):.1%})')

    # --- aporte donde no hay verdad
    new = wd - game_edges
    pre = {e for e in new if int(e[2]) < 2012}
    arg = {c for c, comp in clubs.items() if comp in ('ARG1', 'BRA1', 'MLS1')}
    pre2000 = {e for e in pre if int(e[2]) >= 2000}
    print(f'\n== Aporte potencial (aristas en Wikidata que no estan en partidos) ==')
    print(f'nuevas total={len(new)}; antes de 2012={len(pre)}; 2000-2011={len(pre2000)}')
    print(f'en clubes ARG/BRA/MLS (cualquier temporada >=2000): {len({e for e in new if e[1] in arg and int(e[2]) >= 2000})}')
    # jugadores y clubes por temporada, cuantos jugadores por club-temporada en Wikidata vs. verdad (densidad)
    import statistics
    def dens(edges):
        d = defaultdict(set)
        for p, c, s in edges: d[(c, s)].add(p)
        return statistics.median(len(v) for v in d.values()) if d else 0
    print(f'mediana jugadores por club-temporada: partidos(2012-24)={dens(truth)} wikidata(2012-24)={dens(pred)} wikidata(2000-11, ligas full)={dens(sel(wd,2000,2011))} wikidata(ARG/BRA/MLS 2000-23)={dens(sel(wd,2000,2023,arg))}')
