from datetime import date
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from . import models, schemas


# ==========================================
# Operações de Categoria
# ==========================================

def get_categorias(db: Session, skip: int = 0, limit: int = 100) -> List[models.Categoria]:
    """Retorna a lista de categorias cadastradas ordenadas por nome."""
    return db.query(models.Categoria).order_by(models.Categoria.nome.asc()).offset(skip).limit(limit).all()


def get_categoria_by_id(db: Session, categoria_id: int) -> Optional[models.Categoria]:
    """Busca uma categoria específica pelo ID."""
    return db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()


def get_categoria_by_nome(db: Session, nome: str) -> Optional[models.Categoria]:
    """Busca uma categoria pelo nome."""
    return db.query(models.Categoria).filter(models.Categoria.nome.ilike(nome.strip())).first()


def create_categoria(db: Session, categoria: schemas.CategoriaCreate) -> models.Categoria:
    """Cria uma nova categoria no banco de dados."""
    db_categoria = models.Categoria(nome=categoria.nome.strip())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def seed_categorias_iniciais(db: Session):
    """Insere categorias iniciais caso o banco esteja vazio."""
    if db.query(models.Categoria).count() == 0:
        categorias_padrao = [
            "Alimentação & Delivery",
            "Supermercado & Feira",
            "Farmácia & Saúde",
            "Transporte & Combustível",
            "Lazer & Entretenimento",
            "Compras Online",
            "Moradia & Contas",
            "Serviços & Outros"
        ]
        for nome in categorias_padrao:
            db.add(models.Categoria(nome=nome))
        db.commit()


# ==========================================
# Operações de Transação
# ==========================================

def get_transacoes(
    db: Session,
    categoria_id: Optional[int] = None,
    teve_entrega: Optional[bool] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    busca: Optional[str] = None,
    skip: int = 0,
    limit: int = 200
) -> List[models.Transacao]:
    """Consulta transações com filtros dinâmicos e eager-load da categoria."""
    query = db.query(models.Transacao).options(joinedload(models.Transacao.categoria))

    if categoria_id is not None:
        query = query.filter(models.Transacao.categoria_id == categoria_id)

    if teve_entrega is not None:
        query = query.filter(models.Transacao.teve_entrega == teve_entrega)

    if data_inicio is not None:
        query = query.filter(models.Transacao.data >= data_inicio)

    if data_fim is not None:
        query = query.filter(models.Transacao.data <= data_fim)

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(models.Transacao.descricao.ilike(termo))

    # Ordena pelas transações mais recentes
    return query.order_by(models.Transacao.data.desc(), models.Transacao.id.desc()).offset(skip).limit(limit).all()


def create_transacao(db: Session, transacao: schemas.TransacaoCreate) -> models.Transacao:
    """Registra uma nova transação."""
    db_transacao = models.Transacao(
        descricao=transacao.descricao.strip(),
        valor_produto=round(transacao.valor_produto, 2),
        teve_entrega=transacao.teve_entrega,
        valor_entrega=round(transacao.valor_entrega or 0.0, 2) if transacao.teve_entrega else 0.0,
        data=transacao.data,
        categoria_id=transacao.categoria_id
    )
    db.add(db_transacao)
    db.commit()
    db.refresh(db_transacao)
    # Recarrega relação com categoria
    db.refresh(db_transacao, ["categoria"])
    return db_transacao


def delete_transacao(db: Session, transacao_id: int) -> bool:
    """Remove uma transação pelo ID."""
    db_transacao = db.query(models.Transacao).filter(models.Transacao.id == transacao_id).first()
    if not db_transacao:
        return False
    db.delete(db_transacao)
    db.commit()
    return True


