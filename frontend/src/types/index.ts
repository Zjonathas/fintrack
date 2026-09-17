export interface Categoria {
  id: number;
  nome: string;
}

export interface Transacao {
  id: number;
  descricao: string;
  valor_produto: number;
  teve_entrega: boolean;
  valor_entrega: number;
  data: string;
  categoria_id: number;
  categoria?: Categoria;
  valor_total: number;
}

export interface TransacaoCreatePayload {
  descricao: string;
  valor_produto: number;
  teve_entrega: boolean;
  valor_entrega?: number;
  data: string;
  categoria_id: number;
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
  gastos_por_categoria: GastoPorCategoria[];
}

export interface FiltrosTransacao {
  categoria_id?: number | '';
  teve_entrega?: boolean | '';
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}
