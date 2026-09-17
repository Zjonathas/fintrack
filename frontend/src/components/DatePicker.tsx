import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  value: string; // ISO "YYYY-MM-DD"
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

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

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
  const [coords, setCoords] = useState<{ top: number; left: number; positionAbove: boolean }>({
    top: 0,
    left: 0,
    positionAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parsedValue = parseISODate(value);

  const hoje = new Date();
  const hojeYear = hoje.getFullYear();
  const hojeMonth = hoje.getMonth();
  const hojeDay = hoje.getDate();

  const [viewYear, setViewYear] = useState<number>(parsedValue ? parsedValue.year : hojeYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue ? parsedValue.month : hojeMonth);

  // Sincroniza viewMonth e viewYear quando a data externa é atualizada
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  // Calcula posição inteligente (ancorada ao botão, renderizada via Portal para nunca ser cortada)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 315;
    const margin = 6;

    // Alinhamento horizontal: prefere alinhar pela direita do campo para encaixar perfeitamente no modal
    let left = rect.right - popoverWidth;
    if (left < 10) {
      left = Math.max(10, rect.left);
    }
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }

    // Alinhamento vertical: abre para cima se não houver espaço suficiente abaixo
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const positionAbove = spaceBelow < popoverHeight + margin && spaceAbove > popoverHeight + margin;

    const top = positionAbove
      ? rect.top - popoverHeight - margin
      : rect.bottom + margin;

    setCoords({ top, left, positionAbove });
  }, []);

  // Abre ou fecha recalculando a posição
  const toggleAberto = () => {
    if (disabled) return;
    if (!aberto) {
      updatePosition();
      setAberto(true);
    } else {
      setAberto(false);
    }
  };

  // Escuta scroll e resize para manter o calendário perfeitamente alinhado
  useEffect(() => {
    if (!aberto) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setAberto(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, updatePosition]);

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

  // Cálculo da matriz de dias
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
    <div className={`relative w-full ${className}`}>
      {/* Botão Gatilho Estilizado */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleAberto}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className={`w-full px-3 py-2 text-sm bg-background border rounded-lg text-left flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer select-none
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background
          ${
            aberto
              ? 'border-primary ring-2 ring-primary/25 shadow-xs'
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

      {/* Popover flutuante renderizado no document.body via Portal para nunca ser cortado por footers ou scroll */}
      {aberto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '280px',
              zIndex: 99999,
            }}
            className={`bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3 select-none animate-in fade-in zoom-in-95 duration-150 ${
              coords.positionAbove ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {/* Cabeçalho do Calendário */}
            <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-border/70">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMudarAno(-1)}
                  title="Ano anterior"
                  aria-label="Ano anterior"
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <CaretDoubleLeft size={12} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMudarMes(-1)}
                  title="Mês anterior"
                  aria-label="Mês anterior"
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <CaretLeft size={13} weight="bold" />
                </button>
              </div>

              <div className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1">
                <span>{MESES[viewMonth]}</span>
                <span className="text-primary font-bold">{viewYear}</span>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMudarMes(1)}
                  title="Próximo mês"
                  aria-label="Próximo mês"
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <CaretRight size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMudarAno(1)}
                  title="Próximo ano"
                  aria-label="Próximo ano"
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <CaretDoubleRight size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DIAS_SEMANA.map((dia, idx) => (
                <span
                  key={`${dia}-${idx}`}
                  className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider py-0.5"
                >
                  {dia}
                </span>
              ))}
            </div>

            {/* Grid dos Dias */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Mês Anterior */}
              {diasAnteriores.map((dia) => {
                const mesAnt = viewMonth === 0 ? 11 : viewMonth - 1;
                const anoAnt = viewMonth === 0 ? viewYear - 1 : viewYear;
                return (
                  <button
                    key={`prev-${dia}`}
                    type="button"
                    onClick={() => handleSelectData(anoAnt, mesAnt, dia)}
                    className="h-7 w-full flex items-center justify-center text-[11px] text-muted-foreground/30 hover:bg-muted/50 hover:text-foreground rounded-md transition-colors cursor-pointer"
                  >
                    {dia}
                  </button>
                );
              })}

              {/* Mês Atual */}
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
                    className={`h-7 w-full flex items-center justify-center text-[11px] rounded-md font-medium transition-all cursor-pointer
                      ${
                        isSelecionado
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs shadow-primary/40 scale-105'
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

              {/* Próximo Mês */}
              {diasProximos.map((dia) => {
                const mesProx = viewMonth === 11 ? 0 : viewMonth + 1;
                const anoProx = viewMonth === 11 ? viewYear + 1 : viewYear;
                return (
                  <button
                    key={`next-${dia}`}
                    type="button"
                    onClick={() => handleSelectData(anoProx, mesProx, dia)}
                    className="h-7 w-full flex items-center justify-center text-[11px] text-muted-foreground/30 hover:bg-muted/50 hover:text-foreground rounded-md transition-colors cursor-pointer"
                  >
                    {dia}
                  </button>
                );
              })}
            </div>

            {/* Rodapé do Popover */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/70 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleOntem}
                  className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  Ontem
                </button>
                <button
                  type="button"
                  onClick={handleHoje}
                  className="px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
                >
                  Hoje
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
