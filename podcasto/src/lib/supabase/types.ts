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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      episodes: {
        Row: {
          analysis: Json | null
          audio_url: string
          content_end_date: string | null
          content_start_date: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          language: string
          metadata: string | null
          metadata_url: string | null
          podcast_id: string | null
          published_at: string | null
          script_url: string | null
          source_data_ref: string | null
          speaker2_role: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          analysis?: Json | null
          audio_url: string
          content_end_date?: string | null
          content_start_date?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          language: string
          metadata?: string | null
          metadata_url?: string | null
          podcast_id?: string | null
          published_at?: string | null
          script_url?: string | null
          source_data_ref?: string | null
          speaker2_role?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          analysis?: Json | null
          audio_url?: string
          content_end_date?: string | null
          content_start_date?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          language?: string
          metadata?: string | null
          metadata_url?: string | null
          podcast_id?: string | null
          published_at?: string | null
          script_url?: string | null
          source_data_ref?: string | null
          speaker2_role?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_configs: {
        Row: {
          additional_instructions: string | null
          content_source: string
          conversation_style: string
          created_at: string | null
          creativity_level: number
          creator: string
          discussion_rounds: number
          episode_frequency: number | null
          id: string
          is_long_podcast: boolean
          language: string | null
          min_chars_per_round: number
          mixing_techniques: Json
          podcast_id: string
          podcast_name: string
          slogan: string | null
          speaker1_role: string
          speaker2_role: string
          target_duration_minutes: number | null
          telegram_channel: string | null
          telegram_hours: number | null
          updated_at: string | null
          urls: Json | null
        }
        Insert: {
          additional_instructions?: string | null
          content_source: string
          conversation_style: string
          created_at?: string | null
          creativity_level: number
          creator: string
          discussion_rounds: number
          episode_frequency?: number | null
          id?: string
          is_long_podcast: boolean
          language?: string | null
          min_chars_per_round: number
          mixing_techniques: Json
          podcast_id: string
          podcast_name: string
          slogan?: string | null
          speaker1_role: string
          speaker2_role: string
          target_duration_minutes?: number | null
          telegram_channel?: string | null
          telegram_hours?: number | null
          updated_at?: string | null
          urls?: Json | null
        }
        Update: {
          additional_instructions?: string | null
          content_source?: string
          conversation_style?: string
          created_at?: string | null
          creativity_level?: number
          creator?: string
          discussion_rounds?: number
          episode_frequency?: number | null
          id?: string
          is_long_podcast?: boolean
          language?: string | null
          min_chars_per_round?: number
          mixing_techniques?: Json
          podcast_id?: string
          podcast_name?: string
          slogan?: string | null
          speaker1_role?: string
          speaker2_role?: string
          target_duration_minutes?: number | null
          telegram_channel?: string | null
          telegram_hours?: number | null
          updated_at?: string | null
          urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_configs_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          auto_generation_enabled: boolean | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_style: string | null
          is_paused: boolean
          language_code: string | null
          migration_status: string | null
          next_scheduled_generation: string | null
          podcast_group_id: string | null
          title: string
          updated_at: string | null
          last_auto_generated_at: string | null
        }
        Insert: {
          auto_generation_enabled?: boolean | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_style?: string | null
          is_paused?: boolean
          language_code?: string | null
          migration_status?: string | null
          next_scheduled_generation?: string | null
          podcast_group_id?: string | null
          title: string
          updated_at?: string | null
          last_auto_generated_at?: string | null
        }
        Update: {
          auto_generation_enabled?: boolean | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_style?: string | null
          is_paused?: boolean
          language_code?: string | null
          migration_status?: string | null
          next_scheduled_generation?: string | null
          podcast_group_id?: string | null
          title?: string
          updated_at?: string | null
          last_auto_generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcasts_podcast_group_id_fkey"
            columns: ["podcast_group_id"]
            isOneToOne: false
            referencedRelation: "podcast_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email_notifications: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sent_episodes: {
        Row: {
          episode_id: string | null
          id: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          episode_id?: string | null
          id?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          episode_id?: string | null
          id?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_episodes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          email_notifications: boolean
          id: string
          language_preference: string | null
          podcast_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          language_preference?: string | null
          podcast_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          language_preference?: string | null
          podcast_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      users_cache: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_podcasts_for_new_episodes: {
        Args: Record<PropertyKey, never>
        Returns: {
          content_source: string
          days_since_last_episode: number
          episode_frequency: number
          podcast_id: string
          podcast_title: string
        }[]
      }
      get_podcast_config: {
        Args: { input_id: string }
        Returns: Json
      }
      get_podcast_config_by_id: {
        Args: { config_id: string }
        Returns: Json
      }
      get_podcast_config_by_podcast_id: {
        Args: { p_podcast_id: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id_param: string }
        Returns: boolean
      }
      mark_episode_failed: {
        Args: { episode_id: string; error_message: string }
        Returns: Json
      }
      update_episode_audio_url: {
        Args: {
          audio_url: string
          duration?: number
          episode_id: string
          new_status?: string
        }
        Returns: Json
      }
      update_episode_status: {
        Args: { episode_id: string; new_status: string }
        Returns: Json
      }
      update_episode_with_audio: {
        Args: {
          p_audio_url: string
          p_duration?: number
          p_episode_id: string
          p_status?: string
        }
        Returns: Json
      }
    }
    Enums: {
      podcast_language: "hebrew" | "english" | "russian" | "arabic"
      user_role: "admin" | "user"
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
      podcast_language: ["hebrew", "english", "russian", "arabic"],
      user_role: ["admin", "user"],
    },
  },
} as const
