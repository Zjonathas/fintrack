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

    # Relacionamento 1:N com Transações
    transacoes = relationship("Transacao", back_populates="usuario", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Usuario(id={self.id}, nome='{self.nome}', email='{self.email}')>"


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
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relacionamentos N:1
    categoria = relationship("Categoria", back_populates="transacoes")
    usuario = relationship("Usuario", back_populates="transacoes")

    @property
    def valor_total(self) -> float:
        """Cálculo do valor total somando valor do produto e valor da entrega."""
        entrega = self.valor_entrega if (self.teve_entrega and self.valor_entrega is not None) else 0.0
        return round(self.valor_produto + entrega, 2)

    def __repr__(self) -> str:
        return (
            f"<Transacao(id={self.id}, descricao='{self.descricao}', "
            f"valor_produto={self.valor_produto}, teve_entrega={self.teve_entrega}, "
            f"valor_entrega={self.valor_entrega}, data={self.data}, usuario_id={self.usuario_id})>"
        )

