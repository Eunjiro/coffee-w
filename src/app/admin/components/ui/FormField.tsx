import React, { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement | React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  className = ''
}) => {
  const autoId = useId();
  const fieldId = `ff-${autoId}`;

  // If `children` is a valid React element, clone it and ensure it has an `id` and `aria-labelledby`.
  // Narrow the child to a ReactElement with unknown props to avoid using `any`.
  let child: React.ReactNode;
  if (React.isValidElement(children)) {
    const childElement = children as React.ReactElement<Record<string, unknown>, any>;
    const existingId = (childElement.props as { id?: string }).id;
    child = React.cloneElement(childElement, {
      id: existingId ?? fieldId,
      'aria-labelledby': `${fieldId}-label`,
    });
  } else {
    child = children;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label id={`${fieldId}-label`} htmlFor={fieldId} className="block text-sm font-medium text-[#776B5D]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {child}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

interface InputProps {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  icon: Icon,
  error = false,
  className = '',
  id,
  name,
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#776B5D] focus:border-transparent text-[#776B5D] placeholder:text-[#776B5D]/50';
  const errorClasses = error ? 'border-red-500' : 'border-[#B0A695]';
  const iconClasses = Icon ? 'pl-10' : 'pl-3';

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#776B5D]/50" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        id={id}
        name={name}
        className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
      />
    </div>
  );
};

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  icon: Icon,
  error = false,
  className = '',
  id,
  name,
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#776B5D] focus:border-transparent appearance-none bg-white text-[#776B5D]';
  const errorClasses = error ? 'border-red-500' : 'border-[#B0A695]';
  const iconClasses = Icon ? 'pl-10' : 'pl-3';

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#776B5D]/50" />
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        id={id}
        name={name}
        className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  icon?: LucideIcon;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  icon: Icon,
  error = false,
  className = '',
  id,
  name,
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#776B5D] focus:border-transparent text-[#776B5D] placeholder:text-[#776B5D]/50 resize-none';
  const errorClasses = error ? 'border-red-500' : 'border-[#B0A695]';
  const iconClasses = Icon ? 'pl-10' : 'pl-3';

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-3 w-4 h-4 text-[#776B5D]/50" />
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        id={id}
        name={name}
        className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
      />
    </div>
  );
};

export default FormField;
