#!/usr/bin/env python3
"""Download Commons-afbeeldingen voor verhalen (hervatbaar, rate-limit-vriendelijk)."""
import urllib.request, urllib.parse, json, os, re, time

BASE = "/home/hermeswebui/.hermes/profiles/meridian/workspace/buurtsagen"
UA = {"User-Agent": "buurtsagen-folklore-map/0.1 (hobby project; contact: lennart.dubois@gmail.com)"}
IMGDIR = os.path.join(BASE, "public/verhalen")
os.makedirs(IMGDIR, exist_ok=True)

TARGETS = {
    "draak-op-het-belfort": "Belfort Gent 2.jpg",
    "duivelstoren": "Gent - Sint-Baafskathedraal (48187018797).jpg",
    "hoofdbrug": "Gent, Het Gravensteen oeg25890 vanaf de Hoo.jpg",
    "mammelokker": "20090517 Gent (0003).jpg",
    "stenen-broden": "Gent, de Sint-Niklaaskerk oeg25149, en op de achtergrond het Belfort.jpg",
    "stroppen": "Dwars-door-Gent-2026.jpg",
    "patershol": "Café De Hel, Ghent.jpg",
    "rijm-en-alijn": "GENT (Huis van Alijn) - Albrecht.jpg",
    "geeraard-de-duivel": "Geeraard de Duivelsteen, Ghent (DSCF0291).jpg",
    "meermin": "M.I.A.T. 6 aug 2008.JPG",
    "naart-stuyck": "Gent - Sint-Jacobskerk 1.jpg",
    "engelandgat": "Gent Ingelandgat-PM 03838.jpg",
    "karnemelkbrug": "Gent Steendam 112 - 234077 - onroerenderfgoed.jpg",
    "herzele-189782": "Kerk Ressegem.jpg",
    "herzele-158651": "Burcht Herzele 05.jpg",
}

def fetch_file(title, width=900):
    params = urllib.parse.urlencode({"action": "query", "titles": f"File:{title}",
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": width, "format": "json"})
    req = urllib.request.Request(f"https://commons.wikimedia.org/w/api.php?{params}", headers=UA)
    pages = json.loads(urllib.request.urlopen(req, timeout=30).read()).get("query", {}).get("pages", {})
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        artist = re.sub(r"<[^>]+>", "", em.get("Artist", {}).get("value", "")).strip()
        return {"url": ii.get("thumburl") or ii.get("url"), "artist": artist[:90],
                "lic": em.get("LicenseShortName", {}).get("value", "")}
    return None

for sid, title in TARGETS.items():
    path = os.path.join(IMGDIR, f"{sid}.jpg")
    jpath = os.path.join(BASE, f"data/stories/{sid}.json")
    doc = json.load(open(jpath))
    if os.path.exists(path) and doc.get("afbeelding"):
        print(f"· {sid} al klaar", flush=True)
        continue
    ok = False
    for attempt in range(4):
        try:
            info = fetch_file(title)
            if not info or not info["url"]:
                print(f"✗ {sid}: geen imageinfo", flush=True)
                break
            req = urllib.request.Request(info["url"], headers=UA)
            data = urllib.request.urlopen(req, timeout=60).read()
            open(path, "wb").write(data)
            doc["afbeelding"] = f"/verhalen/{sid}.jpg"
            doc["afbeeldingCredit"] = f"{info['artist']} — {info['lic']}, via Wikimedia Commons"
            json.dump(doc, open(jpath, "w"), ensure_ascii=False, indent=2)
            print(f"✓ {sid} {len(data)} bytes | {info['artist'][:36]} | {info['lic'][:16]}", flush=True)
            ok = True
            break
        except Exception as e:
            wait = 45 * (attempt + 1)
            print(f"… {sid} poging {attempt+1} faalde ({repr(e)[:40]}), wacht {wait}s", flush=True)
            time.sleep(wait)
    if not ok and not os.path.exists(path):
        print(f"✗✗ {sid} overgeslagen na 4 pogingen", flush=True)
    time.sleep(6)

klaar = sum(1 for sid in TARGETS if json.load(open(os.path.join(BASE, f'data/stories/{sid}.json'))).get("afbeelding"))
print(f"RESULTAAT: {klaar}/{len(TARGETS)} met afbeelding", flush=True)