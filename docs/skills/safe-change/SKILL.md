---
name: safe-change
description: Use this skill before modifying ANY existing code in the RadarAuto codebase — including components, hooks, services, endpoints, DTOs, stores, layouts, modules, schemas, or shared utilities. Forces systemic impact analysis before touching anything. Triggers on any request like "altere", "modifique", "refatore", "renomeie", "mude X", "remova", "ajuste", or whenever proposing changes to files that already exist (especially in `packages/ui`, `modules/`, `shared/`, or any cross-cutting concern).
---

# Safe Changes — RadarAuto

**NUNCA alterar algo isoladamente.** Antes de qualquer modificação em código existente, executar análise de impacto.

## 0. Pergunta-âncora

Antes de digitar a primeira letra de mudança, pergunte:

> **"Como isso impacta o sistema inteiro?"**

Se a resposta for "não sei" → para e investiga. Se for "só esse arquivo" → suspeita, geralmente é mentira.

## 1. Mapear quem usa o que

Antes de mudar, **descobrir quem depende**:

```bash
# Componente: quem importa?
grep -r "from.*Button" apps/ packages/

# Função/hook: quem chama?
grep -r "useVehicles" apps/

# Endpoint: quem consome?
grep -r "/api/vehicles" apps/web/

# Tipo: quem usa?
grep -r "VehicleDto" apps/ packages/

# CSS class / design token: quem aplica?
grep -r "btn-primary" apps/
```

**Não confiar em IDE só.** Grep é definitivo, especialmente pra strings dinâmicas.

## 2. Checklist de impacto (Regra 11)

Pra **cada** dependente encontrado, avaliar impacto em:

- [ ] **Arquitetura** — quebra alguma camada? Adiciona dependência circular?
- [ ] **UX** — algum fluxo visível pro usuário muda? Texto, comportamento, ordem?
- [ ] **Visual** — layout, espaçamento, cor, animação afetados?
- [ ] **Performance** — adiciona re-render, query nova, bundle maior?
- [ ] **Mobile** — comportamento muda em < 640px? Touch areas?
- [ ] **Analytics** — quebra ou duplica algum evento? Muda significado?
- [ ] **Segurança** — afeta paywall, auth, autorização, sanitização de dados?
- [ ] **Billing** — toca em plano, cobrança, limite de uso?
- [ ] **Ranking/Scoring** — muda cálculo de score, ordem do feed, lead scoring?
- [ ] **Estado global** — Zustand store, TanStack cache, contexto?
- [ ] **Banco** — schema, índice, migration necessária?
- [ ] **API contract** — request/response shape, status codes?
- [ ] **Testes** — quais testes precisam atualizar?

Se algum item for "sim", **listar explicitamente** o impacto antes de mudar.

## 3. Mudanças que parecem inocentes mas não são

Atenção especial pra esses casos clássicos:

### "Vou só renomear esse campo"
- Frontend pode consumir
- Outro service pode depender
- Analytics pode estar usando o nome antigo
- DTO de migração? Versionamento?

### "Vou só mudar o tipo desse prop"
- Componente pode ser usado em N lugares
- Tipo pode ser exportado e usado externamente
- Validação pode quebrar silenciosamente

### "Vou só ajustar esse CSS"
- Pode ser usado em outros componentes (classe global)
- Pode quebrar mobile/tablet em telas que você não testou
- Pode mudar contraste e violar acessibilidade

### "Vou só refatorar essa função"
- Side effects?
- Outro código depende da ordem das chamadas?
- Era chamada em testes?

### "Vou só remover esse código não usado"
- Tem certeza que ninguém usa? Buscou em strings dinâmicas?
- Está em arquivo de tipos que IDE não rastreia?
- Era usado por feature flag desligada?

## 4. Mudanças em código compartilhado

Se o arquivo está em:
- `packages/ui/` (design system)
- `packages/types/` (tipos compartilhados)
- `apps/api/src/shared/`
- Qualquer hook, util, ou store usado em > 3 lugares

**Tratar como mudança de API pública**:
- Adicionar > Remover > Modificar (nesta ordem de preferência)
- Modificações breaking exigem versionamento ou deprecation path
- Documentar mudança no PR
- Comunicar ao time (não silenciosa)

## 5. Estratégia de modificação segura

Em ordem de preferência:

1. **Estender** — adicionar parâmetro opcional, novo campo opcional, nova função paralela
2. **Refatorar com testes** — mudar interna, contratos iguais, testes garantem
3. **Deprecar gradualmente** — marcar antigo como `@deprecated`, criar novo, migrar consumidores, remover antigo depois
4. **Big bang** (só em último caso) — mudar tudo de uma vez, com plano de rollback

## 6. Antes do commit final

- [ ] Listei todos os consumidores afetados?
- [ ] Atualizei cada um deles?
- [ ] Rodei testes (unit + integration)?
- [ ] Testei manualmente o fluxo principal afetado?
- [ ] Verifiquei mobile (< 640px)?
- [ ] Verifiquei se documentação top-level do arquivo ainda faz sentido (Regra 22)?
- [ ] Atualizei tipos compartilhados se aplicável?
- [ ] Sem regressão em paywall / auth / billing?

## 7. Quando NÃO usar essa skill

- Criar arquivo novo do zero → usa `creating-component` ou `creating-endpoint`
- Adicionar feature completamente nova sem tocar em existente → usa `creating-feature`

Esta skill é especificamente pra **mudar o que já existe**.

## 8. Regra de ouro

**Tempo gasto em análise de impacto < tempo perdido com bug em produção.**

Se a análise revelou que o impacto é grande e arriscado:
- Considera fazer em PR menor
- Considera adicionar testes antes de mudar
- Considera feature flag pra rollout gradual
- Considera pedir review específico

## Anti-padrões (NÃO faça)

❌ "Vou alterar só isso" sem grep nos consumidores
❌ Renomear campo de DTO sem checar frontend e analytics
❌ Remover prop "não usada" sem checar uso dinâmico
❌ Mexer em CSS global sem testar todas as telas
❌ Refatorar service sem rodar testes
❌ Mudar query de banco sem checar índices afetados
❌ Alterar shape de response de API sem versionamento
❌ Confiar que IDE achou todos os usos (use grep)
❌ Commit sem revisar o diff final
