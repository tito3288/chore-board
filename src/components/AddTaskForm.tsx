"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addTask, type TaskActionState } from "@/app/tasks/actions";

const initialState: TaskActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add task"}
    </button>
  );
}

export default function AddTaskForm() {
  const [state, formAction] = useFormState(addTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3"
    >
      <input
        name="title"
        type="text"
        required
        maxLength={200}
        placeholder="Add a chore…"
        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <input
        name="notes"
        type="text"
        maxLength={500}
        placeholder="Optional note"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <div className="flex items-center justify-between">
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <SubmitButton />
      </div>
    </form>
  );
}
