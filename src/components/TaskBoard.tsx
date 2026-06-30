"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AddTaskForm from "@/components/AddTaskForm";
import TaskItem from "@/components/TaskItem";
import { createClient } from "@/lib/supabase/client";
import type { CompletionWithChecker, Task } from "@/lib/types";

export default function TaskBoard({
  tasks,
  completions,
}: {
  tasks: Task[];
  completions: CompletionWithChecker[];
}) {
  const router = useRouter();

  // Realtime: when either table changes (from this or the other session),
  // re-fetch the server data so the joined view stays the single source of truth.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("choreboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const completionByTask = useMemo(() => {
    const map = new Map<string, CompletionWithChecker>();
    for (const c of completions) {
      map.set(c.task_id, c);
    }
    return map;
  }, [completions]);

  const allDone =
    tasks.length > 0 &&
    tasks.every((task) => completionByTask.has(task.id));

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm />

      {allDone ? (
        <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-700">
          All chores done this week. Nice work! 🎉
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No chores yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              completion={completionByTask.get(task.id)}
              isFirst={i === 0}
              isLast={i === tasks.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
