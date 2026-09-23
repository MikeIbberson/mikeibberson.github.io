import { defineConfig } from "vite";

/**
"/" locally and on a user site; "/repo/" when Pages serves a project site.
*/
function siteBase() {
  const raw = (process.env.VITE_BASE_PATH || "/").trim();
  if (["", "/", "./"].includes(raw)) return "/";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: siteBase(),
  build: {
    // main.js uses top-level await; the default browser target rejects it.
    target: "es2022",
  },
  server: {
    port: 5173,
    open: false,
  },
});
