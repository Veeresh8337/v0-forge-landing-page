const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

console.log('URL:', url)
console.log('KEY:', key)

const supabase = createClient(url, key)

async function test() {
  try {
    const { data, error } = await supabase.auth.getSession()
    console.log('Success:', data, error)
  } catch (e) {
    console.error('Caught Error:', e)
  }
}

test()
