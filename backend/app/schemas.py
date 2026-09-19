import re
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


# ==========================================
# Schemas para Usuario e Autenticacao
# ==========================================

class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150, description='Nome completo do usuario')
    email: EmailStr = Field(..., description='Endereco de e-mail do usuario')


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., max_length=100, description='Senha de acesso (minimo de 8 caracteres)')

    @field_validator('senha')
    @classmethod
    def validar_complexidade_senha(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('A senha deve conter no minimo 8 caracteres.')
        if re.search(r'\s', v):
            raise ValueError('A senha nao pode conter espacos em branco.')
        if not re.search(r'[a-z]', v):
            raise ValueError('A senha deve conter pelo menos uma letra minuscula (a-z).')
        if not re.search(r'[A-Z]', v):
            raise ValueError('A senha deve conter pelo menos uma letra maiuscula (A-Z).')
        if not re.search(r'\d', v):
            raise ValueError('A senha deve conter pelo menos um numero (0-9).')
        if not re.search(r'[!@#$%^&*()_\-+=\[\]{};:,.<>?~|/]', v):
            raise ValueError('A senha deve conter pelo menos um caractere especial.')
        return v


class UsuarioResponse(UsuarioBase):
    id: int
    criado_em: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description='E-mail de acesso cadastrado')
    senha: str = Field(..., min_length=1, description='Senha do usuario')


class TokenResponse(BaseModel):
    access_token: str = Field(..., description='Token de acesso JWT')
    token_type: str = Field(default='bearer', description='Tipo do token de autenticacao')
    usuario: UsuarioResponse = Field(..., description='Dados do usuario logado')


# ==========================================
# Schemas para Categoria
# ==========================================

class CategoriaBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100, description='Nome da categoria')


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaResponse(CategoriaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schemas para Cartao de Credito
# ==========================================

class CartaoCreditoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100, description='Nome do cartao (ex: Nubank, Inter)')
    bandeira: Optional[str] = Field(None, max_length=50, description='Bandeira do cartao (Visa, Mastercard, Elo...)')
    limite: float = Field(..., gt=0, description='Limite total do cartao')
    dia_fechamento: int = Field(..., ge=1, le=31, description='Dia do mes em que a fatura fecha')
    dia_vencimento: int = Field(..., ge=1, le=31, description='Dia do mes em que a fatura vence')
    cor: Optional[str] = Field(default='#6366F1', max_length=20, description='Cor tematica do cartao (hex)')


class CartaoCreditoCreate(CartaoCreditoBase):
    pass


class CartaoCreditoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    bandeira: Optional[str] = Field(None, max_length=50)
    limite: Optional[float] = Field(None, gt=0)
    dia_fechamento: Optional[int] = Field(None, ge=1, le=31)
    dia_vencimento: Optional[int] = Field(None, ge=1, le=31)
    cor: Optional[str] = Field(None, max_length=20)


class CartaoCreditoResponse(CartaoCreditoBase):
    id: int
    usuario_id: int
    criado_em: datetime
    model_config = ConfigDict(from_attributes=True)


class FaturaCartaoResumo(BaseModel):
    cartao_id: int
    cartao_nome: str
    mes_referencia: str          # 'YYYY-MM'
    total_fatura: float
    limite_utilizado: float
    limite_disponivel: float
    percentual_utilizado: float
    qtd_parcelas_abertas: int


# ==========================================
# Schemas para Transacao
# ==========================================

class TransacaoBase(BaseModel):
    descricao: str = Field(..., min_length=1, max_length=255, description='Descricao da transacao')
    valor_produto: float = Field(..., gt=0, description='Valor do produto ou servico (deve ser maior que zero)')
    teve_entrega: bool = Field(default=False, description='Flag indicando se houve taxa de frete/entrega')
    valor_entrega: Optional[float] = Field(default=0.0, ge=0, description='Valor pago pelo frete/entrega')
    data: date = Field(default_factory=date.today, description='Data da transacao')
    categoria_id: int = Field(..., description='ID da categoria associada')
    tipo: str = Field(default='despesa', description='Natureza da transacao: receita ou despesa')
    forma_pagamento: str = Field(default='dinheiro', description='Forma de pagamento utilizada')
    cartao_id: Optional[int] = Field(None, description='ID do cartao de credito (obrigatorio se forma_pagamento=credito)')
    total_parcelas: Optional[int] = Field(default=1, ge=1, le=24, description='Total de parcelas (1 a 24)')

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in ('receita', 'despesa'):
            raise ValueError("tipo deve ser 'receita' ou 'despesa'.")
        return v

    @field_validator('forma_pagamento')
    @classmethod
    def validar_forma_pagamento(cls, v: str) -> str:
        validos = ('dinheiro', 'pix', 'debito', 'credito', 'boleto', 'outro')
        if v not in validos:
            raise ValueError(f'forma_pagamento deve ser um de: {validos}.')
        return v


