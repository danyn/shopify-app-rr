export const defaultState = {
  id: null,
  loading: true,
  saving: false,
  RegionSelector: {
    locales: [],
    markets: [],
    selectedLocale: "",
    selectedMarket: "__global__",
  },
  ImageUpload: {
    uploadingImage: false,
    imageUploadError: "",
    image: "",
    imageUrl: "",
  },
  FormInputs: {
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    formErrors: null,
  },
};
