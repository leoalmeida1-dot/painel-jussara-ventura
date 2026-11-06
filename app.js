var DADOS={acoes:[],ata:{}},T=[],view="cards",sel=null;
var KEY="jussara_dash_v5";
var GKEY="jussara_gemini_key",HIST=[],enviando=false;
var faltaFiltro="todos";
var MACRO_ABERTO=null;
var MULTI={area:[],resp:[],status:[],prio:[]};
var MULTI_QTD={area:0,resp:0,status:0,prio:0};
function semDono(t){var a=String(t.assignee||"").trim().toLowerCase();return !a||a==="a definir"||a==="definir"||a==="—"||a==="-"}
function semPrazo(t){var p=String(t.deadline||"").trim().toLowerCase();return !p||p==="a definir"||p==="—"||p==="-"}
function precisaAtencao(t){return semDono(t)||semPrazo(t)}
function lacunas(t){var l=[];if(semDono(t))l.push("responsável");if(semPrazo(t))l.push("prazo");return l}
var MODELOS=["gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash"];
var AREA={MaxPro:"bg-red-50 text-red-700 border-red-200",Sonhos:"bg-amber-50 text-amber-800 border-amber-200",SPRIM:"bg-indigo-50 text-indigo-700 border-indigo-200","Influência":"bg-purple-50 text-purple-700 border-purple-200",Institucional:"bg-blue-50 text-blue-700 border-blue-200",RH:"bg-teal-50 text-teal-700 border-teal-200",Planejamento:"bg-slate-100 text-slate-800 border-slate-200"};
var PRIO={"Crítica":"bg-rose-100 text-rose-800 border-rose-300 font-semibold",Alta:"bg-amber-100 text-amber-800 border-amber-300",Média:"bg-blue-100 text-blue-800 border-blue-300",Baixa:"bg-slate-100 text-slate-700 border-slate-300"};
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function toast(m,t){var c=document.getElementById("toast"),d=document.createElement("div");d.className="px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg "+(t==="ok"?"bg-emerald-800":"bg-slate-800")+" text-white";d.textContent=m;c.appendChild(d);setTimeout(function(){d.remove()},2600)}
function carregar(){return fetch("data.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(d){DADOS=d;window.__OK=true;return d})}
function init(){var raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}var ov=raw?JSON.parse(raw):[];T=(DADOS.acoes||[]).map(function(a){var o=ov.filter(function(x){return x.id===a.id})[0];return o?{...a,status:o.status,notes:o.notes}:a})}
function salvar(){try{localStorage.setItem(KEY,JSON.stringify(T.map(function(t){return{id:t.id,status:t.status,notes:t.notes}})))}catch(e){}salvaExtra();kpis()}
/* ---------- CHECKLIST + TIMELINE (por ação, no navegador) ---------- */
var EXKEY="jussara_extra_v1";
var EXTRA={};
function carregaExtra(){try{EXTRA=JSON.parse(localStorage.getItem(EXKEY)||"{}")||{}}catch(e){EXTRA={}}}
function salvaExtra(){try{localStorage.setItem(EXKEY,JSON.stringify(EXTRA))}catch(e){}}
function extraDe(id){
if(!EXTRA[id])EXTRA[id]={chk:[],tl:[]};
if(!EXTRA[id].chk)EXTRA[id].chk=[];
if(!EXTRA[id].tl)EXTRA[id].tl=[];
return EXTRA[id]}
function agoraStr(){var d=new Date();function p(n){return("0"+n).slice(-2)}
return p(d.getDate())+"/"+p(d.getMonth()+1)+"/"+d.getFullYear()+" "+p(d.getHours())+":"+p(d.getMinutes())}
function logTl(id,txt,manual){var e=extraDe(id);e.tl.push({d:agoraStr(),t:txt,m:!!manual});salvaExtra()}
function chkConcluidos(id){return extraDe(id).chk.filter(function(c){return c.ok}).length}
function renderChecklist(id){
var e=extraDe(id),box=document.getElementById("mChkList"),cnt=document.getElementById("mChkCount");
cnt.textContent=e.chk.length?(e.chk.filter(function(c){return c.ok}).length+" de "+e.chk.length):"vazio";
if(!e.chk.length){box.innerHTML='<div class="text-[11px] text-slate-400 italic px-1 py-1">Nenhuma tarefa ainda.</div>';return}
box.innerHTML=e.chk.map(function(c,i){
return '<div class="flex items-start gap-2 px-1 py-1 rounded hover:bg-slate-50 group">'+
'<input type="checkbox" data-chk="'+i+'" '+(c.ok?"checked":"")+' class="mt-0.5 rounded text-emerald-600 h-3.5 w-3.5 shrink-0 cursor-pointer">'+
'<span class="flex-1 text-[11px] leading-snug '+(c.ok?"line-through text-slate-400":"text-slate-700")+'">'+esc(c.t)+'</span>'+
'<button data-chkdel="'+i+'" class="text-slate-300 hover:text-rose-600 text-xs shrink-0 opacity-0 group-hover:opacity-100">×</button></div>'}).join("");
box.querySelectorAll("[data-chk]").forEach(function(cb){cb.onchange=function(){
 var i=+this.dataset.chk,e2=extraDe(sel);
 e2.chk[i].ok=this.checked;logEv({faca:this.checked?"concluiu item do checklist":"reabriu item do checklist",id:sel,acao:nomeAcao(sel),campo:e2.chk[i].t,de:this.checked?"Não":"Sim",para:this.checked?"Sim":"Não"});
 logTl(sel,(this.checked?"Concluiu: ":"Reabriu: ")+e2.chk[i].t);
 salvaExtra();renderChecklist(sel);renderTimeline(sel)}});
box.querySelectorAll("[data-chkdel]").forEach(function(b){b.onclick=function(){
 var i=+this.dataset.chkdel,e2=extraDe(sel),t=e2.chk[i].t;
 e2.chk.splice(i,1);logEv({faca:"removeu item do checklist",id:sel,acao:nomeAcao(sel),campo:t,de:"existia",para:"removido"});logTl(sel,"Removeu do checklist: "+t);
 salvaExtra();renderChecklist(sel);renderTimeline(sel)}});
}
function renderTimeline(id){
var e=extraDe(id),box=document.getElementById("mTimeline"),cnt=document.getElementById("mTlCount");
cnt.textContent=e.tl.length?e.tl.length:"vazio";
if(!e.tl.length){box.innerHTML='<div class="text-[11px] text-slate-400 italic px-1 py-1">Sem registros ainda.</div>';return}
var ord=e.tl.map(function(x,i){return {i:i,x:x}}).sort(function(a,b){return b.i-a.i});
box.innerHTML=ord.map(function(o){
var x=o.x;
return '<div class="flex gap-2 py-1.5 border-b border-slate-100 last:border-0">'+
'<div class="shrink-0 pt-0.5"><span class="block w-1.5 h-1.5 rounded-full '+(x.m?"bg-sky-500":"bg-emerald-500")+' mt-1"></span></div>'+
'<div class="min-w-0 flex-1"><div class="text-[11px] text-slate-700 leading-snug">'+esc(x.t)+'</div>'+
'<div class="text-[10px] text-slate-400 mt-0.5">'+esc(x.d)+(x.m?" · manual":"")+'</div></div></div>'}).join("");
}
function bindExtraModal(){
document.getElementById("mChkAdd").onclick=function(){
var inp=document.getElementById("mChkInput"),v=inp.value.trim();
if(!v||!sel)return;
extraDe(sel).chk.push({t:v,ok:false});logTl(sel,"Adicionou ao checklist: "+v);logEv({faca:"adicionou item ao checklist",id:sel,acao:nomeAcao(sel),campo:v,de:"",para:"adicionado"});
inp.value="";salvaExtra();renderChecklist(sel);renderTimeline(sel)};
document.getElementById("mChkInput").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();document.getElementById("mChkAdd").click()}});
document.getElementById("mTlAdd").onclick=function(){
var inp=document.getElementById("mTlInput"),v=inp.value.trim();
if(!v||!sel)return;
logTl(sel,v,true),logEv({faca:"registrou na linha do tempo",id:sel,acao:nomeAcao(sel),campo:"Linha do tempo",de:"",para:v});inp.value="";renderTimeline(sel)};
document.getElementById("mTlInput").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();document.getElementById("mTlAdd").click()}});
}
function kpis(){var d=T.filter(function(t){return t.status==="Concluído"}).length,p=Math.round(d/(T.length||1)*100);
document.getElementById("kTotal").textContent=T.length;
document.getElementById("k05").textContent=T.filter(function(t){return t.deadline==="05/11/2026"}).length;
document.getElementById("k12").textContent=T.filter(function(t){return t.deadline==="12/11/2026"}).length;
document.getElementById("kDone").textContent=d;
document.getElementById("kPct").textContent=p+"% pronto";
var falta=T.filter(function(t){return t.status!=="Concluído"&&precisaAtencao(t)}).length;
var el=document.getElementById("kFalta");if(el)el.textContent=falta;
var kb=document.getElementById("kAlerta");
if(kb){if(falta>0){kb.className="text-left bg-amber-50/60 p-3.5 rounded-xl border border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"}
else{kb.className="text-left bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer"}}}
function filtrados(){var q=document.getElementById("q").value.toLowerCase().trim(),dp=document.getElementById("fPrazo").value;
return T.filter(function(t){
if(faltaFiltro==="semDono"&&!semDono(t))return false;
if(faltaFiltro==="semPrazo"&&!semPrazo(t))return false;
if(faltaFiltro==="qualquer"&&!precisaAtencao(t))return false;
if(dp!=="ALL"&&t.deadline!==dp)return false;
if(MULTI.area.length&&MULTI.area.indexOf(t.area)<0)return false;
if(MULTI.resp.length&&!MULTI.resp.some(function(x){return (t.assignee||"").toLowerCase().indexOf(x.toLowerCase())>=0}))return false;
if(MULTI.status.length&&MULTI.status.indexOf(t.status)<0)return false;
if(MULTI.prio.length&&MULTI.prio.indexOf(t.priority)<0)return false;
if(q){var s=(t.title+" "+t.context+" "+t.assignee+" "+t.topicTitle).toLowerCase();if(s.indexOf(q)<0)return false}
return true})}
function cards(l){var c=document.getElementById("vCards");
if(!l.length){c.innerHTML='<div class="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-sm text-slate-600">Nenhuma ação para estes filtros.</div>';return}
c.innerHTML=l.map(function(t){var d=t.status==="Concluído";
var falta=d?"":(precisaAtencao(t)?'<div class="mt-2 ml-7 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold">⚠ falta '+lacunas(t).join(" e ")+'</div>':"");
var borda=d?"border-slate-200 opacity-75":(precisaAtencao(t)?"border-amber-300 hover:border-amber-400":"border-slate-200 hover:border-sky-300");
return '<div class="bg-white rounded-xl border '+borda+' p-4 flex flex-col justify-between cursor-pointer" data-abrir="'+esc(t.id)+'">'+
'<div><div class="flex items-center justify-between gap-2 mb-2"><div class="flex items-center gap-1.5 overflow-hidden"><span class="px-2 py-0.5 rounded text-[11px] font-semibold border '+(AREA[t.area]||"bg-slate-100")+'">'+esc(t.area)+'</span><span class="text-[11px] text-slate-400 truncate">Item '+t.topicNumber+'</span></div><span class="px-1.5 py-0.5 rounded text-[10px] uppercase border '+(PRIO[t.priority]||"")+'">'+esc(t.priority)+'</span></div>'+
'<div class="flex items-start gap-2.5 mb-2"><button data-toggle="'+esc(t.id)+'" class="mt-0.5 shrink-0 '+(d?"text-emerald-600":"text-slate-400 hover:text-emerald-600")+'" title="Alternar">'+(d?"✓":"○")+'</button>'+
'<h4 class="text-xs sm:text-sm font-semibold '+(d?"line-through text-slate-400":"text-slate-900")+' leading-snug">'+esc(t.title)+'</h4></div>'+
falta+
'<p class="text-xs text-slate-500 line-clamp-2 mb-3 pl-7">'+esc(t.context)+'</p></div>'+
'<div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs pl-7">'+
'<div><span class="text-[10px] text-slate-400 uppercase block">Resp.</span><span class="font-medium text-slate-800">'+esc(t.assignee)+'</span></div>'+
'<div class="text-right"><span class="text-[10px] text-slate-400 uppercase block">Prazo</span><span class="font-semibold '+(t.deadline==="05/11/2026"?"text-amber-800":"text-slate-800")+'">'+esc(t.deadline)+'</span></div>'+
'<button data-abrir="'+esc(t.id)+'" class="text-sky-700 hover:underline text-[11px] font-semibold">Ver</button></div></div>'}).join("")}
function tabela(l){var b=document.getElementById("tbody");
if(!l.length){b.innerHTML='<tr><td colspan="7" class="text-center py-8 text-slate-500">Nenhum registro.</td></tr>';return}
b.innerHTML=l.map(function(t){var d=t.status==="Concluído";
return '<tr class="hover:bg-slate-100 cursor-pointer" data-abrir="'+esc(t.id)+'"><td class="py-3 px-3 text-center"><button data-toggle="'+esc(t.id)+'" class="'+(d?"text-emerald-600":"text-slate-400")+'">'+(d?"✓":"○")+'</button></td>'+
'<td class="py-3 px-3"><div class="font-medium '+(d?"line-through text-slate-400":"text-slate-900")+'">'+esc(t.title)+'</div><div class="text-[11px] text-slate-400">Item '+t.topicNumber+': '+esc(t.topicTitle)+'</div></td>'+
'<td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-xs border '+(AREA[t.area]||"")+'">'+esc(t.area)+'</span></td>'+
'<td class="py-3 px-3 font-medium text-slate-800">'+esc(t.assignee)+'</td>'+
'<td class="py-3 px-3 font-semibold '+(t.deadline==="05/11/2026"?"text-amber-800":"")+'">'+esc(t.deadline)+'</td>'+
'<td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-xs border '+(PRIO[t.priority]||"")+'">'+esc(t.priority)+'</span></td>'+
'<td class="py-3 px-3 text-center"><button data-abrir="'+esc(t.id)+'" class="text-sky-700 text-xs font-semibold hover:underline">Detalhes</button></td></tr>'}).join("")}
function kanban(l){
var p=l.filter(function(t){return t.status==="Pendente"}),a=l.filter(function(t){return t.status==="Em Andamento"}),d=l.filter(function(t){return t.status==="Concluído"});
document.getElementById("kcP").textContent=p.length;document.getElementById("kcA").textContent=a.length;document.getElementById("kcD").textContent=d.length;
function card(t){var done=t.status==="Concluído";
return '<div class="bg-white p-3 rounded-lg border '+(precisaAtencao(t)&&!done?"border-amber-300":"border-slate-200")+' hover:border-sky-300 space-y-1.5 cursor-pointer" data-abrir="'+esc(t.id)+'"><div class="flex justify-between text-[11px]"><span class="px-1.5 py-0.5 rounded border '+(AREA[t.area]||"")+'">'+esc(t.area)+'</span><span class="px-1.5 py-0.5 rounded border '+(PRIO[t.priority]||"")+'">'+esc(t.priority)+'</span></div>'+
'<p class="text-xs font-semibold '+(done?"line-through text-slate-400":"text-slate-900")+' leading-snug">'+esc(t.title)+'</p>'+
'<div class="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100"><span class="truncate max-w-[100px] font-medium text-slate-700">'+esc(t.assignee)+'</span><span class="font-bold text-slate-800">'+esc(t.deadline)+'</span></div>'+
'<div class="flex justify-between pt-1 text-[11px]"><button data-ciclo="'+esc(t.id)+'" class="text-sky-700 underline">Avançar</button><button data-abrir="'+esc(t.id)+'" class="text-slate-400">Ver</button></div></div>'}
document.getElementById("kP").innerHTML=p.length?p.map(card).join(""):'<div class="text-center py-6 text-xs text-slate-400">Nada pendente</div>';
document.getElementById("kA").innerHTML=a.length?a.map(card).join(""):'<div class="text-center py-6 text-xs text-slate-400">Nada em andamento</div>';
document.getElementById("kD").innerHTML=d.length?d.map(card).join(""):'<div class="text-center py-6 text-xs text-slate-400">Nada concluído</div>'}
function pauta(l){var c=document.getElementById("vPauta"),map={};
(DADOS.acoes||[]).forEach(function(a){if(!map[a.topicNumber])map[a.topicNumber]={n:a.topicNumber,title:a.topicTitle,area:a.area,acts:[]}});
l.forEach(function(a){if(map[a.topicNumber])map[a.topicNumber].acts.push(a)});
c.innerHTML=Object.keys(map).sort(function(x,y){return x-y}).map(function(k){var t=map[k],txt=(DADOS.ata||{})[k]||"";
return '<div class="bg-white rounded-xl border border-slate-200 overflow-hidden"><div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-sky-900 text-white flex items-center justify-center text-xs font-bold shrink-0">'+t.n+'</span><h3 class="text-sm font-bold text-slate-900">'+esc(t.title)+'</h3></div><span class="hidden sm:inline px-2 py-0.5 rounded text-xs border shrink-0 '+(AREA[t.area]||"")+'">'+esc(t.area)+'</span></div>'+
'<div class="p-4 space-y-3">'+(txt?'<div class="text-xs text-slate-600 leading-relaxed bg-sky-50/50 border-l-2 border-sky-300 pl-3 py-2 rounded-r">'+txt+'</div>':'')+
(t.acts.length?'<div><div class="text-[11px] font-bold uppercase text-slate-400 mb-1.5">Próximos passos</div><div class="grid grid-cols-1 md:grid-cols-2 gap-2">'+t.acts.map(function(a){var d=a.status==="Concluído";
return '<div class="p-2.5 rounded-lg border '+(d?"border-emerald-200 bg-emerald-50/30":"border-slate-200 hover:border-sky-300")+' flex justify-between gap-2 text-xs cursor-pointer" data-abrir="'+esc(a.id)+'"><div><div class="font-semibold '+(d?"line-through text-slate-400":"text-slate-900")+'">'+esc(a.title)+'</div><div class="text-[11px] text-slate-500 mt-0.5"><strong>Resp:</strong> '+esc(a.assignee)+' · <strong>Prazo:</strong> '+esc(a.deadline)+'</div></div><button data-toggle="'+esc(a.id)+'" class="shrink-0 '+(d?"text-emerald-600":"text-slate-400 hover:text-emerald-600")+'">'+(d?"✓":"○")+'</button></div>'}).join("")+'</div></div>':'<div class="text-xs text-slate-400 italic">Sem ações nesta filtragem.</div>')+'</div></div>'}).join("")}
var MULTI_CFG={
 area:{rot:"Todas as Áreas",um:"área",muitos:"áreas",fn:function(){var v={};T.forEach(function(t){if(t.area)v[t.area]=1});return Object.keys(v).sort()}},
 resp:{rot:"Todos os Responsáveis",um:"responsável",muitos:"responsáveis",fn:function(){var v={};T.forEach(function(t){String(t.assignee||"").split("/").forEach(function(n){n=n.trim();if(n&&n.toLowerCase()!=="a definir")v[n]=1})});return Object.keys(v).sort(function(a,b){return a.localeCompare(b,"pt-BR")})}},
 status:{rot:"Todos os Status",um:"status",muitos:"status",fn:function(){return ["Pendente","Em Andamento","Concluído"]}},
 prio:{rot:"Todas as Prioridades",um:"prioridade",muitos:"prioridades",fn:function(){return ["Crítica","Alta","Média","Baixa"]}}
};
function montaMulti(){
Object.keys(MULTI_CFG).forEach(function(k){
 var cfg=MULTI_CFG[k],wrap=document.querySelector('.msWrap[data-ms="'+k+'"]');
 if(!wrap)return;
 var painel=wrap.querySelector(".msPanel");
 var ops=cfg.fn();
 var marcadas=MULTI[k];
 var html='';
 if(ops.length){
  var todas=(marcadas.length===0);
  html+='<button type="button" data-todas="'+k+'" class="w-full text-left px-2 py-1.5 rounded text-[11px] font-semibold '+(todas?"text-sky-700 bg-sky-50":"text-slate-600 hover:bg-slate-50")+'">'+(todas?"✓ ":"")+cfg.rot+'</button>';
  html+='<div class="h-px bg-slate-100 my-1"></div>';
  html+=ops.map(function(o){
   var on=marcadas.indexOf(o)>=0;
   return '<label class="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700"><input type="checkbox" data-mk="'+k+'" value="'+esc(o)+'" '+(on?"checked":"")+' class="rounded text-sky-600 h-3.5 w-3.5 shrink-0"><span class="truncate">'+esc(o)+'</span></label>'}).join("");
 }else{
  html='<div class="px-2 py-2 text-[11px] text-slate-400">Nada disponível</div>';
 }
 painel.innerHTML=html;
 var lab=wrap.querySelector(".msLabel");
 if(!marcadas.length){lab.textContent=cfg.rot;lab.className="msLabel truncate text-slate-700"}
 else if(marcadas.length===1){lab.textContent=marcadas[0];lab.className="msLabel truncate text-sky-800 font-semibold"}
 else{lab.textContent=marcadas.length+" "+cfg.muitos;lab.className="msLabel truncate text-sky-800 font-semibold"}
 var btn=wrap.querySelector(".msBtn");
 btn.className="msBtn w-full text-left text-xs border rounded-lg py-2 px-2 flex items-center justify-between gap-1 "+(marcadas.length?"border-sky-400 bg-sky-50":"border-slate-300 bg-slate-50");
 painel.querySelectorAll("[data-todas]").forEach(function(b){b.onclick=function(e){e.stopPropagation();MULTI[k]=[];montaMulti();render()}});
 painel.querySelectorAll("[data-mk]").forEach(function(ch){ch.onchange=function(){
  var v=this.value,arr=MULTI[k];
  if(this.checked){if(arr.indexOf(v)<0)arr.push(v)}else{var i=arr.indexOf(v);if(i>=0)arr.splice(i,1)}
  montaMulti();render()}});
});
}
function bindMulti(){
document.querySelectorAll(".msWrap").forEach(function(w){
 var k=w.dataset.ms;
 w.querySelector(".msBtn").onclick=function(e){
  e.stopPropagation();
  var p=w.querySelector(".msPanel"),aberto=!p.classList.contains("hidden");
  document.querySelectorAll(".msPanel").forEach(function(x){x.classList.add("hidden")});
  if(!aberto)p.classList.remove("hidden")};
 w.querySelector(".msPanel").onclick=function(e){e.stopPropagation()};
});
document.addEventListener("click",function(){document.querySelectorAll(".msPanel").forEach(function(x){x.classList.add("hidden")})});
}
function macroArea(l){
var c=document.getElementById("vMacro");
if(!c) return;
var grupos={},ordem=[];
l.forEach(function(t){
 if(!grupos[t.area]){grupos[t.area]=[];ordem.push(t.area)}
 grupos[t.area].push(t)});
if(!ordem.length){c.innerHTML='<div class="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-sm text-slate-600">Nenhuma ação para estes filtros.</div>';return}
c.innerHTML=ordem.map(function(area){
 var itens=grupos[area];
 var total=itens.length;
 var done=itens.filter(function(t){return t.status==="Concluído"}).length;
 var andam=itens.filter(function(t){return t.status==="Em Andamento"}).length;
 var pend=total-done-andam;
 var pct=Math.round(done/total*100);
 var criticos=itens.filter(function(t){return t.priority==="Crítica"&&t.status!=="Concluído"}).length;
 var aberto=(MACRO_ABERTO===area);
 var prazos=itens.filter(function(t){return t.status!=="Concluído"&&t.deadline!=="A definir"}).map(function(t){return t.deadline}).sort();
 var proximo=prazos.length?prazos[0]:"sem prazo";
 var cor=done===total?"border-emerald-300 bg-emerald-50/40":(criticos?"border-rose-300":"border-slate-200");
 var barra=done===total?"bg-emerald-500":(criticos?"bg-rose-500":"bg-sky-500");
 var html='<div class="'+cor+' rounded-xl border p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow" data-macro="'+esc(area)+'">';
 html+='<div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 min-w-0"><span class="px-2 py-0.5 rounded text-[11px] font-semibold border '+(AREA[area]||"bg-slate-100")+'">'+esc(area)+'</span>'+(criticos?'<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">'+criticos+' crítica'+(criticos>1?"s":"")+'</span>':'')+'</div><span class="text-[11px] text-slate-500 shrink-0">'+done+'/'+total+'</span></div>';
 html+='<div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full '+barra+'" style="width:'+pct+'%"></div></div>';
 html+='<div class="flex justify-between text-[11px] text-slate-600"><span>'+done+' concluída'+(done===1?"":"s")+' · '+andam+' em andamento · '+pend+' pendente'+(pend===1?"":"s")+'</span><span class="font-semibold '+(prazos.length?"text-slate-800":"text-slate-400")+'">'+(prazos.length?"próx: "+proximo:"sem prazo")+'</span></div>';
 if(aberto){
  html+='<div class="pt-2 border-t border-slate-200 space-y-1.5">';
  itens.forEach(function(t){
   var d=t.status==="Concluído";
   html+='<div class="flex items-start gap-2 text-[11px] py-1 rounded hover:bg-white/60">';
   html+='<button data-toggle="'+esc(t.id)+'" class="mt-0.5 shrink-0 '+(d?"text-emerald-600":"text-slate-400 hover:text-emerald-600")+'">'+(d?"✓":"○")+'</button>';
   html+='<div class="min-w-0 flex-1"><div class="font-medium '+(d?"line-through text-slate-400":"text-slate-800")+' leading-snug">'+esc(t.title)+'</div>';
   html+='<div class="text-[10px] text-slate-500 mt-0.5">'+esc(t.assignee)+' · '+esc(t.deadline)+' · <span class="'+(t.priority==="Crítica"?"text-rose-600 font-semibold":t.priority==="Alta"?"text-amber-700":"text-slate-400")+'">'+esc(t.priority)+'</span>'+(t.status==="Em Andamento"?' · <span class="text-sky-600">em andamento</span>':'')+'</div></div>';
   html+='<button data-abrir="'+esc(t.id)+'" class="text-sky-600 shrink-0 text-[10px] font-semibold">ver</button></div>';
  });
  html+='</div>';
 }else{
  var nomes={};
  itens.forEach(function(t){String(t.assignee||"").split("/").forEach(function(n){n=n.trim();if(n&&n.toLowerCase()!=="a definir")nomes[n]=1})});
  var q=Object.keys(nomes).slice(0,3).join(", ")+(Object.keys(nomes).length>3?"…":"");
  html+='<div class="text-[11px] text-slate-500 truncate">'+esc(q||"—")+'</div>';
 }
 html+='</div>';
 return html}).join("")}
