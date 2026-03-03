import { useEffect } from "preact/hooks";
import { makeGraphQLQuery } from "@local/extension-utils/graphql";
import { useLocalState } from "./state";

async function fetchLocalesAndMarkets() {
  const res = await makeGraphQLQuery(
    `query LocalesAndMarkets {
      shopLocales {
        locale
        name
        primary
      }
      markets(first: 50) {
        nodes {
          id
          name
          primary
        }
      }
    }`,
    {}
  );

  console.log('[LocalesAndMarkets] raw response:', JSON.stringify(res, null, 2));
  const locales = res?.data?.shopLocales;
  const markets = res?.data?.markets?.nodes;

  if (!Array.isArray(locales) || locales.length === 0) {
    throw new Error('shopLocales returned no results — check that read_locales scope is granted');
  }
  if (!Array.isArray(markets) || markets.length === 0) {
    throw new Error('markets returned no results — check that read_markets scope is granted');
  }

  console.log('[LocalesAndMarkets] locales:', locales, 'markets:', markets);
  return { locales, markets };
}

/**
 * Load shop locales and markets once on mount, dispatching to LocalState.
 */
export function useLocalesAndMarkets() {
  const dispatch = useLocalState('dispatch');
  useEffect(() => {
    (async function loadLocalesAndMarkets() {
      try {
        const { locales, markets } = await fetchLocalesAndMarkets();
        const primaryLocale = locales.find((l) => l.primary);
        dispatch({
          type: 'RegionSelector',
          payload: {
            type: 'load',
            data: { locales, markets, primaryLocale: primaryLocale?.locale || "" },
          },
        });
      } catch (error) {
        console.error("Error loading locales and markets:", error);
      }
    })();
  }, []);
}
