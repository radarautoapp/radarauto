---
name: creating-feature
description: Use this skill when building a complete new feature in RadarAuto from scratch — something that spans frontend screens, backend endpoints, data persistence, and potentially analytics/billing. Enforces the design-first workflow, mock data validation, mobile-first design, and proper sequencing (UI before API before persistence). Triggers on requests like "vamos criar a feature de X", "preciso implementar Y do zero", "novo módulo para Z", "vamos fazer o cadastro de N", or any request involving multiple layers (UI + API + DB).
---

# Creating a Feature — RadarAuto

Feature completa **NUNCA é "vamos começar pelo backend"**. Segue ordem rígida abaixo.

## A ordem importa

```
1. Discovery   → o que estamos resolvendo?
2. Design      → como o usuário interage?
3. UI mockada  → fluxo navegável com fake data
4. Validação   → revisar visualmente antes de codar backend
5. Backend     → API + DB depois que UI está validada
6. Integração  → conectar frontend real ao backend
7. Testes      → unit + integration nos pontos críticos
8. Observability → analytics + logs + métricas
9. Rollout     → deploy + monitoramento
```

Quebrar essa ordem = retrabalho garantido.

## Passo 1 — Discovery (não pula)

Antes de qualquer código, responder:

- **Qual problema do usuário?** (não "qual feature técnica")
- **Quem usa?** (qual role: lojista, funcionário, revendedor?)
- **Como sabe que funcionou?** (métrica de sucesso)
- **Tem alternativa mais simples?** (sempre preferir o mais simples)
- **Já existe algo parcial que resolve?**

Se não souber responder, **não começa**. Pergunta ao usuário/PM.

## Passo 2 — Design (telas no papel ou Figma)

Mapear todas as **telas e estados**:

- Estado inicial (vazio)
- Estado com dados (preenchido)
- Estado de loading
- Estado de erro
- Estado de sucesso
- Estado de permissão negada (paywall)
- Mobile + tablet + desktop

**Mobile-first** (Regra 3) — desenha mobile primeiro, escala pra cima.

## Passo 3 — UI mockada (Regra 2 — Design First)

Construir a feature **inteira** no frontend com **mock data**:

```tsx
// fake-data/vehicles.mock.ts
export const MOCK_VEHICLES: Vehicle[] = [
  { id: "1", brand: "BMW", model: "320i", price: 165000, ... },
  // ...
];
```

- Telas reais com dados falsos
- Navegação real entre telas
- Validações de UI funcionando
- Estados loading/empty/error visíveis
- Responsivo testado
- Animações finais

**NÃO faz backend ainda.** Não cria endpoint. Não cria migration. Não cria service.

## Passo 4 — Validação visual

Antes de tocar em backend:

- Demo pro usuário/cliente
- Validar com stakeholder
- Ajustar UX baseado em feedback
- Confirmar que **o problema do passo 1 está resolvido**

**Critério de saída do Design-First** (Regra 2):
> Quando a tela tem fluxo navegável end-to-end com mock data, estados cobertos, e foi validada visualmente → pode partir pro backend daquela feature.

Não precisa ter o app inteiro mockado. Só a feature em questão.

## Passo 5 — Backend (segue skill `creating-endpoint`)

Agora sim, backend real:

1. **Domain model** — entity, value objects
2. **Repository** — persistência
3. **Service** — regra de negócio (lifecycle, validações, cálculos)
4. **Controller** — endpoints HTTP (com DTOs, guards, etc)
5. **Module** — wiring NestJS
6. **Migration** — schema do banco

**Para cada endpoint, aplica a skill `creating-endpoint`.**

Regras de negócio **vivem no backend** (Regras 6, 7):
- Ranking
- Lead scoring
- Lifecycle de anúncios
- Paywall (que campo vai pro client por plano)
- Validações críticas

## Passo 6 — Integração (substituir mock por real)

```tsx
// Antes:
const vehicles = MOCK_VEHICLES;

// Depois:
const { data: vehicles, isLoading, error } = useQuery({
  queryKey: ["vehicles", filters],
  queryFn: () => api.vehicles.list(filters),
});
```

- TanStack Query pra server state (Regra 24)
- Loading states já estão prontos (passo 3 cobriu)
- Error states já estão prontos
- Adicionar retry, refetch on focus, etc

## Passo 7 — Testes (Regra 27)

**Backend:**
- Unit tests em services com regra de negócio
- Integration tests nos endpoints críticos (auth, paywall, lifecycle)

**Frontend:**
- Hooks com lógica (ex: `useLeadScoring`, `usePaywall`)
- Smoke test no fluxo principal (E2E ou integration)

Não precisa 100% coverage. Foca no que **vale dinheiro / quebra produção**.

## Passo 8 — Observability (Regras 18, 31)

**Analytics de produto** (Regra 18):
- Eventos chave gerados (com propósito claro)
- Documentar quais eventos novos foram criados e o que medem

**Observabilidade técnica** (Regra 31):
- Logs estruturados com correlation ID
- Métricas de latência/erro nos endpoints novos
- Sentry capturando exceções
- Dashboard atualizado se métrica é estratégica

## Passo 9 — Rollout

- Deploy em staging primeiro
- Smoke test em staging com dados reais
- Deploy em produção
- Monitorar primeiras 24h (erros, latência, eventos esperados)
- Comunicar feature pronta ao time/usuários

## Checklist final de feature pronta

- [ ] Discovery documentado (problema + métrica de sucesso)
- [ ] Design mobile-first validado
- [ ] UI mockada navegável end-to-end
- [ ] Estados loading/empty/error em todas as telas
- [ ] Backend com DTO, guards, validação, error padronizado
- [ ] Lifecycle de dados respeitado (soft-delete onde aplicável)
- [ ] Paywall aplicado se feature toca em premium
- [ ] Testes nos pontos críticos
- [ ] Eventos de analytics gerados
- [ ] Logs estruturados com correlation ID
- [ ] Documentação top-level em cada arquivo novo
- [ ] Tipos compartilhados em `packages/types`
- [ ] PR/release notes escritas

## Anti-padrões (NÃO faça)

❌ Começar pelo schema do banco (top-down de dados)
❌ Pular UI mockada e ir direto pro endpoint
❌ Implementar regra de negócio no frontend "pra ser rápido"
❌ Esquecer estados de loading/error/empty
❌ Endpoint sem DTO, guard, ou paywall
❌ Feature em produção sem analytics / logs
❌ Deploy direto em produção sem staging
❌ "Vai dar tempo de adicionar teste depois"
❌ Mock data espalhado pelo código (centraliza em `fake-data/`)
❌ Esquecer mobile / só testar em desktop

## Como esta skill se relaciona com as outras

- Cada **componente** do passo 3 → segue `creating-component`
- Cada **endpoint** do passo 5 → segue `creating-endpoint`
- Cada **alteração** em código existente durante integração → segue `safe-change`
- **Lógica de negócio** do passo 5 → segue `writing-business-logic`
- **Eventos** do passo 8 → segue `creating-analytics-event`
- **Dados de usuários** em qualquer passo → segue `handling-pii-data`
