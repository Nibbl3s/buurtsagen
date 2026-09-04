import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buurtsagen — Gent",
  description:
    "Nacht-archief van Gentse folklore: sagen, legenden en boemannen op de kaart van de stad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}