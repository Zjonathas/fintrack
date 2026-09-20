import uuid
from calendar import monthrange
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session, joinedload

from . import models, schemas


# ==========================================
# Operacoes de Usuario
# ==========================================

def get_usuario_by_email(db: Session, email: str) -> Optional[models.Usuario]:
    return db.query(models.Usuario).filter(models.Usuario.email == email.strip().lower()).first()


def get_usuario_by_id(db: Session, usuario_id: int) -> Optional[models.Usuario]:
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()


def create_usuario(db: Session, usuario: schemas.UsuarioCreate, senha_hash: str) -> models.Usuario:
    db_usuario = models.Usuario(
        nome=usuario.nome.strip(),
        email=usuario.email.strip().lower(),
        senha_hash=senha_hash,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    db.execute(text('UPDATE transacoes SET usuario_id = :uid WHERE usuario_id IS NULL'), {'uid': db_usuario.id})
    db.commit()
    return db_usuario


# ==========================================
# Operacoes de Categoria
# ==========================================

def get_categorias(db: Session, skip: int = 0, limit: int = 100) -> List[models.Categoria]:
    return db.query(models.Categoria).order_by(models.Categoria.nome.asc()).offset(skip).limit(limit).all()


def get_categoria_by_id(db: Session, categoria_id: int) -> Optional[models.Categoria]:
    return db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()


def get_categoria_by_nome(db: Session, nome: str) -> Optional[models.Categoria]:
    return db.query(models.Categoria).filter(models.Categoria.nome.ilike(nome.strip())).first()


def create_categoria(db: Session, categoria: schemas.CategoriaCreate) -> models.Categoria:
    db_categoria = models.Categoria(nome=categoria.nome.strip())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def seed_categorias_iniciais(db: Session):
    if db.query(models.Categoria).count() == 0:
        categorias_padrao = [
            'Alimentacao & Delivery',
            'Supermercado & Feira',
            'Farmacia & Saude',
            'Transporte & Combustivel',
            'Lazer & Entretenimento',
            'Compras Online',
            'Moradia & Contas',
            'Servicos & Outros',
            'Salario & Renda',
            'Investimentos & Rendimentos',
        ]
        for nome in categorias_padrao:
            db.add(models.Categoria(nome=nome))
        db.commit()


def ensure_db_schema(db: Session):
    inspector = inspect(db.bind)
    table_names = inspector.get_table_names()

    if 'transacoes' in table_names:
        columns = {col['name']: col for col in inspector.get_columns('transacoes')}
        if 'usuario_id' not in columns:
            db.execute(text('ALTER TABLE transacoes ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id)'))
            db.commit()
        if 'tipo' not in columns:
            db.execute(text("ALTER TABLE transacoes ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'despesa'"))
            db.commit()
        if 'forma_pagamento' not in columns:
            db.execute(text("ALTER TABLE transacoes ADD COLUMN forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'dinheiro'"))
            db.commit()
        if 'cartao_id' not in columns:
            db.execute(text('ALTER TABLE transacoes ADD COLUMN cartao_id INTEGER REFERENCES cartoes_credito(id)'))
            db.commit()
        if 'parcela_atual' not in columns:
            db.execute(text('ALTER TABLE transacoes ADD COLUMN parcela_atual INTEGER DEFAULT 1'))
            db.commit()
        if 'total_parcelas' not in columns:
            db.execute(text('ALTER TABLE transacoes ADD COLUMN total_parcelas INTEGER DEFAULT 1'))
            db.commit()
        if 'compra_parcelada_id' not in columns:
            db.execute(text('ALTER TABLE transacoes ADD COLUMN compra_parcelada_id VARCHAR(36)'))
            db.commit()

        # Migracao SQLite: permitir categoria_id NULL para transacoes de receita
        if 'categoria_id' in columns and not columns['categoria_id'].get('nullable', True):
            if db.bind.dialect.name == 'sqlite':
                db.execute(text('PRAGMA foreign_keys=OFF'))
                db.execute(text('''
                    CREATE TABLE transacoes_migracao (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        descricao VARCHAR(255) NOT NULL,
                        valor_produto FLOAT NOT NULL,
                        teve_entrega BOOLEAN DEFAULT 0 NOT NULL,
                        valor_entrega FLOAT DEFAULT 0.0,
                        data DATE NOT NULL,
                        categoria_id INTEGER,
                        usuario_id INTEGER NOT NULL,
                        tipo VARCHAR(20) DEFAULT 'despesa' NOT NULL,
                        forma_pagamento VARCHAR(30) DEFAULT 'dinheiro' NOT NULL,
                        cartao_id INTEGER,
                        parcela_atual INTEGER DEFAULT 1,
                        total_parcelas INTEGER DEFAULT 1,
                        compra_parcelada_id VARCHAR(36),
                        FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
                        FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                        FOREIGN KEY(cartao_id) REFERENCES cartoes_credito(id) ON DELETE SET NULL
                    )
                '''))
                db.execute(text('''
                    INSERT INTO transacoes_migracao (
                        id, descricao, valor_produto, teve_entrega, valor_entrega,
                        data, categoria_id, usuario_id, tipo, forma_pagamento,
                        cartao_id, parcela_atual, total_parcelas, compra_parcelada_id
                    )
                    SELECT
                        id, descricao, valor_produto, teve_entrega, valor_entrega,
                        data, categoria_id, usuario_id, tipo, forma_pagamento,
                        cartao_id, parcela_atual, total_parcelas, compra_parcelada_id
                    FROM transacoes
                '''))
                db.execute(text('DROP TABLE transacoes'))
                db.execute(text('ALTER TABLE transacoes_migracao RENAME TO transacoes'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_id ON transacoes (id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_data ON transacoes (data)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_categoria_id ON transacoes (categoria_id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_usuario_id ON transacoes (usuario_id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_tipo ON transacoes (tipo)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_cartao_id ON transacoes (cartao_id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_compra_parcelada_id ON transacoes (compra_parcelada_id)'))
                db.execute(text('PRAGMA foreign_keys=ON'))
                db.commit()

    if 'transacoes_recorrentes' in table_names:
        columns_rec = {col['name']: col for col in inspector.get_columns('transacoes_recorrentes')}
        if 'categoria_id' in columns_rec and not columns_rec['categoria_id'].get('nullable', True):
            if db.bind.dialect.name == 'sqlite':
                db.execute(text('PRAGMA foreign_keys=OFF'))
                db.execute(text('''
                    CREATE TABLE transacoes_recorrentes_migracao (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        descricao VARCHAR(255) NOT NULL,
                        valor FLOAT NOT NULL,
                        tipo VARCHAR(20) NOT NULL,
                        categoria_id INTEGER,
                        usuario_id INTEGER NOT NULL,
                        dia_vencimento INTEGER NOT NULL,
                        frequencia VARCHAR(20) DEFAULT 'mensal' NOT NULL,
                        ativa BOOLEAN DEFAULT 1 NOT NULL,
                        observacao VARCHAR(500),
                        criado_em DATETIME NOT NULL,
                        FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
                        FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                    )
                '''))
                db.execute(text('''
                    INSERT INTO transacoes_recorrentes_migracao (
                        id, descricao, valor, tipo, categoria_id, usuario_id,
                        dia_vencimento, frequencia, ativa, observacao, criado_em
                    )
                    SELECT
                        id, descricao, valor, tipo, categoria_id, usuario_id,
                        dia_vencimento, frequencia, ativa, observacao, criado_em
                    FROM transacoes_recorrentes
                '''))
                db.execute(text('DROP TABLE transacoes_recorrentes'))
                db.execute(text('ALTER TABLE transacoes_recorrentes_migracao RENAME TO transacoes_recorrentes'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_recorrentes_id ON transacoes_recorrentes (id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_recorrentes_tipo ON transacoes_recorrentes (tipo)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_recorrentes_categoria_id ON transacoes_recorrentes (categoria_id)'))
                db.execute(text('CREATE INDEX IF NOT EXISTS ix_transacoes_recorrentes_usuario_id ON transacoes_recorrentes (usuario_id)'))
                db.execute(text('PRAGMA foreign_keys=ON'))
                db.commit()


# ==========================================
# Operacoes de Cartao de Credito
# ==========================================

def get_cartoes(db: Session, usuario_id: int) -> List[models.CartaoCredito]:
    return (
        db.query(models.CartaoCredito)
        .filter(models.CartaoCredito.usuario_id == usuario_id)
        .order_by(models.CartaoCredito.nome.asc())
        .all()
    )


def get_cartao_by_id(db: Session, cartao_id: int, usuario_id: int) -> Optional[models.CartaoCredito]:
    return (
        db.query(models.CartaoCredito)
        .filter(models.CartaoCredito.id == cartao_id, models.CartaoCredito.usuario_id == usuario_id)
        .first()
    )


def create_cartao(db: Session, cartao: schemas.CartaoCreditoCreate, usuario_id: int) -> models.CartaoCredito:
    db_cartao = models.CartaoCredito(
        nome=cartao.nome.strip(),
        bandeira=cartao.bandeira,
        limite=round(cartao.limite, 2),
        dia_fechamento=cartao.dia_fechamento,
        dia_vencimento=cartao.dia_vencimento,
        cor=cartao.cor or '#6366F1',
        usuario_id=usuario_id,
    )
    db.add(db_cartao)
    db.commit()
    db.refresh(db_cartao)
    return db_cartao


def update_cartao(db: Session, cartao_id: int, cartao: schemas.CartaoCreditoUpdate, usuario_id: int) -> Optional[models.CartaoCredito]:
    db_cartao = get_cartao_by_id(db, cartao_id, usuario_id)
    if not db_cartao:
        return None
    if cartao.nome is not None:
        db_cartao.nome = cartao.nome.strip()
    if cartao.bandeira is not None:
        db_cartao.bandeira = cartao.bandeira
    if cartao.limite is not None:
        db_cartao.limite = round(cartao.limite, 2)
    if cartao.dia_fechamento is not None:
        db_cartao.dia_fechamento = cartao.dia_fechamento
    if cartao.dia_vencimento is not None:
        db_cartao.dia_vencimento = cartao.dia_vencimento
    if cartao.cor is not None:
        db_cartao.cor = cartao.cor
    db.commit()
    db.refresh(db_cartao)
    return db_cartao


def delete_cartao(db: Session, cartao_id: int, usuario_id: int) -> bool:
    db_cartao = get_cartao_by_id(db, cartao_id, usuario_id)
    if not db_cartao:
        return False
    db.delete(db_cartao)
    db.commit()
    return True


def _calcular_data_primeira_parcela(data_compra: date, cartao: models.CartaoCredito) -> date:
    """
    Regra do melhor dia de compra:
    - Se compra ANTES do fechamento -> entra na fatura que fecha no mes atual
    - Se compra NO ou APOS o fechamento -> entra na fatura que fecha no proximo mes
    Se dia_vencimento < dia_fechamento (ex: fecha dia 29, vence dia 05),
    o vencimento da fatura ocorre no mes seguinte ao do fechamento.
    """
    if data_compra.day < cartao.dia_fechamento:
        ano_fechamento, mes_fechamento = data_compra.year, data_compra.month
    else:
        if data_compra.month == 12:
            ano_fechamento, mes_fechamento = data_compra.year + 1, 1
        else:
            ano_fechamento, mes_fechamento = data_compra.year, data_compra.month + 1

    if cartao.dia_vencimento < cartao.dia_fechamento:
        # Vencimento ocorre no mes seguinte ao do fechamento da fatura
        if mes_fechamento == 12:
            ano_venc, mes_venc = ano_fechamento + 1, 1
        else:
            ano_venc, mes_venc = ano_fechamento, mes_fechamento + 1
    else:
        ano_venc, mes_venc = ano_fechamento, mes_fechamento

    # Ajusta dia de vencimento se ultrapassar o ultimo dia do mes
    ultimo_dia = monthrange(ano_venc, mes_venc)[1]
    dia = min(cartao.dia_vencimento, ultimo_dia)
    return date(ano_venc, mes_venc, dia)


def _avancar_mes(dt: date) -> date:
    """Avanca um mes, ajustando o dia ao ultimo dia do mes destino."""
    if dt.month == 12:
        ano, mes = dt.year + 1, 1
    else:
        ano, mes = dt.year, dt.month + 1
    ultimo_dia = monthrange(ano, mes)[1]
    return dt.replace(year=ano, month=mes, day=min(dt.day, ultimo_dia))


def get_fatura_cartao(db: Session, cartao_id: int, usuario_id: int, mes_referencia: Optional[str] = None) -> Optional[schemas.FaturaCartaoResumo]:
    """Calcula o resumo da fatura de um cartao para o mes de referencia (YYYY-MM)."""
    cartao = get_cartao_by_id(db, cartao_id, usuario_id)
    if not cartao:
        return None

    hoje = date.today()
    if mes_referencia:
        ano, mes = int(mes_referencia[:4]), int(mes_referencia[5:7])
    else:
        # Se mes_referencia nao foi especificado, determina a data de vencimento da fatura atualmente aberta
        data_fatura_atual = _calcular_data_primeira_parcela(hoje, cartao)
        ano, mes = data_fatura_atual.year, data_fatura_atual.month

    primeiro_dia = date(ano, mes, 1)
    ultimo_dia = date(ano, mes, monthrange(ano, mes)[1])

    transacoes_mes = (
        db.query(models.Transacao)
        .filter(
            models.Transacao.cartao_id == cartao_id,
            models.Transacao.usuario_id == usuario_id,
            models.Transacao.data >= primeiro_dia,
            models.Transacao.data <= ultimo_dia,
        )
        .all()
    )

    total_fatura = sum(t.valor_produto for t in transacoes_mes)

    # Limite total utilizado no cartao considera todas as transacoes ativas do usuario neste cartao
    todas_transacoes = (
        db.query(models.Transacao)
        .filter(
            models.Transacao.cartao_id == cartao_id,
            models.Transacao.usuario_id == usuario_id,
        )
        .all()
    )
    total_comprometido = sum(t.valor_produto for t in todas_transacoes)
    limite_disponivel = round(cartao.limite - total_comprometido, 2)
    percentual = round((total_comprometido / cartao.limite * 100), 2) if cartao.limite > 0 else 0.0

    return schemas.FaturaCartaoResumo(
        cartao_id=cartao.id,
        cartao_nome=cartao.nome,
        mes_referencia=f'{ano:04d}-{mes:02d}',
        total_fatura=round(total_fatura, 2),
        limite_utilizado=round(total_comprometido, 2),
        limite_disponivel=max(0.0, limite_disponivel),
        percentual_utilizado=percentual,
        qtd_parcelas_abertas=len(transacoes_mes),
    )


# ==========================================
# Operacoes de Transacao (Multi-tenant)
# ==========================================

def get_transacoes(
    db: Session,
    usuario_id: int,
    categoria_id: Optional[int] = None,
    teve_entrega: Optional[bool] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    busca: Optional[str] = None,
    tipo: Optional[str] = None,
    cartao_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 200
) -> List[models.Transacao]:
    query = (
        db.query(models.Transacao)
        .options(joinedload(models.Transacao.categoria), joinedload(models.Transacao.cartao))
        .filter(models.Transacao.usuario_id == usuario_id)
    )

    if categoria_id is not None:
        query = query.filter(models.Transacao.categoria_id == categoria_id)
    if teve_entrega is not None:
        query = query.filter(models.Transacao.teve_entrega == teve_entrega)
    if data_inicio is not None:
        query = query.filter(models.Transacao.data >= data_inicio)
    if data_fim is not None:
        query = query.filter(models.Transacao.data <= data_fim)
    if busca:
        termo = f'%{busca.strip()}%'
        query = query.filter(models.Transacao.descricao.ilike(termo))
    if tipo is not None:
        query = query.filter(models.Transacao.tipo == tipo)
    if cartao_id is not None:
        query = query.filter(models.Transacao.cartao_id == cartao_id)

    return query.order_by(models.Transacao.data.desc(), models.Transacao.id.desc()).offset(skip).limit(limit).all()


def create_transacao(db: Session, transacao: schemas.TransacaoCreate, usuario_id: int) -> models.Transacao:
    """Cria transacao. Se parcelada no cartao, gera todas as parcelas automaticamente."""
    total_parcelas = transacao.total_parcelas or 1

    if transacao.forma_pagamento == 'credito' and transacao.cartao_id and total_parcelas > 1:
        # Compra parcelada: distribui o valor entre as parcelas
        cartao = get_cartao_by_id(db, transacao.cartao_id, usuario_id)
        grupo_id = str(uuid.uuid4())
        valor_base = round(transacao.valor_produto / total_parcelas, 2)
        valor_ultima = round(transacao.valor_produto - (valor_base * (total_parcelas - 1)), 2)
        data_primeira = _calcular_data_primeira_parcela(transacao.data, cartao)

        primeira_transacao = None
        for i in range(1, total_parcelas + 1):
            valor_parcela = valor_ultima if i == total_parcelas else valor_base
            data_parcela = data_primeira if i == 1 else _avancar_mes(data_primeira)
            if i > 2:
                data_parcela = data_primeira
                for _ in range(i - 1):
                    data_parcela = _avancar_mes(data_parcela)

            db_t = models.Transacao(
                descricao=transacao.descricao.strip(),
                valor_produto=valor_parcela,
                teve_entrega=False,
                valor_entrega=0.0,
                data=data_parcela,
                categoria_id=transacao.categoria_id,
                usuario_id=usuario_id,
                tipo=transacao.tipo,
                forma_pagamento=transacao.forma_pagamento,
                cartao_id=transacao.cartao_id,
                parcela_atual=i,
                total_parcelas=total_parcelas,
                compra_parcelada_id=grupo_id,
            )
            db.add(db_t)
            if i == 1:
                primeira_transacao = db_t

        db.commit()
        db.refresh(primeira_transacao)
        db.refresh(primeira_transacao, ['categoria', 'cartao'])
        return primeira_transacao
    else:
        # Transacao simples (avista ou qualquer outra forma)
        data_final = transacao.data
        if transacao.forma_pagamento == 'credito' and transacao.cartao_id:
            cartao = get_cartao_by_id(db, transacao.cartao_id, usuario_id)
            if cartao:
                data_final = _calcular_data_primeira_parcela(transacao.data, cartao)

        db_transacao = models.Transacao(
            descricao=transacao.descricao.strip(),
            valor_produto=round(transacao.valor_produto, 2),
            teve_entrega=False if transacao.tipo == 'receita' else transacao.teve_entrega,
            valor_entrega=0.0 if transacao.tipo == 'receita' else (round(transacao.valor_entrega or 0.0, 2) if transacao.teve_entrega else 0.0),
            data=data_final,
            categoria_id=None if transacao.tipo == 'receita' else transacao.categoria_id,
            usuario_id=usuario_id,
            tipo=transacao.tipo,
            forma_pagamento=transacao.forma_pagamento,
            cartao_id=None if transacao.tipo == 'receita' else (transacao.cartao_id if transacao.forma_pagamento == 'credito' else None),
            parcela_atual=1,
            total_parcelas=1,
        )
        db.add(db_transacao)
        db.commit()
        db.refresh(db_transacao)
        db.refresh(db_transacao, ['categoria', 'cartao'])
        return db_transacao


def delete_transacao(db: Session, transacao_id: int, usuario_id: int) -> bool:
    db_transacao = (
        db.query(models.Transacao)
        .filter(models.Transacao.id == transacao_id, models.Transacao.usuario_id == usuario_id)
        .first()
    )
    if not db_transacao:
        return False
    db.delete(db_transacao)
    db.commit()
    return True


def update_transacao(db: Session, transacao_id: int, transacao: schemas.TransacaoUpdate, usuario_id: int) -> Optional[models.Transacao]:
    db_transacao = (
        db.query(models.Transacao)
        .filter(models.Transacao.id == transacao_id, models.Transacao.usuario_id == usuario_id)
        .first()
    )
    if not db_transacao:
        return None

    db_transacao.descricao = transacao.descricao.strip()
    db_transacao.valor_produto = round(transacao.valor_produto, 2)
    db_transacao.teve_entrega = False if transacao.tipo == 'receita' else transacao.teve_entrega
    db_transacao.valor_entrega = 0.0 if transacao.tipo == 'receita' else (round(transacao.valor_entrega or 0.0, 2) if transacao.teve_entrega else 0.0)
    data_final = transacao.data
    if transacao.forma_pagamento == 'credito' and db_transacao.cartao_id and (db_transacao.total_parcelas or 1) <= 1:
        cartao = get_cartao_by_id(db, db_transacao.cartao_id, usuario_id)
        if cartao:
            data_final = _calcular_data_primeira_parcela(transacao.data, cartao)
    db_transacao.data = data_final
    db_transacao.categoria_id = None if transacao.tipo == 'receita' else transacao.categoria_id
    db_transacao.tipo = transacao.tipo
    db_transacao.forma_pagamento = transacao.forma_pagamento
    db_transacao.cartao_id = None if transacao.tipo == 'receita' else (transacao.cartao_id if transacao.forma_pagamento == 'credito' else None)

    db.commit()
    db.refresh(db_transacao)
    db.refresh(db_transacao, ['categoria', 'cartao'])
    return db_transacao


def delete_transacoes_bulk(db: Session, ids: List[int], usuario_id: int) -> int:
    if not ids:
        return 0
    qtd = (
        db.query(models.Transacao)
        .filter(models.Transacao.id.in_(ids), models.Transacao.usuario_id == usuario_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return qtd


# ==========================================
# Operacoes de Transacao Recorrente
# ==========================================

def get_recorrencias(db: Session, usuario_id: int) -> List[models.TransacaoRecorrente]:
    return (
        db.query(models.TransacaoRecorrente)
        .options(joinedload(models.TransacaoRecorrente.categoria))
        .filter(models.TransacaoRecorrente.usuario_id == usuario_id)
        .order_by(models.TransacaoRecorrente.tipo.asc(), models.TransacaoRecorrente.descricao.asc())
        .all()
    )


def get_recorrencia_by_id(db: Session, recorrencia_id: int, usuario_id: int) -> Optional[models.TransacaoRecorrente]:
    return (
        db.query(models.TransacaoRecorrente)
        .options(joinedload(models.TransacaoRecorrente.categoria))
        .filter(models.TransacaoRecorrente.id == recorrencia_id, models.TransacaoRecorrente.usuario_id == usuario_id)
        .first()
    )


def create_recorrencia(db: Session, rec: schemas.TransacaoRecorrenteCreate, usuario_id: int) -> models.TransacaoRecorrente:
    db_rec = models.TransacaoRecorrente(
        descricao=rec.descricao.strip(),
        valor=round(rec.valor, 2),
        tipo=rec.tipo,
        categoria_id=None if rec.tipo == 'receita' else rec.categoria_id,
        usuario_id=usuario_id,
        dia_vencimento=rec.dia_vencimento,
        frequencia=rec.frequencia,
        ativa=True,
        observacao=rec.observacao,
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    db.refresh(db_rec, ['categoria'])
    return db_rec


def update_recorrencia(db: Session, recorrencia_id: int, rec: schemas.TransacaoRecorrenteUpdate, usuario_id: int) -> Optional[models.TransacaoRecorrente]:
    db_rec = get_recorrencia_by_id(db, recorrencia_id, usuario_id)
    if not db_rec:
        return None
    if rec.descricao is not None:
        db_rec.descricao = rec.descricao.strip()
    if rec.valor is not None:
        db_rec.valor = round(rec.valor, 2)
    if rec.tipo is not None:
        db_rec.tipo = rec.tipo
    if rec.tipo == 'receita' or db_rec.tipo == 'receita':
        db_rec.categoria_id = None
    elif rec.categoria_id is not None:
        db_rec.categoria_id = rec.categoria_id
    if rec.dia_vencimento is not None:
        db_rec.dia_vencimento = rec.dia_vencimento
    if rec.frequencia is not None:
        db_rec.frequencia = rec.frequencia
    if rec.observacao is not None:
        db_rec.observacao = rec.observacao
    if rec.ativa is not None:
        db_rec.ativa = rec.ativa
    db.commit()
    db.refresh(db_rec)
    db.refresh(db_rec, ['categoria'])
    return db_rec


def delete_recorrencia(db: Session, recorrencia_id: int, usuario_id: int) -> bool:
    db_rec = get_recorrencia_by_id(db, recorrencia_id, usuario_id)
    if not db_rec:
        return False
    db.delete(db_rec)
    db.commit()
    return True


def toggle_recorrencia(db: Session, recorrencia_id: int, usuario_id: int) -> Optional[models.TransacaoRecorrente]:
    db_rec = get_recorrencia_by_id(db, recorrencia_id, usuario_id)
    if not db_rec:
        return None
    db_rec.ativa = not db_rec.ativa
    db.commit()
    db.refresh(db_rec)
    return db_rec


# ==========================================
# Resumo Analitico e Dashboard (Isolado)
# ==========================================

def get_resumo_analitico(
    db: Session,
    usuario_id: int,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None
) -> schemas.ResumoAnalitico:
    query = db.query(models.Transacao).filter(models.Transacao.usuario_id == usuario_id)
    if data_inicio is not None:
        query = query.filter(models.Transacao.data >= data_inicio)
    if data_fim is not None:
        query = query.filter(models.Transacao.data <= data_fim)

    transacoes = query.all()

    total_produtos = 0.0
    total_entregas = 0.0
    total_receitas = 0.0
    total_despesas = 0.0
    qtd_transacoes = len(transacoes)
    qtd_com_entrega = 0
    qtd_sem_entrega = 0

    for t in transacoes:
        if t.tipo == 'receita':
            total_receitas += t.valor_produto
        else:
            total_produtos += t.valor_produto
            if t.teve_entrega:
                qtd_com_entrega += 1
                total_entregas += (t.valor_entrega or 0.0)
            else:
                qtd_sem_entrega += 1

    total_produtos = round(total_produtos, 2)
    total_entregas = round(total_entregas, 2)
    total_receitas = round(total_receitas, 2)
    total_despesas = round(total_produtos + total_entregas, 2)
    total_geral = round(total_produtos + total_entregas, 2)
    saldo_liquido = round(total_receitas - total_despesas, 2)

    percentual_entregas = round((total_entregas / total_geral * 100), 2) if total_geral > 0 else 0.0
    media_valor_entrega = round((total_entregas / qtd_com_entrega), 2) if qtd_com_entrega > 0 else 0.0

    categorias = db.query(models.Categoria).all()
    mapa_categorias = {
        c.id: {
            'categoria_id': c.id,
            'categoria_nome': c.nome,
            'total_produto': 0.0,
            'total_entrega': 0.0,
            'total_geral': 0.0,
            'quantidade': 0,
        }
        for c in categorias
    }

    for t in transacoes:
        if t.tipo == 'receita':
            continue
        if t.categoria_id in mapa_categorias:
            item = mapa_categorias[t.categoria_id]
            entrega = t.valor_entrega if (t.teve_entrega and t.valor_entrega is not None) else 0.0
            item['total_produto'] += t.valor_produto
            item['total_entrega'] += entrega
            item['total_geral'] += (t.valor_produto + entrega)
            item['quantidade'] += 1

    gastos_por_categoria = [
        schemas.GastoPorCategoria(
            categoria_id=v['categoria_id'],
            categoria_nome=v['categoria_nome'],
            total_produto=round(v['total_produto'], 2),
            total_entrega=round(v['total_entrega'], 2),
            total_geral=round(v['total_geral'], 2),
            quantidade=v['quantidade'],
        )
        for v in mapa_categorias.values()
        if v['quantidade'] > 0
    ]
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
        total_receitas=total_receitas,
        total_despesas=total_despesas,
        saldo_liquido=saldo_liquido,
        gastos_por_categoria=gastos_por_categoria,
    )


def get_fluxo_caixa_projecao(db: Session, usuario_id: int, mes_referencia: Optional[str] = None) -> schemas.FluxoCaixaProjecao:
    """Projeta receitas e despesas do proximo mes com base em recorrencias e parcelas abertas."""
    hoje = date.today()
    if mes_referencia:
        ano, mes = int(mes_referencia[:4]), int(mes_referencia[5:7])
    else:
        # Proximo mes por padrao
        if hoje.month == 12:
            ano, mes = hoje.year + 1, 1
        else:
            ano, mes = hoje.year, hoje.month + 1

    primeiro_dia = date(ano, mes, 1)
    ultimo_dia = date(ano, mes, monthrange(ano, mes)[1])

    itens: List[schemas.ItemProjecaoMensal] = []
    total_receitas = 0.0
    total_despesas = 0.0

    # Recorrencias ativas
    recorrencias = (
        db.query(models.TransacaoRecorrente)
        .options(joinedload(models.TransacaoRecorrente.categoria))
        .filter(models.TransacaoRecorrente.usuario_id == usuario_id, models.TransacaoRecorrente.ativa == True)
        .all()
    )
    for rec in recorrencias:
        itens.append(schemas.ItemProjecaoMensal(
            descricao=rec.descricao,
            valor=rec.valor,
            tipo=rec.tipo,
            origem='recorrencia',
            categoria_nome=rec.categoria.nome if rec.categoria else None,
        ))
        if rec.tipo == 'receita':
            total_receitas += rec.valor
        else:
            total_despesas += rec.valor

    # Parcelas de cartao com data no mes projetado
    parcelas = (
        db.query(models.Transacao)
        .options(joinedload(models.Transacao.cartao))
        .filter(
            models.Transacao.usuario_id == usuario_id,
            models.Transacao.cartao_id.isnot(None),
            models.Transacao.data >= primeiro_dia,
            models.Transacao.data <= ultimo_dia,
        )
        .all()
    )
    for p in parcelas:
        label = f'{p.descricao} ({p.parcela_atual}/{p.total_parcelas})'
        itens.append(schemas.ItemProjecaoMensal(
            descricao=label,
            valor=p.valor_produto,
            tipo='despesa',
            origem='parcela_cartao',
            cartao_nome=p.cartao.nome if p.cartao else None,
        ))
        total_despesas += p.valor_produto

    return schemas.FluxoCaixaProjecao(
        mes_referencia=f'{ano:04d}-{mes:02d}',
        total_receitas_projetadas=round(total_receitas, 2),
        total_despesas_projetadas=round(total_despesas, 2),
        saldo_projetado=round(total_receitas - total_despesas, 2),
        itens=itens,
    )


def processar_recorrencias_do_mes(db: Session, usuario_id: int, ano: int, mes: int) -> int:
    """Gera transações a partir de recorrências ativas para o mês indicado, se ainda não geradas."""
    recorrencias = (
        db.query(models.TransacaoRecorrente)
        .filter(models.TransacaoRecorrente.usuario_id == usuario_id, models.TransacaoRecorrente.ativa == True)
        .all()
    )
    geradas = 0
    ultimo_dia = monthrange(ano, mes)[1]

    for rec in recorrencias:
        dia = min(rec.dia_vencimento, ultimo_dia)
        data_transacao = date(ano, mes, dia)

        ja_existe = (
            db.query(models.Transacao)
            .filter(
                models.Transacao.usuario_id == usuario_id,
                models.Transacao.descricao == rec.descricao,
                models.Transacao.data == data_transacao,
            )
            .first()
        )
        if not ja_existe:
            nova_t = models.Transacao(
                descricao=rec.descricao,
                valor_produto=round(rec.valor, 2),
                teve_entrega=False,
                valor_entrega=0.0,
                data=data_transacao,
                categoria_id=rec.categoria_id,
                tipo=rec.tipo,
                forma_pagamento='outro',
                usuario_id=usuario_id,
            )
            db.add(nova_t)
            geradas += 1

    if geradas > 0:
        db.commit()
    return geradas
