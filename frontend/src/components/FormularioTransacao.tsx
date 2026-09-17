import React, { useState } from 'react';
import {
  PlusCircle,
  CurrencyDollar,
  CalendarBlank,
  Tag,
  Truck,
  Plus,
  CheckCircle,
  PencilSimpleLine,
} from '@phosphor-icons/react';
import { Categoria, TransacaoCreatePayload } from '../types';
import { apiService } from '../services/api';
import { Checkbox } from './Checkbox';

interface FormularioTransacaoProps {
  categorias: Categoria[];
  onTransacaoCriada: () => void;
  onCategoriaCriada: (novaCategoria: Categoria) => void;
}

const hoje = (): string => new Date().toISOString().split('T')[0];

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export const FormularioTransacao: React.FC<FormularioTransacaoProps> = ({
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
      setFeedback({ tipo: 'ok', msg: `"${descricao}" registrada com sucesso.` });
      setDescricao('');
      setValorProduto('');
      setTeveEntrega(false);
      setValorEntrega('');
      setData(hoje());
      onTransacaoCriada();
      setTimeout(() => setFeedback(null), 3000);
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
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <PlusCircle size={18} weight="duotone" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Nova Transação</h3>
          <p className="text-xs text-muted-foreground">
            Lançamento com rastreamento isolado de frete
          </p>
        </div>
      </div>

      {/* Feedback contextual */}
      {feedback && (
        <div
          className={`px-3 py-2 rounded-md text-xs font-medium ${
            feedback.tipo === 'ok'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Descrição */}
        <div>
          <label htmlFor="descricao" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <PencilSimpleLine size={13} weight="bold" />
            <span>Descrição</span>
          </label>
          <input
            id="descricao"
            type="text"
            required
            placeholder="Ex: Almoço iFood, Farmácia, Mercado"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Valor + Data */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="valor-produto" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <CurrencyDollar size={13} weight="bold" />
              <span>Valor (R$)</span>
            </label>
            <input
              id="valor-produto"
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
          <div>
            <label htmlFor="data" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <CalendarBlank size={13} weight="bold" />
              <span>Data</span>
            </label>
            <input
              id="data"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="categoria" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag size={13} weight="bold" />
              <span>Categoria</span>
            </label>
            <button
              type="button"
              onClick={() => setCriarCat(!criarCat)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Plus size={11} weight="bold" />
              <span>{criarCat ? 'Cancelar' : 'Nova Categoria'}</span>
            </button>
          </div>

          {criarCat && (
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                placeholder="Nome da categoria..."
                value={novaCat}
                onChange={(e) => setNovaCat(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                disabled={salvandoCat || !novaCat.trim()}
                onClick={handleCriarCategoria}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {salvandoCat ? '...' : 'Salvar'}
              </button>
            </div>
          )}

          <select
            id="categoria"
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione uma categoria...
            </option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox de Frete / Taxa de Entrega */}
        <div className="pt-1">
          <label
            htmlFor="teve-entrega"
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              teveEntrega
                ? 'bg-warning/5 border-warning/30 shadow-xs'
                : 'border-border hover:bg-secondary/40'
            }`}
          >
            <Checkbox
              id="teve-entrega"
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
        </div>

        {/* Campo condicional de Valor de Entrega */}
        {teveEntrega && (
          <div className="p-3 border border-warning/30 bg-warning/5 rounded-md space-y-1.5">
            <label htmlFor="valor-entrega" className="flex items-center gap-1.5 text-xs font-medium text-warning">
              <Truck size={13} weight="bold" />
              <span>Valor do Frete (R$)</span>
            </label>
            <input
              id="valor-entrega"
              type="number"
              step="0.01"
              min="0"
              required={teveEntrega}
              placeholder="Ex: 8,90"
              value={valorEntrega}
              onChange={(e) => setValorEntrega(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-warning/40 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning/50"
            />
            <p className="text-[11px] text-muted-foreground">
              Este valor é segregado nas estatísticas financeiras.
            </p>
          </div>
        )}

        {/* Resumo da transação */}
        <div className="border-t border-border pt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal (Produto)</span>
            <span className="tabular-nums font-medium">{formatBRL(numProduto)}</span>
          </div>
          {teveEntrega && (
            <div className="flex justify-between text-xs text-warning">
              <span className="flex items-center gap-1">
                <Truck size={12} weight="bold" />
                <span>Frete</span>
              </span>
              <span className="tabular-nums font-medium">+ {formatBRL(numEntrega)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-foreground pt-1">
            <span>Total da Compra</span>
            <span className="tabular-nums text-primary">{formatBRL(total)}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submetendo}
          className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {submetendo ? (
            <span>Processando...</span>
          ) : (
            <>
              <CheckCircle size={16} weight="bold" />
              <span>Registrar Transação</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
