"use client";

import dynamic from "next/dynamic";
import type { Sage } from "@/lib/types";

const Atlas = dynamic(() => import("./Atlas"), {
  ssr: false,
  loading: () => <div style={{ height: "100vh", width: "100vw", background: "#0a0e1a" }} />,
});

export default function AtlasLoader({ sagen }: { sagen: Sage[] }) {
  return <Atlas sagen={sagen} />;
}