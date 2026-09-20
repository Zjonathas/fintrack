# 💰 FinançasApp &bull; Gestão Financeira Pessoal & WebApp (PWA)

> Aplicativo web moderno e responsivo para controle de finanças pessoais: registre despesas e receitas, gerencie múltiplos cartões de crédito e assinaturas fixas, isole custos de entrega/frete e acompanhe para onde vai seu dinheiro através de gráficos e KPIs inteligentes. Instalável como **Progressive Web App (PWA)** no celular e computador.

---

## 🎯 Proposta & Diferenciais

O **FinançasApp** foi concebido para transformar a organização financeira em um hábito simples, rápido e com experiência visual de alto nível:

- 📱 **Experiência Nativa no Smartphone**: Projetado com foco em UX mobile (*mobile-first*), trazendo barra inferior tátil (*thumb zone*), botão FAB de acesso rápido, modais *bottom sheet* e suporte a instalação como WebApp (PWA).
- 💳 **Controle Inteligente de Cartões**: Acompanhe o limite utilizado vs. disponível em tempo real, datas de fechamento/vencimento de fatura e parcelamento automático de compras.
- 🔁 **Previsibilidade com Contas Recorrentes**: Monitore salários, assinaturas e despesas fixas para saber exatamente quanto sobra no final do mês.
- 📦 **Detalhamento Isolado de Frete**: Identifique o peso que taxas de entrega e delivery têm sobre o valor real dos produtos adquiridos.
- 📊 **Dashboards Analíticos com Navegador Temporal**: Alterne entre meses instantaneamente com setas (`< Mês Ano >`) ou use filtros dinâmicos de 30 dias, ano vigente ou período personalizado.

---

## ✨ Funcionalidades Principais

### 📱 Progressive Web App (PWA) & Mobile UX
- **Instalável no Smartphone e Desktop**: Opera em modo *standalone* (tela cheia, sem barras de navegador), com ícone próprio na tela de início.
- **Service Worker & Cache Resiliente**: Carregamento instantâneo do shell da aplicação com cache inteligente e garantia de dados de API sempre frescos (*network-first*).
- **Botão "Instalar App" Integrado**: Identifica automaticamente se o aplicativo pode ser instalado no Android/Desktop e disponibiliza guia passo a passo ilustrado para usuários de iPhone/iPad no Safari.
- **Barra de Navegação Inferior (*Bottom Navigation Bar*)**: Fixa no rodapé em dispositivos móveis, com botão central FAB flutuante (+) para cadastrar transações com uma só mão.
- **Dual Mode no Extrato**: Exibição inteligente em cartões financeiros detalhados em telas menores e em tabela estruturada em computadores e tablets.
- **Modais no Estilo *Bottom Sheet***: Ancorados na base da tela do celular com *grab handles* e alvos de toque aumentados (mínimo de 44px).

### 💳 Cartões de Crédito & Parcelamento
- Cadastro de múltiplos cartões com bandeira, limite total e dias de fechamento/vencimento.
- Cálculo dinâmico do limite disponível e total comprometido na fatura atual.
- Parcelamento de compras com cálculo automático do valor por parcela e marcação clara (`1/3x`, `2/3x`, etc.).

### 🔁 Contas Recorrentes & Fixas
- Gerenciamento de despesas e receitas que se repetem periodicamente (aluguel, streaming, internet, salários).
- Acesso rápido aos totais mensais fixos com atalho direto na barra de navegação móvel.

### 📊 Dashboards & Métricas Financeiras
- **Navegador Mensal com Setas (`< Mês Ano >`)**: Avanço e retrocesso de meses em 1 toque, com retorno rápido ao mês corrente e atalhos rápidos (*Este Mês*, *30 Dias*, *Este Ano*, *Tudo*, *Personalizado*).
- **Cards de KPIs Analíticos**: Tipografia fluida que exibe Gastos Totais, Receitas, Saldo Líquido e Percentual de Frete sem quebra de valores em telas compactas.
- **Gráficos Interativos (Recharts)**:
  - *Distribuição por Categoria*: Gráfico Donut detalhando os maiores centros de custo.
  - *Evolução Histórica*: Curva diária de fluxo financeiro.
  - *Produto vs. Frete*: Comparativo visual entre despesas reais e custos de entrega.

