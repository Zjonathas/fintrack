# 💰 FinançasApp &bull; Gestão Financeira Pessoal

> Aplicativo web moderno para controle de finanças pessoais com separação analítica de **taxas de entrega**, dashboards interativos, componentes de interface customizados, modais intuitivos e alternância de **Modo Claro / Modo Escuro**.

---

## 🎯 Proposta & Diferencial

Na maioria dos aplicativos de finanças, os custos com delivery ou fretes de compras online ficam diluídos no valor total dos produtos, dificultando a percepção de quanto do orçamento mensal é consumido apenas com taxas logísticas.

O **FinançasApp** isola e quantifica as despesas com entrega, oferecendo métricas claras sobre o impacto logístico nas suas compras do dia a dia.

---

## ✨ Funcionalidades Principais

- 📦 **Rastreamento Isolado de Fretes**: Formulário reativo que separa o valor do produto da taxa de entrega, calculando e exibindo automaticamente o impacto percentual no orçamento.
- 📊 **Dashboards Interativos com Recharts**:
  - **Distribuição por Categoria**: Gráfico Donut com percentuais e valores absolutos.
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
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **Banco de Dados** | SQLite com integridade referencial ativa (`PRAGMA foreign_keys = ON`) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Componentes & UI** | Phosphor Icons, Recharts, React Portal, Axios |
| **DevOps & Containers** | Docker, Docker Compose |

---

## 📁 Estrutura do Projeto

```text
Financas/
├── backend/
│   ├── app/
│   │   ├── database.py                 # Conexão SQLite e injeção de dependência get_db
│   │   ├── models.py                   # Modelos SQLAlchemy (Categoria, Transacao)
│   │   ├── schemas.py                  # Schemas e validações Pydantic v2
│   │   ├── crud.py                     # Acesso a dados, agregações e exclusão em lote
│   │   └── main.py                     # Rotas REST e configuração de CORS
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

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/categorias` | Listar todas as categorias cadastradas |
| `POST` | `/api/categorias` | Criar uma nova categoria |
| `GET` | `/api/transacoes` | Listar e filtrar transações (categoria, data, frete, busca) |
| `POST` | `/api/transacoes` | Cadastrar nova transação com segregação de frete |
| `PUT` | `/api/transacoes/{id}` | Atualizar transação existente por ID |
| `DELETE` | `/api/transacoes/{id}` | Remover transação individual por ID |
| `POST` | `/api/transacoes/bulk-delete` | Excluir transações em lote passando array de IDs |
| `GET` | `/api/dashboard/resumo` | Obter métricas de KPI agregadas (total, fretes, % frete) |
| `GET` | `/api/dashboard/graficos` | Obter séries tratadas para os gráficos Recharts |

