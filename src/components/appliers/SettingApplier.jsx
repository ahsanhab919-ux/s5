"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";

const SettingApplier = () => {
  const direction = useSelector((state) => state.settings.direction);
  const theme = useSelector((state) => state.settings.theme);
  const language = useSelector((state) => state.settings.language);

  // Apply direction
  useEffect(() => {
    if (direction) {
      document.documentElement.setAttribute("dir", direction);
    }
  }, [direction]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      root.classList.remove("light", "dark");
      root.classList.add(mode);
    };

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(media.matches ? "dark" : "light");

      const listener = (e) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      media.addEventListener("change", listener);

      return () => media.removeEventListener("change", listener);
    } else {
      if (theme === "light" || theme === "dark") {
        applyTheme(theme);
      }
    }
  }, [theme]);

  // Apply language
  useEffect(() => {
    if (language) {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  return null;
};

export default SettingApplier;
