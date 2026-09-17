from contextlib import asynccontextmanager
from datetime import date
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização: cria tabelas e injeta categorias padrão
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        crud.seed_categorias_iniciais(db)
    finally:
        db.close()
    yield
    # Finalização (se necessário)


app = FastAPI(
    title="Finanças Pessoais API",
    description="API para gestão de despesas pessoais com rastreamento isolado de taxas de entrega e dashboard analítico.",
    version="1.0.0",
    lifespan=lifespan
)

# Configuração de CORS para permitir acesso do frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem em desenvolvimento (ou restrinja a ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "Finanças Pessoais API",
        "docs_url": "/docs"
    }


# ==========================================
# Endpoints de Categorias
# ==========================================

@app.get(
    "/api/categorias",
    response_model=List[schemas.CategoriaResponse],
    tags=["Categorias"],
    summary="Listar categorias cadastradas"
)
def listar_categorias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    return crud.get_categorias(db=db, skip=skip, limit=limit)


@app.post(
    "/api/categorias",
    response_model=schemas.CategoriaResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Categorias"],
    summary="Cadastrar nova categoria"
)
def criar_categoria(
    categoria: schemas.CategoriaCreate,
    db: Session = Depends(get_db)
):
    existente = crud.get_categoria_by_nome(db=db, nome=categoria.nome)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Categoria '{categoria.nome}' já cadastrada."
        )
    return crud.create_categoria(db=db, categoria=categoria)


# ==========================================
# Endpoints de Transações
# ==========================================

@app.get(
    "/api/transacoes",
    response_model=List[schemas.TransacaoResponse],
    tags=["Transações"],
    summary="Listar transações com filtros dinâmicos"
)
def listar_transacoes(
    categoria_id: Optional[int] = Query(None, description="Filtrar por ID da categoria"),
    teve_entrega: Optional[bool] = Query(None, description="Filtrar por presença de taxa de entrega (True/False)"),
    data_inicio: Optional[date] = Query(None, description="Data de início do período (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final do período (YYYY-MM-DD)"),
    busca: Optional[str] = Query(None, description="Termo de busca na descrição da transação"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return crud.get_transacoes(
        db=db,
        categoria_id=categoria_id,
        teve_entrega=teve_entrega,
        data_inicio=data_inicio,
        data_fim=data_fim,
        busca=busca,
        skip=skip,
        limit=limit
    )


@app.post(
    "/api/transacoes",
    response_model=schemas.TransacaoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Transações"],
    summary="Registrar nova transação financeira"
)
def registrar_transacao(
    transacao: schemas.TransacaoCreate,
    db: Session = Depends(get_db)
):
    # Valida se a categoria informada existe
    cat = crud.get_categoria_by_id(db=db, categoria_id=transacao.categoria_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria com ID {transacao.categoria_id} não encontrada."
        )
    return crud.create_transacao(db=db, transacao=transacao)


@app.delete(
    "/api/transacoes/{transacao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Transações"],
    summary="Excluir transação"
)
def remover_transacao(
    transacao_id: int,
    db: Session = Depends(get_db)
):
    sucesso = crud.delete_transacao(db=db, transacao_id=transacao_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com ID {transacao_id} não encontrada."
        )
    return None


# ==========================================
# Endpoints do Dashboard e Resumo
# ==========================================

@app.get(
    "/api/dashboard/resumo",
    response_model=schemas.ResumoAnalitico,
    tags=["Dashboard"],
    summary="Obter métricas consolidadas e gastos por categoria"
)
def obter_resumo_dashboard(db: Session = Depends(get_db)):
    return crud.get_resumo_analitico(db=db)
