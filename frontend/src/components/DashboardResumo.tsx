import React, { useState, useMemo } from 'react';
import {
  Truck,
  ArrowsClockwise,
  ChartPieSlice,
  ChartBar,
  TrendUp,
  Coins,
  ArrowCircleUp,
  ArrowCircleDown,
  CalendarBlank,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { ResumoAnalitico, Transacao } from '../types';
import { DatePicker } from './DatePicker';

export type TipoPeriodo =
  | 'mes_atual'
  | 'mes_anterior'
  | 'mes_especifico'
  | 'ultimos_30_dias'
  | 'ano_atual'
  | 'tudo'
  | 'customizado';

interface DashboardResumoProps {
  resumo: ResumoAnalitico | null;
  transacoes?: Transacao[];
  loading: boolean;
  onRefresh: () => void;
  onPeriodoChange?: (dataInicio?: string, dataFim?: string) => void;
  onAbrirModalCategoria?: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getIntervaloPeriodo = (
  tipo: TipoPeriodo,
  customIni?: string,
  customFim?: string,
  ano?: number,
  mes?: number
): { inicio?: string; fim?: string; rotulo: string } => {
  const agora = new Date();
  const y = ano !== undefined ? ano : agora.getFullYear();
  const m = mes !== undefined ? mes : agora.getMonth();

  switch (tipo) {
    case 'mes_atual': {
      const ini = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
      return { inicio: toISO(ini), fim: toISO(fim), rotulo: `${MESES_NOMES[agora.getMonth()]} de ${agora.getFullYear()}` };
    }
    case 'mes_anterior': {
      const ini = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth(), 0);
      return { inicio: toISO(ini), fim: toISO(fim), rotulo: `${MESES_NOMES[ini.getMonth()]} de ${ini.getFullYear()}` };
    }
    case 'mes_especifico': {
      const ini = new Date(y, m, 1);
      const fim = new Date(y, m + 1, 0);
      return { inicio: toISO(ini), fim: toISO(fim), rotulo: `${MESES_NOMES[m]} de ${y}` };
    }
    case 'ultimos_30_dias': {
      const ini = new Date(agora);
      ini.setDate(agora.getDate() - 30);
      return { inicio: toISO(ini), fim: toISO(agora), rotulo: 'Últimos 30 Dias' };
    }
    case 'ano_atual': {
      return { inicio: `${agora.getFullYear()}-01-01`, fim: `${agora.getFullYear()}-12-31`, rotulo: `Ano de ${agora.getFullYear()}` };
    }
    case 'tudo': {
      return { inicio: undefined, fim: undefined, rotulo: 'Todo o Histórico' };
    }
    case 'customizado': {
      return { inicio: customIni, fim: customFim, rotulo: 'Personalizado' };
    }
  }
};

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const PALETTE = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
];

