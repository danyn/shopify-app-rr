export function RegionSelector(state, payload) {
  const { type, data } = payload;
  switch (type) {
    case 'load': {
      return {
        ...state,
        RegionSelector: {
          ...state.RegionSelector,
          locales: data.locales,
          markets: data.markets,
          selectedLocale: data.primaryLocale,
        },
      };
    }
    case 'setSelectedMarket': {
      return {
        ...state,
        RegionSelector: {
          ...state.RegionSelector,
          selectedMarket: data.value,
        },
      };
    }
    case 'setSelectedLocale': {
      return {
        ...state,
        RegionSelector: {
          ...state.RegionSelector,
          selectedLocale: data.value,
        },
      };
    }
    default: {
      console.warn('RegionSelector reducer: unknown type', type);
      return state;
    }
  }
}

export function ImageUpload(state, payload) {
  const { type, data } = payload;
  switch (type) {
    case 'uploadStart': {
      return {
        ...state,
        ImageUpload: {
          ...state.ImageUpload,
          uploadingImage: true,
          imageUploadError: "",
        },
      };
    }
    case 'uploadSuccess': {
      return {
        ...state,
        ImageUpload: {
          ...state.ImageUpload,
          uploadingImage: false,
          image: data.image,
          imageUrl: data.imageUrl,
          imageWidth: data.imageWidth || null,
          imageHeight: data.imageHeight || null,
        },
      };
    }
    case 'uploadError': {
      return {
        ...state,
        ImageUpload: {
          ...state.ImageUpload,
          uploadingImage: false,
          imageUploadError: data.message,
        },
      };
    }
    default: {
      console.warn('ImageUpload reducer: unknown type', type);
      return state;
    }
  }
}

export function FormInputs(state, payload) {
  const { type, data } = payload;
  switch (type) {
    case 'setField': {
      const newFormErrors = state.FormInputs.formErrors
        ? { ...state.FormInputs.formErrors, [data.field]: false }
        : state.FormInputs.formErrors;
      return {
        ...state,
        FormInputs: {
          ...state.FormInputs,
          [data.field]: data.value,
          formErrors: newFormErrors,
        },
      };
    }
    case 'setErrors': {
      return {
        ...state,
        FormInputs: {
          ...state.FormInputs,
          formErrors: data.errors,
        },
      };
    }
    default: {
      console.warn('FormInputs reducer: unknown type', type);
      return state;
    }
  }
}
