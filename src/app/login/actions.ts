"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isEmailAllowed } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthMode = "signin" | "signup";

export type AuthState = {
  error?: string;
  message?: string;
  email?: string;
  mode?: AuthMode;
};

function authMode(value: FormDataEntryValue | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

/**
 * Password auth for the two-person household. Both sign-in and sign-up are
 * gated by ALLOWED_EMAILS before Supabase is asked to create or verify a user.
 */
export async function authenticateWithPassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = authMode(formData.get("mode"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email) {
    return { error: "Enter your email address.", mode };
  }

  if (!isEmailAllowed(email)) {
    return {
      error: "This email isn't on the household allow-list.",
      email,
      mode,
    };
  }

  if (!password) {
    return { error: "Enter your password.", email, mode };
  }

  if (mode === "signup") {
    if (password.length < 8) {
      return {
        error: "Choose a password with at least 8 characters.",
        email,
        mode,
      };
    }

    if (password !== confirmPassword) {
      return { error: "Those passwords don't match.", email, mode };
    }

    const supabase = createClient();
    const origin = headers().get("origin") ?? "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message, email, mode };
    }

    if (!data.session) {
      return {
        message:
          "Account created. Supabase is waiting for email confirmation before it can sign you in.",
        email,
        mode: "signin",
      };
    }

    redirect("/");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "That email and password didn't match.",
      email,
      mode,
    };
  }

  redirect("/");
}
