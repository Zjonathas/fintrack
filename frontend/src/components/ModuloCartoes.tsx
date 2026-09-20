import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  PencilSimple,
  Trash,
  ChartDonut,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { CartaoCredito, FaturaCartaoResumo } from '../types';
import { apiService } from '../services/api';
import { ModalCartao } from './ModalCartao';

interface ModuloCartoesProps {
  cartoes: CartaoCredito[];
  onCartaoAtualizado: () => void;
  versaoTransacoes?: number;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const formatarMesReferencia = (mesRef?: string) => {
  if (!mesRef || !mesRef.includes('-')) return mesRef || '';
  const [ano, mes] = mesRef.split('-');
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(mes, 10) - 1;
  return `${mesesNomes[idx] || mes} de ${ano}`;
};

export const ModuloCartoes: React.FC<ModuloCartoesProps> = ({
  cartoes,
  onCartaoAtualizado,
  versaoTransacoes = 0,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState<CartaoCredito | null>(null);
  const [faturas, setFaturas] = useState<Record<number, FaturaCartaoResumo>>({});
  const [mesesPorCartao, setMesesPorCartao] = useState<Record<number, string>>({});
  const [carregandoFatura, setCarregandoFatura] = useState<number | null>(null);
  const [faturaExpandida, setFaturaExpandida] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregarFaturaDoCartao = async (cartaoId: number, mesRef?: string) => {
    setCarregandoFatura(cartaoId);
    try {
      const fatura = await apiService.getFaturaCartao(cartaoId, mesRef);
      setFaturas((prev) => ({ ...prev, [cartaoId]: fatura }));
      setMesesPorCartao((prev) => ({ ...prev, [cartaoId]: fatura.mes_referencia }));
    } catch {
      // silencioso
    } finally {
      setCarregandoFatura(null);
    }
  };

  const mudarMesFatura = async (cartaoId: number, delta: number) => {
    const mesAtualStr = mesesPorCartao[cartaoId] || faturas[cartaoId]?.mes_referencia;
    if (!mesAtualStr) return;
    const [anoStr, mesStr] = mesAtualStr.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) + delta;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    } else if (mes < 1) {
      mes = 12;
      ano -= 1;
    }
    const novoMes = `${ano}-${String(mes).padStart(2, '0')}`;
    await carregarFaturaDoCartao(cartaoId, novoMes);
  };

  const handleVerFatura = async (cartao: CartaoCredito) => {
    if (faturaExpandida === cartao.id) {
      setFaturaExpandida(null);
      return;
    }
    setFaturaExpandida(cartao.id);
    await carregarFaturaDoCartao(cartao.id, mesesPorCartao[cartao.id]);
  };

  // Recarrega automaticamente a fatura do cartão expandido quando transações mudarem
  useEffect(() => {
    if (faturaExpandida !== null) {
      carregarFaturaDoCartao(faturaExpandida, mesesPorCartao[faturaExpandida]);
    }
  }, [versaoTransacoes, cartoes]);

  const handleDeletar = async (cartao: CartaoCredito) => {
    if (!confirm(`Deletar cartão "${cartao.nome}"? As transações associadas serão mantidas.`)) return;
    setExcluindo(cartao.id);
    try {
      await apiService.deletarCartao(cartao.id);
      onCartaoAtualizado();
    } catch {
      alert('Erro ao deletar cartão.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleEditar = (cartao: CartaoCredito) => {
    setCartaoEditando(cartao);
    setModalAberto(true);
  };

  const handleNovoCartao = () => {
    setCartaoEditando(null);
    setModalAberto(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={20} weight="duotone" className="text-violet-500" />
          <h2 className="text-base font-semibold text-foreground">Cartões de Crédito</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {cartoes.length}
          </span>
        </div>
        <button
          onClick={handleNovoCartao}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} weight="bold" />
          Novo Cartão
        </button>
      </div>

      {/* Lista de cartões */}
      {cartoes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard size={40} weight="duotone" className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
          <p className="text-xs mt-1">Adicione seu primeiro cartão para rastrear faturas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cartoes.map((cartao) => {
            const fatura = faturas[cartao.id];
            const isExpanded = faturaExpandida === cartao.id;
            const carregando = carregandoFatura === cartao.id;

            return (
              <div key={cartao.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {/* Visual do cartão */}
                <div
                  className="p-4 text-white relative"
                  style={{ background: `linear-gradient(135deg, ${cartao.cor}dd, ${cartao.cor}88)` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-medium opacity-80">Crédito</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditar(cartao)}
                        className="p-1 rounded-md bg-white/10 hover:bg-white/25 transition-colors cursor-pointer"
                      >
                        <PencilSimple size={12} />
                      </button>
                      <button
                        onClick={() => handleDeletar(cartao)}
                        disabled={excluindo === cartao.id}
                        className="p-1 rounded-md bg-white/10 hover:bg-red-500/70 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">{cartao.nome}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    {cartao.bandeira && `${cartao.bandeira} · `}
                    Fecha {cartao.dia_fechamento} · Vence {cartao.dia_vencimento}
                  </p>
                  <p className="text-[11px] opacity-80 mt-1 font-medium">
                    Limite: {formatBRL(cartao.limite)}
                  </p>
                </div>

                {/* Fatura */}
                <div className="p-3">
                  <button
                    onClick={() => handleVerFatura(cartao)}
                    className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <ChartDonut size={13} weight="duotone" className="text-violet-400" />
                      {isExpanded ? 'Ocultar fatura' : 'Ver fatura do cartão'}
                    </span>
                    {carregando && (
                      <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>

                  {isExpanded && fatura && (
                    <div className="mt-2 space-y-2.5 animate-in fade-in duration-150">
                      {/* Seletor de Mês da Fatura */}
                      <div className="flex items-center justify-between px-2 py-1 bg-muted/60 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => mudarMesFatura(cartao.id, -1)}
                          disabled={carregando}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                          title="Fatura anterior"
                        >
                          <CaretLeft size={13} weight="bold" />
                        </button>
                        <span className="font-semibold text-[11px] text-foreground tracking-wide">
                          Fatura de {formatarMesReferencia(fatura.mes_referencia)}
                        </span>
                        <button
                          type="button"
                          onClick={() => mudarMesFatura(cartao.id, 1)}
                          disabled={carregando}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                          title="Próxima fatura"
                        >
                          <CaretRight size={13} weight="bold" />
                        </button>
                      </div>

                      {/* Barra de utilização total do limite */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Limite Total Comprometido</span>
                          <span className="font-medium text-foreground">
                            {fatura.percentual_utilizado.toFixed(0)}% ({formatBRL(fatura.limite_utilizado)})
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(fatura.percentual_utilizado, 100)}%`,
                              backgroundColor:
                                fatura.percentual_utilizado > 90
                                  ? '#ef4444'
                                  : fatura.percentual_utilizado > 70
                                  ? '#f59e0b'
                                  : cartao.cor,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground">Nesta Fatura</p>
                          <p className="font-semibold text-foreground">{formatBRL(fatura.total_fatura)}</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground">Limite Disponível</p>
                          <p className="font-semibold text-emerald-500">{formatBRL(fatura.limite_disponivel)}</p>
                        </div>
                      </div>

                      {fatura.qtd_parcelas_abertas > 0 ? (
                        <p className="text-[10px] text-muted-foreground">
                          {fatura.qtd_parcelas_abertas} compra(s)/parcela(s) nesta fatura
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          Nenhum lançamento para este mês
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalCartao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        cartao={cartaoEditando}
        onSalvo={onCartaoAtualizado}
      />
    </div>
  );
};
