import React from 'react';
import { Check, Minus } from '@phosphor-icons/react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  onChange,
  disabled,
  className = '',
  label,
  id,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  const isActive = checked || indeterminate;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none cursor-pointer group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`w-[18px] h-[18px] rounded-[5px] border transition-all duration-150 flex items-center justify-center cursor-pointer
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
            group-active:scale-95
            ${
              isActive
                ? 'bg-primary border-primary text-primary-foreground shadow-xs shadow-primary/25'
                : 'bg-card dark:bg-muted/20 border-border hover:border-primary/60 group-hover:bg-muted/40 shadow-2xs'
            }
            ${className}
          `}
        >
          {indeterminate ? (
            <Minus size={12} weight="bold" className="animate-in zoom-in-75 duration-100" />
          ) : checked ? (
            <Check size={12} weight="bold" className="animate-in zoom-in-75 duration-100" />
          ) : null}
        </div>
      </div>
      {label && <span className="text-xs font-medium text-foreground">{label}</span>}
    </label>
  );
};
