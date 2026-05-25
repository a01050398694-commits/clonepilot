import { cookies } from "next/headers";
import { isLang, type Lang } from "./i18n";

export const LANG_COOKIE = "cp_lang";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : "en";
}
