import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Garante que o diretório 'backend' esteja no sys.path mesmo se o comando for executado da raiz do projeto
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Configura banco de dados de teste em memória compartilhado via StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

from app.database import Base, get_db

from app.main import app
from app import crud, models

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    crud.seed_categorias_iniciais(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_auth_registration_and_login(client):
    # 1. Registrar usuário Alice
    resp_reg = client.post(
        "/api/auth/register",
        json={"nome": "Alice Silva", "email": "alice@exemplo.com", "senha": "SenhaSegura@123"}
    )
    assert resp_reg.status_code == 201
    dados_alice = resp_reg.json()
    assert dados_alice["email"] == "alice@exemplo.com"
    assert dados_alice["nome"] == "Alice Silva"
    assert "senha" not in dados_alice
    assert "senha_hash" not in dados_alice
    assert "id" in dados_alice

    # 2. Tentativa de cadastro duplicado com mesmo e-mail
    resp_dup = client.post(
        "/api/auth/register",
        json={"nome": "Alice Clone", "email": "alice@exemplo.com", "senha": "OutraSenha@123"}
    )
    assert resp_dup.status_code == 400
    assert "Já existe uma conta" in resp_dup.json()["detail"]

    # 3. Tentativa de login com senha incorreta
    resp_err = client.post(
        "/api/auth/login",
        json={"email": "alice@exemplo.com", "senha": "SenhaErrada@123"}
    )
    assert resp_err.status_code == 401
    assert "E-mail ou senha incorretos" in resp_err.json()["detail"]

    # 4. Login com senha correta
    resp_login = client.post(
        "/api/auth/login",
        json={"email": "alice@exemplo.com", "senha": "SenhaSegura@123"}
    )
    assert resp_login.status_code == 200
    token_data = resp_login.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["usuario"]["email"] == "alice@exemplo.com"

    # 5. Consultar perfil /me com token
    token = token_data["access_token"]
    resp_me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_me.status_code == 200
    assert resp_me.json()["email"] == "alice@exemplo.com"


def test_unauthenticated_requests_are_blocked(client):
    # Tentativa de listar transações sem token
    resp = client.get("/api/transacoes")
    assert resp.status_code == 401

    # Tentativa de obter métricas do dashboard sem token
    resp_dash = client.get("/api/dashboard/resumo")
    assert resp_dash.status_code == 401


def test_multi_tenant_data_isolation(client):
    # Cria Usuário 1 (Carlos)
    client.post(
        "/api/auth/register",
        json={"nome": "Carlos Mendes", "email": "carlos@exemplo.com", "senha": "SenhaCarlos@123"}
    )
    login_carlos = client.post(
        "/api/auth/login",
        json={"email": "carlos@exemplo.com", "senha": "SenhaCarlos@123"}
    ).json()
    token_carlos = login_carlos["access_token"]
    headers_carlos = {"Authorization": f"Bearer {token_carlos}"}

    # Cria Usuário 2 (Beatriz)
    client.post(
        "/api/auth/register",
        json={"nome": "Beatriz Rocha", "email": "beatriz@exemplo.com", "senha": "SenhaBeatriz@123"}
    )
    login_beatriz = client.post(
        "/api/auth/login",
        json={"email": "beatriz@exemplo.com", "senha": "SenhaBeatriz@123"}
    ).json()
    token_beatriz = login_beatriz["access_token"]
    headers_beatriz = {"Authorization": f"Bearer {token_beatriz}"}

    # Carlos registra uma transação com taxa de entrega
    t_carlos = client.post(
        "/api/transacoes",
        headers=headers_carlos,
        json={
            "descricao": "Jantar no Restaurante",
            "valor_produto": 80.0,
            "teve_entrega": True,
            "valor_entrega": 12.0,
            "categoria_id": 1
        }
    )
    assert t_carlos.status_code == 201
    id_transacao_carlos = t_carlos.json()["id"]

    # Beatriz registra uma transação sem taxa de entrega
    t_beatriz = client.post(
        "/api/transacoes",
        headers=headers_beatriz,
        json={
            "descricao": "Curso Online",
            "valor_produto": 150.0,
            "teve_entrega": False,
            "categoria_id": 1
        }
    )
    assert t_beatriz.status_code == 201
    id_transacao_beatriz = t_beatriz.json()["id"]

    # ISOLAMENTO NA LISTAGEM: Carlos só deve ver a transação dele
    lista_carlos = client.get("/api/transacoes", headers=headers_carlos).json()
    assert len(lista_carlos) == 1
    assert lista_carlos[0]["id"] == id_transacao_carlos
    assert lista_carlos[0]["descricao"] == "Jantar no Restaurante"

    # ISOLAMENTO NA LISTAGEM: Beatriz só deve ver a transação dela
    lista_beatriz = client.get("/api/transacoes", headers=headers_beatriz).json()
    assert len(lista_beatriz) == 1
    assert lista_beatriz[0]["id"] == id_transacao_beatriz
    assert lista_beatriz[0]["descricao"] == "Curso Online"

    # ISOLAMENTO NO DASHBOARD: Carlos vê total 92.0 (80 + 12 de entrega)
    dash_carlos = client.get("/api/dashboard/resumo", headers=headers_carlos).json()
    assert dash_carlos["total_geral"] == 92.0
    assert dash_carlos["total_produtos"] == 80.0
    assert dash_carlos["total_entregas"] == 12.0
    assert dash_carlos["qtd_transacoes"] == 1

    # ISOLAMENTO NO DASHBOARD: Beatriz vê total 150.0 (0 de entrega)
    dash_beatriz = client.get("/api/dashboard/resumo", headers=headers_beatriz).json()
    assert dash_beatriz["total_geral"] == 150.0
    assert dash_beatriz["total_produtos"] == 150.0
    assert dash_beatriz["total_entregas"] == 0.0
    assert dash_beatriz["qtd_transacoes"] == 1

    # ISOLAMENTO DE EXCLUSÃO: Beatriz NÃO PODE excluir transação de Carlos
    del_tentativa = client.delete(f"/api/transacoes/{id_transacao_carlos}", headers=headers_beatriz)
    assert del_tentativa.status_code == 404

    # Carlos consegue excluir a própria transação
    del_ok = client.delete(f"/api/transacoes/{id_transacao_carlos}", headers=headers_carlos)
    assert del_ok.status_code == 204

    # Verifica se a lista de Carlos agora está vazia
    lista_carlos_vazia = client.get("/api/transacoes", headers=headers_carlos).json()
    assert len(lista_carlos_vazia) == 0

    # Mas a transação de Beatriz permanece intacta
    lista_beatriz_ainda_existe = client.get("/api/transacoes", headers=headers_beatriz).json()
    assert len(lista_beatriz_ainda_existe) == 1


def test_transaction_update_and_bulk_delete(client):
    # Cria usuário Diana
    client.post(
        "/api/auth/register",
        json={"nome": "Diana Prince", "email": "diana@exemplo.com", "senha": "SenhaDiana@123"}
    )
    login_diana = client.post(
        "/api/auth/login",
        json={"email": "diana@exemplo.com", "senha": "SenhaDiana@123"}
    ).json()
    token_diana = login_diana["access_token"]
    headers_diana = {"Authorization": f"Bearer {token_diana}"}

    # Cadastra duas transações para Diana
    t1 = client.post(
        "/api/transacoes",
        headers=headers_diana,
        json={
            "descricao": "Item 1",
            "valor_produto": 50.0,
            "teve_entrega": True,
            "valor_entrega": 10.0,
            "categoria_id": 1
        }
    ).json()

    t2 = client.post(
        "/api/transacoes",
        headers=headers_diana,
        json={
            "descricao": "Item 2",
            "valor_produto": 75.0,
            "teve_entrega": False,
            "categoria_id": 1
        }
    ).json()

    # Atualiza Item 1
    t1_up = client.put(
        f"/api/transacoes/{t1['id']}",
        headers=headers_diana,
        json={
            "descricao": "Item 1 Atualizado",
            "valor_produto": 60.0,
            "teve_entrega": False,
            "valor_entrega": 0.0,
            "categoria_id": 1
        }
    )
    assert t1_up.status_code == 200
    assert t1_up.json()["descricao"] == "Item 1 Atualizado"
    assert t1_up.json()["valor_produto"] == 60.0

    # Exclusão em lote (bulk delete)
    bulk_resp = client.post(
        "/api/transacoes/bulk-delete",
        headers=headers_diana,
        json={"ids": [t1["id"], t2["id"]]}
    )
    assert bulk_resp.status_code == 200
    assert bulk_resp.json()["excluidos"] == 2

    # Verifica se a lista está vazia
    lista = client.get("/api/transacoes", headers=headers_diana).json()
    assert len(lista) == 0


def test_invalid_token_rejected(client):
    resp = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer token.totalmente.invalido"}
    )
    assert resp.status_code == 401


