from app.main import app


def test_rate_limit_on_login(client):
    """Verifica se o rate limit bloqueia tentativas excessivas de login com HTTP 429."""
    app.state.limiter.reset()

    # O limite configurado para auth é 5/minute
    respostas = []
    for i in range(6):
        resp = client.post(
            "/api/auth/login",
            json={"email": f"bruteforce_{i}@exemplo.com", "senha": "TentativaInvalida1!"}
        )
        respostas.append(resp)

    # As primeiras 5 requisições devem ser processadas normalmente (retornando 401 porque as credenciais não existem)
    for i in range(5):
        assert respostas[i].status_code == 401, f"Requisição {i+1} deveria ser 401, mas foi {respostas[i].status_code}"

    # A 6ª requisição deve ser bloqueada pelo SlowAPI com HTTP 429
    resp_bloqueada = respostas[5]
    assert resp_bloqueada.status_code == 429
    dados = resp_bloqueada.json()
    assert "detail" in dados
    assert "Muitas requisições em pouco tempo" in dados["detail"]


def test_rate_limit_on_register(client):
    """Verifica se o rate limit bloqueia tentativas excessivas de cadastro com HTTP 429."""
    app.state.limiter.reset()

    # O limite configurado para auth é 5/minute
    respostas = []
    for i in range(6):
        resp = client.post(
            "/api/auth/register",
            json={"nome": f"Spam {i}", "email": f"spam_{i}@exemplo.com", "senha": "SenhaValida@123"}
        )
        respostas.append(resp)

    # Primeiras 5 são aceitas (201 Created)
    for i in range(5):
        assert respostas[i].status_code == 201, f"Requisição {i+1} deveria ser 201, mas foi {respostas[i].status_code}"

    # 6ª requisição é bloqueada com 429
    assert respostas[5].status_code == 429
    assert "Muitas requisições em pouco tempo" in respostas[5].json()["detail"]


def test_rate_limit_reset(client):
    """Verifica se o reset do limiter restaura o acesso imediatamente."""
    app.state.limiter.reset()

    # Esgota o limite de login
    for _ in range(5):
        client.post(
            "/api/auth/login",
            json={"email": "teste@exemplo.com", "senha": "SenhaErrada1!"}
        )

    # 6ª requisição é bloqueada
    bloqueada = client.post(
        "/api/auth/login",
        json={"email": "teste@exemplo.com", "senha": "SenhaErrada1!"}
    )
    assert bloqueada.status_code == 429

    # Reseta o limiter
    app.state.limiter.reset()

    # Nova requisição volta a ser aceita normalmente
    apos_reset = client.post(
        "/api/auth/login",
        json={"email": "teste@exemplo.com", "senha": "SenhaErrada1!"}
    )
    assert apos_reset.status_code == 401  # Credenciais erradas, mas não bloqueado por rate limit
