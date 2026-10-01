# Arquitetura — Prumo

## Visão geral

```
┌─────────────────┐      HTTPS       ┌──────────────────┐
│  React + Vite    │ ───────────────▶│  Supabase          │
│  (PWA, Vercel)    │◀─────────────── │  Postgres + Auth   │
└─────────────────┘                  └──────────────────┘
```

Aplicação client-side pura (SPA). Não há backend próprio — toda a lógica de dados e autenticação passa pelo Supabase, acessado diretamente do navegador via `@supabase/supabase-js`. Segurança de acesso aos dados é garantida por **Row Level Security (RLS)** no Postgres, não por uma camada de API intermediária.

## Autenticação (IAM)

Implementado via Supabase Auth, com dois métodos habilitados:

- **Google OAuth** — requer configuração de credencial no Google Cloud Console (veja README.md)
- **E-mail/senha** — funciona imediatamente, sem configuração extra

Fluxo:
1. `AuthContext` (`src/contexts/AuthContext.tsx`) mantém o estado de sessão via `supabase.auth.onAuthStateChange`
2. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) redireciona para `/login` quando não há sessão ativa
3. Cada linha de dado no banco é vinculada a `auth.uid()` — o próprio Postgres nega acesso a dados de outro usuário, mesmo se houvesse uma falha na camada de UI

## Modelo de dados

Todas as tabelas estão no schema `public`, vinculadas a `auth.users` via `user_id`, com RLS habilitado e políticas idênticas em todas: `select`/`insert`/`update`/`delete` restritos a `auth.uid() = user_id`.

### Módulo Hábitos

**`habits`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | |
| `name` | text | |
| `frequency_type` | text | `'daily'` ou `'weekly_days'` |
| `frequency_days` | smallint[] | dias da semana (0=domingo..6=sábado), usado quando `frequency_type = 'weekly_days'` |
| `archived` | boolean | default `false` |
| `created_at` | timestamptz | |

**`habit_checkins`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `habit_id` | uuid, FK → `habits`, `on delete cascade` | |
| `user_id` | uuid, FK → `auth.users` | denormalizado para simplificar as políticas de RLS |
| `checkin_date` | date | |
| `created_at` | timestamptz | |

Restrição `unique (habit_id, checkin_date)` — um check-in por hábito por dia. Streak e percentual de consistência são calculados no cliente a partir do histórico de check-ins (não armazenados como colunas).

### Módulo Diário emocional

**`mood_entries`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | |
| `entry_date` | date | |
| `mood_scale` | smallint | `check (between 1 and 5)` |
| `note` | text | texto livre, opcional |
| `created_at` | timestamptz | |

Restrição `unique (user_id, entry_date)` — um registro de humor por dia. A tela salva com `upsert` nessa chave, então registrar de novo no mesmo dia atualiza o registro. O tamanho da nota (2000 caracteres) é limitado no cliente; o banco não impõe limite.

### Módulo Financeiro

**`budget_categories`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | |
| `name` | text | |
| `monthly_limit` | numeric(12,2) | `check (>= 0)` |
| `archived` | boolean | default `false`. Arquivar (em vez de excluir) evita que gastos já registrados na categoria percam o nome — `expenses.category_id` não é tocado, só some da lista/seletor de categorias ativas |
| `created_at` | timestamptz | |

**`expenses`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | |
| `category_id` | uuid, FK → `budget_categories`, `on delete set null` | |
| `amount` | numeric(12,2) | `check (> 0)` |
| `description` | text | opcional |
| `expense_date` | date | default `current_date` |
| `reflection_note` | text | preenchido quando o gasto estoura o limite da categoria (reflexão guiada) |
| `created_at` | timestamptz | |

Trigger `expenses_category_ownership` (before insert/update): garante que `category_id`, quando preenchido, aponta para uma categoria do mesmo `user_id` do gasto. A RLS por si só não cobre isso — ela valida a posse da linha (`auth.uid() = user_id`), não a consistência entre os dois FKs da mesma linha.

## Infraestrutura

| Serviço | Detalhe |
|---|---|
| Supabase | Projeto `prumo`, região `sa-east-1` (São Paulo), organização `tiagovidao`, plano Free |
| Vercel | Projeto `prumo`, conta `Tiago's projects`, plano Hobby (Free), proteção SSO desabilitada (app acessível diretamente pela URL pública) |

Variáveis de ambiente configuradas no Vercel (produção, preview e desenvolvimento): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Datas e fuso horário

Todas as datas "só dia" (`entry_date`, `checkin_date`, `expense_date`) são geradas e comparadas no **fuso local do dispositivo**, via `src/lib/dates.ts`. Não usar `toISOString().slice(0, 10)` para isso: ele devolve a data em UTC, que em Brasília já é o dia seguinte a partir das 21h. Para colunas `timestamptz` (ex.: `created_at`), converter com `localDayOfTimestamp` antes de comparar com datas locais.

## PWA

Configurado via `vite-plugin-pwa` (modo `generateSW`, `registerType: 'autoUpdate'`). Manifest com tema escuro (`#14151c`), ícones customizados em `public/icons/` (192px, 512px, e uma versão maskable para Android).

## Roadmap técnico (próximas etapas)

1. Configurar credencial OAuth do Google (passo manual, veja README.md)
2. ✅ Módulo Hábitos (CRUD de hábitos, check-in diário, cálculo de streak/consistência)
3. ✅ Módulo Diário emocional (registro diário, tendência e histórico)
4. ✅ Módulo Financeiro (categorias, registro de gastos, alerta proativo aos 90%, reflexão guiada ao estourar)
5. Conectar repositório a um provedor Git (GitHub) para deploy automático a cada push
