export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      fire_stations: {
        Row: {
          contact_phone: string | null
          created_at: string
          id: string
          latitude: number
          location: string
          longitude: number
          name: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          latitude: number
          location: string
          longitude: number
          name: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          latitude?: number
          location?: string
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      incident_assignments: {
        Row: {
          assigned_at: string
          id: string
          incident_id: string
          responder_id: string
          status_note: string | null
        }
        Insert: {
          assigned_at?: string
          id?: string
          incident_id: string
          responder_id: string
          status_note?: string | null
        }
        Update: {
          assigned_at?: string
          id?: string
          incident_id?: string
          responder_id?: string
          status_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_assignments_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          description: string | null
          id: string
          landmark: string | null
          latitude: number | null
          location_accuracy_m: number | null
          longitude: number | null
          phone: string | null
          photo_path: string | null
          reported_at: string
          reporter_id: string
          severity: Database["public"]["Enums"]["fire_severity"]
          station_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          tracking_code: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          landmark?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          longitude?: number | null
          phone?: string | null
          photo_path?: string | null
          reported_at?: string
          reporter_id: string
          severity: Database["public"]["Enums"]["fire_severity"]
          station_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          tracking_code: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          landmark?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          longitude?: number | null
          phone?: string | null
          photo_path?: string | null
          reported_at?: string
          reporter_id?: string
          severity?: Database["public"]["Enums"]["fire_severity"]
          station_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "fire_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          station_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role: string
          station_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "fire_stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_incident_status: {
        Args: { p_tracking_code: string }
        Returns: {
          reported_at: string
          severity: Database["public"]["Enums"]["fire_severity"]
          station_name: string
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }[]
      }
      is_staff: { Args: { p_uid: string }; Returns: boolean }
      nearest_station: {
        Args: { p_lat: number; p_lng: number }
        Returns: string
      }
    }
    Enums: {
      fire_severity: "small" | "spreading" | "major"
      incident_status: "received" | "verified" | "dispatched" | "resolved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fire_severity: ["small", "spreading", "major"],
      incident_status: ["received", "verified", "dispatched", "resolved"],
    },
  },
} as const
