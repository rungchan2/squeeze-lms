
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blog: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          content: string
          content_ref_id: string | null
          created_at: string | null
          error_message: string | null
          id: number
          processed: boolean | null
          processed_at: string | null
          recipient_email: string
          recipient_name: string | null
          response: string | null
          retry_count: number | null
          status_code: number | null
          subject: string
        }
        Insert: {
          content: string
          content_ref_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          response?: string | null
          retry_count?: number | null
          status_code?: number | null
          subject: string
        }
        Update: {
          content?: string
          content_ref_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          response?: string | null
          retry_count?: number | null
          status_code?: number | null
          subject?: string
        }
        Relationships: []
      }
      inquiry: {
        Row: {
          automation_needs: string
          created_at: string
          current_tools: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          status: string | null
          tool_issues: string | null
          updated_at: string
        }
        Insert: {
          automation_needs: string
          created_at?: string
          current_tools?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          status?: string | null
          tool_issues?: string | null
          updated_at?: string
        }
        Update: {
          automation_needs?: string
          created_at?: string
          current_tools?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          status?: string | null
          tool_issues?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journey_mission_instances: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          journey_id: string | null
          journey_week_id: string
          mission_id: string
          release_date: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          journey_id?: string | null
          journey_week_id: string
          mission_id: string
          release_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          journey_id?: string | null
          journey_week_id?: string
          mission_id?: string
          release_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_mission_instances_journey_week_id_fkey"
            columns: ["journey_week_id"]
            isOneToOne: false
            referencedRelation: "journey_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_mission_instances_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_weeks: {
        Row: {
          created_at: string | null
          id: string
          journey_id: string
          name: string
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          journey_id: string
          name: string
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          journey_id?: string
          name?: string
          updated_at?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_weeks_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string | null
          date_end: string | null
          date_start: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          is_required: boolean | null
          max_characters: number | null
          max_images: number | null
          mission_id: string
          options: Json | null
          placeholder_text: string | null
          points: number | null
          question_order: number
          question_text: string
          question_type: Database["public"]["Enums"]["mission_type"]
          required_image: boolean | null
          updated_at: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_characters?: number | null
          max_images?: number | null
          mission_id: string
          options?: Json | null
          placeholder_text?: string | null
          points?: number | null
          question_order?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["mission_type"]
          required_image?: boolean | null
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_characters?: number | null
          max_images?: number | null
          mission_id?: string
          options?: Json | null
          placeholder_text?: string | null
          points?: number | null
          question_order?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["mission_type"]
          required_image?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_questions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          mission_type: Database["public"]["Enums"]["mission_type"] | null
          name: string
          points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          mission_type?: Database["public"]["Enums"]["mission_type"] | null
          name: string
          points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          mission_type?: Database["public"]["Enums"]["mission_type"] | null
          name?: string
          points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          notification_json: string | null
          read_at: string | null
          receiver_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          notification_json?: string | null
          read_at?: string | null
          receiver_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          notification_json?: string | null
          read_at?: string | null
          receiver_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          achievement_status: string | null
          answered_questions: number | null
          answers_data: Json | null
          auto_score: number | null
          completion_rate: number | null
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string
          is_hidden: boolean
          is_team_submission: boolean | null
          journey_id: string | null
          manual_score: number | null
          mission_instance_id: string | null
          score: number | null
          team_id: string | null
          team_points: number | null
          title: string
          total_questions: number | null
          updated_at: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          achievement_status?: string | null
          answered_questions?: number | null
          answers_data?: Json | null
          auto_score?: number | null
          completion_rate?: number | null
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_hidden?: boolean
          is_team_submission?: boolean | null
          journey_id?: string | null
          manual_score?: number | null
          mission_instance_id?: string | null
          score?: number | null
          team_id?: string | null
          team_points?: number | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
          view_count?: number
        }
        Update: {
          achievement_status?: string | null
          answered_questions?: number | null
          answers_data?: Json | null
          auto_score?: number | null
          completion_rate?: number | null
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_hidden?: boolean
          is_team_submission?: boolean | null
          journey_id?: string | null
          manual_score?: number | null
          mission_instance_id?: string | null
          score?: number | null
          team_id?: string | null
          team_points?: number | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_mission_instance_id_fkey"
            columns: ["mission_instance_id"]
            isOneToOne: false
            referencedRelation: "journey_mission_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_backup_20250726: {
        Row: {
          achievement_status: string | null
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string | null
          is_hidden: boolean | null
          is_team_submission: boolean | null
          journey_id: string | null
          mission_instance_id: string | null
          score: number | null
          team_id: string | null
          team_points: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          achievement_status?: string | null
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string | null
          is_hidden?: boolean | null
          is_team_submission?: boolean | null
          journey_id?: string | null
          mission_instance_id?: string | null
          score?: number | null
          team_id?: string | null
          team_points?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          achievement_status?: string | null
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string | null
          is_hidden?: boolean | null
          is_team_submission?: boolean | null
          journey_id?: string | null
          mission_instance_id?: string | null
          score?: number | null
          team_id?: string | null
          team_points?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_opt_in: boolean
          organization_id: string | null
          phone: string | null
          privacy_agreed: boolean
          profile_image: string | null
          push_subscription: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in?: boolean
          organization_id?: string | null
          phone?: string | null
          privacy_agreed?: boolean
          profile_image?: string | null
          push_subscription?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in?: boolean
          organization_id?: string | null
          phone?: string | null
          privacy_agreed?: boolean
          profile_image?: string | null
          push_subscription?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_access_code: {
        Row: {
          code: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          role: Database["public"]["Enums"]["role"]
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          role: Database["public"]["Enums"]["role"]
        }
        Update: {
          code?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          role?: Database["public"]["Enums"]["role"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          notification_json: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_json: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_json?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          is_leader: boolean | null
          joined_at: string | null
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_leader?: boolean | null
          joined_at?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_leader?: boolean | null
          joined_at?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_points: {
        Row: {
          created_at: string | null
          id: string
          mission_instance_id: string
          post_id: string | null
          team_id: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mission_instance_id: string
          post_id?: string | null
          team_id: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mission_instance_id?: string
          post_id?: string | null
          team_id?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_points_mission_instance_id_fkey"
            columns: ["mission_instance_id"]
            isOneToOne: false
            referencedRelation: "journey_mission_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_points_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_points_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          journey_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          journey_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          journey_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journeys: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          journey_id: string
          role_in_journey: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          journey_id: string
          role_in_journey?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          journey_id?: string
          role_in_journey?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journeys_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_journeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          mission_instance_id: string
          post_id: string | null
          profile_id: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mission_instance_id: string
          post_id?: string | null
          profile_id: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mission_instance_id?: string
          post_id?: string | null
          profile_id?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_mission_instance_id_fkey"
            columns: ["mission_instance_id"]
            isOneToOne: false
            referencedRelation: "journey_mission_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      create_default_questions_for_existing_missions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      custom_access_token_hook2: {
        Args: { event: Json }
        Returns: Json
      }
      get_auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_distinct_mission_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          mission_type: string
        }[]
      }
      get_migration_samples: {
        Args: { sample_count?: number }
        Returns: {
          post_id: string
          original_content_preview: string
          new_answers_data: Json
          original_score: number
          new_manual_score: number
          completion_rate: number
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_crawler: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_teacher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      migrate_posts_to_new_structure: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_remaining_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_migration: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
    }
    Enums: {
      mission_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "completed"
        | "rejected"
      mission_type: "essay" | "multiple_choice" | "image_upload" | "mixed"
      role: "user" | "teacher" | "admin"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      mission_status: [
        "not_started",
        "in_progress",
        "submitted",
        "completed",
        "rejected",
      ],
      mission_type: ["essay", "multiple_choice", "image_upload", "mixed"],
      role: ["user", "teacher", "admin"],
    },
  },
} as const