function render(){var l=filtrados();
document.getElementById("contador").textContent="Exibindo "+l.length+" de "+T.length+" ações";var tg=[],dp=document.getElementById("fPrazo"),q=document.getElementById("q").value.trim();
if(dp.value!=="ALL")tg.push("Prazo: "+dp.value);
if(MULTI.area.length)tg.push("Área: "+MULTI.area.join(" ou "));
if(MULTI.resp.length)tg.push("Resp: "+MULTI.resp.join(" ou "));
if(MULTI.status.length)tg.push("Status: "+MULTI.status.join(" ou "));
if(MULTI.prio.length)tg.push("Prioridade: "+MULTI.prio.join(" ou "));
if(q)tg.push('"'+q+'"');
if(faltaFiltro==="semDono")tg.push("⚠ sem responsável");if(faltaFiltro==="semPrazo")tg.push("⚠ sem prazo");if(faltaFiltro==="qualquer")tg.push("⚠ com lacuna");
document.querySelectorAll(".faltaBtn").forEach(function(b){
var ativo=(b.dataset.falta===faltaFiltro);
b.className="faltaBtn px-2.5 py-1 rounded-full text-[11px] font-medium "+(ativo?"bg-slate-800 text-white border border-slate-800":"bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300")});
document.getElementById("tags").innerHTML=tg.map(function(x){return '<span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">'+esc(x)+'</span>'}).join("");
var vs=["vCards","vTable","vKanban","vPauta","vMacro","vChat","vReuniao"];vs.forEach(function(id){document.getElementById(id).classList.add("hidden")});
if(view==="cards"){document.getElementById("vCards").classList.remove("hidden");document.getElementById("vCards").classList.add("grid");cards(l)}
else if(view==="table"){document.getElementById("vTable").classList.remove("hidden");tabela(l)}
else if(view==="kanban"){var k=document.getElementById("vKanban");k.classList.remove("hidden");k.classList.add("grid");kanban(l)}
else if(view==="macro"){var m=document.getElementById("vMacro");m.classList.remove("hidden");m.classList.add("grid");macroArea(l)}
else if(view==="chat"){document.getElementById("vChat").classList.remove("hidden");renderChat()}
else if(view==="reuniao"){document.getElementById("vReuniao").classList.remove("hidden")}
else{document.getElementById("vPauta").classList.remove("hidden");pauta(l)}}
function toggle(id){var t=T.filter(function(x){return x.id===id})[0];if(!t)return;var de=t.status;t.status=t.status==="Concluído"?"Em Andamento":"Concluído";logTl(id,"Status: "+de+" → "+t.status),logEv({faca:"mudou status",id:id,acao:t.title,campo:"Status",de:de,para:t.status});salvar();render();toast(t.title.slice(0,28)+"… → "+t.status,"ok")}

