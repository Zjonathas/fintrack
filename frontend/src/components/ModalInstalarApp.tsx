import React, { useState } from 'react';
import {
  X,
  DeviceMobile,
  Export,
  PlusSquare,
  DotsThreeVertical,
  DownloadSimple,
  Plus,
  CheckCircle,
  Lightning,
  ShieldCheck,
  WarningCircle,
  Copy,
  Check,
} from '@phosphor-icons/react';

interface ModalInstalarAppProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  canPromptDirectly: boolean;
  isSecureContext?: boolean;
  onInstalar: () => Promise<void>;
}

export const ModalInstalarApp: React.FC<ModalInstalarAppProps> = ({
  isOpen,
  onClose,
  isIOS,
  canPromptDirectly,
  isSecureContext = true,
  onInstalar,
}) => {
  const [tentativaRealizada, setTentativaRealizada] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const copiarOrigin = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleAdicionar = async () => {
    setInstalando(true);
    try {
      if (canPromptDirectly) {
        await onInstalar();
        onClose();
      } else {
        // Se a API programática nativa não estiver disponível, tenta disparar e ativa o guia detalhado
        await onInstalar().catch(() => {});
        setTentativaRealizada(true);
      }
    } catch {
      setTentativaRealizada(true);
    } finally {
      setInstalando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Grab handle decorativo no mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full" />
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <DeviceMobile size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Adicionar à Tela Inicial</h2>
              <p className="text-xs text-muted-foreground">Instale o FinançasApp como aplicativo no seu dispositivo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Card do Aplicativo com Logo e Status */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-secondary/50 border border-border/70">
            <img
              src="/icon-192.png"
              alt="Logo FinançasApp"
              className="w-12 h-12 rounded-xl shadow-xs border border-border shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm truncate">FinançasApp</div>
              <div className="text-xs text-muted-foreground truncate">Controle financeiro pessoal & KPIs</div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-500 font-medium">
                <CheckCircle size={13} weight="fill" />
                <span>Aplicativo Web Progressivo (PWA)</span>
              </div>
            </div>
          </div>

          {/* Vantagens de Instalar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 flex items-start gap-2">
              <Lightning size={16} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Tela Cheia</span>
                <span className="text-[11px] text-muted-foreground leading-tight block">Sem barras de URL</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 flex items-start gap-2">
              <ShieldCheck size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Acesso Rápido</span>
                <span className="text-[11px] text-muted-foreground leading-tight block">Ícone no seu início</span>
              </div>
            </div>
          </div>

          {/* Alerta explicativo quando acessado via IP HTTP sem HTTPS */}
          {!isSecureContext && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5 text-xs animate-in fade-in duration-200">
              <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                <WarningCircle size={16} weight="bold" className="shrink-0" />
                <span>Acesso via IP local (HTTP) detectado</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Navegadores como o Chrome bloqueiam a instalação nativa de PWAs em endereços IP sem HTTPS. Para liberar no Chrome do celular ou computador:
              </p>
              <div className="bg-background/80 border border-border/60 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                <div className="text-muted-foreground">1. Abra uma nova aba no Chrome e acesse:</div>
                <div className="font-mono text-primary bg-secondary/80 px-2 py-1 rounded text-[10px] break-all select-all">
                  chrome://flags/#unsafely-treat-insecure-origin-as-secure
                </div>
                <div className="text-muted-foreground mt-1">2. Marque como <b>Enabled</b> e cole o endereço do seu servidor:</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-foreground bg-secondary/80 px-2 py-1 rounded text-[10px] flex-1 truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}
                  </span>
                  <button
                    type="button"
                    onClick={copiarOrigin}
                    className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[10px]"
                    title="Copiar endereço"
                  >
                    {copiado ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                    <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="text-muted-foreground text-[10px] mt-1">3. Clique em <b>Relaunch</b> no Chrome para reiniciar com instalação liberada!</div>
              </div>
            </div>
          )}

          {/* Instruções Passo a Passo quando a instalação automática depende de ação do navegador */}
          {(!canPromptDirectly || tentativaRealizada || isIOS) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 text-xs animate-in fade-in duration-200">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                {isIOS ? <Export size={16} weight="bold" /> : <DotsThreeVertical size={16} weight="bold" />}
                <span>
                  {isIOS ? 'Como adicionar no iPhone / iPad (Safari):' : 'Como adicionar pelo seu navegador:'}
                </span>
              </div>

              {isIOS ? (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-[11px]">
                  <li className="leading-relaxed">
                    Toque no botão de <span className="font-semibold text-foreground">Compartilhar</span> (<Export size={13} className="inline mx-0.5 text-foreground" weight="bold" />) na barra inferior do Safari.
                  </li>
                  <li className="leading-relaxed">
                    Role a lista e selecione <span className="font-semibold text-foreground">"Adicionar à Tela de Início"</span> (<PlusSquare size={13} className="inline mx-0.5 text-foreground" weight="bold" />).
                  </li>
                  <li className="leading-relaxed">
                    Toque em <span className="font-semibold text-foreground">"Adicionar"</span> no canto superior direito.
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-[11px]">
                  <li className="leading-relaxed">
                    Toque no menu de <span className="font-semibold text-foreground">três pontinhos</span> (<DotsThreeVertical size={13} className="inline mx-0.5 text-foreground" weight="bold" />) no canto superior do navegador (ou ícone de instalar na barra de URL no computador).
                  </li>
                  <li className="leading-relaxed">
                    Selecione a opção <span className="font-semibold text-foreground">"Adicionar à tela inicial"</span> ou <span className="font-semibold text-foreground">"Instalar aplicativo"</span>.
                  </li>
                  <li className="leading-relaxed">
                    Confirme em <span className="font-semibold text-foreground">"Adicionar"</span> / <span className="font-semibold text-foreground">"Instalar"</span> para criar o atalho nativo.
                  </li>
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com o botão de ADICIONAR SEMPRE DISPONÍVEL */}
        <div className="p-4 border-t border-border/70 bg-card/80 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer text-center"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleAdicionar}
            disabled={instalando}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md hover:shadow-primary/25 transition-all cursor-pointer text-center disabled:opacity-50"
          >
            {instalando ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : canPromptDirectly ? (
              <DownloadSimple size={16} weight="bold" />
            ) : (
              <Plus size={16} weight="bold" />
            )}
            <span>
              {canPromptDirectly ? 'Instalar Aplicativo Agora' : 'Adicionar à Tela Inicial'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
