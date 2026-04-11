const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('trips').insert({
    title: 'Test Insertion',
    start_date: '2026-04-12',
    end_date: '2026-04-14',
    owner_id: null
  }).select();
  console.log("Insert Result:", data, error);
}
test();
