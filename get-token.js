// Script to get JWT token for API testing
// Run with: node get-token.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321' // Local Supabase
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' // Local anon key

const supabase = createClient(supabaseUrl, supabaseKey)

async function getAuthToken() {
  try {
    console.log('🔐 Signing in to get JWT token...')

    // Sign in with the manager account
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'manager@test.com',
      password: 'password123',
    })

    if (error) {
      console.error('❌ Auth error:', error.message)
      return
    }

    if (!data.session?.access_token) {
      console.error('❌ No access token received')
      return
    }

    const token = data.session.access_token
    console.log('✅ JWT Token obtained!')
    console.log('\n📋 Copy this token for API calls:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(token)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n🚀 Example curl command:')
    console.log(`curl -X GET "http://localhost:3000/api/v1/users" \\`)
    console.log(`  -H "Authorization: Bearer ${token}" \\`)
    console.log(`  -H "Content-Type: application/json"`)

    console.log('\n👤 User Info:')
    console.log('- Email:', data.user.email)
    console.log('- User ID:', data.user.id)
    console.log('- Role: manager')

    // Test the token works
    console.log('\n🧪 Testing token...')
    const testResponse = await fetch('http://localhost:3000/api/v1/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (testResponse.ok) {
      console.log('✅ Token is valid and working!')
    } else {
      console.log('⚠️  Token may not be working. Status:', testResponse.status)
      const errorText = await testResponse.text()
      console.log('Error:', errorText)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

getAuthToken()
