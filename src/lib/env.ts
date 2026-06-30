/**
 * Centralised, typed access to environment variables.
 * Secrets are never hardcoded — everything comes from the environment.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example and set it in your environment.`,
    );
  }
  return value;
}

/** Public Supabase config — safe to expose to the browser (RLS protects data). */
export const supabaseUrl = (): string =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = (): string =>
  required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

/**
 * Server-only allow-list of emails permitted to sign in.
 * Returns lowercased, trimmed emails. Empty array if unset.
 */
export function allowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

/** True if the given email is on the allow-list. */
export function isEmailAllowed(email: string): boolean {
  const list = allowedEmails();
  return list.includes(email.trim().toLowerCase());
}
