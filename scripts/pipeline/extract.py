"""Pipeline paso 1-4: extrae del dataset (DuckDB) los jugadores, clubes, club-temporadas y aristas de
las 10 ligas de alcance, los valida y los deja en data/processed/*.jsonl.

Uso: PYTHONUTF8=1 python scripts/pipeline/extract.py
Luego cargar con: npx tsx scripts/pipeline/load.ts
"""
import json
import os
import sys
from collections import defaultdict

import duckdb

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DB = os.path.join(ROOT, "data", "raw", "transfermarkt-datasets.duckdb")
OUT = os.path.join(ROOT, "data", "processed")

LEAGUES = ["GB1", "ES1", "IT1", "L1", "FR1", "ARG1", "BRA1", "PO1", "NL1", "MLS1"]
CALENDAR_LEAGUES = {"ARG1", "BRA1", "MLS1"}  # temporada = año calendario
MIN_SQUAD_WARN = 11            # un club-temporada con menos jugadores se reporta como sospechoso
MIN_GIANT_COMPONENT = 0.99     # el pipeline falla si la componente principal cubre menos que esto


def season_label(year: int, league: str) -> str:
    return str(year) if league in CALENDAR_LEAGUES else f"{year}/{(year + 1) % 100:02d}"


def main() -> int:
    if not os.path.exists(DB):
        print("Falta el dataset. Ejecutá: python scripts/spike/download.py", file=sys.stderr)
        return 1
    con = duckdb.connect(DB, read_only=True)
    in_leagues = ",".join(f"'{x}'" for x in LEAGUES)

    # Clubes de alcance: nombre corto (el más frecuente en partidos), país y liga.
    clubs = con.execute(
        f"""
        with names as (
          select home_club_id as club_id, home_club_name as name from games
          union all select away_club_id, away_club_name from games
        ), short as (
          select club_id, mode(name) as name from names where name is not null group by club_id
        )
        select c.club_id::int, coalesce(s.name, c.name), comp.country_name, c.domestic_competition_id
        from clubs c
        left join short s on s.club_id = c.club_id::int
        left join competitions comp on comp.competition_id = c.domestic_competition_id
        where c.domestic_competition_id in ({in_leagues})
        """
    ).fetchall()
    league_of = {c[0]: c[3] for c in clubs}

    # Aristas: integró el plantel (titular o suplente en banco, o con aparición), sin importar minutos.
    edge_rows = con.execute(
        f"""
        with ev as (
          select l.player_id, l.club_id, g.season::int as y
          from game_lineups l join games g on g.game_id::int = l.game_id
          union
          select a.player_id, a.player_club_id, g.season::int
          from appearances a join games g on g.game_id::int = a.game_id
        )
        select distinct ev.player_id, ev.club_id, ev.y
        from ev join clubs c on c.club_id::int = ev.club_id
        where c.domestic_competition_id in ({in_leagues}) and ev.club_id is not null
        """
    ).fetchall()

    # Nombre: tabla players; si falta, el más frecuente en las alineaciones (hay jugadores sin ficha en players).
    players_src = {
        r[0]: (r[1], r[2])
        for r in con.execute(
            """
            select l.player_id, coalesce(p.name, mode(l.player_name)), max(p.highest_market_value_in_eur)
            from game_lineups l left join players p on p.player_id = l.player_id
            group by l.player_id, p.name
            """
        ).fetchall()
    }
    for r in con.execute(
        "select player_id, name, highest_market_value_in_eur from players"
    ).fetchall():
        players_src.setdefault(r[0], (r[1], r[2]))

    # Datos fijos de la ficha (figurita): nacionalidad y posición. Los jugadores sin ficha quedan en null.
    profiles = {
        r[0]: (r[1], None if r[2] in (None, "Missing") else r[2])
        for r in con.execute(
            "select player_id, country_of_citizenship, position from players"
        ).fetchall()
    }

    club_seasons = {}
    edges = []
    squad = defaultdict(set)
    player_cs = defaultdict(set)
    skipped_no_name = 0
    for pid, cid, year in edge_rows:
        name = (players_src.get(pid) or (None, None))[0]
        if not name or not name.strip():
            skipped_no_name += 1
            continue
        cs_id = cid * 10000 + year
        club_seasons[cs_id] = (cid, year)
        edges.append((pid, cs_id))
        squad[cs_id].add(pid)
        player_cs[pid].add(cs_id)

    # --- Validaciones -------------------------------------------------------
    problems = []
    if len(set(edges)) != len(edges):
        problems.append("hay aristas duplicadas")
    small = {cs: len(p) for cs, p in squad.items() if len(p) < MIN_SQUAD_WARN}

    # Componente conexa principal (union-find sobre el grafo bipartito).
    parent = {}

    def find(x):
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for pid, cs in edges:
        parent[find(("p", pid))] = find(("c", cs))
    sizes = defaultdict(int)
    for pid in player_cs:
        sizes[find(("p", pid))] += 1
    giant = max(sizes.values()) / len(player_cs)
    if giant < MIN_GIANT_COMPONENT:
        problems.append(f"la componente principal cubre solo {giant:.1%} de los jugadores")

    os.makedirs(OUT, exist_ok=True)

    def dump(name, rows):
        with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    used_clubs = {cid for cid, _ in club_seasons.values()}
    dump("clubs.jsonl", [
        {"id": c[0], "name": c[1], "country": c[2], "league": c[3]} for c in clubs if c[0] in used_clubs
    ])
    dump("players.jsonl", [
        {
            "id": pid,
            "name": players_src[pid][0].strip(),
            "market_value_eur": players_src[pid][1],
            "nationality": profiles.get(pid, (None, None))[0],
            "position": profiles.get(pid, (None, None))[1],
        }
        for pid in sorted(player_cs)
    ])
    dump("club_seasons.jsonl", [
        {"id": cs, "club_id": cid, "season_year": y, "label": season_label(y, league_of[cid])}
        for cs, (cid, y) in sorted(club_seasons.items())
    ])
    dump("edges.jsonl", [{"player_id": p, "club_season_id": cs} for p, cs in sorted(edges)])

    per_league = defaultdict(set)
    for cs, (cid, y) in club_seasons.items():
        per_league[league_of[cid]].add(y)
    print("== Resumen del pipeline ==")
    print(f"jugadores={len(player_cs)} clubes={len(used_clubs)} club_temporadas={len(club_seasons)} aristas={len(edges)}")
    print(f"componente principal={giant:.2%}  aristas sin nombre de jugador omitidas={skipped_no_name}")
    print(f"club-temporadas con menos de {MIN_SQUAD_WARN} jugadores: {len(small)}")
    for lg in LEAGUES:
        ys = sorted(per_league.get(lg, []))
        print(f"  {lg}: temporadas {ys[0]}-{ys[-1]} ({len(ys)})" if ys else f"  {lg}: SIN DATOS")
        if not ys:
            problems.append(f"la liga {lg} no tiene datos")
    if problems:
        print("ERRORES DE VALIDACIÓN:", *problems, sep="\n - ", file=sys.stderr)
        return 1
    print(f"OK -> {os.path.abspath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
