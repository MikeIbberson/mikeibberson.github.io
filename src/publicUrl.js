/** Public-folder URL, prefixed with Vite's base (needed for GitHub project Pages). */
export function publicUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${String(path).replace(/^\//, "")}`;
}
