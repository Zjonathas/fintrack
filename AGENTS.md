# 🤖 Diretrizes e Protocolos de IA (AGENTS.md)

Este documento define as regras operacionais, padrões de engenharia e a lista de **Skills** instaladas para orientar o desenvolvimento no ecossistema do projeto **FinançasApp**.

---

## 🚨 Regra de Ouro: Obrigatoriedade de Consulta às Skills

> [!IMPORTANT]
> **OBRIGATÓRIO**: Antes de iniciar o planejamento, refatoração, codificação, correção de bugs ou testes em qualquer parte deste repositório, o agente **DEVE** inspecionar e seguir estritamente as convenções da respectiva skill instalada em `.agents/skills/<nome-da-skill>/SKILL.md`.

---

## 🧰 Skills Instaladas no Projeto (`.agents/skills/`)

As seguintes skills foram analisadas e instaladas especificamente para a stack e o cenário deste projeto:

| Skill | Caminho | Finalidade no Projeto |
|---|---|---|
| **`fastapi-pro`** | `.agents/skills/fastapi-pro/SKILL.md` | Padrões de arquitetura REST, injeção de dependências (`Depends`), middlewares e performance com FastAPI. |
| **`fastapi-templates`** | `.agents/skills/fastapi-templates/SKILL.md` | Templates e estruturas padronizadas para rotas, responses e manipulação de erros na API. |
| **`python-pro`** | `.agents/skills/python-pro/SKILL.md` | Padrões de código Python idiomático, type hints completos, clean code e tratamento de exceções. |
| **`sql-pro`** | `.agents/skills/sql-pro/SKILL.md` | Modelagem de dados com SQLAlchemy 2.0, integridade referencial com SQLite (`PRAGMA foreign_keys=ON`) e queries eficientes. |
| **`react-state-management`** | `.agents/skills/react-state-management/SKILL.md` | Gerenciamento de estado previsível em React, criação de custom hooks e controle reativo de formulários. |
| **`tailwind-design-system`** | `.agents/skills/tailwind-design-system/SKILL.md` | Construção de design system coeso, paleta de cores moderna, glassmorphism e micro-animações com Tailwind CSS. |
| **`typescript-pro`** | `.agents/skills/typescript-pro/SKILL.md` | Tipagem estrita de payloads, interfaces compartilhadas, ausência de `any` implícito e segurança type-safe. |
| **`kpi-dashboard-design`** | `.agents/skills/kpi-dashboard-design/SKILL.md` | Arquitetura de dashboards financeiros, cartões de KPIs, taxas percentuais e visualizações analíticas de impacto orçamentário. |

---

## 📐 Padrões Arquiteturais e Regras de Negócio

### 1. Separação de Responsabilidades (Full Stack Desacoplado)
- **Backend (`/backend`)**:
  - `models.py`: Apenas declaração de entidades e relacionamentos SQLAlchemy.
  - `schemas.py`: Schemas Pydantic para validação na borda e serialização de respostas.
  - `crud.py`: Camada de acesso a dados e agregações analíticas (sem lógica HTTP).
  - `main.py`: Camada HTTP/REST com endpoints, tratamento de códigos de status e injeção de dependência via `get_db`.
- **Frontend (`/frontend`)**:
  - `services/api.ts`: Centralização de todas as chamadas HTTP (Axios) tipadas.
  - `components/`: Componentes modulares, reutilizáveis e focados (`FormularioTransacao`, `DashboardResumo`, `FiltrosTransacoes`, `ListaTransacoes`).
  - `types/`: Tipagens TypeScript espelhando os contratos de resposta da API.

### 2. Regra Central de Frete / Taxa de Entrega
- Transações com taxa de entrega (`teve_entrega = True`) **sempre** devem ter seu `valor_entrega` isolado e contabilizado separadamente.
- O campo "Valor da Entrega" deve aparecer de forma condicional e reativa quando o usuário assinalar que houve frete.
- As métricas financeiras (`DashboardResumo`) devem manter o cálculo isolado do impacto percentual das taxas de entrega sobre o gasto total.

### 3. Comunicação e Idioma
- Todas as interações, documentações e explicações devem ser fornecidas em **Português do Brasil**.
- O código-fonte mantém nomenclaturas em português coerentes com o domínio do negócio (`descricao`, `valor_produto`, `teve_entrega`, `valor_entrega`, `categoria_id`).
