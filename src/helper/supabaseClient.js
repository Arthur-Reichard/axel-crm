import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jjvpfplzqbnnpfjghxkg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnBmcGx6cWJubnBmamdoeGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxODU2NTYsImV4cCI6MjA1MDc2MTY1Nn0.VR080z4uIKIMjZy3D50JOIHS7Wt4PwmJwLP_xw77cT4";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
