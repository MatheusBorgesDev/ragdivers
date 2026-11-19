# RAGDivers — Especificação do projeto

Escrita em 2026-11-18, saída da conversa de descoberta e revisada por um leitor no papel de quem vai construir.
**Aprovada pelo usuário em 2026-11-18.**

Origem de cada decisão, entre parênteses: **(usuário)** decidiu quem mantém o projeto; **(Claude, aprovado)** foi
proposta do Claude aprovada pelo usuário; **(Claude)** é escolha do Claude, que o usuário pode corrigir ao ler este
documento. O que não foi verificado está marcado "a confirmar".

## 1. Visão geral

**RAGDivers** é um assistente de fã, não oficial, para Helldivers 2. Ele responde perguntas de jogadores sobre
armas, inimigos, estratagemas, patches e o estado da guerra galáctica. Cita a fonte de cada afirmação, diz de qual
patch a informação é e diz "não sei" quando as fontes não cobrem a pergunta.

Frase de apresentação (Claude): *"Answers that know which patch they're from."* Subtítulo: *"an unofficial
Helldivers 2 companion"*.

É o projeto 2 do portfólio de engenharia de IA (mapa em `00-indice.md`, na pasta Projetos IA do Drive). Foco, numa
frase: **agente com tool calling e streaming, RAG com citação e "não sei", teto de custo, evals e tracing no CI, em
TypeScript.** O projeto 1 (MCP Barber Shop, `~/projects/mcp-lab`) é a referência de processo e de qualidade.

**Por que este domínio.** O critério principal do portfólio é dado real e gente usando de verdade. Helldivers 2 tem
dado que muda a cada hora (a guerra galáctica) e patches frequentes, que ficam fora do treino do modelo e por isso
justificam a busca. O mantenedor joga e consegue validar as respostas pela fonte citada. E há usuários reais à mão.

**Usuários.** O mantenedor e dois amigos, todos programadores: um joga com frequência (tech lead em outra empresa),
o outro de vez em quando. Eles conversam por voz no Discord enquanto jogam, então ninguém digita no meio da missão:
o uso esperado é entre missões (na nave, escolhendo equipamento), quando sai um patch e para checar a Ordem
Principal, no celular ou no PC. Perguntam em português.

## 2. Objetivos, sucesso e limites

**Sucesso em cerca de dois meses (até 2027-01-18): as duas coisas (usuário).**

1. **Uso real:** os amigos usando toda semana. Meta proposta (Claude, a confirmar): em pelo menos 6 de 8 semanas,
   pelo menos um dos dois amigos fez uma pergunta. Medida: perguntas por pessoa por semana.
2. **Números para entrevista**, todos medidos, com data e método:
   - taxa de acerto por categoria de pergunta (com n e k), mostrando onde o agente erra;
   - qualidade da busca (recall), comparando os modos de busca;
   - custo por pergunta e latência até o primeiro token, em produção;
   - taxa de "não sei" correto;
   - comparação com a base "tudo no contexto" e com um segundo modelo.

**Não objetivos:**

- conversar por voz;
- opinião de comunidade (Reddit, YouTube) como fonte;
- público gamer não programador, por enquanto;
- uso comercial (a licença da wiki não permite);
- marca oficial: nada de logo ou arte do jogo;
- bot no Discord (pode virar uma segunda porta depois, com o mesmo agente);
- tools que agem no mundo: todas as tools são de leitura.

**Antiobjetivo (a pior falha):** um número inventado com uma fonte citada ao lado. Parece certo e engana justamente
quem confia na citação. Nas evals, uma citação que não sustenta a afirmação é erro grave, mesmo que a resposta
"pareça" certa.

## 3. O que o agente responde

As categorias saem das perguntas reais do grupo (coletadas em 2026-11-18). Elas guiam o corpus, as tools e as
evals.