/* ---------- CHAT ---------- */
function gkey(){try{return localStorage.getItem(GKEY)||""}catch(e){return""}}
function ctxPainel(){var st={};T.forEach(function(t){st[t.status]=(st[t.status]||0)+1});
var linhas=T.map(function(t){return"- ["+t.area+"] "+t.title+" | Resp: "+t.assignee+" | Prazo: "+t.deadline+" | "+t.priority+" | "+t.status+(t.notes?" | Nota: "+t.notes:"")}).join("\n");
var ata=Object.keys(DADOS.ata||{}).sort(function(a,b){return a-b}).map(function(k){return"Topico "+k+": "+String(DADOS.ata[k]).replace(/<[^>]+>/g,"")}).join("\n");
return"Painel de gestao de demandas Jussara & Ventura. Atualizado em "+(DADOS.atualizado||"")+".\nTotal: "+T.length+" acoes. Situacao: "+JSON.stringify(st)+".\n\nACOES:\n"+linhas+"\n\nATA POR TOPICO:\n"+ata}
function renderChat(){var c=document.getElementById("chatMsgs");
if(!HIST.length){c.innerHTML='<div class="text-center py-10 text-slate-400"><div class="text-3xl mb-2">💬</div><p class="text-sm font-medium text-slate-600">Pergunte sobre o painel</p><p class="text-xs mt-1">As ações, os prazos e a ata estão no meu contexto.</p><div class="flex flex-wrap gap-1.5 justify-center mt-3">'+["O que vence amanhã?","Quem está mais sobrecarregado?","Resuma o MaxPro","O que está travado?"].map(function(s){return'<button onclick="sugerir(this.textContent)" class="px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-full hover:border-sky-400 text-slate-600">'+s+'</button>'}).join("")+'</div></div>';return}
c.innerHTML=HIST.map(function(m){var eu=m.role==="user";
return'<div class="flex '+(eu?"justify-end":"justify-start")+'"><div class="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm '+(eu?"bg-sky-700 text-white rounded-br-sm":"bg-slate-100 text-slate-800 rounded-bl-sm")+'">'+fmt(m.text)+'</div></div>'}).join("");
c.scrollTop=c.scrollHeight}
function fmt(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>")}
function sugerir(t){document.getElementById("chatInput").value=t;enviarChat()}
function addMsg(role,text){HIST.push({role:role,text:text});renderChat()}
function enviarChat(){var inp=document.getElementById("chatInput"),txt=inp.value.trim();
if(!txt||enviando)return;
if(!gkey()){abrirChave();return}
inp.value="";inp.style.height="auto";enviando=true;
document.getElementById("chatEnviar").disabled=true;
addMsg("user",txt);addMsg("model","…");
fetchGemini(txt).then(function(r){HIST.pop();HIST.push({role:"model",text:r});renderChat()})
.catch(function(e){HIST.pop();HIST.push({role:"model",text:"⚠️ "+(e.message||"Falha ao consultar o Gemini")});renderChat()})
.then(function(){enviando=false;document.getElementById("chatEnviar").disabled=false})}
function fetchGemini(pergunta){
var msgs=HIST.filter(function(m){return m.text!=="…"}).slice(-8).map(function(m){return{role:m.role==="user"?"user":"model",parts:[{text:m.text}]}});
var body={system_instruction:{parts:[{text:"Voce e o assistente de gestao do painel Jussara & Ventura. Responda em portugues do Brasil, curto e direto, baseado SOMENTE nos dados fornecidos. Se a informacao nao estiver nos dados, diga que nao consta no painel — nunca invente.\n\n"+ctxPainel()}]},contents:msgs,generationConfig:{temperature:0.2,maxOutputTokens:800}};
function tentar(i){if(i>=MODELOS.length)return Promise.reject(new Error("Nenhum modelo respondeu. Verifique a chave."));
return fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODELOS[i]+":generateContent?key="+encodeURIComponent(gkey()),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
.then(function(r){if(!r.ok)return r.json().then(function(j){var m=(j.error&&j.error.message)||("HTTP "+r.status);if(r.status===400||r.status===403)throw new Error(m);return tentar(i+1)});
return r.json()}).then(function(j){if(!j)return null;
var c=j.candidates&&j.candidates[0];if(!c||!c.content||!c.content.parts)return tentar(i+1);
return c.content.parts.map(function(p){return p.text||""}).join("").trim()}).catch(function(e){if(e.message&&e.message.indexOf("model")<0&&e.message.indexOf("API")<0&&e.message.indexOf("key")<0&&e.message.indexOf("quota")<0)return tentar(i+1);throw e})}
return tentar(0)}
function abrirChave(){var m=document.getElementById("chatKeyModal");m.classList.remove("hidden");m.classList.add("flex");
document.getElementById("chatKeyInput").value=gkey();
document.getElementById("chatKeyStatus").textContent=gkey()?"Chave salva neste navegador":"Nenhuma chave configurada"}
function fecharChave(){document.getElementById("chatKeyModal").classList.add("hidden");document.getElementById("chatKeyModal").classList.remove("flex")}
function bindChat(){
document.getElementById("chatEnviar").onclick=enviarChat;
document.getElementById("chatConfig").onclick=abrirChave;
document.getElementById("chatKeyFechar").onclick=fecharChave;
document.getElementById("chatLimpar").onclick=function(){HIST=[];renderChat();toast("Conversa limpa")};
document.getElementById("chatKeySalvar").onclick=function(){var v=document.getElementById("chatKeyInput").value.trim();
if(!v){toast("Cole a chave","warn");return}
try{localStorage.setItem(GKEY,v)}catch(e){}
document.getElementById("chatKeyStatus").textContent="Chave salva — testando…";
fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODELOS[0]+":generateContent?key="+encodeURIComponent(v),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:"ok"}]}]})})
.then(function(r){return r.json().then(function(j){
if(r.ok){document.getElementById("chatKeyStatus").textContent="✅ Chave válida — pode conversar";document.getElementById("chatKeyStatus").className="text-[11px] text-emerald-600 mb-3"}
else{var m=(j.error&&j.error.message)||("HTTP "+r.status);document.getElementById("chatKeyStatus").textContent="❌ "+m;document.getElementById("chatKeyStatus").className="text-[11px] text-rose-600 mb-3"}})})
.catch(function(e){document.getElementById("chatKeyStatus").textContent="❌ "+e.message})};
document.getElementById("chatKeyApagar").onclick=function(){try{localStorage.removeItem(GKEY)}catch(e){}
document.getElementById("chatKeyInput").value="";document.getElementById("chatKeyStatus").textContent="Chave apagada";toast("Chave removida")};
document.getElementById("chatInput").addEventListener("input",function(){this.style.height="auto";this.style.height=Math.min(this.scrollHeight,120)+"px"});
document.getElementById("chatInput").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviarChat()}});
}
function ciclo(id){var t=T.filter(function(x){return x.id===id})[0];if(!t)return;var de=t.status;t.status=t.status==="Pendente"?"Em Andamento":t.status==="Em Andamento"?"Concluído":"Pendente";logTl(id,"Status: "+de+" → "+t.status),logEv({faca:"avançou status",id:id,acao:t.title,campo:"Status",de:de,para:t.status});salvar();render()}

