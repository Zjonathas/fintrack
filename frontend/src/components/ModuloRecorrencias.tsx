import React, { useState } from 'react';
import {
  ArrowsClockwise,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  ArrowCircleUp,
  ArrowCircleDown,
} from '@phosphor-icons/react';
import { Categoria, TransacaoRecorrente } from '../types';
import { apiService } from '../services/api';
import { ModalRecorrencia } from './ModalRecorrencia';

interface ModuloRecorrenciasProps {
  recorrencias: TransacaoRecorrente[];
  categorias: Categoria[];
  onRecorrenciaAtualizada: () => void;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const FREQUENCIA_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  anual: 'Anual',
};

export const ModuloRecorrencias: React.FC<ModuloRecorrenciasProps> = ({
  recorrencias,
  categorias,
  onRecorrenciaAtualizada,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [recorrenciaEditando, setRecorrenciaEditando] = useState<TransacaoRecorrente | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const handleEditar = (r: TransacaoRecorrente) => {
    setRecorrenciaEditando(r);
    setModalAberto(true);
  };

  const handleNova = () => {
    setRecorrenciaEditando(null);
    setModalAberto(true);
  };

  const handleDeletar = async (r: TransacaoRecorrente) => {
    if (!confirm(`Deletar recorrência "${r.descricao}"?`)) return;
    setExcluindo(r.id);
    try {
      await apiService.deletarRecorrencia(r.id);
      onRecorrenciaAtualizada();
    } catch {
      alert('Erro ao deletar recorrência.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleToggle = async (r: TransacaoRecorrente) => {
    setToggling(r.id);
    try {
      await apiService.toggleRecorrencia(r.id);
      onRecorrenciaAtualizada();
    } catch {
      alert('Erro ao alternar status.');
    } finally {
      setToggling(null);
    }
  };

  const receitas = recorrencias.filter((r) => r.tipo === 'receita');
  const despesas = recorrencias.filter((r) => r.tipo === 'despesa');
  const totalReceitas = receitas.filter((r) => r.ativa).reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesas.filter((r) => r.ativa).reduce((s, r) => s + r.valor, 0);

  const RenderLista = ({ items, label }: { items: TransacaoRecorrente[]; label: string }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhuma {label.toLowerCase()} recorrente.</p>
      ) : (
        items.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              r.ativa ? 'bg-card border-border' : 'bg-muted/30 border-border/50 opacity-60'
            }`}
          >
            {/* Ícone do tipo */}
            <div className={`shrink-0 p-1.5 rounded-lg ${r.tipo === 'receita' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
              {r.tipo === 'receita'
                ? <ArrowCircleUp size={16} weight="duotone" />
                : <ArrowCircleDown size={16} weight="duotone" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{r.descricao}</p>
              <p className="text-[11px] text-muted-foreground">
                {r.categoria?.nome} · Dia {r.dia_vencimento} · {FREQUENCIA_LABEL[r.frequencia] || r.frequencia}
              </p>
            </div>

            {/* Valor */}
            <span className={`text-xs font-semibold tabular-nums shrink-0 ${r.tipo === 'receita' ? 'text-emerald-500' : 'text-foreground'}`}>
              {formatBRL(r.valor)}
            </span>

            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleToggle(r)}
                disabled={toggling === r.id}
                title={r.ativa ? 'Desativar' : 'Ativar'}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                {r.ativa
                  ? <ToggleRight size={18} weight="fill" className="text-primary" />
                  : <ToggleLeft size={18} />
                }
              </button>
              <button
                onClick={() => handleEditar(r)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <PencilSimple size={14} />
              </button>
              <button
                onClick={() => handleDeletar(r)}
                disabled={excluindo === r.id}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowsClockwise size={20} weight="duotone" className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Transações Recorrentes</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {recorrencias.length}
          </span>
        </div>
        <button
          onClick={handleNova}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} weight="bold" />
          Nova Recorrência
        </button>
      </div>

      {/* Resumo */}
      {recorrencias.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-[11px] text-muted-foreground">Receitas / mês</p>
            <p className="text-sm font-semibold text-emerald-500 tabular-nums">{formatBRL(totalReceitas)}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[11px] text-muted-foreground">Despesas / mês</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(totalDespesas)}</p>
          </div>
        </div>
      )}

      {recorrencias.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowsClockwise size={40} weight="duotone" className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma recorrência cadastrada</p>
          <p className="text-xs mt-1">Adicione contas fixas para ter projeções automáticas no fluxo de caixa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {receitas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                <ArrowCircleUp size={13} weight="duotone" />
                Receitas ({receitas.length})
              </h3>
              <RenderLista items={receitas} label="Receita" />
            </div>
          )}
          {despesas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ArrowCircleDown size={13} weight="duotone" />
                Despesas ({despesas.length})
              </h3>
              <RenderLista items={despesas} label="Despesa" />
            </div>
          )}
        </div>
      )}

      <ModalRecorrencia
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        recorrencia={recorrenciaEditando}
        categorias={categorias}
        onSalvo={onRecorrenciaAtualizada}
      />
    </div>
  );
};
