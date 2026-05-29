---
name: handling-pii-data
description: Use this skill whenever code touches personally identifiable information (PII) — names, emails, phones, CPF, addresses, location data, photos of people, lead data, employee data, or any personal user/lead/employee information in RadarAuto. Enforces LGPD compliance, soft-delete patterns, audit logging, log sanitization, and right-to-be-forgotten flows. Triggers on requests involving "cadastrar usuário", "salvar lead", "exportar dados", "deletar conta", "buscar por email/telefone", "log de auditoria", "exclusão de dados", or any code path handling personal fields.
---

# Handling PII Data — RadarAuto

Dado pessoal **NUNCA é "só mais um campo no banco"**. LGPD + boas práticas obrigatórias.

## 0. Mapeamento do que é PII no RadarAuto

| Categoria | Exemplos | Sensibilidade |
|---|---|---|
| Identificadores diretos | nome completo, email, telefone, WhatsApp, CPF/CNPJ | **Alta** |
| Localização | endereço, cidade exata, lat/lng | **Alta** |
| Comportamento atribuível | histórico de leads, favoritos, buscas | **Média** |
| Conta | username, senha hash, role | **Média** |
| Identificadores indiretos | userId, leadId, sessionId | **Baixa** (opacos) |

Tudo "Alta/Média" segue esta skill.

## 1. Coleta: pedir só o necessário

Antes de adicionar um campo PII no formulário/API:

- **Por que precisamos disso?** (justificativa de negócio)
- **Por quanto tempo precisamos?** (retenção)
- **Quem vai acessar?** (escopo)
- **Pode ser opcional?** (sempre preferir opcional)

Se não há resposta clara → não coleta.

## 2. Armazenamento

### Campos sensíveis criptografados

```ts
// schema (Prisma):
model User {
  id            String   @id @default(uuid())
  email         String   @unique  // PII — pode ser indexado, mas considerar hash
  phone         String?           // PII — encrypted at rest
  cpf           String?           // PII alta — encrypted + apenas última verificação visível
  passwordHash  String            // bcrypt/argon2, NUNCA texto puro
  createdAt     DateTime @default(now())
  deletedAt     DateTime?         // soft-delete
}
```

**Regras:**
- Senha: **bcrypt** ou **argon2id** (nunca SHA, nunca texto puro)
- CPF/cartão: encrypted at rest (chave em vault, não no código)
- Email: pode ser plaintext pra lookup, mas log com hash
- Telefone: encrypted at rest se possível

### Soft-delete (Regra 29)

**Nunca DELETE físico** em entidades com PII ou de domínio relevante:

```ts
// ❌ ERRADO
await prisma.user.delete({ where: { id } });

// ✅ CERTO
await prisma.user.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    email: `deleted-${id}@anonymized.local`,  // anonimizar pra liberar uniq
    phone: null,
    name: "[Removido]",
    // mantém id pra integridade referencial
  },
});
```

E **toda query** filtra: `WHERE deletedAt IS NULL`.

## 3. Logs (Regra 28)

**NUNCA logar PII em texto plano.**

```ts
// ❌ ERRADO
logger.log(`Lead criado: ${lead.name}, ${lead.email}, ${lead.phone}`);

// ✅ CERTO
logger.log({
  action: "lead.created",
  leadId: lead.id,
  vehicleId: lead.vehicleId,
  source: lead.source,
  correlationId: ctx.correlationId,
  // SEM nome, email, telefone
});
```

Quando precisar correlacionar PII em debug:
- Usar **hash determinístico** (SHA-256 com salt do app)
- Ou logar apenas **iniciais + ID** (`"J*** S*** [id=abc]"`)

## 4. Respostas de API (paywall + filtragem)

PII de terceiros (ex: telefone da loja pro comprador) **só vem se houver permissão** (Regra 8):

```ts
async findOne(id: string, user: User) {
  const vehicle = await this.repo.findOne(id);
  const canContact = this.paywall.canViewContact(user);

  return {
    ...vehicle,
    store: {
      id: vehicle.store.id,
      name: vehicle.store.name,
      // PII só pra premium:
      phone: canContact ? vehicle.store.phone : null,
      whatsapp: canContact ? vehicle.store.whatsapp : null,
      email: canContact ? vehicle.store.email : null,
      canViewContact: canContact,
    },
  };
}
```

Frontend renderiza UI com a flag. Dado em si só chega autorizado.

## 5. Auditoria obrigatória (Regra 29)

