# Painel Jussara & Ventura

Dashboard de gestão de demandas da conta Jussara–Ventura.

**No ar em:** https://leoalmeida1-dot.github.io/painel-jussara-ventura/

## Estado atual (05/11/2026)

- 36 ações mapeadas · 18 tópicos de ata
- 22 Pendente · 10 Em Andamento · 4 Concluído (11%)
- 21 prazos em 05/11 · 15 prazos em 12/11
- Marcos críticos: Vendas Trade 06/11 09h · EUA (Luana) 15/11 · SPRIM Nutri 24/11 · Férias Messias 03–10/12

## Arquivos

- `index.html` — o painel (HTML + JS, Tailwind via CDN). Quatro visões: Cards, Tabela, Kanban e Ata/Tópicos, com busca, cinco filtros, modal de detalhe, anotações e "Copiar Resumo".
- `data.json` — os dados: as ações e o texto da ata por tópico.
- `README.md` — este arquivo.

## Como atualizar

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
| O que faz | consulta rápida, compartilhável, estática | chat com Gemini + pedir ação à Lola + upload de reunião |
| De onde lê | `data.json` | planilha "Painel Jussara & Ventura — Dados" |
| Quem atualiza | commit no `data.json` | a própria planilha |

As duas convivem. O dado vivo mora na planilha; o Pages é a vitrine de leitura.

## Notas técnicas

- Progresso e anotações marcam no `localStorage` do navegador (chave `jussara_dash_v5`), por pessoa. Não voltam para o servidor — é um painel de leitura.
- Tailwind e fontes vêm de CDN. Para uso 100% offline, existe a versão com Tailwind embutido (480KB) gerada por `work/painel/build_modelo.py`.
