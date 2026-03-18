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
      audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
          metadata?: Json
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
          metadata?: Json
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      calendar_custom_events: {
        Row: {
          created_at: string
          detail: string | null
          ends_at: string | null
          event_type: string
          id: string
          organization_id: string
          starts_at: string
          title: string
          unit_id: string | null
          visible_to_customer: boolean
        }
        Insert: {
          created_at?: string
          detail?: string | null
          ends_at?: string | null
          event_type: string
          id?: string
          organization_id: string
          starts_at: string
          title: string
          unit_id?: string | null
          visible_to_customer?: boolean
        }
        Update: {
          created_at?: string
          detail?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          organization_id?: string
          starts_at?: string
          title?: string
          unit_id?: string | null
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "calendar_custom_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_custom_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      document_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          scope: string
          sort_order: number
          updated_at: string
          visible_to_customer: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          scope?: string
          sort_order?: number
          updated_at?: string
          visible_to_customer?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          scope?: string
          sort_order?: number
          updated_at?: string
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bucket: string
          category: string
          contract_id: string | null
          created_at: string
          development_id: string | null
          document_category_id: string | null
          file_name: string
          file_path: string
          id: string
          inspection_booking_id: string | null
          mime_type: string | null
          organization_id: string
          receivable_id: string | null
          service_request_id: string | null
          size_bytes: number | null
          ticket_id: string | null
          title: string
          unit_id: string | null
          uploaded_by: string | null
          version_no: number
          visible_to_customer: boolean
        }
        Insert: {
          bucket: string
          category: string
          contract_id?: string | null
          created_at?: string
          development_id?: string | null
          document_category_id?: string | null
          file_name: string
          file_path: string
          id?: string
          inspection_booking_id?: string | null
          mime_type?: string | null
          organization_id: string
          receivable_id?: string | null
          service_request_id?: string | null
          size_bytes?: number | null
          ticket_id?: string | null
          title: string
          unit_id?: string | null
          uploaded_by?: string | null
          version_no?: number
          visible_to_customer?: boolean
        }
        Update: {
          bucket?: string
          category?: string
          contract_id?: string | null
          created_at?: string
          development_id?: string | null
          document_category_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          inspection_booking_id?: string | null
          mime_type?: string | null
          organization_id?: string
          receivable_id?: string | null
          service_request_id?: string | null
          size_bytes?: number | null
          ticket_id?: string | null
          title?: string
          unit_id?: string | null
          uploaded_by?: string | null
          version_no?: number
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sales_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_articles: {
        Row: {
          active: boolean
          audience: string
          body_md: string
          created_at: string
          faq_category_id: string | null
          id: string
          organization_id: string
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience: string
          body_md: string
          created_at?: string
          faq_category_id?: string | null
          id?: string
          organization_id: string
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string
          body_md?: string
          created_at?: string
          faq_category_id?: string | null
          id?: string
          organization_id?: string
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_articles_faq_category_id_fkey"
            columns: ["faq_category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "faq_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_bookings: {
        Row: {
          booked_by: string | null
          booking_status: string
          checklist_status: string | null
          created_at: string
          customer_notes: string | null
          id: string
          inspection_type_id: string
          internal_notes: string | null
          organization_id: string
          scheduled_at: string | null
          slot_id: string | null
          term_signed_at: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          booked_by?: string | null
          booking_status: string
          checklist_status?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          inspection_type_id: string
          internal_notes?: string | null
          organization_id: string
          scheduled_at?: string | null
          slot_id?: string | null
          term_signed_at?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          booked_by?: string | null
          booking_status?: string
          checklist_status?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          inspection_type_id?: string
          internal_notes?: string | null
          organization_id?: string
          scheduled_at?: string | null
          slot_id?: string | null
          term_signed_at?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_bookings_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "inspection_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_report_items: {
        Row: {
          id: string
          inspection_booking_id: string
          item_name: string
          notes: string | null
          result_status: string
          room_name: string
          sort_order: number
        }
        Insert: {
          id?: string
          inspection_booking_id: string
          item_name: string
          notes?: string | null
          result_status: string
          room_name: string
          sort_order?: number
        }
        Update: {
          id?: string
          inspection_booking_id?: string
          item_name?: string
          notes?: string | null
          result_status?: string
          room_name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_report_items_inspection_booking_id_fkey"
            columns: ["inspection_booking_id"]
            isOneToOne: false
            referencedRelation: "inspection_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_slots: {
        Row: {
          capacity: number
          created_at: string
          development_id: string
          ends_at: string
          id: string
          inspection_type_id: string
          location: string | null
          organization_id: string
          starts_at: string
          status: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          development_id: string
          ends_at: string
          id?: string
          inspection_type_id: string
          location?: string | null
          organization_id: string
          starts_at: string
          status: string
        }
        Update: {
          capacity?: number
          created_at?: string
          development_id?: string
          ends_at?: string
          id?: string
          inspection_type_id?: string
          location?: string | null
          organization_id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_slots_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_slots_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_types: {
        Row: {
          active: boolean
          audience: string | null
          code: string | null
          created_at: string
          default_duration_minutes: number | null
          description: string | null
          id: string
          name: string
          organization_id: string
          requires_term_signature: boolean | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string | null
          code?: string | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          requires_term_signature?: boolean | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string | null
          code?: string | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          requires_term_signature?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_types_organization_id_fkey"
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
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          id: string
          knowledge_source_id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          knowledge_source_id: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          knowledge_source_id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          active: boolean
          created_at: string
          document_id: string | null
          id: string
          organization_id: string
          source_type: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          document_id?: string | null
          id?: string
          organization_id: string
          source_type: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          document_id?: string | null
          id?: string
          organization_id?: string
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_slug: string | null
          created_at: string
          development_id: string | null
          email: string | null
          full_name: string
          id: string
          interest_subject: string | null
          message: string | null
          organization_id: string
          phone: string | null
          source_type: string
          status: string
        }
        Insert: {
          campaign_slug?: string | null
          created_at?: string
          development_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          interest_subject?: string | null
          message?: string | null
          organization_id: string
          phone?: string | null
          source_type: string
          status?: string
        }
        Update: {
          campaign_slug?: string | null
          created_at?: string
          development_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          interest_subject?: string | null
          message?: string | null
          organization_id?: string
          phone?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          organization_id: string
          read_at: string | null
          title: string
          type: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          brand_primary_color: string | null
          brand_secondary_color: string | null
          created_at: string
          id: string
          legal_name: string | null
          logo_path: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_path?: string | null
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
      platform_admins: {
        Row: {
          active: boolean
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      service_catalog: {
        Row: {
          active: boolean
          category_name: string | null
          description: string | null
          estimated_delivery_days: number | null
          id: string
          name: string
          organization_id: string
          price_label: string | null
          service_code: string | null
          sort_order: number
          visible_to_customer: boolean | null
        }
        Insert: {
          active?: boolean
          category_name?: string | null
          description?: string | null
          estimated_delivery_days?: number | null
          id?: string
          name: string
          organization_id: string
          price_label?: string | null
          service_code?: string | null
          sort_order?: number
          visible_to_customer?: boolean | null
        }
        Update: {
          active?: boolean
          category_name?: string | null
          description?: string | null
          estimated_delivery_days?: number | null
          id?: string
          name?: string
          organization_id?: string
          price_label?: string | null
          service_code?: string | null
          sort_order?: number
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string
          quoted_price: number | null
          request_status: string
          requested_by: string
          service_catalog_id: string | null
          service_name_snapshot: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          quoted_price?: number | null
          request_status: string
          requested_by: string
          service_catalog_id?: string | null
          service_name_snapshot?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          quoted_price?: number | null
          request_status?: string
          requested_by?: string
          service_catalog_id?: string | null
          service_name_snapshot?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          active: boolean
          audience: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_subcategories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          sort_order: number
          ticket_category_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          sort_order?: number
          ticket_category_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
          ticket_category_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_subcategories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_subcategories_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category_name: string
          closed_at: string | null
          description: string
          estimated_deadline: string | null
          id: string
          internal_status: string
          opened_at: string
          opened_by: string
          organization_id: string
          priority: string
          public_status: string
          room_name: string | null
          ticket_category_id: string | null
          ticket_subcategory_id: string | null
          unit_id: string
          updated_at: string
          warranty_rule_id: string | null
          warranty_status: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_name: string
          closed_at?: string | null
          description: string
          estimated_deadline?: string | null
          id?: string
          internal_status: string
          opened_at?: string
          opened_by: string
          organization_id: string
          priority: string
          public_status: string
          room_name?: string | null
          ticket_category_id?: string | null
          ticket_subcategory_id?: string | null
          unit_id: string
          updated_at?: string
          warranty_rule_id?: string | null
          warranty_status?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_name?: string
          closed_at?: string | null
          description?: string
          estimated_deadline?: string | null
          id?: string
          internal_status?: string
          opened_at?: string
          opened_by?: string
          organization_id?: string
          priority?: string
          public_status?: string
          room_name?: string | null
          ticket_category_id?: string | null
          ticket_subcategory_id?: string | null
          unit_id?: string
          updated_at?: string
          warranty_rule_id?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_subcategory_id_fkey"
            columns: ["ticket_subcategory_id"]
            isOneToOne: false
            referencedRelation: "ticket_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_warranty_rule_id_fkey"
            columns: ["warranty_rule_id"]
            isOneToOne: false
            referencedRelation: "warranty_rules"
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
      warranty_rules: {
        Row: {
          active: boolean
          category_name: string
          contract_clause: string | null
          coverage_condition: string | null
          created_at: string
          deadline_months: number
          id: string
          inactive_reason: string | null
          organization_id: string
          priority_hint: string | null
          recommendation: string | null
          room_name: string | null
          service_type: string | null
          visible_to_customer: boolean | null
        }
        Insert: {
          active?: boolean
          category_name: string
          contract_clause?: string | null
          coverage_condition?: string | null
          created_at?: string
          deadline_months: number
          id?: string
          inactive_reason?: string | null
          organization_id: string
          priority_hint?: string | null
          recommendation?: string | null
          room_name?: string | null
          service_type?: string | null
          visible_to_customer?: boolean | null
        }
        Update: {
          active?: boolean
          category_name?: string
          contract_clause?: string | null
          coverage_condition?: string | null
          created_at?: string
          deadline_months?: number
          id?: string
          inactive_reason?: string | null
          organization_id?: string
          priority_hint?: string | null
          recommendation?: string | null
          room_name?: string | null
          service_type?: string | null
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_platform_admin_status: { Args: never; Returns: boolean }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_unit_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
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
