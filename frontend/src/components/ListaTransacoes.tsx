import React from 'react';
import { Receipt, Truck, TrashSimple } from '@phosphor-icons/react';
import { Transacao } from '../types';

interface ListaTransacoesProps {
  transacoes: Transacao[];
  loading: boolean;
  onExcluir: (id: number) => void;
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
}) => {
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

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={18} weight="duotone" className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Extrato de Transações
          </h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {transacoes.length} {transacoes.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground font-medium border-b border-border">
            <tr>
              <th scope="col" className="py-2.5 px-4">Descrição</th>
              <th scope="col" className="py-2.5 px-4">Categoria</th>
              <th scope="col" className="py-2.5 px-4">Data</th>
              <th scope="col" className="py-2.5 px-4 text-right">Produto</th>
              <th scope="col" className="py-2.5 px-4 text-right">Frete</th>
              <th scope="col" className="py-2.5 px-4 text-right">Total</th>
              <th scope="col" className="py-2.5 px-4 w-12 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transacoes.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
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
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir "${t.descricao}"?`)) {
                        onExcluir(t.id);
                      }
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Excluir transação"
                  >
                    <TrashSimple size={15} weight="bold" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
