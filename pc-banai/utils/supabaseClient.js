import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.POSTGRES_URL,
  process.env.POSTGRES_ANON_KEY
)

export default supabase
