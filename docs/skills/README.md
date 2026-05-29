# RadarAuto — Skill Pack

7 skills oficiais que operacionalizam as **33 regras de desenvolvimento** do RadarAuto.

Cada skill é um documento procedural que o agente lê **antes de executar tarefas correspondentes**. Skills evitam que o agente esqueça regras importantes em meio à pressão do dia-a-dia.

## Skills

| # | Skill | Quando usar |
|---|---|---|
| 1 | **creating-component** | Criar qualquer componente React novo (UI) |
| 2 | **creating-endpoint** | Criar qualquer endpoint HTTP (API) |
| 3 | **safe-change** | Modificar qualquer código existente |
| 4 | **creating-feature** | Construir feature completa do zero (UI + API + DB) |
| 5 | **writing-business-logic** | Implementar qualquer regra de negócio crítica |
| 6 | **creating-analytics-event** | Adicionar/modificar evento de telemetria |
| 7 | **handling-pii-data** | Manipular qualquer dado pessoal (LGPD) |

## Como o agente decide qual skill usar

Cada `SKILL.md` tem um campo `description` no frontmatter que descreve **gatilhos**: palavras-chave, tipos de arquivo, intenções do usuário. O agente lê esse description antes de cada tarefa e ativa a skill correspondente.

Múltiplas skills podem rodar na mesma tarefa. Exemplo: "criar uma feature de cadastro de funcionários" ativa `creating-feature` + `creating-component` (telas) + `creating-endpoint` (APIs) + `writing-business-logic` (regras) + `handling-pii-data` (dados pessoais).

## Estrutura de cada skill

```
skill-name/
└── SKILL.md
    ├── frontmatter (name, description com gatilhos)
    ├── Pergunta-âncora (a pergunta que sempre se faz antes)
    ├── Passos procedimentais numerados
    ├── Exemplos de código (✅ certo / ❌ errado)
    ├── Checklist final
    └── Anti-padrões
```

## Princípios das skills

1. **Procedurais, não filosóficos** — dizem **como fazer**, não **por que fazer**
2. **Curtas e enxutas** — focadas em decisões, não em referência completa
3. **Com gatilhos claros** — agente sabe quando aplicar
4. **Independentes** — cada uma roda sozinha, mas referenciam outras quando faz sentido
5. **Anti-padrões explícitos** — lista de "NÃO faça" tão importante quanto "faça"

## Manutenção

- Skills são **versionadas junto com o código** (vivem no repo)
- Mudanças nas 33 regras → revisar skills afetadas
- Time pode propor refinos via PR
- Skill que não é usada por 3 meses → revisitar (talvez não faça sentido)

## Como começar

1. Lê o documento `RadarAuto-Rules.md` (as 33 regras)
2. Lê cada `SKILL.md` uma vez pra ter o mapa mental
3. Configura o agente pra usar as skills conforme triggers
4. Em cada tarefa, deixa o agente aplicar a skill relevante automaticamente

## Roadmap de novas skills (futuro)

Skills que **podem** ser criadas se a necessidade aparecer:

- `creating-migration` — quando migrations de banco virarem rotineiras
- `debugging-production` — runbook pra incidentes
- `handling-billing-flow` — quando Stripe e ciclo de assinatura ficarem complexos
- `optimizing-performance` — quando otimização virar tarefa específica

Não criar preventivamente. Criar quando dor for real.
