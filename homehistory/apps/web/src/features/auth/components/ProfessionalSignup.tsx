import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import TextInput from '@/libs/lib-text-input/TextInput';
import SelectInput from '@/libs/lib-select-input/SelectInput';
import PhoneNumberInput from '@/libs/lib-phone-number/PhoneNumberInput';
import { ProfessionalType, RegisterFormData } from '@/interfaces/authInterface';
import { validateField } from '../hooks/useValidation';

type FormErrors<T> = Partial<Record<keyof T, string>>;

export default function ProfessionalSignup() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = React.useState<RegisterFormData>({
    professionalType: '' as ProfessionalType | '',
    firstName: '',
    lastName: '',
    phone: '',
    email: search.get('email') || '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const professionalTypeOptions = [
    { value: 'AGENT', label: 'Agent' },
    { value: 'LANDLORD', label: 'Landlord' },
    { value: 'LENDER', label: 'Lender' },
    { value: 'CONTRACTOR', label: 'Contractor' },
  ];

  const handleChange = (value: string, name: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as keyof RegisterFormData];
      return newErrors;
    });
  };

  const validateCompleteForm = (formData: RegisterFormData): FormErrors<RegisterFormData> => {
    const allErrors: FormErrors<RegisterFormData> = {};

    const fieldsToValidate: (keyof RegisterFormData)[] = [
      'professionalType',
      'firstName',
      'lastName',
      'email',
      'password',
      'phone',
    ];

    fieldsToValidate.forEach((fieldName) => {
      const fieldErrors = validateField(fieldName, formData[fieldName]);
      Object.assign(allErrors, fieldErrors);
    });

    return allErrors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: RegisterFormData = {
      professionalType: form.professionalType,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone,
    };

    const validationErrors = validateCompleteForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const ok = await register({
      ...formData,
      userType: 'agent',
      subscribeNewsletter: false,
    });
    if (ok) navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="mr-3 p-1 rounded-full text-gray-700 hover:bg-gray-100 transition"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 10H5m0 0 5-5m-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-xl text-gray-900 font-semibold">Create Professional Account</h1>
          </div>
          <div className="rounded-3xl p-8 border border-[var(--Border-Secondary,#E5E7EA)]">
            <p className="text-gray-900 mb-6 font-semibold">
              Join as an Agent, Landlord, Lender, or Contractor
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <SelectInput
                  label="Professional Type"
                  name="professionalType"
                  type="select"
                  value={form.professionalType}
                  options={professionalTypeOptions}
                  placeholder="Choose Type"
                  onChange={handleChange}
                  required
                  errorMessage={errors.professionalType}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextInput
                    label="First Name"
                    name="firstName"
                    placeholder="Enter name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    errorMessage={errors.firstName}
                  />
                </div>
                <div>
                  <TextInput
                    label="Last Name"
                    name="lastName"
                    placeholder="Enter name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    errorMessage={errors.lastName}
                  />
                </div>
              </div>
              <div>
                <PhoneNumberInput
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 555 555 5555"
                  errorMessage={errors.phone}
                />
              </div>
              <div>
                <TextInput
                  label="Email Address"
                  name="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  type="text"
                  errorMessage={errors.email}
                />
              </div>
              <div>
                <div className="relative">
                  <TextInput
                    label="Password"
                    name="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    type="password"
                    errorMessage={errors.password}
                  />
                </div>
              </div>
              <button
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-blue-600 text-white"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