/* ---------- REUNIÕES: upload + análise (atualizações + novas) ---------- */
var PROPOSTAS=[],ATUALIZACOES=[],arquivoSel=null;
function setStatus(txt,cls){var e=document.getElementById("procStatus");e.textContent=txt;e.className="text-[11px] min-h-[16px] "+(cls||"text-slate-500")}
function b64(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){var s=String(r.result),i=s.indexOf(",");res({data:s.slice(i+1),mime:(s.slice(5,i).split(";")[0])||file.type||"audio/mp4"})};r.onerror=rej;r.readAsDataURL(file)})}
function escolherArquivo(f){
if(!f)return;
var nome=(f.name||"").toLowerCase();
var ehTexto=/\.(txt|md|srt|vtt|csv|json|log)$/.test(nome)||(f.type||"").indexOf("text/")===0;
if(ehTexto){
 if(f.size>5*1024*1024){setStatus("Arquivo de texto com "+(f.size/1048576).toFixed(1)+" MB. O limite é 5 MB.","text-rose-600");return}
 var r=new FileReader();
 r.onload=function(){
  var t=String(r.result||"");
  if(/\.(srt|vtt)$/.test(nome)){t=t.replace(/\r/g,"").replace(/^\d+\s*$/gm,"").replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*.*$/gm,"").replace(/^WEBVTT.*$/gm,"").replace(/<[^>]+>/g,"")}
  t=t.replace(/\n{3,}/g,"\n\n").trim();
  document.getElementById("reuniaoTexto").value=t;
  arquivoSel=null;
  var palavras=t.split(/\s+/).filter(Boolean).length;
  setStatus("Transcrição carregada: "+palavras.toLocaleString("pt-BR")+" palavras, ~"+Math.round(palavras/130)+" min de fala. Clique em Processar.","text-emerald-600");
 };
 r.onerror=function(){setStatus("Não consegui ler o arquivo.","text-rose-600")};
 r.readAsText(f,"utf-8");
 document.getElementById("fileName").textContent=f.name+" · "+(f.size/1024).toFixed(0)+" KB";
 return}
