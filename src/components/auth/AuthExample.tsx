'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function AuthExample() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { user, session, signIn, signUp, signOut, getAccessToken } = useAuth()

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const result = await signUp(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      alert('Check your email for verification link!')
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const result = await signIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    }
  }

  const testAPI = async () => {
    if (!session?.access_token) {
      alert('No access token available!')
      return
    }

    try {
      const response = await fetch('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      console.log('API Response:', data)
      alert(`API Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('API Error:', error)
      alert('API Error: ' + error)
    }
  }

  if (user) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Authenticated User</h2>
        <div className="space-y-3">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>

          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm font-medium">Access Token (JWT):</p>
            <textarea
              className="w-full mt-1 p-2 text-xs font-mono bg-white border rounded"
              rows={4}
              readOnly
              value={session?.access_token || 'No token'}
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={testAPI}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Test API with Token
            </button>
            <button
              onClick={signOut}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Sign In / Sign Up</h2>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <div className="space-y-2">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>For testing, you can use:</strong></p>
          <p>Email: manager@test.com</p>
          <p>Password: any password (local dev)</p>
        </div>
      </div>
    </div>
  )
}