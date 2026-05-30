---
name: creating-component
description: Use this skill whenever creating a new React component (page, layout, UI widget, form, modal, card, etc.) in the RadarAuto codebase. Covers Rule of Three for abstraction, TypeScript strict mode, file documentation, mobile-first responsiveness, accessibility, and design system integration. Triggers on any request like "crie um componente", "novo card", "vamos fazer uma tela", "preciso de um modal", "tratar erro", "setError", or whenever code generation produces a .tsx/.jsx file in the frontend.
---

# Creating a Component — RadarAuto

Componente novo no RadarAuto **NUNCA é só "criar um .tsx"**. Segue checklist abaixo.

## 0. Pré-flight: este componente deveria existir?

Antes de criar, responda:

- **Já existe algo no design system que resolve?** Se sim → usa o existente.
- **É a 1ª ou 2ª duplicação de algo parecido?** Se sim → copia inline, NÃO abstrai ainda (Rule of Three — Regra 13).
- **É a 3ª vez que esse padrão aparece?** Aí sim, extrai pro design system em `packages/ui/` (ou equivalente).

Se a resposta for "esse componente é único e necessário", segue pro passo 1.

## 1. Localização do arquivo

| Tipo                                    | Localização                                              |
| --------------------------------------- | -------------------------------------------------------- |
| Componente reutilizável (design system) | `packages/ui/src/components/<Name>/`                     |
| Componente de feature específica        | `apps/web/src/features/<feature>/components/<Name>/`     |
| Página/rota                             | `apps/web/src/app/<route>/page.tsx` (Next.js App Router) |
| Layout compartilhado                    | `apps/web/src/app/<route>/layout.tsx`                    |

## 2. Estrutura do arquivo

Todo componente vai em uma **pasta própria** quando tiver mais de 1 arquivo:

```
Button/
├── Button.tsx          # Componente principal
├── Button.types.ts     # Tipos exportados (props, variants)
├── Button.stories.tsx  # Storybook (opcional, só design system)
└── index.ts            # Re-export
```

Se for componente trivial (< 80 linhas, sem tipos extras), pode ser arquivo único: `Button.tsx`.

## 3. Documentação obrigatória (Regra 22)

**TODO arquivo começa com comentário top-level**:

```tsx
/**
 * <NomeDoComponente>
 *
 * Propósito: <o que faz, em 1 linha>
 * Contexto: <onde é usado, ex: "usado em VehicleCard e StorePage">
 * Regras importantes: <ex: "respeita paywall via prop `canViewContact`">
 * Performance: <ex: "memoizado, recarrega só se v.id mudar">
 * A11y: <ex: "role=button, navegável por teclado">
 */
```

Se o componente é trivial (Spacer, Divider), comentário curto de 1 linha basta.

## 4. TypeScript strict (Regra 26)

- `tsconfig` é strict. Sem `any` (exceto adapters tipados com `// @ts-expect-error <motivo>`).
- Props sempre tipadas em interface/type **separada**, exportada:

```tsx
export type ButtonProps = {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};
```

- Tipos de **domínio** (Vehicle, Lead, User) vêm de `@radar/types` (pacote compartilhado), NUNCA redeclarados localmente.

## 5. Mobile-first (Regra 3)

O componente nasce mobile, escala pra desktop. **Não o contrário.**

- Padding/font-size começam pequenos, crescem com breakpoints
- Touch areas mínimas: `44x44px` em qualquer elemento clicável
- Teste mental: "isso funciona com polegar?"
- Use Tailwind responsive prefixes: `text-sm md:text-base lg:text-lg`

## 6. Estados visuais obrigatórios

Todo componente que carrega dados ou aceita interação precisa cobrir:

- **Loading** — skeleton, spinner, ou disabled state
- **Empty** — mensagem clara + CTA (use `<EmptyState>` do design system)
- **Error** — feedback visual + ação de retry quando aplicável
- **Disabled** — opacity + cursor + ARIA `aria-disabled`

Sem isso, o componente está incompleto.

## 7. Acessibilidade (Regra 32)

- Contraste mínimo 4.5:1 (verifique com devtools)
- Ícones-only → `aria-label` obrigatório
- `<button>` real pra ações, `<a>` real pra navegação
- Focus visível (não remover `outline` sem substituir)
- `<label htmlFor>` associado a `<input id>`
- Imagens com `alt` (vazio `alt=""` se decorativa)

