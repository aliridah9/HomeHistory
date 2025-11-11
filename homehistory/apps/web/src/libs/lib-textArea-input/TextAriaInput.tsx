import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

type TextAreaInputProps = {
  label: string;
  placeholder: string;
  name: string;
  required?: boolean;
  value: string;
  maxLength?: number;
  disabled?: boolean;
  errorMessage?: string;
  onChange: (value: string, name: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

const TextAreaInput = ({
  label,
  placeholder,
  name,
  required = false,
  value,
  disabled = false,
  onChange,
  errorMessage,
  maxLength = 1000,
  onBlur,
}: TextAreaInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <label htmlFor={name} className="text-xs font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </label>

      <div
        className={`relative w-full rounded-md transition-all duration-200 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } border ${
          errorMessage ? 'border-red-500' : focused ? 'border-purple-600' : 'border-gray-300'
        }`}
      >
        <textarea
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value, name)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setFocused(true)}
          className="w-full h-full p-3 bg-transparent text-sm text-gray-800 outline-none resize-y placeholder:text-xs placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <div className="absolute bottom-2 right-3 text-xs text-gray-400">
          {value?.length} / {maxLength}
        </div>
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

export default TextAreaInput;
