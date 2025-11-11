import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = React.useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = React.useState<Partial<ForgotPasswordFormData>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ForgotPasswordFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const success = await forgotPassword(formData.email);

      if (success) {
        setIsSubmitted(true);
        addNotification({
          type: 'success',
          title: 'Reset link sent',
          message: 'Check your email for password reset instructions.',
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Request failed',
        message: error.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const handleInputChange =
    (field: keyof ForgotPasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleResendEmail = async () => {
    try {
      await forgotPassword(formData.email);
      addNotification({
        type: 'success',
        title: 'Email resent',
        message: "We've sent another reset link to your email.",
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Resend failed',
        message: error.message || 'Something went wrong. Please try again.',
      });
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Check Your Email - HomeHistory</title>
          <meta
            name="description"
            content="Password reset instructions have been sent to your email address."
          />
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

              {/* Success Content */}
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>

                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Check your email</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  We've sent password reset instructions to <strong>{formData.email}</strong>
                </p>

                <p className="text-xs sm:text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or try a different email address.
                </p>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2   disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm sm:text-base"
                  >
                    {isLoading ? 'Sending...' : 'Resend email'}
                  </button>

                  <Link
                    to="/auth/login"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 sm:py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to sign in</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - HomeHistory</title>
        <meta
          name="description"
          content="Reset your HomeHistory account password. Enter your email to receive reset instructions."
        />
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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Forgot your password?
              </h1>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="Enter your email"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2  focus:border-transparent text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formData.email.trim() || isLoading}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2   disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm sm:text-base"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
