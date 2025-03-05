/**
 * This file contains TypeScript definitions for your Supabase database
 * It is used to provide type safety for queries and responses
 * 
 * You can generate these types from your database using:
 * npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      podcasts: {
        Row: {
          id: string
          title: string
          description: string
          language: string
          created_at: string
          updated_at: string
          image_url?: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          language?: string
          created_at?: string
          updated_at?: string
          image_url?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          language?: string
          created_at?: string
          updated_at?: string
          image_url?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          id: string
          podcast_id: string
          title: string
          audio_url: string
          duration?: number
          created_at: string
          published_at: string
          description?: string
          language?: string
        }
        Insert: {
          id?: string
          podcast_id: string
          title: string
          audio_url: string
          duration?: number
          created_at?: string
          published_at?: string
          description?: string
          language?: string
        }
        Update: {
          id?: string
          podcast_id?: string
          title?: string
          audio_url?: string
          duration?: number
          created_at?: string
          published_at?: string
          description?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          podcast_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          podcast_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          podcast_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_podcast_id_fkey"
            columns: ["podcast_id"]
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sent_episodes: {
        Row: {
          id: string
          user_id: string
          episode_id: string
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          episode_id: string
          sent_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          episode_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_episodes_episode_id_fkey"
            columns: ["episode_id"]
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_episodes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
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
  }
} 