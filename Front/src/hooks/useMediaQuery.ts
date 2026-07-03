import { useEffect, useState } from "react";

/** Devuelve true si el media query coincide. Reactivo a cambios de tamaño. */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Pantallas de teléfono/tablet chica (≤ 860px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 860px)");
}
