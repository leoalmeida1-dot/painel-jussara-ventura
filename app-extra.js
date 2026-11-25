/* ============================================================
   ÁREAS NOVAS DO PAINEL — pedidos do Leo em 25/11/2026
   1) LEMBRETES: ações sem prazo, sempre no radar, separadas
   2) NOTIFICAÇÕES: o que mudou no painel, visível para todos
   Carrega DEPOIS de app.js e app-log.js.
   ============================================================ */

var LKEY_L = "jussara_lembretes";
var LKEY_N = "jussara_notif_lidas";
var LKEY_S = "jussara_notif_snapshot";

/* ---------- 1. LEMBRETES ---------- */
function lembretes(){
  try { return JSON.parse(localStorage.getItem(LKEY_L) || "[]") || []; } catch(e){ return []; }
}
function salvaLembretes(l){
  try { localStorage.setItem(LKEY_L, JSON.stringify(l)); } catch(e){}
}
function addLembrete(txt, resp){
  var l = lembretes();
  l.push({ id: "L" + Date.now(), t: txt, r: resp || "", d: agoraStr(), ok: false });
  salvaLembretes(l); renderLembretes();
}
function removeLembrete(id){
  salvaLembretes(lembretes().filter(function(x){ return x.id !== id; }));
  renderLembretes();
}
function toggleLembrete(id){
  var l = lembretes();
  l.forEach(function(x){ if(x.id === id) x.ok = !x.ok; });
  salvaLembretes(l); renderLembretes();
}

function renderLembretes(){
  var box = document.getElementById("vLembretes");
  if(!box) return;
  var l = lembretes();
  var abertos = l.filter(function(x){ return !x.ok; });

  var h = '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">'
    + '<div class="flex items-start gap-2.5">'
    + '<span class="text-xl leading-none">📌</span>'
    + '<div><h3 class="font-bold text-sm text-amber-900">Lembretes permanentes</h3>'
    + '<p class="text-[11.5px] text-amber-800 mt-1 leading-relaxed">Itens <b>sem prazo</b> que precisam ser revistos em toda reunião para não saírem do radar. '
    + 'Não são tarefas com data — são coisas que não podem ser esquecidas.</p></div></div></div>';

  h += '<div class="bg-white border border-slate-200 rounded-xl p-3 mb-4">'
    + '<div class="flex flex-col sm:flex-row gap-2">'
    + '<input id="lemInput" type="text" placeholder="O que não pode ser esquecido…" class="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500">'
    + '<input id="lemResp" type="text" placeholder="Resp. (opcional)" class="sm:w-40 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500">'
    + '<button id="lemAdd" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shrink-0">Adicionar</button>'
    + '</div></div>';

  if(!abertos.length){
    h += '<div class="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">'
      + 'Nenhum lembrete em aberto. Use o campo acima para guardar o que não pode ser esquecido.</div>';
  } else {
    h += '<div class="space-y-2">';
    abertos.forEach(function(x){
      h += '<div class="bg-white border border-amber-200 rounded-xl p-3 flex items-start gap-3 hover:shadow-sm transition">'
        + '<input type="checkbox" data-lem="' + x.id + '" class="mt-0.5 h-4 w-4 rounded text-amber-600 cursor-pointer shrink-0">'
        + '<div class="flex-1 min-w-0">'
        + '<div class="text-sm text-slate-800 leading-snug">' + esc(x.t) + '</div>'
        + '<div class="text-[10.5px] text-slate-500 mt-1">' + (x.r ? 'Resp.: ' + esc(x.r) + ' · ' : '') + 'desde ' + esc(x.d) + '</div>'
        + '</div>'
        + '<button data-lemdel="' + x.id + '" class="text-slate-400 hover:text-rose-600 text-xs px-1 shrink-0" title="Remover">✕</button>'
        + '</div>';
    });
    h += '</div>';
  }

  var feitos = l.filter(function(x){ return x.ok; });
  if(feitos.length){
    h += '<details class="mt-4"><summary class="text-[11.5px] text-slate-500 cursor-pointer hover:text-slate-700">'
      + feitos.length + ' lembrete(s) resolvido(s)</summary><div class="space-y-1.5 mt-2">';
    feitos.forEach(function(x){
      h += '<div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2.5">'
        + '<input type="checkbox" data-lem="' + x.id + '" checked class="h-4 w-4 rounded text-amber-600 cursor-pointer shrink-0">'
        + '<span class="text-[12.5px] text-slate-500 line-through flex-1">' + esc(x.t) + '</span>'
        + '<button data-lemdel="' + x.id + '" class="text-slate-300 hover:text-rose-600 text-xs px-1">✕</button>'
        + '</div>';
    });
    h += '</div></details>';
  }

  box.innerHTML = h;

  var add = document.getElementById("lemAdd");
  var inp = document.getElementById("lemInput");
  var rsp = document.getElementById("lemResp");
  if(add) add.addEventListener("click", function(){
    var v = inp.value.trim(); if(!v) return;
    addLembrete(v, rsp.value.trim());
    inp.value = ""; rsp.value = "";
    toast("Lembrete adicionado", "ok");
  });
  if(inp) inp.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); document.getElementById("lemAdd").click(); }
  });
  box.querySelectorAll("[data-lem]").forEach(function(cb){
    cb.addEventListener("change", function(){ toggleLembrete(cb.getAttribute("data-lem")); });
  });
  box.querySelectorAll("[data-lemdel]").forEach(function(b){
    b.addEventListener("click", function(){ removeLembrete(b.getAttribute("data-lemdel")); });
  });
}

