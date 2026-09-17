from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ==========================================
# Schemas para Categoria
# ==========================================

class CategoriaBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100, description="Nome da categoria")


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaResponse(CategoriaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schemas para Transacao
# ==========================================

class TransacaoBase(BaseModel):
    descricao: str = Field(..., min_length=1, max_length=255, description="Descrição da transação")
    valor_produto: float = Field(..., gt=0, description="Valor do produto ou serviço (deve ser maior que zero)")
    teve_entrega: bool = Field(default=False, description="Flag indicando se houve taxa de frete/entrega")
    valor_entrega: Optional[float] = Field(default=0.0, ge=0, description="Valor pago pelo frete/entrega")
    data: date = Field(default_factory=date.today, description="Data da transação")
    categoria_id: int = Field(..., description="ID da categoria associada")


class TransacaoCreate(TransacaoBase):
    @model_validator(mode="after")
    def validate_delivery_logic(self):
        # Se não teve entrega, força o valor_entrega para 0.0
        if not self.teve_entrega:
            self.valor_entrega = 0.0
        else:
            # Se teve entrega mas não foi preenchido ou é None, garante pelo menos 0.0
            if self.valor_entrega is None:
                self.valor_entrega = 0.0
        return self


class TransacaoResponse(BaseModel):
    id: int
    descricao: str
    valor_produto: float
    teve_entrega: bool
    valor_entrega: float
    data: date
    categoria_id: int
    categoria: Optional[CategoriaResponse] = None
    valor_total: float

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schemas para Dashboard e Análises
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
    gastos_por_categoria: List[GastoPorCategoria]
