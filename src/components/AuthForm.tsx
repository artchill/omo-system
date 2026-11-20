"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { FormState } from "@/lib/errors";

type Props = {
  mode: "login" | "setup";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

const input =
  "mt-1 w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2";

export function AuthForm({ mode, action }: Props) {
  const t = useTranslations("Auth");
  const te = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === "setup" && (
        <label className="block text-sm">
          {t("name")}
          <input name="name" required maxLength={100} autoComplete="name" className={input} />
        </label>
      )}
      <label className="block text-sm">
        {t("email")}
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="username"
          className={input}
        />
      </label>
      <label className="block text-sm">
        {t("password")}
        <input
          name="password"
          type="password"
          required
          maxLength={200}
          minLength={mode === "setup" ? 10 : undefined}
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
          className={input}
        />
        {mode === "setup" && (
          <span className="mt-1 block text-xs opacity-70">{t("passwordHint")}</span>
        )}
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {te(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-3 py-2 text-background disabled:opacity-60"
      >
        {mode === "setup" ? t("createAdmin") : t("signIn")}
      </button>
    </form>
  );
}
