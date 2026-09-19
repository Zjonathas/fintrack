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
import { Select } from './Select';
import { NumberInput } from './NumberInput';
import { DatePicker } from './DatePicker';

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
      setCategoriaId(transacao.categoria_id ?? '');
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
      setFeedback({ tipo: 'erro', msg: 'O valor deve ser positivo.' });
      return;
    }

    if (transacao.tipo === 'despesa' && !categoriaId) {
      setFeedback({ tipo: 'erro', msg: 'Selecione uma categoria.' });
      return;
    }

    const payload: TransacaoUpdatePayload = {
      descricao: descFormatada,
      valor_produto: numProduto,
      teve_entrega: transacao.tipo === 'despesa' ? teveEntrega : false,
      valor_entrega: transacao.tipo === 'despesa' && teveEntrega ? numEntrega : 0,
      data: data || transacao.data,
      categoria_id: transacao.tipo === 'despesa' ? Number(categoriaId) : null,
      tipo: transacao.tipo,
      forma_pagamento: transacao.forma_pagamento,
      cartao_id: transacao.cartao_id ?? null,
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
    } catch (err: any) {
      let msg = 'Erro ao atualizar a transação.';
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Campo'}: ${d.msg}`).join(' | ');
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSalvando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header do Modal Fixo */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card">
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
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
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

        {/* Formulário com scroll interno e rodapé fixo */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
              <label htmlFor="modal-editar-valor" className="text-xs font-medium text-foreground flex items-center gap-1">
                <CurrencyDollar size={14} className={transacao.tipo === 'receita' ? 'text-emerald-500' : 'text-primary'} />
                {transacao.tipo === 'receita' ? 'Valor da Receita (R$)' : 'Valor do Produto (R$)'} <span className="text-destructive">*</span>
              </label>
              <NumberInput
                id="modal-editar-valor"
                step={1}
                min={0}
                required
                placeholder="0,00"
                value={valorProduto}
                onChange={(val) => setValorProduto(val)}
                className={inputClass}
              />
            </div>

            {transacao.tipo === 'despesa' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Tag size={14} className="text-primary" />
                  Categoria <span className="text-destructive">*</span>
                </label>
                <Select
                  id="modal-editar-categoria"
                  value={categoriaId}
                  onChange={(val) => setCategoriaId(val ? Number(val) : '')}
                  placeholder="Selecione uma categoria..."
                  options={categorias.map((c) => ({
                    value: c.id,
                    label: c.nome,
                  }))}
                />
              </div>
            )}
          </div>

          {/* Grid: Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <CalendarBlank size={14} className="text-primary" />
              Data <span className="text-destructive">*</span>
            </label>
            <DatePicker
              id="modal-editar-data"
              value={data}
              onChange={(val) => setData(val)}
              required
            />
          </div>

          {/* Seção Isolada de Frete / Taxa de Entrega (apenas para Despesas) */}
          {transacao.tipo === 'despesa' && (
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
                  <NumberInput
                    id="modal-editar-valor-entrega"
                    step={1}
                    min={0}
                    placeholder="0,00"
                    value={valorEntrega}
                    onChange={(val) => setValorEntrega(val)}
                    className={inputClass}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    O frete será contabilizado isoladamente nas métricas.
                  </p>
                </div>
              )}
            </div>
          )}

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

          </div>

          {/* Rodapé Fixo com Botões de Ação */}
          <div className="shrink-0 p-4 border-t border-border bg-card/95 backdrop-blur flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-center"
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
