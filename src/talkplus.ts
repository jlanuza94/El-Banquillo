/* El Banquillo · talkplus.ts — Charlas como en FM: cada jugador reacciona a tu charla (motivado, concentrado,
 * indiferente, nervioso o molesto) según su carácter, su edad y cómo va su partido; y charla final al acabar. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,rnd} from './core';
import {PL,S} from './state';

export const REACT={mot:['🔥','motivado'],con:['🎯','concentrado'],ind:['😐','indiferente'],ner:['😰','nervioso'],mol:['😠','molesto']};
const kindOf=v=>v>=.6?'mot':v>=.2?'con':v>-.25?'ind':v>-.6?'ner':'mol';
/** Reacción de cada titular a la charla de antes o del descanso. Cambia su forma en el partido. */
export function talkReactions(m,ph,opt,teamD,rat={}){
 const big=m.ref.k!=='lg',ids=(m.lu[m.us]||[]).filter(Boolean),out=[];
 ids.forEach(id=>{const p=PL(id);if(!p)return;const r=rat[id]??6.5,lid=p.at.lid??5,hard=opt==='exi'||opt==='bro';
  let v=teamD*22+(rnd()-.5)*.5;
  if(hard){if(p.per==='tem')v-=.6;if(p.per==='pro'||p.per==='lid'||lid>=7)v+=.4;if(p.age<=20)v-=.35;if(ph==='half'&&r>=7)v-=.5;if(ph==='half'&&r<6.2)v+=.3;}
  if(opt==='mot'&&big&&p.age<=21)v-=.3;
  if(opt==='cal'&&p.age<=21)v+=.3;
  if(opt==='elo'||opt==='ani'){if(r<6)v-=ph==='half'&&opt==='elo'?.4:0;else if(r>=6.8)v+=.3;}
  if((p.hap??70)<40)v-=.3;
  const k=kindOf(v);p.form=clamp((p.form||0)+(k==='mot'?1:k==='con'?.5:k==='ner'?-.5:k==='mol'?-1:0),-3,3);if(k==='mol')p.hap=clamp((p.hap??70)-2,0,100);
  out.push([id,k]);});
 return out;
}
export const FIN={elo:'Elogiar al equipo',exi:'Exigir más',cal:'Sin charla: a por el siguiente'};
/** Charla final: cambia el ánimo de cada uno según el resultado y su partido. */
export function finTalk(m,opt,rat={}){
 if(!m||!m.done||!m.us||m.talks.fin)return null;const us=m.us,o=us==='h'?'a':'h',sd=m.score[us]-m.score[o],ids=Object.keys(m.played||{}).filter(id=>PL(id)&&PL(id).team===S.user),re=[];
 ids.forEach(id=>{const p=PL(id),r=rat[id]??6.3;let v=0;
  if(opt==='elo')v=sd>=0?(r>=6.5?.7:.3):(r>=7?.3:p.per==='lid'||p.per==='pro'?-.4:-.1);
  else if(opt==='exi')v=sd<0?(r<6.3?(p.per==='pro'||p.per==='lid'?.5:-.2):-.5):sd===0?(r<6.3?.2:-.3):-.6;
  else v=0;
  if(p.per==='tem'&&opt==='exi')v-=.3;
  const k=kindOf(v+(rnd()-.5)*.3);p.hap=clamp((p.hap??70)+(k==='mot'?3:k==='con'?1:k==='ner'?-1:k==='mol'?-3:0),0,100);re.push([id,k]);});
 const good=re.filter(x=>x[1]==='mot'||x[1]==='con').length,bad=re.filter(x=>x[1]==='mol'||x[1]==='ner').length;
 m.talks.fin={opt,re,d:(good-bad)/Math.max(1,re.length)*.05,txt:good>bad?'el vestuario sale con buen ánimo.':bad>good?'hay caras largas en el vestuario.':'el mensaje pasa sin más.'};
 return m.talks.fin;
}
/** Fichas de reacciones para enseñar en el partido. */
export function reactHTML(re){if(!re||!re.length)return '';const g={};re.forEach(([id,k])=>{(g[k]=g[k]||[]).push(id);});
 return `<div class="treact">${Object.keys(REACT).filter(k=>g[k]).map(k=>`<span class="trk ${k}" title="${g[k].map(id=>PL(id)?PL(id).name:'').join(', ')}">${REACT[k][0]} ${g[k].length} ${REACT[k][1]}${g[k].length>1?'s':''}: ${g[k].slice(0,4).map(id=>PL(id)?PL(id).name.split(' ').slice(-1)[0]:'').join(', ')}${g[k].length>4?'…':''}</span>`).join('')}</div>`;}