def update_transacao(
    db: Session,
    transacao_id: int,
    transacao: schemas.TransacaoUpdate
) -> Optional[models.Transacao]:
    """Atualiza os dados de uma transação existente."""
    db_transacao = db.query(models.Transacao).filter(models.Transacao.id == transacao_id).first()
    if not db_transacao:
        return None

    db_transacao.descricao = transacao.descricao.strip()
    db_transacao.valor_produto = round(transacao.valor_produto, 2)
    db_transacao.teve_entrega = transacao.teve_entrega
    db_transacao.valor_entrega = round(transacao.valor_entrega or 0.0, 2) if transacao.teve_entrega else 0.0
    db_transacao.data = transacao.data
    db_transacao.categoria_id = transacao.categoria_id

    db.commit()
    db.refresh(db_transacao)
    db.refresh(db_transacao, ["categoria"])
    return db_transacao


def delete_transacoes_bulk(db: Session, ids: List[int]) -> int:
    """Exclui múltiplos registros de transações em lote atomicamente."""
    if not ids:
        return 0
    qtd = db.query(models.Transacao).filter(models.Transacao.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return qtd



# ==========================================
# Resumo Analítico e Dashboard
# ==========================================

def get_resumo_analitico(db: Session) -> schemas.ResumoAnalitico:
    """Gera o resumo estatístico das transações e agrupamento por categoria."""
    transacoes = db.query(models.Transacao).all()

    total_produtos = 0.0
    total_entregas = 0.0
    qtd_transacoes = len(transacoes)
    qtd_com_entrega = 0
    qtd_sem_entrega = 0

    for t in transacoes:
        total_produtos += t.valor_produto
        if t.teve_entrega:
            qtd_com_entrega += 1
            total_entregas += (t.valor_entrega or 0.0)
        else:
            qtd_sem_entrega += 1

    total_produtos = round(total_produtos, 2)
    total_entregas = round(total_entregas, 2)
    total_geral = round(total_produtos + total_entregas, 2)

    percentual_entregas = round((total_entregas / total_geral * 100), 2) if total_geral > 0 else 0.0
    media_valor_entrega = round((total_entregas / qtd_com_entrega), 2) if qtd_com_entrega > 0 else 0.0

    # Gastos por categoria
    # Agrupamento manual para garantir integridade e incluir categorias mesmo com zero ou cálculo dinâmico
    categorias = db.query(models.Categoria).all()
    mapa_categorias = {
        c.id: {
            "categoria_id": c.id,
            "categoria_nome": c.nome,
            "total_produto": 0.0,
            "total_entrega": 0.0,
            "total_geral": 0.0,
            "quantidade": 0
        }
        for c in categorias
    }

    for t in transacoes:
        if t.categoria_id in mapa_categorias:
            item = mapa_categorias[t.categoria_id]
            entrega = t.valor_entrega if (t.teve_entrega and t.valor_entrega is not None) else 0.0
            item["total_produto"] += t.valor_produto
            item["total_entrega"] += entrega
            item["total_geral"] += (t.valor_produto + entrega)
            item["quantidade"] += 1

    gastos_por_categoria = [
        schemas.GastoPorCategoria(
            categoria_id=v["categoria_id"],
            categoria_nome=v["categoria_nome"],
            total_produto=round(v["total_produto"], 2),
            total_entrega=round(v["total_entrega"], 2),
            total_geral=round(v["total_geral"], 2),
            quantidade=v["quantidade"]
        )
        for v in mapa_categorias.values()
        if v["quantidade"] > 0
    ]

    # Ordena do maior gasto total para o menor
    gastos_por_categoria.sort(key=lambda x: x.total_geral, reverse=True)

    return schemas.ResumoAnalitico(
        total_geral=total_geral,
        total_produtos=total_produtos,
        total_entregas=total_entregas,
        percentual_entregas=percentual_entregas,
        media_valor_entrega=media_valor_entrega,
        qtd_transacoes=qtd_transacoes,
        qtd_com_entrega=qtd_com_entrega,
        qtd_sem_entrega=qtd_sem_entrega,
        gastos_por_categoria=gastos_por_categoria
    )
