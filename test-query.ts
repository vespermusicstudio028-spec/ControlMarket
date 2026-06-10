import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjwpoxqymtvpttoswzhj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqd3BveHF5bXR2cHR0b3N3emhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDMzODUsImV4cCI6MjA5NjUxOTM4NX0.o5R1ASdPQ9cV8japVvptrMaryvFfn32GIGM8RdYmCxw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log("Profiles?", data, error);
}

run();
