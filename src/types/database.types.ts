export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      bug_reports: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: number
          status: string | null
          title: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: number
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: number
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
          content: string | null
          created_at: string | null
          id: number
          post_id: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          post_id?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          post_id?: number | null
          updated_at?: string | null
          user_id?: number
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
          content_ref_id: number | null
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
          content_ref_id?: number | null
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
          content_ref_id?: number | null
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
      journey_mission_instances: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: number
          journey_uuid: string | null
          journey_week_id: number
          mission_id: number
          release_date: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          journey_uuid?: string | null
          journey_week_id: number
          mission_id: number
          release_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          journey_uuid?: string | null
          journey_week_id?: number
          mission_id?: number
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
          id: number
          journey_id: number | null
          missions: number[] | null
          name: string
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          journey_id?: number | null
          missions?: number[] | null
          name: string
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          journey_id?: number | null
          missions?: number[] | null
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
          id: number
          image_url: string | null
          name: string
          updated_at: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          image_url?: string | null
          name: string
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          image_url?: string | null
          name?: string
          updated_at?: string | null
          uuid?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: number
          post_id: number | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id?: number | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number | null
          user_id?: number
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
      missions: {
        Row: {
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: number
          mission_type: string | null
          name: string
          points: number | null
          release_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: number
          mission_type?: string | null
          name: string
          points?: number | null
          release_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: number
          mission_type?: string | null
          name?: string
          points?: number | null
          release_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          link: string | null
          message: string
          read_at: string | null
          receiver_id: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          link?: string | null
          message: string
          read_at?: string | null
          receiver_id?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          link?: string | null
          message?: string
          read_at?: string | null
          receiver_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user"
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
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          file_url: string | null
          id: number
          is_hidden: boolean
          mission_instance_id: number | null
          score: number | null
          title: string
          updated_at: string | null
          user_id: number
          view_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          is_hidden?: boolean
          mission_instance_id?: number | null
          score?: number | null
          title: string
          updated_at?: string | null
          user_id: number
          view_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          is_hidden?: boolean
          mission_instance_id?: number | null
          score?: number | null
          title?: string
          updated_at?: string | null
          user_id?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_mission_instance_id_fkey"
            columns: ["mission_instance_id"]
            isOneToOne: false
            referencedRelation: "journey_mission_instances"
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
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          marketing_opt_in: boolean | null
          organization_id: number | null
          phone: string | null
          privacy_agreed: boolean | null
          profile_image: string | null
          role: string | null
          uid: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          marketing_opt_in?: boolean | null
          organization_id?: number | null
          phone?: string | null
          privacy_agreed?: boolean | null
          profile_image?: string | null
          role?: string | null
          uid: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          marketing_opt_in?: boolean | null
          organization_id?: number | null
          phone?: string | null
          privacy_agreed?: boolean | null
          profile_image?: string | null
          role?: string | null
          uid?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_access_code: {
        Row: {
          code: string
          created_at: string
          expiry_date: string | null
          id: number
          role: Database["public"]["Enums"]["role"] | null
        }
        Insert: {
          code?: string
          created_at?: string
          expiry_date?: string | null
          id?: number
          role?: Database["public"]["Enums"]["role"] | null
        }
        Update: {
          code?: string
          created_at?: string
          expiry_date?: string | null
          id?: number
          role?: Database["public"]["Enums"]["role"] | null
        }
        Relationships: []
      }
      user_journeys: {
        Row: {
          created_at: string | null
          id: number
          joined_at: string | null
          journey_id: number | null
          role_in_journey: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          joined_at?: string | null
          journey_id?: number | null
          role_in_journey?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          joined_at?: string | null
          journey_id?: number | null
          role_in_journey?: string | null
          updated_at?: string | null
          user_id?: number | null
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
          id: number
          journey_id: number
          mission_instance_id: number
          post_id: number | null
          profile_id: number
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          journey_id: number
          mission_instance_id: number
          post_id?: number | null
          profile_id: number
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          journey_id?: number
          mission_instance_id?: number
          post_id?: number | null
          profile_id?: number
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
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
      leaderboard: {
        Row: {
          completed_missions: number | null
          first_name: string | null
          last_name: string | null
          total_points: number | null
          user_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bytea_to_text: {
        Args: {
          data: string
        }
        Returns: string
      }
      get_distinct_mission_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          mission_type: string
        }[]
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
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
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      migrate_missions_to_instances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_email_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_send_email: {
        Args: {
          recipient_email: string
          email_subject?: string
          email_content?: string
        }
        Returns: string
      }
      text_to_bytea: {
        Args: {
          data: string
        }
        Returns: string
      }
      urlencode:
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
    }
    Enums: {
      mission_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "completed"
        | "rejected"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
