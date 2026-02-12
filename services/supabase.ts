import { createClient } from '@supabase/supabase-js';

// Using keys provided in the user prompt. 
// In a real production env, these should be in .env files, but the prompt requested a self-contained logic.
const SUPABASE_URL = 'https://aasupabase.calier.7ft.services';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.gpmWpeW6HknW4FUsIRG3eLlnBINl98Usg0b0MLOxsew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
