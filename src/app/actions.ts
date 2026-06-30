"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DisplayNameState = { error?: string; ok?: boolean };

/**
 * Creates (on first sign-in) or updates the current user's profile row with a
 * display name. The upsert is the moment the `profiles` row is first created.
 */
export async function setDisplayName(
  _prevState: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const name = String(formData.get("display_name") ?? "").trim();

  if (!name) {
    return { error: "Enter a display name." };
  }
  if (name.length > 60) {
    return { error: "Display name must be 60 characters or fewer." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You're not signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: name });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Signs the current user out and returns them to the login page. */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
