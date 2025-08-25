import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'

export default function EmailEntry() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.lookup({ email: email || undefined, phone: phone || undefined })
      const exists = res.data?.data?.exists ?? false
      const dest = exists ? '/auth/login' : '/auth/register'
      const query = email ? `?email=${encodeURIComponent(email)}` : ''
      navigate(dest + query)
    } catch (err: any) {
      setError('Unable to check account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold">Log in or Sign up</h1>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading || (!email && !phone)} className="w-full h-12 rounded-xl bg-blue-600 text-white">
          Continue
        </button>
      </form>
    </div>
  )
}


