/* ============================================================
   CAMADA DE IDENTIDADE E LOG  (carrega DEPOIS de app.js)
   Registra quem fez o que, e envia junto com o "Enviar p/ planilha".
   ============================================================ */

var UKEY="jussara_usuario";
var LKEY="jussara_logfila";
var LOGF=[];

function quem(){try{return localStorage.getItem(UKEY)||""}catch(e){return""}}
function nomeAcao(id){var a=T.filter(function(x){return x.id===id})[0];return a?a.title:id}

function defineQuem(n){
try{ if(n) localStorage.setItem(UKEY,n); else localStorage.removeItem(UKEY);}catch(e){}
pintaQuem();
}
function pintaQuem(){
var l=document.getElementById("quemLabel"); if(!l) return;
var q=quem(); l.textContent=q||"Entrar";
var b=document.getElementById("btnQuem");
if(b) b.className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border "+
 (q?"text-sky-800 bg-sky-50 border-sky-300":"text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300");
}
function salvaLog(){
try{ localStorage.setItem(LKEY,JSON.stringify(LOGF)); }catch(e){}
atualizaBadgeLog();
}
function carregaLog(){
try{ LOGF=JSON.parse(localStorage.getItem(LKEY)||"[]")||[]; }catch(e){ LOGF=[]; }
atualizaBadgeLog();
}
function atualizaBadgeLog(){
var b=document.getElementById("btnSync"); if(!b) return;
b.textContent = LOGF.length ? ("\u21a5 Enviar p/ planilha ("+LOGF.length+")") : "\u21a5 Enviar p/ planilha";
}
function logEv(o){
LOGF.push({
 quando: agoraStr(),
 quem: quem()||"(nao identificado)",
 faca: o.faca||"",
 id: o.id||"",
 acao: o.acao||"",
 campo: o.campo||"",
 de: o.de==null?"":String(o.de),
 para: o.para==null?"":String(o.para)
});
salvaLog();
}

/* ---------- MODAL "QUEM ESTA USANDO" ---------- */
function bindQuem(){
var m=document.getElementById("quemModal"); if(!m) return;
function abre(){
 document.getElementById("quemInput").value=quem();
 document.getElementById("quemStatus").textContent = quem()? ("Identificado como "+quem()) : "Ainda nao identificado";
 m.classList.remove("hidden"); m.classList.add("flex");
}
function fecha(){ m.classList.add("hidden"); m.classList.remove("flex"); }
var b=document.getElementById("btnQuem"); if(b) b.onclick=abre;
document.getElementById("quemCancelar").onclick=fecha;
document.getElementById("quemSalvar").onclick=function(){
 var v=document.getElementById("quemInput").value.trim();
 if(!v){ document.getElementById("quemStatus").textContent="Digite um nome"; return; }
 defineQuem(v); fecha(); toast("Agora as alteracoes saem como "+v,"ok");
};
document.getElementById("quemInput").addEventListener("keydown",function(e){
 if(e.key==="Enter"){ e.preventDefault(); document.getElementById("quemSalvar").click(); }
});
m.onclick=function(e){ if(e.target.id==="quemModal") fecha(); };
pintaQuem();
if(!quem()) setTimeout(abre,700);
}

