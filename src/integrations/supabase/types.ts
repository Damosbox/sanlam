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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      broker_clients: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          broker_id: string
          client_id: string
          id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          broker_id: string
          client_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          broker_id?: string
          client_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_clients_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_clients_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_settings: {
        Row: {
          broker_id: string
          created_at: string
          id: string
          otp_verification_enabled: boolean
          updated_at: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          id?: string
          otp_verification_enabled?: boolean
          updated_at?: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          id?: string
          otp_verification_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          ai_confidence: number | null
          assigned_broker_id: string | null
          broker_notes: string | null
          claim_type: Database["public"]["Enums"]["claim_type"]
          cost_estimation: number | null
          created_at: string
          damages: Json | null
          description: string | null
          id: string
          incident_date: string | null
          location: string | null
          ocr_data: Json | null
          photos: string[] | null
          policy_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          assigned_broker_id?: string | null
          broker_notes?: string | null
          claim_type: Database["public"]["Enums"]["claim_type"]
          cost_estimation?: number | null
          created_at?: string
          damages?: Json | null
          description?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          ocr_data?: Json | null
          photos?: string[] | null
          policy_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          assigned_broker_id?: string | null
          broker_notes?: string | null
          claim_type?: Database["public"]["Enums"]["claim_type"]
          cost_estimation?: number | null
          created_at?: string
          damages?: Json | null
          description?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          ocr_data?: Json | null
          photos?: string[] | null
          policy_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_additional_data: {
        Row: {
          address: string | null
          birth_date: string | null
          children_count: number | null
          city: string | null
          client_id: string
          country: string | null
          created_at: string | null
          current_insurer: string | null
          custom_fields: Json | null
          drivers_license_date: string | null
          employer: string | null
          existing_insurances: string[] | null
          gender: string | null
          has_drivers_license: boolean | null
          id: string
          marital_status: string | null
          monthly_income_range: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          profession: string | null
          property_owner: boolean | null
          property_type: string | null
          referral_source: string | null
          updated_at: string | null
          vehicle_count: number | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          children_count?: number | null
          city?: string | null
          client_id: string
          country?: string | null
          created_at?: string | null
          current_insurer?: string | null
          custom_fields?: Json | null
          drivers_license_date?: string | null
          employer?: string | null
          existing_insurances?: string[] | null
          gender?: string | null
          has_drivers_license?: boolean | null
          id?: string
          marital_status?: string | null
          monthly_income_range?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          profession?: string | null
          property_owner?: boolean | null
          property_type?: string | null
          referral_source?: string | null
          updated_at?: string | null
          vehicle_count?: number | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          children_count?: number | null
          city?: string | null
          client_id?: string
          country?: string | null
          created_at?: string | null
          current_insurer?: string | null
          custom_fields?: Json | null
          drivers_license_date?: string | null
          employer?: string | null
          existing_insurances?: string[] | null
          gender?: string | null
          has_drivers_license?: boolean | null
          id?: string
          marital_status?: string | null
          monthly_income_range?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          profession?: string | null
          property_owner?: boolean | null
          property_type?: string | null
          referral_source?: string | null
          updated_at?: string | null
          vehicle_count?: number | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          broker_id: string
          client_id: string
          created_at: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_size: number | null
          file_url: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          broker_id: string
          client_id: string
          created_at?: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          broker_id?: string
          client_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      client_kyc_compliance: {
        Row: {
          aml_notes: string | null
          aml_risk_level: string | null
          aml_verified: boolean | null
          aml_verified_at: string | null
          client_id: string
          created_at: string
          id: string
          identity_document_number: string | null
          identity_document_type: string | null
          identity_expiry_date: string | null
          identity_verified: boolean | null
          is_ppe: boolean | null
          ppe_country: string | null
          ppe_position: string | null
          ppe_relationship: string | null
          ppe_screening_date: string | null
          ppe_screening_reference: string | null
          ppe_screening_source: string | null
          ppe_screening_status: string | null
          updated_at: string
        }
        Insert: {
          aml_notes?: string | null
          aml_risk_level?: string | null
          aml_verified?: boolean | null
          aml_verified_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          identity_document_number?: string | null
          identity_document_type?: string | null
          identity_expiry_date?: string | null
          identity_verified?: boolean | null
          is_ppe?: boolean | null
          ppe_country?: string | null
          ppe_position?: string | null
          ppe_relationship?: string | null
          ppe_screening_date?: string | null
          ppe_screening_reference?: string | null
          ppe_screening_source?: string | null
          ppe_screening_status?: string | null
          updated_at?: string
        }
        Update: {
          aml_notes?: string | null
          aml_risk_level?: string | null
          aml_verified?: boolean | null
          aml_verified_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          identity_document_number?: string | null
          identity_document_type?: string | null
          identity_expiry_date?: string | null
          identity_verified?: boolean | null
          is_ppe?: boolean | null
          ppe_country?: string | null
          ppe_position?: string | null
          ppe_relationship?: string | null
          ppe_screening_date?: string | null
          ppe_screening_reference?: string | null
          ppe_screening_source?: string | null
          ppe_screening_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          broker_id: string
          client_id: string
          content: string
          created_at: string
          id: string
          note_type: string | null
        }
        Insert: {
          broker_id: string
          client_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: string | null
        }
        Update: {
          broker_id?: string
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string | null
        }
        Relationships: []
      }
      competitive_analyses: {
        Row: {
          analysis_timestamp: string | null
          client_context: string | null
          commercial_arguments: Json | null
          company_strengths: string | null
          comparison_table: Json | null
          competitor_name: string | null
          created_at: string
          created_by: string
          document_type: string
          extracted_data: Json
          id: string
          original_filename: string
          parameters: Json | null
          positioning_scores: Json
          recommendations: Json | null
          source_urls: string[] | null
          status: string
          strengths: Json | null
          updated_at: string
          weaknesses: Json | null
        }
        Insert: {
          analysis_timestamp?: string | null
          client_context?: string | null
          commercial_arguments?: Json | null
          company_strengths?: string | null
          comparison_table?: Json | null
          competitor_name?: string | null
          created_at?: string
          created_by: string
          document_type: string
          extracted_data?: Json
          id?: string
          original_filename: string
          parameters?: Json | null
          positioning_scores?: Json
          recommendations?: Json | null
          source_urls?: string[] | null
          status?: string
          strengths?: Json | null
          updated_at?: string
          weaknesses?: Json | null
        }
        Update: {
          analysis_timestamp?: string | null
          client_context?: string | null
          commercial_arguments?: Json | null
          company_strengths?: string | null
          comparison_table?: Json | null
          competitor_name?: string | null
          created_at?: string
          created_by?: string
          document_type?: string
          extracted_data?: Json
          id?: string
          original_filename?: string
          parameters?: Json | null
          positioning_scores?: Json
          recommendations?: Json | null
          source_urls?: string[] | null
          status?: string
          strengths?: Json | null
          updated_at?: string
          weaknesses?: Json | null
        }
        Relationships: []
      }
      damage_zones: {
        Row: {
          claim_id: string
          created_at: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          id: string
          image_url: string | null
          notes: string | null
          severity: number | null
          zone: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          id?: string
          image_url?: string | null
          notes?: string | null
          severity?: number | null
          zone: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          damage_type?: Database["public"]["Enums"]["damage_type"]
          id?: string
          image_url?: string | null
          notes?: string | null
          severity?: number | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_zones_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      form_deployments: {
        Row: {
          channel: Database["public"]["Enums"]["deployment_channel"]
          deployed_at: string
          deployed_by: string | null
          form_template_id: string
          id: string
          is_active: boolean
        }
        Insert: {
          channel: Database["public"]["Enums"]["deployment_channel"]
          deployed_at?: string
          deployed_by?: string | null
          form_template_id: string
          id?: string
          is_active?: boolean
        }
        Update: {
          channel?: Database["public"]["Enums"]["deployment_channel"]
          deployed_at?: string
          deployed_by?: string | null
          form_template_id?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_deployments_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          category: Database["public"]["Enums"]["form_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          premium_calculation: Json | null
          product_type: string
          steps: Json
          target_channels: Json
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["form_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          premium_calculation?: Json | null
          product_type: string
          steps?: Json
          target_channels?: Json
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["form_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          premium_calculation?: Json | null
          product_type?: string
          steps?: Json
          target_channels?: Json
          updated_at?: string
        }
        Relationships: []
      }
      lead_additional_data: {
        Row: {
          address: string | null
          birth_date: string | null
          children_count: number | null
          city: string | null
          country: string | null
          created_at: string | null
          current_insurer: string | null
          custom_fields: Json | null
          drivers_license_date: string | null
          employer: string | null
          existing_insurances: string[] | null
          gender: string | null
          has_drivers_license: boolean | null
          id: string
          lead_id: string
          loyalty_program_interest: boolean | null
          marital_status: string | null
          monthly_income_range: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          profession: string | null
          property_owner: boolean | null
          property_type: string | null
          referral_source: string | null
          socio_professional_category: string | null
          updated_at: string | null
          vehicle_count: number | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          children_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_insurer?: string | null
          custom_fields?: Json | null
          drivers_license_date?: string | null
          employer?: string | null
          existing_insurances?: string[] | null
          gender?: string | null
          has_drivers_license?: boolean | null
          id?: string
          lead_id: string
          loyalty_program_interest?: boolean | null
          marital_status?: string | null
          monthly_income_range?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          profession?: string | null
          property_owner?: boolean | null
          property_type?: string | null
          referral_source?: string | null
          socio_professional_category?: string | null
          updated_at?: string | null
          vehicle_count?: number | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          children_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_insurer?: string | null
          custom_fields?: Json | null
          drivers_license_date?: string | null
          employer?: string | null
          existing_insurances?: string[] | null
          gender?: string | null
          has_drivers_license?: boolean | null
          id?: string
          lead_id?: string
          loyalty_program_interest?: boolean | null
          marital_status?: string | null
          monthly_income_range?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          profession?: string | null
          property_owner?: boolean | null
          property_type?: string | null
          referral_source?: string | null
          socio_professional_category?: string | null
          updated_at?: string | null
          vehicle_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_additional_data_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_kyc_compliance: {
        Row: {
          aml_notes: string | null
          aml_risk_level: string | null
          aml_verified: boolean | null
          aml_verified_at: string | null
          created_at: string
          id: string
          identity_document_number: string | null
          identity_document_type: string | null
          identity_expiry_date: string | null
          identity_verified: boolean | null
          is_ppe: boolean | null
          lead_id: string
          ppe_country: string | null
          ppe_position: string | null
          ppe_relationship: string | null
          ppe_screening_date: string | null
          ppe_screening_reference: string | null
          ppe_screening_source: string | null
          ppe_screening_status: string | null
          updated_at: string
        }
        Insert: {
          aml_notes?: string | null
          aml_risk_level?: string | null
          aml_verified?: boolean | null
          aml_verified_at?: string | null
          created_at?: string
          id?: string
          identity_document_number?: string | null
          identity_document_type?: string | null
          identity_expiry_date?: string | null
          identity_verified?: boolean | null
          is_ppe?: boolean | null
          lead_id: string
          ppe_country?: string | null
          ppe_position?: string | null
          ppe_relationship?: string | null
          ppe_screening_date?: string | null
          ppe_screening_reference?: string | null
          ppe_screening_source?: string | null
          ppe_screening_status?: string | null
          updated_at?: string
        }
        Update: {
          aml_notes?: string | null
          aml_risk_level?: string | null
          aml_verified?: boolean | null
          aml_verified_at?: string | null
          created_at?: string
          id?: string
          identity_document_number?: string | null
          identity_document_type?: string | null
          identity_expiry_date?: string | null
          identity_verified?: boolean | null
          is_ppe?: boolean | null
          lead_id?: string
          ppe_country?: string | null
          ppe_position?: string | null
          ppe_relationship?: string | null
          ppe_screening_date?: string | null
          ppe_screening_reference?: string | null
          ppe_screening_source?: string | null
          ppe_screening_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_kyc_compliance_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          broker_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          broker_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          broker_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_broker_id: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          product_interest: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_broker_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_contact_at?: string | null
          last_name: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_broker_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_contact_at?: string | null
          last_name?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_broker_id_fkey"
            columns: ["assigned_broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_levels: {
        Row: {
          benefits: Json
          color_theme: string
          created_at: string
          display_order: number
          icon: string | null
          id: string
          level_name: Database["public"]["Enums"]["loyalty_level"]
          min_points_required: number
        }
        Insert: {
          benefits?: Json
          color_theme: string
          created_at?: string
          display_order: number
          icon?: string | null
          id?: string
          level_name: Database["public"]["Enums"]["loyalty_level"]
          min_points_required: number
        }
        Update: {
          benefits?: Json
          color_theme?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          level_name?: Database["public"]["Enums"]["loyalty_level"]
          min_points_required?: number
        }
        Relationships: []
      }
      loyalty_missions: {
        Row: {
          badge_reward: Json | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_recurring: boolean
          mission_type: Database["public"]["Enums"]["mission_type"]
          name: string
          points_reward: number
          priority: number
          recurrence_period: Database["public"]["Enums"]["recurrence_period"]
          requirements: Json
          target_audience: Json
          updated_at: string
        }
        Insert: {
          badge_reward?: Json | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          mission_type: Database["public"]["Enums"]["mission_type"]
          name: string
          points_reward: number
          priority?: number
          recurrence_period?: Database["public"]["Enums"]["recurrence_period"]
          requirements?: Json
          target_audience?: Json
          updated_at?: string
        }
        Update: {
          badge_reward?: Json | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          mission_type?: Database["public"]["Enums"]["mission_type"]
          name?: string
          points_reward?: number
          priority?: number
          recurrence_period?: Database["public"]["Enums"]["recurrence_period"]
          requirements?: Json
          target_audience?: Json
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_profiles: {
        Row: {
          badges_earned: Json
          created_at: string
          current_level: Database["public"]["Enums"]["loyalty_level"]
          id: string
          level_progress: number
          lifetime_points: number
          points_to_next_level: number
          referral_code: string
          referral_count: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges_earned?: Json
          created_at?: string
          current_level?: Database["public"]["Enums"]["loyalty_level"]
          id?: string
          level_progress?: number
          lifetime_points?: number
          points_to_next_level?: number
          referral_code: string
          referral_count?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges_earned?: Json
          created_at?: string
          current_level?: Database["public"]["Enums"]["loyalty_level"]
          id?: string
          level_progress?: number
          lifetime_points?: number
          points_to_next_level?: number
          referral_code?: string
          referral_count?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          cost_in_points: number
          created_at: string
          description: string
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          partner_info: Json | null
          required_level: Database["public"]["Enums"]["loyalty_level"]
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number | null
          stock_available: number | null
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          cost_in_points: number
          created_at?: string
          description: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          partner_info?: Json | null
          required_level?: Database["public"]["Enums"]["loyalty_level"]
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value?: number | null
          stock_available?: number | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          cost_in_points?: number
          created_at?: string
          description?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          partner_info?: Json | null
          required_level?: Database["public"]["Enums"]["loyalty_level"]
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number | null
          stock_available?: number | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json | null
          points_amount: number
          source_id: string | null
          source_type: Database["public"]["Enums"]["transaction_source"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          points_amount: number
          source_id?: string | null
          source_type: Database["public"]["Enums"]["transaction_source"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          points_amount?: number
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["transaction_source"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          broker_id: string
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          phone_number: string
          verified: boolean
        }
        Insert: {
          broker_id: string
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          phone_number: string
          verified?: boolean
        }
        Update: {
          broker_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          phone_number?: string
          verified?: boolean
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      policy_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string | null
          generated_at: string | null
          id: string
          last_sent_at: string | null
          sent_to_email: string | null
          sent_to_phone: string | null
          sent_via: string[] | null
          subscription_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          last_sent_at?: string | null
          sent_to_email?: string | null
          sent_to_phone?: string | null
          sent_via?: string[] | null
          subscription_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          last_sent_at?: string | null
          sent_to_email?: string | null
          sent_to_phone?: string | null
          sent_via?: string[] | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_premium: number
          category: string
          coverages: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          base_premium: number
          category: string
          coverages: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          base_premium?: number
          category?: string
          coverages?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          partner_type: Database["public"]["Enums"]["partner_type"] | null
          phone: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          phone?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          phone?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          broker_id: string
          coverage_details: Json | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          payment_link: string | null
          payment_status: string
          premium_amount: number
          premium_frequency: string
          product_name: string
          product_type: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          broker_id: string
          coverage_details?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_link?: string | null
          payment_status?: string
          premium_amount: number
          premium_frequency?: string
          product_name: string
          product_type: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          broker_id?: string
          coverage_details?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_link?: string | null
          payment_status?: string
          premium_amount?: number
          premium_frequency?: string
          product_name?: string
          product_type?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          reward_earned: number | null
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          assigned_broker_id: string | null
          created_at: string
          end_date: string
          id: string
          monthly_premium: number
          payment_method: string | null
          policy_number: string
          product_id: string
          selected_coverages: Json | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_broker_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          monthly_premium: number
          payment_method?: string | null
          policy_number: string
          product_id: string
          selected_coverages?: Json | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_broker_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          monthly_premium?: number
          payment_method?: string | null
          policy_number?: string
          product_id?: string
          selected_coverages?: Json | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          comment: string | null
          id: string
          nps_score: number | null
          submitted_at: string | null
          survey_send_id: string | null
        }
        Insert: {
          answers?: Json
          comment?: string | null
          id?: string
          nps_score?: number | null
          submitted_at?: string | null
          survey_send_id?: string | null
        }
        Update: {
          answers?: Json
          comment?: string | null
          id?: string
          nps_score?: number | null
          submitted_at?: string | null
          survey_send_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_send_id_fkey"
            columns: ["survey_send_id"]
            isOneToOne: false
            referencedRelation: "survey_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_rules: {
        Row: {
          channels: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_reminders: number | null
          name: string
          reminder_delays: number[] | null
          survey_template_id: string | null
          trigger_delay_hours: number | null
          updated_at: string | null
        }
        Insert: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_reminders?: number | null
          name: string
          reminder_delays?: number[] | null
          survey_template_id?: string | null
          trigger_delay_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_reminders?: number | null
          name?: string
          reminder_delays?: number[] | null
          survey_template_id?: string | null
          trigger_delay_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_rules_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_sends: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          next_reminder_at: string | null
          opened_at: string | null
          recipient_id: string
          recipient_type: string
          reminder_count: number | null
          rule_id: string | null
          scheduled_at: string
          send_channel: string | null
          sent_at: string | null
          status: string | null
          survey_template_id: string | null
          trigger_source_id: string | null
          trigger_source_type: string | null
          unique_token: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          next_reminder_at?: string | null
          opened_at?: string | null
          recipient_id: string
          recipient_type: string
          reminder_count?: number | null
          rule_id?: string | null
          scheduled_at: string
          send_channel?: string | null
          sent_at?: string | null
          status?: string | null
          survey_template_id?: string | null
          trigger_source_id?: string | null
          trigger_source_type?: string | null
          unique_token?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          next_reminder_at?: string | null
          opened_at?: string | null
          recipient_id?: string
          recipient_type?: string
          reminder_count?: number | null
          rule_id?: string | null
          scheduled_at?: string
          send_channel?: string | null
          sent_at?: string | null
          status?: string | null
          survey_template_id?: string | null
          trigger_source_id?: string | null
          trigger_source_type?: string | null
          unique_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_sends_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "survey_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_sends_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          questions: Json
          target_audience: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json
          target_audience: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json
          target_audience?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_attributes: {
        Row: {
          age_range: string | null
          created_at: string
          family_status: string | null
          id: string
          income_range: string | null
          location: string | null
          occupation_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          family_status?: string | null
          id?: string
          income_range?: string | null
          location?: string | null
          occupation_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string
          family_status?: string | null
          id?: string
          income_range?: string | null
          location?: string | null
          occupation_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          assigned_at: string
          completed_at: string | null
          completion_data: Json | null
          expires_at: string | null
          id: string
          mission_id: string
          points_earned: number | null
          progress: number
          status: Database["public"]["Enums"]["mission_status"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          completion_data?: Json | null
          expires_at?: string | null
          id?: string
          mission_id: string
          points_earned?: number | null
          progress?: number
          status?: Database["public"]["Enums"]["mission_status"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          completion_data?: Json | null
          expires_at?: string | null
          id?: string
          mission_id?: string
          points_earned?: number | null
          progress?: number
          status?: Database["public"]["Enums"]["mission_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "loyalty_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          claimed_at: string
          expires_at: string | null
          id: string
          redeemed_at: string | null
          redemption_code: string
          redemption_data: Json | null
          reward_id: string
          status: Database["public"]["Enums"]["user_reward_status"]
          user_id: string
        }
        Insert: {
          claimed_at?: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redemption_code: string
          redemption_data?: Json | null
          reward_id: string
          status?: Database["public"]["Enums"]["user_reward_status"]
          user_id: string
        }
        Update: {
          claimed_at?: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redemption_code?: string
          redemption_data?: Json | null
          reward_id?: string
          status?: Database["public"]["Enums"]["user_reward_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_loyalty_level: {
        Args: { points: number }
        Returns: Database["public"]["Enums"]["loyalty_level"]
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "broker" | "customer"
      claim_status:
        | "Draft"
        | "Submitted"
        | "Reviewed"
        | "Approved"
        | "Rejected"
        | "Closed"
      claim_type: "Auto" | "Habitation" | "Santé"
      damage_type:
        | "Choc"
        | "Bris de vitre"
        | "Rayure"
        | "Feu"
        | "Inondation"
        | "Vol"
        | "Autre"
      deployment_channel: "B2C" | "B2B"
      form_category: "vie" | "non-vie"
      lead_status: "nouveau" | "en_cours" | "relance" | "converti" | "perdu"
      loyalty_level: "bronze" | "silver" | "gold" | "platinum"
      mission_status: "available" | "in_progress" | "completed" | "expired"
      mission_type:
        | "payment"
        | "referral"
        | "profile_update"
        | "quiz"
        | "claim_free"
        | "social_share"
        | "document_upload"
        | "subscription"
        | "renewal"
        | "app_download"
        | "survey"
      partner_type: "agent_mandataire" | "courtier" | "agent_independant"
      recurrence_period: "daily" | "weekly" | "monthly" | "yearly" | "once"
      referral_status: "pending" | "completed" | "rewarded"
      reward_type:
        | "discount"
        | "gift_card"
        | "premium_reduction"
        | "free_option"
        | "partner_voucher"
        | "lottery_entry"
        | "priority_service"
      transaction_source: "mission" | "referral" | "bonus" | "admin" | "reward"
      transaction_type: "earned" | "spent" | "expired" | "adjusted"
      user_reward_status: "pending" | "active" | "redeemed" | "expired"
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
      app_role: ["admin", "broker", "customer"],
      claim_status: [
        "Draft",
        "Submitted",
        "Reviewed",
        "Approved",
        "Rejected",
        "Closed",
      ],
      claim_type: ["Auto", "Habitation", "Santé"],
      damage_type: [
        "Choc",
        "Bris de vitre",
        "Rayure",
        "Feu",
        "Inondation",
        "Vol",
        "Autre",
      ],
      deployment_channel: ["B2C", "B2B"],
      form_category: ["vie", "non-vie"],
      lead_status: ["nouveau", "en_cours", "relance", "converti", "perdu"],
      loyalty_level: ["bronze", "silver", "gold", "platinum"],
      mission_status: ["available", "in_progress", "completed", "expired"],
      mission_type: [
        "payment",
        "referral",
        "profile_update",
        "quiz",
        "claim_free",
        "social_share",
        "document_upload",
        "subscription",
        "renewal",
        "app_download",
        "survey",
      ],
      partner_type: ["agent_mandataire", "courtier", "agent_independant"],
      recurrence_period: ["daily", "weekly", "monthly", "yearly", "once"],
      referral_status: ["pending", "completed", "rewarded"],
      reward_type: [
        "discount",
        "gift_card",
        "premium_reduction",
        "free_option",
        "partner_voucher",
        "lottery_entry",
        "priority_service",
      ],
      transaction_source: ["mission", "referral", "bonus", "admin", "reward"],
      transaction_type: ["earned", "spent", "expired", "adjusted"],
      user_reward_status: ["pending", "active", "redeemed", "expired"],
    },
  },
} as const
