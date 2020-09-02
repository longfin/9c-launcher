import React from "react";

import pages from "./index.json";

interface LocaleContext {
  locale: string;
}

const context = React.createContext<LocaleContext>({
  locale: "en",
});

const supportLocales = { en: "English" } as Record<string, string>;

export function useLocale(pageName: keyof typeof pages) {
  const { locale } = React.useContext(context);

  const selectedLocale = locale.startsWith("en") ? "en" : locale;

  const page = pages[pageName];
  return {
    selectedLocale,
    supportLocales,
    locale: function (name: string) {
      // @ts-ignore
      const message = page[name] as {
        [locale: string]: string | string[] | undefined;
        en: string | string[];
      };
      return message[selectedLocale] ?? message.en;
    },
  };
}

export default context.Provider;
