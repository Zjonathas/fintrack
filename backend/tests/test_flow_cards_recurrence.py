import pytest
from fastapi.testclient import TestClient


def get_authenticated_header(client: TestClient, email: str = "financas_user@example.com", nome: str = "Usuario Teste"):
    # Cria conta e loga
    client.post(
        "/api/auth/register",
        json={"nome": nome, "email": email, "senha": "Password123!"}
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "senha": "Password123!"}
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_cartao_credito_crud_and_fatura(client: TestClient):
    headers = get_authenticated_header(client, "cartao_test@example.com")

    # 1. Cadastrar cartão
    resp_create = client.post(
        "/api/cartoes",
        headers=headers,
        json={
            "nome": "Nubank Roxinho",
            "limite": 5000.0,
            "dia_fechamento": 10,
            "dia_vencimento": 17,
            "cor": "#820ad1"
        }
    )
    assert resp_create.status_code == 201
    cartao = resp_create.json()
    assert cartao["nome"] == "Nubank Roxinho"
    assert cartao["limite"] == 5000.0
    cartao_id = cartao["id"]

    # 2. Listar cartões
    resp_list = client.get("/api/cartoes", headers=headers)
    assert resp_list.status_code == 200
    cartoes = resp_list.json()
    assert any(c["id"] == cartao_id for c in cartoes)

    # 3. Atualizar cartão
    resp_update = client.put(
        f"/api/cartoes/{cartao_id}",
        headers=headers,
        json={"nome": "Nubank Ultravioleta", "limite": 15000.0}
    )
    assert resp_update.status_code == 200
    assert resp_update.json()["nome"] == "Nubank Ultravioleta"
    assert resp_update.json()["limite"] == 15000.0

    # 4. Consultar fatura vazia
    resp_fat = client.get(f"/api/cartoes/{cartao_id}/fatura?ano=2026&mes=4", headers=headers)
    assert resp_fat.status_code == 200
    fatura = resp_fat.json()
    assert fatura["total_fatura"] == 0.0
    assert fatura["qtd_parcelas_abertas"] == 0


def test_parcelamento_compra_cartao(client: TestClient):
    headers = get_authenticated_header(client, "parcela_test@example.com")

    # Cadastrar cartão (fecha dia 10, vence dia 17)
    cartao = client.post(
        "/api/cartoes",
        headers=headers,
        json={
            "nome": "Mastercard Black",
            "limite": 10000.0,
            "dia_fechamento": 10,
            "dia_vencimento": 17
        }
    ).json()
    cartao_id = cartao["id"]

    # Criar despesa parcelada em 3x de R$ 300 (total R$ 300 -> R$ 100/mês) no dia 2026-03-05 (antes do fechamento dia 10)
    resp_trans = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "descricao": "Monitor Gamer",
            "valor_produto": 300.0,
            "teve_entrega": False,
            "valor_entrega": 0.0,
            "data": "2026-03-05",
            "categoria_id": 1,
            "tipo": "despesa",
            "forma_pagamento": "credito",
            "cartao_id": cartao_id,
            "total_parcelas": 3
        }
    )
    assert resp_trans.status_code == 201
    trans_criada = resp_trans.json()
    assert trans_criada["total_parcelas"] == 3
    assert trans_criada["parcela_atual"] == 1
    # Valor da parcela: 300 / 3 = 100
    assert trans_criada["valor_total"] == 100.0
    compra_id = trans_criada["compra_parcelada_id"]
    assert compra_id is not None

    # Verificar que as 3 parcelas foram criadas no extrato
    extrato = client.get("/api/transacoes", headers=headers).json()
    parcelas = [t for t in extrato if t.get("compra_parcelada_id") == compra_id]
    assert len(parcelas) == 3

    parcela_1 = next(p for p in parcelas if p["parcela_atual"] == 1)
    parcela_2 = next(p for p in parcelas if p["parcela_atual"] == 2)
    parcela_3 = next(p for p in parcelas if p["parcela_atual"] == 3)

    assert parcela_1["data"] == "2026-03-17"
    assert parcela_2["data"] == "2026-04-17"
    assert parcela_3["data"] == "2026-05-17"


def test_receita_e_despesa_fluxo_caixa(client: TestClient):
    headers = get_authenticated_header(client, "fluxo_test@example.com")

    # 1. Cadastrar Receita (Salário: R$ 5.000)
    resp_rec = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "descricao": "Salário Mensal",
            "valor_produto": 5000.0,
            "teve_entrega": False,
            "valor_entrega": 0.0,
            "data": "2026-03-01",
            "categoria_id": 1,
            "tipo": "receita",
            "forma_pagamento": "pix"
        }
    )
    assert resp_rec.status_code == 201
    assert resp_rec.json()["tipo"] == "receita"
    assert resp_rec.json()["valor_total"] == 5000.0

    # 2. Cadastrar Despesa com Entrega (R$ 200 + R$ 20 frete = R$ 220)
    resp_desp = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "descricao": "Compras Mercado",
            "valor_produto": 200.0,
            "teve_entrega": True,
            "valor_entrega": 20.0,
            "data": "2026-03-02",
            "categoria_id": 1,
            "tipo": "despesa",
            "forma_pagamento": "debito"
        }
    )
    assert resp_desp.status_code == 201
    assert resp_desp.json()["tipo"] == "despesa"
    assert resp_desp.json()["valor_total"] == 220.0

    # 3. Validar Resumo Analítico (Receitas, Despesas, Saldo Líquido)
    resumo = client.get("/api/dashboard/resumo", headers=headers).json()
    assert resumo["total_receitas"] == 5000.0
    assert resumo["total_despesas"] == 220.0
    assert resumo["saldo_liquido"] == 4780.0

    # 4. Validar Projeção de Fluxo de Caixa
    proj = client.get("/api/dashboard/fluxo-caixa", headers=headers).json()
    assert proj["total_receitas_projetadas"] >= 0.0
    assert proj["total_despesas_projetadas"] >= 0.0


