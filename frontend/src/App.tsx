import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Sun,
  Moon,
  WifiHigh,
  WifiSlash,
  Tag,
  Plus,
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
import { useTheme } from './hooks/useTheme';

const FILTROS_INICIAIS: FiltrosTransacao = {
  categoria_id: '',
  teve_entrega: '',
  data_inicio: '',
  data_fim: '',
  busca: '',
};

export function App() {
  const { toggleTheme, isDark } = useTheme();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState<ResumoAnalitico | null>(null);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTransacao>(FILTROS_INICIAIS);

  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalNovaTransacaoAberto, setModalNovaTransacaoAberto] = useState(false);
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

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
  }, []);

  const carregarTransacoes = useCallback(async () => {
    try {
      setLoadingDados(true);
      const dados = await apiService.getTransacoes(filtros);
      setTransacoes(dados);
    } catch {
      /* silenciado para manter estado local */
    } finally {
      setLoadingDados(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregarCategorias();
    carregarResumo();
  }, [carregarCategorias, carregarResumo]);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header com identidade e alternador de tema */}
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

      {/* Modal de Cadastro de Categorias */}
      <ModalCategoria
        isOpen={modalCategoriaAberto}
        onClose={() => setModalCategoriaAberto(false)}
        categorias={categorias}
        onCategoriaCriada={handleCategoriaCriada}
      />

      {/* Modal de Cadastro de Nova Transação */}
      <ModalNovaTransacao
        isOpen={modalNovaTransacaoAberto}
        onClose={() => setModalNovaTransacaoAberto(false)}
        categorias={categorias}
        onTransacaoCriada={handleTransacaoCriada}
        onCategoriaCriada={handleCategoriaCriada}
      />

      {/* Modal de Edição de Transações */}
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

export default App;
