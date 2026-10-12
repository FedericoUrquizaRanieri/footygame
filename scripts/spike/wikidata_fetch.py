"""Baja de Wikidata los tramos de carrera (P54 'miembro de equipo' con P580/P582) de los jugadores del grafo.
Cruza por ID de Transfermarkt: jugador P2446, club P7223. Escribe data/raw/wikidata_p54.jsonl (reanudable)."""
from graph import *
import json, os, time, urllib.request, urllib.parse, urllib.error

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'wikidata_p54.jsonl')
URL = 'https://query.wikidata.org/sparql'
UA = 'footygame-spike/0.1 (academic project, UNS)'
BATCH = 250

QUERY = """SELECT ?tm ?team ?teamTm ?teamLabel ?s ?e WHERE {
 VALUES ?tm { %s }
 ?p wdt:P2446 ?tm . ?p p:P54 ?st . ?st ps:P54 ?team .
 OPTIONAL { ?st pq:P580 ?s } OPTIONAL { ?st pq:P582 ?e }
 OPTIONAL { ?team wdt:P7223 ?teamTm }
 OPTIONAL { ?team rdfs:label ?teamLabel FILTER(lang(?teamLabel) = 'en') }
}"""

def run(q, tries=5):
    for i in range(tries):
        req = urllib.request.Request(URL + '?' + urllib.parse.urlencode({'query': q, 'format': 'json'}), headers={'User-Agent': UA})
        try:
            return json.load(urllib.request.urlopen(req, timeout=90))['results']['bindings']
        except (urllib.error.URLError, TimeoutError) as e:
            print('  reintento', i + 1, e, flush=True)
            time.sleep(5 * (i + 1))
    raise RuntimeError('Wikidata no responde')

def done_ids():
    if not os.path.exists(OUT): return set()
    ids = set()
    with open(OUT, encoding='utf-8') as f:
        for line in f:
            r = json.loads(line)
            if r.get('done'): ids.update(r['done'])
    return ids

if __name__ == '__main__':
    con = connect()
    players = sorted({e[0] for e in build_edges(con, 'leagues')})
    todo = [p for p in players if p not in done_ids()]
    print(f'jugadores={len(players)} pendientes={len(todo)}', flush=True)
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        rows = run(QUERY % ' '.join('"%d"' % p for p in chunk))
        with open(OUT, 'a', encoding='utf-8') as f:
            for b in rows:
                f.write(json.dumps({k: v['value'] for k, v in b.items()}, ensure_ascii=False) + '\n')
            f.write(json.dumps({'done': chunk}) + '\n')
        print(f'{min(i + BATCH, len(todo))}/{len(todo)} filas={len(rows)}', flush=True)
        time.sleep(1)
