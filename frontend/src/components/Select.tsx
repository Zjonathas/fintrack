import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value: string | number | undefined | null;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  disabled = false,
  className = '',
  id,
  icon,
}) => {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const opcaoSelecionada = options.find((opt) => String(opt.value) === String(value));

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAberto(false);
      }
    };

    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setAberto(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setAberto(!aberto)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`w-full px-3 py-2 text-sm bg-background border rounded-lg text-left flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer select-none
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background
          ${
            aberto
              ? 'border-primary ring-2 ring-primary/20 shadow-xs'
              : 'border-input hover:border-muted-foreground/40'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/40' : ''}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {opcaoSelecionada?.icon && (
            <span className="text-primary shrink-0">{opcaoSelecionada.icon}</span>
          )}
          <span
            className={`truncate ${
              opcaoSelecionada ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
            {opcaoSelecionada ? opcaoSelecionada.label : placeholder}
          </span>
        </div>

        <CaretDown
          size={14}
          weight="bold"
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
            aberto ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Popover com a Lista de Opções */}
      {aberto && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((opt) => {
              const selecionado = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={selecionado}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer select-none
                    ${
                      selecionado
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {selecionado && (
                    <Check size={14} weight="bold" className="text-primary shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
