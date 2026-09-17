# 💰 FinançasApp &bull; Gestão Financeira Pessoal

> Aplicativo web moderno para controle de finanças pessoais com separação analítica de **taxas de entrega**, dashboards interativos, gestão de categorias e alternância de **Modo Claro / Modo Escuro**.

---

## 🎯 Proposta & Diferencial

Na maioria dos aplicativos de finanças, os custos com delivery ou fretes de compras online ficam diluídos no valor total dos produtos, dificultando a percepção de quanto do orçamento mensal é consumido apenas com taxas logísticas.

O **FinançasApp** isola e quantifica as despesas com entrega, oferecendo métricas claras sobre o impacto logístico nas suas compras do dia a dia.

---

## ✨ Funcionalidades Principais

- 📦 **Rastreamento Isolado de Fretes**: Formulário reativo que separa o valor do produto da taxa de entrega, calculando automaticamente o impacto percentual no orçamento.
- 📊 **Dashboards Interativos com Recharts**:
  - **Distribuição por Categoria**: Gráfico Donut com percentuais e valores.
  - **Produto vs. Frete**: Gráfico de barras empilhadas para comparar gastos reais vs. taxas logísticas.
  - **Evolução Histórica**: Gráfico de área temporal exibindo a curva de despesas diárias.
- 🏷️ **Gestão de Categorias**: Criação dinâmica de categorias com validação de unicidade e vinculação imediata às transações.
- 🌓 **Tema Claro & Escuro (Light/Dark Mode)**: Suporte completo a temas com detecção automática de preferência do sistema e persistência em `localStorage`.
- 🔍 **Filtros e Busca em Tempo Real**: Filtros por período (mês/ano), categoria, busca textual e extrato tabular detalhado.
- 🛡️ **Resiliência & Validações**: Tratamento de erros com `ErrorBoundary` no frontend e schemas Pydantic v2 rigorosos no backend.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **Banco de Dados** | SQLite com integridade referencial ativa (`PRAGMA foreign_keys = ON`) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Visualização & UI** | Recharts, Phosphor Icons, Axios |
| **DevOps & Containers** | Docker, Docker Compose |

---

## 📁 Estrutura do Projeto

```text
Financas/
├── backend/
│   ├── app/
│   │   ├── database.py       # Conexão SQLite e injeção de dependência get_db
│   │   ├── models.py         # Modelos SQLAlchemy (Categoria, Transacao)
│   │   ├── schemas.py        # Validações e serialização Pydantic v2
│   │   ├── crud.py           # Consultas e agregações analíticas
│   │   └── main.py           # Rotas REST e configuração de CORS
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Dashboards, formulários, listas e modais
│   │   ├── hooks/            # Hooks de tema (useTheme)
│   │   ├── services/         # Cliente Axios tipado
│   │   ├── types/            # Contratos de tipos TypeScript
│   │   ├── App.tsx
│   │   └── index.css         # Design tokens e variáveis Tailwind
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## 🚀 Como Executar

### Opção 1: Via Docker Compose (Recomendado)

Requer [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.

```bash
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

## ⚙️ Variáveis de Ambiente

As variáveis possuem valores padrão para desenvolvimento local, mas podem ser customizadas:

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./financas.db` | String de conexão com o banco de dados |
| `VITE_API_URL` | `http://localhost:8000/api` | URL base do backend consumida pelo frontend |

---

## 📖 Endpoints da API

A documentação interativa completa (OpenAPI / Swagger) é gerada automaticamente pelo FastAPI e pode ser acessada em `/docs`. Principais recursos:

- `GET /api/categorias` &mdash; Listar categorias cadastradas
- `POST /api/categorias` &mdash; Criar nova categoria
- `GET /api/transacoes` &mdash; Listar e filtrar transações (mês, ano, busca)
- `POST /api/transacoes` &mdash; Cadastrar transação com cálculo condicional de frete
- `PUT /api/transacoes/{id}` &mdash; Atualizar uma transação existente
- `DELETE /api/transacoes/{id}` &mdash; Remover uma transação individualmente
- `POST /api/transacoes/bulk-delete` &mdash; Excluir múltiplas transações selecionadas em lote
- `GET /api/dashboard/resumo` &mdash; Obter KPIs agregados (total, produtos, fretes, % frete)

- `GET /api/dashboard/graficos` &mdash; Obter séries formatadas para os gráficos Recharts
