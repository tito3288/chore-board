import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "That email isn't on the household allow-list.",
  auth: "We couldn't sign you in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const initialError = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? "Something went wrong.")
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md">
        <header className="text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white/55 px-4 py-2 text-sm font-semibold text-amber-deep shadow-sm">
            <Home className="h-4 w-4" aria-hidden="true" />
            Your shared home board
          </div>
          <h1 className="font-heading text-5xl font-semibold leading-none text-green">
            Choreboard
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-ink-soft">
            Sign in with your household email and password to settle into this
            week&apos;s rhythm.
          </p>
        </header>
        <div className="mt-8">
          <LoginForm initialError={initialError} />
        </div>
      </section>
    </main>
  );
}
