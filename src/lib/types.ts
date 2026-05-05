export type UserRole = 'technician' | 'admin'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      parts_catalog: {
        Row: Part
        Insert: Omit<Part, 'id' | 'created_at'>
        Update: Partial<Omit<Part, 'id' | 'created_at'>>
      }
      diagnostics: {
        Row: Diagnostic
        Insert: Omit<Diagnostic, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Diagnostic, 'id' | 'created_at' | 'user_id'>>
      }
      diagnostic_items: {
        Row: DiagnosticItem
        Insert: Omit<DiagnosticItem, 'id'>
        Update: Partial<Omit<DiagnosticItem, 'id' | 'diagnostic_id'>>
      }
      diagnostic_photos: {
        Row: DiagnosticPhoto
        Insert: Omit<DiagnosticPhoto, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type Part = {
  id: string
  name: string
  category: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export type DiagnosticStatus = 'draft' | 'completed'

export type Diagnostic = {
  id: string
  user_id: string
  cliente: string
  modelo: string
  filtro: string | null
  fuente_alimentacion: string | null
  horas_motor: number | null
  horas_fuente: number | null
  descripcion_averia: string | null
  status: DiagnosticStatus
  created_at: string
  updated_at: string
}

export type DiagnosticItem = {
  id: string
  diagnostic_id: string
  part_id: string | null
  custom_name: string | null
  quantity: number
}

export type DiagnosticPhoto = {
  id: string
  diagnostic_id: string
  storage_path: string
  file_name: string
  created_at: string
}

// Extended types with relations
export type DiagnosticWithItems = Diagnostic & {
  diagnostic_items: (DiagnosticItem & { parts_catalog: Part | null })[]
  diagnostic_photos: DiagnosticPhoto[]
  profiles: Pick<Profile, 'full_name' | 'email'>
}

// Form state types
export type DiagnosticFormData = {
  cliente: string
  modelo: string
  filtro: string
  fuente_alimentacion: string
  horas_motor: string
  horas_fuente: string
  descripcion_averia: string
}

export type ChecklistItem = {
  id: string
  part_id: string | null
  name: string
  checked: boolean
  quantity: number
  is_custom: boolean
}
