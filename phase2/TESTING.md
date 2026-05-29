# Fase 2 — Auth · Testes de aceitação

Smoke tests pra confirmar que tudo subiu certo.

## 1. Health endpoint (continua público)

```bash
curl -i http://localhost:3001/api/v1/health
```

Esperado: `200 OK` com JSON `{ "status": "ok", ... }`

## 2. Rota protegida sem token

```bash
curl -i http://localhost:3001/api/v1/auth/me
```

Esperado: `401 Unauthorized` com `{ "code": "UNAUTHORIZED", "message": "..." }`

## 3. Cadastro de Revendedor

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/register/revendedor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos Silva",
    "email": "carlos@test.com",
    "password": "senha12345"
  }'
```

Esperado: `201` com `{ token, expiresAt, sessionId, user }`.

Salva o token: `TOKEN=<token-retornado>`

## 4. Cadastro de Lojista

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/register/lojista \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Souza",
    "email": "maria@flashcar.com",
    "password": "senha12345",
    "storeName": "Flash Car Store",
    "storePhone": "47999990000",
    "storeCity": "Blumenau",
    "storeState": "SC"
  }'
```

Esperado: `201` + cria Store e User vinculado.

## 5. Email duplicado

Tenta cadastrar Carlos de novo:

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/register/revendedor \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"carlos@test.com","password":"12345678"}'
```

Esperado: `409` com `{ "code": "EMAIL_ALREADY_EXISTS" }`

## 6. Login

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@test.com","password":"senha12345","deviceLabel":"MacBook"}'
```

Esperado: `200` + token + sessionId.

## 7. Senha errada (mensagem genérica)

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@test.com","password":"errada"}'
```

Esperado: `401` com `{ "code": "INVALID_CREDENTIALS" }` (mesma mensagem que email inexistente — não vaza).

## 8. /auth/me autenticado

```bash
curl -i http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: `200` com `{ user, sessionId }`.

## 9. Multi-sessão (login simultâneo)

Faz login 2 vezes (TOKEN1 e TOKEN2). Ambos devem funcionar em `/auth/me` simultaneamente.

## 10. Lista sessões ativas

```bash
curl -i http://localhost:3001/api/v1/auth/sessions \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: lista com todas as sessões ativas + flag `isCurrent`.

## 11. Logout (revoga só a sessão atual)

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: `204 No Content`. Token agora invalido em `/auth/me`.
Mas TOKEN2 ainda funciona.

## 12. Logout em todos os dispositivos

Loga de novo (TOKEN3). Depois:

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/logout-all \
  -H "Authorization: Bearer $TOKEN3"
```

Esperado: `200` com `{ revoked: N }`. Todas as sessões do user invalidadas.

## 13. Cadastro de funcionário (precisa lojista logado)

Loga como Maria (lojista), pega o token:

```bash
LOJISTA_TOKEN=...

curl -i -X POST http://localhost:3001/api/v1/auth/register/funcionario \
  -H "Authorization: Bearer $LOJISTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"João Func","email":"joao@flashcar.com","password":"senha12345"}'
```

Esperado: `201` com user criado.

## 14. Funcionário tentando cadastrar funcionário (deve falhar)

Tenta com TOKEN do Carlos (revendedor):

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/register/funcionario \
  -H "Authorization: Bearer $TOKEN_CARLOS" \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@y.com","password":"12345678"}'
```

Esperado: `403` com `{ "code": "FORBIDDEN" }`.

## 15. Frontend — fluxo manual

1. http://localhost:3000 → mostra CTAs "Entrar" / "Criar conta"
2. http://localhost:3000/cadastro → escolhe "Revendedor" ou "Lojista", preenche, submete
3. Após cadastro/login → home mostra nome + email + role + botão "Sair"
4. Recarregar a página → mantém logado (token em sessionStorage)
5. Botão "Sair" → revoga session, volta pra home não-autenticada
