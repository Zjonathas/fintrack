import axios from 'axios';
import {
  AuthResponse,
  BulkDeleteResponse,
  CartaoCredito,
  CartaoCreditoPayload,
  FaturaCartaoResumo,
  Categoria,
  FiltrosTransacao,
  FluxoCaixaProjecao,
  LoginPayload,
  RegisterPayload,
  ResumoAnalitico,
  Transacao,
  TransacaoCreatePayload,
  TransacaoRecorrente,
  TransacaoRecorrentePayload,
  TransacaoUpdatePayload,
  Usuario,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    const params: Record<string, unknown> = {};

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
      if (filtros.tipo !== undefined && filtros.tipo !== '') {
        params.tipo = filtros.tipo;
      }
      if (filtros.cartao_id !== undefined && filtros.cartao_id !== '') {
        params.cartao_id = filtros.cartao_id;
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

  async getResumoDashboard(dataInicio?: string, dataFim?: string): Promise<ResumoAnalitico> {
    const params: Record<string, string> = {};
    if (dataInicio) params.data_inicio = dataInicio;
    if (dataFim) params.data_fim = dataFim;
    const response = await api.get<ResumoAnalitico>('/dashboard/resumo', { params });
    return response.data;
  },

  async getFluxoCaixa(mesReferencia?: string): Promise<FluxoCaixaProjecao> {
    const params = mesReferencia ? { mes_referencia: mesReferencia } : {};
    const response = await api.get<FluxoCaixaProjecao>('/dashboard/fluxo-caixa', { params });
    return response.data;
  },

  // Cartoes de Credito
  async getCartoes(): Promise<CartaoCredito[]> {
    const response = await api.get<CartaoCredito[]>('/cartoes');
    return response.data;
  },

  async criarCartao(payload: CartaoCreditoPayload): Promise<CartaoCredito> {
    const response = await api.post<CartaoCredito>('/cartoes', payload);
    return response.data;
  },

  async atualizarCartao(id: number, payload: CartaoCreditoPayload): Promise<CartaoCredito> {
    const response = await api.put<CartaoCredito>(`/cartoes/${id}`, payload);
    return response.data;
  },

  async deletarCartao(id: number): Promise<void> {
    await api.delete(`/cartoes/${id}`);
  },

  async getFaturaCartao(cartaoId: number, mesReferencia?: string): Promise<FaturaCartaoResumo> {
    const params = mesReferencia ? { mes_referencia: mesReferencia } : {};
    const response = await api.get<FaturaCartaoResumo>(`/cartoes/${cartaoId}/fatura`, { params });
    return response.data;
  },

  // Recorrencias
  async getRecorrencias(): Promise<TransacaoRecorrente[]> {
    const response = await api.get<TransacaoRecorrente[]>('/recorrencias');
    return response.data;
  },

  async criarRecorrencia(payload: TransacaoRecorrentePayload): Promise<TransacaoRecorrente> {
    const response = await api.post<TransacaoRecorrente>('/recorrencias', payload);
    return response.data;
  },

  async atualizarRecorrencia(id: number, payload: TransacaoRecorrentePayload): Promise<TransacaoRecorrente> {
    const response = await api.put<TransacaoRecorrente>(`/recorrencias/${id}`, payload);
    return response.data;
  },

  async deletarRecorrencia(id: number): Promise<void> {
    await api.delete(`/recorrencias/${id}`);
  },

  async toggleRecorrencia(id: number): Promise<TransacaoRecorrente> {
    const response = await api.patch<TransacaoRecorrente>(`/recorrencias/${id}/toggle`);
    return response.data;
  },
};

export default api;
