import React from 'react';
import {
  Funnel,
  MagnifyingGlass,
  ArrowCounterClockwise,
  Tag,
  Truck,
  CalendarBlank,
} from '@phosphor-icons/react';
import { Categoria, FiltrosTransacao, TipoTransacao } from '../types';
import { Select } from './Select';
import { DatePicker } from './DatePicker';

interface FiltrosTransacoesProps {
  filtros: FiltrosTransacao;
  categorias: Categoria[];
  totalEncontrados: number;
  onFiltroChange: (novosFiltros: FiltrosTransacao) => void;
  onLimparFiltros: () => void;
}

export const FiltrosTransacoes: React.FC<FiltrosTransacoesProps> = ({
  filtros,
  categorias,
  totalEncontrados,
  onFiltroChange,
  onLimparFiltros,
}) => {
  const temFiltroAtivo =
    Boolean(filtros.busca) ||
    (filtros.categoria_id !== '' && filtros.categoria_id !== undefined) ||
    (filtros.teve_entrega !== '' && filtros.teve_entrega !== undefined) ||
    Boolean(filtros.data_inicio) ||
    Boolean(filtros.data_fim) ||
    (filtros.tipo !== '' && filtros.tipo !== undefined);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Funnel size={16} weight="duotone" className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filtros de Pesquisa</h3>
          <span className="text-xs text-muted-foreground tabular-nums ml-1">
            ({totalEncontrados} {totalEncontrados === 1 ? 'encontrada' : 'encontradas'})
          </span>
        </div>
        {temFiltroAtivo && (
          <button
            onClick={onLimparFiltros}
            className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Busca */}
        <div>
          <label htmlFor="filtro-busca" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <MagnifyingGlass size={13} weight="bold" />
            <span>Buscar</span>
          </label>
          <input
            id="filtro-busca"
            type="text"
            placeholder="Nome ou descrição..."
            value={filtros.busca || ''}
            onChange={(e) => onFiltroChange({ ...filtros, busca: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="filtro-categoria" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <Tag size={13} weight="bold" />
            <span>Categoria</span>
          </label>
          <Select
            id="filtro-categoria"
            value={filtros.categoria_id ?? ''}
            onChange={(val) =>
              onFiltroChange({
                ...filtros,
                categoria_id: val === '' ? '' : Number(val),
              })
            }
            placeholder="Todas as categorias"
            options={[
              { value: '', label: 'Todas as categorias' },
              ...categorias.map((cat) => ({ value: cat.id, label: cat.nome })),
            ]}
          />
        </div>

        {/* Entrega */}
        <div>
          <label htmlFor="filtro-entrega" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <Truck size={13} weight="bold" />
            <span>Taxa de Entrega</span>
          </label>
          <Select
            id="filtro-entrega"
            value={
              filtros.teve_entrega === '' || filtros.teve_entrega === undefined
                ? ''
                : String(filtros.teve_entrega)
            }
            onChange={(val) => {
              onFiltroChange({
                ...filtros,
                teve_entrega: val === '' ? '' : val === 'true',
              });
            }}
            placeholder="Todos os status"
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'true', label: 'Apenas c/ taxa de entrega' },
              { value: 'false', label: 'Apenas s/ taxa de entrega' },
            ]}
          />
        </div>

        {/* Filtro Tipo */}
        <div>
          <label htmlFor="filtro-tipo" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <span className="w-3 h-3 rounded-full bg-primary/60 inline-block" />
            <span>Tipo</span>
          </label>
          <Select
            id="filtro-tipo"
            value={filtros.tipo ?? ''}
            onChange={(val) =>
              onFiltroChange({
                ...filtros,
                tipo: val === '' ? '' : (val as TipoTransacao),
              })
            }
            options={[
              { value: '', label: 'Receitas e Despesas' },
              { value: 'receita', label: 'Apenas Receitas' },
              { value: 'despesa', label: 'Apenas Despesas' },
            ]}
          />
        </div>

        {/* Data */}
        <div>
          <label htmlFor="filtro-data" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <CalendarBlank size={13} weight="bold" />
            <span>A partir de</span>
          </label>
          <DatePicker
            id="filtro-data"
            placeholder="Qualquer data"
            value={filtros.data_inicio || ''}
            onChange={(val) => onFiltroChange({ ...filtros, data_inicio: val })}
          />
        </div>
      </div>
    </div>
  );
};
