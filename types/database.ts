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
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'student' | 'parent' | 'admin'
          level: number
          avatar_url: string | null
          streak_days: number
          last_active: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'student' | 'parent' | 'admin'
          level?: number
          avatar_url?: string | null
          streak_days?: number
          last_active?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'student' | 'parent' | 'admin'
          level?: number
          avatar_url?: string | null
          streak_days?: number
          last_active?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          subject: 'math' | 'english' | 'science'
          xp: number
          accuracy_rate: number
          questions_attempted: number
          questions_correct: number
          current_streak: number
          longest_streak: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: 'math' | 'english' | 'science'
          xp?: number
          accuracy_rate?: number
          questions_attempted?: number
          questions_correct?: number
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: 'math' | 'english' | 'science'
          xp?: number
          accuracy_rate?: number
          questions_attempted?: number
          questions_correct?: number
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
      }
      mistake_bank: {
        Row: {
          id: string
          user_id: string
          question_data: Json
          wrong_answer: string
          correct_answer: string
          attempts: number
          mastered: boolean
          next_review_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_data: Json
          wrong_answer: string
          correct_answer: string
          attempts?: number
          mastered?: boolean
          next_review_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_data?: Json
          wrong_answer?: string
          correct_answer?: string
          attempts?: number
          mastered?: boolean
          next_review_date?: string | null
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: 'daily_sprint' | 'top_speed' | 'topic_quest' | 'exam_mode' | 'mistake_review'
          subject: string | null
          score: number | null
          max_score: number | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: 'daily_sprint' | 'top_speed' | 'topic_quest' | 'exam_mode' | 'mistake_review'
          subject?: string | null
          score?: number | null
          max_score?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: 'daily_sprint' | 'top_speed' | 'topic_quest' | 'exam_mode' | 'mistake_review'
          subject?: string | null
          score?: number | null
          max_score?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      leaderboard: {
        Row: {
          id: string
          user_id: string
          user_name: string | null
          score: number
          subject: string | null
          level: number | null
          game_mode: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name?: string | null
          score: number
          subject?: string | null
          level?: number | null
          game_mode?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string | null
          score?: number
          subject?: string | null
          level?: number | null
          game_mode?: string | null
          date?: string
          created_at?: string
        }
      }
      questions_cache: {
        Row: {
          id: string
          cache_key: string
          level: number | null
          subject: string | null
          topic: string | null
          difficulty: string | null
          question_data: Json | null
          usage_count: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          cache_key: string
          level?: number | null
          subject?: string | null
          topic?: string | null
          difficulty?: string | null
          question_data?: Json | null
          usage_count?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          cache_key?: string
          level?: number | null
          subject?: string | null
          topic?: string | null
          difficulty?: string | null
          question_data?: Json | null
          usage_count?: number
          created_at?: string
          expires_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          request_count: number
          tokens_used: number
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          request_count?: number
          tokens_used?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          request_count?: number
          tokens_used?: number
        }
      }
    }
  }
}