/* ---------- VERSOES COM LOG (sobrescrevem as do app.js) ---------- */
function toggle(id){
var t=T.filter(function(x){return x.id===id})[0]; if(!t) return;
var de=t.status;
t.status = t.status==="Concluído" ? "Em Andamento" : "Concluído";
logTl(id,"Status: "+de+" → "+t.status);
logEv({faca:"mudou status",id:id,acao:t.title,campo:"Status",de:de,para:t.status});
salvar(); render(); toast(t.title.slice(0,28)+"… → "+t.status,"ok");
}
function ciclo(id){
var t=T.filter(function(x){return x.id===id})[0]; if(!t) return;
var de=t.status;
t.status = t.status==="Pendente" ? "Em Andamento" : (t.status==="Em Andamento" ? "Concluído" : "Pendente");
logTl(id,"Status: "+de+" → "+t.status);
logEv({faca:"avancou status",id:id,acao:t.title,campo:"Status",de:de,para:t.status});
salvar(); render();
}
function renderChecklist(id){
var e=extraDe(id),box=document.getElementById("mChkList"),cnt=document.getElementById("mChkCount");
cnt.textContent = e.chk.length ? (e.chk.filter(function(c){return c.ok}).length+" de "+e.chk.length) : "vazio";
if(!e.chk.length){
 box.innerHTML='<div class="text-[11px] text-slate-400 italic px-1 py-1">Nenhuma tarefa ainda.</div>'; return;
}
box.innerHTML=e.chk.map(function(c,i){
 return '<div class="flex items-start gap-2 px-1 py-1 rounded hover:bg-slate-50 group">'+
 '<input type="checkbox" data-chk="'+i+'" '+(c.ok?"checked":"")+' class="mt-0.5 rounded text-emerald-600 h-3.5 w-3.5 shrink-0 cursor-pointer">'+
 '<span class="flex-1 text-[11px] leading-snug '+(c.ok?"line-through text-slate-400":"text-slate-700")+'">'+esc(c.t)+'</span>'+
 '<button data-chkdel="'+i+'" class="text-slate-300 hover:text-rose-600 text-xs shrink-0 opacity-0 group-hover:opacity-100">×</button></div>';
}).join("");
box.querySelectorAll("[data-chk]").forEach(function(cb){
 cb.onchange=function(){
  var i=+this.dataset.chk, e2=extraDe(sel);
  e2.chk[i].ok=this.checked;
  logTl(sel,(this.checked?"Concluiu: ":"Reabriu: ")+e2.chk[i].t);
  logEv({faca:this.checked?"concluiu item do checklist":"reabriu item do checklist",
         id:sel,acao:nomeAcao(sel),campo:e2.chk[i].t,
         de:this.checked?"Não":"Sim",para:this.checked?"Sim":"Não"});
  salvaExtra(); renderChecklist(sel); renderTimeline(sel);
 };
});
box.querySelectorAll("[data-chkdel]").forEach(function(b){
 b.onclick=function(){
  var i=+this.dataset.chkdel, e2=extraDe(sel), t=e2.chk[i].t;
  e2.chk.splice(i,1);
  logTl(sel,"Removeu do checklist: "+t);
  logEv({faca:"removeu item do checklist",id:sel,acao:nomeAcao(sel),campo:t,de:"existia",para:"removido"});
  salvaExtra(); renderChecklist(sel); renderTimeline(sel);
 };
});
}
function bindExtraModal(){
document.getElementById("mChkAdd").onclick=function(){
 var inp=document.getElementById("mChkInput"), v=inp.value.trim();
 if(!v||!sel) return;
 extraDe(sel).chk.push({t:v,ok:false});
 logTl(sel,"Adicionou ao checklist: "+v);
 logEv({faca:"adicionou item ao checklist",id:sel,acao:nomeAcao(sel),campo:v,de:"",para:"adicionado"});
 inp.value=""; salvaExtra(); renderChecklist(sel); renderTimeline(sel);
};
document.getElementById("mChkInput").addEventListener("keydown",function(e){
 if(e.key==="Enter"){e.preventDefault();document.getElementById("mChkAdd").click();}
});
document.getElementById("mTlAdd").onclick=function(){
 var inp=document.getElementById("mTlInput"), v=inp.value.trim();
 if(!v||!sel) return;
 logTl(sel,v,true);
 logEv({faca:"registrou na linha do tempo",id:sel,acao:nomeAcao(sel),campo:"Linha do tempo",de:"",para:v});
 inp.value=""; renderTimeline(sel);
};
document.getElementById("mTlInput").addEventListener("keydown",function(e){
 if(e.key==="Enter"){e.preventDefault();document.getElementById("mTlAdd").click();}
});
}
function bindSalvarFicha(){
var b=document.getElementById("mSave"); if(!b) return;
b.onclick=function(){
 var t=T.filter(function(x){return x.id===sel})[0]; if(!t) return;
 var marcado=document.getElementById("mDone").checked;
 var de=t.status;
 var novo = marcado ? "Concluído" : (t.status==="Concluído" ? "Em Andamento" : t.status);
 if(novo!==de){
  logTl(sel,"Status: "+de+" → "+novo);
  logEv({faca:"mudou status (ficha)",id:sel,acao:t.title,campo:"Status",de:de,para:novo});
 }
 var notaAntes=t.notes||"";
 var notaNova=document.getElementById("mNotes").value.trim();
 if(notaNova!==notaAntes){
  logTl(sel,notaAntes?"Anotação atualizada":"Anotação adicionada");
  logEv({faca:"editou anotação",id:sel,acao:t.title,campo:"Anotações",de:notaAntes,para:notaNova});
 }
 t.status=novo; t.notes=notaNova;
 salvar(); render(); fechar(); toast("Alterações salvas","ok");
};
}

/* ---------- ENVIO LEVANDO O LOG ---------- */
function enviarPlanilha(){
var chk=todasChk(), tl=todasTl();
if(!chk.length && !tl.length && !LOGF.length){ toast("Nada para enviar ainda — preencha um checklist primeiro","warn"); return; }
var btn=document.getElementById("btnSync");
btn.disabled=true; btn.textContent="enviando…";
var payload={acao:"sync_painel",origem:"painel-jussara",enviado_em:agoraStr(),
 quem:quem(),checklist:chk,timeline:tl,log:LOGF.slice(),
 json:JSON.stringify({checklist:chk,timeline:tl,log:LOGF})};
fetch(SYNC_WEBHOOK,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify(payload)})
.then(function(){
 btn.disabled=false;
 var n=LOGF.length;
 LOGF=[]; salvaLog(); atualizaBadgeLog();
 toast(chk.length+" itens + "+tl.length+" eventos + "+n+" registros de log enviados","ok");
 baixarSync(chk,tl,true);
})
.catch(function(e){
 btn.disabled=false; atualizaBadgeLog();
 toast("Envio falhou ("+e.message+") — baixando o arquivo","warn");
 baixarSync(chk,tl,false);
});
}

/* ---------- INICIALIZACAO ---------- */
document.addEventListener("DOMContentLoaded",function(){
carregaLog();
bindQuem();
bindSalvarFicha();
var bs=document.getElementById("btnSync"); if(bs) bs.onclick=enviarPlanilha;
});
