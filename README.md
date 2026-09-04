# Buurtsagen 🌙

Een interactieve kaart van Gentse folklore — echte sagen, legenden en boemannen, verbonden aan echte plekken in de stad. Van de Duivelstoren tot de Stroppen, van Naart Stuyck tot de Sloekepier.

**[Live demo](#) · Next.js 14 + Leaflet · volledig statisch · geen backend**

## Wat is dit?

Een nachtelijke kaart van Gent waar elke gloeiende markering een echt volksverhaal op een echte locatie voorstelt. Klik een orbe aan en lees de sage — met bronvermelding. Verhalen die je leest worden groen en blijven bewaard in je browser (localStorage).

- 🗺️ Kaart-first: CARTO Dark Matter basiskaart met mist- en sfeereffecten
- 📖 52 echte verhalen — Gent, Herzele en de omliggende dorperring — elk met bronlink (volksverhalen.be, verhalenbank.nl, Wikipedia)
- 🏷️ Filter per verhaaltype: Sage · Legende · Spook · Watergeest · Hekserij · Dwaallicht · Boeman
- 🕯️ "Vertel me een verhaal" — willekeurige sage uit de huidige selectie
- ✅ Leesvoortgang lokaal bewaard, gelezen markeringen worden groen

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # statische productie-build
npm run start    # productieserver
```

Geen environment variables nodig.

## Verhalen toevoegen

Elk verhaal is een apart JSON-bestand in `data/stories/`:

```json
{
  "id": "mijn-verhaal",
  "titel": "Titel van de sage",
  "plaats": "Waar het speelt",
  "lat": 51.0543,
  "lng": 3.7223,
  "type": "Sage",
  "tekst": "Het volledige verhaal.\n\nMeerdere alinea's met \\n\\n.",
  "bronNaam": "Bron — Titel",
  "bronUrl": "https://..."
}
```

De app leest de map automatisch in (alfabetisch gesorteerd). Nieuwe types verschijnen vanzelf als filter.

## Bronnen & rechten

**Code:** MIT — zie [LICENSE](./LICENSE).

**Verhaleninhoud (`data/stories/`):** de teksten zijn overgenomen van hun bronnen en blijven eigendom van de auteurs:

- [volksverhalen.be](https://www.volksverhalen.be) — © Filip Gybels, gebruikt met bronvermelding, niet-commercieel en educatief
- [Wikipedia](https://nl.wikipedia.org/wiki/Sloekepier) (Sloekepier) — CC BY-SA

Hergebruik van de verhalenteksten buiten deze context vraagt toestemming van de bronhouders. De app zelf toont op elke kaart de bronlink.

## Deployen

Push naar GitHub en importeer de repo in [Vercel](https://vercel.com) (Hobby-plan). Framework wordt automatisch gedetecteerd; geen env vars.