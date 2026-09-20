export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criado_em: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nome: string;
}

export type TipoTransacao = 'receita' | 'despesa';
export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'boleto' | 'outro';

export interface CartaoCredito {
  id: number;
  nome: string;
  bandeira?: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor: string;
  usuario_id: number;
  criado_em: string;
}

export interface CartaoCreditoPayload {
  nome: string;
  bandeira?: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor?: string;
}

export interface FaturaCartaoResumo {
  cartao_id: number;
  cartao_nome: string;
  mes_referencia: string;
  total_fatura: number;
  limite_utilizado: number;
  limite_disponivel: number;
  percentual_utilizado: number;
  qtd_parcelas_abertas: number;
}

export interface Transacao {
  id: number;
  descricao: string;
  valor_produto: number;
  teve_entrega: boolean;
  valor_entrega: number;
  data: string;
  categoria_id?: number | null;
  usuario_id?: number;
  tipo: TipoTransacao;
  forma_pagamento: FormaPagamento;
  cartao_id?: number | null;
  parcela_atual?: number | null;
  total_parcelas?: number | null;
  compra_parcelada_id?: string | null;
  categoria?: Categoria | null;
  cartao?: CartaoCredito | null;
  valor_total: number;
}


export interface TransacaoCreatePayload {
  descricao: string;
  valor_produto: number;
  teve_entrega: boolean;
  valor_entrega?: number;
  data: string;
  categoria_id?: number | null;
  tipo: TipoTransacao;
  forma_pagamento: FormaPagamento;
  cartao_id?: number | null;
  total_parcelas?: number;
}

export type TransacaoUpdatePayload = TransacaoCreatePayload;

export interface BulkDeletePayload {
  ids: number[];
}

export interface BulkDeleteResponse {
  excluidos: number;
  mensagem: string;
}


export interface GastoPorCategoria {
  categoria_id: number;
  categoria_nome: string;
  total_produto: number;
  total_entrega: number;
  total_geral: number;
  quantidade: number;
}

export interface ResumoAnalitico {
  total_geral: number;
  total_produtos: number;
  total_entregas: number;
  percentual_entregas: number;
  media_valor_entrega: number;
  qtd_transacoes: number;
  qtd_com_entrega: number;
  qtd_sem_entrega: number;
  total_receitas: number;
  total_despesas: number;
  saldo_liquido: number;
  gastos_por_categoria: GastoPorCategoria[];
}

export interface FiltrosTransacao {
  categoria_id?: number | '';
  teve_entrega?: boolean | '';
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
  tipo?: TipoTransacao | '';
  cartao_id?: number | '';
}

export interface TransacaoRecorrente {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria_id?: number | null;
  usuario_id: number;
  dia_vencimento: number;
  frequencia: string;
  ativa: boolean;
  observacao?: string | null;
  criado_em: string;
  categoria?: Categoria | null;
}

export interface TransacaoRecorrentePayload {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria_id?: number | null;
  dia_vencimento: number;
  frequencia?: string;
  observacao?: string;
}

export interface ItemProjecaoMensal {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  origem: 'recorrencia' | 'parcela_cartao';
  categoria_nome?: string | null;
  cartao_nome?: string | null;
}

export interface FluxoCaixaProjecao {
  mes_referencia: string;
  total_receitas_projetadas: number;
  total_despesas_projetadas: number;
  saldo_projetado: number;
  itens: ItemProjecaoMensal[];
}
