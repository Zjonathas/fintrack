import React, { createContext, useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Usuario } from '../types';

export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'financas_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  // Valida o token salvo ao carregar a aplicação
  useEffect(() => {
    const verificarSessao = async () => {
      const tokenSalvo = localStorage.getItem(TOKEN_KEY);
      if (!tokenSalvo) {
        setIsLoading(false);
        return;
      }

      try {
        const dadosUsuario = await apiService.getMe();
        setUsuario(dadosUsuario);
        setToken(tokenSalvo);
      } catch {
        // Se o token for inválido ou expirado, limpa o estado
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verificarSessao();
  }, [logout]);

  // Listener para logout automático caso alguma requisição receba 401 Unauthorized
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login({ email, senha });
      localStorage.setItem(TOKEN_KEY, response.access_token);
      setToken(response.access_token);
      setUsuario(response.usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const cadastrar = async (nome: string, email: string, senha: string) => {
    setIsLoading(true);
    try {
      await apiService.register({ nome, email, senha });
      // Realiza o login imediatamente após o cadastro com sucesso
      await login(email, senha);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isAuthenticated: !!usuario && !!token,
        isLoading,
        login,
        cadastrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
