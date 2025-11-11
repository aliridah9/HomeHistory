import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AlertCircle, Calendar } from 'lucide-react';
import { forwardRef } from 'react';

type DatePickerInputProps = {
  label?: string;
  name: string;
  value: Date | null;
  required?: boolean;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  timeIntervals?: number;
  className?: string;
  onChange: (date: Date | null, name: string) => void;
};

const CustomInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, placeholder, disabled, errorMessage }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        className={`
        w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 
        bg-white border rounded-2xl transition-colors duration-200 
        focus:outline-none focus:ring-0
        ${
          errorMessage
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-300 focus:border-gray-800 hover:border-gray-400'
        }
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
        placeholder:text-gray-400
      `}
      />
      <Calendar
        size={18}
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none
        ${errorMessage ? 'text-red-400' : 'text-gray-500'}
      `}
      />
    </div>
  )
);

CustomInput.displayName = 'CustomInput';

const DatePickerInput = ({
  label,
  name,
  value,
  required = false,
  placeholder = 'Select a date',
  disabled = false,
  errorMessage,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat,
  timeFormat = 'HH:mm',
  timeIntervals = 15,
  className = '',
  onChange,
}: DatePickerInputProps) => {
  const format = dateFormat || (showTimeSelect ? 'yyyy/MM/dd HH:mm' : 'yyyy/MM/dd');

  const handleDateChange = (date: Date | null) => {
    onChange(date, name);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm text-gray-500 mb-1 font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <DatePicker
        id={name}
        name={name}
        selected={value}
        onChange={handleDateChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        dateFormat={format}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        customInput={
          <CustomInput placeholder={placeholder} disabled={disabled} errorMessage={errorMessage} />
        }
        popperClassName="custom-datepicker-popper"
        wrapperClassName="w-full"
        calendarClassName="custom-datepicker-calendar"
        dayClassName={() => 'custom-datepicker-day'}
      />

      {errorMessage && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
