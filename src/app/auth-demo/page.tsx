import AuthExample from '@/components/auth/AuthExample'

export default function AuthDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Supabase Authentication Demo
        </h1>
        <AuthExample />
      </div>
    </div>
  )
}