def test_recorrencias_lifecycle(client: TestClient):
    headers = get_authenticated_header(client, "recorrencia_test@example.com")

    # 1. Cadastrar recorrência de despesa (Internet R$ 120/mês, dia 15)
    resp_rec = client.post(
        "/api/recorrencias",
        headers=headers,
        json={
            "descricao": "Internet Fibra",
            "valor": 120.0,
            "tipo": "despesa",
            "dia_vencimento": 15,
            "forma_pagamento": "pix",
            "categoria_id": 1
        }
    )
    assert resp_rec.status_code == 201
    recorrencia = resp_rec.json()
    assert recorrencia["descricao"] == "Internet Fibra"
    assert recorrencia["ativa"] is True
    rec_id = recorrencia["id"]

    # 2. Alternar status ativo/inativo
    resp_toggle = client.patch(f"/api/recorrencias/{rec_id}/toggle", headers=headers)
    assert resp_toggle.status_code == 200
    assert resp_toggle.json()["ativa"] is False

    resp_toggle2 = client.patch(f"/api/recorrencias/{rec_id}/toggle", headers=headers)
    assert resp_toggle2.status_code == 200
    assert resp_toggle2.json()["ativa"] is True

    # 3. Processamento manual de recorrências
    resp_proc = client.post(
        f"/api/recorrencias/processar?ano=2026&mes=4",
        headers=headers
    )
    assert resp_proc.status_code == 200
    assert resp_proc.json()["geradas"] >= 1

    # Verificar que gerou transação no extrato
    extrato = client.get("/api/transacoes?busca=Internet Fibra", headers=headers).json()
    assert len(extrato) >= 1
    assert extrato[0]["data"] == "2026-04-15"
    assert extrato[0]["valor_total"] == 120.0


def test_cartao_fechamento_dia_29_vencimento_05(client: TestClient):
    """Testa cadastro de cartão com fechamento 29 e vencimento 05 (ex: Mercado Pago)."""
    headers = get_authenticated_header(client, "mercadopago_test@example.com")

    resp = client.post(
        "/api/cartoes",
        headers=headers,
        json={
            "nome": "Mercado Pago",
            "bandeira": "Visa",
            "limite": 5000.0,
            "dia_fechamento": 29,
            "dia_vencimento": 5,
            "cor": "#3b82f6"
        }
    )
    assert resp.status_code == 201
    cartao = resp.json()
    assert cartao["nome"] == "Mercado Pago"
    assert cartao["dia_fechamento"] == 29
    assert cartao["dia_vencimento"] == 5

    # Compra parcelada antes do fechamento (dia 15 de março) -> fatura fecha 29 de março, vence 5 de abril
    resp_t = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "descricao": "Supermercado MP",
            "valor_produto": 200.0,
            "teve_entrega": False,
            "valor_entrega": 0.0,
            "data": "2026-03-15",
            "categoria_id": 1,
            "forma_pagamento": "credito",
            "cartao_id": cartao["id"],
            "total_parcelas": 2
        }
    )
    assert resp_t.status_code == 201
    transacoes = client.get(f"/api/transacoes?cartao_id={cartao['id']}", headers=headers).json()
    assert len(transacoes) == 2
    datas = sorted([t["data"] for t in transacoes])
    assert datas[0] == "2026-04-05"
    assert datas[1] == "2026-05-05"


def test_receita_apenas_valor_descricao_e_data(client: TestClient):
    """Testa que receita pode ser criada sem categoria (apenas valor, descricao e data)."""
    headers = get_authenticated_header(client, "receita_user@example.com")

    # 1. Receita sem categoria_id deve ser aceita com sucesso (201)
    resp = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "tipo": "receita",
            "descricao": "Salário Mensal",
            "valor_produto": 5500.0,
            "data": "2026-03-05"
        }
    )
    assert resp.status_code == 201
    transacao = resp.json()
    assert transacao["tipo"] == "receita"
    assert transacao["descricao"] == "Salário Mensal"
    assert transacao["valor_produto"] == 5500.0
    assert transacao["categoria_id"] is None
    assert transacao["categoria"] is None

    # 2. Despesa sem categoria_id DEVE falhar com 422
    resp_despesa = client.post(
        "/api/transacoes",
        headers=headers,
        json={
            "tipo": "despesa",
            "descricao": "Almoço Sem Categoria",
            "valor_produto": 50.0,
            "data": "2026-03-05"
        }
    )
    assert resp_despesa.status_code == 422

    # 3. Recorrência de receita sem categoria deve ser aceita
    resp_rec = client.post(
        "/api/recorrencias",
        headers=headers,
        json={
            "tipo": "receita",
            "descricao": "Renda Passiva Dividendos",
            "valor": 350.0,
            "dia_vencimento": 10
        }
    )
    assert resp_rec.status_code == 201
    rec = resp_rec.json()
    assert rec["tipo"] == "receita"
    assert rec["categoria_id"] is None


