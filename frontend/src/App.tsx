import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Sun,
  Moon,
  WifiHigh,
  WifiSlash,
  Tag,
  Plus,
  SignOut,
  SignIn,
  UserCircle,
  Sparkle,
  ShieldCheck,
  ChartPieSlice,
  Package,
} from '@phosphor-icons/react';
import { Categoria, FiltrosTransacao, ResumoAnalitico, Transacao } from './types';
import { apiService } from './services/api';
import { DashboardResumo } from './components/DashboardResumo';
import { FiltrosTransacoes } from './components/FiltrosTransacoes';
import { ListaTransacoes } from './components/ListaTransacoes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModalCategoria } from './components/ModalCategoria';
import { ModalEditarTransacao } from './components/ModalEditarTransacao';
import { ModalNovaTransacao } from './components/ModalNovaTransacao';
import { ModalAuth } from './components/ModalAuth';
import { useTheme } from './hooks/useTheme';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

const FILTROS_INICIAIS: FiltrosTransacao = {
  categoria_id: '',
  teve_entrega: '',
  data_inicio: '',
  data_fim: '',
  busca: '',
};

function AppContent() {
  const { toggleTheme, isDark } = useTheme();
  const { usuario, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState<ResumoAnalitico | null>(null);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTransacao>(FILTROS_INICIAIS);

  // Modais
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalNovaTransacaoAberto, setModalNovaTransacaoAberto] = useState(false);
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalAuthAberto, setModalAuthAberto] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const carregarCategorias = useCallback(async () => {
    try {
      const dados = await apiService.getCategorias();
      setCategorias(dados);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  }, []);

  const carregarResumo = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingDashboard(true);
      const dados = await apiService.getResumoDashboard();
      setResumo(dados);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setLoadingDashboard(false);
    }
  }, [isAuthenticated]);

  const carregarTransacoes = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingDados(true);
      const dados = await apiService.getTransacoes(filtros);
      setTransacoes(dados);
    } catch {
      /* silenciado para manter estado local */
    } finally {
      setLoadingDados(false);
    }
  }, [isAuthenticated, filtros]);

  // Carrega categorias sempre
  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  // Carrega transações e resumo apenas se autenticado
  useEffect(() => {
    if (isAuthenticated) {
      carregarResumo();
      carregarTransacoes();
    } else {
      setTransacoes([]);
      setResumo(null);
    }
  }, [isAuthenticated, carregarResumo, carregarTransacoes]);

  const handleTransacaoCriada = () => {
    carregarTransacoes();
    carregarResumo();
  };

  const handleCategoriaCriada = (nova: Categoria) => {
    setCategorias((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const handleExcluir = async (id: number) => {
    try {
      await apiService.deletarTransacao(id);
      carregarTransacoes();
      carregarResumo();
    } catch {
      alert('Não foi possível excluir a transação.');
    }
  };

  const handleExcluirEmLote = async (ids: number[]) => {
    try {
      await apiService.deletarTransacoesEmLote(ids);
      carregarTransacoes();
      carregarResumo();
    } catch {
      alert('Não foi possível excluir as transações selecionadas.');
    }
  };

  const handleEditar = (t: Transacao) => {
    setTransacaoEmEdicao(t);
    setModalEditarAberto(true);
  };

  const handleTransacaoAtualizada = () => {
    carregarTransacoes();
    carregarResumo();
  };

  const abrirModalAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setModalAuthAberto(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header com identidade, status de autenticação e alternador de tema */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Wallet size={18} weight="duotone" className="sm:w-5 sm:h-5" />
            </div>
            <h1 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">FinançasApp</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Status da API (discreto no mobile) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {apiOnline === true && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <WifiHigh size={15} weight="bold" />
                  <span>Online</span>
                </span>
              )}
              {apiOnline === false && (
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <WifiSlash size={15} weight="bold" />
                  <span>Offline</span>
                </span>
              )}
              {apiOnline === null && (
                <span className="text-muted-foreground text-xs">Conectando...</span>
              )}
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-border" />

            {/* Ações quando autenticado */}
            {isAuthenticated ? (
              <>
                {/* Botão para abrir modal de Nova Transação */}
                <button
                  onClick={() => setModalNovaTransacaoAberto(true)}
                  title="Cadastrar nova transação"
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus size={15} weight="bold" />
                  <span className="hidden sm:inline">Nova Transação</span>
                  <span className="inline sm:hidden">Nova</span>
                </button>

                {/* Botão para gerenciar / cadastrar categorias */}
                <button
                  onClick={() => setModalCategoriaAberto(true)}
                  title="Gerenciar e cadastrar categorias"
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent border border-border text-xs font-medium transition-all cursor-pointer shrink-0"
                >
                  <Tag size={15} weight="duotone" className="text-primary" />
                  <span className="hidden sm:inline">Categorias</span>
                </button>

                {/* Badge do Usuário com Nome e Iniciais */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/50 border border-border/80 text-xs">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                    {usuario?.nome ? usuario.nome.slice(0, 2).toUpperCase() : <UserCircle size={14} />}
                  </div>
                  <span className="hidden md:inline font-medium text-foreground max-w-[120px] truncate" title={usuario?.nome}>
                    {usuario?.nome}
                  </span>
                </div>

                {/* Botão Sair */}
                <button
                  onClick={logout}
                  title="Encerrar sessão (Sair)"
                  className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-all cursor-pointer shrink-0"
                >
                  <SignOut size={16} weight="bold" />
                </button>
              </>
            ) : (
              /* Ações quando NÃO autenticado */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirModalAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <SignIn size={15} weight="bold" />
                  <span>Entrar</span>
                </button>
                <button
                  onClick={() => abrirModalAuth('register')}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent border border-border text-xs font-medium transition-all cursor-pointer"
                >
                  <span>Criar Conta</span>
                </button>
              </div>
            )}

            {/* Alternador de Modo Claro / Modo Escuro */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema"
              className="p-1.5 sm:p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0"
            >
              {isDark ? (
                <Sun size={17} weight="duotone" className="text-warning" />
              ) : (
                <Moon size={17} weight="duotone" className="text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modais da Aplicação */}
      <ModalAuth
        isOpen={modalAuthAberto}
        onClose={() => setModalAuthAberto(false)}
        initialTab={authTab}
      />

      <ModalCategoria
        isOpen={modalCategoriaAberto}
        onClose={() => setModalCategoriaAberto(false)}
        categorias={categorias}
        onCategoriaCriada={handleCategoriaCriada}
      />

      <ModalNovaTransacao
        isOpen={modalNovaTransacaoAberto}
        onClose={() => setModalNovaTransacaoAberto(false)}
        categorias={categorias}
        onTransacaoCriada={handleTransacaoCriada}
        onCategoriaCriada={handleCategoriaCriada}
      />

      <ModalEditarTransacao
        isOpen={modalEditarAberto}
        transacao={transacaoEmEdicao}
        categorias={categorias}
        onClose={() => {
          setModalEditarAberto(false);
          setTransacaoEmEdicao(null);
        }}
        onTransacaoAtualizada={handleTransacaoAtualizada}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {authLoading ? (
          /* Estado de Carregamento da Sessão */
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Verificando sua sessão segura...</p>
          </div>
        ) : !isAuthenticated ? (
          /* Estado Não Autenticado: Hero de Boas-Vindas */
          <div className="py-8 sm:py-14 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 animate-pulse">
                <Sparkle size={14} weight="fill" />
                <span>Gestão Financeira Inteligente & Segura</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                Controle suas despesas com separação precisa de fretes
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Descubra exatamente quanto do seu orçamento mensal é consumido por taxas de entrega. Acesse ou crie sua conta para começar.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => abrirModalAuth('login')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-md transition-all cursor-pointer"
                >
                  <SignIn size={18} weight="bold" />
                  <span>Acessar Minha Conta</span>
                </button>
                <button
                  onClick={() => abrirModalAuth('register')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent border border-border text-sm font-medium transition-all cursor-pointer"
                >
                  <span>Cadastrar Gratuitamente</span>
                </button>
              </div>
            </div>

            {/* Destaques das Funcionalidades */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Package size={22} weight="duotone" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Rastreamento Isolado de Frete</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nunca mais deixe taxas de delivery passarem despercebidas no valor total dos produtos.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ChartPieSlice size={22} weight="duotone" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Dashboards Analíticos</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gráficos interativos em Donut, barras empilhadas e histórico de despesas diárias em tempo real.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={22} weight="duotone" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Isolamento Multi-usuário</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seus dados protegidos por autenticação JWT e criptografia bcrypt de ponta a ponta.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Estado Autenticado: Dashboard Completo e Extrato */
          <>
            {/* Dashboard com KPIs e Gráficos Interativos */}
            <section>
              <ErrorBoundary>
                <DashboardResumo
                  resumo={resumo}
                  transacoes={transacoes}
                  loading={loadingDashboard}
                  onRefresh={carregarResumo}
                  onAbrirModalCategoria={() => setModalCategoriaAberto(true)}
                />
              </ErrorBoundary>
            </section>

            {/* Seção do Extrato e Filtros em Largura Total */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-2xs">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">Extrato & Filtros</h2>
                  <p className="text-xs text-muted-foreground">
                    Consulte, filtre por data ou categoria, edite ou exclua despesas em lote
                  </p>
                </div>
                <button
                  onClick={() => setModalNovaTransacaoAberto(true)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={16} weight="bold" />
                  <span>Cadastrar Nova Despesa</span>
                </button>
              </div>

              <FiltrosTransacoes
                filtros={filtros}
                categorias={categorias}
                totalEncontrados={transacoes.length}
                onFiltroChange={setFiltros}
                onLimparFiltros={() => setFiltros(FILTROS_INICIAIS)}
              />
              <ListaTransacoes
                transacoes={transacoes}
                loading={loadingDados}
                onExcluir={handleExcluir}
                onExcluirEmLote={handleExcluirEmLote}
                onEditar={handleEditar}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
          FinançasApp — Gestão de despesas com rastreamento isolado de fretes e gráficos interativos
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
