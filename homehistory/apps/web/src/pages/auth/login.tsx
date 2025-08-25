import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Eye, EyeOff, X } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading } = useAuthStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: (searchParams.get('email') || ''),
    password: "",
    rememberMe: false
  })
  const [errors, setErrors] = React.useState<Partial<LoginFormData>>({})
  const [showPassword, setShowPassword] = React.useState(false)

  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const success = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })

      if (success) {
        addNotification({
          type: "success",
          title: "Welcome back!",
          message: "You've been successfully signed in."
        })
        navigate(redirectTo, { replace: true })
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Sign in failed",
        message: error.message || "Invalid email or password. Please try again."
      })
    }
  }

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "rememberMe" ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "phone") => {
    console.log(`Social login clicked: ${provider}`)
    
    try {
      // Check if backend is available first
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      
      if (provider === "google" || provider === "facebook") {
        // Check if backend is running before redirecting
        try {
          const healthCheck = await fetch(`${base}/health`, { method: 'GET' });
          if (healthCheck.ok) {
            // Backend is running, proceed with OAuth
            const endpoint = provider === "google" ? "/auth/google" : "/auth/facebook";
            window.location.href = `${base}${endpoint}`;
          } else {
            throw new Error('Backend not available');
          }
        } catch (error) {
          // Backend is not running
          addNotification({
            type: "error",
            title: "Service Unavailable",
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in requires the backend server to be running. Please start the API server first.`
          })
        }
      } else if (provider === "phone") {
        // Phone number authentication
        addNotification({
          type: "info",
          title: "Phone Authentication",
          message: "Phone number authentication will be available soon."
        })
      }
      
    } catch (error: any) {
      console.error("Social login error:", error)
      addNotification({
        type: "error",
        title: "Social Login Failed",
        message: error.message || "Something went wrong with social login. Please try again."
      })
    }
  }

  const [step, setStep] = React.useState<'email' | 'password'>('email')

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.email.trim()) {
      setStep('password')
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password.trim()) {
      handleSubmit(e)
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign In - HomeHistory</title>
        <meta name="description" content="Sign in to your HomeHistory account to access property insights and AI-powered recommendations." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-[0px_6px_24px_rgba(0,0,0,0.06),0px_0px_1px_rgba(0,0,0,0.03)] p-4 sm:p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {step === 'password' && (
                  <button
                    onClick={() => setStep('email')}
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
                )}
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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {step === 'email' ? 'Log in or Sign up' : 'Log in'}
              </h1>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6" />

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                                 {/* Continue Button */}
                 <button
                   type="submit"
                   disabled={!formData.email.trim() || isLoading}
                   className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                 >
                   Continue
                 </button>

                                 {/* Create Professional Account Link */}
                 <div className="text-center">
                   <button
                     type="button"
                     onClick={() => navigate('/signup/professional')}
                     className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm sm:text-base"
                   >
                     Create Professional Account
                   </button>
                 </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

                                 {/* Forgot Password Link */}
                 <div className="text-right">
                   <Link
                     to="/auth/forgot-password"
                     className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm sm:text-base"
                   >
                     Forget Password?
                   </Link>
                 </div>

                                 {/* Login Button */}
                 <button
                   type="submit"
                   disabled={!formData.password.trim() || isLoading}
                   className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                 >
                   {isLoading ? 'Signing in...' : 'Login'}
                 </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                <img src="/auth/google.svg" alt="Google" className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                <img src="/auth/facebook.svg" alt="Facebook" className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin("phone")}
                className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                <img src="/auth/phone.svg" alt="Phone" className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Terms and Conditions */}
            <div className="text-center mt-6">
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