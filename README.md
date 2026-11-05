# Painel Jussara & Ventura

Dashboard de gestão de demandas da conta Jussara–Ventura.

**No ar em:** https://leoalmeida1-dot.github.io/painel-jussara-ventura/

## Estado atual (05/11/2026)

- 36 ações mapeadas · 18 tópicos de ata
- 22 Pendente · 10 Em Andamento · 4 Concluído (11%)
- 21 prazos em 05/11 · 15 prazos em 12/11
- Marcos críticos: Vendas Trade 06/11 09h · EUA (Luana) 15/11 · SPRIM Nutri 24/11 · Férias Messias 03–10/12

## Arquivos

- `index.html` — o painel (HTML + JS, Tailwind via CDN). **Cinco visões**: Cards, Tabela, Kanban, Ata/Tópicos e Chat. Traz busca, cinco filtros, modal de detalhe com anotações e "Copiar Resumo".
- `data.json` — os dados: as ações e o texto da ata por tópico.
- `README.md` — este arquivo.

## O chat

A aba **Chat** conversa com o Gemini sobre o conteúdo do painel — as 36 ações e a ata inteira vão no contexto de cada pergunta.

**Como usar, na primeira vez:**
1. Abra a aba Chat e clique em **Chave**.
2. Cole sua chave do Google AI Studio (gratuita em https://aistudio.google.com/apikey).
3. Clique em **Salvar** — ele testa a chave na hora e avisa se está válida.

**Onde a chave fica:** apenas no `localStorage` do seu navegador. Ela não vai para o repositório nem para nenhum servidor nosso — a chamada sai do seu navegador direto para o Google. Em outro computador ou navegador, é preciso colar de novo.

**O que ele não faz:** não grava nada no painel. Para marcar concluído e anotar, use as outras abas (isso grava no navegador, chave `jussara_dash_v5`). Para que o status valha para todo o time, o caminho é a planilha.

## Como atualizar o conteúdo

1. Substitua o `data.json` (ou peça à Lola para regenerar a partir da planilha/transcrição).
2. Recarregue a página. O navegador busca o JSON com `cache: no-store`, então a mudança aparece na hora.

## Estrutura do data.json

```json
{
  "acoes": [ { "id", "topicNumber", "topicTitle", "area", "title",
               "assignee", "deadline", "priority", "status",
               "context", "notes" } ],
  "ata": { "1": "resumo do tópico 1", "...": "..." },
  "atualizado": "05/11/2026"
}
```

## Duas versões, propósitos diferentes

| | GitHub Pages (este repo) | Google Apps Script |
|---|---|---|
| O que faz | consulta rápida e compartilhável + chat de leitura | chat + pedir ação à Lola + upload e transcrição de reunião |
| De onde lê | `data.json` | planilha "Painel Jussara & Ventura — Dados" |
| Quem atualiza | commit no `data.json` | a própria planilha |
| Grava no painel? | não | sim, com aprovação |

As duas convivem. O dado vivo mora na planilha; o Pages é a vitrine de leitura.

## Notas técnicas

- Progresso e anotações marcam no `localStorage` do navegador (chave `jussara_dash_v5`), por pessoa. Não voltam para o servidor.
- Tailwind e fontes vêm de CDN. Para uso 100% offline, existe a versão com Tailwind embutido (480KB) gerada por `work/painel/build_modelo.py`.
- Nenhuma credencial fica no repositório. A chave do Gemini é digitada por cada usuário no próprio navegador.
