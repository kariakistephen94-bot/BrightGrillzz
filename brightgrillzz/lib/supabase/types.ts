// Hand-maintained types for the BrightGrillzz schema. If you later install the
// Supabase CLI you can regenerate this with:
//   supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type UserRole = 'customer' | 'staff' | 'admin'
export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
export type FulfillmentType = 'delivery' | 'pickup'
export type PaymentMethod = 'bank_transfer' | 'paystack'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface MenuItem {
  id: string
  name: string
  slug: string | null
  description: string | null
  price: number
  price_label: string | null
  rating: number
  category: string | null
  category_id: string | null
  image: string | null
  badge: string | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  tracking_id: string
  status: OrderStatus
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  fulfillment_type: FulfillmentType
  address: string | null
  area: string | null
  notes: string | null
  subtotal: number
  total: number
  payment_method: PaymentMethod
  payment_reference: string | null
  payment_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  name: string
  unit_price: number
  qty: number
  image: string | null
  line_total: number
  created_at: string
}

export interface Review {
  id: string
  author: string
  role: string | null
  comment: string
  rating: number
  source: string | null
  is_published: boolean
  sort_order: number
  created_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

type Row<T> = T
type Insert<T> = Partial<T>
type Update<T> = Partial<T>

interface TableShape<T> {
  Row: Row<T>
  Insert: Insert<T>
  Update: Update<T>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile>
      menu_categories: TableShape<MenuCategory>
      menu_items: TableShape<MenuItem>
      orders: TableShape<Order>
      order_items: TableShape<OrderItem>
      reviews: TableShape<Review>
      contact_messages: TableShape<ContactMessage>
    }
    Views: {
      [key: string]: { Row: Record<string, unknown> }
    }
    Functions: {
      get_admin_overview: {
        Args: Record<string, never>
        Returns: {
          revenue_30d: number
          orders_30d: number
          avg_order_value: number
          new_customers_30d: number
          revenue_delta_pct: number | null
          orders_delta_pct: number | null
        }
      }
      get_order_by_tracking: {
        Args: { p_tracking_id: string }
        Returns: unknown
      }
    }
    Enums: {
      user_role: UserRole
      order_status: OrderStatus
      fulfillment_type: FulfillmentType
      payment_method: PaymentMethod
    }
  }
}
