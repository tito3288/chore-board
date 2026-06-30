import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "That email isn't on the household allow-list.",
  auth: "We couldn't sign you in. Please request a new link.",
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Choreboard</h1>
        <p className="mt-1 text-gray-600">
          Sign in with your household email to see this week&apos;s chores.
        </p>
      </header>
      <LoginForm initialError={initialError} />
    </main>
  );
}
