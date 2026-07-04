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

function occurrenceDateFromForm(formData: FormData): string | null {
  const occurrenceDate = String(formData.get("occurrence_date") ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate) ? occurrenceDate : null;
}

/**
 * Checks a task for a specific calendar date. If a completion already exists
 * for this (task, date) it is a no-op (the UNIQUE index guards duplicates).
 */
export async function checkTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  const occurrenceDate = occurrenceDateFromForm(formData);
  if (!taskId || !occurrenceDate) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const weekStart = getWeekStart(new Date(`${occurrenceDate}T12:00:00Z`));

  const { error } = await supabase.from("completions").insert({
    task_id: taskId,
    week_start: weekStart,
    occurrence_date: occurrenceDate,
    completed_by: user.id,
  });

  // Ignore unique-violation races (already checked); surface anything else.
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

/**
 * Unchecks a task occurrence: deletes ONLY that date's completion row.
 * Past dates' completions are never touched (non-destructive reset).
 */
export async function uncheckTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  const occurrenceDate = occurrenceDateFromForm(formData);
  if (!taskId || !occurrenceDate) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("completions")
    .delete()
    .eq("task_id", taskId)
    .eq("occurrence_date", occurrenceDate);

  revalidatePath("/");
}

/** Saves the optional per-completion note for this date's check-off. */
export async function setCompletionNote(formData: FormData): Promise<void> {
  const taskId = String(formData.get("task_id") ?? "");
  const occurrenceDate = occurrenceDateFromForm(formData);
  if (!taskId || !occurrenceDate) return;

  const noteRaw = String(formData.get("note") ?? "").trim();
  const note = noteRaw.length > 0 ? noteRaw : null;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("completions")
    .update({ note })
    .eq("task_id", taskId)
    .eq("occurrence_date", occurrenceDate);

  revalidatePath("/");
}