| Categoria | Exemplo real do grupo | Comportamento esperado | Fonte |
|---|---|---|---|
| Ao vivo | "A missão principal agora é contra robôs, insetos ou alienígenas?" | Ordem Principal atual, facção e progresso, com o horário da consulta | API da comunidade |
| Número exato | "Qual a diferença de dano recebido de acordo com a armadura leve, média e pesada?" | os números, com citação | tabelas da wiki |
| Conta em dois passos | "O Quasar mata um Bile Titan com um único tiro?" | cruza o dano da arma com a vida do inimigo (por parte do corpo, se a fonte tiver), mostra a conta e cita as duas fontes | tabelas da wiki |
| Lembrança vaga | "Qual era o nome daquele objetivo que a Ultimatum destruía?" | encontra pela descrição, sem o nome | busca por significado |
| Mudou com o tempo | "A Ultimatum ainda destrói aquele objetivo?", "Tem inimigos novos agora?" | prefere a fonte mais nova e diz o patch e a data | notas de patch e wiki |
| Continuação | "aquele objetivo", na pergunta seguinte | usa o que já foi dito na conversa | histórico da conversa |
| Recomendação | "Qual a melhor torreta para levar contra os robôs?", "Qual warbond devo comprar agora?", "Qual será o melhor robô para matar insetos?" | comparação com números, prós e contras e fonte, aberta por uma linha de conclusão tirada dos números; sem opinião; pode perguntar o que o jogador já tem | tabelas, wiki e patches |
| Gíria | "robô" (equipamento do jogador) × "robôs" (Automatons); "insetos" (Terminids); "alienígenas" (Illuminate); "missão principal" (Major Order) | traduz para o nome oficial; se ambíguo, pergunta antes de responder | — |
| Fora da base | "Quando sai o próximo Warbond?", sem anúncio | "não sei", dizendo o que as fontes cobrem | — |

- **Contas em dois passos: o certo é o resultado no jogo** (Claude). Dano contra vida, sozinho, não basta.
  - O agente só afirma "sim" ou "não" quando as fontes trazem todos os valores que a mecânica exige, conforme o que
    a wiki documenta: por exemplo, penetração de armadura contra a armadura da parte, vida da parte e se a parte é
    fatal (os nomes e as regras exatas ficam a confirmar na wiki).
  - A conta é feita em código, pela tool, e não pelo modelo. O modelo explica o resultado.
  - Se faltar um valor, o agente mostra a conta parcial com as premissas e diz que não dá para confirmar. Um "sim"
    com duas citações válidas, quando o jogo diz "não", é exatamente o antiobjetivo.
  - Sempre que possível, o resultado esperado dos casos de eval de conta é conferido no jogo pelo grupo.
- **Recomendações** são comparação com números, prós e contras, citando a fonte (usuário). A linha de conclusão no
  topo é para servir também a quem não é programador (Claude).
- **Idioma:** o agente responde na língua da pergunta (Claude). Os nomes de armas, estratagemas, inimigos e itens
  ficam em inglês, como no jogo, porque o grupo joga em inglês (usuário). Um glossário pequeno cobre as gírias em
  português (facções, "missão principal", "robô" como equipamento).

## 4. Decisões tomadas

Todas em 2026-11-18.

- **Domínio:** Helldivers 2 (usuário, sobre recomendação do Claude). Reserva: acessibilidade web (WCAG 2.2 + axe),
  que perdeu porque o WCAG quase não muda e o axe já explica cada regra.
- **Nome:** RAGDivers (usuário). Sem o "2", que imitaria o nome do jogo (Claude).
- **Abordagem: índice próprio com busca híbrida e tabelas** (Claude, aprovado). Uma ingestão diária guarda trechos
  das notas de patch e da wiki, com fonte, patch e data; a busca junta palavra-chave e significado (embeddings); os
  números da wiki vão para tabelas consultadas por uma tool.
  - **"Tudo no contexto"** (um pacote com as notas recentes e as tabelas principais em toda pergunta, sem busca)
    entra só como **base de comparação nas evals**. Responde, com número, "por que não mandar tudo ao modelo?".
  - **"Busca na hora, sem índice"** (o agente pesquisa e lê páginas da wiki no momento da pergunta) foi
    **descartada**: custa mais por pergunta, falha na lembrança vaga e deixa a busca, a parte central do RAG, nas
    mãos da wiki.
- **Modelo:** Claude Haiku 5.5 (`claude-haiku-5-5`) como modelo principal (usuário, sobre recomendação do Claude).
  Uma comparação única com Claude Sonnet 5.5 (`claude-sonnet-5-5`) em cerca de 30 casos, com o ok do usuário antes de
  gastar. Preços pela tabela da documentação em 2026-11-03: Haiku 5.5 US$ 0,10 / 0,50 por milhão de tokens (entrada
  / saída) até 100 mil tokens de entrada, US$ 0,50 / 2,50 acima disso; Sonnet 5.5 US$ 2 / 10. Conferir na página
  oficial antes de gastar.
