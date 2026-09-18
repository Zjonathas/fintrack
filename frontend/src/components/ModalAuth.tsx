import React, { useEffect, useState } from 'react';
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  SignIn,
  User,
  UserPlus,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';

interface ModalAuthProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export const ModalAuth: React.FC<ModalAuthProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, cadastrar } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [submetendo, setSubmetendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Sincroniza a aba inicial sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErro(null);
    }
  }, [isOpen, initialTab]);

  // Listener para fechar no Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submetendo) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submetendo, onClose]);

  if (!isOpen) return null;

  const limparCampos = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    setErro(null);
  };

  const handleMudarAba = (novaAba: 'login' | 'register') => {
    setTab(novaAba);
    setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (tab === 'register') {
      if (!nome.trim()) {
        setErro('Por favor, informe seu nome completo.');
        return;
      }
      if (senha.length < 8) {
        setErro('A senha deve conter no mínimo 8 caracteres.');
        return;
      }
      if (/\s/.test(senha)) {
        setErro('A senha não pode conter espaços em branco.');
        return;
      }
      if (!/[a-z]/.test(senha)) {
        setErro('A senha deve conter pelo menos uma letra minúscula (a-z).');
        return;
      }
      if (!/[A-Z]/.test(senha)) {
        setErro('A senha deve conter pelo menos uma letra maiúscula (A-Z).');
        return;
      }
      if (!/\d/.test(senha)) {
        setErro('A senha deve conter pelo menos um número (0-9).');
        return;
      }
      if (!/[!@#$%^&*()_\-+=\[\]{};:,\.<>?~|/]/.test(senha)) {
        setErro('A senha deve conter pelo menos um caractere especial (ex: ! @ # $ % & * - _).');
        return;
      }
      if (senha !== confirmarSenha) {
        setErro('As senhas informadas não coincidem.');
        return;
      }
    }

    setSubmetendo(true);
    try {
      if (tab === 'login') {
        await login(email, senha);
      } else {
        await cadastrar(nome, email, senha);
      }
      limparCampos();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 429) {
        const detalhe = err.response?.data?.detail;
        setErro(typeof detalhe === 'string' ? detalhe : 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.');
        return;
      }
      const detalhe = err.response?.data?.detail;
      if (typeof detalhe === 'string') {
        setErro(detalhe);
      } else if (Array.isArray(detalhe) && detalhe[0]?.msg) {
        const msgFormatada = String(detalhe[0].msg).replace(/^Value error,\s*/i, '');
        setErro(msgFormatada);
      } else {
        setErro(tab === 'login' ? 'Falha ao autenticar. Verifique seus dados.' : 'Falha ao realizar cadastro.');
      }
    } finally {
      setSubmetendo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submetendo) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header do Modal com Abas */}
        <div className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {tab === 'login' ? <SignIn size={20} weight="duotone" /> : <UserPlus size={20} weight="duotone" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {tab === 'login' ? 'Acessar Conta' : 'Criar Nova Conta'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {tab === 'login'
                    ? 'Entre para gerenciar suas despesas e fretes'
                    : 'Cadastre-se para ter seu controle financeiro isolado'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submetendo}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Abas Entrar / Criar Conta */}
          <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => handleMudarAba('login')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleMudarAba('register')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Criar Conta
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mx-5 mt-4 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2 animate-in fade-in duration-150">
            <WarningCircle size={16} weight="fill" className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User size={16} weight="duotone" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Clara"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <EnvelopeSimple size={16} weight="duotone" />
              </div>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <LockKey size={16} weight="duotone" />
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                placeholder={tab === 'register' ? 'Mínimo de 8 caracteres fortes' : 'Sua senha'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {mostrarSenha ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            </div>

            {/* Checklist em tempo real dos requisitos de senha */}
            {tab === 'register' && senha.length > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-secondary/40 border border-border/70 text-[11px] space-y-1 animate-in fade-in duration-150">
                <span className="font-semibold text-foreground block mb-1">Requisitos de segurança:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                  <div className={`flex items-center gap-1.5 transition-colors ${senha.length >= 8 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${senha.length >= 8 ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(senha) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(senha) ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                    <span>Letra maiúscula (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(senha) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(senha) ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                    <span>Letra minúscula (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${/\d/.test(senha) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(senha) ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                    <span>Número (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${/[!@#$%^&*()_\-+=\[\]{};:,\.<>?~|/]/.test(senha) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*()_\-+=\[\]{};:,\.<>?~|/]/.test(senha) ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                    <span>Especial (! @ # $ %...)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${!/\s/.test(senha) ? 'text-primary font-medium' : 'text-destructive font-medium'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${!/\s/.test(senha) ? 'bg-primary' : 'bg-destructive'}`} />
                    <span>Sem espaços</span>
                  </div>
                </div>
              </div>
            )}
          </div>


          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Confirmar Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <LockKey size={16} weight="duotone" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Repita sua senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
            </div>
          )}

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submetendo}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {submetendo ? (
                <span>Processando...</span>
              ) : tab === 'login' ? (
                <>
                  <SignIn size={18} weight="bold" />
                  <span>Entrar no FinançasApp</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} weight="bold" />
                  <span>Finalizar Cadastro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
