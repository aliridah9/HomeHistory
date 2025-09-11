import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, isLoading } = useAuthStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = React.useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = React.useState<Partial<ResetPasswordFormData>>({})
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  // Redirect if no token provided
  React.useEffect(() => {
    if (!token) {
      addNotification({
        type: "error",
        title: "Invalid reset link",
        message: "This password reset link is invalid or has expired."
      })
      navigate("/auth/forgot-password")
    }
  }, [token, navigate, addNotification])

  const validateForm = (): boolean => {
    const newErrors: Partial<ResetPasswordFormData> = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !token) return

    try {
      const success = await resetPassword({
        token,
        password: formData.password,
        email: email || undefined
      })

      if (success) {
        setIsSubmitted(true)
        addNotification({
          type: "success",
          title: "Password updated",
          message: "Your password has been successfully updated."
        })
      }
    } catch (error: any) {
      if (error.message?.includes("expired") || error.message?.includes("invalid")) {
        addNotification({
          type: "error",
          title: "Reset link expired",
          message: "This password reset link has expired. Please request a new one."
        })
        navigate("/auth/forgot-password")
      } else {
        addNotification({
          type: "error",
          title: "Reset failed",
          message: error.message || "Something went wrong. Please try again."
        })
      }
    }
  }

  const handleInputChange = (field: keyof ResetPasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ]
    
    strength = checks.filter(Boolean).length
    
    if (strength < 3) return { level: "weak", color: "text-danger", width: "33%" }
    if (strength < 4) return { level: "medium", color: "text-warning-600", width: "66%" }
    return { level: "strong", color: "text-success", width: "100%" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Password Updated - HomeHistory</title>
          <meta name="description" content="Your password has been successfully updated. You can now sign in with your new password." />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <span className="text-lg font-bold">H</span>
                </div>
                <span className="text-2xl font-bold hh-gradient-text">
                  HomeHistory
                </span>
              </Link>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Password updated
              </h1>
              
              <p className="text-base text-text-secondary mb-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>

              <Link to="/auth/login">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold py-3 flex items-center justify-center space-x-2">
                  <span>Continue to sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!token) {
    return (
      <>
        <Helmet>
          <title>Invalid Reset Link - HomeHistory</title>
        </Helmet>

        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-danger" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Invalid reset link
              </h1>
              
              <p className="text-base text-text-secondary mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>

              <Link to="/auth/forgot-password">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold">
                  Request new reset link
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - HomeHistory</title>
        <meta name="description" content="Create a new password for your HomeHistory account." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <span className="text-lg font-bold">H</span>
              </div>
              <span className="text-2xl font-bold hh-gradient-text">
                HomeHistory
              </span>
            </Link>
            
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Set new password
            </h1>
            <p className="text-base text-text-secondary">
              Create a strong password for your account
            </p>
          </div>

          {/* Reset Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-normal text-text-primary mb-2">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className={cn(
                      "pl-10 pr-10 rounded-lg border-gray-200 focus:border-primary",
                      errors.password && "border-danger focus:border-danger"
                    )}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">Password strength</span>
                      <span className={cn("text-xs font-medium", passwordStrength.color)}>
                        {passwordStrength.level}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          passwordStrength.level === "weak" && "bg-danger",
                          passwordStrength.level === "medium" && "bg-warning-500",
                          passwordStrength.level === "strong" && "bg-success"
                        )}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-sm text-danger">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-normal text-text-primary mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    className={cn(
                      "pl-10 pr-10 rounded-lg border-gray-200 focus:border-primary",
                      errors.confirmPassword && "border-danger focus:border-danger"
                    )}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-text-primary mb-2">Password must contain:</p>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li className="flex items-center space-x-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      formData.password.length >= 8 ? "bg-success" : "bg-gray-300"
                    )} />
                    <span>At least 8 characters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      /[a-z]/.test(formData.password) ? "bg-success" : "bg-gray-300"
                    )} />
                    <span>One lowercase letter</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      /[A-Z]/.test(formData.password) ? "bg-success" : "bg-gray-300"
                    )} />
                    <span>One uppercase letter</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      /\d/.test(formData.password) ? "bg-success" : "bg-gray-300"
                    )} />
                    <span>One number</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold py-3 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>Update password</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link
              to="/auth/login"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}