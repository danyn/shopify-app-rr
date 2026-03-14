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
    imageWidth: null,
    imageHeight: null,
  },
  FormInputs: {
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    formErrors: null,
  },
};
