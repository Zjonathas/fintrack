import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="card p-6 my-4 border-destructive/30 bg-destructive/5 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">
            Ocorreu um erro ao renderizar este bloco.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