arquivoSel=f;document.getElementById("fileName").textContent=f.name+" · "+(f.size/1048576).toFixed(1)+" MB";
if(f.size>20*1024*1024){setStatus("Áudio de "+(f.size/1048576).toFixed(1)+" MB passa do limite de 20 MB. Divida o áudio ou suba a transcrição em .txt.","text-rose-600");var b=document.getElementById("btnProcessar");if(b)b.disabled=false;return}
setStatus("Áudio pronto ("+(f.size/1048576).toFixed(1)+" MB). Clique em Processar.","text-emerald-600")}
function processar(){var txt=document.getElementById("reuniaoTexto").value.trim();
if(!gkey()){abrirChave();setStatus("Configure a chave do Gemini primeiro.","text-amber-600");return}
if(!arquivoSel&&!txt){setStatus("Escolha um arquivo ou cole o texto da reunião.","text-amber-600");return}
var btn=document.getElementById("btnProcessar");btn.disabled=true;
if(txt){setStatus("Analisando o texto…","text-slate-500");processarTexto(txt,btn)}
else{setStatus("Enviando o áudio ("+(arquivoSel.size/1048576).toFixed(1)+" MB)…","text-slate-500");
b64(arquivoSel).then(function(f){
setStatus("Áudio enviado. Transcrevendo — leva de 1 a 3 minutos…","text-slate-500");
return fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODELOS[0]+":generateContent?key="+encodeURIComponent(gkey()),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:"Transcreva este audio de reuniao em portugues do Brasil, palavra por palavra, com falantes identificados quando possivel. Devolva so a transcricao, sem comentarios."},{inline_data:{mime_type:f.mime,data:f.data}}]}]})})
}).then(function(r){return r.json()}).then(function(j){
var c=j.candidates&&j.candidates[0];
if(!c||!c.content){var m=(j.error&&j.error.message)||"Falha na transcrição";throw new Error(m)}
var tr=c.content.parts.map(function(p){return p.text||""}).join("").trim();
if(!tr)throw new Error("Transcrição vazia — tente subir um arquivo .txt");
document.getElementById("reuniaoTexto").value=tr;
setStatus("Transcrito ("+tr.length+" caracteres). Analisando…","text-slate-500");
processarTexto(tr,btn)})
.catch(function(e){setStatus("Erro: "+e.message,"text-rose-600");btn.disabled=false})}}

function emBlocos(txt,max){
max=max||28000;
if(txt.length<=max)return [txt];
var blocos=[],resto=txt;
while(resto.length>max){
 var corte=resto.lastIndexOf("\n\n",max);
 if(corte<max*0.5)corte=resto.lastIndexOf(". ",max);
 if(corte<max*0.5)corte=resto.lastIndexOf(" ",max);
 if(corte<max*0.3)corte=max;
 blocos.push(resto.slice(0,corte).trim());
 resto=resto.slice(corte).trim()}
if(resto)blocos.push(resto);
return blocos}

function processarTexto(txt,btn){
var blocos=emBlocos(txt,28000);
PROPOSTAS=[];ATUALIZACOES=[];
var feitos=0,erros=[];
function proximo(){
 if(feitos>=blocos.length){
  renderPropostas();
  var msg=ATUALIZACOES.length+" atualizações e "+PROPOSTAS.length+" ações novas";
  if(blocos.length>1)msg+=" (texto em "+blocos.length+" blocos)";
  if(erros.length)msg+=" — "+erros.length+" bloco(s) falharam: "+erros.join("; ");
  setStatus(msg+". Revise e aprove.","text-emerald-600");
  btn.disabled=false;
  return}
 var b=blocos[feitos];
 setStatus("Analisando bloco "+(feitos+1)+" de "+blocos.length+" ("+b.length.toLocaleString("pt-BR")+" caracteres)…","text-slate-500");
 extrairBloco(b).then(function(r){
  (r.atualizacoes||[]).forEach(function(a){
   if(!a.id)return;
   if(ATUALIZACOES.some(function(x){return x.id===a.id}))return;
   var alvo=T.filter(function(t){return t.id===a.id})[0];
   if(!alvo)return;
   var mud={};
   if(a.novo_status&&a.novo_status!==alvo.status)mud.status=a.novo_status;
   if(a.novo_prazo&&a.novo_prazo!==alvo.deadline)mud.deadline=a.novo_prazo;
   if(a.novo_responsavel&&a.novo_responsavel!==alvo.assignee)mud.assignee=a.novo_responsavel;
   if(a.nova_prioridade&&a.nova_prioridade!==alvo.priority)mud.priority=a.nova_prioridade;
   if(a.novo_contexto&&a.novo_contexto!==alvo.context)mud.context=a.novo_contexto;
   if(a.nova_nota&&a.nova_nota!==(alvo.notes||""))mud.notes=a.nova_nota;
   if(!Object.keys(mud).length)return;
   ATUALIZACOES.push({id:a.id,titulo:alvo.title,de:{status:alvo.status,deadline:alvo.deadline,assignee:alvo.assignee,priority:alvo.priority,context:alvo.context,notes:alvo.notes}});
   ATUALIZACOES[ATUALIZACOES.length-1].para=mud;
   ATUALIZACOES[ATUALIZACOES.length-1].motivo=a.motivo||"";
   ATUALIZACOES[ATUALIZACOES.length-1].sel=true});
  (r.novas||[]).forEach(function(a){
   var dup=PROPOSTAS.some(function(p){return p.title.toLowerCase()===String(a.title||"").toLowerCase()});
   if(dup)return;
   PROPOSTAS.push({id:"NOVO-"+(PROPOSTAS.length+1),title:a.title||"(sem título)",assignee:a.assignee||"A definir",deadline:a.deadline||"A definir",priority:(a.priority||"Média"),area:a.area||"Institucional",context:a.context||"",topicTitle:a.topicTitle||"Itens de reunião",sel:true})});
  renderPropostas();feitos++;proximo()
 }).catch(function(e){erros.push("bloco "+(feitos+1)+": "+e.message);feitos++;proximo()})}
proximo()}

