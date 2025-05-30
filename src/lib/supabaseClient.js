import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ekfudhddkmutvwlqwksb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZnVkaGRka211dHZ3bHF3a3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTMwNzMsImV4cCI6MjA2Mzk4OTA3M30.7VVnrCPGz79xsDt6qIahKU--S3t0fjIifYa68gnd_zY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);