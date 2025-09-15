#!/bin/bash

# Script to get JWT token from Supabase
# Make executable: chmod +x get-token.sh
# Run: ./get-token.sh

echo "🔐 Getting JWT token from Supabase..."

# Local Supabase Auth endpoint
AUTH_URL="http://127.0.0.1:54321/auth/v1/token?grant_type=password"

# Credentials (these would be from your seeded users)
EMAIL="manager@test.com"
PASSWORD="testpassword123"

# API Key for local Supabase
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Make auth request
echo "📡 Making authentication request..."
RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract JWT token
JWT_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$JWT_TOKEN" ]; then
  echo "✅ Authentication successful!"
  echo "🔑 JWT Token: $JWT_TOKEN"
  echo ""
  echo "🚀 Testing API with token..."

  # Test API call
  API_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/v1/users" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")

  echo "📊 API Response: $API_RESPONSE"
else
  echo "❌ Authentication failed"
  echo "Response: $RESPONSE"
fi