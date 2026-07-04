import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for Supabase email confirmation/recovery flows. Password login
 * is handled on /login, but any emailed Supabase callback is still re-checked
 * against the allow-list before letting the user in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_allowed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
