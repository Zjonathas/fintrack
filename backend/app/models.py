from datetime import date
from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False, index=True)

    # Relacionamento 1:N com Transações
    transacoes = relationship("Transacao", back_populates="categoria", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Categoria(id={self.id}, nome='{self.nome}')>"


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(255), nullable=False)
    valor_produto = Column(Float, nullable=False)
    teve_entrega = Column(Boolean, default=False, nullable=False)
    valor_entrega = Column(Float, nullable=True, default=0.0)
    data = Column(Date, default=date.today, nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relacionamento N:1 com Categoria
    categoria = relationship("Categoria", back_populates="transacoes")

    @property
    def valor_total(self) -> float:
        """Cálculo do valor total somando valor do produto e valor da entrega."""
        entrega = self.valor_entrega if (self.teve_entrega and self.valor_entrega is not None) else 0.0
        return round(self.valor_produto + entrega, 2)

    def __repr__(self) -> str:
        return (
            f"<Transacao(id={self.id}, descricao='{self.descricao}', "
            f"valor_produto={self.valor_produto}, teve_entrega={self.teve_entrega}, "
            f"valor_entrega={self.valor_entrega}, data={self.data})>"
        )
