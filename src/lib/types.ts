import type { Database } from "@/lib/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Completion = Database["public"]["Tables"]["completions"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** A completion joined with the display name of whoever checked it. */
export type CompletionWithChecker = Completion & {
  checker_name: string | null;
};
