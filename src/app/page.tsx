import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskBoard from "@/components/TaskBoard";
import type { CompletionWithChecker, Completion, Profile, Task } from "@/lib/types";
import { getWeekStart } from "@/lib/week";
import { formatWeekLabel } from "@/lib/format";
import { signOut } from "./actions";
import DisplayNamePrompt from "./DisplayNamePrompt";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  // First sign-in (or no name yet) — prompt once for a display name.
  if (!profile || !profile.display_name) {
    return <DisplayNamePrompt />;
  }

  const weekStart = getWeekStart(new Date());

  const [{ data: tasks }, { data: completionsRaw }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("completions").select("*").eq("week_start", weekStart),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const nameById = new Map<string, string | null>(
    ((profiles as Pick<Profile, "id" | "display_name">[]) ?? []).map((p) => [
      p.id,
      p.display_name,
    ]),
  );

  const activeTasks = (tasks as Task[]) ?? [];

  const completions: CompletionWithChecker[] = (
    (completionsRaw as Completion[]) ?? []
  ).map((c) => ({
    ...c,
    checker_name: nameById.get(c.completed_by) ?? null,
  }));

  const activeTaskIds = new Set(activeTasks.map((t) => t.id));
  const doneCount = completions.filter((c) =>
    activeTaskIds.has(c.task_id),
  ).length;
  const totalCount = activeTasks.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Choreboard</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{profile.display_name}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-2.5 py-1 transition hover:bg-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
          <span className="font-medium text-gray-700">
            {formatWeekLabel(weekStart)}
          </span>
          <span
            className={
              totalCount > 0 && doneCount === totalCount
                ? "font-semibold text-green-600"
                : "font-semibold text-gray-700"
            }
          >
            {doneCount}/{totalCount} done
          </span>
        </div>
      </header>

      <TaskBoard tasks={activeTasks} completions={completions} />
    </main>
  );
}
