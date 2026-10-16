/* El Banquillo · views/inbox.ts — Pantalla de la bandeja de entrada. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {ptMailState} from '../preseason';
import {S} from '../state';
import {CATS} from '../inbox';

const actBtn=(x,primary)=>`<button class="btn sm ${primary?'primary':''}" data-a="${esc(x.a)}"${x.id!=null?` data-id="${esc(x.id)}"`:''}${x.v!=null?` data-v="${esc(x.v)}"`:''}${x.i!=null?` data-i="${esc(x.i)}"`:''}${x.k!=null?` data-k="${esc(x.k)}"`:''}${x.go!=null?` data-go="${esc(x.go)}"`:''}>${esc(x.l)}</button>`;

export function buzonView(){
 const all=S.inbox||[],cat=S.mailCat||'all',list=cat==='all'?all:all.filter(m=>m.cat===cat);
 const cnt=c=>all.filter(m=>!m.read&&(c==='all'||m.cat===c)).length;
 const used=Object.keys(CATS).filter(k=>all.some(m=>m.cat===k));
 const chips=`<div class="chips" style="margin-bottom:10px">${['all',...used].map(k=>{const n=cnt(k);return `<button class="btn sm ${cat===k?'dark':''}" data-a="mail-cat" data-v="${k}">${k==='all'?'Todo':CATS[k].n}${n?` <span class="badge" style="position:static;margin-left:4px">${n}</span>`:''}</button>`;}).join('')}</div>`;
 const sel=list.find(m=>m.id===S.mailSel)||null;
 const rows=list.length?`<ul class="mlist">${list.slice(0,80).map(m=>`<li><button class="mrow ${m.read?'':'unread'} ${sel&&sel.id===m.id?'on':''} ${m.kind}" data-a="mail-open" data-id="${m.id}">
  <span class="mfrom">${esc(m.from)}</span><span class="mwk">J${m.wk}</span>
  <span class="msubj">${esc(m.subj)}</span><span class="mcat">${esc(CATS[m.cat]?CATS[m.cat].n:'')}</span></button></li>`).join('')}</ul>`:'<div class="empty">No hay mensajes en esta sección.</div>';
 const listP=`<section class="panel mlistp"><div class="panel-h"><h2>Bandeja de entrada</h2>${cnt(cat)?`<button class="btn sm" data-a="mail-all">Marcar todo como leído</button>`:`<span class="eyebrow">${list.length} mensaje${list.length===1?'':'s'}</span>`}</div>${chips}${rows}</section>`;
 const detail=sel?`<section class="panel mdetail"><div class="row" style="margin-bottom:8px"><button class="btn sm" data-a="mail-back">← Volver</button><span class="spacer"></span><span class="eyebrow">${esc(CATS[sel.cat]?CATS[sel.cat].n:'')} · ${esc(sel.sn||'')} · jornada ${sel.wk}</span></div>
  <div class="eyebrow">De: ${esc(sel.from)}</div><h2 style="margin:4px 0 10px">${esc(sel.subj)}</h2>
  <p style="margin:0;line-height:1.55" class="${sel.kind}">${esc(sel.txt)}</p>
  ${(()=>{const st=sel.once==='pt'||(sel.act||[]).some(x=>x.a==='pt-join')?ptMailState():null;if(st)return `<div class="mdone ${st.ok?'ok':''}"><span>${esc(st.txt)}</span>${st.ok?'<button class="btn sm primary" data-a="pt-view">🏆 Ver el torneo</button>':''}</div>`;return sel.act&&sel.act.length?`<div class="acts" style="justify-content:flex-start">${sel.act.map((x,i)=>actBtn(x,i===0)).join('')}</div>`:'';})()}</section>`
 :`<section class="panel mdetail mempty"><div class="empty">Elige un mensaje para leerlo.</div></section>`;
 return `<div class="grid inbox ${sel?'has-sel':''}">${listP}${detail}</div>`;
}
