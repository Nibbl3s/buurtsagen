"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { Sage } from "@/lib/types";

const STORAGE_KEY = "buurtsagen-read-v1";

function loadRead(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Atlas({ sagen }: { sagen: Sage[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const initializedRef = useRef(false);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<string>("Alle");
  const [selected, setSelected] = useState<Sage | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    setRead(new Set(loadRead()));
  }, []);

  const types = useMemo(
    () => ["Alle", ...Array.from(new Set(sagen.map((s) => s.type)))],
    [sagen]
  );

  // init map once
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const map = L.map(container, {
        center: [51.0536, 3.7222],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);
      L.control
        .attribution({ position: "bottomright", prefix: false })
        .addAttribution("© OpenStreetMap, © CARTO")
        .addTo(map);
      mapRef.current = map;

      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);

      return () => {
        observer.disconnect();
        map.remove();
        mapRef.current = null;
        initializedRef.current = false;
      };
    } catch (e) {
      console.error("Map init failed", e);
      initializedRef.current = false;
    }
  }, []);

  // create markers once
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mounted) return;

    const markers: Record<string, L.Marker> = {};
    sagen.forEach((s) => {
      const m = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: "sagen-marker",
          html: `<div class="orb pulse" data-id="${s.id}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map);
      m.on("click", () => openStory(s));
      markers[s.id] = m;
    });
    markersRef.current = markers;

    return () => {
      Object.values(markers).forEach((m) => m.remove());
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, sagen]);

  // apply filter + read state to markers
  useEffect(() => {
    if (!mounted) return;
    const map = mapRef.current;
    if (!map) return;

    sagen.forEach((s) => {
      const m = markersRef.current[s.id];
      if (!m) return;
      const show = active === "Alle" || s.type === active;
      if (show && !map.hasLayer(m)) m.addTo(map);
      if (!show && map.hasLayer(m)) map.removeLayer(m);
      const el = m.getElement()?.querySelector(".orb");
      if (el) {
        el.classList.toggle("read", read.has(s.id));
        el.classList.toggle("pulse", !read.has(s.id));
      }
    });
  }, [active, read, mounted, sagen]);

  function openStory(s: Sage) {
    setSelected(s);
    setRead((prev) => {
      if (prev.has(s.id)) return prev;
      const next = new Set(prev).add(s.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  function randomStory() {
    const pool = sagen.filter((s) => active === "Alle" || s.type === active);
    if (pool.length) openStory(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (!mounted) {
    return <div style={{ height: "100vh", width: "100vw", background: "#0a0e1a" }} />;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
      <div className="fog" />

      <header className="brand">
        <h1>Buurtsagen</h1>
        <p>Gent · nacht-archief van de buurt</p>
      </header>

      <nav className="chips">
        {types.map((t) => {
          const n = t === "Alle" ? sagen.length : sagen.filter((s) => s.type === t).length;
          return (
            <div
              key={t}
              className={"chip" + (t === active ? " on" : "")}
              onClick={() => setActive(t)}
            >
              {t}
              <span className="n">{n}</span>
            </div>
          );
        })}
      </nav>

      <button className="random" onClick={randomStory}>
        🕯️ Vertel me een verhaal
      </button>

      <div className="tracker">
        <b>{read.size}</b> / {sagen.length} verhalen gelezen
      </div>

      <aside className={"card" + (selected ? " open" : "")}>
        {selected && (
          <>
            <button className="close" onClick={() => setSelected(null)}>
              ✕
            </button>
            <span className="badge">{selected.type}</span>
            <h2>{selected.titel}</h2>
            <div className="place">📍 {selected.plaats}</div>
            <div className="story">{selected.tekst}</div>
            <a className="src" href={selected.bronUrl} target="_blank" rel="noopener noreferrer">
              Bron: {selected.bronNaam} ↗
            </a>
            <div className="read-tag">
              ✓ gelezen — {read.size} van {sagen.length} verhalen
            </div>
          </>
        )}
      </aside>
    </div>
  );
}