- **Custo (usuário):** gastar o mínimo.
  - Conta pessoal na API da Anthropic, nunca a da empresa. A assinatura do Claude não cobre o app: o plano pago e a
    API são cobrados à parte, e o login de assinatura não pode ser usado em outro produto.
  - US$ 5 de crédito pré-pago, com recarga automática desligada: o crédito é o teto.
  - Recarga só à mão, com o ok do usuário, ligada a uma medição específica cujo custo estimado é mostrado antes
    (Claude, conforme o combinado na conversa). Estimativa do revisor, não medida: a comparação Haiku × Sonnet
    sai por US$ 4 a 6, e a base "tudo no contexto" por US$ 7,5 ou mais se o pacote passar de 100 mil tokens.
    Então a fase de medição deve pedir uma recarga.
  - Evals econômicas (Claude): rodadas exploratórias com k = 1 e números publicados com k = 3; comparações em
    amostras pequenas; pacote do "tudo no contexto" mantido abaixo de 100 mil tokens, para não cair na faixa mais
    cara do Haiku; cache de prompt onde couber.
  - Limite diário no código (seção 10).
- **Evals (usuário):** casos em inglês. As perguntas reais do grupo ficam em pt-BR, como vieram (Claude).
- **Texto das conversas é guardado (usuário):**
  - com o ok de cada amigo, dado uma vez, no primeiro acesso com o código de convite;
  - por 30 dias, e depois apagado;
  - visível só para o mantenedor.

  As perguntas que o mantenedor revisar e escolher viram casos de eval, copiadas para o conjunto antes de expirar.
- **Nomes do jogo em inglês** nas respostas, com o texto em pt-BR (usuário).
- **Stack (Claude, aprovado junto com a abordagem):**
  - Next.js + TypeScript em modo strict, hospedado na Vercel (plano gratuito). Escolhido porque o usuário já usa no
    trabalho, porque faz streaming sem adaptação e porque evita o plugin de desenvolvimento que o projeto 1 precisou.
  - Loop do agente próprio, com o SDK oficial `@anthropic-ai/sdk`. Sem framework que esconda o loop e sem Managed
    Agents (o serviço da Anthropic que roda o loop por você): o loop é o que o projeto mostra.
  - Supabase Postgres (plano gratuito), com busca full-text e `pgvector` no mesmo banco.
  - Tracing próprio, gravado no banco e visível na tela, como o inspector do projeto 1.
  - Como no projeto 1: pnpm, Node 22, Vitest, oxlint, `zod` em toda entrada externa, versões fixadas e conferidas no
    npm na data.
- **Acesso por código de convite**, um código por pessoa (Claude, aprovado junto com o custo). Quem entra sem código
  vê uma demonstração: conversas gravadas, escolhidas pelo mantenedor, e um vídeo.
- **Ordem de entrega (Claude):** a primeira entrega responde só o estado da guerra ao vivo, sem RAG. É a pergunta mais
  frequente e a mais barata, e o uso real começa na primeira semana. Cada entrega sai com as evals da sua categoria.
- **Projeto de fã:** "unofficial Helldivers 2 companion", com aviso de não afiliação à Arrowhead e à Sony. Sem logo
  nem arte do jogo.
- **Repositório pessoal:** commits com o e-mail noreply do GitHub configurado no próprio repositório, conferido antes
  do primeiro commit (usuário, regra do portfólio).

## 5. Fontes de dados

### API da comunidade (dado ao vivo)

- Repositório `helldivers-2/api`: licença MIT, não oficial, sem afiliação à Arrowhead. Último commit em 2026-11-08.
- **Cabeçalhos obrigatórios.** Em 2026-11-18T19:17Z, uma chamada a `https://api.helldivers2.dev/api/v1/war` só com
  `X-Super-Client` respondeu 400: "The X-Super-Client and X-Super-Contact headers are required". O README ainda trata
  o contato como opcional. O contato é a URL do repositório, nunca um e-mail pessoal.
