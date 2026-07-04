"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  CheckCircle2,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  authenticateWithPassword,
  type AuthMode,
  type AuthState,
} from "./actions";
import { cn } from "@/lib/utils";

const initialState: AuthState = {};

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus();
  const Icon = mode === "signup" ? UserPlus : LogIn;

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-green px-5 py-3 font-semibold text-white shadow-lift transition hover:bg-[#284f32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:opacity-60"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {pending
        ? mode === "signup"
          ? "Creating..."
          : "Signing in..."
        : mode === "signup"
          ? "Create account"
          : "Sign in"}
    </button>
  );
}

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [state, formAction] = useFormState(
    authenticateWithPassword,
    initialState,
  );
  const error = state.error ?? initialError;
  const showingSignup = mode === "signup";

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-white/70 p-5 shadow-soft backdrop-blur-sm"
    >
      <div className="grid grid-cols-2 gap-2 rounded-full border border-border bg-cream/70 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
            !showingSignup
              ? "bg-green text-white shadow-sm"
              : "text-ink-soft hover:bg-white/70 hover:text-green",
          )}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
            showingSignup
              ? "bg-green text-white shadow-sm"
              : "text-ink-soft hover:bg-white/70 hover:text-green",
          )}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} />

      <div className="mt-5">
        <label htmlFor="email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-border bg-white/80 px-4 focus-within:border-green focus-within:ring-2 focus-within:ring-green-soft">
          <Mail
            className="h-4 w-4 shrink-0 text-amber-deep"
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email}
            className="min-w-0 flex-1 bg-transparent py-3 text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="text-sm font-semibold text-ink">
          Password
        </label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-border bg-white/80 px-4 focus-within:border-green focus-within:ring-2 focus-within:ring-green-soft">
          <KeyRound
            className="h-4 w-4 shrink-0 text-amber-deep"
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={showingSignup ? "new-password" : "current-password"}
            placeholder={
              showingSignup ? "At least 8 characters" : "Your password"
            }
            className="min-w-0 flex-1 bg-transparent py-3 text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {showingSignup ? (
        <div className="mt-4">
          <label
            htmlFor="confirm_password"
            className="text-sm font-semibold text-ink"
          >
            Confirm password
          </label>
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-border bg-white/80 px-4 focus-within:border-green focus-within:ring-2 focus-within:ring-green-soft">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-amber-deep"
              aria-hidden="true"
            />
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required={showingSignup}
              autoComplete="new-password"
              placeholder="Type it once more"
              className="min-w-0 flex-1 bg-transparent py-3 text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {state.message ? (
        <div className="mt-4 rounded-xl border border-green-soft bg-green-soft p-3 text-sm leading-6 text-ink-soft">
          <p className="flex gap-2 font-medium">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-green"
              aria-hidden="true"
            />
            <span>{state.message}</span>
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-rose" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <SubmitButton mode={mode} />
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-muted">
        Only the two emails in the household allow-list can create or access an
        account.
      </p>
    </form>
  );
}
