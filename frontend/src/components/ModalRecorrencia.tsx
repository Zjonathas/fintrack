import React, { useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  X,
  CheckCircle,
  WarningCircle,
  FloppyDisk,
  ArrowCircleUp,
  ArrowCircleDown,
} from '@phosphor-icons/react';
import { Categoria, TipoTransacao, TransacaoRecorrente, TransacaoRecorrentePayload } from '../types';
import { apiService } from '../services/api';
import { NumberInput } from './NumberInput';
import { Select } from './Select';

interface ModalRecorrenciaProps {
  isOpen: boolean;
  onClose: () => void;
  recorrencia?: TransacaoRecorrente | null;
  categorias: Categoria[];
  onSalvo: () => void;
}

const FREQUENCIAS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'anual', label: 'Anual' },
];

export const ModalRecorrencia: React.FC<ModalRecorrenciaProps> = ({
  isOpen,
  onClose,
  recorrencia,
  categorias,
  onSalvo,
}) => {
  const [tipo, setTipo] = useState<TipoTransacao>('despesa');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [frequencia, setFrequencia] = useState('mensal');
  const [observacao, setObservacao] = useState('');

  const [submetendo, setSubmetendo] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  useEffect(() => {
    if (recorrencia) {
      setTipo(recorrencia.tipo);
      setDescricao(recorrencia.descricao);
      setValor(String(recorrencia.valor));
      setCategoriaId(recorrencia.categoria_id ?? '');
      setDiaVencimento(String(recorrencia.dia_vencimento));
      setFrequencia(recorrencia.frequencia);
      setObservacao(recorrencia.observacao || '');
    } else {
      setTipo('despesa');
      setDescricao('');
      setValor('');
      setCategoriaId('');
      setDiaVencimento('');
      setFrequencia('mensal');
      setObservacao('');
    }
    setFeedback(null);
  }, [recorrencia, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numValor = parseFloat(valor.replace(',', '.')) || 0;
    const numDia = parseInt(diaVencimento, 10);

    if (!descricao.trim()) {
      setFeedback({ tipo: 'erro', msg: 'Informe a descrição.' });
      return;
    }
    if (numValor <= 0) {
      setFeedback({ tipo: 'erro', msg: 'O valor deve ser positivo.' });
      return;
    }
    if (tipo === 'despesa' && !categoriaId) {
      setFeedback({ tipo: 'erro', msg: 'Selecione uma categoria.' });
      return;
    }
    if (isNaN(numDia) || numDia < 1 || numDia > 31) {
      setFeedback({ tipo: 'erro', msg: 'Dia de vencimento deve ser entre 1 e 31.' });
      return;
    }

    const payload: TransacaoRecorrentePayload = {
      descricao: descricao.trim(),
      valor: numValor,
      tipo,
      categoria_id: tipo === 'despesa' ? Number(categoriaId) : null,
      dia_vencimento: numDia,
      frequencia,
      observacao: observacao.trim() || undefined,
    };

    try {
      setSubmetendo(true);
      if (recorrencia) {
        await apiService.atualizarRecorrencia(recorrencia.id, payload);
        setFeedback({ tipo: 'ok', msg: 'Recorrência atualizada!' });
      } else {
        await apiService.criarRecorrencia(payload);
        setFeedback({ tipo: 'ok', msg: `"${descricao}" criada com sucesso!` });
      }
      onSalvo();
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      let msg = 'Erro ao salvar.';
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
      setSubmetendo(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  const isReceita = tipo === 'receita';

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget && !submetendo) onClose(); }}
    >
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Indicador visual de arrasto no topo para mobile */}
        <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-card shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 py-3 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ArrowsClockwise size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {recorrencia ? 'Editar Recorrência' : 'Nova Recorrência'}
              </h2>
              <p className="text-xs text-muted-foreground">Gastos e receitas fixas automáticas</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submetendo} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mx-5 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${feedback.tipo === 'ok' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
            {feedback.tipo === 'ok' ? <CheckCircle size={16} weight="fill" className="shrink-0" /> : <WarningCircle size={16} weight="fill" className="shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Toggle Receita / Despesa */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                tipo === 'despesa' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowCircleDown size={14} weight="duotone" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setTipo('receita')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                tipo === 'receita' ? 'bg-card text-emerald-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowCircleUp size={14} weight="duotone" />
              Receita
            </button>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={isReceita ? 'Ex: Salário, Venda, Aluguel Recebido...' : 'Ex: Netflix, Academia, Aluguel...'}
              className={inputClass}
              maxLength={255}
              autoFocus
            />
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Valor (R$) *</label>
            <NumberInput
              id="recorrencia-valor"
              step={1}
              min={0}
              placeholder="0,00"
              value={valor}
              onChange={(val) => setValor(val)}
              className={inputClass}
            />
          </div>

          {/* Categoria (apenas para despesas) */}
          {tipo === 'despesa' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Categoria *</label>
              <Select
                id="recorrencia-categoria"
                value={categoriaId}
                onChange={(val) => setCategoriaId(val ? Number(val) : '')}
                placeholder="Selecione uma categoria..."
                options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
              />
            </div>
          )}

          {/* Dia de vencimento + Frequência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Dia do mês *</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                placeholder="Ex: 5"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Frequência</label>
              <Select
                id="recorrencia-frequencia"
                value={frequencia}
                onChange={(val) => setFrequencia(String(val))}
                options={FREQUENCIAS}
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Notas adicionais sobre esta recorrência..."
              className={`${inputClass} resize-none`}
              rows={2}
              maxLength={500}
            />
          </div>
        </form>

        {/* Footer com Safe Area e Touch Targets */}
        <div className="shrink-0 p-4 border-t border-border bg-card/95 flex flex-col-reverse sm:flex-row gap-2.5 justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={submetendo}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={submetendo}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {submetendo ? (
              <><div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /><span>Salvando...</span></>
            ) : (
              <><FloppyDisk size={16} weight="bold" /><span>{recorrencia ? 'Salvar Alterações' : 'Criar Recorrência'}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
