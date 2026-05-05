import { z } from 'zod'

export const diagnosticFormSchema = z.object({
  cliente: z.string().min(1, 'El nombre del cliente es obligatorio'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  filtro: z.string().optional(),
  fuente_alimentacion: z.string().optional(),
  horas_motor: z.string().optional(),
  horas_fuente: z.string().optional(),
  descripcion_averia: z.string().optional(),
})

export type DiagnosticFormValues = z.infer<typeof diagnosticFormSchema>

export const partSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  category: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
})

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  full_name: z.string().min(1, 'El nombre es obligatorio'),
  role: z.enum(['technician', 'admin']),
})