/* ---------- 2. NOTIFICAÇÕES ---------- */
/* Snapshot = {id: "status|notes"} do estado dos dados. Quando o data.json
   muda (alguém publicou alteração), o diff aparece como notificação. */

function snapshotAtual(){
  var s = {};
  (DADOS.acoes || []).forEach(function(a){
    s[a.id] = (a.status || "") + "|" + (a.notes || "") + "|" + (a.deadline || "") + "|" + (a.assignee || "");
  });
  return s;
}
function notifLidas(){
  try { return JSON.parse(localStorage.getItem(LKEY_N) || "[]") || []; } catch(e){ return []; }
}
function marcaLida(id){
  var l = notifLidas(); if(l.indexOf(id) < 0){ l.push(id); }
  try { localStorage.setItem(LKEY_N, JSON.stringify(l)); } catch(e){}
}
function marcaTodasLidas(){
  var ids = notificacoes().map(function(n){ return n.id; });
  try { localStorage.setItem(LKEY_N, JSON.stringify(notifLidas().concat(ids))); } catch(e){}
  // guarda o estado atual como nova base: o diff some até a próxima alteração
  try { localStorage.setItem(LKEY_S, JSON.stringify(snapshotAtual())); } catch(e){}
  renderNotifBadge(); renderNotificacoes();
}

function notificacoes(){
  var antigo = null;
  try { antigo = JSON.parse(localStorage.getItem(LKEY_S) || "null"); } catch(e){}
  var atual = snapshotAtual();
  if(!antigo){
    try { localStorage.setItem(LKEY_S, JSON.stringify(atual)); } catch(e){}
    return [];
  }
  var out = [];
  Object.keys(atual).forEach(function(id){
    var a = atual[id];
    if(!antigo[id]) return; // ação nova entra no data.json: não é "alteração de card"
    if(antigo[id] === a) return;
    var pa = String(antigo[id]).split("|"), na = String(a).split("|");
    var tags = [];
    if(pa[0] !== na[0]) tags.push("status: " + (pa[0] || "—") + " → " + (na[0] || "—"));
    if(pa[2] !== na[2]) tags.push("prazo: " + (pa[2] || "—") + " → " + (na[2] || "—"));
    if(pa[3] !== na[3]) tags.push("responsável: " + (pa[3] || "—") + " → " + (na[3] || "—"));
    if(pa[1] !== na[1]) tags.push("anotação atualizada");
    if(!tags.length) return;
    var acao = (DADOS.acoes || []).filter(function(x){ return x.id === id; })[0] || {};
    out.push({ id: id + "@" + na.join("|"), acaoId: id, titulo: acao.title || id,
               tags: tags, status: na[0] });
  });
  return out;
}

