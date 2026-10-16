/* El Banquillo · views/styles.ts — Tácticas › Estilos: los sistemas famosos en tarjetas, filtrados por familia,
 * con cuánto encaja tu plantilla en cada uno y qué puestos te faltarían. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {MENT,TACS,TAC0} from '../data';
import {S,T,qc} from '../state';
import {PRESETS,presetFit} from '../tactics2';

const GROUPS=['Todos','Posesión','Presión','Contra','Directo','Ofensivo','Defensivo'];
const KEYS=['pre','lin','rit','est'];
export function estilosHTML(){
 const t=T(S.user),g=S.stG||'Todos',F={};Object.keys(PRESETS).forEach(k=>F[k]=presetFit(k));
 const L=Object.entries(PRESETS).filter(([,P])=>g==='Todos'||P.g===g).map(([k,P])=>({k,P,fit:F[k]})),top=Math.max(...Object.values(F).map(x=>x.avg));
 const use=k=>{const P=PRESETS[k];return t.style===k&&t.formation===P.f&&t.ment===P.ment&&Object.entries(P.tac).every(([x,v])=>(t.tac||{})[x]===v);};
 const card=({k,P,fit})=>{const r=fit.avg/top,lab=r>=.985?['Encaja perfecto','q5']:r>=.96?['Encaja bien','q4']:r>=.93?['Encaja regular','q3']:['Le cuesta','q2'],tac=Object.assign({},TAC0,P.tac);
  return `<div class="stc${use(k)?' on':''}"><div class="stc-h"><span class="stg">${esc(P.g||'')}</span>${use(k)?'<span class="tag xi">En uso</span>':''}</div>
  <b class="stn">${esc(P.n)}</b><div class="small muted">${P.f} · ${MENT[P.ment].label}</div>
  <p class="std">${esc(P.d)}</p>
  <div class="stt">${KEYS.map(x=>`<span>${esc(TACS[x].n)}: <b>${esc(TACS[x].o[tac[x]])}</b></span>`).join('')}</div>
  <div class="stfit"><span class="small">Tu plantilla</span><span class="stbar"><i class="${lab[1]}" style="width:${Math.round(Math.min(1,fit.avg/100)*100)}%"></i></span><b class="${lab[1]} q">${Math.round(fit.avg)}</b></div>
  <div class="small ${lab[1]==='q2'||lab[1]==='q3'?'':'muted'}">${lab[0]}${fit.weak.length?` · flojo en ${fit.weak.join(', ')}`:''}</div>
  <button class="btn sm ${use(k)?'':'primary'}" data-a="preset" data-v="${k}">${use(k)?'Volver a cargar':'Usar este estilo'}</button></div>`;};
 return `<section class="panel"><div class="panel-h"><h2>Estilos de juego</h2><span class="eyebrow">${Object.keys(PRESETS).length} estilos · cárgalo y retócalo a tu gusto</span></div>
 <div class="chips" style="margin:0 0 10px">${GROUPS.map(x=>`<button class="btn sm ${g===x?'dark':''}" data-a="st-g" data-v="${x}">${x}</button>`).join('')}</div>
 <div class="stgrid">${L.map(card).join('')}</div>
 <p class="small muted" style="margin:10px 0 0">Cargar un estilo cambia formación, mentalidad, instrucciones, roles y cometidos. «Tu plantilla» es la media del mejor once que puedes sacar con sus roles. Un estilo nuevo hay que entrenarlo: el dominio empieza bajo y sube jugando y con sesiones de táctica.</p></section>`;
}
