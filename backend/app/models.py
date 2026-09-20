from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos 1:N
    transacoes = relationship("Transacao", back_populates="usuario", cascade="all, delete-orphan")
    cartoes = relationship("CartaoCredito", back_populates="usuario", cascade="all, delete-orphan")
    recorrencias = relationship("TransacaoRecorrente", back_populates="usuario", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Usuario(id={self.id}, nome='{self.nome}', email='{self.email}')>"


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False, index=True)

    # Relacionamentos 1:N
    transacoes = relationship("Transacao", back_populates="categoria", cascade="all, delete-orphan")
    recorrencias = relationship("TransacaoRecorrente", back_populates="categoria", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Categoria(id={self.id}, nome='{self.nome}')>"


class CartaoCredito(Base):
    """Cartao de credito do usuario com informacoes de limite e ciclo de faturamento."""
    __tablename__ = "cartoes_credito"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    bandeira = Column(String(50), nullable=True)
    limite = Column(Float, nullable=False, default=0.0)
    dia_fechamento = Column(Integer, nullable=False)   # 1-28
    dia_vencimento = Column(Integer, nullable=False)   # 1-28
    cor = Column(String(20), nullable=True, default="#6366F1")
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    usuario = relationship("Usuario", back_populates="cartoes")
    transacoes = relationship("Transacao", back_populates="cartao")

    def __repr__(self) -> str:
        return f"<CartaoCredito(id={self.id}, nome='{self.nome}', limite={self.limite})>"


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(255), nullable=False)
    valor_produto = Column(Float, nullable=False)
    teve_entrega = Column(Boolean, default=False, nullable=False)
    valor_entrega = Column(Float, nullable=True, default=0.0)
    data = Column(Date, default=date.today, nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)

    # Natureza e forma de pagamento
    tipo = Column(String(20), default="despesa", nullable=False, index=True)  # "receita" | "despesa"
    forma_pagamento = Column(String(30), default="dinheiro", nullable=False)
    # "dinheiro" | "pix" | "debito" | "credito" | "boleto" | "outro"

    # Parcelamento no cartao de credito
    cartao_id = Column(Integer, ForeignKey("cartoes_credito.id", ondelete="SET NULL"), nullable=True, index=True)
    parcela_atual = Column(Integer, nullable=True, default=1)
    total_parcelas = Column(Integer, nullable=True, default=1)
    compra_parcelada_id = Column(String(36), nullable=True, index=True)  # UUID do grupo de parcelas

    # Relacionamentos N:1
    categoria = relationship("Categoria", back_populates="transacoes")
    usuario = relationship("Usuario", back_populates="transacoes")
    cartao = relationship("CartaoCredito", back_populates="transacoes")

    @property
    def valor_total(self) -> float:
        """Calculo do valor total somando valor do produto e valor da entrega."""
        entrega = self.valor_entrega if (self.teve_entrega and self.valor_entrega is not None) else 0.0
        return round(self.valor_produto + entrega, 2)

    def __repr__(self) -> str:
        return (
            f"<Transacao(id={self.id}, tipo='{self.tipo}', descricao='{self.descricao}', "
            f"valor_produto={self.valor_produto}, forma_pagamento='{self.forma_pagamento}', "
            f"parcela={self.parcela_atual}/{self.total_parcelas}, data={self.data}, "
            f"usuario_id={self.usuario_id})>"
        )


class TransacaoRecorrente(Base):
    """Despesas ou receitas fixas que se repetem mensalmente (salario, internet, etc.)."""
    __tablename__ = "transacoes_recorrentes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(255), nullable=False)
    valor = Column(Float, nullable=False)
    tipo = Column(String(20), nullable=False, index=True)   # "receita" | "despesa"
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    dia_vencimento = Column(Integer, nullable=False)         # Dia do mes (1-31)
    frequencia = Column(String(20), default="mensal", nullable=False)
    ativa = Column(Boolean, default=True, nullable=False)
    observacao = Column(String(500), nullable=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos N:1
    categoria = relationship("Categoria", back_populates="recorrencias")
    usuario = relationship("Usuario", back_populates="recorrencias")

    def __repr__(self) -> str:
        return (
            f"<TransacaoRecorrente(id={self.id}, tipo='{self.tipo}', "
            f"descricao='{self.descricao}', valor={self.valor}, ativa={self.ativa})>"
        )