function renderNotifBadge(){
  var b = document.getElementById("notifBadge");
  if(!b) return;
  var lidas = notifLidas();
  var novas = notificacoes().filter(function(n){ return lidas.indexOf(n.id) < 0; }).length;
  if(novas > 0){
    b.textContent = novas > 9 ? "9+" : String(novas);
    b.className = "absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9.5px] font-bold flex items-center justify-center";
    b.classList.remove("hidden");
  } else {
    b.classList.add("hidden");
  }
}

function renderNotificacoes(){
  var box = document.getElementById("vNotif");
  if(!box) return;
  var todas = notificacoes().reverse();
  var lidas = notifLidas();
  var novas = todas.filter(function(n){ return lidas.indexOf(n.id) < 0; });

  var h = '<div class="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">'
    + '<div class="flex items-start gap-2.5">'
    + '<span class="text-xl leading-none">🔔</span>'
    + '<div class="flex-1"><h3 class="font-bold text-sm text-sky-900">O que mudou no painel</h3>'
    + '<p class="text-[11.5px] text-sky-800 mt-1 leading-relaxed">Alterações feitas por qualquer pessoa: '
    + 'status, prazo, responsável e anotações. Atualiza quando o painel é recarregado com dados novos.</p></div>'
    + (novas.length ? '<button id="notifTodas" class="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-semibold rounded-lg shrink-0">Marcar todas como lidas</button>' : '')
    + '</div></div>';

  if(!todas.length){
    h += '<div class="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">'
      + 'Nenhuma alteração detectada desde a última vez que você abriu o painel.</div>';
  } else {
    h += '<div class="space-y-2">';
    todas.forEach(function(n){
      var lida = lidas.indexOf(n.id) >= 0;
      var cor = n.status === "Concluído" ? "emerald" : n.status === "Em Andamento" ? "sky" : "slate";
      h += '<div class="bg-white border ' + (lida ? 'border-slate-200' : 'border-sky-300 shadow-sm') + ' rounded-xl p-3 flex items-start gap-3">'
        + '<span class="mt-0.5 w-2 h-2 rounded-full shrink-0 ' + (lida ? 'bg-slate-300' : 'bg-sky-500') + '"></span>'
        + '<div class="flex-1 min-w-0">'
        + '<div class="text-[13px] font-semibold text-slate-800 leading-snug">' + esc(n.titulo) + '</div>'
        + '<div class="flex flex-wrap gap-1.5 mt-1.5">'
        + n.tags.map(function(t){
            return '<span class="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-' + cor + '-100 text-' + cor + '-800">' + esc(t) + '</span>';
          }).join("")
        + '</div></div>'
        + '<span class="text-[10px] text-slate-400 shrink-0">' + esc(n.acaoId) + '</span>'
        + '</div>';
    });
    h += '</div>';
  }

  box.innerHTML = h;
  var bt = document.getElementById("notifTodas");
  if(bt) bt.addEventListener("click", marcaTodasLidas);
}

/* ---------- contadores ---------- */
function atualizaContadorLembretes(){
  var c = document.getElementById("lemCount");
  if(!c) return;
  var n = lembretes().filter(function(x){ return !x.ok; }).length;
  c.textContent = n ? "(" + n + ")" : "";
}
function gravaSnapshot(){
  try { localStorage.setItem(LKEY_S, JSON.stringify(snapshotAtual())); } catch(e){}
}
document.addEventListener("DOMContentLoaded", function(){
  setTimeout(function(){ renderNotifBadge(); atualizaContadorLembretes(); }, 900);
});
