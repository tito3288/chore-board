import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Server-side Supabase client bound to the request cookies.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` was called from a Server Component where cookies are
          // read-only. Session refresh is handled by middleware, so this is safe
          // to ignore here.
        }
      },
    },
  });
}
