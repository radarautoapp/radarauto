---
name: writing-business-logic
description: Use this skill whenever implementing any business rule, calculation, scoring algorithm, lifecycle transition, paywall enforcement, billing logic, or domain decision in RadarAuto. Forces logic to live in the backend service layer (never frontend), be unit-testable, and have no duplication. Triggers on requests involving "calcular X", "decidir Y", "ranking", "scoring", "preço sugerido", "lifecycle", "permissão", "billing", "limite de uso", "regra de negócio", or any logic that affects money, security, or decisions.
---

# Writing Business Logic — RadarAuto

Regra de negócio **NUNCA vive no frontend**. Sem exceção.

## 0. Pergunta-âncora

Antes de escrever:

> **"Se um usuário malicioso burlar o frontend, isso ainda funciona corretamente?"**

Se a resposta for "não" → a lógica está no lugar errado.

## 1. O que é "regra de negócio"?

Tudo que envolve uma das categorias abaixo:

- **Dinheiro** — preço, desconto, billing, plano, limite de uso, comissão
- **Decisão** — ranking, scoring, ordenação, recomendação, matching
- **Permissão** — quem pode ver/fazer o quê, paywall, autorização
- **Lifecycle** — transições de estado (DRAFT → ACTIVE → SOLD), regras de transição
- **Cálculos críticos** — preço sugerido, oportunidade vs FIPE, lead score, métrica
- **Validação que afeta os 4 acima** — não aceita preço negativo, não aceita cadastro duplicado

Se cai em qualquer uma → backend.

## 2. Onde vive (Regra 23 — Clean Architecture leve)

```
apps/api/src/modules/<feature>/
├── domain/
│   ├── entities/           # Modelo de domínio
│   │   └── Vehicle.ts
│   ├── value-objects/      # Conceitos imutáveis (Money, Plate, Fipe)
│   │   └── Price.ts
│   └── services/           # Lógica que não pertence a uma entity
│       ├── RankingEngine.ts
│       ├── LeadScoring.ts
│       └── PriceRecommender.ts
├── application/
│   └── use-cases/          # Casos de uso (orquestração)
│       ├── CreateVehicle.ts
│       └── ApproveListing.ts
└── infrastructure/
    └── repositories/        # Persistência
        └── VehicleRepository.ts
```

**Princípio:** lógica de domínio é **pura** (não conhece banco, HTTP, framework). Use case **orquestra** (chama repos, services, dispara eventos).

## 3. Documentação obrigatória (Regra 22)

Top-level de todo arquivo de domínio:

```ts
/**
 * RankingEngine
 *
 * Propósito: calcula a posição de um veículo no feed do catálogo
 * Inputs: vehicle metrics (views, favorites, freshness, lead_count)
 *         + user plan (premium boost)
 * Outputs: ranking_score (0-100), usado pra ORDER BY desc
 *
 * Regras importantes:
 *   - Premium boost = +15 pontos, mas não passa de 100
 *   - Veículos > 60 dias sem update perdem 20 pontos (staleness)
 *   - Lead score do veículo influencia 30% do total
 *
 * Performance: roda em batch, não em request. Cache em Redis 15min.
 * Segurança: não expõe lógica ao client (ranking_score é só interno + público o resultado ordenado).
 * Testabilidade: 100% unit-testável, sem dependência de infra.
 */
```

## 4. Estrutura de um service de domínio

```ts
// domain/services/LeadScoring.ts

export type LeadInput = {
  clicks: number;
  favorited: boolean;
  avgTimeSeconds: number;
  whatsappClicked: boolean;
  lastSeen: Date;
};

export type LeadScore = "COLD" | "WARM" | "HOT";

export class LeadScoring {
  /**
   * Calcula temperatura de um lead.
   * Pura. Sem side effects. Sem I/O.
   */
  static calculate(input: LeadInput): LeadScore {
    if (input.whatsappClicked) return "HOT";
    if (input.clicks >= 6) return "HOT";
    if (input.favorited && input.avgTimeSeconds >= 120) return "HOT";
    if (input.clicks >= 3 || input.favorited || input.avgTimeSeconds >= 90) return "WARM";
    return "COLD";
  }
}
```

**Por que estático/funcional**: facilita teste, sem state, previsível.

## 5. Testes (Regra 27 — obrigatórios pra business logic)

Toda regra de negócio **tem teste unitário**. Sem isso, não merge.

```ts
// LeadScoring.spec.ts
describe("LeadScoring", () => {
  it("retorna HOT quando whatsapp foi clicado", () => {
    expect(LeadScoring.calculate({
      clicks: 0, favorited: false, avgTimeSeconds: 0,
      whatsappClicked: true, lastSeen: new Date(),
    })).toBe("HOT");
  });

  it("retorna HOT com 6+ clicks mesmo sem outros sinais", () => { ... });
  it("retorna WARM com favorito + tempo médio alto", () => { ... });
  it("retorna COLD por padrão", () => { ... });
});
```

**Casos de teste obrigatórios:**
- Happy path
- Edge cases (zero, negativo, máximo)
- Boundary conditions (limite exato dos thresholds)
- Comportamento "default" / fallback