### 🔐 Segurança, Autenticação & Multi-tenant
- Cadastro e login seguros com validação de e-mail e hash de senhas via `bcrypt`.
- Autenticação stateless via **JSON Web Tokens (JWT)** no padrão Bearer Token.
- **Isolamento Completo (Multi-tenant)**: Consultas e manipulações de banco de dados são estritamente filtradas pelo ID do usuário autenticado (`usuario_id = current_user.id`).
- **Proteção contra Força Bruta**: Rate limiting integrado para mitigar tentativas excessivas de requisições.

### 🎨 Design System & Acessibilidade
- **Modo Escuro e Claro (Dark/Light Mode)**: Alternância suave com detecção de preferência do sistema operacional e persistência local.
- **Componentes Customizados**:
  - `DatePicker` em popover via React Portal (nunca cortado por rolagens de modais).
  - `Select` estilizado com suporte a teclado (`Esc`), chevron animado e glassmorphism.
  - `NumberInput` com botões de incremento modernos livres de distorções WebKit.
- **Ações em Massa**: Seleção múltipla de transações e exclusão em lote atômica com confirmação.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Backend** | Python 3.12+ / 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Bcrypt, Uvicorn |
| **Banco de Dados** | SQLite com integridade referencial ativa (`PRAGMA foreign_keys = ON`) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **PWA & Mobile** | Web App Manifest (W3C), Service Worker, Ícones Adaptativos (Maskable + SVG) |
| **Visualização & UI** | Phosphor Icons, Recharts, React Portal, Axios |
| **Testes** | Pytest, HTTPX, FastAPI TestClient |
| **DevOps & Containers** | Docker, Docker Compose, Cloudflare Tunnel (`cloudflared`) |

---

## 📁 Estrutura do Repositório

```text
Financas/
├── backend/
│   ├── app/
│   │   ├── auth.py                     # Hashing (bcrypt), tokens JWT e dependência get_current_user
│   │   ├── database.py                 # Conexão SQLite e get_db com foreign keys ativas
│   │   ├── models.py                   # Modelos SQLAlchemy (Usuario, Categoria, Transacao, Cartao, Recorrencia)
│   │   ├── schemas.py                  # Validação Pydantic v2 para requisições e respostas
│   │   ├── crud.py                     # Camada de acesso a dados isolada por usuário
│   │   └── main.py                     # Endpoints REST, rotas e middlewares CORS/Rate-Limit
│   ├── tests/
│   │   ├── test_auth_flow.py           # Testes do fluxo de autenticação e isolamento multi-tenant
│   │   ├── test_flow_cards_recurrence.py# Testes de cartões e contas recorrentes
│   │   └── test_rate_limit.py          # Testes de proteção e rate limiting
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/                         # Assets públicos e do PWA
│   │   ├── manifest.webmanifest        # Manifesto Web App (PWA)
│   │   ├── sw.js                       # Service Worker com cache do shell estático
│   │   ├── icon.svg                    # Ícone vetorial da aplicação
│   │   ├── icon-192.png / icon-512.png # Ícones para Android e Desktop
│   │   ├── icon-maskable-*.png         # Ícones adaptativos com área segura
│   │   └── apple-touch-icon.png        # Ícone para tela inicial do iOS
│   ├── src/
│   │   ├── components/                 # Componentes modulares
│   │   │   ├── DashboardResumo.tsx     # KPIs, navegador mensal e gráficos Recharts
│   │   │   ├── ListaTransacoes.tsx     # Extrato responsivo (Cards no mobile, Tabela no desktop)
│   │   │   ├── FiltrosTransacoes.tsx   # Painel de busca expansível
│   │   │   ├── ModuloCartoes.tsx       # Gestão de cartões e faturas
│   │   │   ├── ModuloRecorrencias.tsx  # Gestão de despesas/receitas fixas
│   │   │   ├── ModalNovaTransacao.tsx  # Cadastro rápido de transação
│   │   │   ├── ModalEditarTransacao.tsx# Edição de transação existente
│   │   │   ├── ModalInstalarApp.tsx    # Modal explicativo e guia de instalação iOS
│   │   │   ├── ModalCartao.tsx         # Cadastro de cartões de crédito
│   │   │   ├── ModalCategoria.tsx      # Criação dinâmica de categorias
│   │   │   ├── ModalAuth.tsx           # Janela de Login e Cadastro
│   │   │   ├── DatePicker.tsx          # Calendário popover renderizado via Portal
│   │   │   ├── Select.tsx              # Select estilizado com glassmorphism
│   │   │   ├── NumberInput.tsx         # Campo numérico monetário customizado
│   │   │   ├── Checkbox.tsx            # Checkbox animado com estado indeterminado
│   │   │   └── ErrorBoundary.tsx       # Captura de erros de renderização
│   │   ├── hooks/                      # Custom hooks (useAuth, useTheme, usePWAInstall)
│   │   ├── contexts/                   # Contexto global de autenticação
│   │   ├── services/                   # Cliente HTTP Axios centralizado (api.ts)
│   │   ├── types/                      # Contratos TypeScript compartilhados
│   │   ├── App.tsx                     # Orquestrador principal com barra móvel e rotas
│   │   └── index.css                   # Tokens de design e Tailwind CSS
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   └── generate_pwa_icons.py           # Gerador automático de ícones PNG do PWA em Python puro
├── docker-compose.yml
├── pytest.ini
└── README.md
```

