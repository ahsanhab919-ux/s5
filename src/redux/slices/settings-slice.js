import { createSlice } from "@reduxjs/toolkit";

const LOCAL_STORAGE_KEY = "settings";

const defaultSetting = {
  theme: "system",
  direction: "ltr",
  language: "en",
  sidebar: "expanded",
  header: "expanded",
  layout: "vertical",

  // features settings
  demo: false,
  paraphraseOptions: {
    paraphraseQuotations: true,
    avoidContractions: true,
    preferActiveVoice: false,
    automaticStartParaphrasing: false,
    autoFreeze: false,
  },
  interfaceOptions: {
    useYellowHighlight: false,
    showTooltips: true,
    showChangedWords: true,
    showStructuralChanges: false,
    showLongestUnchangedWords: false,
  },
  humanizeOptions: {
    humanizeQuotations: true,
    avoidContractions: false,
    automaticStartHumanize: false,
  },
};

const getInitialSetting = () => {
  try {
    if (typeof window === "undefined") {
      return defaultSetting;
    }

    const setting = localStorage.getItem(LOCAL_STORAGE_KEY);
    return setting ? JSON.parse(setting) : defaultSetting;
  } catch (error) {
    console.error("Error parsing setting from localStorage", error);
    return defaultSetting;
  }
};

const initialState = getInitialSetting();

const saveState = (state) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    updateTheme(state, action) {
      state.theme = action.payload;
      saveState(state);
    },
    toggleTheme(state) {
      const order = ["light", "dark", "system"];
      const nextIndex = (order.indexOf(state.theme) + 1) % order.length;
      state.theme = order[nextIndex];
      saveState(state);
    },

    updateSidebar(state, action) {
      state.sidebar = action.payload;
      saveState(state);
    },
    toggleSidebar(state) {
      state.sidebar = state.sidebar === "expanded" ? "compact" : "expanded";
      saveState(state);
    },

    updateHeader(state, action) {
      state.header = action.payload;
      saveState(state);
    },
    toggleHeader(state) {
      state.header = state.header === "expanded" ? "compact" : "expanded";
      saveState(state);
    },

    updateLayout(state, action) {
      state.layout = action.payload;
      saveState(state);
    },
    toggleLayout(state) {
      state.layout = state.layout === "vertical" ? "horizontal" : "vertical";
      saveState(state);
    },

    updateLanguage(state, action) {
      state.language = action.payload;
      saveState(state);
    },
    toggleLanguage(state) {
      state.language = state.language === "en" ? "bn" : "en";
      saveState(state);
    },

    setDemo(state, action) {
      state.demo = action.payload;
      saveState(state);
    },
    toggleDemo(state) {
      state.demo = !state.demo;
      saveState(state);
    },

    // features
    toggleParaphraseOption(state, action) {
      const key = action.payload;
      if (state.paraphraseOptions.hasOwnProperty(key)) {
        state.paraphraseOptions[key] = !state.paraphraseOptions[key];
        saveState(state);
      }
    },
    toggleHumanizeOption(state, action) {
      const key = action.payload;
      if (state.humanizeOptions.hasOwnProperty(key)) {
        state.humanizeOptions[key] = !state.humanizeOptions[key];
        saveState(state);
      }
    },
    toggleInterfaceOption(state, action) {
      const key = action.payload;
      if (state.interfaceOptions.hasOwnProperty(key)) {
        state.interfaceOptions[key] = !state.interfaceOptions[key];
        saveState(state);
      }
    },
  },
});

export const {
  updateTheme,
  toggleTheme,
  updateHeader,
  toggleHeader,
  updateLayout,
  toggleLayout,
  updateLanguage,
  toggleLanguage,
  updateSidebar,
  toggleSidebar,
  setDemo,
  toggleDemo,
  toggleParaphraseOption,
  toggleInterfaceOption,
  toggleHumanizeOption,
} = settingsSlice.actions;

export default settingsSlice.reducer;