## 6. Nunca duplicar a lógica no frontend (Regras 5, 6)

Frontend pode ter **cálculo "de exibição"**, mas a decisão **vem do backend**.

```ts
// ❌ ERRADO — frontend decide:
const isHotLead = lead.clicks >= 6 || lead.whatsappClicked;

// ✅ CERTO — backend envia já calculado:
type LeadDto = {
  id: string;
  name: string;
  score: "COLD" | "WARM" | "HOT";  // calculado no backend
};
```

**Exceção aceitável:** cálculo trivial de exibição (formatar moeda, somar duas colunas visíveis). Mas qualquer **decisão** (mostrar/esconder, permitir/negar, ordenar) vem do backend.

## 7. Paywall: a regra vive no service

```ts
// service:
async findOne(id: string, user: User) {
  const vehicle = await this.repo.findOne(id);
  const access = this.paywallService.canAccessContact(user);

  return {
    ...vehicle,
    phone: access ? vehicle.store.phone : null,
    canViewContact: access,  // flag pra UI
  };
}

// domain/services/PaywallService.ts
export class PaywallService {
  canAccessContact(user: User): boolean {
    return user.plan === "premium" && user.subscriptionStatus === "active";
  }
}
```

Frontend usa `canViewContact` pra UI. **Nunca recalcula a regra.**

## 8. Lifecycle de anúncios (Regra 29)

Toda transição de estado **passa por um service** que valida regra:

```ts
// domain/services/ListingLifecycle.ts
export class ListingLifecycle {
  static canTransition(from: Status, to: Status, actor: User): boolean {
    const rules: Record<Status, Status[]> = {
      DRAFT: ["ACTIVE", "BLOCKED"],
      ACTIVE: ["EXPIRED", "SOLD", "BLOCKED", "INACTIVE"],
      INACTIVE: ["ACTIVE", "BLOCKED"],
      EXPIRED: ["ACTIVE", "BLOCKED"],
      SOLD: ["ACTIVE"],  // pode reativar se voltou atrás
      BLOCKED: [],       // terminal
    };

    if (!rules[from].includes(to)) return false;

    // Regras adicionais por ator:
    if (to === "BLOCKED" && actor.role !== "admin") return false;
    return true;
  }
}
```

E **NUNCA** deletar fisicamente. Sempre transição pra `BLOCKED` ou `EXPIRED`.

## 9. Ranking inteligente (Regra 19)

NUNCA ordenar por `created_at DESC` puro. Sempre engine.

```ts
// domain/services/RankingEngine.ts
export class RankingEngine {
  /**
   * Score 0-100. Recalculado em batch periódico.
   */
  static score(metrics: VehicleMetrics, plan: Plan): number {
    let score = 0;

    // Freshness (até 30 pontos)
    const ageDays = (Date.now() - metrics.createdAt.getTime()) / 86_400_000;
    score += Math.max(0, 30 - ageDays);

    // Engagement (até 30 pontos)
    score += Math.min(30, metrics.views / 50);

    // Lead score (até 25 pontos)
    score += metrics.hotLeads * 5;

    // Premium boost (até 15 pontos)
    if (plan === "premium") score += 15;

    return Math.min(100, score);
  }
}
```

Testar cada componente isoladamente + composição.

## 10. Eventos de domínio

Mudança de estado importante **dispara evento** pra desacoplar consumidores:

```ts
// application/use-cases/ApproveListing.ts
async execute(listingId: string, approver: User) {
  const listing = await this.repo.findOne(listingId);
  if (!ListingLifecycle.canTransition(listing.status, "ACTIVE", approver)) {
    throw new ForbiddenException({ code: "INVALID_TRANSITION" });
  }

  await this.repo.update(listingId, { status: "ACTIVE", approvedAt: new Date() });
  await this.eventBus.publish(new ListingApprovedEvent(listing));
  // → quem escuta: analytics, notification, ranking re-calc, etc
}
```

## 11. Antes de marcar como pronto

- [ ] Lógica está em `domain/services` ou entity (não em controller, não em frontend)
- [ ] Função/método é pura quando possível (sem I/O)
- [ ] Testes unitários cobrindo happy path + edge cases + boundaries
- [ ] Documentação top-level explicando regra
- [ ] Sem duplicação no frontend (frontend usa o resultado, não recalcula)
- [ ] Paywall aplicado se afeta visibilidade
- [ ] Evento de domínio disparado se mudança é relevante
- [ ] Logs estruturados com correlation ID em pontos críticos

## Anti-padrões (NÃO faça)

❌ Lógica de negócio em componente React
❌ Lógica de negócio em controller (controller é fino, chama service)
❌ Service que faz HTTP direto (use repository)
❌ Cálculo de paywall no frontend (`if (user.plan === "premium")`)
❌ DELETE de listing (use soft-delete + transição de status)
❌ `ORDER BY created_at DESC` em feed público (use engine)
❌ Decisão crítica sem teste unitário
❌ Duplicar lógica entre frontend e backend (única fonte = backend)
❌ Service de domínio importando ORM/HTTP/framework (mantém puro)
❌ Magic numbers sem constante nomeada (ex: `if (score > 70)` → `if (score > HOT_THRESHOLD)`)
