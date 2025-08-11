import { z } from "zod";

export const initializationSchema = z.object({
  admin: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
  database: z.object({
    provider: z.enum(["sqlite", "postgresql", "mysql", "neon", "planetscale", "supabase"]),
    name: z.string().min(1),
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    connectionString: z.string().optional(),
  }),
});

export type InitializationConfig = z.infer<typeof initializationSchema>;