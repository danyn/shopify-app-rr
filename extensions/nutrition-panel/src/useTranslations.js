import { useEffect } from 'preact/hooks';
import { makeGraphQLQuery } from '@local/extension-utils/graphql';
import { useLocalState } from './state';

/**
 * Hook to load existing translations when locale changes
 */
export function useTranslations() {
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');
  const metaobjectId = state.id;
  const { selectedLocale, locales } = state.RegionSelector;
  
  const defaultLocale = locales?.find(l => l.primary)?.locale || 'en';
  const isDefaultLocale = selectedLocale === defaultLocale;

  // Load existing translations when locale changes
  useEffect(() => {
    if (!metaobjectId || !selectedLocale || isDefaultLocale) {
      return;
    }
    
    loadTranslationsForLocale(metaobjectId, selectedLocale);
  }, [metaobjectId, selectedLocale, isDefaultLocale]);

  async function loadTranslationsForLocale(resourceId, locale) {
    try {
      const query = `#graphql
        query getTranslatableContent($resourceId: ID!, $locale: String!) {
          translatableResource(resourceId: $resourceId) {
            resourceId
            translations(locale: $locale) {
              key
              value
              locale
              outdated
            }
          }
        }
      `;

      const response = await makeGraphQLQuery(query, {
        resourceId,
        locale,
      });

      const translations = response?.data?.translatableResource?.translations || [];
      
      // Convert array to object
      const translationMap = {};
      translations.forEach(t => {
        translationMap[t.key] = t.value;
      });

      dispatch({
        type: 'TranslationModule',
        payload: {
          type: 'loadTranslations',
          data: {
            locale,
            translations: { [locale]: translationMap },
          },
        },
      });
    } catch (error) {
      console.error('Error loading translations:', error);
      dispatch({
        type: 'TranslationModule',
        payload: {
          type: 'setTranslationError',
          data: error.message,
        },
      });
    }
  }
}
