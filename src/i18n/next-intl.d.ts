import type en from "../../messages/en.json";
import type { Locale } from "./config";

// Makes translation keys and locale names type-checked across the app:
// a mistyped key fails `npm run typecheck` instead of showing up in the UI.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}
