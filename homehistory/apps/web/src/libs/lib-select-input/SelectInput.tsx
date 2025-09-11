import Select, { MultiValue, SingleValue, StylesConfig } from 'react-select';
import { AlertCircle } from 'lucide-react';

type OptionType = { label: string; value: string };

type SelectInputProps = {
  label?: string;
  name: string;
  type: 'select' | 'multiselect';
  value: string | OptionType[];
  required?: boolean;
  placeholder?: string;
  options: OptionType[];
  errorMessage?: string;
  disabled?: boolean;
  interestedProviders?: string[];
  onChange: (value: string | OptionType[], name: string) => void;
};

const SelectInput = ({
  label,
  name,
  value,
  type,
  required = false,
  placeholder,
  disabled = false,
  options,
  errorMessage,

  onChange,
}: SelectInputProps) => {
  const getSelectedValue = (value: string | OptionType[], options: OptionType[]) => {
    if (typeof value === 'string') {
      return options.find((opt) => opt.value === value) || null;
    }
    return value;
  };

  const customStyles: StylesConfig<OptionType, boolean> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: disabled ? '#f6f7f9' : '#fff',
      borderColor: errorMessage ? '#ef4444' : state.isFocused ? '#24292e' : '#ced2d6',
      boxShadow: 'none',
      outline: 'none',
      '&:hover': {
        borderColor: 'none',
      },
      borderRadius: '1rem',
      padding: '2px 4px',
      minHeight: '42px',
    }),

    placeholder: (provided) => ({
      ...provided,
      color: '#9ea5ad',
    }),

    singleValue: (provided) => ({
      ...provided,
      color: '#454c52',
      fontWeight: 500,
    }),

    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e5f0f9',
      borderRadius: '6px',
      padding: '2px 6px',
    }),

    multiValueLabel: (provided) => ({
      ...provided,
      color: '#2571a4',
      fontWeight: 500,
    }),

    multiValueRemove: (provided) => ({
      ...provided,
      color: '#2571a4',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#4197CB',
        color: '#FFFFFF',
      },
    }),

    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#4197CB' : '#596066',
      '&:hover': {
        color: '#2571a4',
      },
    }),

    indicatorSeparator: () => ({
      display: 'none', // hide the vertical line
    }),

    menu: (provided) => ({
      ...provided,
      backgroundColor: '#fff',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
      padding: '4px',
      marginTop: '4px',
    }),

    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#4197CB' : state.isFocused ? '#f3f7fc' : '#fff',
      color: state.isSelected ? '#FFFFFF' : '#24292e',
      cursor: 'pointer',
      padding: '10px 12px',
      borderRadius: '0.5rem',
    }),
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={name} className="block text-sm text-gray-500 mb-1 font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Select
        id={name}
        name={name}
        options={options}
        value={getSelectedValue(value, options)}
        onChange={(selected: SingleValue<OptionType> | MultiValue<OptionType>) =>
          onChange(selected as any, name)
        }
        isDisabled={disabled}
        isMulti={type === 'multiselect'}
        placeholder={placeholder}
        styles={customStyles}
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

export default SelectInput;
