import * as React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '@/stores/auth.store';
import { RegisterFormData } from '@/interfaces/authInterface';
import TextInput from '@/libs/lib-text-input/TextInput';
import { validateField } from '../hooks/useValidation';
interface RegisterPageProps {
  onBack: () => void;
  emitSignUp: (formData: Partial<RegisterFormData>) => void;
}
export default function RegisterPage({ onBack, emitSignUp }: RegisterPageProps) {
  const { isLoading } = useAuthStore();

  const [formData, setFormData] = React.useState<Partial<RegisterFormData>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Partial<RegisterFormData>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Partial<RegisterFormData> = {};
    for (const [name, value] of Object.entries(formData) as [keyof RegisterFormData, any][]) {
      const fieldError = validateField(name, value);
      Object.assign(errors, fieldError);
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    emitSignUp(formData);
  };

  const handleInputChange = (value: string, name: keyof RegisterFormData) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - HomeHistory</title>
        <meta
          name="description"
          content="Create your HomeHistory account to access property insights and AI-powered recommendations."
        />
      </Helmet>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name Input */}
        <div>
          <TextInput
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={isLoading}
            errorMessage={errors['firstName']}
            required
            autoFocus
          />
        </div>

        {/* Last Name Input */}
        <div>
          <TextInput
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={isLoading}
            errorMessage={errors['lastName']}
            required
          />
        </div>

        {/* Email Input */}
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
          />
        </div>

        {/* Password Input */}
        <TextInput
          type="password"
          name="password"
          placeholder="Enter Password"
          value={formData.password}
          onChange={handleInputChange}
          disabled={isLoading}
          errorMessage={errors['password']}
          required
        />

        {/* Agree and Continue Button */}
        <button
          type="submit"
          disabled={
            isLoading || !Object.values(formData).every((value) => value?.toString().trim())
          }
          className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4  rounded-2xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500  disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm sm:text-base"
        >
          {isLoading ? 'Creating account...' : 'Agree and Continue'}
        </button>
      </form>

      {/* Sign in link */}
      <div className="text-center mt-4">
        <span className="text-xs sm:text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer hover:text-blue-800"
            disabled={isLoading}
          >
            Sign in
          </button>
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
    </>
  );
}