def test_password_strength_requirements(client):
    # 1. Menos de 8 caracteres
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Curto", "email": "curto@exemplo.com", "senha": "Curta1!"}
    )
    assert resp.status_code == 422
    assert "8 caracteres" in resp.text

    # 2. Sem letra maiúscula
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Sem Maiuscula", "email": "minuscula@exemplo.com", "senha": "senhaminuscula@1"}
    )
    assert resp.status_code == 422
    assert "maiúscula" in resp.text

    # 3. Sem letra minúscula
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Sem Minuscula", "email": "maiuscula@exemplo.com", "senha": "SENHAMAIUSCULA@1"}
    )
    assert resp.status_code == 422
    assert "minúscula" in resp.text

    # 4. Sem número
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Sem Numero", "email": "numero@exemplo.com", "senha": "SenhaSemNumero@!"}
    )
    assert resp.status_code == 422
    assert "número" in resp.text

    # 5. Sem caractere especial
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Sem Especial", "email": "especial@exemplo.com", "senha": "SenhaSemEspecial123"}
    )
    assert resp.status_code == 422
    assert "especial" in resp.text

    # 6. Com espaços em branco
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Com Espaco", "email": "espaco@exemplo.com", "senha": "Senha Com Espaco@123"}
    )
    assert resp.status_code == 422
    assert "espaços" in resp.text

    # 7. Senha válida completa
    resp = client.post(
        "/api/auth/register",
        json={"nome": "Usuario Valido", "email": "valido@exemplo.com", "senha": "SenhaValida@123"}
    )
    assert resp.status_code == 201


