---
name: creating-endpoint
description: Use this skill whenever creating a new HTTP endpoint, API route, controller method, or backend resource in the RadarAuto NestJS backend. Covers DTO validation, authorization guards, error handling format, correlation IDs, analytics events, paywall flags, and business rule enforcement. Triggers on any request like "crie um endpoint", "novo route", "API pra fazer X", "preciso de um POST/GET", or whenever code generation produces a NestJS controller/service/module file.
---

# Creating an Endpoint — RadarAuto

Endpoint novo **NUNCA é só "@Get + return data"**. Segue checklist abaixo.

## 0. Pré-flight: este endpoint é necessário?

- **Já existe endpoint que faz isso?** Reutiliza.
- **É variação pequena de existente?** Adiciona query param ou body field, não cria novo.
- **É de fato um novo recurso/ação?** Segue pro passo 1.

## 1. Localização e arquitetura (Regra 23)

```
apps/api/src/
├── modules/
│   └── <feature>/                  # Feature-based (vehicles, leads, billing, etc)
│       ├── <feature>.controller.ts # Rota HTTP
│       ├── <feature>.service.ts    # Regra de negócio
│       ├── <feature>.module.ts     # Wiring (NestJS)
│       ├── dto/                    # DTOs in/out
│       │   ├── create-<x>.dto.ts
│       │   └── update-<x>.dto.ts
│       ├── entities/               # Domain entities
│       └── <feature>.repository.ts # Persistência (Repository Pattern)
```

NestJS + Modular Monolith + Repository Pattern (Regra 23).

## 2. Documentação obrigatória (Regra 22)

Todo arquivo com header:

```ts
/**
 * <Nome do arquivo>
 *
 * Propósito: <o que faz>
 * Contexto: <pertence a qual módulo, depende do quê>
 * Regras importantes: <ex: "exige role=lojista", "paywall aplicado em campo X">
 * Segurança: <ex: "valida ownership via guard X">
 * Performance: <ex: "query com índice em (status, user_id)">
 */
```

## 3. DTO obrigatório (Regra 23)

**Toda entrada e saída** de endpoint passa por DTO. Sem exceção.

```ts
// dto/create-vehicle.dto.ts
import { IsString, IsInt, Min, Max, IsOptional } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  brand!: string;

  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Por quê DTO:**

- Validação automática via `class-validator` + `ValidationPipe`
- Documentação automática (Swagger)
- Tipo seguro entre camadas
- Filtragem de campos extras (whitelist)

## 4. Validação no backend (Regra 9)

- DTO valida formato e ranges
- Service valida regras de negócio (ex: "preço não pode ser maior que 10x FIPE")
- Nunca confiar em validação do frontend

```ts
// Em ValidationPipe global (main.ts):
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // remove campos não declarados no DTO
    forbidNonWhitelisted: true, // erro se vier campo extra
    transform: true, // converte tipos (string → number)
  }),
);
```

## 5. Autorização via Guards (Regra 10)

**Toda rota** tem guard explícito. Sem rota "aberta" sem decisão.

```ts
@Controller("vehicles")
@UseGuards(AuthGuard("jwt"))  // autenticação global no controller
export class VehiclesController {

