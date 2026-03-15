import { useLocalState } from "./state";
import { useFileUpload } from "./useFileUpload";
import { useOnSubmit } from "./useOnSubmit";


export function RegionSelector() {
  const { i18n } = shopify;
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');
  const { locales, markets, selectedMarket, selectedLocale } = state.RegionSelector;

  return (
    <s-box padding-block-end="base">
      <s-stack direction="inline" gap="base" alignItems="center">
        <s-select
          label={i18n.translate("market-label")}
          value={selectedMarket}
          onChange={(e) => dispatch({ type: 'RegionSelector', payload: { type: 'setSelectedMarket', data: { value: e.currentTarget.value } } })}
        >
          <s-option value="__global__">{i18n.translate("all-markets")}</s-option>
          {markets.map((m) => (
            <s-option key={m.id} value={m.id}>
              {m.primary ? `${m.name} (primary)` : m.name}
            </s-option>
          ))}
        </s-select>
        <s-select
          label={i18n.translate("language-label")}
          value={selectedLocale}
          onChange={(e) => dispatch({ type: 'RegionSelector', payload: { type: 'setSelectedLocale', data: { value: e.currentTarget.value } } })}
        >
          {locales.map((l) => (
            <s-option key={l.locale} value={l.locale}>
              {l.primary ? `${l.name} (default)` : l.name}
            </s-option>
          ))}
        </s-select>
      </s-stack>
    </s-box>
  );
}

export function FormActions() {
  const { i18n, close, data: shopifyUiExtension } = shopify;
  const state = useLocalState('state');
  const onSubmit = useOnSubmit(shopifyUiExtension.selected[0].id, close);

  return (
    <>
      <s-button slot="primary-action" onClick={() => onSubmit()} disabled={state.saving}>
        {i18n.translate("save-button")}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()} disabled={state.saving}>
        {i18n.translate("cancel-button")}
      </s-button>
    </>
  );
}

export function FormInputs() {
  const { i18n } = shopify;
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');
  const { name, calories, protein, carbs, nutrition_details, formErrors } = state.FormInputs;

  const setField = (field, value) =>
    dispatch({ type: 'FormInputs', payload: { type: 'setField', data: { field, value } } });

  return (
    <s-grid-item gridColumn="span 1">
      <s-stack direction="block" gap="small-100 small-100">
        <s-text>Nutritional values</s-text>

        {/* Name Field */}
        <s-text-field
          value={name}
          error={formErrors?.name ? i18n.translate("name-error") : undefined}
          onChange={(e) => setField('name', e.currentTarget.value)}
          label={i18n.translate("name-label")}
          help-text={i18n.translate("name-help")}
        />

        {/* Calories */}
        <s-box padding-block-start="large">
          <s-number-field
            value={String(calories)}
            error={formErrors?.calories ? i18n.translate("calories-error") : undefined}
            onChange={(e) => setField('calories', parseFloat(e.currentTarget?.value) || 0)}
            label={i18n.translate("calories-label")}
            help-text={i18n.translate("calories-help")}
            min={0}
            step={1}
          />
        </s-box>

        {/* Protein */}
        <s-box padding-block-start="large">
          <s-number-field
            value={String(protein)}
            error={formErrors?.protein ? i18n.translate("field-error") : undefined}
            onChange={(e) => setField('protein', parseFloat(e.currentTarget?.value) || 0)}
            label={i18n.translate("protein-label")}
            help-text={i18n.translate("grams-unit")}
            min={0}
            step={0.1}
          />
        </s-box>

        {/* Carbs */}
        <s-box padding-block-start="large">
          <s-number-field
            value={String(carbs)}
            error={formErrors?.carbs ? i18n.translate("field-error") : undefined}
            onChange={(e) => setField('carbs', parseFloat(e.currentTarget?.value) || 0)}
            label={i18n.translate("carbs-label")}
            help-text={i18n.translate("grams-unit")}
            min={0}
            step={0.1}
          />
        </s-box>

        {/* Nutrition Details JSON */}
        <s-box padding-block-start="large">
          <s-text-area
            value={nutrition_details}
            onChange={(e) => setField('nutrition_details', e.currentTarget.value)}
            label="Nutrition Details (JSON)"
            help-text='Example: {"nutrients": [{"name": "Sodium", "unit": "mg", "value": 50}]}'
            rows={6}
          />
        </s-box>
      </s-stack>
    </s-grid-item>
  );
}

export function ImageUpload() {
  const state = useLocalState('state');
  const handleFileUpload = useFileUpload();
  const { imageUrl, uploadingImage, imageUploadError, imageWidth, imageHeight } = state.ImageUpload;
  const hasImageDimensions = Boolean(imageHeight && imageWidth);
  
  return (
    <s-grid-item gridColumn="span 1">
      <s-stack direction="block" gap="base small-200" inlineSize="100%">
        <s-text>Nutrition panel image</s-text>

        {/* Image Display Area */}
        {uploadingImage ? (
          <LoadingPlaceholder isLoading={uploadingImage} />
        ) : (
          // Image preview
          <s-image
            src={imageUrl}
            alt="Nutrition panel preview"
            inlineSize="fill"
            {...(hasImageDimensions && { aspectRatio: `${imageWidth}/${imageHeight}` })}
            objectFit={hasImageDimensions ? 'cover' : 'contain'}
            borderRadius="small"
            border="large-100 strong dashed"
          />
        )}

        {/* Drop Zone - Always shown */}
        <s-drop-zone
          accept="image/*"
          label={imageUrl ? "Replace image" : "Upload image"}
          onInput={(e) => handleFileUpload(e.currentTarget.files)}
          disabled={uploadingImage || state.saving}
        />

        {/* Error Banner */}
        {imageUploadError && (
          <s-banner tone="critical">
            {imageUploadError}
          </s-banner>
        )}
      </s-stack>
    </s-grid-item>
  );
}

function LoadingPlaceholder({ isLoading }) {
  return (
    <s-box
      minBlockSize="200px"
      borderRadius="small"
      border="large-100 strong dashed"
      background="subdued"
    >
      <s-stack 
        direction="block" 
        gap="base" 
        alignItems="center" 
        justifyContent="center"
        blockSize="200px"
      >
        <s-spinner size="large" />
      </s-stack>
    </s-box>
  );
}