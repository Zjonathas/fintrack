import React, { useState } from 'react';
import {
  PlusCircle,
  CurrencyDollar,
  CalendarBlank,
  Tag,
  Truck,
  Plus,
  CheckCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { Categoria, TransacaoCreatePayload } from '../types';
import { apiService } from '../services/api';
import { Checkbox } from './Checkbox';
import { Select } from './Select';

interface ModalNovaTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  onTransacaoCriada: () => void;
  onCategoriaCriada: (novaCategoria: Categoria) => void;
}

const hoje = (): string => new Date().toISOString().split('T')[0];

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export const ModalNovaTransacao: React.FC<ModalNovaTransacaoProps> = ({
  isOpen,
  onClose,
  categorias,
  onTransacaoCriada,
  onCategoriaCriada,
}) => {
  const [descricao, setDescricao] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [data, setData] = useState(hoje());
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [teveEntrega, setTeveEntrega] = useState(false);
  const [valorEntrega, setValorEntrega] = useState('');

  const [submetendo, setSubmetendo] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  const [novaCat, setNovaCat] = useState('');
  const [criarCat, setCriarCat] = useState(false);
  const [salvandoCat, setSalvandoCat] = useState(false);

  if (!isOpen) return null;

  const numProduto = parseFloat(valorProduto.replace(',', '.')) || 0;
  const numEntrega = teveEntrega ? (parseFloat(valorEntrega.replace(',', '.')) || 0) : 0;
  const total = numProduto + numEntrega;

  const handleCriarCategoria = async () => {
    if (!novaCat.trim()) return;
    try {
      setSalvandoCat(true);
      const nova = await apiService.criarCategoria(novaCat.trim());
      onCategoriaCriada(nova);
      setCategoriaId(nova.id);
      setNovaCat('');
      setCriarCat(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar categoria.';
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSalvandoCat(false);
    }
  };

  const resetForm = () => {
    setDescricao('');
    setValorProduto('');
    setTeveEntrega(false);
    setValorEntrega('');
    setData(hoje());
    setCategoriaId('');
    setFeedback(null);
  };

  const handleFechar = () => {
    if (submetendo) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!descricao.trim()) {
      setFeedback({ tipo: 'erro', msg: 'Informe a descrição da despesa.' });
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

    const payload: TransacaoCreatePayload = {
      descricao: descricao.trim(),
      valor_produto: numProduto,
      teve_entrega: teveEntrega,
      valor_entrega: teveEntrega ? numEntrega : 0,
      data: data || hoje(),
      categoria_id: Number(categoriaId),
    };

    try {
      setSubmetendo(true);
      await apiService.criarTransacao(payload);
      setFeedback({ tipo: 'ok', msg: `"${descricao}" registrada com sucesso!` });
      onTransacaoCriada();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar transação.';
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSubmetendo(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submetendo) handleFechar();
      }}
    >
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header do Modal Fixo */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <PlusCircle size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Nova Transação</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre uma nova despesa com cálculo isolado de frete
              </p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            disabled={submetendo}
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
              <label htmlFor="modal-nova-descricao" className="text-xs font-medium text-foreground">
                Descrição <span className="text-destructive">*</span>
              </label>
            <input
              id="modal-nova-descricao"
              type="text"
              required
              placeholder="Ex: Almoço, Compras Mercado, Remédios..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={inputClass}
              maxLength={255}
              autoFocus
            />
          </div>

          {/* Grid: Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="modal-nova-valor" className="text-xs font-medium text-foreground flex items-center gap-1">
                <CurrencyDollar size={14} className="text-primary" />
                Valor do Produto (R$) <span className="text-destructive">*</span>
              </label>
              <input
                id="modal-nova-valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valorProduto}
                onChange={(e) => setValorProduto(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-nova-data" className="text-xs font-medium text-foreground flex items-center gap-1">
                <CalendarBlank size={14} className="text-primary" />
                Data <span className="text-destructive">*</span>
              </label>
              <input
                id="modal-nova-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-nova-categoria" className="flex items-center gap-1 text-xs font-medium text-foreground">
                <Tag size={14} className="text-primary" />
                <span>Categoria</span> <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCriarCat(!criarCat)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} weight="bold" />
                <span>{criarCat ? 'Cancelar' : 'Nova Categoria'}</span>
              </button>
            </div>

            {criarCat && (
              <div className="flex gap-2 p-2.5 rounded-lg bg-muted/40 border border-border animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Nome da nova categoria..."
                  value={novaCat}
                  onChange={(e) => setNovaCat(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleCriarCategoria}
                  disabled={salvandoCat || !novaCat.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvandoCat ? 'Criando...' : 'Salvar'}
                </button>
              </div>
            )}

            <Select
              id="modal-nova-categoria"
              value={categoriaId}
              onChange={(val) => setCategoriaId(val ? Number(val) : '')}
              placeholder="Selecione uma categoria..."
              options={categorias.map((cat) => ({
                value: cat.id,
                label: cat.nome,
              }))}
            />
          </div>

          {/* Checkbox de Frete / Taxa de Entrega */}
          <div className="pt-2 border-t border-border space-y-3">
            <label
              htmlFor="modal-nova-teve-entrega"
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                teveEntrega
                  ? 'bg-warning/5 border-warning/30 shadow-xs'
                  : 'border-border hover:bg-secondary/40'
              }`}
            >
              <Checkbox
                id="modal-nova-teve-entrega"
                checked={teveEntrega}
                onChange={(e) => {
                  setTeveEntrega(e.target.checked);
                  if (!e.target.checked) setValorEntrega('');
                }}
              />
              <div className="flex-1 flex items-center gap-2">
                <Truck size={16} weight="duotone" className={teveEntrega ? 'text-warning' : 'text-muted-foreground'} />
                <span className="text-xs font-medium text-foreground">
                  Houve taxa de entrega / frete?
                </span>
              </div>
              {teveEntrega && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/25">
                  Ativo
                </span>
              )}
            </label>

            {/* Campo condicional de Valor de Entrega */}
            {teveEntrega && (
              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1.5 animate-in fade-in duration-150">
                <label htmlFor="modal-nova-valor-entrega" className="text-xs font-medium text-foreground flex items-center gap-1">
                  <CurrencyDollar size={14} className="text-warning" />
                  Valor da Entrega / Frete (R$)
                </label>
                <input
                  id="modal-nova-valor-entrega"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={valorEntrega}
                  onChange={(e) => setValorEntrega(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  O frete será contabilizado e rastreado isoladamente nos gráficos e métricas.
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

          </div>

          {/* Rodapé Fixo com Botões de Ação */}
          <div className="shrink-0 p-4 border-t border-border bg-card/95 backdrop-blur flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleFechar}
              disabled={submetendo}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submetendo}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-center"
            >
              {submetendo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={15} weight="bold" />
                  <span>Registrar Transação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
