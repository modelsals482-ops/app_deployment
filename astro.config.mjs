import { defineConfig } from "astro/config";

/* Statický výstup, žádná integrace, žádný JavaScript navíc.
   Web zůstává tím, čím byl — obyčejné HTML — jen se hlavička
   a patička píšou na jednom místě místo v každém souboru.

   `site` je potřeba, aby se daly generovat absolutní kanonické adresy.
   `build.format: "file"` vydá /o-nas.html místo /o-nas/index.html, což
   odpovídá tomu, co `cleanUrls: true` ve vercel.json očekává. */
export default defineConfig({
  site: "https://alsflow.cz",
  output: "static",
  build: { format: "file", assets: "assets/_astro" },
  devToolbar: { enabled: false },
});
