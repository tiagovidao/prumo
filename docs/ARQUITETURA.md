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

Restrição `unique (user_id, entry_date)` — um registro de humor por dia.

### Módulo Financeiro

**`budget_categories`**
| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | |
| `name` | text | |
| `monthly_limit` | numeric(12,2) | `check (>= 0)` |
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

## Infraestrutura

| Serviço | Detalhe |
|---|---|
| Supabase | Projeto `prumo`, região `sa-east-1` (São Paulo), organização `tiagovidao`, plano Free |
| Vercel | Projeto `prumo`, conta `Tiago's projects`, plano Hobby (Free), proteção SSO desabilitada (app acessível diretamente pela URL pública) |

Variáveis de ambiente configuradas no Vercel (produção, preview e desenvolvimento): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## PWA

Configurado via `vite-plugin-pwa` (modo `generateSW`, `registerType: 'autoUpdate'`). Manifest com tema escuro (`#14151c`), ícones customizados em `public/icons/` (192px, 512px, e uma versão maskable para Android).

## Roadmap técnico (próximas etapas)

1. Configurar credencial OAuth do Google (passo manual, veja README.md)
2. Implementar módulo Hábitos por completo (CRUD de hábitos, check-in diário, cálculo de streak/consistência)
3. Implementar módulo Diário emocional (formulário de registro diário)
4. Implementar módulo Financeiro (categorias, registro de gastos, alertas proativos, reflexão guiada)
5. Conectar repositório a um provedor Git (GitHub) para deploy automático a cada push
