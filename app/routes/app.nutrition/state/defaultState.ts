/**
 * Form data interface for nutrition panel creation
 */
export interface FormData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
}

/**
 * State interface for nutrition manager
 */
export interface NutritionState {
  formData: FormData;
  selectedProduct: any | null;
  isSubmitting: boolean;
}

/**
 * Default state for nutrition manager
 */
export const defaultState: NutritionState = {
  formData: {
    name: "",
    calories: "",
    protein: "",
    carbs: "",
  },
  selectedProduct: null,
  isSubmitting: false,
};
