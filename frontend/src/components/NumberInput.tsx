import React from 'react';
import { CaretUp, CaretDown } from '@phosphor-icons/react';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (val: string) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  step = 1,
  min,
  max,
  className = '',
  ...props
}) => {
  const handleIncrement = () => {
    const num = parseFloat(String(value).replace(',', '.')) || 0;
    const precision = String(step).includes('.') ? String(step).split('.')[1].length : 2;
    const novo = num + step;
    if (max !== undefined && novo > max) return;
    onChange(novo.toFixed(precision));
  };

  const handleDecrement = () => {
    const num = parseFloat(String(value).replace(',', '.')) || 0;
    const precision = String(step).includes('.') ? String(step).split('.')[1].length : 2;
    const novo = num - step;
    if (min !== undefined && novo < min) return;
    onChange(novo.toFixed(precision));
  };

  return (
    <div className="relative w-full flex items-center">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
        {...props}
      />
      {/* Setas de incremento/decremento modernas customizadas */}
      <div className="absolute right-1.5 flex flex-col items-center justify-center select-none py-1">
        <button
          type="button"
          tabIndex={-1}
          onClick={handleIncrement}
          className="p-0.5 rounded text-muted-foreground/60 hover:text-primary hover:bg-muted/80 transition-all cursor-pointer leading-none flex items-center justify-center active:scale-90"
          title="Aumentar valor"
          aria-label="Aumentar valor"
        >
          <CaretUp size={11} weight="bold" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={handleDecrement}
          className="p-0.5 rounded text-muted-foreground/60 hover:text-primary hover:bg-muted/80 transition-all cursor-pointer leading-none flex items-center justify-center active:scale-90"
          title="Diminuir valor"
          aria-label="Diminuir valor"
        >
          <CaretDown size={11} weight="bold" />
        </button>
      </div>
    </div>
  );
};
