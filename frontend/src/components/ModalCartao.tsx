import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  X,
  CheckCircle,
  WarningCircle,
  FloppyDisk,
} from '@phosphor-icons/react';
import { CartaoCredito, CartaoCreditoPayload } from '../types';
import { apiService } from '../services/api';
import { NumberInput } from './NumberInput';

interface ModalCartaoProps {
  isOpen: boolean;
  onClose: () => void;
  cartao?: CartaoCredito | null;
  onSalvo: () => void;
}

const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Outro'];
const CORES = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#64748b'];

export const ModalCartao: React.FC<ModalCartaoProps> = ({ isOpen, onClose, cartao, onSalvo }) => {
  const [nome, setNome] = useState('');
  const [bandeira, setBandeira] = useState('');
  const [limite, setLimite] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [cor, setCor] = useState(CORES[0]);

  const [submetendo, setSubmetendo] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  useEffect(() => {
    if (cartao) {
      setNome(cartao.nome);
      setBandeira(cartao.bandeira || '');
      setLimite(String(cartao.limite));
      setDiaFechamento(String(cartao.dia_fechamento));
      setDiaVencimento(String(cartao.dia_vencimento));
      setCor(cartao.cor || CORES[0]);
    } else {
      setNome('');
      setBandeira('');
      setLimite('');
      setDiaFechamento('');
      setDiaVencimento('');
      setCor(CORES[0]);
    }
    setFeedback(null);
  }, [cartao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numLimite = parseFloat(limite.replace(',', '.')) || 0;
    const numFechamento = parseInt(diaFechamento, 10);
    const numVencimento = parseInt(diaVencimento, 10);

    if (!nome.trim()) {
      setFeedback({ tipo: 'erro', msg: 'Informe o nome do cartão.' });
      return;
    }
    if (numLimite <= 0) {
      setFeedback({ tipo: 'erro', msg: 'O limite deve ser positivo.' });
      return;
    }
    if (isNaN(numFechamento) || numFechamento < 1 || numFechamento > 31) {
      setFeedback({ tipo: 'erro', msg: 'Dia de fechamento deve ser entre 1 e 31.' });
      return;
    }
    if (isNaN(numVencimento) || numVencimento < 1 || numVencimento > 31) {
      setFeedback({ tipo: 'erro', msg: 'Dia de vencimento deve ser entre 1 e 31.' });
      return;
    }

    const payload: CartaoCreditoPayload = {
      nome: nome.trim(),
      bandeira: bandeira || undefined,
      limite: numLimite,
      dia_fechamento: numFechamento,
      dia_vencimento: numVencimento,
      cor,
    };

    try {
      setSubmetendo(true);
      if (cartao) {
        await apiService.atualizarCartao(cartao.id, payload);
        setFeedback({ tipo: 'ok', msg: 'Cartão atualizado com sucesso!' });
      } else {
        await apiService.criarCartao(payload);
        setFeedback({ tipo: 'ok', msg: `Cartão "${nome}" criado com sucesso!` });
      }
      onSalvo();
      setTimeout(() => onClose(), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar cartão.';
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSubmetendo(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget && !submetendo) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <CreditCard size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {cartao ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
              </h2>
              <p className="text-xs text-muted-foreground">Configure seu cartão para rastreamento de faturas</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submetendo} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
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
          {/* Preview do Cartão */}
          <div
            className="relative h-28 rounded-xl p-4 text-white flex flex-col justify-between overflow-hidden transition-colors duration-300"
            style={{ background: `linear-gradient(135deg, ${cor}cc, ${cor}88)` }}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium opacity-80">Cartão de Crédito</span>
              <span className="text-xs font-bold opacity-90">{bandeira || 'BANDEIRA'}</span>
            </div>
            <div>
              <p className="font-semibold text-sm truncate">{nome || 'Nome do Cartão'}</p>
              <p className="text-[11px] opacity-70">
                Fecha dia {diaFechamento || '--'} · Vence dia {diaVencimento || '--'}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Nome do Cartão *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nubank Gold, Inter Platinum..."
              className={inputClass}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Bandeira */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Bandeira</label>
            <div className="flex gap-1.5 flex-wrap">
              {BANDEIRAS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBandeira(b === bandeira ? '' : b)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                    bandeira === b
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Limite */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Limite (R$) *</label>
            <NumberInput
              id="cartao-limite"
              step={1}
              min={0}
              placeholder="5000,00"
              value={limite}
              onChange={(val) => setLimite(val)}
              className={inputClass}
            />
          </div>

          {/* Dias */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Dia de Fechamento *</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
                placeholder="Ex: 15"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Dia de Vencimento *</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                placeholder="Ex: 22"
                className={inputClass}
              />
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Cor do Cartão</label>
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${cor === c ? 'ring-2 ring-offset-2 ring-offset-background ring-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-border bg-card/95 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submetendo}
            className="px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={submetendo}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {submetendo ? (
              <><div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /><span>Salvando...</span></>
            ) : (
              <><FloppyDisk size={14} weight="bold" /><span>{cartao ? 'Salvar Alterações' : 'Criar Cartão'}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