  @Post()
  @UseGuards(RoleGuard)
  @Roles("lojista", "funcionario")  // só esses podem criar
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: User) { ... }

  @Patch(":id")
  @UseGuards(OwnershipGuard)  // só dono pode editar
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) { ... }
}
```

**Tipos de guards comuns:**

- `AuthGuard` — usuário logado
- `RoleGuard` — role específica (lojista/funcionario/revendedor)
- `OwnershipGuard` — recurso pertence ao user
- `PlanGuard` — usuário tem plano suficiente (free/premium)

## 6. Paywall via flags (Regra 8)

Resposta de endpoint **filtra campos sensíveis** baseado em plano do usuário. NUNCA mandar e confiar no frontend pra esconder.

```ts
// service:
async findOne(id: string, user: User): Promise<VehicleResponseDto> {
  const vehicle = await this.repo.findOne(id);
  const isPremium = user.plan === "premium";

  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    price: vehicle.price,
    // Contato só pra premium:
    phone: isPremium ? vehicle.store.phone : null,
    whatsapp: isPremium ? vehicle.store.whatsapp : null,
    email: isPremium ? vehicle.store.email : null,
    // Flag pro frontend renderizar UI:
    canViewContact: isPremium,
  };
}
```

Frontend usa `canViewContact` pra UI (blur/CTA upgrade), mas o **dado em si só vem se for true**.

## 7. Erro padronizado (Regra 28)

Formato único em **toda** resposta de erro:

```json
{
  "code": "VEHICLE_NOT_FOUND",
  "message": "Veículo não encontrado.",
  "details": { "id": "abc-123" }
}
```

Códigos HTTP corretos:

- `400` — payload inválido (validação DTO)
- `401` — não autenticado
- `403` — autenticado mas sem permissão
- `404` — recurso não existe
- `409` — conflito (ex: cadastro duplicado)
- `422` — regra de negócio violada (ex: "preço acima de 10x FIPE")
- `500` — erro interno (não vazar detalhes)

```ts
// Use exceções nomeadas:
throw new NotFoundException({ code: "VEHICLE_NOT_FOUND", message: "..." });
throw new ForbiddenException({ code: "PLAN_REQUIRED", message: "..." });
```

Exception filter global formata a resposta. **NUNCA vazar stack trace pro client.**

## 8. Correlation ID + Logging (Regra 31)

Todo request tem `x-correlation-id` (gerado por middleware se não vier do client).

```ts
// Em todo log:
this.logger.log({
  correlationId: ctx.correlationId,
  userId: user.id,
  action: "vehicle.created",
  vehicleId: result.id,
});
```

**NUNCA logar:** senha, token, CPF, cartão, dados sensíveis. Sanitizar antes.

## 9. Eventos de analytics (Regra 18)

Se o endpoint dispara ação relevante pra negócio, gera evento:

```ts
async create(dto: CreateVehicleDto, user: User) {
  const vehicle = await this.repo.create({ ...dto, ownerId: user.id });
  await this.analytics.track({
    event: "vehicle.created",
    userId: user.id,
    properties: { vehicleId: vehicle.id, brand: dto.brand, price: dto.price },
  });
  return vehicle;
}
```

**Critério:** o evento responde a uma pergunta de negócio mensurável? Se não, não cria.

## 10. Regra de negócio NO service (Regras 6, 7)

Controller é **fino**: recebe DTO, chama service, retorna. Lógica vai no service.

```ts
// ❌ ERRADO — controller com lógica:
@Post()
async create(@Body() dto) {
  if (dto.price > dto.fipe * 10) throw new Error("Preço inválido");
  // ...
}

// ✅ CERTO — service contém regra:
@Post()
async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: User) {
  return this.service.create(dto, user);
}

// vehicles.service.ts
async create(dto: CreateVehicleDto, user: User) {
  this.validateBusinessRules(dto);  // regras testáveis isoladamente
  // ...
}
```

## 11. Testes (Regra 27)

Endpoint crítico (auth, billing, lifecycle, paywall) **tem teste de integração**:

```ts
// vehicles.controller.spec.ts
it("rejeita criação sem auth", async () => {
  const res = await request(app).post("/vehicles").send(payload);
  expect(res.status).toBe(401);
});

