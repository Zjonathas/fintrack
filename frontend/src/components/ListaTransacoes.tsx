import React, { useState, useEffect } from 'react';
import { Receipt, Truck, TrashSimple, PencilSimple, CheckSquare } from '@phosphor-icons/react';
import { Transacao } from '../types';
import { Checkbox } from './Checkbox';

interface ListaTransacoesProps {
  transacoes: Transacao[];
  loading: boolean;
  onExcluir: (id: number) => void;
  onExcluirEmLote: (ids: number[]) => void;
  onEditar: (transacao: Transacao) => void;
}

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const formatDataBR = (dataStr: string): string => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

export const ListaTransacoes: React.FC<ListaTransacoesProps> = ({
  transacoes,
  loading,
  onExcluir,
  onExcluirEmLote,
  onEditar,
}) => {
  const [selecionados, setSelecionados] = useState<number[]>([]);

  // Limpa da seleção itens que não estão mais presentes na lista exibida (ex: pós exclusão ou filtros)
  useEffect(() => {
    const idsAtuais = new Set(transacoes.map((t) => t.id));
    setSelecionados((prev) => prev.filter((id) => idsAtuais.has(id)));
  }, [transacoes]);

  if (loading) {
    return (
      <div className="card p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (transacoes.length === 0) {
    return (
      <div className="card p-10 text-center space-y-2">
        <Receipt size={36} weight="duotone" className="mx-auto text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">
          Nenhuma transação encontrada
        </p>
        <p className="text-xs text-muted-foreground">
          Tente ajustar os filtros acima ou registre uma nova transação.
        </p>
      </div>
    );
  }

  const todosSelecionados =
    transacoes.length > 0 && selecionados.length === transacoes.length;

  const toggleSelecionarTodos = () => {
    if (todosSelecionados) {
      setSelecionados([]);
    } else {
      setSelecionados(transacoes.map((t) => t.id));
    }
  };

  const toggleSelecionarLinha = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExcluirLote = () => {
    if (selecionados.length === 0) return;
    const msg =
      selecionados.length === 1
        ? 'Deseja realmente excluir 1 transação selecionada?'
        : `Deseja realmente excluir as ${selecionados.length} transações selecionadas? Esta ação não poderá ser desfeita.`;

    if (confirm(msg)) {
      onExcluirEmLote(selecionados);
      setSelecionados([]);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header da Tabela */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={18} weight="duotone" className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Extrato de Transações
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {transacoes.length} {transacoes.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Barra de Ações em Lote (Contextual) */}
      {selecionados.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckSquare size={17} weight="fill" className="text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary">
              {selecionados.length}{' '}
              {selecionados.length === 1 ? 'registro selecionado' : 'registros selecionados'}
            </span>
            <button
              onClick={() => setSelecionados([])}
              className="text-[11px] text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer transition-colors"
            >
              Desmarcar todos
            </button>
          </div>
          <button
            onClick={handleExcluirLote}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <TrashSimple size={14} weight="bold" />
            <span>Excluir selecionados ({selecionados.length})</span>
          </button>
        </div>
      )}

      {/* Tabela de Transações */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[620px]">
          <thead className="bg-muted/50 text-xs text-muted-foreground font-medium border-b border-border">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-10 text-center">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={todosSelecionados}
                    indeterminate={selecionados.length > 0 && !todosSelecionados}
                    onChange={toggleSelecionarTodos}
                    title={todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos os visíveis'}
                    aria-label="Selecionar todas as transações"
                  />
                </div>
              </th>
              <th scope="col" className="py-2.5 px-4">Descrição</th>
              <th scope="col" className="py-2.5 px-4">Categoria</th>
              <th scope="col" className="py-2.5 px-4">Data</th>
              <th scope="col" className="py-2.5 px-4 text-right">Produto</th>
              <th scope="col" className="py-2.5 px-4 text-right">Frete</th>
              <th scope="col" className="py-2.5 px-4 text-right">Total</th>
              <th scope="col" className="py-2.5 px-4 w-20 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transacoes.map((t) => {
              const estaSelecionado = selecionados.includes(t.id);
              return (
                <tr
                  key={t.id}
                  className={`transition-all duration-150 ${
                    estaSelecionado
                      ? 'bg-primary/10 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/20'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="py-3 px-3 text-center relative">
                    {estaSelecionado && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                    )}
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={estaSelecionado}
                        onChange={() => toggleSelecionarLinha(t.id)}
                        aria-label={`Selecionar transação ${t.descricao}`}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground max-w-[200px] truncate">
                    <span title={t.descricao}>{t.descricao}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {t.categoria?.nome || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDataBR(t.data)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-foreground">
                    {formatBRL(t.valor_produto)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {t.teve_entrega ? (
                      <span className="inline-flex items-center gap-1 text-warning font-medium text-xs">
                        <Truck size={12} weight="bold" />
                        +{formatBRL(t.valor_entrega)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-foreground">
                    {formatBRL(t.valor_total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditar(t)}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar transação"
                      >
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir "${t.descricao}"?`)) {
                            onExcluir(t.id);
                            setSelecionados((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir transação"
                      >
                        <TrashSimple size={15} weight="bold" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