- **Rate limit:** 5 requisições a cada 10 s, pelo README. As respostas vão para um cache curto no servidor (o tempo
  de cache fica com quem constrói).
- **Endpoints** documentados na especificação OpenAPI (`https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json`,
  baixada em 2026-11-18; lidos, não chamados):
  - `/api/v1/war`;
  - `/api/v1/assignments` (Ordens Principais);
  - `/api/v1/campaigns`;
  - `/api/v1/planets` e `/api/v1/planet-events`;
  - `/api/v1/dispatches` e `/api/v2/dispatches`;
  - `/api/v1/steam` (feed de notícias do Steam);
  - `/api/v2/space-stations`.

  Há também a especificação da API oficial que a comunidade usa por trás.
- **Ela pode mudar sem aviso,** como aconteceu com o cabeçalho de contato. A interface precisa de um estado para
  quando a API cair, e o cliente valida a resposta com `zod`.

### Notas de patch

- **Fonte:** o feed de notícias do Steam, pelo endpoint `/api/v1/steam` da API da comunidade ou pela API pública do
  Steam (quem constrói escolhe).
- Cada patch guarda a versão, a data e a URL.
- **O jogo está ativo** (busca em 2026-11-18): patch 1.007.203 em 2026-11-11, patch 7.2.2 em 2026-10-29, e um blog
  mensal da Arrowhead no Steam.

### Wiki `helldivers.wiki.gg`

- **Licença:** CC BY-NC-SA 4.0, segundo a página "Helldivers Wiki:Copyrights" (vista pela busca, não aberta). O
  conteúdo anterior a fevereiro de 2024 veio da wiki da Fandom, em CC BY-SA.
  - **Uso:** não comercial e com crédito (a citação já dá o crédito).
  - **Mesma licença** em obra derivada. O que conta como derivado num índice de busca fica a confirmar.
  - **O corpus completo fica fora do repositório git:** é baixado na ingestão. O código do repositório usa MIT.
  - **Exceção, um recorte congelado para testes** (Claude): só os trechos que os casos de eval usam, com os
    embeddings e as respostas gravadas do modelo. Ele fica numa pasta própria (por exemplo, `tests/fixtures/wiki/`),
    com aviso de licença CC BY-NC-SA 4.0 e atribuição por página (URL e link do histórico de edições). Assim o CI
    fica autossuficiente e dá o mesmo resultado a cada rodada, sem depender do banco vivo, que muda a cada ingestão.
    O formato da atribuição fica a confirmar.
- **Acesso:** pela API do MediaWiki (se ela está habilitada e com quais limites: a confirmar), com um `User-Agent`
  que identifica o projeto pela URL do repositório.
- **Rede desta máquina:** daqui, o acesso à wiki falha com "self-signed certificate in certificate chain", tanto pelo
  WebFetch quanto pelo curl. Testar a partir do CI e da Vercel, e nunca contornar a verificação TLS.
- **Escopo inicial:** só as páginas que os casos de eval pedem (armas, estratagemas, inimigos, armaduras, objetivos,
  Warbonds). O escopo cresce junto com as evals.

## 6. Agente

- **Loop:** Messages API com streaming e tools definidas pelo projeto. Limites de número de voltas, de `max_tokens`,
  de tamanho do histórico e de tamanho da mensagem do usuário.
- **Tools** (proposta do Claude; a granularidade fica com quem constrói):
  - `get_war_status`: Ordens Principais, frentes ativas com a facção e eventos de planeta. Sempre ao vivo, com cache
    curto.
  - `search_docs`: busca híbrida nos trechos das notas de patch e da wiki, com filtros opcionais (tipo de fonte, a
    partir de um patch ou de uma data). Devolve trechos com id, título, URL, patch e data. O modelo escreve a consulta
    em inglês, porque o corpus é em inglês e a pergunta chega em pt-BR.
  - `get_stats`: consulta às tabelas de números (armas, inimigos, armaduras etc.). Devolve os números com a fonte e a
    data da página.
- **Citação:** cada afirmação factual aponta para o id de um trecho ou de uma linha de tabela, e a interface mostra a
  fonte (título, patch ou data, link). O formato exato fica com quem constrói, mas precisa permitir uma checagem
  automática: o número da resposta aparece na fonte citada?
