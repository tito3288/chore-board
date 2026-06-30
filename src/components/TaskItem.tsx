"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  deleteTask,
  moveTask,
  updateTask,
  type TaskActionState,
} from "@/app/tasks/actions";
import {
  checkTask,
  setCompletionNote,
  uncheckTask,
} from "@/app/completions/actions";
import { formatCheckTime } from "@/lib/format";
import type { CompletionWithChecker, Task } from "@/lib/types";

const initialState: TaskActionState = {};

export default function TaskItem({
  task,
  completion,
  isFirst,
  isLast,
}: {
  task: Task;
  completion?: CompletionWithChecker;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction] = useFormState(updateTask, initialState);

  useEffect(() => {
    if (editState.ok) {
      setEditing(false);
    }
  }, [editState.ok]);

  const checked = Boolean(completion);

  if (editing) {
    return (
      <li className="rounded-xl border border-gray-200 bg-white p-3">
        <form action={editAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={task.id} />
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={task.title}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <input
            name="notes"
            type="text"
            maxLength={500}
            placeholder="Optional task note"
            defaultValue={task.notes ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          {editState.error ? (
            <p className="text-sm text-red-600" role="alert">
              {editState.error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <CheckButton taskId={task.id} checked={checked} />

        <div className="min-w-0 flex-1">
          <p
            className={`font-medium ${
              checked ? "text-gray-400 line-through" : ""
            }`}
          >
            {task.title}
          </p>
          {task.notes ? (
            <p className="mt-0.5 text-sm text-gray-500">{task.notes}</p>
          ) : null}

          {completion ? (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-xs text-gray-500">
                Checked by{" "}
                <span className="font-medium text-gray-700">
                  {completion.checker_name ?? "someone"}
                </span>{" "}
                · {formatCheckTime(completion.completed_at)}
              </p>
              <CompletionNote
                key={`${completion.id}:${completion.note ?? ""}`}
                taskId={task.id}
                note={completion.note}
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <MoveButton id={task.id} direction="up" disabled={isFirst} />
          <MoveButton id={task.id} direction="down" disabled={isLast} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit task"
            className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            Edit
          </button>
          <form action={deleteTask}>
            <input type="hidden" name="id" value={task.id} />
            <button
              type="submit"
              aria-label="Delete task"
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function CheckButton({
  taskId,
  checked,
}: {
  taskId: string;
  checked: boolean;
}) {
  return (
    <form action={checked ? uncheckTask : checkTask}>
      <input type="hidden" name="task_id" value={taskId} />
      <button
        type="submit"
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? "Uncheck task" : "Check task"}
        className={`flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold transition ${
          checked
            ? "border-green-600 bg-green-600 text-white"
            : "border-gray-300 bg-white text-transparent hover:border-slate-500"
        }`}
      >
        ✓
      </button>
    </form>
  );
}

function CompletionNote({
  taskId,
  note,
}: {
  taskId: string;
  note: string | null;
}) {
  return (
    <form action={setCompletionNote} className="mt-1.5 flex items-center gap-2">
      <input type="hidden" name="task_id" value={taskId} />
      <input
        name="note"
        type="text"
        maxLength={500}
        defaultValue={note ?? ""}
        placeholder="Add a note about this check-off…"
        className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
      >
        Save note
      </button>
    </form>
  );
}

function MoveButton({
  id,
  direction,
  disabled,
}: {
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveTask}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={direction === "up" ? "Move up" : "Move down"}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}
