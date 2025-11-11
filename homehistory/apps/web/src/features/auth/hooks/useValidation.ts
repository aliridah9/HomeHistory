import { RegisterFormData } from '@/interfaces/authInterface';
import { isValidPhoneNumber } from 'react-phone-number-input';

type FormErrors<T> = Partial<Record<keyof T, string>>;

export const validateField = <K extends keyof RegisterFormData>(
  name: K,
  value: RegisterFormData[K]
): FormErrors<RegisterFormData> => {
  const errors: FormErrors<RegisterFormData> = {};
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=])[A-Za-z\d!@#$%^&*()_\-+=]{8,}$/;

  if (!value?.toString().trim()) {
    errors[name] = 'This field is required';
    return errors;
  }

  switch (name) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())) {
        errors.email = 'Please enter a valid email address';
      }
      break;

    case 'password':
      if (!strongPasswordRegex.test(value.toString())) {
        errors.password =
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';
      }
      break;

    case 'phone':
      if (!isValidPhoneNumber(value.toString())) {
        errors.phone = 'Please enter a valid phone number';
      }
      break;
  }

  return errors;
};
