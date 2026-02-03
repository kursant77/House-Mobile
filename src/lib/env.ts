import { z } from 'zod';

/**
 * Environment variables schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
});

/**
 * Validate and parse environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnv() {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `- ${err.path.join('.')}: ${err.message}`).join('\n');

      throw new Error(
        `❌ Environment validation failed!\n\n` +
        `Missing or invalid environment variables:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `See .env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Use this instead of import.meta.env to ensure type safety
 */
export const env = validateEnv();

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
