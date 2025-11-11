import { useState } from 'react';
import { Search, Eye, EyeOff, AlertCircle } from 'lucide-react';

type Props = {
  label?: string;
  placeholder: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
  onChange: (value: string, name: string) => void;
  onBlur?: () => void;
  errorMessage?: string;
  hasIcon?: boolean;
  hasCurrency?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
};

const TextInput = ({
  type = 'text',
  label,
  placeholder,
  name,
  value,
  required = false,
  maxLength,
  minLength,
  onChange,
  onBlur,
  disabled = false,
  errorMessage,
  hasIcon = false,
  min,
  max,
  autoFocus = false,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={name} className="block text-sm text-gray-500 mb-1">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          type={inputType}
          id={name}
          name={name}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          minLength={minLength || 0}
          disabled={disabled}
          {...(type === 'number' ? { min, max } : {})}
          onChange={(e) => onChange(e.target.value, name)}
          onBlur={onBlur}
          className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent pr-10 sm:pr-12 text-sm sm:text-base text-gray-900 ${disabled ? 'bg-gray-100 disabled:pointer-events-none opacity-75' : ''} ${errorMessage ? 'border-red-500' : ''}`}
        />

        {hasIcon && type === 'search' && (
          <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TextInput;
