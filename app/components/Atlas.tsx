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
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [active, setActive] = useState<string>("Alle");
  const [selected, setSelected] = useState<Sage | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());

  // load persisted read state after mount (avoids hydration mismatch)
  useEffect(() => {
    setRead(new Set(loadRead()));
  }, []);

  const types = useMemo(
    () => ["Alle", ...Array.from(new Set(sagen.map((s) => s.type)))],
    [sagen]
  );

  // init map — container is always in the DOM (no mounted gate), so this is safe
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    try {
      const map = L.map(container, {
        center: [50.97, 3.73],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      L.control
        .attribution({ position: "bottomright", prefix: false })
        .addAttribution("© OpenStreetMap contributors")
        .addTo(map);
      mapRef.current = map;

      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);

      return () => {
        observer.disconnect();
        map.remove();
        mapRef.current = null;
      };
    } catch (e) {
      console.error("Map init failed", e);
    }
  }, []);

  // create markers once the map exists
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [sagen]);

  // apply filter + read state
  useEffect(() => {
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
  }, [active, read, sagen]);

  // escape closes the reader + scroll lock while open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  function openStory(s: Sage) {
    setSelected(s);
    mapRef.current?.flyTo([s.lat, s.lng], 16, { duration: 1.2 });
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

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
      <div className="fog" />

      <header className="brand">
        <h1>Buurtsagen</h1>
        <p>Gent & de Vlaamse Ardennen · nacht-archief van de buurt</p>
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

      {/* full-screen reading overlay — the story IS the focus */}
      {selected && (
        <div className="reader-backdrop" onClick={() => setSelected(null)}>
          <article
            className="reader"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selected.titel}
          >
            <button className="reader-close" onClick={() => setSelected(null)} aria-label="Sluiten">
              ✕
            </button>
            <span className="badge">{selected.type}</span>
            <h2>{selected.titel}</h2>
            <div className="place">
              📍 {selected.plaats}
              {read.has(selected.id) && <span className="read-inline"> · ✓ gelezen</span>}
            </div>
            <div className="reader-story">{selected.tekst}</div>
            <div className="reader-footer">
              <a
                className="src"
                href={selected.bronUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Bron: {selected.bronNaam} ↗
              </a>
              <span className="read-tag">
                {read.size} / {sagen.length} gelezen
              </span>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}