// Tooltip customizado resiliente para Recharts (PieChart, BarChart e AreaChart)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const title = label || payload[0]?.name || payload[0]?.payload?.name;

  return (
    <div className="bg-card/95 backdrop-blur border border-border px-3 py-2 rounded-lg shadow-lg text-xs z-50 pointer-events-none">
      {title && <p className="font-semibold text-foreground mb-1">{title}</p>}
      {payload.map((entry: any, index: number) => {
        const cor = entry.color || entry.fill || entry.payload?.color || '#10B981';
        const nome = entry.name || entry.dataKey || 'Valor';
        const valorNumerico = Number(entry.value) || 0;

        return (
          <div key={`tooltip-item-${index}`} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cor }}
            />
            <span className="text-muted-foreground">{nome}:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatBRL(valorNumerico)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardResumo: React.FC<DashboardResumoProps> = ({
  resumo,
  transacoes = [],
  loading,
  onRefresh,
  onPeriodoChange,
  onAbrirModalCategoria,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'categorias' | 'evolucao'>('geral');
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes_atual');
  const [anoRef, setAnoRef] = useState<number>(() => new Date().getFullYear());
  const [mesRef, setMesRef] = useState<number>(() => new Date().getMonth());
  const [customInicio, setCustomInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  });
  const [customFim, setCustomFim] = useState<string>(() => toISO(new Date()));
  const [periodoAtivo, setPeriodoAtivo] = useState<{ inicio?: string; fim?: string; rotulo: string }>(() =>
    getIntervaloPeriodo('mes_atual')
  );

  const navegarMes = (delta: number) => {
    let novoAno = anoRef;
    let novoMes = mesRef + delta;
    if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    } else if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    }
    setAnoRef(novoAno);
    setMesRef(novoMes);
    setTipoPeriodo('mes_especifico');

    const range = getIntervaloPeriodo('mes_especifico', undefined, undefined, novoAno, novoMes);
    setPeriodoAtivo(range);
    onPeriodoChange?.(range.inicio, range.fim);
  };

  const handleSelecionarPeriodo = (novoTipo: TipoPeriodo) => {
    setTipoPeriodo(novoTipo);
    if (novoTipo === 'customizado') {
      const range = getIntervaloPeriodo('customizado', customInicio, customFim);
      setPeriodoAtivo(range);
      onPeriodoChange?.(range.inicio, range.fim);
    } else if (novoTipo === 'mes_atual') {
      const agora = new Date();
      setAnoRef(agora.getFullYear());
      setMesRef(agora.getMonth());
      const range = getIntervaloPeriodo('mes_atual');
      setPeriodoAtivo(range);
      onPeriodoChange?.(range.inicio, range.fim);
    } else {
      const range = getIntervaloPeriodo(novoTipo);
      setPeriodoAtivo(range);
      onPeriodoChange?.(range.inicio, range.fim);
    }
  };

  const handleAplicarCustomizado = () => {
    const range = getIntervaloPeriodo('customizado', customInicio, customFim);
    setPeriodoAtivo(range);
    onPeriodoChange?.(range.inicio, range.fim);
  };

  // Dados para o gráfico de evolução temporal diária
  const dadosEvolucao = useMemo(() => {
    if (!transacoes.length) return [];

    const transacoesFiltradas = transacoes.filter((t) => {
      if (periodoAtivo.inicio && t.data < periodoAtivo.inicio) return false;
      if (periodoAtivo.fim && t.data > periodoAtivo.fim) return false;
      return true;
    });

    const mapaDias = new Map<string, { data: string; produtos: number; frete: number; total: number }>();
    const ordenadas = [...transacoesFiltradas].sort((a, b) => a.data.localeCompare(b.data));

    ordenadas.forEach((t) => {
      if (t.tipo === 'receita') return;
      const diaFormatado = t.data.split('-').reverse().slice(0, 2).join('/'); // DD/MM
      const atual = mapaDias.get(diaFormatado) || { data: diaFormatado, produtos: 0, frete: 0, total: 0 };
      atual.produtos += Number(t.valor_produto) || 0;
      atual.frete += t.teve_entrega ? (Number(t.valor_entrega) || 0) : 0;
      atual.total += Number(t.valor_total) || 0;
      mapaDias.set(diaFormatado, atual);
    });

    return Array.from(mapaDias.values());
  }, [transacoes, periodoAtivo]);

  // Dados para o gráfico Donut de Categorias (garante valores numéricos válidos)
  const dadosPizza = useMemo(() => {
    return (resumo?.gastos_por_categoria || []).map((cat, i) => ({
      name: cat.categoria_nome,
      value: Number(cat.total_geral) || 0,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [resumo?.gastos_por_categoria]);

  // Dados para o gráfico de Barras Comparativas (Produto vs Frete)
  const dadosBarras = useMemo(() => {
    return (resumo?.gastos_por_categoria || []).map((cat) => ({
      categoria: cat.categoria_nome,
      Produtos: Number(cat.total_produto) || 0,
      Frete: Number(cat.total_entrega) || 0,
      Total: Number(cat.total_geral) || 0,
    }));
  }, [resumo?.gastos_por_categoria]);

  if (!resumo) {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="h-5 w-48 mx-auto bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 mx-auto bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const {
    total_geral,
    total_produtos,
    total_entregas,
    percentual_entregas,
    media_valor_entrega,
    qtd_transacoes,
    qtd_com_entrega,
    qtd_sem_entrega,
    gastos_por_categoria,
    total_receitas = 0,
    total_despesas = total_geral,
    saldo_liquido = 0,
  } = resumo;

  const percProdutos = total_geral > 0 ? ((total_produtos / total_geral) * 100).toFixed(1) : '100';

  const kpis = [
    {
      label: 'Saldo Líquido',
      value: formatBRL(saldo_liquido),
      detail: saldo_liquido >= 0 ? 'Superávit no período' : 'Déficit no período',
      icon: saldo_liquido >= 0 ? <ArrowCircleUp size={20} className="text-emerald-500" weight="duotone" /> : <ArrowCircleDown size={20} className="text-rose-500" weight="duotone" />,
      border: saldo_liquido >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30',
      valueClass: saldo_liquido >= 0 ? 'text-emerald-500' : 'text-rose-500',
    },
    {
      label: 'Total Receitas',
      value: formatBRL(total_receitas),
      detail: 'Entradas de caixa registradas',
      icon: <ArrowCircleUp size={20} className="text-emerald-500" weight="duotone" />,
      border: 'border-emerald-500/20',
      valueClass: 'text-emerald-500',
    },
    {
      label: 'Total Despesas',
      value: formatBRL(total_despesas),
      detail: `${qtd_transacoes} saídas registradas`,
      icon: <ArrowCircleDown size={20} className="text-rose-500" weight="duotone" />,
      border: 'border-rose-500/20',
      valueClass: 'text-rose-500',
    },
    {
      label: 'Taxas de Entrega',
      value: formatBRL(total_entregas),
      detail: `${percentual_entregas}% dos gastos · Média ${formatBRL(media_valor_entrega)} (${qtd_com_entrega} c/ frete, ${qtd_sem_entrega} s/)`,
      icon: <Truck size={20} className="text-warning" weight="duotone" />,
      border: 'border-warning/30',
      valueClass: 'text-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dashboard com controles de visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins size={22} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Resumo Financeiro & KPIs</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Visão detalhada de onde seu dinheiro está sendo gasto e análise de economia
          </p>

        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de visualizações */}
          <div className="flex items-center bg-secondary p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'geral'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChartPieSlice size={14} weight="bold" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('categorias')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'categorias'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChartBar size={14} weight="bold" />
              Categorias
            </button>
            <button
              onClick={() => setActiveTab('evolucao')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'evolucao'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendUp size={14} weight="bold" />
              Evolução
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados analíticos"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-card hover:bg-accent border border-border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <ArrowsClockwise
              size={14}
              weight="bold"
              className={loading ? 'animate-spin' : ''}
            />
            <span>{loading ? 'Atualizando' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Seletor de Período dos Gráficos e KPIs com Navegador Mensal Touch-Friendly */}
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Navegador Mensal com Setas (< Mês Ano >) */}
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-secondary/50 p-1 rounded-xl border border-border/70 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navegarMes(-1)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <CaretLeft size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('mes_atual')}
              className="flex-1 sm:flex-initial px-3 py-1 rounded-lg flex items-center justify-center gap-2 hover:bg-background/80 transition-colors cursor-pointer text-center"
              title="Ir para o mês atual"
            >
              <CalendarBlank size={16} weight="duotone" className="text-primary shrink-0" />
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold text-foreground block leading-tight">
                  {periodoAtivo.rotulo}
                </span>
                {periodoAtivo.inicio && periodoAtivo.fim ? (
                  <span className="text-[10px] text-muted-foreground block leading-none">
                    {periodoAtivo.inicio.split('-').reverse().join('/')} a {periodoAtivo.fim.split('-').reverse().join('/')}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground block leading-none">Todo o histórico</span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => navegarMes(1)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* Atalhos Rápidos de Período (Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs -mx-1 px-1">
            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('mes_atual')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                tipoPeriodo === 'mes_atual' || (tipoPeriodo === 'mes_especifico' && mesRef === new Date().getMonth() && anoRef === new Date().getFullYear())
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Este Mês
            </button>

            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('ultimos_30_dias')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                tipoPeriodo === 'ultimos_30_dias'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              30 Dias
            </button>

            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('ano_atual')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                tipoPeriodo === 'ano_atual'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Este Ano
            </button>

            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('tudo')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                tipoPeriodo === 'tudo'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Tudo
            </button>

            <button
              type="button"
              onClick={() => handleSelecionarPeriodo('customizado')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                tipoPeriodo === 'customizado'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Linha adicional se 'customizado' estiver selecionado */}
        {tipoPeriodo === 'customizado' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-border/60 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">De:</span>
              <div className="w-full sm:w-36">
                <DatePicker
                  value={customInicio}
                  onChange={(val) => setCustomInicio(val)}
                  className="w-full text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Até:</span>
              <div className="w-full sm:w-36">
                <DatePicker
                  value={customFim}
                  onChange={(val) => setCustomFim(val)}
                  className="w-full text-xs"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAplicarCustomizado}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer self-stretch sm:self-auto flex items-center justify-center"
            >
              Filtrar Gráficos
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Estruturados com Tipografia Fluida */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`card p-3 sm:p-4 space-y-1 sm:space-y-2 border transition-all duration-200 hover:shadow-sm ${kpi.border}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground tracking-wide uppercase truncate">
                {kpi.label}
              </span>
              <div className="p-1 sm:p-1.5 rounded-md bg-secondary/80 shrink-0">{kpi.icon}</div>
            </div>
            <div>
              <p className={`text-base sm:text-2xl font-bold tabular-nums truncate ${kpi.valueClass || 'text-foreground'}`} title={kpi.value}>
                {kpi.value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{kpi.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Proporção Produtos vs. Fretes */}
      {total_geral > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1.5 sm:gap-2">
            <span className="font-medium text-foreground">Composição do Orçamento</span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Produtos: <strong className="text-foreground">{percProdutos}%</strong> ({formatBRL(total_produtos)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                Fretes: <strong className="text-foreground">{percentual_entregas}%</strong> ({formatBRL(total_entregas)})
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${percProdutos}%` }}
              className="h-full bg-primary transition-all duration-500"
              title={`Produtos: ${percProdutos}%`}
            />
            <div
              style={{ width: `${percentual_entregas}%` }}
              className="h-full bg-warning transition-all duration-500"
              title={`Taxas de Entrega: ${percentual_entregas}%`}
            />
          </div>
        </div>
      )}

      {/* DASHBOARDS INTERATIVOS */}
      {total_geral > 0 ? (
        <div className="space-y-6">
          {/* TAB 1: VISÃO GERAL (Donut Chart + Comparativo de Barras Lado a Lado) */}
          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gráfico Donut de Gastos por Categoria */}
              <div className="card p-5 lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ChartPieSlice size={18} weight="duotone" className="text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Distribuição por Categoria</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dadosPizza.length} {dadosPizza.length === 1 ? 'categoria' : 'categorias'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Passe o cursor sobre as fatias para ver detalhes do valor gasto.
                  </p>
                </div>

                <div className="w-full" style={{ height: 260, minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={dadosPizza}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={false}
                      >
                        {dadosPizza.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                            className="transition-opacity duration-200 hover:opacity-80 outline-none cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        height={40}
                        formatter={(val: string) => (
                          <span className="text-xs text-foreground font-medium">{val}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Barras: Comparativo de Produtos vs Frete por Categoria */}
              <div className="card p-5 lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ChartBar size={18} weight="duotone" className="text-warning" />
                      <h3 className="text-sm font-semibold text-foreground">Produto vs. Frete por Categoria</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">Impacto das taxas</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Comparação empilhada do custo de aquisição vs. custo logístico.
                  </p>
                </div>

                <div className="w-full" style={{ height: 260, minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={dadosBarras}
                      margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="categoria"
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <RechartsTooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={36}
                        formatter={(val: string) => (
                          <span className="text-xs text-foreground font-medium">{val}</span>
                        )}
                      />
                      <Bar dataKey="Produtos" stackId="a" fill="#10B981" radius={[0, 0, 3, 3]} />
                      <Bar dataKey="Frete" stackId="a" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETALHAMENTO DE CATEGORIAS COM GRÁFICO DE PIZZA E LISTA ANALÍTICA */}
          {activeTab === 'categorias' && (
            <div className="card p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ChartPieSlice size={18} weight="duotone" className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Análise Detalhada por Categoria</h3>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({gastos_por_categoria.length} {gastos_por_categoria.length === 1 ? 'categoria' : 'categorias'})
                  </span>
                </div>
                {onAbrirModalCategoria && (
                  <button
                    onClick={onAbrirModalCategoria}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity self-start sm:self-auto shadow-xs"
                  >
                    <span>+ Cadastrar Categoria</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Gráfico de Pizza dedicado às Categorias */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 border border-border/60">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Divisão Percentual dos Gastos
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Proporção por fatia orçamentária
                  </p>
                  <div className="w-full" style={{ height: 260, minHeight: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          isAnimationActive={false}
                        >
                          {dadosPizza.map((entry, index) => (
                            <Cell
                              key={`cell-cat-detail-${index}`}
                              fill={entry.color}
                              stroke="transparent"
                              className="transition-opacity duration-200 hover:opacity-80 outline-none cursor-pointer"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          height={36}
                          formatter={(val: string) => (
                            <span className="text-xs text-foreground font-medium">{val}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Lista e Barras Proporcionais */}
                <div className="lg:col-span-7 space-y-3">
                  {gastos_por_categoria.map((cat, idx) => {
                    const percTotal = total_geral > 0
                      ? ((cat.total_geral / total_geral) * 100).toFixed(1)
                      : '0';
                    const cor = PALETTE[idx % PALETTE.length];

                    return (
                      <div
                        key={cat.categoria_id}
                        className="p-3.5 rounded-lg border border-border/70 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1 sm:gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cor }}
                            />
                            <span className="font-semibold text-foreground">{cat.categoria_nome}</span>
                            <span className="text-xs text-muted-foreground">({percTotal}%)</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs tabular-nums justify-between sm:justify-end">
                            <span className="text-muted-foreground">{cat.quantidade} compras</span>
                            {cat.total_entrega > 0 && (
                              <span className="text-warning font-medium">
                                +{formatBRL(cat.total_entrega)} frete
                              </span>
                            )}
                            <span className="font-bold text-foreground text-sm">
                              {formatBRL(cat.total_geral)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden flex">
                          <div
                            style={{
                              width: `${percTotal}%`,
                              backgroundColor: cor,
                            }}
                            className="h-full transition-all duration-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVOLUÇÃO TEMPORAL */}
          {activeTab === 'evolucao' && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendUp size={18} weight="duotone" className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Evolução Temporal dos Gastos</h3>
                </div>
                <span className="text-xs text-muted-foreground">Linha do tempo diária</span>
              </div>

              {dadosEvolucao.length > 0 ? (
                <div className="w-full" style={{ height: 280, minHeight: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={dadosEvolucao}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorProdutos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorFrete" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'currentColor' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <RechartsTooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={36}
                        formatter={(val: string) => (
                          <span className="text-xs text-foreground font-medium">{val}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="produtos"
                        name="Produtos"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorProdutos)"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="frete"
                        name="Taxas de Entrega"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFrete)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhuma transação registrada para exibir histórico temporal.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 text-center border-dashed">
          <ChartPieSlice size={36} weight="duotone" className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground">Nenhuma transação para gerar gráficos analíticos</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre sua primeira compra no formulário abaixo para visualizar as análises interativas.
          </p>
        </div>
      )}
    </div>
  );
};
