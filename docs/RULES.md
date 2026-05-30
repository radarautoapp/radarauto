# RADARAUTO — REGRAS OFICIAIS DE DESENVOLVIMENTO

> Versão consolidada. Toda decisão técnica do projeto passa por essas regras.

━━━━━━━━━━━━━━━━━━━━

# REGRA 1 — UX FIRST

━━━━━━━━━━━━━━━━━━━━

A experiência do usuário SEMPRE vem primeiro.

Toda decisão deve priorizar:

- clareza
- simplicidade
- velocidade
- fluidez
- facilidade de uso
- conforto visual
- experiência mobile

━━━━━━━━━━━━━━━━━━━━

# REGRA 2 — DESIGN FIRST

━━━━━━━━━━━━━━━━━━━━

ANTES de implementar:

- backend
- APIs
- autenticação
- billing
- analytics
- banco
- integrações
- segurança

DEVEMOS PRIMEIRO construir:

- experiência visual
- design system
- telas
- navegação
- componentes
- responsividade
- animações
- estados visuais
- skeletons
- loading states

Inicialmente utilizar:

- fake data
- mock data

**Critério de saída do Design-First**:
quando a tela tem fluxo navegável end-to-end com mock data, estados de erro/loading/vazio definidos, e foi validada visualmente, pode partir pro backend daquela feature. Não precisa ter o app inteiro mockado pra começar o backend de UMA feature.

━━━━━━━━━━━━━━━━━━━━

# REGRA 3 — MOBILE FIRST

━━━━━━━━━━━━━━━━━━━━

Toda tela deve nascer:

- mobile-first
- tablet-ready
- desktop-ready

Sempre validar:

- touch areas
- responsividade
- overflow
- spacing
- navegação mobile

━━━━━━━━━━━━━━━━━━━━

# REGRA 4 — PERFORMANCE É FEATURE

━━━━━━━━━━━━━━━━━━━━

Tudo deve parecer:

- instantâneo
- fluido
- leve
- rápido

Sempre otimizar:

- renderização
- rerenders
- imagens
- loading
- cache
- bundle size
- lazy loading
- queries
- animações

━━━━━━━━━━━━━━━━━━━━

# REGRA 5 — FRONTEND NUNCA É CONFIÁVEL

━━━━━━━━━━━━━━━━━━━━

Frontend NÃO é segurança.

Blur NÃO protege dados.

Usuários podem:

- interceptar requests
- alterar payloads
- modificar JavaScript
- remover bloqueios visuais
- falsificar estados

━━━━━━━━━━━━━━━━━━━━

# REGRA 6 — BUSINESS RULES SOMENTE NO BACKEND

━━━━━━━━━━━━━━━━━━━━

TODA regra de negócio deve existir:

# SOMENTE NO BACKEND

O frontend NUNCA deve controlar:

- permissões
- billing
- ranking
- lead scoring
- segurança
- paywall
- autenticação
- autorização
- regras premium
- lifecycle de anúncios
- cálculos importantes
- validações críticas
- acesso premium
- controle de assinatura
- analytics críticos

━━━━━━━━━━━━━━━━━━━━

# REGRA 7 — BACKEND É A FONTE DA VERDADE

━━━━━━━━━━━━━━━━━━━━

O backend é:

# a única fonte da verdade do sistema

Toda lógica crítica deve existir:

- services
- guards
- policies
- validation layers
- domain rules

━━━━━━━━━━━━━━━━━━━━

# REGRA 8 — PAYWALL REAL

━━━━━━━━━━━━━━━━━━━━

Blur é apenas UX.

Se o usuário não possui permissão:

# o backend NÃO deve enviar os dados

Nunca enviar:

- telefone
- WhatsApp
- email
- localização exata
- insights premium
- analytics premium

**Padrão de flags de permissão:**
Frontend pode receber **flag booleana** (`canViewContact: true/false`) calculada pelo backend. O DADO em si (telefone, email, etc) só vem se a flag for true. Frontend usa a flag pra renderizar UI, mas NUNCA assume — sempre tenta buscar e o backend nega se não tiver permissão.

━━━━━━━━━━━━━━━━━━━━

# REGRA 9 — VALIDAÇÃO CRÍTICA NO BACKEND

━━━━━━━━━━━━━━━━━━━━

Toda validação importante deve ocorrer:

# no backend

Validação frontend serve apenas para:

- UX
- feedback rápido
- experiência

━━━━━━━━━━━━━━━━━━━━

# REGRA 10 — AUTORIZAÇÃO NO BACKEND

━━━━━━━━━━━━━━━━━━━━

Toda autorização deve ocorrer:

# no backend

Utilizar:

- Guards
- Policies
- Permission Layers
- Feature Gates

