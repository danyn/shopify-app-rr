import "@shopify/ui-extensions/preact";
import { useLocalState } from "./state";

export function Loading() {
  const { i18n } = shopify;
  
  return (
    <s-admin-block heading={i18n.translate('name')}>
      <s-stack direction="block">
        <s-spinner size="base" />
        <s-text>{i18n.translate('loading')}</s-text>
      </s-stack>
    </s-admin-block>
  );
}

export function Error() {
  const { i18n } = shopify;
  const state = useLocalState('state');
  
  return (
    <s-admin-block heading={i18n.translate('name')}>
      <s-stack direction="block">
        <s-text type="strong">{i18n.translate('error')}: {state.error}</s-text>
      </s-stack>
    </s-admin-block>
  );
}

export function NoData() {
  const { i18n, navigation } = shopify;
  
  return (
    <s-admin-block heading={i18n.translate('name')}>
      <s-stack direction="block">
        <s-banner heading={i18n.translate('noData')} tone="info" dismissible>
          <s-box padding="small none">
            <s-button
              variant="secondary"
              icon="edit"
              onClick={() => navigation.navigate('extension://nutrition-panel')}
            >
              {i18n.translate('add') || 'add Nutrition'}
            </s-button>
          </s-box>
        </s-banner>
      </s-stack>
    </s-admin-block>
  );
}

export function HasData() {
  const { i18n, navigation } = shopify;
  const state = useLocalState('state');
  
  return (
    <s-admin-block heading={i18n.translate('name')}>
      <s-stack direction="block" gap="large">

        {/* Calories */}
        <s-stack direction="block" gap="small">
          <s-text type="strong">{i18n.translate('calories')}</s-text>
          <s-text>{state.nutritionData.calories || '0'} {i18n.translate('caloriesUnit')}</s-text>
        </s-stack>

        {/* Protein */}
        <s-stack direction="block" gap="small">
          <s-text type="strong">{i18n.translate('protein')}</s-text>
          <s-text>{state.nutritionData.protein || '0'} {i18n.translate('gramsUnit')}</s-text>
        </s-stack>

        {/* Carbohydrates */}
        <s-stack direction="block" gap="small">
          <s-text type="strong">{i18n.translate('carbohydrates')}</s-text>
          <s-text>{state.nutritionData.carbs || '0'} {i18n.translate('gramsUnit')}</s-text>
        </s-stack>

        {/* Edit Button - launches the admin action modal */}
        <s-button
          onClick={() => navigation.navigate('extension://nutrition-panel')}
          icon="edit"
        >
          {i18n.translate('edit') || 'Edit Nutrition'}
        </s-button>
      </s-stack>
    </s-admin-block>
  );
}
