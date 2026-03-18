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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          created_at: string
          development_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          development_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          development_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocks_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
        ]
      }
      developments: {
        Row: {
          address_line: string | null
          city: string | null
          created_at: string
          delivery_forecast_at: string | null
          id: string
          launch_status: string | null
          name: string
          neighborhood: string | null
          organization_id: string
          slug: string
          state: string | null
          total_units: number | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          delivery_forecast_at?: string | null
          id?: string
          launch_status?: string | null
          name: string
          neighborhood?: string | null
          organization_id: string
          slug: string
          state?: string | null
          total_units?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          delivery_forecast_at?: string | null
          id?: string
          launch_status?: string | null
          name?: string
          neighborhood?: string | null
          organization_id?: string
          slug?: string
          state?: string | null
          total_units?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_events: {
        Row: {
          contract_id: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          sort_order: number | null
          stage_key: string
          title: string
          unit_id: string
          visible_to_customer: boolean | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          sort_order?: number | null
          stage_key: string
          title: string
          unit_id: string
          visible_to_customer?: boolean | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          sort_order?: number | null
          stage_key?: string
          title?: string
          unit_id?: string
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sales_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          active: boolean
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          legal_name: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          legal_name?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          legal_name?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          paid_amount: number
          paid_at: string
          payment_method: string | null
          receivable_id: string
          reference_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount: number
          paid_at: string
          payment_method?: string | null
          receivable_id: string
          reference_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string
          payment_method?: string | null
          receivable_id?: string
          reference_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          cpf_last4: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          cpf_last4?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          cpf_last4?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          charge_type: string
          contract_id: string
          created_at: string
          discount_amount: number | null
          due_date: string
          id: string
          interest_amount: number | null
          notes: string | null
          original_amount: number
          paid_at: string | null
          sequence_no: number | null
          status: string
          title: string
          total_amount: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          charge_type: string
          contract_id: string
          created_at?: string
          discount_amount?: number | null
          due_date: string
          id?: string
          interest_amount?: number | null
          notes?: string | null
          original_amount: number
          paid_at?: string | null
          sequence_no?: number | null
          status?: string
          title: string
          total_amount: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          charge_type?: string
          contract_id?: string
          created_at?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          interest_amount?: number | null
          notes?: string | null
          original_amount?: number
          paid_at?: string | null
          sequence_no?: number | null
          status?: string
          title?: string
          total_amount?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sales_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_contracts: {
        Row: {
          bank_name: string | null
          contract_number: string
          contract_status: string
          created_at: string
          down_payment_amount: number | null
          financed_amount: number | null
          financing_status: string | null
          handover_at: string | null
          handover_forecast_at: string | null
          id: string
          organization_id: string
          signed_at: string | null
          total_contract_value: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          contract_number: string
          contract_status?: string
          created_at?: string
          down_payment_amount?: number | null
          financed_amount?: number | null
          financing_status?: string | null
          handover_at?: string | null
          handover_forecast_at?: string | null
          id?: string
          organization_id: string
          signed_at?: string | null
          total_contract_value: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          contract_number?: string
          contract_status?: string
          created_at?: string
          down_payment_amount?: number | null
          financed_amount?: number | null
          financing_status?: string | null
          handover_at?: string | null
          handover_forecast_at?: string | null
          id?: string
          organization_id?: string
          signed_at?: string | null
          total_contract_value?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_memberships: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_primary: boolean
          membership_type: string
          purchased_at: string | null
          unit_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_primary?: boolean
          membership_type: string
          purchased_at?: string | null
          unit_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_primary?: boolean
          membership_type?: string
          purchased_at?: string | null
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          block_id: string
          code: string
          commercial_status: string | null
          created_at: string
          floor_label: string | null
          handed_over_at: string | null
          id: string
          parking_spots: number | null
          private_area_m2: number | null
          typology: string | null
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          block_id: string
          code: string
          commercial_status?: string | null
          created_at?: string
          floor_label?: string | null
          handed_over_at?: string | null
          id?: string
          parking_spots?: number | null
          private_area_m2?: number | null
          typology?: string | null
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          block_id?: string
          code?: string
          commercial_status?: string | null
          created_at?: string
          floor_label?: string | null
          handed_over_at?: string | null
          id?: string
          parking_spots?: number | null
          private_area_m2?: number | null
          typology?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "customer"
        | "org_admin"
        | "finance_agent"
        | "support_agent"
        | "inspection_agent"
        | "document_agent"
        | "executive_viewer"
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
    Enums: {
      app_role: [
        "customer",
        "org_admin",
        "finance_agent",
        "support_agent",
        "inspection_agent",
        "document_agent",
        "executive_viewer",
      ],
    },
  },
} as const
