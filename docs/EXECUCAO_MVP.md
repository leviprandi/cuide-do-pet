# Cuide do Pet — Central de Execução do MVP

> **Produto:** Cuide do Pet
> **Stack:** Next.js + TypeScript · NestJS · PostgreSQL + Prisma · Minimax API
> **Propósito do MVP:** provar o valor central — registrar rotina do pet, organizar histórico, controlar gastos e usar IA para transformar linguagem natural em registros úteis.
> **Última atualização:** 2026-03-26

## Índice

- [Regras de uso deste arquivo](#regras-de-uso-deste-arquivo)
- [Painel de status](#painel-de-status)
  - [Próxima tarefa ativa (detalhada)](#próxima-tarefa-ativa-detalhada)
- [Regras de negócio críticas](#regras-de-negócio-críticas)
- [Fase 1 — Fundamentos](#fase-1--fundamentos)
- [Fase 2 — Núcleo operacional](#fase-2--núcleo-operacional)
- [Fase 3 — IA útil](#fase-3--ia-útil)
- [Fase 4 — Cronogramas e agenda](#fase-4--cronogramas-e-agenda)
- [Fase 5 — Qualidade e entrega](#fase-5--qualidade-e-entrega)
- [Fluxos prioritários do MVP](#fluxos-prioritários-do-mvp)
- [Log de execução](#log-de-execução)

---

## Regras de uso deste arquivo

- Marcar como concluído `[x]` apenas quando o critério de aceite estiver validado.
- Tarefas parcialmente feitas permanecem abertas com observação.
- Não adicionar escopo fora do MVP — se surgir ideia nova, registrar em seção separada.
- Observações devem ser curtas, objetivas e datadas.

---

## Painel de status

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundamentos | 🟨 Em andamento |
| 2 | Núcleo operacional | 🔲 Não iniciado |
| 3 | IA útil | 🔲 Não iniciado |
| 4 | Cronogramas e agenda | 🔲 Não iniciado |
| 5 | Qualidade e entrega | 🔲 Não iniciado |

**Próxima tarefa ativa:** F1.M1.T1-AJUSTE — Concluir estrutura física do monorepo no diretório raiz do projeto.

### Próxima tarefa ativa (detalhada)

- **ID:** F1.M1.T1-AJUSTE
- **Título:** Concluir estrutura física do monorepo no diretório raiz
- **Objetivo:** garantir a existência física de `apps/web`, `apps/api`, `packages/shared`, `tooling`, `scripts` e `.github/workflows` no root do projeto.
- **Dependências:** nenhuma.
- **Checklist de execução:**
  - [ ] Criar `apps/web` e `apps/api` no diretório raiz
  - [ ] Criar `packages/shared` com placeholders mínimos
  - [ ] Criar `tooling`, `scripts` e `.github/workflows` com `.gitkeep`
  - [ ] Validar estrutura com listagem recursiva a partir do root
  - [ ] Registrar evidência da validação no log
- **Critério de aceite:** a árvore de pastas da F1.M1.T1 existe fisicamente no root do projeto e é verificável via terminal.

---

## Regras de negócio críticas

Estas regras devem ser validadas em qualquer tarefa que as envolva:

- Calcular preço por kg quando houver preço, quantidade e unidade em kg.
- Se houver pet nomeado na mensagem, ele tem prioridade sobre espécie.
- Se houver apenas espécie, associar o registro a todos os pets compatíveis.
- Ração e areia podem ser compartilhadas entre pets.
- Remédios tendem a ser individuais — tratar como tal por padrão.
- A IA interpreta a intenção; o backend valida os dados e executa a ação.
- Em casos ambíguos, o sistema deve pedir confirmação antes de registrar.

---

## Fase 1 — Fundamentos

**Objetivo:** criar a estrutura base do projeto, autenticação, banco de dados e modelos iniciais.
**Dependências:** nenhuma — é o ponto de partida.

### Módulo: Infraestrutura e projeto

- [ ] Definir estrutura de pastas do monorepo (frontend / backend / shared)
- [ ] Configurar frontend com Next.js + TypeScript
- [ ] Configurar backend com NestJS
- [ ] Configurar lint e formatter (ESLint + Prettier) nos dois projetos
- [ ] Configurar variáveis de ambiente (`.env.example` documentado)
- [ ] Configurar ambiente local com Docker ou instrução de setup manual

### Módulo: Banco de dados

- [ ] Configurar PostgreSQL (local e/ou serviço gerenciado)
- [ ] Configurar Prisma no backend
- [ ] Criar migration inicial com modelo `User`
- [ ] Criar modelo inicial de `Pet` no schema Prisma
- [ ] Validar conexão e geração de migrations

### Módulo: Autenticação

- [ ] Criar endpoint de registro de usuário
- [ ] Criar endpoint de login (JWT)
- [ ] Proteger rotas autenticadas no backend
- [ ] Criar healthcheck no backend (`GET /health`)

### Critérios de aceite — Fase 1

- [ ] Frontend sobe localmente sem erros
- [ ] Backend sobe localmente sem erros
- [ ] Banco conecta e Prisma gera migration inicial com sucesso
- [ ] Usuário consegue se registrar e autenticar
- [ ] Rotas protegidas bloqueiam acesso sem token
- [ ] Healthcheck retorna `200 OK`

**Status:** Em andamento
**Observações:**
- 2026-03-26: Revalidação no workspace indicou ausência de `apps`, `packages`, `tooling`, `scripts` e `.github` no root atual.
- 2026-03-26: F1.M1.T1 voltou para pendente até confirmação física da estrutura no diretório raiz do projeto.
- 2026-03-26: Próxima ação imediata definida como F1.M1.T1-AJUSTE.

---

## Fase 2 — Núcleo operacional

**Objetivo:** entregar os módulos de pets, timeline, gastos e documentos básicos.
**Dependências:** Fase 1 concluída (banco, auth e modelos base).

### Módulo: Pets

- [ ] Expandir schema Prisma de `Pet` (nome, espécie, raça, nascimento, foto)
- [ ] Criar CRUD completo de pets no backend (Create, Read, Update, Delete)
- [ ] Criar listagem de pets no frontend
- [ ] Criar tela de cadastro e edição de pet
- [ ] Associar pets ao usuário autenticado

### Módulo: Timeline / Eventos

- [ ] Criar schema Prisma de `Event` (tipo, data, descrição, pet, anexo)
- [ ] Criar endpoint de criação manual de evento
- [ ] Criar endpoint de listagem de timeline
- [ ] Criar filtro por pet, categoria e período
- [ ] Suportar upload de foto ou anexo por evento

### Módulo: Gastos (Expenses)

- [ ] Criar schema Prisma de `Expense` (item, preço, quantidade, unidade, data)
- [ ] Criar tabela de associação `expense_pets` (gasto ↔ um ou mais pets)
- [ ] Criar registro manual de gasto no backend
- [ ] Implementar lógica de cálculo de preço por kg (quando unidade = kg)
- [ ] Implementar associação de gasto por pet nomeado
- [ ] Implementar associação de gasto por espécie (quando não há pet nomeado)
- [ ] Implementar flag de item compartilhado (ex.: ração, areia)

### Módulo: Documentos

- [ ] Criar upload básico de documento (PDF, imagem)
- [ ] Associar documento a pet, evento ou gasto manualmente

### Critérios de aceite — Fase 2

- [ ] Usuário cadastra, edita e remove pet
- [ ] Usuário cria evento manual e ele aparece na timeline
- [ ] Timeline filtra por pet, categoria e período
- [ ] Usuário registra gasto com preço, quantidade e unidade
- [ ] Sistema calcula preço por kg quando a unidade é kg
- [ ] Gasto com pet nomeado é associado a esse pet
- [ ] Gasto com apenas espécie é associado a todos os pets dessa espécie
- [ ] Documento é enviado e associado corretamente

**Status:** Não iniciado
**Observações:** —

---

## Fase 3 — IA útil

**Objetivo:** interpretar linguagem natural e transformar mensagens em registros estruturados.
**Dependências:** Fase 2 concluída (eventos, gastos e pets operacionais).

### Módulo: Contrato e intents

- [ ] Criar módulo de IA no backend (`ai.module.ts`)
- [ ] Definir enum de intents prioritárias:
  - `CREATE_EVENT`
  - `REGISTER_EXPENSE`
  - `ASK_HISTORY_QUESTION`
  - `GENERATE_VET_SUMMARY`
  - `REQUEST_CONFIRMATION` (casos ambíguos)
- [ ] Definir contrato estruturado de entrada e saída da IA (schema JSON)
- [ ] Criar prompt base do sistema (system prompt) com contexto e regras de negócio

### Módulo: Ações da IA

- [ ] Implementar intent `CREATE_EVENT` → cria evento via backend
- [ ] Implementar intent `REGISTER_EXPENSE` → registra gasto via backend
- [ ] Implementar intent `ASK_HISTORY_QUESTION` → consulta histórico e responde
- [ ] Implementar intent `GENERATE_VET_SUMMARY` → gera resumo do pet para veterinário
- [ ] Implementar fluxo de confirmação para casos ambíguos (pet/espécie incertos)

### Módulo: Interface de chat

- [ ] Criar tela de chat no frontend
- [ ] Exibir mensagens de confirmação quando a IA pedir
- [ ] Exibir resultado da ação após confirmação do usuário

### Critérios de aceite — Fase 3

- [ ] Mensagem "vacina da Luna hoje" → gera evento estruturado para o pet Luna
- [ ] Mensagem "comprei 15kg de ração por R$120" → registra gasto com cálculo por kg
- [ ] Mensagem ambígua recebe pergunta de confirmação antes de registrar
- [ ] Pergunta sobre histórico recente retorna resposta relevante
- [ ] Resumo para veterinário é gerado com dados reais do histórico

**Status:** Não iniciado
**Observações:** —

---

## Fase 4 — Cronogramas e agenda

**Objetivo:** entregar controle de medicação, geração de doses e lembretes.
**Dependências:** Fase 2 concluída (pets) — Fase 3 opcional, mas recomendada.

### Módulo: Medicação

- [ ] Criar schema Prisma de `MedicationPlan` (pet, medicamento, dose, frequência, início, fim)
- [ ] Criar schema Prisma de `MedicationScheduleRule` (regras de recorrência)
- [ ] Criar schema Prisma de `MedicationDose` (instância de dose: prevista, dada, perdida, adiada)
- [ ] Criar endpoint para cadastrar plano de medicação
- [ ] Gerar doses futuras automaticamente a partir do primeiro horário
- [ ] Criar endpoint para marcar dose como dada, perdida ou adiada

### Módulo: Lembretes

- [ ] Criar schema Prisma de `Reminder` (tipo, data/hora, pet, mensagem)
- [ ] Gerar lembretes automáticos a partir de planos de medicação
- [ ] Criar endpoint de listagem de lembretes futuros

### Módulo: Dashboard

- [ ] Criar tela de dashboard com próximos cuidados (doses, lembretes, consultas)
- [ ] Exibir alertas de dose não registrada no prazo

### Critérios de aceite — Fase 4

- [ ] Usuário cadastra plano simples de medicação (ex.: 1 comprimido, 2x ao dia por 7 dias)
- [ ] Sistema gera todas as doses futuras do plano
- [ ] Usuário marca dose como dada ou perdida
- [ ] Sistema gera lembretes automáticos a partir do plano
- [ ] Dashboard exibe próximos cuidados do dia e da semana

**Status:** Não iniciado
**Observações:** —

---

## Fase 5 — Qualidade e entrega

**Objetivo:** polir experiência, cobrir erros comuns e preparar o MVP para demonstração.
**Dependências:** Fases 1 a 4 concluídas ou funcionalmente estáveis.

### Módulo: Testes

- [ ] Criar testes unitários para as regras de negócio críticas (cálculo por kg, associação por espécie)
- [ ] Criar testes de integração para os endpoints principais (pets, eventos, gastos, IA)
- [ ] Criar testes mínimos dos fluxos críticos no frontend

### Módulo: Validações e erros

- [ ] Revisar validações de entrada em todos os endpoints (DTOs com class-validator)
- [ ] Revisar mensagens de erro retornadas ao frontend
- [ ] Revisar estados vazios nas telas principais (sem pets, sem eventos, sem gastos)

### Módulo: Consistência e desempenho

- [ ] Revisar respostas da IA para casos-limite
- [ ] Revisar desempenho das consultas principais (timeline, dashboard)
- [ ] Revisar consistência visual das telas do MVP

### Critérios de aceite — Fase 5

- [ ] Todos os fluxos prioritários funcionam do início ao fim sem erros
- [ ] Erros de validação exibem mensagem clara ao usuário
- [ ] Nenhuma tela fica em branco indefinidamente (loading e empty state implementados)
- [ ] MVP está consistente e estável para demonstração

**Status:** Não iniciado
**Observações:** —

---

## Fluxos prioritários do MVP

Estes fluxos representam o valor central do produto e devem ser validados ao final de cada fase relevante:

- [ ] Cadastrar pet novo
- [ ] Registrar evento manualmente na timeline
- [ ] Registrar evento pelo chat com IA
- [ ] Registrar compra com cálculo de preço por kg
- [ ] Perguntar ao chat sobre histórico recente de um pet
- [ ] Gerar resumo para veterinário
- [ ] Cadastrar plano de medicação simples
- [ ] Ver próximas doses e lembretes no dashboard

---

## Log de execução

### 2026-03-26 (revalidação)
- Verificação via terminal no root atual não encontrou a árvore prevista da F1.M1.T1 (`apps`, `packages`, `tooling`, `scripts`, `.github`).
- F1.M1.T1 foi reaberta para ajuste e validação física.
- Próxima tarefa ativa redefinida para F1.M1.T1-AJUSTE (ainda na Fase 1).

### 2026-03-26
- F1.M1.T1 marcada como concluída.
- Status da Fase 1 atualizado para "Em andamento".
- Próxima tarefa ativa definida: F1.M1.T2 (bootstrap do frontend em `apps/web`).

### 2026-03-25
- Documento inicial de execução criado.
- Estrutura revisada e expandida: painel de status, dependências por fase, critérios de aceite detalhados, módulos explícitos e regras de negócio centralizadas.