function extrairBloco(texto){
var lista=T.map(function(t){return t.id+" | "+t.title+" | resp: "+t.assignee+" | prazo: "+t.deadline+" | "+t.priority+" | "+t.status+(t.notes?" | nota: "+t.notes:"")}).join("\n");
var instrucao="Voce analisa reunioes da conta Jussara & Ventura (Jussara Laticinios / agencia Ventura).\n\n"+
"SUA TAREFA, NESTA ORDEM:\n"+
"1) PRIMEIRO procure nos dados da reuniao o que MUDOU em acoes que ja existem: status que avancou (ex.: virou Concluido), prazo alterado, novo responsavel, prioridade revista, decisao tomada, correcao de informacao. Isso vai em 'atualizacoes'.\n"+
"2) SO DEPOIS proponha o que for realmente NOVO e que ainda nao esta na lista. Isso vai em 'novas'. Se a reuniao nao trouxe nada novo, devolva lista vazia.\n\n"+
"REGRA CRITICA: se o assunto da fala JA EXISTE na lista abaixo, NAO crie uma acao nova — registre a evolucao em 'atualizacoes'. Criar duplicata quando deveria atualizar e o pior erro possivel.\n\n"+
"Nas atualizacoes use o ID exato da acao. Preencha SOMENTE os campos que mudaram; deixe string vazia nos que nao mudaram. "+
"Nunca invente data: se a data nao foi dita, deixe vazio (nao escreva 'A definir' em campo de atualizacao).\n"+
"Status permitidos: Pendente, Em Andamento, Concluido. Prioridade: Critica, Alta, Media, Baixa. Area: MaxPro, Sonhos, SPRIM, Influencia, Institucional, RH, Planejamento.\n\n"+
"ACOES QUE JA EXISTEM (id | titulo | responsavel | prazo | prioridade | status | nota):\n"+lista;
var SCHEMA={type:"OBJECT",properties:{
 atualizacoes:{type:"ARRAY",items:{type:"OBJECT",properties:{
  id:{type:"STRING"},novo_status:{type:"STRING"},novo_prazo:{type:"STRING"},novo_responsavel:{type:"STRING"},
  nova_prioridade:{type:"STRING"},novo_contexto:{type:"STRING"},nova_nota:{type:"STRING"},motivo:{type:"STRING"}},
  required:["id","motivo"]}},
 novas:{type:"ARRAY",items:{type:"OBJECT",properties:{
  title:{type:"STRING"},assignee:{type:"STRING"},deadline:{type:"STRING"},priority:{type:"STRING"},
  area:{type:"STRING"},context:{type:"STRING"},topicTitle:{type:"STRING"}},
  required:["title","assignee","deadline","priority","area","context","topicTitle"]}}
},required:["atualizacoes","novas"]};
var body={contents:[{role:"user",parts:[{text:instrucao},{text:"DADOS DA REUNIAO:\n\n"+texto}]}],generationConfig:{temperature:0.1,maxOutputTokens:8192,responseMimeType:"application/json",responseSchema:SCHEMA}};
return fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODELOS[0]+":generateContent?key="+encodeURIComponent(gkey()),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
.then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
.then(function(j){var c=j.candidates&&j.candidates[0];if(!c||!c.content)throw new Error("Sem resposta do modelo");
var motivo=(c.finishReason||"");
var raw=c.content.parts.map(function(p){return p.text||""}).join("").trim();
var obj=parseTolerante(raw);
if(!obj)throw new Error("Não consegui ler o JSON"+(motivo&&motivo!=="STOP"?" (motivo: "+motivo+")":""));
return {atualizacoes:obj.atualizacoes||[],novas:obj.novas||obj.acoes||[]}})}

function parseTolerante(raw){
if(!raw)return null;
var s=String(raw).trim();
s=s.replace(/^```(?:json)?/i,"").replace(/```\s*$/,"").trim();
var ini=s.indexOf("{");if(ini<0)return null;
s=s.slice(ini);
try{return JSON.parse(s)}catch(e){}
var t=s.replace(/,\s*([}\]])/g,"$1");
try{return JSON.parse(t)}catch(e){}
return repararJSON(t)}
function repararJSON(txt){
var pl=[],es=false,ec=false,bons=[];
for(var i=0;i<txt.length;i++){var ch=txt[i];
if(es){if(ec){ec=false}else if(ch==="\\"){ec=true}else if(ch==='"'){es=false}continue}
if(ch==='"'){es=true;continue}
if(ch==="{"||ch==="["){pl.push(ch);continue}
if(ch==="}"||ch==="]"){
 var topo=pl[pl.length-1];
 if(topo&&((ch==="}"&&topo==="{")||(ch==="]"&&topo==="["))){pl.pop()}
 if(ch==="}"&&pl.length===2&&pl[0]==="{"&&pl[1]==="["){bons.push(i)}
}}
function fecharAte(pos){
 var q=[],st=false,sc=false;
 for(var k=0;k<=pos&&k<txt.length;k++){var c=txt[k];
  if(st){if(sc){sc=false}else if(c==="\\"){sc=true}else if(c==='"'){st=false}continue}
  if(c==='"'){st=true;continue}
  if(c==="{"||c==="[")q.push(c);
  else if(c==="}"||c==="]"){if(q.length)q.pop()}}
 var fim="";
 for(var m=q.length-1;m>=0;m--){fim+=q[m]==="{"?"}":"]"}
 return txt.slice(0,pos+1)+fim}
for(var b=bons.length-1;b>=0;b--){try{var r=JSON.parse(fecharAte(bons[b]));if(r&&(r.atualizacoes||r.novas||r.acoes))return r}catch(e){}}
try{return JSON.parse(fecharAte(txt.length-1))}catch(e){}
return null}