Operações **destrutivas** ou **sensíveis** em PII têm log de auditoria separado:

```ts
// audit-log.service.ts
async logSensitiveAction(input: {
  actor: User;           // quem fez
  action: string;        // o quê
  resource: string;      // em qual recurso
  resourceId: string;
  before?: unknown;      // estado anterior (sanitizado)
  after?: unknown;       // estado novo (sanitizado)
  correlationId: string;
}) {
  await this.auditRepo.create({
    ...input,
    timestamp: new Date(),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}
```

**Ações que exigem auditoria:**
- Exclusão de conta (própria ou de outrem)
- Exportação de dados (LGPD direito de portabilidade)
- Mudança de email/telefone
- Acesso administrativo a dados de outro usuário
- Aprovação/reprovação envolvendo PII
- Anonimização

## 6. Confirmação dupla pra ações destrutivas (Regra 29)

Frontend exige confirmação explícita pra:
- Excluir conta
- Excluir funcionário
- Remover lead
- Anonimizar dados

Padrão UX: modal com input que pede a pessoa digitar "EXCLUIR" ou nome do recurso.

Backend: aceita só com flag `confirmed: true` no payload + log de auditoria.

## 7. Direito de acesso e exclusão (LGPD)

Endpoints obrigatórios pra LGPD:

### `GET /me/data-export`
- Retorna todos os dados do usuário em formato estruturado (JSON)
- Inclui: perfil, listings, leads gerados, eventos atribuíveis
- Audita a operação

### `DELETE /me/account` (exclusão própria)
- Soft-delete + anonimização
- Mantém dados agregados anônimos (analytics, métricas)
- Confirmação dupla
- Audita

### Admin → exclusão por solicitação
- Mesmo fluxo + ticket de origem documentado

## 8. Retenção de dados

| Tipo | Retenção | Após retenção |
|---|---|---|
| Conta ativa | Indefinido | — |
| Conta inativa > 24 meses | Aviso → anonimização | Dados agregados ficam |
| Leads inativos > 12 meses | Anonimizar (nome, contato) | Métricas ficam |
| Eventos de analytics | 18 meses | Agregar e anonimizar |
| Logs de auditoria | 5 anos (compliance) | Arquivar offline |
| Logs técnicos com PII | 30 dias | Deletar |

Job programado roda mensalmente.

## 9. Sanitização em erros

Stack traces, mensagens de erro pra usuário, ou Sentry **não podem ter PII**:

```ts
// ❌ ERRADO
throw new Error(`Email ${user.email} já existe no sistema`);

// ✅ CERTO
throw new ConflictException({
  code: "EMAIL_ALREADY_EXISTS",
  message: "Este email já está cadastrado.",
  // SEM o email no detalhe
});
```

Sentry configurado com `beforeSend` que limpa PII conhecido.

## 10. Compartilhamento com terceiros

Se PII vai pra serviço externo (analytics, billing, email):

- **Mapeado e documentado** (quem recebe o quê)
- **Política de privacidade reflete**
- **DPA assinado** (Data Processing Agreement)
- **Mínimo necessário** (ex: Stripe precisa email/nome, não CPF)

## 11. Antes de marcar como pronto

- [ ] Coleta tem justificativa de negócio documentada
- [ ] Campos sensíveis armazenados corretamente (encrypted/hashed)
- [ ] Soft-delete em uso, sem DELETE físico
- [ ] Logs sem PII (ou hasheado)
- [ ] Resposta de API filtra PII por permissão
- [ ] Auditoria pra operações sensíveis
- [ ] Confirmação dupla pra ações destrutivas
- [ ] Documentado em política de retenção se for tipo novo de dado
- [ ] Sem PII em mensagens de erro vazadas pro client
- [ ] Sentry configurado pra sanitizar

## Anti-padrões (NÃO faça)

❌ `console.log(user)` (objeto inteiro com PII)
❌ Senha em texto puro ou hash fraco (MD5, SHA-1)
❌ DELETE físico de usuário/lead/listing
❌ Logar `req.body` cru em endpoint de cadastro
❌ Email em URL como query param (`?email=foo@bar.com`)
❌ Retornar email/telefone na resposta pra quem não tem permissão
❌ Stack trace com PII chegando no client/Sentry
❌ "Vai exportar tudo do usuário" sem audit log
❌ Excluir conta sem confirmação dupla
❌ Compartilhar dados com terceiros sem DPA
❌ Reter dados indefinidamente "porque pode precisar"
