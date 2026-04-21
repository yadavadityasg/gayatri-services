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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      amc_plans: {
        Row: {
          active: boolean
          appliances: string
          benefits: Json
          created_at: string
          highlight: boolean
          id: string
          name: string
          period: string
          price: number
          services: string
          sort_order: number
          tagline: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          appliances: string
          benefits?: Json
          created_at?: string
          highlight?: boolean
          id: string
          name: string
          period?: string
          price: number
          services: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          appliances?: string
          benefits?: Json
          created_at?: string
          highlight?: boolean
          id?: string
          name?: string
          period?: string
          price?: number
          services?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address_line: string
          brand: string | null
          city: string | null
          created_at: string
          description: string | null
          floor_landmark: string | null
          id: string
          pincode: string | null
          preferred_date: string
          problem: string | null
          service_name: string
          service_slug: string
          status: string
          technician_name: string | null
          time_slot: string
          updated_at: string
          user_id: string
          visit_charge: number
        }
        Insert: {
          address_line: string
          brand?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          floor_landmark?: string | null
          id?: string
          pincode?: string | null
          preferred_date: string
          problem?: string | null
          service_name: string
          service_slug: string
          status?: string
          technician_name?: string | null
          time_slot: string
          updated_at?: string
          user_id: string
          visit_charge?: number
        }
        Update: {
          address_line?: string
          brand?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          floor_landmark?: string | null
          id?: string
          pincode?: string | null
          preferred_date?: string
          problem?: string | null
          service_name?: string
          service_slug?: string
          status?: string
          technician_name?: string | null
          time_slot?: string
          updated_at?: string
          user_id?: string
          visit_charge?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: Json
          created_at: string
          delivery_fee: number
          discount: number
          gst: number
          id: string
          items: Json
          payment_method: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: Json
          created_at?: string
          delivery_fee?: number
          discount?: number
          gst?: number
          id?: string
          items: Json
          payment_method: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json
          created_at?: string
          delivery_fee?: number
          discount?: number
          gst?: number
          id?: string
          items?: Json
          payment_method?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          box: Json
          brand: string
          capacity: string | null
          category: string
          condition: string
          created_at: string
          description: string
          energy_rating: number | null
          id: string
          image: string
          mrp: number
          name: string
          price: number
          rating: number
          reviews: number
          specs: Json
          updated_at: string
          warranty: string
        }
        Insert: {
          active?: boolean
          box?: Json
          brand: string
          capacity?: string | null
          category: string
          condition?: string
          created_at?: string
          description?: string
          energy_rating?: number | null
          id: string
          image: string
          mrp: number
          name: string
          price: number
          rating?: number
          reviews?: number
          specs?: Json
          updated_at?: string
          warranty?: string
        }
        Update: {
          active?: boolean
          box?: Json
          brand?: string
          capacity?: string | null
          category?: string
          condition?: string
          created_at?: string
          description?: string
          energy_rating?: number | null
          id?: string
          image?: string
          mrp?: number
          name?: string
          price?: number
          rating?: number
          reviews?: number
          specs?: Json
          updated_at?: string
          warranty?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string
          category_label: string
          created_at: string
          duration: string
          icon: string
          includes: Json
          name: string
          problems: Json
          short: string
          slug: string
          starting_at: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          category_label: string
          created_at?: string
          duration: string
          icon?: string
          includes?: Json
          name: string
          problems?: Json
          short: string
          slug: string
          starting_at: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          category_label?: string
          created_at?: string
          duration?: string
          icon?: string
          includes?: Json
          name?: string
          problems?: Json
          short?: string
          slug?: string
          starting_at?: number
          updated_at?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          active: boolean
          certifications: Json
          created_at: string
          experience: number
          id: string
          jobs: number
          name: string
          on_time: number
          photo: string
          rating: number
          rating_breakdown: Json
          reviews: Json
          specialization: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          certifications?: Json
          created_at?: string
          experience?: number
          id: string
          jobs?: number
          name: string
          on_time?: number
          photo?: string
          rating?: number
          rating_breakdown?: Json
          reviews?: Json
          specialization: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          certifications?: Json
          created_at?: string
          experience?: number
          id?: string
          jobs?: number
          name?: string
          on_time?: number
          photo?: string
          rating?: number
          rating_breakdown?: Json
          reviews?: Json
          specialization?: string
          updated_at?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
