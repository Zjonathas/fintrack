# FinançasApp &bull; Gestão Financeira Pessoal

> Aplicativo web moderno para controle de finanças pessoais: registre suas despesas, acompanhe para onde vai seu dinheiro, identifique onde você mais gasta e encontre oportunidades reais para economizar.

---

## 🎯 Proposta & Objetivo

Ter clareza sobre para onde vai o seu dinheiro é o primeiro passo para economizar e conquistar estabilidade financeira. O **FinançasApp** foi desenvolvido para transformar o registro de despesas em uma experiência simples, intuitiva e analítica:

- 📊 **Onde você mais gasta**: Gráficos e indicadores que destacam as categorias de maior impacto no seu orçamento mensal.
- 💡 **Oportunidades de economia**: Visão clara de custos fixos e variáveis para planejar onde é possível reduzir despesas.
- 📦 **Detalhamento opcional de fretes**: Possibilidade de separar despesas de frete/delivery do custo do produto quando aplicável.

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação JWT & Isolamento Multi-usuário (Multi-tenant)**:
  - Cadastro de novos usuários com validação estrita de e-mail e hashing seguro de senhas com `bcrypt`.
  - Sessões stateless via tokens **JSON Web Token (JWT)** no padrão Bearer Token.
  - **Isolamento Completo de Dados**: Cada usuário visualiza, cria, edita e exclui unicamente as suas transações e dados estatísticos no dashboard.
- 💡 **Análise de Gastos & Economia**: Acompanhe o total gasto por categoria e no mês, identificando excessos e oportunidades de economia.
- 📦 **Segregação Opcional de Frete**: Formulário reativo que permite separar o valor do produto da taxa de entrega para maior precisão financeira.
- 📊 **Dashboards Interativos com Recharts**:
  - **Distribuição por Categoria**: Gráfico Donut destacando as áreas de maior gasto com percentuais e valores absolutos.
  - **Produto vs. Frete**: Gráfico de barras empilhadas para comparar gastos reais vs. taxas logísticas.
  - **Evolução Histórica**: Gráfico de área temporal exibindo a curva de despesas diárias.

- 📝 **Modais de Ação e Layout em Largura Total**:
  - **Modal de Nova Transação**: Janela modal elegante para cadastro rápido, liberando a tabela de extrato para ocupar a largura total da tela.
  - **Modal de Edição Completa**: Permite atualizar qualquer detalhe de transações existentes (descrição, valor, frete, categoria e data) com sincronização em tempo real dos totais.
- 🗑️ **Exclusão em Lote e Ações em Massa**:
  - Seleção de múltiplos registros com checkbox mestre ("Selecionar Todos").
  - Barra flutuante de ações em lote contextual exibindo a contagem e botão para exclusão atômica de múltiplos registros.
- 🎨 **Design System Customizado (UI Moderna & Acessível)**:
  - **`DatePicker`**: Calendário interativo renderizado via **React Portal**, com navegação rápida de meses e anos (`<<`, `>>`), atalhos "Hoje" e "Ontem", e formatação brasileira (`DD/MM/AAAA`). Flutua livremente sem ser cortado por rodapés ou rolagens de modais.
  - **`Select`**: Dropdown moderno com *glassmorphism*, chevron animado, fechamento com `Esc` ou clique fora e marcadores de seleção.
  - **`NumberInput`**: Campo de valor monetário com botões integrados ao tema (`CaretUp` e `CaretDown`), eliminando as setas e blocos brancos desconfigurados de navegadores WebKit.
  - **`Checkbox`**: Caixa de seleção animada com transição fluida, suporte a estado indeterminado e alta fidelidade visual.
- 🏷️ **Gestão Dinâmica de Categorias**: Criação dinâmica de novas categorias diretamente pelos formulários, com validação de unicidade.
- 🌓 **Tema Claro & Escuro (Light/Dark Mode)**: Suporte completo a temas com detecção de preferência do sistema operacional e persistência em `localStorage`.
- 🔍 **Filtros e Busca em Tempo Real**: Filtros combinados por busca textual, categoria, presença de taxa de frete e data mínima.
- 🛡️ **Resiliência & Validações**: Tratamento de erros com `ErrorBoundary` no frontend e schemas Pydantic v2 rigorosos no backend.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Backend** | Python 3.12+ / 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Bcrypt, Uvicorn |
| **Banco de Dados** | SQLite com integridade referencial ativa (`PRAGMA foreign_keys = ON`) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Componentes & UI** | Phosphor Icons, Recharts, React Portal, Axios |
| **Testes** | Pytest, HTTPX, FastAPI TestClient |
| **DevOps & Containers** | Docker, Docker Compose |

---

## 📁 Estrutura do Projeto

