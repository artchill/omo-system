"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { FormState } from "@/lib/errors";

type Props = {
  mode: "login" | "setup";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

const input = "field mt-1.5";

export function AuthForm({ mode, action }: Props) {
  const t = useTranslations("Auth");
  const te = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === "setup" && (
        <label className="block text-sm font-medium">
          {t("name")}
          <input name="name" required maxLength={100} autoComplete="name" className={input} />
        </label>
      )}
      <label className="block text-sm font-medium">
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
      <label className="block text-sm font-medium">
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
          <span className="mt-1 block text-xs font-normal text-muted">{t("passwordHint")}</span>
        )}
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
          {te(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full py-2.5"
      >
        {mode === "setup" ? t("createAdmin") : t("signIn")}
      </button>
    </form>
  );
}
