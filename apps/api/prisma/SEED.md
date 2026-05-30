# Seed do banco

Cria 3 contas de teste idempotentes pra desenvolvimento local.

## Credenciais

| Tipo        | Email                       | Senha        |
| ----------- | --------------------------- | ------------ |
| Lojista     | `lojista@radarauto.test`    | `senha12345` |
| Funcionario | `func@radarauto.test`       | `senha12345` |
| Revendedor  | `revendedor@radarauto.test` | `senha12345` |

O lojista e o funcionario compartilham a mesma `Store` (FlashCar Store - CNPJ 11.222.333/0001-81).

## Rodar

```bash
pnpm --filter @radar/api seed
```

Ou junto com reset do banco:

```bash
pnpm --filter @radar/api prisma migrate reset
```

## Seguranca

- Bloqueado em `NODE_ENV=production` (throw)
- Senhas hasheadas com argon2id (mesmo algoritmo do AuthService)
- CPFs e CNPJs sao validos pelo dígito verificador mas FICTICIOS (nao correspondem a pessoas/empresas reais)

## Avisos

- Se voce tentar cadastrar uma conta nova com um dos CPFs/CNPJs do seed, vai dar conflito - use outros valores
- O seed e idempotente (upsert), mas se mudar o schema, pode falhar ate atualizar
