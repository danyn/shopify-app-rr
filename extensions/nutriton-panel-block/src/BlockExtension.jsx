import "@shopify/ui-extensions/preact";
import { render } from 'preact';
import { useNutritionData } from "./useNutritionData.js";
import { LocalState, useLocalState } from "./state";
import { Loading, Error, NoData, HasData } from "./components.jsx";

export default async () => {
  render(<Extension />, document.body);
}

function Extension() {
  return (
    <LocalState>
      <ExtensionInner />
    </LocalState>
  );
}

function ExtensionInner() {
  const state = useLocalState('state');

  useNutritionData();

  if (state.loading) return <Loading />;
  if (state.error) return <Error />;
  if (!state.nutritionData) return <NoData />;

  return <HasData />;
}