## 8. Performance (Regra 4)

- `React.memo` apenas se profiler mostrar re-render desnecessário
- `useMemo`/`useCallback` apenas com dependências caras
- Imagens com `next/image` (lazy loading nativo)
- Listas longas → virtualizar (TanStack Virtual)
- Não criar funções inline em props de componentes memoizados

## 9. Frontend nunca decide regra de negócio (Regras 5, 6)

- Componente **renderiza** baseado em flags vindas do backend (`canViewContact`, `isPremium`, etc)
- Componente **nunca calcula** permissão localmente
- Componente **nunca esconde** dado sensível com blur achando que protege — se o usuário não pode ver, **o dado não chega**

## 10. Tamanho do componente (Regra 14)

- Meta: < 150 linhas
- Se passar disso, refatorar: extrair sub-componentes, mover lógica pra hooks
- Hooks complexos → arquivo separado em `hooks/use<Algo>.ts`

## 11. Estado (Regra 24)

- **Local** (toggle, input): `useState`
- **Compartilhado entre componentes próximos**: prop drilling ou Context pequeno
- **Global de cliente** (tema, sidebar aberta): Zustand
- **Server state** (dados de API): TanStack Query — NUNCA Zustand pra cachear API

## 12. Antes de marcar como pronto

Checklist final:

- [ ] Tem documentação top-level
- [ ] Tipos exportados, sem `any`
- [ ] Mobile-first testado (DevTools < 640px)
- [ ] Estados loading/empty/error cobertos
- [ ] Navegável por teclado
- [ ] Reutiliza Button/Card/etc do design system
- [ ] < 150 linhas
- [ ] Sem regra de negócio embutida
- [ ] Sem console.log

## Anti-padrões (NÃO faça)

❌ Criar componente "genérico demais" no primeiro uso (overengineering — Regra 15)
❌ Duplicar lógica que já existe em hook do design system
❌ Calcular `if (user.plan === "premium")` no componente (deve ser flag do backend)
❌ Esconder dado sensível só visualmente (blur sem proteção real)
❌ Esquecer estado de loading/erro
❌ Hardcoded de cores/fontes (use CSS vars do design system)
❌ `style={{}}` inline pra coisas que já estão em CSS

## Tratamento de erros (catch/setError)

Todo componente que dispara request à API trata erros por **catálogo central** — não usa `instanceof ApiClientError` direto.

### Padrão único

```tsx
import { toFriendlyError } from "@/lib/error-messages";

try {
  await usersApi.updateProfile({ name });
  onClose();
} catch (err) {
  setError(toFriendlyError(err));
}
```

`toFriendlyError(err)` resolve qualquer erro (ApiClientError do backend, `TypeError` de network, `AbortError`) numa string PT-BR amigável vinda do catálogo `apps/web/src/lib/error-messages.ts`.

### Quando ramificar lógica por código de erro

Use `resolveError(err)` em vez de `toFriendlyError` quando precisa do `code` pra decidir UI (ex.: título diferente por tipo de erro):

```tsx
import { resolveError } from "@/lib/error-messages";

const { code, message } = resolveError(err);
const title = code === "CNPJ_NOT_FOUND" ? "CNPJ não encontrado" : "Erro na consulta";
setCnpjError({ title, message });
```

### 401 e sessão expirada — não tratar manualmente

`apiFetch` já dispara `radar:auth-expired` automaticamente quando vem 401 com code `UNAUTHORIZED`/`SESSION_INVALID`. O `useAuthExpired()` no layout autenticado captura, limpa store e redireciona pra `/login?expired=1`. **Componentes nunca precisam tratar 401**.

### Visual

Use a classe `.auth-error` (já no design system) — banner vermelho com border esquerda, ícone, shake horizontal ao aparecer:

```tsx
{
  error && (
    <div key={error} className="auth-error" role="alert">
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{error}</span>
    </div>
  );
}
```

`key={error}` faz reanimar shake quando o mesmo erro reaparece.

### Anti-patterns

- ❌ `setError(err instanceof ApiClientError ? err.message : "Erro genérico.")` — perde casos network/timeout e cria string solta fora do catálogo
- ❌ `setError("Erro ao salvar")` — string custom escapa do catálogo, vira inconsistência
- ❌ Tentar redirecionar pra login manualmente em 401 — auto-logout já faz, vai dar redirect duplicado
- ❌ Mostrar `err.message` cru no UI sem passar por catálogo
