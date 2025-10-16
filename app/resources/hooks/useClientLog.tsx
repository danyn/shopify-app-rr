import { useEffect } from "react";
import { useMatches } from "react-router";

/**
 * Logs client-side loader data for all routes.
 * - Client-only
 * - Development-only
 */
export function useClientLog() {
  const matches = useMatches();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("%c=== Loader Data ===", "color: teal; font-weight:bold;");
    matches.forEach((match, index) => {
      console.log(`${index})${match.id}:`, match.data);
    });
  }, [matches]);
}
