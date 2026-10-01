# Changelog — Prumo

Registro cronológico do que foi construído, corrigido e decidido a cada rodada de desenvolvimento. Ordem: mais recente primeiro. Para "por que o produto tem esse formato", veja [`DECISOES-DE-ESCOPO.md`](DECISOES-DE-ESCOPO.md); para "como o sistema é construído por dentro", veja [`ARQUITETURA.md`](ARQUITETURA.md).

## 2026-09-29 — Módulo Financeiro

**Adicionado**
- Página `/financeiro`: CRUD de categorias de orçamento (nome + limite mensal) e registro de gastos (categoria, valor, descrição opcional, data), com listagem dos gastos do mês corrente.
- Alerta proativo aos 90% do limite: aparece no card da categoria (barra e percentual em destaque) e, de novo, ao escolher a categoria no formulário de novo gasto — antes mesmo de o valor ser digitado.
- Reflexão guiada: quando o valor informado faz a categoria ultrapassar 100% do limite do mês, o formulário passa a exigir uma nota curta sobre o motivo do gasto antes de permitir salvar. A nota fica junto do gasto na listagem.
- `src/lib/finance.ts` com a lógica pura (gasto acumulado por categoria, percentual do limite, formatação em `R$`).
- ~~Excluir uma categoria não apaga os gastos já registrados nela — a constraint do banco (`on delete set null`) apenas desvincula o gasto, que passa a aparecer como "Sem categoria" no histórico.~~ Substituído por arquivamento — ver "Arquivamento de categorias" mais abaixo, mesma data.
- `src/pages/ModulePlaceholder.tsx` removido: não sobrava mais nenhuma rota usando o placeholder, já que os 3 módulos previstos estão implementados.

**Validado**
- `tsc --noEmit` e `npm run build` sem erros.
- Constraints do banco verificadas diretamente contra o schema de produção, dentro de transações com `ROLLBACK` (sem deixar dado de teste): limite mensal negativo é rejeitado, gasto com valor zero ou negativo é rejeitado, e a exclusão de categoria confirmadamente preserva o gasto com `category_id` nulo.
- `get_advisors` (segurança) não aponta nenhum problema novo nas tabelas `budget_categories`/`expenses` — RLS já habilitado desde a fundação técnica.
- Ainda falta o teste manual do usuário em produção (fluxo completo pela UI), como nos módulos anteriores.

**Pente-fino e correções**
- Auditoria completa do módulo (lógica, datas, dinheiro, banco, RLS, UI/mobile, acessibilidade, performance, documentação) encontrou 16 pontos, dos quais 2 de Alto impacto e 5 de Médio. Corrigidos nesta rodada:
  - Campo de data do gasto agora tem `min` no início do mês corrente (antes só tinha `max`) — evita um gasto salvo com data de outro mês sumir da listagem sem nenhum aviso.
  - `parseCurrencyInput` (novo, em `lib/finance.ts`) corrige o parsing de valores em formato brasileiro com separador de milhar (ex: "1.500,00"), que antes virava `NaN`. Usado em `ExpenseFormModal` e `CategoryFormModal`.
  - Seletor de categoria no formulário de gasto trocou de `<select>` nativo (único ponto do app fora do design system, sem `aria-label`) para um `role="radiogroup"` de botões, no mesmo padrão do `HabitFormModal`.
  - `Dashboard.tsx`: `key={cat.name}` (quebrava com categorias duplicadas) trocado por `key={cat.id}`.
  - `README.md` atualizado: Financeiro não aparece mais como placeholder; "Estrutura de pastas" reflete os componentes/lib reais dos 3 módulos.
  - Migration `expenses_category_ownership_check`: trigger `before insert or update` em `expenses` garante que `category_id`, quando preenchido, pertence ao mesmo `user_id` do gasto. Testado (transações com `ROLLBACK`): inserção/atualização cross-user agora é rejeitada; inserção/atualização com categoria própria ou sem categoria continua funcionando normalmente.
- **Adiado inicialmente, resolvido no mesmo dia** — ver "Arquivamento de categorias" logo abaixo.

**Arquivamento de categorias (Financeiro)**
- Diferente do hard-delete original: excluir uma categoria agora é arquivar (`archived = true`), não apagar a linha. Migration `add_budget_categories_archived` adiciona a coluna (`boolean`, default `false`).
- Decisão restrita a `budget_categories` — `expenses` continua com hard-delete normal (excluir um gasto individual não tem o mesmo efeito cascata de perder o nome de outros registros, e o `window.confirm()` já existente é proteção equivalente à do resto do app).
- Motivo de ser só categoria: diferente de Hábitos (onde arquivar só esconde o hábito, sem afetar o nome de nenhum check-in antigo), excluir uma categoria de verdade fazia `expenses.category_id` virar `null` — ou seja, apagava a informação "isso era Alimentação" de todo gasto histórico daquela categoria, mesmo gastos de meses atrás. Arquivar resolve isso: a categoria só some da lista/seletor de categorias ativas, mas o nome continua intacto pra sempre nos gastos já registrados.
- Sem tela de "ver arquivadas"/restaurar — mesma limitação de Hábitos hoje (arquivar é, na prática, definitivo pela UI; a diferença é só que a categoria e seu nome continuam existindo no banco, preservando o histórico).
- `Dashboard.tsx` e o seletor de categoria do formulário de gasto passam a considerar só categorias ativas (`archived = false`); o resumo "gasto no mês" no topo do Financeiro soma todos os gastos do mês independente de a categoria estar arquivada (o dinheiro foi gasto de qualquer forma), mas o total do limite só considera categorias ativas.
- Testado em transações com `ROLLBACK`: categoria arquivada some da contagem de categorias ativas, mas o gasto vinculado a ela mantém o `category_id` original (não vira `null`).

**Observação de processo**
- A pedido do usuário, o push desta rodada não foi feito — o código está pronto localmente, aguardando o token de acesso para ser enviado ao repositório.

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

- Os 3 módulos do escopo V1 (Hábitos, Diário emocional, Financeiro) estão implementados, com o pente-fino do Financeiro (incluindo arquivamento de categorias) já aplicado. Falta o teste manual do usuário em produção e o push desta rodada.
- Automatizar deploy a cada push (item 5 do roadmap em `ARQUITETURA.md`) — hoje o push ainda é feito manualmente com um token de acesso pessoal gerado a cada rodada.
- V2 (fora do escopo atual, documentado em `DECISOES-DE-ESCOPO.md`): insights cruzados entre módulos, metas de economia, receitas/entradas financeiras.
