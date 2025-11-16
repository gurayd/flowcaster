import {getRequestConfig} from "next-intl/server";
import {locales, defaultLocale, type AppLocale} from "./config";

export default getRequestConfig(async ({locale}) => {
  const requestedLocale = (locale ?? defaultLocale) as string;
  const normalizedLocale = locales.includes(requestedLocale as AppLocale)
    ? (requestedLocale as AppLocale)
    : defaultLocale;

  return {
    locale: normalizedLocale,
    messages: (await import(`../locales/${normalizedLocale}.json`)).default,
  };
});
