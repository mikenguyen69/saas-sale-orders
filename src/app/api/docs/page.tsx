'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/docs/swagger.json')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(error => console.error('Failed to load Swagger spec:', error))
  }, [])

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Sales Order Management API</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive API documentation for the Sales Order Management system
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SwaggerUI
          spec={spec}
          requestInterceptor={request => {
            // Add authorization header if available
            const token = localStorage.getItem('supabase.auth.token')
            if (token) {
              request.headers.Authorization = `Bearer ${JSON.parse(token).access_token}`
            }
            return request
          }}
        />
      </div>
    </div>
  )
}