function rotuloCampo(k){return {status:"Status",deadline:"Prazo",assignee:"Responsável",priority:"Prioridade",context:"Contexto",notes:"Anotação"}[k]||k}
function renderPropostas(){
var cAt=document.getElementById("atualList"),cNo=document.getElementById("propList");
var totSel=ATUALIZACOES.filter(function(a){return a.sel}).length+PROPOSTAS.filter(function(p){return p.sel}).length;
document.getElementById("propCount").textContent=(ATUALIZACOES.length||PROPOSTAS.length)?totSel+" de "+(ATUALIZACOES.length+PROPOSTAS.length)+" selecionadas":"";
document.getElementById("btnAplicar").disabled=!totSel;
document.getElementById("atualBloco").style.display=ATUALIZACOES.length?"":"none";
document.getElementById("novasBloco").style.display=PROPOSTAS.length?"":"none";
var vz=document.getElementById("vazioAnalise");if(vz)vz.style.display=(ATUALIZACOES.length||PROPOSTAS.length)?"none":"";
if(ATUALIZACOES.length){
 cAt.innerHTML=ATUALIZACOES.map(function(a,i){
  var linhas=Object.keys(a.para).map(function(k){
   return '<div class="flex items-start gap-1.5 mt-1"><span class="text-slate-400 shrink-0">'+rotuloCampo(k)+':</span>'+
   '<span class="text-slate-400 line-through truncate max-w-[45%]">'+esc(String(a.de[k]||"—").slice(0,60))+'</span>'+
   '<span class="text-emerald-700 font-semibold shrink-0">→</span>'+
   '<span class="text-emerald-800 font-semibold">'+esc(String(a.para[k]).slice(0,70))+'</span></div>'}).join("");
  return '<div class="p-2.5 rounded-lg border '+(a.sel?"border-emerald-300 bg-emerald-50/40":"border-slate-200 bg-white opacity-60")+' text-xs">'+
  '<div class="flex items-start gap-2"><input type="checkbox" data-at="'+i+'" class="atChk mt-0.5 rounded text-emerald-600 h-4 w-4 shrink-0" '+(a.sel?"checked":"")+'>'+
  '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 flex-wrap"><span class="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-600">'+esc(a.id)+'</span><span class="font-semibold text-slate-900 leading-snug">'+esc(a.titulo)+'</span></div>'+
  linhas+
  (a.motivo?'<div class="text-[11px] text-slate-500 mt-1 italic">'+esc(a.motivo)+'</div>':'')+
  '</div></div></div>'}).join("");
 cAt.querySelectorAll(".atChk").forEach(function(ch){ch.onchange=function(){ATUALIZACOES[+this.dataset.at].sel=this.checked;renderPropostas()}})}
if(PROPOSTAS.length){
 cNo.innerHTML=PROPOSTAS.map(function(p,i){
  return'<div class="p-2.5 rounded-lg border '+(p.sel?"border-sky-300 bg-sky-50/40":"border-slate-200 bg-white opacity-60")+' text-xs">'+
  '<div class="flex items-start gap-2"><input type="checkbox" data-i="'+i+'" class="propChk mt-0.5 rounded text-sky-600 h-4 w-4 shrink-0" '+(p.sel?"checked":"")+'>'+
  '<div class="min-w-0 flex-1"><div class="font-semibold text-slate-900 leading-snug">'+esc(p.title)+'</div>'+
  '<div class="text-[11px] text-slate-500 mt-0.5">'+esc(p.assignee)+' · '+esc(p.deadline)+' · '+esc(p.area)+' · '+esc(p.priority)+'</div>'+
  '<div class="text-[11px] text-slate-500 mt-1 leading-snug">'+esc(p.context)+'</div>'+
  '</div></div></div>'}).join("");
 cNo.querySelectorAll(".propChk").forEach(function(ch){ch.onchange=function(){PROPOSTAS[+this.dataset.i].sel=this.checked;renderPropostas()}})}
}
function normTxt(s){
return String(s==null?"":s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ")}
var AREAS_OK=["MaxPro","Sonhos","SPRIM","Influência","Institucional","RH","Planejamento"];
var PRIOS_OK=["Crítica","Alta","Média","Baixa"];
var STATUS_OK=["Pendente","Em Andamento","Concluído"];
function corrigeArea(v){
var n=normTxt(v).replace(/[\s\-_]/g,"");
var mapa={maxpro:"MaxPro",sonhos:"Sonhos",sonho:"Sonhos",sprin:"SPRIM",sprim:"SPRIM",
influencia:"Influência",influenciae:"Influência",influenciador:"Influência",influenciadores:"Influência",
institucional:"Institucional",rh:"RH",endomarketing:"RH",
planejamento:"Planejamento",planejamentos:"Planejamento",plan:"Planejamento"};
if(AREAS_OK.indexOf(v)>=0)return v;
return mapa[n]||"Institucional"}
function corrigePrio(v){
var n=normTxt(v);
var mapa={critica:"Crítica",alta:"Alta",media:"Média",baixa:"Baixa"};
if(PRIOS_OK.indexOf(v)>=0)return v;
return mapa[n]||"Média"}
function corrigeStatus(v){
var n=normTxt(v);
var mapa={"pendente":"Pendente","em andamento":"Em Andamento","emandamento":"Em Andamento","andamento":"Em Andamento","concluido":"Concluído","concluida":"Concluído","finalizado":"Concluído"};
if(STATUS_OK.indexOf(v)>=0)return v;
return mapa[n]||"Pendente"}
function corrigePrazo(v){
var s=String(v==null?"":v).trim();
if(!s)return "A definir";
if(/a definir|cancelad|a confirmar|sem data|indefinid/i.test(s))return "A definir";
var m=s.match(/(\d{1,2})\s*[\/\.\-]\s*(\d{1,2})(?:\s*[\/\.\-]\s*(\d{2,4}))?/);
if(m){
 var d=("0"+m[1]).slice(-2),mes=("0"+m[2]).slice(-2);
 var ano=m[3]?m[3]:String(new Date().getFullYear());
 if(ano.length===2)ano="20"+ano;
 return d+"/"+mes+"/"+ano}
return "A definir"}
function saneiaTudo(acoes){
var rel=[],vistos={},out=[];
acoes.forEach(function(a){
 var t={id:a.id,topicNumber:Number(a.topicNumber)||0,topicTitle:String(a.topicTitle||"Itens de reunião").trim(),
  area:corrigeArea(a.area),title:String(a.title||"").trim(),assignee:String(a.assignee||"A definir").trim(),
  deadline:corrigePrazo(a.deadline),priority:corrigePrio(a.priority),status:corrigeStatus(a.status),
  context:String(a.context||"").trim(),notes:String(a.notes||"").trim()};
 if(!t.title)return;
 var chave=normTxt(t.title);
 if(vistos[chave]){rel.push('duplicata removida: "'+t.title.slice(0,45)+'"');return}
 vistos[chave]=true;
 if(out.some(function(x){return x.id===t.id})){t.id=t.id+"-"+(out.length+1);rel.push("id ajustado: "+t.id)}
 out.push(t)});
 var mapaTop={},prox=1;
 out.forEach(function(t){
  var chaveTop=normTxt(t.topicTitle);
  if(!mapaTop[chaveTop]){mapaTop[chaveTop]=prox++}
  t.topicNumber=mapaTop[chaveTop]});
 out.forEach(function(t,i){if(/^NOVO/i.test(t.id)||!t.id)t.id="NOVO-"+("0"+(i+1)).slice(-2)});
 return {acoes:out,relatorio:rel}}
function aplicar(){
var at=ATUALIZACOES.filter(function(a){return a.sel});
var nv=PROPOSTAS.filter(function(p){return p.sel});
if(!at.length&&!nv.length)return;
at.forEach(function(a){
 var t=T.filter(function(x){return x.id===a.id})[0];
 if(t)Object.keys(a.para).forEach(function(k){t[k]=a.para[k]})});
var maxTop=0;T.forEach(function(t){if(t.topicNumber>maxTop)maxTop=t.topicNumber});
var novoTopico=maxTop+1;
var criadas=nv.map(function(p,i){
var topicoExistente=null;
T.forEach(function(t){if((t.topicTitle||"").toLowerCase()===(p.topicTitle||"").toLowerCase())topicoExistente=t.topicNumber});
return{id:"NOVO-"+(i+1),topicNumber:topicoExistente||novoTopico,topicTitle:p.topicTitle,area:p.area,title:p.title,assignee:p.assignee,deadline:p.deadline,priority:p.priority,status:"Pendente",context:p.context,notes:""}});
T=T.concat(criadas);
var san=saneiaTudo(T);
T=san.acoes;
var out={acoes:T.map(function(t){return{id:t.id,topicNumber:t.topicNumber,topicTitle:t.topicTitle,area:t.area,title:t.title,assignee:t.assignee,deadline:t.deadline,priority:t.priority,status:t.status,context:t.context,notes:t.notes}}),ata:DADOS.ata||{},atualizado:new Date().toLocaleDateString("pt-BR")};
try{localStorage.setItem(KEY,JSON.stringify(T.map(function(t){return{id:t.id,status:t.status,notes:t.notes}})))}catch(e){}
var blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="data.json";a.click();
ATUALIZACOES=[];PROPOSTAS=[];
renderPropostas();kpis();render();
var msg=(at.length?at.length+" atualizada(s)":"")+(at.length&&nv.length?" e ":"")+(nv.length?nv.length+" nova(s)":"")+". Arquivo validado e baixado";
if(san.relatorio.length)msg+=" ("+san.relatorio.length+" ajuste(s): "+san.relatorio.slice(0,3).join("; ")+(san.relatorio.length>3?"…":"")+")";
setStatus(msg+". Suba no repositório para publicar.",san.relatorio.length?"text-amber-600":"text-emerald-600");
toast((at.length+nv.length)+" alterações aplicadas","ok")}
var SYNC_WEBHOOK="https://maestro.adapta.one/webhooks/generic/15fa652f5d1055693ac6207734fe9dfcf35e7c15434329ba2f9c68768e98463e?secret=d90cd7507bd4b60528fb627888b2b2b3b59884a4040e8a9d0ca9ce3402a7c4c4";
function todasChk(){
var out=[];
Object.keys(EXTRA).forEach(function(id){
 var a=T.filter(function(x){return x.id===id})[0];
 var nome=a?a.title:"(ação removida)";
 (EXTRA[id].chk||[]).forEach(function(c){
  out.push({id:id,acao:nome,tarefa:c.t,ok:c.ok?"Sim":"Não",data:c.ok?(c.d||""):"",resp:(a?a.assignee:""),obs:""})})});
return out}
function todasTl(){
var out=[];
Object.keys(EXTRA).forEach(function(id){
 var a=T.filter(function(x){return x.id===id})[0];
 var nome=a?a.title:"(ação removida)";
 (EXTRA[id].tl||[]).forEach(function(e){
  out.push({id:id,acao:nome,quando:e.d,evento:e.t,tipo:e.m?"Manual":"Automático",autor:e.m?"(usuário)":"sistema"})})});
return out}
function baixarSync(chk,tl,silencioso){
var L=[];
L.push("ABA;ID DA ACAO;ACAO;CAMPO 1;CAMPO 2;CAMPO 3;CAMPO 4");
chk.forEach(function(c){L.push(["Checklist",c.id,c.acao,c.tarefa,c.ok,c.data,c.resp].map(function(x){return '"'+String(x||"").replace(/"/g,'""')+'"'}).join(";"))});
tl.forEach(function(e){L.push(["Timeline",e.id,e.acao,e.quando,e.evento,e.tipo].map(function(x){return '"'+String(x||"").replace(/"/g,'""')+'"'}).join(";"))});
var blob=new Blob(["\ufeff"+L.join("\r\n")],{type:"text/csv;charset=utf-8"});
var nome="checklist-timeline-"+new Date().toISOString().slice(0,10)+".csv";
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nome;a.click();
if(!silencioso)toast("Arquivo "+nome+" baixado","ok");
else toast("Enviado e arquivo baixado ("+nome+")","ok")}
var UKEY="jussara_usuario";
var LOGF=[];
var LKEY="jussara_logfila";
function quem(){try{return localStorage.getItem(UKEY)||""}catch(e){return""}}
function nomeAcao(id){var a=T.filter(function(x){return x.id===id})[0];return a?a.title:id}
function defineQuem(n){try{if(n)localStorage.setItem(UKEY,n);else localStorage.removeItem(UKEY)}catch(e){}pintaQuem()}
function pintaQuem(){var l=document.getElementById("quemLabel");if(!l)return;var q=quem();l.textContent=q||"Entrar";var b=document.getElementById("btnQuem");if(b)b.className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border "+(q?"text-sky-800 bg-sky-50 border-sky-300":"text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300")}
function logEv(o){
var q=quem()||"(nao identificado)";
LOGF.push({quando:agoraStr(),quem:q,faca:o.faca||"",id:o.id||"",acao:o.acao||"",campo:o.campo||"",de:o.de==null?"":String(o.de),para:o.para==null?"":String(o.para)});
salvaLog()}
function salvaLog(){try{localStorage.setItem(LKEY,JSON.stringify(LOGF))}catch(e){}atualizaBadgeLog()}
function carregaLog(){try{LOGF=JSON.parse(localStorage.getItem(LKEY)||"[]")||[]}catch(e){LOGF=[]}atualizaBadgeLog()}
function atualizaBadgeLog(){var b=document.getElementById("btnSync");if(!b)return;b.textContent=LOGF.length?("\u21a5 Enviar p/ planilha ("+LOGF.length+")"):"\u21a5 Enviar p/ planilha"}
function bindQuem(){
var m=document.getElementById("quemModal");
function abre(){document.getElementById("quemInput").value=quem();document.getElementById("quemStatus").textContent=quem()?"Identificado como "+quem():"Ainda nao identificado";m.classList.remove("hidden");m.classList.add("flex")}
function fecha(){m.classList.add("hidden");m.classList.remove("flex")}
var b=document.getElementById("btnQuem");if(b)b.onclick=abre;
document.getElementById("quemCancelar").onclick=fecha;
document.getElementById("quemSalvar").onclick=function(){var v=document.getElementById("quemInput").value.trim();if(!v){document.getElementById("quemStatus").textContent="Digite um nome";return}defineQuem(v);fecha();toast("Agora as alteracoes saem como "+v,"ok")};
document.getElementById("quemInput").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();document.getElementById("quemSalvar").click()}});
m.onclick=function(e){if(e.target.id==="quemModal")fecha()};
pintaQuem();
if(!quem())setTimeout(abre,700);
}
function bindSync(){var b=document.getElementById("btnSync");if(b)b.onclick=enviarPlanilha}
function bindReuniao(){
var dz=document.getElementById("dropZone"),fi=document.getElementById("audioFile");
dz.onclick=function(){fi.click()};
fi.onchange=function(){escolherArquivo(this.files[0])};
dz.ondragover=function(e){e.preventDefault();dz.classList.add("border-sky-500")};
dz.ondragleave=function(){dz.classList.remove("border-sky-500")};
dz.ondrop=function(e){e.preventDefault();dz.classList.remove("border-sky-500");escolherArquivo(e.dataTransfer.files[0])};
document.getElementById("btnProcessar").onclick=processar;
document.getElementById("btnAplicar").onclick=aplicar}

function abrir(id){var t=T.filter(function(x){return x.id===id})[0];if(!t)return;sel=id;
document.getElementById("mTag").textContent="Item "+t.topicNumber+": "+t.topicTitle;
document.getElementById("mTitle").textContent=t.title;
document.getElementById("mResp").textContent=t.assignee;
document.getElementById("mPrazo").textContent=t.deadline;
document.getElementById("mCtx").textContent=t.context;
document.getElementById("mNotes").value=t.notes||"";
var p=document.getElementById("mPrio");p.textContent=t.priority;p.className="inline-block px-2 py-0.5 rounded text-xs border "+(PRIO[t.priority]||"");
var s=document.getElementById("mStat");s.textContent=t.status;s.className="inline-block px-2 py-0.5 rounded text-xs border "+(t.status==="Concluído"?"bg-emerald-100 text-emerald-800 border-emerald-300":t.status==="Em Andamento"?"bg-sky-100 text-sky-800 border-sky-300":"bg-slate-100 text-slate-700 border-slate-300");
document.getElementById("mDone").checked=t.status==="Concluído";
renderChecklist(id);renderTimeline(id);
document.getElementById("modal").classList.remove("hidden");document.getElementById("modal").classList.add("flex")}
function fechar(){document.getElementById("modal").classList.add("hidden");document.getElementById("modal").classList.remove("flex");sel=null}
document.getElementById("mClose").onclick=fechar;
document.getElementById("modal").onclick=function(e){if(e.target.id==="modal")fechar()};
document.getElementById("mSave").onclick=function(){var t=T.filter(function(x){return x.id===sel})[0];if(!t)return;
var d=document.getElementById("mDone").checked;var de=t.status;
var novo=d?"Concluído":(t.status==="Concluído"?"Em Andamento":t.status);
if(novo!==de)logTl(sel,"Status: "+de+" → "+novo),logEv({faca:"mudou status (ficha)",id:sel,acao:t.title,campo:"Status",de:de,para:novo});
var notaAntes=t.notes||"";var notaNova=document.getElementById("mNotes").value.trim();
if(notaNova!==notaAntes)(logTl(sel,notaAntes?"Anotação atualizada":"Anotação adicionada"),logEv({faca:"editou anotação",id:sel,acao:t.title,campo:"Anotações",de:notaAntes,para:notaNova}));
t.status=novo;t.notes=notaNova;salvar();render();fechar();toast("Alterações salvas","ok")};
document.querySelectorAll(".vb").forEach(function(b){b.onclick=function(){
document.querySelectorAll(".vb").forEach(function(x){x.className="vb px-2.5 py-1.5 rounded-md whitespace-nowrap"});
b.className="vb px-2.5 py-1.5 rounded-md bg-white text-slate-900 shadow-sm font-bold whitespace-nowrap";
view=b.dataset.v;render()}});
["q","fPrazo"].forEach(function(id){var e=document.getElementById(id);e.addEventListener(id==="q"?"input":"change",render)});
bindMulti();
document.querySelectorAll(".faltaBtn").forEach(function(b){b.onclick=function(){faltaFiltro=(faltaFiltro===b.dataset.falta)?"todos":b.dataset.falta;render()}});
var ka=document.getElementById("kAlerta");if(ka)ka.onclick=function(){faltaFiltro=(faltaFiltro==="qualquer")?"todos":"qualquer";if(faltaFiltro==="qualquer"){MULTI.area=[];MULTI.resp=[];MULTI.status=[];MULTI.prio=[];montaMulti();document.getElementById("fPrazo").value="ALL";document.getElementById("q").value=""}render()};
document.getElementById("btnResumo").onclick=function(){var l=filtrados();
var out=["*RESUMO — JUSSARA & VENTURA* ("+new Date().toLocaleDateString("pt-BR")+")","Total filtrado: "+l.length,""];
var nFalta=l.filter(function(t){return t.status!=="Concluído"&&precisaAtencao(t)}).length;
if(nFalta)out.push("⚠ "+nFalta+" ação(ões) sem responsável ou sem prazo","");
l.forEach(function(t,i){out.push((i+1)+". ["+t.area+"] "+t.title);out.push("   • "+t.assignee+" | "+t.deadline+" ("+t.priority+") | "+t.status+(precisaAtencao(t)?" ⚠ falta "+lacunas(t).join(" e "):""))});
var txt=out.join("\n");
if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){toast("Resumo copiado","ok")}).catch(fallback)}else fallback();
function fallback(){var ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("Resumo copiado","ok")}};

/* ---------- CLIQUES DELEGADOS (todas as visões, incluindo Frentes) ---------- */
document.addEventListener("click", function(ev){
var mc = ev.target.closest("[data-macro]");
if(mc && !ev.target.closest("[data-toggle]") && !ev.target.closest("[data-abrir]")){
 var area=mc.getAttribute("data-macro");
 MACRO_ABERTO=(MACRO_ABERTO===area)?null:area;
 render(); return }
var tg = ev.target.closest("[data-toggle]");
if(tg){ ev.preventDefault(); ev.stopPropagation(); toggle(tg.getAttribute("data-toggle")); return }
var ci = ev.target.closest("[data-ciclo]");
if(ci){ ev.preventDefault(); ev.stopPropagation(); ciclo(ci.getAttribute("data-ciclo")); return }
var el = ev.target.closest("[data-abrir]");
if(el){ ev.preventDefault(); abrir(el.getAttribute("data-abrir")); return }
});

carregar().then(function(d){
carregaExtra();init();kpis();montaMulti();render();bindChat();bindReuniao();bindExtraModal();bindSync();
var s=document.getElementById("dataStatus");s.textContent="dados de "+(d.atualizado||"—");s.className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800";
}).catch(function(e){
carregaExtra();init();kpis();montaMulti();render();bindChat();bindReuniao();bindExtraModal();bindSync();
var s=document.getElementById("dataStatus");s.textContent="erro ao carregar dados";s.className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800";
console.error(e)});
