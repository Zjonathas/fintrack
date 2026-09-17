import React, { useState, useEffect } from 'react';
import {
  PencilSimple,
  X,
  CurrencyDollar,
  CalendarBlank,
  Tag,
  Truck,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { Categoria, Transacao, TransacaoUpdatePayload } from '../types';
import { apiService } from '../services/api';
import { Checkbox } from './Checkbox';

interface ModalEditarTransacaoProps {
  isOpen: boolean;
  transacao: Transacao | null;
  categorias: Categoria[];
  onClose: () => void;
  onTransacaoAtualizada: (transacaoAtualizada: Transacao) => void;
}

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export const ModalEditarTransacao: React.FC<ModalEditarTransacaoProps> = ({
  isOpen,
  transacao,
  categorias,
  onClose,
  onTransacaoAtualizada,
}) => {
  const [descricao, setDescricao] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [data, setData] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [teveEntrega, setTeveEntrega] = useState(false);
  const [valorEntrega, setValorEntrega] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  // Popula o formulário quando uma transação for selecionada para edição
  useEffect(() => {
    if (transacao) {
      setDescricao(transacao.descricao);
      setValorProduto(String(transacao.valor_produto));
      setData(transacao.data);
      setCategoriaId(transacao.categoria_id);
      setTeveEntrega(transacao.teve_entrega);
      setValorEntrega(transacao.teve_entrega ? String(transacao.valor_entrega) : '');
      setFeedback(null);
    }
  }, [transacao]);

  if (!isOpen || !transacao) return null;

  const numProduto = parseFloat(valorProduto.replace(',', '.')) || 0;
  const numEntrega = teveEntrega ? (parseFloat(valorEntrega.replace(',', '.')) || 0) : 0;
  const total = numProduto + numEntrega;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const descFormatada = descricao.trim();
    if (!descFormatada) {
      setFeedback({ tipo: 'erro', msg: 'Informe a descrição da transação.' });
      return;
    }

    if (numProduto <= 0) {
      setFeedback({ tipo: 'erro', msg: 'O valor do produto deve ser positivo.' });
      return;
    }

    if (!categoriaId) {
      setFeedback({ tipo: 'erro', msg: 'Selecione uma categoria.' });
      return;
    }

    const payload: TransacaoUpdatePayload = {
      descricao: descFormatada,
      valor_produto: numProduto,
      teve_entrega: teveEntrega,
      valor_entrega: teveEntrega ? numEntrega : 0,
      data: data || transacao.data,
      categoria_id: Number(categoriaId),
    };

    try {
      setSalvando(true);
      const atualizada = await apiService.atualizarTransacao(transacao.id, payload);
      onTransacaoAtualizada(atualizada);
      setFeedback({ tipo: 'ok', msg: 'Transação atualizada com sucesso!' });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar a transação.';
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSalvando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8">
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <PencilSimple size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Editar Transação</h2>
              <p className="text-xs text-muted-foreground">
                ID #{transacao.id} — Atualize os detalhes desta despesa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={salvando}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            title="Fechar (Esc)"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.tipo === 'ok'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {feedback.tipo === 'ok' ? (
              <CheckCircle size={16} weight="fill" className="shrink-0" />
            ) : (
              <WarningCircle size={16} weight="fill" className="shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Formulário de Edição */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Descrição <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pizza artesanal, Farmácia, Mercado"
              className={inputClass}
              maxLength={255}
              required
            />
          </div>

          {/* Grid: Valor e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <CurrencyDollar size={14} className="text-primary" />
                Valor do Produto (R$) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valorProduto}
                onChange={(e) => setValorProduto(e.target.value)}
                placeholder="0,00"
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Tag size={14} className="text-primary" />
                Categoria <span className="text-destructive">*</span>
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : '')}
                className={inputClass}
                required
              >
                <option value="">Selecione uma categoria...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <CalendarBlank size={14} className="text-primary" />
              Data da Despesa <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Seção Isolada de Frete / Taxa de Entrega (Regra de Negócio Central) */}
          <div className="pt-2 border-t border-border space-y-3">
            <label
              htmlFor="editar-teve-entrega"
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                teveEntrega
                  ? 'bg-warning/5 border-warning/30 shadow-xs'
                  : 'border-border hover:bg-secondary/40'
              }`}
            >
              <Checkbox
                id="editar-teve-entrega"
                checked={teveEntrega}
                onChange={(e) => {
                  setTeveEntrega(e.target.checked);
                  if (!e.target.checked) setValorEntrega('');
                }}
              />
              <div className="flex-1 flex items-center gap-2">
                <Truck size={16} weight="duotone" className={teveEntrega ? 'text-warning' : 'text-muted-foreground'} />
                <span className="text-xs font-medium text-foreground">
                  Esta transação teve taxa de frete / entrega?
                </span>
              </div>
              {teveEntrega && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/25">
                  Ativo
                </span>
              )}
            </label>

            {/* Campo Condicional de Frete */}
            {teveEntrega && (
              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <CurrencyDollar size={14} className="text-warning" />
                  Valor da Taxa de Entrega (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorEntrega}
                  onChange={(e) => setValorEntrega(e.target.value)}
                  placeholder="0,00"
                  className={inputClass}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Este valor será isolado nas métricas analíticas e gráficos do dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Resumo Dinâmico do Total */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Total Calculado</span>
              <div className="font-semibold text-foreground text-sm tabular-nums">
                {formatBRL(total)}
              </div>
            </div>
            {teveEntrega && numEntrega > 0 && (
              <span className="text-[11px] text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20 tabular-nums">
                Inclui frete de {formatBRL(numEntrega)}
              </span>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {salvando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} weight="bold" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
