#!/usr/bin/env python3
"""Oogst verhalenbank-items (hervatbaar). Usage: harvest_items.py <ids.json>"""
import urllib.request, json, os, re, time, sys

BASE = os.path.dirname(os.path.abspath(__file__))
api_key = ""
for p in ["/home/hermeswebui/.hermes/.env", "/home/hermeswebui/.hermes/profiles/meridian/.env"]:
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("FIRECRAWL_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip()

def scrape(url, timeout=140, tries=2):
    for i in range(tries):
        try:
            req = urllib.request.Request("https://api.firecrawl.dev/v1/scrape",
                data=json.dumps({"url": url, "formats": ["markdown", "html"], "waitFor": 5000}).encode(),
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
            return json.loads(urllib.request.urlopen(req, timeout=timeout).read()).get("data", {}).get("markdown", "")
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(4)

lijst = sys.argv[1]
alle = json.load(open(os.path.join(BASE, "lijsten_omringend.json")))
pool = {}
for pl, d in alle.items():
    for it in d["items"]:
        if it["id"] not in pool:
            pool[it["id"]] = pl
ids = sorted((iid for iid in pool if iid in lijst), key=int)

os.makedirs(os.path.join(BASE, "ring"), exist_ok=True)
pjson = os.path.join(BASE, "ring", "_parsed.json")
results = json.load(open(pjson)) if os.path.exists(pjson) else {}

for k, iid in enumerate(ids):
    if results.get(iid, {}).get("tekst"):
        continue
    path = os.path.join(BASE, "ring", f"item_{iid}.md")
    if os.path.exists(path):
        md = open(path).read()
    else:
        try:
            md = scrape(f"https://www.verhalenbank.nl/items/show/{iid}")
            open(path, "w").write(md)
            time.sleep(0.5)
        except Exception as e:
            print(f"FOUT {iid}: {repr(e)[:60]}", flush=True)
            continue
    tekst = re.search(r"### Hoofdtekst\n\n(.+?)\n\n### ", md, re.S)
    bron = re.search(r"### Bron\n\n(.+?)\n\n###", md, re.S)
    results[iid] = {"tekst": (tekst.group(1).strip() if tekst else ""),
                    "bron": (bron.group(1).strip().replace("\n", " ") if bron else "")}
    json.dump(results, open(pjson, "w"), indent=1, ensure_ascii=False)
    print(f"{k+1:3d}/{len(ids)} {iid} {len(results[iid]['tekst'])} chars", flush=True)

hebben = sum(1 for r in results.values() if r["tekst"])
print(f"klaar: {hebben} met tekst van {len(ids)}")