# Painel Jussara & Ventura

Dashboard de gestão de demandas da conta Jussara–Ventura.

**Publicado em:** https://leoalmeida1-dot.github.io/painel-jussara-ventura/

## Arquivos

- `index.html` — o painel (HTML + JS, Tailwind via CDN)
- `data.json` — os dados: ações e texto da ata por tópico

## Como atualizar

1. Edite `data.json` (ou peça à Lola para regenerar a partir da planilha)
2. Recarregue a página publicada

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

## Versão com chat e upload

A versão com chat (Gemini + Lola) e upload de reuniões roda no Google Apps Script e
lê a planilha "Painel Jussara & Ventura — Dados". Este repositório é a versão pública
estática, para consulta rápida e compartilhamento.
