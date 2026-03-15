import { render } from "preact";
import { useLocalesAndMarkets } from "./useLocalesAndMarkets";
import { useNutritionData } from "./useNutritionData";
import { useTranslations } from "./useTranslations";
import { LocalState, useLocalState } from "./state";
import { RegionSelector, FormActions, ImageUpload, FormInputs } from "./components.jsx";
import { TranslationForm } from "./TranslationForm.jsx";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  return (
    <LocalState>
      <ExtensionInner />
    </LocalState>
  );
}

function ExtensionInner() {
  const { i18n } = shopify;
  const state = useLocalState('state');

  useLocalesAndMarkets();
  useNutritionData();
  useTranslations();

  return (
    <s-admin-action heading={i18n.translate("name")} loading={state.saving || state.loading}>
      <RegionSelector />

      <FormActions />

      {/* Form */}
      <s-grid
        gridTemplateColumns="5fr 5fr"
        gap="small"
        justifyContent="center"
      >
        <ImageUpload />
        <FormInputs />
      </s-grid>

      {/* Translation Form */}
      <TranslationForm />

    </s-admin-action>
  );
}