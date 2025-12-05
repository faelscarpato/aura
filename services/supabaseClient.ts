import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sflsceypiahgbnmacjlv.supabase.co";
const supabaseKey = "sb_publishable_UJVy06GLTB-P6DVWFNmJAQ_JswQ1HRf";

export const supabase = createClient(supabaseUrl, supabaseKey);
