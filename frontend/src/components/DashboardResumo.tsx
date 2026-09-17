import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Package,
  Truck,
  Receipt,
  ArrowsClockwise,
  ChartPieSlice,
  ChartBar,
  TrendUp,
  Coins,
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

interface DashboardResumoProps {
  resumo: ResumoAnalitico | null;
  transacoes?: Transacao[];
  loading: boolean;
  onRefresh: () => void;
  onAbrirModalCategoria?: () => void;
}

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
  onAbrirModalCategoria,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'categorias' | 'evolucao'>('geral');

  // Dados para o gráfico de evolução temporal diária
  const dadosEvolucao = useMemo(() => {
    if (!transacoes.length) return [];
    
    const mapaDias = new Map<string, { data: string; produtos: number; frete: number; total: number }>();
    const ordenadas = [...transacoes].sort((a, b) => a.data.localeCompare(b.data));

    ordenadas.forEach((t) => {
      const diaFormatado = t.data.split('-').reverse().slice(0, 2).join('/'); // DD/MM
      const atual = mapaDias.get(diaFormatado) || { data: diaFormatado, produtos: 0, frete: 0, total: 0 };
      atual.produtos += Number(t.valor_produto) || 0;
      atual.frete += t.teve_entrega ? (Number(t.valor_entrega) || 0) : 0;
      atual.total += Number(t.valor_total) || 0;
      mapaDias.set(diaFormatado, atual);
    });

    return Array.from(mapaDias.values());
  }, [transacoes]);

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
  } = resumo;

  const percProdutos = total_geral > 0 ? ((total_produtos / total_geral) * 100).toFixed(1) : '100';

  const kpis = [
    {
      label: 'Gasto Total',
      value: formatBRL(total_geral),
      detail: `${qtd_transacoes} transações registradas`,
      icon: <Wallet size={20} className="text-foreground" weight="duotone" />,
      border: 'border-border',
    },
    {
      label: 'Em Produtos',
      value: formatBRL(total_produtos),
      detail: `${percProdutos}% do montante total`,
      icon: <Package size={20} className="text-primary" weight="duotone" />,
      border: 'border-border',
    },
    {
      label: 'Taxas de Entrega',
      value: formatBRL(total_entregas),
      detail: `${percentual_entregas}% do total gasto`,
      icon: <Truck size={20} className="text-warning" weight="duotone" />,
      border: 'border-warning/30',
    },
    {
      label: 'Média por Frete',
      value: formatBRL(media_valor_entrega),
      detail: `${qtd_com_entrega} c/ frete · ${qtd_sem_entrega} s/ frete`,
      icon: <Receipt size={20} className="text-muted-foreground" weight="duotone" />,
      border: 'border-border',
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
            Acompanhamento analítico com rastreamento isolado de taxas de entrega
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

      {/* KPI Cards Estruturados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`card p-4 space-y-2 border transition-all duration-200 hover:shadow-sm ${kpi.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                {kpi.label}
              </span>
              <div className="p-1.5 rounded-md bg-secondary/80">{kpi.icon}</div>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Proporção Produtos vs. Fretes */}
      {total_geral > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
            <span className="font-medium text-foreground">Composição do Orçamento</span>
            <div className="flex items-center gap-4">
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
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cor }}
                            />
                            <span className="font-semibold text-foreground">{cat.categoria_nome}</span>
                            <span className="text-xs text-muted-foreground">({percTotal}%)</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs tabular-nums">
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