---

## 🚀 Como Executar

### Opção 1: Via Docker Compose (Mais Prático)

Requer [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados:

```bash
# Subir aplicação completa (frontend + backend)
docker compose up --build
```

Acesse no navegador:
- **Frontend / WebApp**: [http://localhost:5173](http://localhost:5173)
- **API Backend**: [http://localhost:8000](http://localhost:8000)
- **Documentação Swagger (OpenAPI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Túnel HTTPS Seguro (Para Instalação PWA no Celular sem Barras)**:
  O Docker Compose já inclui um túnel Cloudflare seguro que gera automaticamente uma URL com HTTPS válido para instalação de PWA no celular:
  ```bash
  docker compose logs tunnel
  ```
  *(Exemplo de saída: `https://xxxx.trycloudflare.com` — acesse pelo smartphone para instalar o PWA em tela cheia com certificado SSL ativo)*.

Para parar os serviços:
```bash
docker compose down
```

---

### Opção 2: Execução Local Nativa

#### 1. Backend

```bash
cd backend
python -m venv venv

# Ativar ambiente virtual
# No Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# No Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## 🧪 Testes Automatizados

O backend possui cobertura de testes de integração automatizados que validam segurança, autenticação, controle de limites de cartões, cálculo de parcelas e regras de rate limiting:

```bash
# Executar a suíte completa de testes (16 testes):
python -m pytest

# Ou especificando o ambiente virtual:
backend\venv\Scripts\python.exe -m pytest -v
```

---

## 📖 Principais Endpoints da API

A documentação interativa e testável em tempo real está disponível em `/docs`.

| Módulo | Método | Rota | Descrição |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Cadastro de usuário com senha criptografada |
| **Auth** | `POST` | `/api/auth/login` | Login com geração de Bearer Token JWT |
| **Auth** | `GET` | `/api/auth/me` | Dados do perfil do usuário conectado |
| **Transações** | `GET` | `/api/transacoes` | Lista transações do usuário (filtros: período, busca, cartão, frete) |
| **Transações** | `POST` | `/api/transacoes` | Cadastra transação (com frete e parcelamento opcional) |
| **Transações** | `PUT` | `/api/transacoes/{id}` | Atualiza transação existente |
| **Transações** | `DELETE` | `/api/transacoes/{id}` | Exclui transação individual |
| **Transações** | `POST` | `/api/transacoes/bulk-delete` | Exclusão atômica em massa por IDs |
| **Cartões** | `GET` | `/api/cartoes` | Lista cartões de crédito e faturas do usuário |
| **Cartões** | `POST` | `/api/cartoes` | Cadastra novo cartão de crédito |
| **Recorrências** | `GET` | `/api/recorrencias` | Lista contas recorrentes ativas |
| **Recorrências** | `POST` | `/api/recorrencias` | Cadastra despesa ou receita recorrente |
| **Dashboard** | `GET` | `/api/dashboard/resumo` | KPIs agregados, fretes e distribuição por período |
| **Categorias** | `GET` | `/api/categorias` | Lista categorias cadastradas |
| **Categorias** | `POST` | `/api/categorias` | Criação de nova categoria |

---

## 📲 Como Instalar como WebApp (PWA)

1. **No Google Chrome / Microsoft Edge (Desktop ou Android)**:
   - Clique no botão **"Instalar App"** localizado no cabeçalho superior ou no ícone de instalação na barra de endereço do navegador.
2. **No Safari (iPhone / iPad)**:
   - Toque no botão de **Compartilhar** (<kbd>⎋</kbd>) na barra inferior do Safari.
   - Selecione a opção **"Adicionar à Tela de Início"** (<kbd>➕</kbd>).
   - Confirme em **"Adicionar"**.

---

## 📄 Licença

Distribuído sob licença MIT. Consulte `LICENSE` para mais informações.
