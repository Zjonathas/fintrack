import re
from contextlib import asynccontextmanager
from datetime import date
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .database import Base, engine, get_db
from .limiter import AUTH_RATE_LIMIT, BULK_RATE_LIMIT, limiter


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
    description="API para gestão e controle de despesas pessoais, identificação de maiores gastos, análise de economia e autenticação JWT.",
    version="2.0.0",
    lifespan=lifespan
)

# Configuração do Rate Limiter (SlowAPI)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

def formatar_limite_pt(detalhe: str) -> str:
    """Traduz descrições em inglês de limites do SlowAPI para português amigável."""
    if not detalhe:
        return "limite excedido"
    texto = str(detalhe).strip()
    texto = re.sub(r"\bper\s+1\s+minute\b", "por minuto", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+(\d+)\s+minutes\b", r"a cada \1 minutos", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+minute\b", "por minuto", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+1\s+second\b", "por segundo", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+second\b", "por segundo", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+1\s+hour\b", "por hora", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+hour\b", "por hora", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+1\s+day\b", "por dia", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bper\s+day\b", "por dia", texto, flags=re.IGNORECASE)
    return texto


@app.exception_handler(RateLimitExceeded)
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    limite_formatado = formatar_limite_pt(exc.detail)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": f"Muitas requisições em pouco tempo. Limite excedido: {limite_formatado}. Por favor, aguarde alguns instantes antes de tentar novamente."
        }
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
@limiter.limit(AUTH_RATE_LIMIT)
def cadastrar_usuario(
    request: Request,
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
@limiter.limit(AUTH_RATE_LIMIT)
def autenticar_usuario(
    request: Request,
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
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: 'receita' ou 'despesa'"),
    cartao_id: Optional[int] = Query(None, description="Filtrar por ID do cartão de crédito"),
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
        tipo=tipo,
        cartao_id=cartao_id,
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
    # Valida se a categoria informada existe (apenas se fornecida, como em despesas)
    if transacao.categoria_id is not None:
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
    # Valida se a categoria informada existe (apenas se fornecida)
    if transacao.categoria_id is not None:
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
@limiter.limit(BULK_RATE_LIMIT)
def remover_transacoes_em_lote(
    request: Request,
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
    data_inicio: Optional[date] = Query(None, description="Data inicial do período (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final do período (YYYY-MM-DD)"),
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_resumo_analitico(
        db=db,
        usuario_id=current_user.id,
        data_inicio=data_inicio,
        data_fim=data_fim
    )


@app.get(
    "/api/dashboard/fluxo-caixa",
    response_model=schemas.FluxoCaixaProjecao,
    tags=["Dashboard"],
    summary="Projeção de fluxo de caixa para o próximo mês"
)
def obter_fluxo_caixa(
    mes_referencia: Optional[str] = Query(None, description="Mês de referência no formato YYYY-MM. Padrão: próximo mês."),
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_fluxo_caixa_projecao(db=db, usuario_id=current_user.id, mes_referencia=mes_referencia)


# ==========================================
# Endpoints de Cartões de Crédito (Protegidos)
# ==========================================

@app.get(
    "/api/cartoes",
    response_model=List[schemas.CartaoCreditoResponse],
    tags=["Cartões"],
    summary="Listar cartões de crédito do usuário"
)
def listar_cartoes(
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_cartoes(db=db, usuario_id=current_user.id)


@app.post(
    "/api/cartoes",
    response_model=schemas.CartaoCreditoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cartões"],
    summary="Cadastrar novo cartão de crédito"
)
def criar_cartao(
    cartao: schemas.CartaoCreditoCreate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_cartao(db=db, cartao=cartao, usuario_id=current_user.id)


@app.put(
    "/api/cartoes/{cartao_id}",
    response_model=schemas.CartaoCreditoResponse,
    tags=["Cartões"],
    summary="Atualizar dados do cartão de crédito"
)
def atualizar_cartao(
    cartao_id: int,
    cartao: schemas.CartaoCreditoUpdate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    atualizado = crud.update_cartao(db=db, cartao_id=cartao_id, cartao=cartao, usuario_id=current_user.id)
    if not atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cartão com ID {cartao_id} não encontrado ou não pertence a este usuário."
        )
    return atualizado


@app.delete(
    "/api/cartoes/{cartao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Cartões"],
    summary="Excluir cartão de crédito"
)
def remover_cartao(
    cartao_id: int,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sucesso = crud.delete_cartao(db=db, cartao_id=cartao_id, usuario_id=current_user.id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cartão com ID {cartao_id} não encontrado ou não pertence a este usuário."
        )
    return None


@app.get(
    "/api/cartoes/{cartao_id}/fatura",
    response_model=schemas.FaturaCartaoResumo,
    tags=["Cartões"],
    summary="Obter resumo da fatura do cartão para um mês específico"
)
def obter_fatura_cartao(
    cartao_id: int,
    mes_referencia: Optional[str] = Query(None, description="Mês de referência no formato YYYY-MM. Padrão: fatura aberta atual."),
    ano: Optional[int] = Query(None, description="Ano de referência (ex: 2026)"),
    mes: Optional[int] = Query(None, description="Mês de referência (1-12)"),
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not mes_referencia and ano is not None and mes is not None:
        mes_referencia = f"{ano:04d}-{mes:02d}"

    resultado = crud.get_fatura_cartao(db=db, cartao_id=cartao_id, usuario_id=current_user.id, mes_referencia=mes_referencia)
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cartão com ID {cartao_id} não encontrado ou não pertence a este usuário."
        )
    return resultado


# ==========================================
# Endpoints de Transações Recorrentes (Protegidos)
# ==========================================

@app.get(
    "/api/recorrencias",
    response_model=List[schemas.TransacaoRecorrenteResponse],
    tags=["Recorrências"],
    summary="Listar transações recorrentes do usuário"
)
def listar_recorrencias(
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_recorrencias(db=db, usuario_id=current_user.id)


@app.post(
    "/api/recorrencias",
    response_model=schemas.TransacaoRecorrenteResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Recorrências"],
    summary="Cadastrar nova transação recorrente"
)
def criar_recorrencia(
    recorrencia: schemas.TransacaoRecorrenteCreate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if recorrencia.categoria_id is not None:
        cat = crud.get_categoria_by_id(db=db, categoria_id=recorrencia.categoria_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria com ID {recorrencia.categoria_id} não encontrada."
            )
    return crud.create_recorrencia(db=db, rec=recorrencia, usuario_id=current_user.id)


@app.put(
    "/api/recorrencias/{recorrencia_id}",
    response_model=schemas.TransacaoRecorrenteResponse,
    tags=["Recorrências"],
    summary="Atualizar transação recorrente"
)
def atualizar_recorrencia(
    recorrencia_id: int,
    recorrencia: schemas.TransacaoRecorrenteUpdate,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if recorrencia.categoria_id is not None:
        cat = crud.get_categoria_by_id(db=db, categoria_id=recorrencia.categoria_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria com ID {recorrencia.categoria_id} não encontrada."
            )
    atualizado = crud.update_recorrencia(db=db, recorrencia_id=recorrencia_id, rec=recorrencia, usuario_id=current_user.id)
    if not atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recorrência com ID {recorrencia_id} não encontrada ou não pertence a este usuário."
        )
    return atualizado


@app.delete(
    "/api/recorrencias/{recorrencia_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Recorrências"],
    summary="Excluir transação recorrente"
)
def remover_recorrencia(
    recorrencia_id: int,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sucesso = crud.delete_recorrencia(db=db, recorrencia_id=recorrencia_id, usuario_id=current_user.id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recorrência com ID {recorrencia_id} não encontrada ou não pertence a este usuário."
        )
    return None


@app.patch(
    "/api/recorrencias/{recorrencia_id}/toggle",
    response_model=schemas.TransacaoRecorrenteResponse,
    tags=["Recorrências"],
    summary="Ativar ou desativar uma transação recorrente"
)
def toggle_recorrencia(
    recorrencia_id: int,
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    resultado = crud.toggle_recorrencia(db=db, recorrencia_id=recorrencia_id, usuario_id=current_user.id)
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recorrência com ID {recorrencia_id} não encontrada ou não pertence a este usuário."
        )
    return resultado


@app.post(
    "/api/recorrencias/processar",
    tags=["Recorrências"],
    summary="Gerar lançamentos de transações a partir das recorrências ativas no mês"
)
def processar_recorrencias(
    ano: int = Query(..., ge=2000, le=2100),
    mes: int = Query(..., ge=1, le=12),
    current_user: models.Usuario = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    geradas = crud.processar_recorrencias_do_mes(db=db, usuario_id=current_user.id, ano=ano, mes=mes)
    return {"ano": ano, "mes": mes, "geradas": geradas}
