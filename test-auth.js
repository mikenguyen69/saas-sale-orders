// Test script to get JWT token from Supabase
// Run with: node test-auth.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321' // Local Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' // Local anon key

const supabase = createClient(supabaseUrl, supabaseKey)

async function signInAndGetToken() {
  try {
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'manager@test.com',
      password: 'testpassword123'
    })

    if (error) {
      console.error('Auth error:', error.message)
      return
    }

    console.log('✅ Authentication successful!')
    console.log('🔑 JWT Token:', data.session.access_token)
    console.log('👤 User ID:', data.user.id)
    console.log('📧 Email:', data.user.email)

    // Test API call with token
    const response = await fetch('http://localhost:3000/api/v1/users', {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const apiResult = await response.json()
    console.log('🚀 API Response:', apiResult)

  } catch (error) {
    console.error('Error:', error)
  }
}

signInAndGetToken()