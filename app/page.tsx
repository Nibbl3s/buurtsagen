import AtlasLoader from "./components/AtlasLoader";
import { loadSagen } from "@/lib/sagen";

export default function Home() {
  const sagen = loadSagen();
  return <AtlasLoader sagen={sagen} />;
}