━━━━━━━━━━━━━━━━━━━━

# REGRA 11 — SAFE CHANGES

━━━━━━━━━━━━━━━━━━━━

NUNCA alterar algo isoladamente.

Antes de alterar qualquer:

- componente
- hook
- service
- endpoint
- DTO
- store
- layout
- módulo

SEMPRE analisar:

- impactos arquiteturais
- impactos visuais
- impactos em UX
- impactos em performance
- impactos em mobile
- impactos em analytics
- impactos em segurança
- impactos em billing
- impactos em ranking
- impactos em estados globais

━━━━━━━━━━━━━━━━━━━━

# REGRA 12 — ECOSSISTEMA COMPLETO

━━━━━━━━━━━━━━━━━━━━

NUNCA pensar:

# "vou alterar apenas isso"

SEMPRE pensar:

# "como isso impacta o sistema inteiro?"

━━━━━━━━━━━━━━━━━━━━

# REGRA 13 — REUTILIZAÇÃO COM CRITÉRIO

━━━━━━━━━━━━━━━━━━━━

Sempre reutilizar componentes do design system:

- Button
- Card
- Modal
- Input
- Sidebar
- layouts
- hooks
- services
- stores

Evitar:

- duplicação injustificada
- componentes paralelos
- lógica repetida

**Rule of Three:**
Componentes ficam isolados até a 3ª duplicação. Aí extrai pro design system. Antes disso, copiar é mais barato que abstrair errado. Abstrações prematuras travam o projeto mais do que duplicação controlada.

━━━━━━━━━━━━━━━━━━━━

# REGRA 14 — COMPONENTES PEQUENOS

━━━━━━━━━━━━━━━━━━━━

Todo componente deve ser:

- pequeno
- reutilizável
- desacoplado
- previsível

Se ficar grande:

- dividir
- modularizar
- extrair responsabilidades

━━━━━━━━━━━━━━━━━━━━

# REGRA 15 — SEM OVERENGINEERING

━━━━━━━━━━━━━━━━━━━━

NUNCA criar:

- abstrações inúteis
- patterns desnecessários
- factories sem necessidade
- interfaces inúteis
- camadas excessivas
- complexidade antecipada

━━━━━━━━━━━━━━━━━━━━

# REGRA 16 — TOKEN EFFICIENCY

━━━━━━━━━━━━━━━━━━━━

Sempre:

- reutilizar código
- evitar boilerplate
- evitar duplicação
- evitar verbosity
- gerar apenas o necessário

Pergunta obrigatória:

# "isso realmente precisa existir?"

━━━━━━━━━━━━━━━━━━━━

# REGRA 17 — OBJECTIVE COMMUNICATION

━━━━━━━━━━━━━━━━━━━━

Respostas devem ser:

- técnicas
- objetivas
- diretas
- compactas
- organizadas

NUNCA:

- enrolar
- repetir contexto
- usar frases motivacionais
- fazer introduções longas
- explicar o óbvio

━━━━━━━━━━━━━━━━━━━━

# REGRA 18 — ANALYTICS COM PROPÓSITO

━━━━━━━━━━━━━━━━━━━━

Eventos importantes devem ser rastreados:

- vehicle_view
- whatsapp_click
- favorite_added
- gallery_open
- lead_created
- search_performed
- scroll_depth
- listing_reactivated

**Critério obrigatório:**
Eventos devem responder a uma pergunta de negócio mensurável. Se o evento não vai virar uma métrica num dashboard ou alimentar lead scoring/ranking, não cria. Cada evento novo precisa de dono e propósito documentado.

━━━━━━━━━━━━━━━━━━━━

# REGRA 19 — RANKING INTELIGENTE

━━━━━━━━━━━━━━━━━━━━

NUNCA ordenar apenas por:

```
created_at DESC
```

O ranking deve considerar:

- freshness
- engagement
- lead score
- quality score
- premium boost
- velocity
- comportamento

━━━━━━━━━━━━━━━━━━━━

# REGRA 20 — LEAD SCORING

━━━━━━━━━━━━━━━━━━━━

Implementar:

- COLD
- WARM
- HOT

Baseado em:

- recorrência
- favoritos
- tempo de permanência
- interações
- comportamento
- WhatsApp clicks

━━━━━━━━━━━━━━━━━━━━

# REGRA 21 — DESIGN SYSTEM OBRIGATÓRIO

━━━━━━━━━━━━━━━━━━━━

Criar design system reutilizável.

Componentes obrigatórios:

- Button
- Card
- Modal
- Sidebar
- VehicleCard
- BlurOverlay
- PremiumBadge
- AnalyticsChart
- DataTable

━━━━━━━━━━━━━━━━━━━━