```text
Financas/
├── backend/
│   ├── app/
│   │   ├── auth.py                     # Criptografia (bcrypt), criação/validação JWT e get_current_user
│   │   ├── database.py                 # Conexão SQLite e injeção de dependência get_db
│   │   ├── models.py                   # Modelos SQLAlchemy (Usuario, Categoria, Transacao)
│   │   ├── schemas.py                  # Schemas e validações Pydantic v2 (Auth, Transações, Categorias)
│   │   ├── crud.py                     # Operações de BD, isolamento multi-tenant e migração automática
│   │   └── main.py                     # Rotas REST, autenticação, injeção de segurança e CORS
│   ├── tests/
│   │   └── test_auth_flow.py           # Testes de integração (registro, login, tokens e isolamento)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                 # Componentes modulares
│   │   │   ├── Checkbox.tsx            # Checkbox customizado com animação e indeterminado
│   │   │   ├── Select.tsx              # Dropdown estilizado com glassmorphism
│   │   │   ├── NumberInput.tsx         # Input numérico com setas modernas customizadas
│   │   │   ├── DatePicker.tsx          # Calendário popover renderizado via Portal
│   │   │   ├── ModalNovaTransacao.tsx  # Modal de criação de transação
│   │   │   ├── ModalEditarTransacao.tsx# Modal de edição de transação existente
│   │   │   ├── DashboardResumo.tsx     # Cards de KPIs e gráficos Recharts
│   │   │   ├── ListaTransacoes.tsx     # Extrato tabular com seleção múltipla
│   │   │   ├── FiltrosTransacoes.tsx   # Painel de busca e filtros combinados
│   │   │   └── ErrorBoundary.tsx       # Captura resiliente de falhas de renderização
│   │   ├── hooks/                      # Custom hooks (useTheme)
│   │   ├── services/                   # Cliente Axios tipado (api.ts)
│   │   ├── types/                      # Interfaces TypeScript compartilhadas
│   │   ├── App.tsx                     # Orquestrador da aplicação
│   │   └── index.css                   # Design tokens, resets de spin buttons e Tailwind
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## 🚀 Como Executar

### Opção 1: Via Docker Compose (Recomendado)

Requer [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.

```bash
# Copiar arquivo de variáveis de ambiente (opcional, defaults seguros já inclusos)
cp .env.example .env

docker compose up --build
```

Após a inicialização:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Backend**: [http://localhost:8000](http://localhost:8000)
- **Swagger UI (Docs Interativos)**: [http://localhost:8000/docs](http://localhost:8000/docs)

Para encerrar os serviços:
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
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend estará acessível em `http://localhost:5173`.

---

### 🧪 Executar Testes Automatizados

O backend conta com uma suíte de testes de integração automatizados cobrindo o fluxo completo de autenticação e isolamento multi-usuário:

```bash
# A partir da raiz do projeto:
python -m pytest backend/tests/test_auth_flow.py -v

# Ou dentro da pasta backend:
cd backend
python -m pytest tests/test_auth_flow.py -v
```

---

## ⚙️ Variáveis de Ambiente

As variáveis possuem valores padrão para desenvolvimento local, mas podem ser customizadas via arquivo `.env`:

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./financas.db` | String de conexão com o banco de dados |
| `SECRET_KEY` | *(chave interna padrão)* | Segredo criptográfico para assinatura dos tokens JWT |
| `JWT_ALGORITHM` | `HS256` | Algoritmo de assinatura do JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 horas) | Tempo de expiração do token de acesso em minutos |
| `VITE_API_URL` | `http://localhost:8000/api` | URL base do backend consumida pelo frontend |

---

## 📖 Endpoints da API

A documentação interativa completa (OpenAPI / Swagger) é gerada automaticamente pelo FastAPI e pode ser acessada em `/docs`.

### Autenticação & Usuários
| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | Pública | Cadastrar novo usuário (nome, e-mail único e senha) |
| `POST` | `/api/auth/login` | Pública | Login com credenciais, retornando token JWT (`bearer`) |
| `GET` | `/api/auth/me` | Bearer Token | Retorna perfil do usuário logado |

### Categorias
| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/api/categorias` | Pública | Listar todas as categorias cadastradas |
| `POST` | `/api/categorias` | Bearer Token | Criar uma nova categoria personalizada |

### Transações & Extrato (Isoladas por Usuário)
| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/api/transacoes` | Bearer Token | Listar transações do usuário logado (filtros: categoria, data, frete, busca) |
| `POST` | `/api/transacoes` | Bearer Token | Cadastrar nova transação com segregação de frete para o usuário |
| `PUT` | `/api/transacoes/{id}` | Bearer Token | Atualizar transação existente do usuário logado |
| `DELETE` | `/api/transacoes/{id}` | Bearer Token | Remover transação individual do usuário logado |
| `POST` | `/api/transacoes/bulk-delete` | Bearer Token | Excluir transações em lote do usuário passando array de IDs |

### Dashboard & Métricas (Isoladas por Usuário)
| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/api/dashboard/resumo` | Bearer Token | Métricas analíticas do usuário (total, fretes, % frete, gastos por categoria) |