- **"Não sei":** quando a busca não traz nada que sustente a resposta. O agente diz o que as fontes cobrem e, se fizer
  sentido, onde procurar.
- **Tempo:**
  - cada trecho guarda o patch e a data;
  - num conflito, a fonte mais nova vence, e a resposta diz "desde o patch X (data)";
  - quando a página da wiki for mais velha que o último patch que mexeu no mesmo item, o agente avisa. Como detectar
    isso: a confirmar.
- **Idioma da camada que o modelo lê:** prompt de sistema e descrições das tools em inglês, como no projeto 1.
- **Modelo:** `claude-haiku-5-5`. Esforço e raciocínio são ajustados pelas evals. Ao escrever o código do SDK, seguir
  a skill `claude-api`: a API mudou em 2025–2026 e o que se lembra de memória pode estar velho.
- **Casos a tratar:**
  - `stop_reason` de recusa e de `max_tokens`;
  - 429, 5xx e timeout do provedor;
  - API da comunidade fora do ar;
  - crédito esgotado;
  - limite diário atingido.

## 7. Interface

- **Página web** em Next.js, pensada para o celular como segunda tela e funcionando também no desktop.
- **Chat com streaming:**
  - cada chamada de tool aparece como um cartão: nome, argumentos resumidos, duração, ok ou erro;
  - as fontes citadas aparecem como cartões com patch ou data e link.
- **Estados:**
  - digitando;
  - tool rodando;
  - resposta;
  - "não sei";
  - pergunta de volta;
  - erro do provedor;
  - API da comunidade fora do ar;
  - limite diário atingido;
  - crédito esgotado;
  - sem código de convite (demonstração).
- **Rastro por resposta** (o tracing na tela): passos, tokens, custo e tempo, como o inspector do projeto 1. O
  mantenedor vê o de todas as conversas, com o texto; visitantes, só o das conversas de demonstração.
- **Consentimento:** no primeiro acesso com um código de convite, um aviso curto diz o que é guardado, por quanto
  tempo e quem vê. O uso começa depois do ok.
- **Idioma:** interface em pt-BR; uma versão em inglês fica para depois (Claude).
- **Acessibilidade:** WCAG 2.2 AA (`aria-live` no streaming, teclado, movimento reduzido) e layout que funciona a
  320 px.
- **Identidade visual:** a definir, sem logo nem arte do jogo.

## 8. Ingestão

- **Frequência:** diária. Onde roda (cron do GitHub Actions ou da Vercel) fica com quem constrói, conferindo os
  limites do plano gratuito.
- **Passos:**
  1. baixar as notas de patch novas e as páginas da wiki do escopo;
  2. extrair o texto e as tabelas;
  3. cortar em trechos com metadados (fonte, URL, título, seção, patch, data de publicação ou de revisão, licença);
  4. gerar os embeddings;
  5. gravar de forma idempotente, pelo hash do conteúdo. Os números vão para tabelas próprias.
- **Embeddings:** o provedor é decidido no plano, pelo custo medido. O mesmo modelo serve para os trechos e para as
  consultas.
- **Patch novo:** quando entra um patch que mexe num item, os casos de eval desse item são marcados para revisão
  (seção 9).

## 9. Evals

**Princípio:** as evals existem desde a primeira entrega, e a maior parte não chama o modelo.

### Os casos

- **O que cada caso guarda:**
  - pergunta e idioma;
  - categoria (seção 3);
  - comportamento esperado: responder, "não sei" ou perguntar de volta;
  - fatos esperados, como os números;
  - fontes esperadas (ids);
  - o patch ou a data em que o caso vale.
- **Casos com prazo de validade:** quando um patch novo mexe no item, o caso é marcado para revisão.
- **Idioma:** as perguntas reais do grupo ficam em pt-BR, como vieram; o resto do conjunto é em inglês.

### Busca, sem modelo

- Para cada caso, os trechos que deveriam vir na busca.
- Mede o recall@k e a posição do primeiro trecho certo, por categoria.
- Compara palavra-chave, significado e busca híbrida.

### Respostas: checagens por código

- O número da resposta está certo?
- A citação aponta para a fonte esperada?
- O número aparece no trecho citado? É a checagem que pega o antiobjetivo.
- O agente disse "não sei" quando devia? Quem constrói decide se isso vem de um campo estruturado ou de um marcador.

