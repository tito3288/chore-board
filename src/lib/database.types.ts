/**
 * Hand-written database types matching the SQL migration in
 * `supabase/migrations`. Keep in sync with the schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          notes: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          notes?: string | null;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          notes?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      completions: {
        Row: {
          id: string;
          task_id: string;
          week_start: string;
          completed_by: string;
          completed_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          week_start: string;
          completed_by: string;
          completed_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          week_start?: string;
          completed_by?: string;
          completed_at?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "completions_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "completions_completed_by_fkey";
            columns: ["completed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
