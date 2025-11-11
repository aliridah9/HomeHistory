import { AlertCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type Props = {
  label?: string;
  placeholder?: string;
  name: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  onChange: (value: string, name: string) => void;
};

const PhoneNumberInput = ({
  label,
  placeholder = 'Enter phone number',
  name,
  value,
  required = false,
  disabled = false,
  errorMessage,
  onChange,
}: Props) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={name} className="block text-sm text-gray-500 mb-1">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <div
        className={`flex items-center rounded-2xl border px-3 py-2.5 min-h-[42px] ${
          disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white'
        } ${errorMessage ? 'border-red-500' : 'border-gray-300'} focus-within:border-gray-900`}
      >
        <PhoneInput
          id={name}
          name={name}
          value={value}
          defaultCountry="US"
          onChange={(val) => onChange(val || '', name)}
          disabled={disabled}
          placeholder={placeholder}
          international
          countryCallingCodeEditable={true}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 [&_input]:border-0 [&_input]:outline-none [&_input]:ring-0 [&_input:focus]:border-0 [&_input:focus]:outline-none [&_input:focus]:ring-0 [&_input:focus]:shadow-none"
          countrySelectProps={{
            className: 'country-select-custom',
          }}
        />
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

export default PhoneNumberInput;