### Juiz por modelo

- Usado só para texto livre (a fidelidade à fonte), numa amostra.
- **Calibração:** o mantenedor e o amigo tech lead rotulam a mesma amostra. Primeiro se mede a concordância entre os
  dois; depois, a do juiz com eles.
- O modelo do juiz é decidido junto com a calibração.

### Não determinismo e relatório

- Cada caso roda k vezes (proposta: k = 3).
- O relatório traz a taxa de acerto, n, k, data, modelo e o custo da rodada.

### Comparações (cada uma vira um número de entrevista)

1. Busca híbrida × só palavra-chave × só significado, sem modelo.
2. Índice × "tudo no contexto". Atenção: o Haiku 5.5 cobra 5 vezes mais acima de 100 mil tokens de entrada (pela
   tabela de preços, a confirmar).
3. Haiku 5.5 × Sonnet 5.5, em cerca de 30 casos, com o ok do usuário antes.

### Segurança

- Casos com um trecho malicioso plantado no corpus de teste, como uma instrução escondida numa página da wiki: o
  agente não pode segui-la.
- Casos fora do escopo, como usar o agente como um LLM grátis: o agente recusa.

### Números desde a primeira fase (Claude)

Cada fase publica os números da sua parte num relatório de evals que cresce: o recall da busca, a checagem "o número
está na fonte citada", a taxa de "não sei" correto. A fase 4 fica só com as comparações e a calibração do juiz. Se o
prazo apertar, o projeto termina com usuários e com números parciais, não com uma coisa sem a outra.

### CI (GitHub Actions, a cada push)

- Testes unitários.
- Evals da busca, sobre o recorte congelado (seção 5).
- Checagens por código sobre respostas gravadas do modelo, reproduzidas sem custo.
- **Evals ao vivo, com o modelo de verdade:** rodam à mão, por um script que mostra o custo antes e depois, e nunca
  em pull request vindo de fork.

## 10. Tracing, custo e limites

- **Rastro por pergunta:**
  - cada chamada ao modelo: tokens de entrada, de saída e de cache, custo calculado pelo preço, latência e tempo até
    o primeiro token;
  - cada tool: nome, argumentos, duração, tamanho do resultado e erro;
  - cada busca: os trechos trazidos e as notas da busca.
- **Custo:**
  - a soma de uso × preço é gravada por pergunta;
  - um limite diário global e um por pessoa são conferidos antes de cada chamada ao modelo. Valores iniciais
    (Claude): US$ 0,25 por dia no total e 20 perguntas por pessoa por dia, revistos na fase 1 com o custo medido;
  - se o banco não responder, a chamada é recusada;
  - o teto final é o crédito pré-pago.
- **Uso:** perguntas por pessoa por semana, contadas pelo código de convite, sem nome.
- **Texto das conversas:** perguntas, respostas e as consultas que o modelo fez às tools ficam guardadas por 30
  dias, com o ok de cada pessoa (seção 4), e um job apaga o que expirou. O histórico da conversa, usado nas
  continuações, sai daí.
- **Números publicados:** só medidos, com data e método.

## 11. Segurança

- **Ações e limites:** toda tool é de leitura; nenhuma age no mundo. O modelo não é fronteira de segurança: limites
  e acesso ficam no servidor.
- **Prompt injection indireta:** qualquer pessoa pode editar a wiki. O trecho recuperado é dado, não instrução, e vai
  delimitado no prompt. As evals cobrem isso (seção 9).
- **Saída sanitizada:** o markdown renderizado passa por sanitização, porque o texto da wiki e o do modelo podem trazer
  HTML e links.
- **Segredos** só em variáveis de ambiente do servidor: a chave da API da Anthropic, a do provedor de embeddings e a
  do banco. Os códigos de convite são guardados como hash.
- **Entrada** validada com `zod`, com tamanho máximo para a mensagem.
- **API da comunidade:** respeitar o rate limit, usar cache e mandar os cabeçalhos de identificação com a URL do
  repositório.
- **Privacidade:** nenhum texto de conversa aparece em tela pública. A demonstração pública usa conversas do próprio
  mantenedor, gravadas e escolhidas por ele (Claude).

## 12. Fases

Cada fase termina publicada, com as evals da sua parte.

