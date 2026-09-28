# Changelog — Prumo

Registro cronológico do que foi construído, corrigido e decidido a cada rodada de desenvolvimento. Ordem: mais recente primeiro. Para "por que o produto tem esse formato", veja [`DECISOES-DE-ESCOPO.md`](DECISOES-DE-ESCOPO.md); para "como o sistema é construído por dentro", veja [`ARQUITETURA.md`](ARQUITETURA.md).

## 2026-09-28 — Módulo Diário emocional + correção de fuso horário

**Adicionado**
- Página `/humor`: registro do dia (escala de humor de 1 a 5 + nota livre opcional, até 2000 caracteres), tendência dos últimos 14 dias em barras e histórico dos últimos 30 dias com média móvel de 7 dias.
- Salvar o registro do dia é um `upsert` na chave `(user_id, entry_date)`: registrar de novo no mesmo dia atualiza o registro existente em vez de duplicar, e o formulário já vem preenchido se o dia já tiver registro.
- `src/lib/moods.ts` (escala e limite de nota) e `src/components/MoodPicker.tsx` (seletor acessível, `role="radiogroup"`).

**Corrigido — bug de fuso horário (achado durante o desenvolvimento do módulo)**
- O Dashboard e o cálculo de streak/consistência de Hábitos determinavam "hoje" com `new Date().toISOString().slice(0, 10)`, que devolve a data em **UTC**. Em Brasília (UTC-3), isso faz o app considerar que já é o dia seguinte a partir das 21h — um check-in feito às 22h, por exemplo, podia contar pro dia errado e quebrar o streak silenciosamente, sem nenhum erro visível.
- Criado `src/lib/dates.ts` como fonte única de datas "só dia", sempre no fuso local do dispositivo. Dashboard, `habitStats` e o novo módulo de Humor foram apontados pra ele. Regra documentada em `ARQUITETURA.md` para valer também no módulo Financeiro.

**Refatorado**
- `ErrorBanner` extraído para `src/components/` e reutilizado entre Hábitos e Diário emocional (antes, Hábitos tinha sua própria cópia do banner).

**Validado**
- `tsc --noEmit` e `npm run build` sem erros.
- Testado diretamente contra o Supabase de produção, como o usuário real (via RLS), sem deixar dado de teste: upsert atualiza em vez de duplicar; escala fora de 1–5 é rejeitada pela constraint do banco; gravar em nome de outro `user_id` é barrado pela política de RLS.

## 2026-09-28 — Correções de UI mobile (PWA como app nativo)

**Corrigido**
- Zoom automático ao focar campos no iOS: causado por inputs com fonte menor que 16px. Todos os campos passaram a usar 16px.
- Zoom por toque duplo: adicionado `touch-action: manipulation` globalmente.
- Sensação de "site" em vez de app: removidos o elástico de rolagem (`overscroll-behavior: none`), o flash cinza ao tocar (`-webkit-tap-highlight-color`) e a seleção de texto na interface (mantida nos campos de formulário e nas notas do Diário).
- Metadados de app instalado no iOS ausentes: adicionados `apple-touch-icon` e as meta tags de `apple-mobile-web-app-*`, com barra de status translúcida.
- Modal de criação/edição: fundo rolava por trás do modal aberto e o teclado podia cobrir o formulário. Corrigido com trava de rolagem do `body` enquanto o modal está aberto, altura máxima em `dvh` e rolagem interna.

**Validado**
- Testado pelo usuário em dispositivo real, em produção — confirmado que resolveu o comportamento relatado.

## 2026-09-28 — Módulo de Hábitos

**Adicionado**
- Página `/habitos`: CRUD completo (criar, editar, arquivar), check-in binário por dia, cálculo de streak (sequência atual) e percentual de consistência.
- `src/lib/habitStats.ts` com a lógica pura de cálculo (streak considera a frequência configurada — diária ou dias específicos da semana — e não penaliza o dia atual antes de ele "fechar").
- Tratamento de erro em todas as leituras e escritas no Supabase (leitura da lista, check-in, criar/editar, arquivar) — antes, uma falha de rede ou do banco passava em silêncio.

**Validado**
- `tsc --noEmit` e `npm run build` sem erros antes de cada envio.
- Testado pelo usuário em produção: criação de hábito diário e de dias específicos, toggle de check-in, edição, arquivamento e o aviso de erro com o dispositivo offline.

**Observação de processo**
- A primeira versão deste módulo foi implementada e validada localmente, mas só chegou ao repositório e à produção depois — o ambiente de desenvolvimento não tinha credenciais de push. A partir deste ponto, o fluxo de entrega passou a usar um token de acesso pessoal (fine-grained, restrito ao repositório `prumo`, só com permissão de escrita de conteúdo, expiração curta) gerado pelo usuário a cada rodada de push e revogado logo em seguida.

## 2026-09-23 a 2026-09-24 — Fundação técnica

**Adicionado**
- Autenticação (Google OAuth + e-mail/senha) via Supabase Auth, com rotas protegidas.
- Dashboard "Hoje" com dados reais dos 3 módulos, exibindo nome e foto do Google (com fallback para e-mail).
- Schema completo do banco (`habits`, `habit_checkins`, `mood_entries`, `budget_categories`, `expenses`) com Row Level Security habilitado em todas as tabelas.
- Shell do PWA (manifest, ícones, `vite-plugin-pwa` em modo `autoUpdate`) e deploy em produção no Vercel.
- Documentação inicial: `README.md`, `DECISOES-DE-ESCOPO.md` e `ARQUITETURA.md`.

## Próximo

- Módulo Financeiro: categorias de orçamento, registro de gastos, alerta proativo aos 90% do limite e reflexão guiada ao estourar.
