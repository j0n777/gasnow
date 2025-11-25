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
      altseason_index: {
        Row: {
          btc_dominance: number
          classification: string
          created_at: string | null
          id: number
          value: number
        }
        Insert: {
          btc_dominance: number
          classification: string
          created_at?: string | null
          id?: number
          value: number
        }
        Update: {
          btc_dominance?: number
          classification?: string
          created_at?: string | null
          id?: number
          value?: number
        }
        Relationships: []
      }
      crypto_news: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          published_at: string | null
          source: string
          title: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          published_at?: string | null
          source: string
          title: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          published_at?: string | null
          source?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      crypto_prices: {
        Row: {
          change_24h: number
          created_at: string | null
          id: number
          price: number
          symbol: string
        }
        Insert: {
          change_24h: number
          created_at?: string | null
          id?: number
          price: number
          symbol: string
        }
        Update: {
          change_24h?: number
          created_at?: string | null
          id?: number
          price?: number
          symbol?: string
        }
        Relationships: []
      }
      fear_greed_index: {
        Row: {
          classification: string
          created_at: string | null
          id: number
          value: number
        }
        Insert: {
          classification: string
          created_at?: string | null
          id?: number
          value: number
        }
        Update: {
          classification?: string
          created_at?: string | null
          id?: number
          value?: number
        }
        Relationships: []
      }
      gas_prices: {
        Row: {
          blockchain: string
          created_at: string | null
          fast: number
          id: number
          slow: number
          standard: number
        }
        Insert: {
          blockchain: string
          created_at?: string | null
          fast: number
          id?: number
          slow: number
          standard: number
        }
        Update: {
          blockchain?: string
          created_at?: string | null
          fast?: number
          id?: number
          slow?: number
          standard?: number
        }
        Relationships: []
      }
      market_data: {
        Row: {
          btc_dominance: number
          created_at: string | null
          eth_dominance: number
          id: number
          total_market_cap: number
          total_volume_24h: number
        }
        Insert: {
          btc_dominance: number
          created_at?: string | null
          eth_dominance: number
          id?: number
          total_market_cap: number
          total_volume_24h: number
        }
        Update: {
          btc_dominance?: number
          created_at?: string | null
          eth_dominance?: number
          id?: number
          total_market_cap?: number
          total_volume_24h?: number
        }
        Relationships: []
      }
      trending_tokens: {
        Row: {
          change_24h: number | null
          created_at: string | null
          id: number
          image_url: string | null
          market_cap_rank: number | null
          name: string
          price: number | null
          price_btc: number | null
          rank: number | null
          symbol: string
          token_id: string
          token_type: string
        }
        Insert: {
          change_24h?: number | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          market_cap_rank?: number | null
          name: string
          price?: number | null
          price_btc?: number | null
          rank?: number | null
          symbol: string
          token_id: string
          token_type: string
        }
        Update: {
          change_24h?: number | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          market_cap_rank?: number | null
          name?: string
          price?: number | null
          price_btc?: number | null
          rank?: number | null
          symbol?: string
          token_id?: string
          token_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_trending_tokens: { Args: never; Returns: undefined }
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
