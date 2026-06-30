"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/week";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Checks a task for the current week: inserts a completion attributed to the
 * acting user. If a completion already exists for this (task, week) it is a
 * no-op (the UNIQUE constraint guards against duplicates).
 */
export async function checkTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!taskId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const weekStart = getWeekStart(new Date());

  const { error } = await supabase.from("completions").insert({
    task_id: taskId,
    week_start: weekStart,
    completed_by: user.id,
  });

  // Ignore unique-violation races (already checked); surface anything else.
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

/**
 * Unchecks a task: deletes ONLY this week's completion row for the task.
 * Past weeks' completions are never touched (non-destructive reset).
 */
export async function uncheckTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!taskId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const weekStart = getWeekStart(new Date());

  await supabase
    .from("completions")
    .delete()
    .eq("task_id", taskId)
    .eq("week_start", weekStart);

  revalidatePath("/");
}

/** Saves the optional per-completion note for this week's check-off. */
export async function setCompletionNote(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!taskId) return;

  const noteRaw = String(formData.get("note") ?? "").trim();
  const note = noteRaw.length > 0 ? noteRaw : null;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const weekStart = getWeekStart(new Date());

  await supabase
    .from("completions")
    .update({ note })
    .eq("task_id", taskId)
    .eq("week_start", weekStart);

  revalidatePath("/");
}
