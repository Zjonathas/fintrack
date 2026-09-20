import React from 'react';
import {
  X,
  DeviceMobile,
  Export,
  PlusSquare,
  Lightning,
  ShieldCheck,
  CheckCircle,
  DownloadSimple,
} from '@phosphor-icons/react';

interface ModalInstalarAppProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  canPromptDirectly: boolean;
  onInstalar: () => Promise<void>;
}

export const ModalInstalarApp: React.FC<ModalInstalarAppProps> = ({
  isOpen,
  onClose,
  isIOS,
  canPromptDirectly,
  onInstalar,
}) => {
  if (!isOpen) return null;

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
              <h2 className="text-base font-semibold text-foreground">Instalar FinançasApp</h2>
              <p className="text-xs text-muted-foreground">Adicione à tela inicial do seu dispositivo</p>
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
          {/* Logo e preview */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-secondary/50 border border-border/70">
            <img
              src="/icon-192.png"
              alt="Logo FinançasApp"
              className="w-12 h-12 rounded-xl shadow-xs border border-border shrink-0"
              onError={(e) => {
                // Fallback para ícone SVG caso PNG falhe
                (e.target as HTMLImageElement).src = '/icon.svg';
              }}
            />
            <div>
              <div className="font-semibold text-foreground text-sm">FinançasApp</div>
              <div className="text-xs text-muted-foreground">Controle financeiro pessoal inteligente</div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-primary font-medium">
                <CheckCircle size={13} weight="fill" />
                <span>Aplicativo Web Progressivo (PWA)</span>
              </div>
            </div>
          </div>

          {/* Vantagens */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/20">
              <Lightning size={16} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Abertura instantânea: </span>
                <span className="text-muted-foreground">Inicia diretamente na tela cheia sem barras do navegador.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/20">
              <ShieldCheck size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Leve e seguro: </span>
                <span className="text-muted-foreground">Não consome gigabytes da memória e mantém seus dados seguros.</span>
              </div>
            </div>
          </div>

          {/* Instruções específicas para iOS Safari */}
          {isIOS ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 text-xs">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Export size={16} weight="bold" />
                Como instalar no iPhone / iPad:
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
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
            </div>
          ) : null}
        </div>

        {/* Rodapé com botão de ação */}
        <div className="p-4 border-t border-border/70 bg-card/80 flex flex-col sm:flex-row items-center justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer text-center"
          >
            {isIOS ? 'Entendi' : 'Mais tarde'}
          </button>

          {canPromptDirectly && !isIOS ? (
            <button
              type="button"
              onClick={async () => {
                await onInstalar();
                onClose();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md hover:shadow-primary/20 transition-all cursor-pointer text-center"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>Instalar Agora</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
