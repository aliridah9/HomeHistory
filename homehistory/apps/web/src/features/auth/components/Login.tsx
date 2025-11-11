import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '@/stores/auth.store';
import TextInput from '@/libs/lib-text-input/TextInput';
import { LoginFormData } from '@/interfaces/authInterface';
import { validateField } from '../hooks/useValidation';
import { useUIStore } from '@/stores/ui.store';

enum LoginStep {
  Email = 'EMAIL',
  Password = 'PASSWORD',
}

interface LoginProps {
  currentStep: LoginStep;
  onStepChange: (step: LoginStep) => void;
  emitSignUp: () => void;
  emitLogin: (formData: LoginFormData) => void;
  emitCreateProfissionalAccount: () => void;
}

export default function Login({
  currentStep,
  onStepChange,
  emitSignUp,
  emitLogin,
  emitCreateProfissionalAccount,
}: LoginProps) {
  const [searchParams] = useSearchParams();
  const { isLoading } = useAuthStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = React.useState<LoginFormData>({
    email: searchParams.get('email') || '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = React.useState<Partial<LoginFormData>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    emitLogin(formData);
  };

  const handleInputChange = (value: string, name: keyof LoginFormData) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'phone') => {
    console.log(`Social login clicked: ${provider}`);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

      if (provider === 'google' || provider === 'facebook') {
        try {
          const healthCheck = await fetch(`${base}/health`, { method: 'GET' });
          if (healthCheck.ok) {
            const endpoint = provider === 'google' ? '/auth/google' : '/auth/facebook';
            window.location.href = `${base}${endpoint}`;
          } else {
            throw new Error('Backend not available');
          }
        } catch (error) {
          addNotification({
            type: 'error',
            title: 'Service Unavailable',
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in requires the backend server to be running. Please start the API server first.`,
          });
        }
      } else if (provider === 'phone') {
        addNotification({
          type: 'info',
          title: 'Phone Authentication',
          message: 'Phone number authentication will be available soon.',
        });
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      addNotification({
        type: 'error',
        title: 'Social Login Failed',
        message: error.message || 'Something went wrong with social login. Please try again.',
      });
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateField('email', formData.email);
    setErrors((prev) => ({ ...prev, ...formErrors }));
    if (Object.keys(formErrors).length > 0) return;

    if (formData.email.trim()) {
      onStepChange(LoginStep.Password);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateField('password', formData.password);
    setErrors((prev) => ({ ...prev, ...formErrors }));
    if (Object.keys(formErrors).length > 0) return;

    handleSubmit(e);
  };

  return (
    <>
      <Helmet>
        <title>Sign In - HomeHistory</title>
        <meta
          name="description"
          content="Sign in to your HomeHistory account to access property insights and AI-powered recommendations."
        />
      </Helmet>

      {currentStep === LoginStep.Email ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <TextInput
              type="text"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              errorMessage={errors['email']}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!formData.email.trim() || isLoading}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-2xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm sm:text-base"
          >
            Continue
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={emitCreateProfissionalAccount}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm sm:text-base"
            >
              Create Professional Account
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={emitSignUp}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm sm:text-base"
            >
              Sign up
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <TextInput
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              errorMessage={errors['password']}
              required
              autoFocus
            />
          </div>

          <div className="text-right">
            <Link
              to="/auth/forgot-password"
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm sm:text-base"
            >
              Forget Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={!formData.password.trim() || isLoading}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-2xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm sm:text-base"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      )}

      {currentStep === LoginStep.Email && (
        <>
          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <img src="/auth/google.svg" alt="Google" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <img src="/auth/facebook.svg" alt="Facebook" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('phone')}
              className="flex items-center justify-center p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <img src="/auth/phone.svg" alt="Phone" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </>
      )}

      <div className="text-center mt-6">
        <Link
          to="/terms"
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Terms and conditions
        </Link>
      </div>
    </>
  );
}
