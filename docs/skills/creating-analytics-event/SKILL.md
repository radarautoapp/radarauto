---
name: creating-analytics-event
description: Use this skill whenever adding, modifying, or proposing a new analytics event (product telemetry, behavior tracking, business metric) in RadarAuto. Enforces the "events must answer a business question" criterion and prevents tracking sprawl. Triggers on requests like "vamos trackear X", "adicionar evento Y", "métrica de Z", "rastrear ação W", "log de comportamento", or any code involving `track()`, `analytics.send()`, event dispatch, or telemetry instrumentation.
---

# Creating an Analytics Event — RadarAuto

Evento de analytics **NUNCA é "vou trackear isso porque parece útil"**. Tem critério rígido.

## 0. Filtros obrigatórios (Regra 18)

Antes de criar evento novo, todas as 3 perguntas devem ter resposta clara:

1. **Que pergunta de negócio esse evento responde?**
   Ex: "Quantos usuários abrem WhatsApp depois de ver um veículo?"

2. **Onde a métrica derivada aparece?**
   - Dashboard de produto?
   - Cálculo de lead scoring?
   - Cálculo de ranking?
   - Alerta de funil?

3. **Quem é o dono?**
   Pessoa/time que vai consumir essa métrica e tomar decisão com ela.

**Se alguma resposta for vaga ("pode ser útil um dia") → não cria.** Tracking sprawl é tão ruim quanto não ter analytics.

## 1. Naming convention

Padrão: `<domínio>.<ação>` — snake_case, verbo no passado quando ação concreta.

✅ Bom:
- `vehicle.viewed`
- `vehicle.favorited`
- `whatsapp.clicked`
- `lead.created`
- `subscription.upgraded`
- `search.performed`
- `listing.expired`

❌ Ruim:
- `click1` (não diz nada)
- `userDidThing` (camelCase, vago)
- `vehiclePageOpenedByUserSomehow` (verboso)
- `event_log_v2_new` (versionamento no nome)

## 2. Schema do evento

```ts
type AnalyticsEvent = {
  event: string;              // "vehicle.viewed"
  userId: string | null;      // null se anônimo
  sessionId: string;          // sempre
  timestamp: Date;            // server-side, não client
  properties: Record<string, unknown>;  // contexto específico
};
```

**Properties padrão (incluir sempre que aplicável):**
- `vehicleId`, `storeId`, `listingId` — IDs de recursos
- `source` — de onde veio (`"catalog" | "store_page" | "search" | "deeplink"`)
- `plan` — `"free" | "premium"` do usuário
- `role` — role do usuário

**Evitar:**
- PII direto (`email`, `phone`) — usar IDs
- Dados grandes (HTML, payloads) — só metadados
- Timestamps gerados no client (relógio do client é mentiroso)

## 3. Onde disparar

### Backend (preferido pra eventos de domínio)

```ts
// vehicles.service.ts
async findOne(id: string, user: User) {
  const vehicle = await this.repo.findOne(id);

  await this.analytics.track({
    event: "vehicle.viewed",
    userId: user.id,
    properties: {
      vehicleId: vehicle.id,
      source: "api",
      plan: user.plan,
    },
  });

  return vehicle;
}
```

**Vantagens:**
- Não pode ser bloqueado por ad-blocker
- Dado consistente (cálculo único)
- Pode incluir info que cliente não tem
- Não infla bundle do frontend

### Frontend (apenas pra eventos de UX puro)

```ts
// Casos válidos:
- scroll_depth (50%, 75%, 100%)
- modal.opened (UI interaction sem efeito no backend)
- search.input.cleared (intenção de UI)
```

Quando frontend dispara, é **complemento**, não substitui o backend.

## 4. Evitar duplicação

Se o evento já é disparado no backend, **não duplicar no frontend** (ou vice-versa).

Ex: `vehicle.viewed`:
- Backend dispara quando GET `/vehicles/:id` é chamado
- Frontend NÃO dispara `vehicle.viewed` também — fica registrado 2x

## 5. Owner views NÃO contam (lição do RadarAuto)

Ações do próprio dono no próprio recurso não contam como evento de "engajamento externo":

```ts
async findOne(id: string, user: User) {
  const vehicle = await this.repo.findOne(id);
  const isOwner = vehicle.ownerId === user.id;

  if (!isOwner) {
    await this.analytics.track({
      event: "vehicle.viewed",
      userId: user.id,
      properties: { vehicleId: vehicle.id, source: "api" },
    });
  }

  return vehicle;
}
```

Mesma lógica vale pra **lead** (dono não vira lead de si mesmo).

## 6. Eventos que alimentam cálculos críticos

Se o evento alimenta **lead scoring** ou **ranking**, é parte do contrato de domínio. Não pode ser "best effort":

- Persistência garantida (não só no Mixpanel/PostHog, mas no banco também)
- Idempotente (mesmo evento 2x não duplica score)
- Logado em caso de falha

## 7. Documentação do evento

Toda introdução de evento novo é registrada em catálogo:

```md
# Event Catalog

## vehicle.viewed
- **Quando**: usuário (não-dono) abre detalhe de veículo
- **Onde**: backend, `VehiclesService.findOne`
- **Properties**: vehicleId, source, plan
- **Usado em**:
  - Métrica "views por veículo" (dashboard lojista)
  - Sinal de lead scoring (clicks count)
  - Ranking engine (engagement score)
- **Owner**: equipe Marketplace
```

## 8. Privacidade e LGPD (Regra 29)

- Não logar PII (email, telefone, CPF) em properties
- IDs são OK (são opacos, sem significado pessoal)
- Eventos têm política de retenção (ex: 18 meses, anonimizar depois)
- Usuário pode solicitar exclusão (ID some, eventos viram anônimos)

## 9. Antes de marcar como pronto

- [ ] Responde a uma pergunta de negócio clara
- [ ] Tem dono identificado
- [ ] Vai aparecer em dashboard / scoring / alerta
- [ ] Naming segue convenção `<domínio>.<ação>`
- [ ] Properties não contêm PII
- [ ] Disparado no lugar certo (backend pra domínio, frontend só pra UX)
- [ ] Não duplica evento existente
- [ ] Owner-actions excluídas se aplicável
- [ ] Documentado no event catalog
- [ ] Idempotente se alimenta cálculo crítico

## Anti-padrões (NÃO faça)

❌ "Vou trackear pra ter o dado, vejo depois pra que serve"
❌ Naming inventivo (`btn_clicked_v2`, `mega_click`, `userActionFlow`)
❌ Properties com email/telefone do usuário
❌ Disparar mesmo evento no frontend e backend (escolhe um)
❌ Logar HTML/JSON gigante em properties
❌ Timestamp do client (não confiável)
❌ Owner gerando eventos no próprio recurso
❌ Evento que ninguém vai olhar nunca (ruído)
❌ Evento crítico sem garantia de persistência
❌ Esquecer de adicionar ao event catalog
