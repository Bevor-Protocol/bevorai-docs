
import { createContext, use } from "react";

interface LocaleItem {
  name: string;
  locale: string;
}

interface I18nContext {
  locale?: string;
  onChange?: (locale: string) => void;
  locales: LocaleItem[];
}

const Context = createContext<I18nContext>({ locales: [] });

export const useI18n = () => use(Context);
