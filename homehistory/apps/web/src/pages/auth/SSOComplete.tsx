import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'

export default function SSOComplete() {
  const navigate = useNavigate()
  React.useEffect(() => {
    authApi
      .getProfile()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/auth/login', { replace: true }))
  }, [navigate])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Completing sign-in…</div>
    </div>
  )
}


