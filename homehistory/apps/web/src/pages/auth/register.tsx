import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Eye, EyeOff, X } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"

interface RegisterFormData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = React.useState<RegisterFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  })
  const [errors, setErrors] = React.useState<Partial<RegisterFormData>>({})
  const [showPassword, setShowPassword] = React.useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: "buyer", // Default to buyer for now
        subscribeNewsletter: true
      })

      if (success) {
        addNotification({
          type: "success",
          title: "Account created!",
          message: "Welcome to HomeHistory. You can now start exploring properties."
        })
        navigate("/dashboard", { replace: true })
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Registration failed",
        message: error.message || "Something went wrong. Please try again."
      })
    }
  }

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - HomeHistory</title>
        <meta name="description" content="Create your HomeHistory account to access property insights and AI-powered recommendations." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-[0px_6px_24px_rgba(0,0,0,0.06),0px_0px_1px_rgba(0,0,0,0.03)] p-4 sm:p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/auth/login')}
                  className="mr-3 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 10L5 10M5 10L10 5M5 10L10 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Title */}
            <div className="text-left mb-6">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Sign up</h1>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name Input */}
              <div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  placeholder="First name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>

              {/* Last Name Input */}
              <div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  placeholder="Last name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Enter email address"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="Enter Password"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 sm:pr-12 text-sm sm:text-base"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>

              {/* Agree and Continue Button */}
              <button
                type="submit"
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password || isLoading}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                {isLoading ? 'Creating account...' : 'Agree and Continue'}
              </button>
            </form>

                         {/* Sign in link */}
             <div className="text-center mt-4">
               <span className="text-xs sm:text-sm text-gray-600">
                 Already have an account?{' '}
                 <Link
                   to="/auth/login"
                   className="text-blue-600 hover:text-blue-700 font-medium"
                 >
                   Sign in
                 </Link>
               </span>
             </div>

             {/* Terms and Conditions */}
             <div className="text-center mt-4">
               <Link
                 to="/terms"
                 className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
               >
                 Terms and conditions
               </Link>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}