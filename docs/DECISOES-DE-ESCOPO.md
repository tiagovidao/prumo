# Decisões de escopo — Prumo

Registro das decisões de produto tomadas na fase de planejamento, antes do início do desenvolvimento. Serve como referência para entender *por que* o V1 tem o formato que tem.

## Contexto e motivação

Projeto pessoal (uso individual) para consolidar três áreas da vida hoje acompanhadas de forma manual — planilha, papel ou memória:

- Saúde mental/emocional (diário de humor, padrões emocionais)
- Saúde física/rotina (hábitos, treino, alimentação)
- Financeiro (gastos, orçamento, metas)

Não é um MVP de fim de semana: a proposta é uma base sólida que evolui continuamente ao longo do tempo.

## Relação com projetos anteriores

Este projeto tem sobreposição conceitual com o **Life OS**, planejado anteriormente, mas foi tratado deliberadamente como **projeto novo e separado** — o Life OS foi descontinuado.

Também existe sobreposição parcial com o **Carga** (PWA de musculação já existente e funcional), mas o módulo de hábitos deste projeto não reaproveita aquele modelo: aqui o treino é tratado como um tipo de hábito simples, não como um sistema de treino robusto (séries, cargas, evolução).

## Requisitos fundamentais definidos

- **IAM simples e seguro** — obrigatório desde o início
- Formato **PWA ou mobile**, priorizando agilidade de desenvolvimento
- Abertura para ferramentas do **ecossistema Google**, quando fizer sentido prático
- Uso individual hoje, mas **pronto para multiusuário no futuro** (decisão que influenciou a escolha de Supabase + Row Level Security em vez de Firebase/Firestore)
- Hospedagem em **camada gratuita**

## Escopo V1 por módulo

### Hábitos (módulo prioritário — mais robusto)
- CRUD livre de hábitos (criar/editar/arquivar a qualquer momento, sem limite fixo de quantidade)
- Frequência configurável por hábito: diária ou dias específicos da semana
- Registro por check-in binário (fez / não fez) por dia
- Visualização: streak (sequência atual) **e** percentual de consistência, simultaneamente
- Treino é tratado como hábito simples — não há sistema de séries/carga (isso já existe no projeto Carga)
- Alimentação **não** entra no escopo da V1

### Diário emocional
- Um registro por dia (fechamento do dia)
- Escala de humor + texto livre (nota do dia)
- Sem tags de emoção predefinidas na V1 (o texto livre já cobre o contexto)

### Financeiro
- Registro de gastos por categoria (sem receitas/entradas na V1 — só saída de dinheiro)
- Orçamento com limite mensal definido por categoria
- Ao se aproximar ou estourar o limite de uma categoria:
  - **Alerta proativo** (ex.: aviso ao atingir 90% do orçamento, antes de estourar)
  - **Reflexão guiada** — ao estourar, o app pergunta o motivo do gasto (mini-diário financeiro), em vez de só mostrar um número vermelho

### Conexão entre módulos
- V1: **dashboard unificado** ("Hoje") — resumo dos 3 módulos lado a lado (hábitos pendentes, status do humor do dia, status do orçamento)
- V2 (fora do escopo atual): insights cruzados entre módulos (ex.: correlação entre cumprimento de hábitos e humor, ou entre humor e gastos por impulso) — depende de volume de dados histórico acumulado

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| Supabase em vez de Firebase | Postgres/SQL relacional, Row Level Security nativo (ideal para o cenário "single-user hoje, multiusuário amanhã"), menor vendor lock-in |
| Vercel para deploy | Integração simples, camada free, HTTPS automático (necessário para PWA) |
| React + TypeScript + Vite | Stack já dominada pelo desenvolvedor, PWA plugin maduro |
| IAM: Google OAuth + e-mail/senha | Ambos oferecidos pelo Supabase Auth sem custo extra — flexibilidade sem complexidade adicional |

## Direção visual

- **Modo escuro** como padrão
- Estilo **minimalista + acolhedor/orgânico** (mescla deliberada, já que o app cobre desde dados objetivos — financeiro — até conteúdo emocional — humor)
- Cor de destaque própria por módulo: terracota/âmbar (Hábitos), lavanda (Humor), verde-sálvia (Financeiro)
- Sem referência visual externa específica — direção definida a partir de exemplos gerados e aprovados durante o planejamento

## Nome do projeto

**Prumo** — escolhido entre opções mais autorais (Fulcro, Órbita, Prumo, Cardeal), a partir dos temas "eixo/equilíbrio" e "norte/direção". Um fio de prumo é o instrumento que indica a vertical verdadeira — referência direta usada também no ícone do app.

## Fora do escopo da V1 (documentado como visão futura)

- Alimentação (rastreamento nutricional)
- Sistema de treino robusto (fica no projeto Carga)
- Insights cruzados entre módulos
- Metas de economia
- Receitas/entradas financeiras