### Fase 0: Fundação, sem modelo

- [ ] Repositório pessoal criado, com o e-mail noreply configurado antes do primeiro commit e `.claude/context/` no
      `.gitignore`
- [ ] Conta pessoal na API da Anthropic, com US$ 5 de crédito e recarga automática desligada (feito pelo usuário; a
      chave vai direto para a Vercel e para o `.env.local`, sem passar pela conversa)
- [ ] Next.js, Supabase local e CI com testes
- [ ] Cliente da API da comunidade com cabeçalhos, cache, validação e testes
- [ ] Códigos de convite
- [ ] Deploy

### Fase 1: Estado da guerra ao vivo

- [ ] Medir antes de prometer: algumas chamadas reais ao Haiku 5.5 (centavos) trocam os números hipotéticos pelos
      medidos
- [ ] Loop do agente com `get_war_status` e os limites da seção 6
- [ ] Endpoint com streaming e interface com cartões de tool e estados
- [ ] Tracing e limite diário
- [ ] Aviso de consentimento no primeiro acesso e job que apaga conversas com mais de 30 dias
- [ ] Evals da categoria "ao vivo", sobre instantâneos gravados da API
- [ ] Amigos usando; a contagem semanal começa

### Fase 2: Notas de patch e busca

- [ ] Ingestão diária das notas de patch, com trechos que guardam o patch e a data
- [ ] Busca híbrida, com o provedor de embeddings escolhido pelo custo medido
- [ ] Citação e "não sei"
- [ ] Evals: busca (sem modelo), "mudou com o tempo" e "fora da base"

### Fase 3: Wiki e tabelas

- [ ] Ingestão das páginas do escopo e tabelas de números
- [ ] `get_stats` e as contas em dois passos
- [ ] Evals: número exato, conta em dois passos, lembrança vaga, recomendação, gíria e continuação, com a checagem
      "o número está na fonte citada"

### Fase 4: Medição

- [ ] Rótulos humanos (mantenedor e amigo) e calibração do juiz
- [ ] Comparações: modos de busca, índice × "tudo no contexto" e Haiku × Sonnet (com o ok do usuário)
- [ ] Evals de injeção e de fora do escopo
- [ ] Relatório de evals com n, k, data e custo

### Fase 5: Acabamento

- [ ] Demonstração pública (conversas gravadas) e vídeo
- [ ] README com arquitetura, decisões, números e ameaças, e a seção "How it was built"
- [ ] Acessibilidade e celular conferidos

## 13. Fica com quem constrói

- A granularidade das tools e o formato da citação, desde que a checagem "o número está na fonte citada" seja possível.
- O tamanho dos trechos, o k da busca e a forma de juntar as duas buscas.
- O tempo do cache da API da comunidade.
- A estrutura de pastas, o executor das evals e os detalhes do CI.
- As versões de Next.js, do SDK e das demais dependências: fixadas e conferidas no npm na data.
- O desenho da interface, dentro da seção 7.

## 14. Decisões em aberto

1. A meta de uso de 6 em 8 semanas (proposta do Claude). (do usuário)
   O prazo de 2027-01-18 é uma referência, não uma data rígida: quem constrói é o Claude, e o usuário aprova e testa
   (decisão do portfólio de 2026-11-17). A ordem das fases e os números por fase (seção 9) protegem as duas metas.
2. O provedor de embeddings: custo medido e capacidade de lidar com consulta em inglês sobre corpus em inglês.
3. Onde roda a ingestão (GitHub Actions ou Vercel Cron) e os limites do plano gratuito de cada um.
4. O modelo do juiz.
5. A licença CC BY-NC-SA: o que conta como obra derivada num índice de busca.
6. Os limites do plano Hobby da Vercel para streaming e se os termos cobrem um portfólio pessoal. No projeto 1, cada
   requisição era limitada a 300 s.
7. A identidade visual.

Decididos em 2026-11-18 e movidos para a seção 4: guardar o texto das conversas (sim, com consentimento, 30 dias) e
o idioma dos nomes do jogo (inglês).

## 15. Fora do escopo (por enquanto)

- Voz.
- Bot no Discord.
- Opinião de comunidade como fonte.
- Público não programador.
- Uso comercial.
- Login com conta: o acesso é por código de convite.
- Interface em inglês.
