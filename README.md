# Prumo

Aplicativo pessoal (PWA) para consolidar três áreas da vida que hoje são acompanhadas de forma manual: **hábitos**, **diário emocional** e **financeiro**. Uso individual, com a base já pronta para evoluir para multiusuário no futuro.

> Documentação completa do projeto: veja também [`docs/DECISOES-DE-ESCOPO.md`](docs/DECISOES-DE-ESCOPO.md) (o que foi decidido e por quê), [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) (como o sistema é construído por dentro) e [`docs/CHANGELOG.md`](docs/CHANGELOG.md) (o que mudou em cada rodada de desenvolvimento).

## Stack

- **Frontend**: React 18 + TypeScript + Vite, PWA (via `vite-plugin-pwa`)
- **Backend**: [Supabase](https://supabase.com) — Postgres + Auth (Google OAuth e e-mail/senha) + Row Level Security
- **Deploy**: [Vercel](https://vercel.com) (plano Hobby / gratuito)
- **Ícones**: gerados em `public/icons/` (motivo visual: fio de prumo, ligando à identidade do nome)

## Status atual (V1 completa)

- ✅ Autenticação funcionando (Google + e-mail/senha), com rotas protegidas
- ✅ Dashboard "Hoje" com dados reais do Supabase (resumo dos 3 módulos)
- ✅ Schema do banco completo, com RLS habilitado em todas as tabelas
- ✅ Deploy em produção no Vercel
- ✅ Módulo de Hábitos: CRUD completo, check-in diário, streak e % de consistência
- ✅ Módulo de Diário emocional: registro diário (escala 1–5 + nota), edição do registro de hoje, tendência dos últimos 14 dias e histórico de 30 dias
- ✅ Módulo Financeiro: CRUD de categorias de orçamento com limite mensal, registro de gastos, alerta proativo ao atingir 90% do limite e reflexão guiada obrigatória ao ultrapassá-lo

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com as credenciais do projeto Supabase (veja abaixo)
npm run dev
```

## Variáveis de ambiente

| Variável | Onde encontrar |
|---|---|
| `VITE_SUPABASE_URL` | Painel do Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Painel do Supabase → Project Settings → API → chave `publishable` (formato `sb_publishable_...`) |

Essas mesmas variáveis já estão configuradas no projeto Vercel (produção, preview e desenvolvimento).

## Build e deploy

```bash
npm run build     # gera a pasta dist/, valida TypeScript
npm run preview   # serve o build localmente para conferir
```

O deploy em produção acontece via Vercel. Ao conectar este repositório a um projeto Vercel existente (ou criar um novo), o framework é detectado automaticamente como Vite.

## Configurando o login com Google (pendente)

O login com Google já está implementado no código, mas precisa de uma credencial OAuth criada no Google Cloud Console para funcionar:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/) → crie (ou reutilize) um projeto
2. Vá em **APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth**
3. Tipo de aplicativo: **Aplicativo da Web**
4. Em **URIs de redirecionamento autorizados**, adicione a URL de callback do Supabase (Painel do Supabase → Authentication → Providers → Google, ela mostra a URL exata a usar)
5. Copie o **Client ID** e **Client Secret** gerados e cole no painel do Supabase (Authentication → Providers → Google)
6. Ative o provider Google no Supabase

Até esse passo ser feito, o botão "Continuar com Google" fica visível mas retorna erro — o login por e-mail/senha funciona normalmente nesse meio tempo.

## Estrutura de pastas

```
src/
  components/     — componentes reutilizáveis:
                    ModuleCard, ProtectedRoute, ErrorBanner (compartilhados)
                    HabitCard, HabitFormModal (Hábitos)
                    MoodPicker (Diário emocional)
                    CategoryCard, CategoryFormModal, ExpenseFormModal, ExpenseItem (Financeiro)
  contexts/        — AuthContext (sessão, login, logout)
  lib/             — cliente Supabase (supabase), datas em fuso local (dates),
                    regras de hábitos (habitStats), escala de humor (moods)
                    e cálculos financeiros (finance)
  pages/           — telas: Login, Dashboard, Habitos, Humor, Financeiro
  styles/          — tokens de design (cores, tipografia) e estilos globais
public/
  icons/           — ícones do PWA
```

## Design

Modo escuro por padrão, estilo minimalista com toque acolhedor. Cada módulo tem uma cor de destaque própria:

- 🏋️ Hábitos — terracota/âmbar
- 🧠 Diário emocional — lavanda
- 💰 Financeiro — verde-sálvia

Detalhes completos dos tokens de cor e tipografia em `src/styles/tokens.css`.
