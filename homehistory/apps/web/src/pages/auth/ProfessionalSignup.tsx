import * as React from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

type ProfessionalType = 'AGENT'|'LANDLORD'|'LENDER'|'CONTRACTOR'

export default function ProfessionalSignup() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const { register, isLoading } = useAuthStore()

  const [showPassword, setShowPassword] = React.useState(false)
  const [form, setForm] = React.useState({
    professionalType: '' as ProfessionalType | '',
    firstName: '',
    lastName: '',
    phoneE164: '',
    email: search.get('email') || '',
    password: '',
  })
  const [errors, setErrors] = React.useState<Record<string,string>>({})

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.professionalType) e.professionalType = 'Required'
    if (!form.firstName) e.firstName = 'Required'
    if (!form.lastName) e.lastName = 'Required'
    if (!form.phoneE164) e.phoneE164 = 'Required'
    if (!form.email) e.email = 'Required'
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const ok = await register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phoneE164,
      userType: 'agent',
      subscribeNewsletter: false,
    })
    if (ok) navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="mr-3 text-gray-700">{/* back chevron */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 10H5m0 0 5-5m-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h1 className="text-xl font-semibold">Create Professional Account</h1>
          </div>
          <p className="text-gray-600 mb-6">Join as an Agent, Landlord, Lender, or Contractor</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-1">Professional Types <span className="text-red-500">*</span></label>
              <select value={form.professionalType} onChange={set('professionalType')} className="w-full h-12 border rounded-lg px-3">
                <option value="">Choose Type</option>
                <option value="AGENT">Agent</option>
                <option value="LANDLORD">Landlord</option>
                <option value="LENDER">Lender</option>
                <option value="CONTRACTOR">Contractor</option>
              </select>
              {errors.professionalType && <p className="text-red-600 text-xs mt-1">{errors.professionalType}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">First Name <span className="text-red-500">*</span></label>
                <input value={form.firstName} onChange={set('firstName')} className="w-full h-12 border rounded-lg px-3" placeholder="Enter name"/>
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name <span className="text-red-500">*</span></label>
                <input value={form.lastName} onChange={set('lastName')} className="w-full h-12 border rounded-lg px-3" placeholder="Enter name"/>
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input value={form.phoneE164} onChange={set('phoneE164')} className="w-full h-12 border rounded-lg px-3" placeholder="+1 555 555 5555"/>
              {errors.phoneE164 && <p className="text-red-600 text-xs mt-1">{errors.phoneE164}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Email Address <span className="text-red-500">*</span></label>
              <input value={form.email} onChange={set('email')} className="w-full h-12 border rounded-lg px-3" placeholder="Enter email address"/>
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text':'password'} value={form.password} onChange={set('password')} className="w-full h-12 border rounded-lg px-3 pr-10" placeholder="Enter password"/>
                <button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">👁</button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>
            <button disabled={isLoading} className="w-full h-12 rounded-xl bg-blue-600 text-white">Continue</button>
          </form>
        </div>
      </div>
    </div>
  )
}


