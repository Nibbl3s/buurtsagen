import fs from "fs";
import path from "path";
import type { Sage } from "./types";

export function loadSagen(): Sage[] {
  const dir = path.join(process.cwd(), "data", "stories");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const sagen = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  ) as Sage[];
  return sagen.sort((a, b) => a.titel.localeCompare(b.titel, "nl"));
}