class TransacaoCreate(TransacaoBase):
    @model_validator(mode='after')
    def validate_rules(self):
        # Receitas nao tem frete
        if self.tipo == 'receita':
            self.teve_entrega = False
            self.valor_entrega = 0.0
        else:
            if not self.teve_entrega:
                self.valor_entrega = 0.0
            elif self.valor_entrega is None:
                self.valor_entrega = 0.0
        # Cartao de credito exige cartao_id
        if self.forma_pagamento == 'credito' and not self.cartao_id:
            raise ValueError('cartao_id e obrigatorio quando forma_pagamento for credito.')
        # Garantir total_parcelas minimo
        if self.total_parcelas is None:
            self.total_parcelas = 1
        return self


class TransacaoUpdate(TransacaoCreate):
    pass


class TransacaoBulkDeleteRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1, description='Lista de IDs das transacoes a serem removidas em lote')


class TransacaoBulkDeleteResponse(BaseModel):
    excluidos: int = Field(..., description='Quantidade total de transacoes excluidas com sucesso')
    mensagem: str = Field(..., description='Mensagem de confirmacao da operacao')


class TransacaoResponse(BaseModel):
    id: int
    descricao: str
    valor_produto: float
    teve_entrega: bool
    valor_entrega: float
    data: date
    categoria_id: int
    usuario_id: int
    tipo: str
    forma_pagamento: str
    cartao_id: Optional[int] = None
    parcela_atual: Optional[int] = None
    total_parcelas: Optional[int] = None
    compra_parcelada_id: Optional[str] = None
    categoria: Optional[CategoriaResponse] = None
    cartao: Optional[CartaoCreditoResponse] = None
    valor_total: float
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schemas para Transacao Recorrente
# ==========================================

class TransacaoRecorrenteBase(BaseModel):
    descricao: str = Field(..., min_length=1, max_length=255)
    valor: float = Field(..., gt=0, description='Valor mensal recorrente')
    tipo: str = Field(..., description='receita ou despesa')
    categoria_id: int = Field(..., description='ID da categoria')
    dia_vencimento: int = Field(..., ge=1, le=31, description='Dia do mes para vencimento/recebimento')
    frequencia: str = Field(default='mensal')
    observacao: Optional[str] = Field(None, max_length=500)

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in ('receita', 'despesa'):
            raise ValueError("tipo deve ser 'receita' ou 'despesa'.")
        return v


class TransacaoRecorrenteCreate(TransacaoRecorrenteBase):
    pass


class TransacaoRecorrenteUpdate(BaseModel):
    descricao: Optional[str] = Field(None, min_length=1, max_length=255)
    valor: Optional[float] = Field(None, gt=0)
    tipo: Optional[str] = None
    categoria_id: Optional[int] = None
    dia_vencimento: Optional[int] = Field(None, ge=1, le=31)
    frequencia: Optional[str] = None
    observacao: Optional[str] = Field(None, max_length=500)
    ativa: Optional[bool] = None


class TransacaoRecorrenteResponse(TransacaoRecorrenteBase):
    id: int
    ativa: bool
    usuario_id: int
    criado_em: datetime
    categoria: Optional[CategoriaResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schemas para Dashboard e Analises
# ==========================================

class GastoPorCategoria(BaseModel):
    categoria_id: int
    categoria_nome: str
    total_produto: float
    total_entrega: float
    total_geral: float
    quantidade: int


class ResumoAnalitico(BaseModel):
    total_geral: float
    total_produtos: float
    total_entregas: float
    percentual_entregas: float
    media_valor_entrega: float
    qtd_transacoes: int
    qtd_com_entrega: int
    qtd_sem_entrega: int
    # Novos campos de fluxo de caixa
    total_receitas: float
    total_despesas: float
    saldo_liquido: float
    gastos_por_categoria: List[GastoPorCategoria]


class ItemProjecaoMensal(BaseModel):
    descricao: str
    valor: float
    tipo: str          # 'receita' | 'despesa'
    origem: str        # 'recorrencia' | 'parcela_cartao'
    categoria_nome: Optional[str] = None
    cartao_nome: Optional[str] = None


class FluxoCaixaProjecao(BaseModel):
    mes_referencia: str   # 'YYYY-MM'
    total_receitas_projetadas: float
    total_despesas_projetadas: float
    saldo_projetado: float
    itens: List[ItemProjecaoMensal]
