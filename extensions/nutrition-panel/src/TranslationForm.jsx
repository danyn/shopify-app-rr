import { useLocalState } from "./state";

export function TranslationForm() {
  const { i18n } = shopify;
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');
  const { selectedLocale, locales } = state.RegionSelector;
  const { currentLocaleTranslations } = state.TranslationModule;
  const { name, nutrition_details } = state.FormInputs;

  // Get default locale
  const defaultLocale = locales?.find(l => l.primary)?.locale || 'en';
  const isDefaultLocale = selectedLocale === defaultLocale;

  // Show for all locales, but don't allow editing on default
  if (!selectedLocale) {
    return null;
  }

  const setTranslation = (field, value) => {
    dispatch({
      type: 'TranslationModule',
      payload: {
        type: 'setTranslation',
        data: { field, value, locale: selectedLocale },
      },
    });
  };

  return (
    <s-box padding-block-start="large">
      <s-divider />
      <s-box padding-block="large">
        <s-stack direction="block" gap="base">
          <s-text type="strong">
            {isDefaultLocale ? `Default Values (${selectedLocale})` : `Translations for ${selectedLocale}`}
          </s-text>

          {isDefaultLocale ? (
            <s-banner heading="Default Locale" tone="info">
              This is the default locale. Edit values in the form above. 
              Translations will be saved for other locales.
            </s-banner>
          ) : (
            <s-banner heading="Translation Mode" tone="info">
              You are translating from the default locale ({defaultLocale}). 
              Original values are shown below for reference.
            </s-banner>
          )}

          {/* Name Translation/Display */}
          <s-box>
            <s-stack direction="block" gap="small">
              <s-text-field
                value={isDefaultLocale ? name : (currentLocaleTranslations.name || '')}
                onChange={(e) => !isDefaultLocale && setTranslation('name', e.currentTarget.value)}
                label={isDefaultLocale ? `Name (${selectedLocale})` : `Name (${selectedLocale})`}
                disabled={isDefaultLocale}
              />
              {!isDefaultLocale && (
                <s-text tone="auto">
                  Original ({defaultLocale}): {name}
                </s-text>
              )}
            </s-stack>
          </s-box>

          {/* JSON Nutrition Details Translation/Display */}
          <s-box>
            <s-stack direction="block" gap="small">
              <s-text-area
                value={isDefaultLocale ? nutrition_details : (currentLocaleTranslations.nutrition_details || '')}
                onChange={(e) => !isDefaultLocale && setTranslation('nutrition_details', e.currentTarget.value)}
                label={isDefaultLocale ? `Nutrition Details JSON (${selectedLocale})` : `Nutrition Details JSON (${selectedLocale})`}
                help-text={isDefaultLocale ? "Edit in the form above" : "Translate the 'name' properties in the JSON structure"}
                rows={8}
                disabled={isDefaultLocale}
              />
              
              {/* Show original JSON as reference (only for non-default locales) */}
              {!isDefaultLocale && (
                <s-box 
                  padding="base" 
                  background="subdued" 
                  border-radius="base"
                  border="base"
                >
                  <s-stack direction="block" gap="small">
                    <s-text type="strong">
                      Original JSON ({defaultLocale}):
                    </s-text>
                    <s-text>
                      <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">
{nutrition_details ? (
  typeof nutrition_details === 'string' 
    ? nutrition_details 
    : JSON.stringify(nutrition_details, null, 2)
) : '{}'}
                      </pre>
                    </s-text>
                  </s-stack>
                </s-box>
              )}
            </s-stack>
          </s-box>

          {!isDefaultLocale && (
            <s-banner heading="Translation Guide" tone="info">
              <s-stack direction="block" gap="small">
                <s-text>• Copy the JSON structure from above</s-text>
                <s-text>• Translate only the "name" fields within each nutrient</s-text>
                <s-text>• Keep "unit" and "value" unchanged</s-text>
                <s-text>• Maintain valid JSON format</s-text>
              </s-stack>
            </s-banner>
          )}
        </s-stack>
      </s-box>
    </s-box>
  );
}
