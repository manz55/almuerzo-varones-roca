import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqmhqdeiftechpascpvm.supabase.co';
const supabaseAnonKey = 'sb_publishable_E2yXXn0WWGBEmRa4zdwFyw_Kz0of4G5'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);