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
          id: number
          status: string | null
          title: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
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
      journey_weeks: {
        Row: {
          created_at: string | null
          id: number
          journey_id: number | null
          name: string
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          journey_id?: number | null
          name: string
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          journey_id?: number | null
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
          countries: string | null
          created_at: string | null
          date_end: string | null
          date_start: string | null
          id: number
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          countries?: string | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          countries?: string | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          image_url?: string | null
          name?: string
          updated_at?: string | null
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
          journey_week_id: number | null
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
          journey_week_id?: number | null
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
          journey_week_id?: number | null
          mission_type?: string | null
          name?: string
          points?: number | null
          release_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_journey_week_id_fkey"
            columns: ["journey_week_id"]
            isOneToOne: false
            referencedRelation: "journey_weeks"
            referencedColumns: ["id"]
          },
        ]
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
          mission_id: number | null
          score: number | null
          title: string
          updated_at: string | null
          user_id: number
          uuid: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          mission_id?: number | null
          score?: number | null
          title: string
          updated_at?: string | null
          user_id: number
          uuid?: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          mission_id?: number | null
          score?: number | null
          title?: string
          updated_at?: string | null
          user_id?: number
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role: "user" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
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
