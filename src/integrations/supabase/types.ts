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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      crowdsourced_reports: {
        Row: {
          anonymous_user_id: string
          created_at: string
          dve_score: number | null
          fuel_type: string
          id: string
          is_rejected: boolean | null
          is_verified: boolean | null
          location_factor: number | null
          rejection_reason: string | null
          station_id: string
          time_decay_factor: number | null
          timestamp: string
          trust_score_at_submission: number | null
          user_lat: number
          user_lon: number
        }
        Insert: {
          anonymous_user_id: string
          created_at?: string
          dve_score?: number | null
          fuel_type: string
          id?: string
          is_rejected?: boolean | null
          is_verified?: boolean | null
          location_factor?: number | null
          rejection_reason?: string | null
          station_id: string
          time_decay_factor?: number | null
          timestamp?: string
          trust_score_at_submission?: number | null
          user_lat: number
          user_lon: number
        }
        Update: {
          anonymous_user_id?: string
          created_at?: string
          dve_score?: number | null
          fuel_type?: string
          id?: string
          is_rejected?: boolean | null
          is_verified?: boolean | null
          location_factor?: number | null
          rejection_reason?: string | null
          station_id?: string
          time_decay_factor?: number | null
          timestamp?: string
          trust_score_at_submission?: number | null
          user_lat?: number
          user_lon?: number
        }
        Relationships: [
          {
            foreignKeyName: "crowdsourced_reports_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "fuel_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_stations: {
        Row: {
          address: string
          created_at: string
          id: string
          lat: number | null
          legacy_id: number | null
          lon: number | null
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          lat?: number | null
          legacy_id?: number | null
          lon?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          lat?: number | null
          legacy_id?: number | null
          lon?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_trust_scores: {
        Row: {
          anonymous_user_id: string
          correct_reports: number
          created_at: string
          id: string
          incorrect_reports: number
          total_reports: number
          trust_score: number
          updated_at: string
        }
        Insert: {
          anonymous_user_id: string
          correct_reports?: number
          created_at?: string
          id?: string
          incorrect_reports?: number
          total_reports?: number
          trust_score?: number
          updated_at?: string
        }
        Update: {
          anonymous_user_id?: string
          correct_reports?: number
          created_at?: string
          id?: string
          incorrect_reports?: number
          total_reports?: number
          trust_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      verified_fuel_data: {
        Row: {
          confidence_score: number
          created_at: string
          fuel_type: string
          id: string
          is_available: boolean
          last_verified_at: string
          station_id: string
          updated_at: string
          verified_by_count: number
        }
        Insert: {
          confidence_score: number
          created_at?: string
          fuel_type: string
          id?: string
          is_available?: boolean
          last_verified_at?: string
          station_id: string
          updated_at?: string
          verified_by_count?: number
        }
        Update: {
          confidence_score?: number
          created_at?: string
          fuel_type?: string
          id?: string
          is_available?: boolean
          last_verified_at?: string
          station_id?: string
          updated_at?: string
          verified_by_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "verified_fuel_data_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "fuel_stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
