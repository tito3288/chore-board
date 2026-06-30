"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInWithEmail, type SignInState } from "./actions";

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send magic link"}
    </button>
  );
}

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useFormState(signInWithEmail, initialState);

  if (state.sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm">
          We sent a magic sign-in link to{" "}
          <span className="font-medium">{state.email}</span>. Open it on this
          device to finish signing in.
        </p>
      </div>
    );
  }

  const error = state.error ?? initialError;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-gray-700">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.email}
        className="rounded-lg border border-gray-300 px-3 py-2.5 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
