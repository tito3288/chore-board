"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAYS, type WeekdayIndex } from "@/lib/schedule";

export type TaskActionState = { error?: string; ok?: boolean };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function parseSchedule(formData: FormData):
  | {
      ok: true;
      scheduleType: "recurring" | "one_off";
      weekdays: WeekdayIndex[];
      oneOffDate: string | null;
    }
  | { ok: false; error: string } {
  const scheduleType =
    String(formData.get("schedule_type") ?? "recurring") === "one_off"
      ? "one_off"
      : "recurring";

  if (scheduleType === "one_off") {
    const oneOffDate = String(formData.get("one_off_date") ?? "").trim();
    if (!oneOffDate) {
      return { ok: false, error: "Pick a date for this one-off chore." };
    }
    return {
      ok: true,
      scheduleType,
      weekdays: [],
      oneOffDate,
    };
  }

  const parsed = formData
    .getAll("weekdays")
    .map((value) => Number(value))
    .filter((value): value is WeekdayIndex =>
      Number.isInteger(value) && value >= 0 && value <= 6,
    );

  const weekdays =
    parsed.length > 0 ? parsed : WEEKDAYS.map((weekday) => weekday.index);

  return {
    ok: true,
    scheduleType,
    weekdays,
    oneOffDate: null,
  };
}

/** Adds a task to the bottom of the list (next sort_order). */
export async function addTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  if (!title) {
    return { error: "Enter a task title." };
  }

  const schedule = parseSchedule(formData);
  if (!schedule.ok) {
    return { error: schedule.error };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You're not signed in." };
  }

  // Next sort_order = max existing + 1 (keeps ordering stable and unique).
  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("tasks")
    .insert({
      title,
      notes,
      sort_order: nextSort,
      schedule_type: schedule.scheduleType,
      weekdays: schedule.weekdays,
      one_off_date: schedule.oneOffDate,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Edits a task's title and/or persistent notes. */
export async function updateTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  if (!id) {
    return { error: "Missing task id." };
  }
  if (!title) {
    return { error: "Title can't be empty." };
  }

  const schedule = parseSchedule(formData);
  if (!schedule.ok) {
    return { error: schedule.error };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You're not signed in." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      notes,
      schedule_type: schedule.scheduleType,
      weekdays: schedule.weekdays,
      one_off_date: schedule.oneOffDate,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Soft-deletes a task (sets is_active = false) so history stays valid. */
export async function deleteTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from("tasks").update({ is_active: false }).eq("id", id);
  revalidatePath("/");
}

/** Moves a task up or down by swapping sort_order with its active neighbour. */
export async function moveTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!tasks) return;

  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= tasks.length) return;

  const current = tasks[idx];
  const neighbour = tasks[swapIdx];

  // Swap the two sort_order values.
  await supabase
    .from("tasks")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", current.id);
  await supabase
    .from("tasks")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbour.id);

  revalidatePath("/");
}
