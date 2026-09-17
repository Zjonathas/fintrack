import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  X,
} from '@phosphor-icons/react';

export interface DatePickerProps {
  id?: string;
  value: string; // Formato ISO "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseISODate(iso?: string | null): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function formatISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso?: string | null): string {
  const parsed = parseISODate(iso);
  if (!parsed) return '';
  const d = String(parsed.day).padStart(2, '0');
  const m = String(parsed.month + 1).padStart(2, '0');
  return `${d}/${m}/${parsed.year}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Selecione uma data...',
  required = false,
  disabled = false,
  className = '',
}) => {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedValue = parseISODate(value);

  const hoje = new Date();
  const hojeYear = hoje.getFullYear();
  const hojeMonth = hoje.getMonth();
  const hojeDay = hoje.getDate();

  const [viewYear, setViewYear] = useState<number>(parsedValue ? parsedValue.year : hojeYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue ? parsedValue.month : hojeMonth);

  // Sincroniza o mês e ano visualizados quando a data muda externamente
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  // Fecha o calendário ao clicar fora ou pressionar Escape
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

  const handleMudarMes = (delta: number) => {
    let novoMes = viewMonth + delta;
    let novoAno = viewYear;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    }
    setViewMonth(novoMes);
    setViewYear(novoAno);
  };

  const handleMudarAno = (delta: number) => {
    setViewYear((prev) => prev + delta);
  };

  const handleSelectData = (ano: number, mes: number, dia: number) => {
    onChange(formatISODate(ano, mes, dia));
    setAberto(false);
  };

  const handleHoje = () => {
    handleSelectData(hojeYear, hojeMonth, hojeDay);
  };

  const handleOntem = () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    handleSelectData(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
  };

  const handleLimpar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setAberto(false);
  };

  // Cálculo da matriz de dias do calendário
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Domingo
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const diasAnteriores = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    diasAnteriores.push(prevMonthDays - i);
  }

  const diasAtuais = [];
  for (let d = 1; d <= daysInMonth; d++) {
    diasAtuais.push(d);
  }

  const totalExibido = diasAnteriores.length + diasAtuais.length;
  const diasRestantes = totalExibido % 7 === 0 ? 0 : 7 - (totalExibido % 7);
  const diasProximos = [];
  for (let d = 1; d <= diasRestantes; d++) {
    diasProximos.push(d);
  }

  const displayTexto = formatDisplayDate(value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Gatilho principal estilizado */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setAberto(!aberto)}
        aria-haspopup="dialog"
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
          <CalendarBlank
            size={16}
            weight="duotone"
            className={`shrink-0 transition-colors ${
              aberto ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
          <span
            className={`truncate text-sm ${
              displayTexto ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
            {displayTexto || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!required && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleLimpar}
              title="Limpar data"
              className="p-1 text-muted-foreground/60 hover:text-destructive hover:bg-muted/70 rounded transition-colors cursor-pointer"
            >
              <X size={12} weight="bold" />
            </span>
          )}
        </div>
      </button>

      {/* Popover do Calendário Customizado */}
      {aberto && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[290px] sm:w-[310px] bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Cabeçalho de Navegação (Mês e Ano) */}
          <div className="flex items-center justify-between gap-1 mb-3 pb-2 border-b border-border/70">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleMudarAno(-1)}
                title="Ano anterior"
                aria-label="Ano anterior"
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                <CaretDoubleLeft size={13} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => handleMudarMes(-1)}
                title="Mês anterior"
                aria-label="Mês anterior"
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
            </div>

            <div className="text-xs font-semibold text-foreground tracking-tight">
              <span>{MESES[viewMonth]}</span>{' '}
              <span className="text-primary font-bold">{viewYear}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleMudarMes(1)}
                title="Próximo mês"
                aria-label="Próximo mês"
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                <CaretRight size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => handleMudarAno(1)}
                title="Próximo ano"
                aria-label="Próximo ano"
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                <CaretDoubleRight size={13} weight="bold" />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_SEMANA.map((dia) => (
              <span
                key={dia}
                className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider py-0.5"
              >
                {dia}
              </span>
            ))}
          </div>

          {/* Grid dos Dias do Mês */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Dias do mês anterior */}
            {diasAnteriores.map((dia) => {
              const mesAnt = viewMonth === 0 ? 11 : viewMonth - 1;
              const anoAnt = viewMonth === 0 ? viewYear - 1 : viewYear;
              return (
                <button
                  key={`prev-${dia}`}
                  type="button"
                  onClick={() => handleSelectData(anoAnt, mesAnt, dia)}
                  className="h-8 w-full flex items-center justify-center text-xs text-muted-foreground/35 hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors cursor-pointer"
                >
                  {dia}
                </button>
              );
            })}

            {/* Dias do mês atual */}
            {diasAtuais.map((dia) => {
              const isHoje =
                viewYear === hojeYear && viewMonth === hojeMonth && dia === hojeDay;
              const isSelecionado =
                parsedValue &&
                viewYear === parsedValue.year &&
                viewMonth === parsedValue.month &&
                dia === parsedValue.day;

              return (
                <button
                  key={`curr-${dia}`}
                  type="button"
                  onClick={() => handleSelectData(viewYear, viewMonth, dia)}
                  className={`h-8 w-full flex items-center justify-center text-xs rounded-lg font-medium transition-all cursor-pointer
                    ${
                      isSelecionado
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/40 scale-105'
                        : isHoje
                        ? 'border border-primary text-primary font-bold hover:bg-primary/10'
                        : 'text-foreground hover:bg-primary/15 hover:text-primary'
                    }
                  `}
                >
                  {dia}
                </button>
              );
            })}

            {/* Dias do próximo mês */}
            {diasProximos.map((dia) => {
              const mesProx = viewMonth === 11 ? 0 : viewMonth + 1;
              const anoProx = viewMonth === 11 ? viewYear + 1 : viewYear;
              return (
                <button
                  key={`next-${dia}`}
                  type="button"
                  onClick={() => handleSelectData(anoProx, mesProx, dia)}
                  className="h-8 w-full flex items-center justify-center text-xs text-muted-foreground/35 hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors cursor-pointer"
                >
                  {dia}
                </button>
              );
            })}
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/70 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOntem}
                className="px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors cursor-pointer"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={handleHoje}
                className="px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
              >
                Hoje
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAberto(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
