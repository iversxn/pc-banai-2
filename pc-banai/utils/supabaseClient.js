// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Keep secrets in .env.local (never inline)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL=https://gsjfvxlyjjprisfskhfz.supabase.co
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzamZ2eGx5ampwcmlzZnNraGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjUwMTYsImV4cCI6MjA2Nzg0MTAxNn0.Jx3O6M5abxc5Nz1hJBNWh0pRy4cY7uO42JdJFQ9FKFE

if (!supabaseUrl || !supabaseAnon) {
  // This throws at build/dev time if env missing, so you catch misconfig early
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

const supabase = createClient(supabaseUrl, supabaseAnon)
export default supabase
