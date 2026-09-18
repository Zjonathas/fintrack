import axios from 'axios';
import {
  AuthResponse,
  BulkDeleteResponse,
  Categoria,
  FiltrosTransacao,
  LoginPayload,
  RegisterPayload,
  ResumoAnalitico,
  Transacao,
  TransacaoCreatePayload,
  TransacaoUpdatePayload,
  Usuario,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Requisição: Injeta automaticamente o token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Resposta: Trata expiração/invalidação do token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispara evento global para o AuthContext deslogar o usuário de forma limpa
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Autenticação
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<Usuario> {
    const response = await api.post<Usuario>('/auth/register', payload);
    return response.data;
  },

  async getMe(): Promise<Usuario> {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },

  // Categorias
  async getCategorias(): Promise<Categoria[]> {
    const response = await api.get<Categoria[]>('/categorias');
    return response.data;
  },

  async criarCategoria(nome: string): Promise<Categoria> {
    const response = await api.post<Categoria>('/categorias', { nome });
    return response.data;
  },

  // Transações
  async getTransacoes(filtros?: FiltrosTransacao): Promise<Transacao[]> {
    const params: Record<string, any> = {};

    if (filtros) {
      if (filtros.categoria_id !== undefined && filtros.categoria_id !== '') {
        params.categoria_id = filtros.categoria_id;
      }
      if (filtros.teve_entrega !== undefined && filtros.teve_entrega !== '') {
        params.teve_entrega = filtros.teve_entrega;
      }
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio;
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim;
      }
      if (filtros.busca && filtros.busca.trim() !== '') {
        params.busca = filtros.busca.trim();
      }
    }

    const response = await api.get<Transacao[]>('/transacoes', { params });
    return response.data;
  },

  async criarTransacao(payload: TransacaoCreatePayload): Promise<Transacao> {
    const response = await api.post<Transacao>('/transacoes', payload);
    return response.data;
  },

  async deletarTransacao(id: number): Promise<void> {
    await api.delete(`/transacoes/${id}`);
  },

  async atualizarTransacao(id: number, payload: TransacaoUpdatePayload): Promise<Transacao> {
    const response = await api.put<Transacao>(`/transacoes/${id}`, payload);
    return response.data;
  },

  async deletarTransacoesEmLote(ids: number[]): Promise<BulkDeleteResponse> {
    const response = await api.post<BulkDeleteResponse>('/transacoes/bulk-delete', { ids });
    return response.data;
  },

  // Dashboard & Métricas
  async getResumoDashboard(): Promise<ResumoAnalitico> {
    const response = await api.get<ResumoAnalitico>('/dashboard/resumo');
    return response.data;
  },
};

export default api;