# REGRA 22 — DOCUMENTAÇÃO OBRIGATÓRIA

━━━━━━━━━━━━━━━━━━━━

TODO arquivo criado DEVE possuir:
comentário top-level explicando:

- propósito
- responsabilidade
- contexto
- regras importantes
- impacto arquitetural
- segurança
- performance

NUNCA criar arquivos sem documentação.

━━━━━━━━━━━━━━━━━━━━

# REGRA 23 — ARQUITETURA OFICIAL

━━━━━━━━━━━━━━━━━━━━

Arquitetura oficial:

- Modular Monolith
- Feature-based architecture
- Clean Architecture leve
- Repository Pattern
- DTO Pattern
- SOLID

NUNCA utilizar:

- Redux
- DDD exagerado
- overengineering

**Sobre microservices:**
Default é modular monolith. Extração de microservice exige justificativa documentada (volumetria comprovada, ownership de time, ou requisito de SLA distinto). Nunca por modinha ou "porque escala".

━━━━━━━━━━━━━━━━━━━━

# REGRA 24 — GERENCIAMENTO DE ESTADO

━━━━━━━━━━━━━━━━━━━━

Utilizar:

- **Zustand** → client state (UI, preferências, estado local complexo)
- **TanStack Query** → server state (cache de API, mutations, refetch)

Esses dois são complementares, NÃO competem. TanStack cuida do estado vindo da API, Zustand cuida do estado puramente do client.

NUNCA:

- usar Zustand pra cachear API (use TanStack)
- Redux
- Context gigantes
- estados globais desnecessários
- duplicar estado entre as duas libs

━━━━━━━━━━━━━━━━━━━━

# REGRA 25 — RADARAUTO É PREMIUM

━━━━━━━━━━━━━━━━━━━━

O RadarAuto NÃO deve parecer:

- um CRUD
- um ERP
- um sistema antigo
- um marketplace genérico

O RadarAuto deve parecer:

# uma plataforma premium de inteligência automotiva moderna.

━━━━━━━━━━━━━━━━━━━━

# REGRA 26 — TYPESCRIPT STRICT

━━━━━━━━━━━━━━━━━━━━

TypeScript em modo `strict: true`.

`any` é PROIBIDO (exceto em adapters de libs sem tipos, documentado com `// @ts-expect-error` ou comentário explicativo).

Tipos de domínio (Vehicle, Lead, Listing, User, etc) vivem em `domain/types` e são compartilhados entre frontend e backend via:

- package monorepo, ou
- geração automática de tipos a partir do schema do backend

Sem isso, "validação só no backend" vira pesadelo quando o frontend manda dado errado e nem sabe.

━━━━━━━━━━━━━━━━━━━━

# REGRA 27 — TESTES POR PRIORIDADE

━━━━━━━━━━━━━━━━━━━━

Cobertura obrigatória:

**Backend:**

- testes unitários em services com regra de negócio (ranking, lead scoring, paywall, cálculos críticos)
- testes de integração em endpoints críticos (auth, billing, lifecycle de anúncios)

**Frontend:**

- testes em hooks com lógica
- smoke tests em fluxos críticos (cadastro de veículo, checkout, login)

**Não obrigatório:**

- snapshot tests de componente visual puro (overkill nessa fase)
- coverage 100% (foco em o que importa)

"Testes em tudo" mata o projeto. "Sem testes" mata em produção. Esse meio-termo funciona.

━━━━━━━━━━━━━━━━━━━━

# REGRA 28 — TRATAMENTO DE ERROS PADRONIZADO

━━━━━━━━━━━━━━━━━━━━

## Contrato da API

Toda API retorna erros no formato:

```json
{ "code": "ERROR_CODE", "message": "Mensagem para usuário", "details": {} }
```

Com códigos HTTP corretos (400, 401, 403, 404, 422, 500).

Codes em `SCREAMING_SNAKE_CASE`, prefixados por domínio quando útil
(`CNPJ_NOT_FOUND`, `VERIFICATION_INVALID_CODE`, `SESSION_NOT_FOUND`).
Code é estável — não renomeia depois (frontend depende dele).

## Backend

- Sempre `throw new XxxException({ code, message, details? })` — nunca `throw new Error("texto cru")`
- `HttpExceptionFilter` global serializa pro formato padrão automaticamente
- Logar com correlation ID pra debug (Regra 31)
- Sanitizar dados sensíveis em logs (password, cpf, code, tokens)
- NUNCA mostrar stack trace pro usuário (filter remove em 5xx)

## Frontend — Catálogo central de mensagens

Toda mensagem de erro mostrada ao usuário passa pelo catálogo central
em `apps/web/src/lib/error-messages.ts`:

```typescript
import { toFriendlyError } from "@/lib/error-messages";

try {
  await usersApi.updateProfile({ name });
} catch (err) {
  setError(toFriendlyError(err)); // PADRÃO ÚNICO
}
```

- `toFriendlyError(err)` resolve qualquer erro (`ApiClientError`, `TypeError` network,
  `AbortError`) em string PT-BR via mapa local com fallback pra `serverMessage`
- `resolveError(err)` retorna `{ code, message }` quando precisa ramificar lógica
- Mensagens do catálogo **prevalecem** sobre as do backend (consistência + i18n-ready)
- Todo novo `code` lançado no backend **DEVE** ter entrada correspondente no catálogo

## Frontend — Auto-logout em sessão expirada

`apiFetch` dispara evento `radar:auth-expired` automaticamente quando vem 401
com codes `UNAUTHORIZED`/`SESSION_INVALID`. Hook `useAuthExpired()` no layout
autenticado limpa o store e redireciona pra `/login?expired=1`.

**Componentes nunca tratam 401 manualmente.**

## Frontend — Visual

- Banner inline `.auth-error` (vermelho com border esquerda + shake horizontal)
  pra erros recuperáveis. Usa `key={error}` pra reanimar a cada novo erro
- ErrorBoundary global por rota pra erros inesperados de render
- NUNCA mostrar `err.message` cru — sempre via catálogo
- NUNCA string solta tipo `setError("Erro ao salvar")` — fere consistência

Ver skills `creating-component` e `creating-endpoint` pra checklist completo.

━━━━━━━━━━━━━━━━━━━━

# REGRA 29 — LIFECYCLE DE DADOS (LGPD)

━━━━━━━━━━━━━━━━━━━━

Dados de usuários e leads têm política de retenção definida.

**Anúncios:**

- NUNCA deletados fisicamente
- Soft-delete obrigatório
- Lifecycle: DRAFT → ACTIVE → EXPIRED/SOLD/BLOCKED

**Leads:**

- Podem ser anonimizados após X meses inativos (definir prazo)
- PII (nome, telefone, email) removível por solicitação

**Operações destrutivas:**

- Confirmação dupla no frontend
- Log de auditoria no backend (quem, quando, o quê)
- Rollback possível por janela de tempo (ex: 7 dias)

━━━━━━━━━━━━━━━━━━━━

# REGRA 30 — ENVIRONMENTS E SECRETS

━━━━━━━━━━━━━━━━━━━━

Três ambientes obrigatórios:

- `local` (desenvolvimento)
- `staging` (homologação)
- `production`

Secrets:

- NUNCA commitar `.env`
- Via vault (Doppler, AWS Secrets Manager, ou similar)
- Rotação periódica de credenciais críticas

Banco de produção:

- NUNCA acessado direto pelo time
- Toda operação via migration ou painel admin com auditoria
- Backup automatizado + restore testado

━━━━━━━━━━━━━━━━━━━━

# REGRA 31 — OBSERVABILIDADE DESDE O DIA 1

━━━━━━━━━━━━━━━━━━━━

Logs estruturados (JSON) com correlation ID.

Métricas básicas via OpenTelemetry (ou similar):

- latência (p50, p95, p99)
- error rate
- throughput
- saturação de recursos

Error tracking:

- Sentry (ou equivalente)
- Alertas em erros novos / spikes

Dashboard de saúde do sistema acessível desde o dia 1.

Complementa a Regra 18 (analytics de produto) com observabilidade técnica.

━━━━━━━━━━━━━━━━━━━━

# REGRA 32 — ACESSIBILIDADE COMO PADRÃO

━━━━━━━━━━━━━━━━━━━━

Componentes seguem WCAG AA mínimo:

- Contraste mínimo 4.5:1 (texto normal) / 3:1 (texto grande)
- Navegação por teclado funcional em todos os fluxos
- ARIA labels em ícones-only / botões sem texto
- Focus visível e consistente
- `<label>` associado a `<input>` corretamente

Toda nova tela passa por checklist de a11y antes de merge.

Produto premium hoje É acessível. Barato fazer desde o início, caro retroativo.

━━━━━━━━━━━━━━━━━━━━

# REGRA 33 — REGRA DE OURO DA TOMADA DE DECISÃO

━━━━━━━━━━━━━━━━━━━━

Toda decisão técnica passa por 3 filtros, nessa ordem:

1. **Impacta o usuário final?**
   → Sim: prioridade alta, mesmo se custoso

2. **Impacta o time?**
   → Sim: padronize agora, documente a decisão

3. **É só preferência pessoal?**
   → Sim: siga o padrão estabelecido, não invente

Quando alguém propor algo, passa pelos 3 filtros. Evita discussões intermináveis sobre detalhes que não importam.
