"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, UserRound } from "lucide-react";
import { setDisplayName, type DisplayNameState } from "./actions";

const initialState: DisplayNameState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-green px-5 py-3 font-semibold text-white shadow-lift transition hover:bg-[#284f32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:opacity-60"
    >
      {pending ? "Saving..." : "Continue"}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default function DisplayNamePrompt() {
  const [state, formAction] = useFormState(setDisplayName, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-white/70 p-5 text-center shadow-soft backdrop-blur-sm sm:p-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber-deep">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight text-green">
          Welcome to Choreboard
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">
          Pick the name that should appear beside the chores you check off.
        </p>
        <form
          action={formAction}
          className="mt-6 flex flex-col gap-3 text-left"
        >
          <label
            htmlFor="display_name"
            className="text-sm font-semibold text-ink"
          >
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={60}
            autoComplete="name"
            placeholder="e.g. Alex"
            className="min-h-12 rounded-xl border border-border bg-white/80 px-4 py-3 text-ink placeholder:text-muted focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
          />
          {state.error ? (
            <p className="text-sm font-medium text-rose" role="alert">
              {state.error}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </section>
    </main>
  );
}
