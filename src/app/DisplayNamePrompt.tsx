"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setDisplayName, type DisplayNameState } from "./actions";

const initialState: DisplayNameState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Continue"}
    </button>
  );
}

export default function DisplayNamePrompt() {
  const [state, formAction] = useFormState(setDisplayName, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Choreboard</h1>
        <p className="mt-1 text-gray-600">
          What should we call you? This is shown next to chores you check off.
        </p>
      </header>
      <form action={formAction} className="flex flex-col gap-3">
        <label
          htmlFor="display_name"
          className="text-sm font-medium text-gray-700"
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
          className="rounded-lg border border-gray-300 px-3 py-2.5 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </main>
  );
}
