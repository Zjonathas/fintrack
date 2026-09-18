from contextlib import asynccontextmanager
from datetime import date
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .database import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização: cria tabelas, ajusta schema se legado e injeta dados padrão
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        crud.ensure_db_schema(db)
        crud.seed_categorias_iniciais(db)
    finally:
        db.close()
    yield
    # Finalização (se necessário)


app = FastAPI(
    title="Finanças Pessoais API",
    description="API para gestão de despesas pessoais com autenticação JWT, isolamento de usuários, rastreamento de taxas de entrega e dashboard analítico.",
    version="1.1.0",
    lifespan=lifespan
)

# Configuração de CORS para permitir acesso do frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
# Endpoints de Autenticação (Auth)
# ==========================================

@app.post(
    "/api/auth/register",
    response_model=schemas.UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Autenticação"],
    summary="Cadastrar um novo usuário"
)
def cadastrar_usuario(
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db)
):
    existente = crud.get_usuario_by_email(db=db, email=usuario.email)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma conta cadastrada com este e-mail."
        )

    senha_hash = auth.hash_password(usuario.senha)
    novo_usuario = crud.create_usuario(db=db, usuario=usuario, senha_hash=senha_hash)
    return novo_usuario


@app.post(
    "/api/auth/login",
    response_model=schemas.TokenResponse,
    status_code=status.HTTP_200_OK,
    tags=["Autenticação"],
    summary="Autenticar usuário e obter token JWT"
)
def autenticar_usuario(
    credenciais: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    usuario = crud.get_usuario_by_email(db=db, email=credenciais.email)
    if not usuario or not auth.verify_password(credenciais.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth.create_access_token(
        data={"sub": str(usuario.id), "email": usuario.email, "nome": usuario.nome}
    )
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario=usuario
    )


@app.get(
    "/api/auth/me",
    response_model=schemas.UsuarioResponse,
    tags=["Autenticação"],
    summary="Obter dados do usuário autenticado atual"
)
def obter_usuario_logado(
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    return current_user


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
    current_user: models.Usuario = Depends(auth.get_current_user),
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
# Endpoints de Transações (Protegidos)
# ==========================================

@app.get(
    "/api/transacoes",
    response_model=List[schemas.TransacaoResponse],
    tags=["Transações"],
    summary="Listar transações do usuário com filtros dinâmicos"
)
def listar_transacoes(
    categoria_id: Optional[int] = Query(None, description="Filtrar por ID da categoria"),
    teve_entrega: Optional[bool] = Query(None, description="Filtrar por presença de taxa de entrega (True/False)"),
    data_inicio: Optional[date] = Query(None, description="Data de início do período (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final do período (YYYY-MM-DD)"),
    busca: Optional[str] = Query(None, description="Termo de busca na descrição da transação"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_transacoes(
        db=db,
        usuario_id=current_user.id,
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
    summary="Registrar nova transação financeira do usuário"
)
def registrar_transacao(
    transacao: schemas.TransacaoCreate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Valida se a categoria informada existe
    cat = crud.get_categoria_by_id(db=db, categoria_id=transacao.categoria_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria com ID {transacao.categoria_id} não encontrada."
        )
    return crud.create_transacao(db=db, transacao=transacao, usuario_id=current_user.id)


@app.delete(
    "/api/transacoes/{transacao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Transações"],
    summary="Excluir transação do usuário"
)
def remover_transacao(
    transacao_id: int,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sucesso = crud.delete_transacao(db=db, transacao_id=transacao_id, usuario_id=current_user.id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com ID {transacao_id} não encontrada ou não pertence a este usuário."
        )
    return None


@app.put(
    "/api/transacoes/{transacao_id}",
    response_model=schemas.TransacaoResponse,
    tags=["Transações"],
    summary="Atualizar transação financeira existente do usuário"
)
def atualizar_transacao(
    transacao_id: int,
    transacao: schemas.TransacaoUpdate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Valida se a categoria informada existe
    cat = crud.get_categoria_by_id(db=db, categoria_id=transacao.categoria_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria com ID {transacao.categoria_id} não encontrada."
        )
    atualizado = crud.update_transacao(
        db=db,
        transacao_id=transacao_id,
        transacao=transacao,
        usuario_id=current_user.id
    )
    if not atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com ID {transacao_id} não encontrada ou não pertence a este usuário."
        )
    return atualizado


@app.post(
    "/api/transacoes/bulk-delete",
    response_model=schemas.TransacaoBulkDeleteResponse,
    status_code=status.HTTP_200_OK,
    tags=["Transações"],
    summary="Excluir múltiplas transações em lote do usuário"
)
def remover_transacoes_em_lote(
    payload: schemas.TransacaoBulkDeleteRequest,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum ID informado para exclusão em lote."
        )
    qtd = crud.delete_transacoes_bulk(db=db, ids=payload.ids, usuario_id=current_user.id)
    return {
        "excluidos": qtd,
        "mensagem": f"{qtd} transação(ões) excluída(s) com sucesso."
    }


# ==========================================
# Endpoints do Dashboard e Resumo (Protegidos)
# ==========================================

@app.get(
    "/api/dashboard/resumo",
    response_model=schemas.ResumoAnalitico,
    tags=["Dashboard"],
    summary="Obter métricas consolidadas e gastos por categoria do usuário"
)
def obter_resumo_dashboard(
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_resumo_analitico(db=db, usuario_id=current_user.id)
