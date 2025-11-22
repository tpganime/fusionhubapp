import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gehrpbmftrgbgqkagoge.supabase.co';
const supabaseKey = 'sb_publishable_Udslhh74KJIOPkp-zagmMA_Y_h-alSN';

export const supabase = createClient(supabaseUrl, supabaseKey);