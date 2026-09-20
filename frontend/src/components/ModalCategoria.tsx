import React, { useState } from 'react';
import { Tag, Plus, X, CheckCircle, WarningCircle, FolderSimplePlus } from '@phosphor-icons/react';
import { Categoria } from '../types';
import { apiService } from '../services/api';

interface ModalCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  onCategoriaCriada: (novaCategoria: Categoria) => void;
}

export const ModalCategoria: React.FC<ModalCategoriaProps> = ({
  isOpen,
  onClose,
  categorias,
  onCategoriaCriada,
}) => {
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const nomeFormatado = nome.trim();
    if (!nomeFormatado) {
      setFeedback({ tipo: 'erro', msg: 'Digite um nome para a categoria.' });
      return;
    }

    // Validação local de duplicidade case-insensitive
    const duplicada = categorias.some(
      (c) => c.nome.toLowerCase() === nomeFormatado.toLowerCase()
    );
    if (duplicada) {
      setFeedback({ tipo: 'erro', msg: `A categoria "${nomeFormatado}" já está cadastrada.` });
      return;
    }

    try {
      setSalvando(true);
      const nova = await apiService.criarCategoria(nomeFormatado);
      onCategoriaCriada(nova);
      setFeedback({ tipo: 'ok', msg: `Categoria "${nova.nome}" criada com sucesso!` });
      setNome('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar categoria.';
      setFeedback({ tipo: 'erro', msg });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl border border-border rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indicador visual de arrasto no topo para mobile */}
        <div className="sm:hidden w-full pt-1 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header do Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderSimplePlus size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Cadastrar Categoria
              </h3>
              <p className="text-xs text-muted-foreground">
                Crie categorias personalizadas para organizar suas despesas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Fechar"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
              feedback.tipo === 'ok'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {feedback.tipo === 'ok' ? (
              <CheckCircle size={15} weight="bold" />
            ) : (
              <WarningCircle size={15} weight="bold" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="nome-categoria"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5"
            >
              <Tag size={13} weight="bold" />
              <span>Nome da Nova Categoria</span>
            </label>
            <input
              id="nome-categoria"
              type="text"
              autoFocus
              placeholder="Ex: Transporte, Lazer, Saúde, Educação..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !nome.trim()}
              className="min-h-[44px] px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {salvando ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Plus size={15} weight="bold" />
                  <span>Cadastrar Categoria</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Categorias já existentes */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Categorias cadastradas</span>
            <span>{categorias.length} no total</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {categorias.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-secondary text-secondary-foreground border border-border/60"
              >
                <Tag size={11} weight="duotone" className="text-primary" />
                <span>{cat.nome}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