it("rejeita criação por revendedor", async () => {
  const res = await request(app)
    .post("/vehicles")
    .set("Authorization", `Bearer ${revendedorToken}`)
    .send(payload);
  expect(res.status).toBe(403);
});
```

Service com regra de negócio → teste unitário.

## 12. Lifecycle e soft-delete (Regra 29)

Recursos como `Vehicle`, `Listing`, `Lead` **nunca são deletados fisicamente**.

```ts
// Em vez de DELETE FROM vehicles WHERE id = X
// Use:
await this.repo.update(id, { status: "BLOCKED", deletedAt: new Date() });
```

E filtra em todas as queries: `WHERE deletedAt IS NULL`.

## 13. Antes de marcar como pronto

- [ ] DTO valida entrada
- [ ] Resposta tem DTO de saída (sem vazar campos extras)
- [ ] Guard de autenticação e autorização
- [ ] Erro no formato padrão
- [ ] Correlation ID nos logs
- [ ] Sem dado sensível em log
- [ ] Regra de negócio no service, não no controller
- [ ] Evento de analytics se aplicável
- [ ] Paywall aplicado em campos sensíveis
- [ ] Teste de integração se for endpoint crítico
- [ ] Documentado no Swagger (`@ApiTags`, `@ApiOperation`)

## Anti-padrões (NÃO faça)

❌ Confiar em validação do frontend e pular DTO
❌ Rota pública sem decisão explícita (sempre tem guard)
❌ Retornar entity raw do banco (sempre via DTO de resposta)
❌ Vazar dado sensível por "esquecimento" (revisar o objeto retornado)
❌ Lógica de negócio no controller
❌ `try/catch` engolindo erro sem log
❌ Stack trace vazando pro client
❌ Query sem filtro de `deletedAt`
❌ `console.log` em vez de logger estruturado

## Sincronizar com catálogo de erros do frontend

Todo novo `code` de erro lançado no backend **DEVE** ter entrada correspondente em `apps/web/src/lib/error-messages.ts`. Sem isso, a UI cai no fallback genérico "Algo deu errado".

### Convenção de codes

- `SCREAMING_SNAKE_CASE`
- Prefixado pelo domínio quando útil: `CNPJ_NOT_FOUND`, `VERIFICATION_INVALID_CODE`, `SESSION_NOT_FOUND`
- Estável (não renomeia depois — o frontend tem dependência)

### Fluxo

1. **Backend lança a exception** com `{ code, message }`:

```ts
throw new ConflictException({
  code: "CNPJ_ALREADY_EXISTS",
  message: "Este CNPJ já está cadastrado em outra loja.",
});
```

2. **`HttpExceptionFilter`** serializa pra `{ code, message, details? }` automático.

3. **Frontend** recebe via `apiFetch` → vira `ApiClientError(code, message, status)`.

4. **Adicionar entrada no catálogo** (`apps/web/src/lib/error-messages.ts`):

```ts
export const MESSAGES: Record<string, string> = {
  // ...
  CNPJ_ALREADY_EXISTS: "Este CNPJ já está cadastrado em outra loja.",
};
```

A mensagem do catálogo **prevalece** sobre a do backend (consistência + i18n-ready). A do backend serve como fallback se o code for desconhecido pelo frontend.

### Checklist ao criar endpoint

- [ ] Cada `code` novo lançado está documentado em `error-messages.ts`
- [ ] Mensagem amigável em PT-BR, segunda pessoa, acionável
- [ ] Code é estável (não vai renomear)
- [ ] `details` opcional pra dar contexto extra (não pra mensagem visível)

### Anti-patterns

- ❌ Lançar `throw new Error("texto cru")` — vira 500 genérico, perde rastreabilidade
- ❌ Usar mesmo `code` pra significados diferentes (ex.: `NOT_FOUND` pra user e veículo) — prefixe (`USER_NOT_FOUND`, `VEHICLE_NOT_FOUND`)
- ❌ Mensagem com tom técnico ("constraint violation") — sempre usuário-final
- ❌ Esquecer de adicionar entrada no catálogo do frontend (vai cair no fallback)

Ver `creating-component` pra o lado do consumidor (`toFriendlyError`, `resolveError`).
