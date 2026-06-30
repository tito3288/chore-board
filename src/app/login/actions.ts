"use server";

import { headers } from "next/headers";
import { isEmailAllowed } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error?: string;
  sent?: boolean;
  email?: string;
};

/**
 * Sends a magic-link sign-in email — but only to allow-listed addresses.
 * Requests from any other email are rejected before any link is sent.
 */
export async function signInWithEmail(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Enter your email address." };
  }

  if (!isEmailAllowed(email)) {
    return {
      error: "This email isn't on the household allow-list.",
      email,
    };
  }

  const supabase = createClient();
  const origin = headers().get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message, email };
  }

  return { sent: true, email };
}
