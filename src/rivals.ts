/* El Banquillo · rivals.ts — Derbis y rivalidades: cada club tiene su rival de ciudad (y los grandes, su clásico).
 * Los derbis tienen más tensión (más tarjetas), más público y más consecuencias. Guarda tu historial contra cada club. */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {LG,S,T,seasonLabel,squad} from './state';
import {news} from './world';

/** Generador pseudoaleatorio propio (a partir de la semilla del mundo) para no tocar el azar del juego. */
function prng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
/** Crea las rivalidades una vez por mundo: parejas de la misma liga (derbi) y el clásico entre los dos grandes de cada Primera. */
export function initRivals(){
 if(S.rivals)return;S.rivals={};const R=prng((S.seed||1)*7919+13),add=(a,b,k)=>{(S.rivals[a]=S.rivals[a]||[]).push([b,k]);(S.rivals[b]=S.rivals[b]||[]).push([a,k]);};
 S.leagues.forEach(L=>{const ts=S.teams.filter(t=>t.lg===L.id&&!t.parent).map(t=>t.id);for(let i=ts.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[ts[i],ts[j]]=[ts[j],ts[i]];}
  for(let i=0;i+1<ts.length;i+=2)add(ts[i],ts[i+1],'d');
  if(L.lv===0){const big=S.teams.filter(t=>t.lg===L.id).sort((a,b)=>b.rep-a.rep).slice(0,2);if(big.length===2&&!rivalKind(big[0].id,big[1].id))add(big[0].id,big[1].id,'c');}});
}
export const rivalsOf=id=>{initRivals();return(S.rivals[id]||[]).filter(([r])=>T(r));};
/** 'd' derbi, 'c' clásico o null. */
export function rivalKind(a,b){const r=(S.rivals&&S.rivals[a]||[]).find(x=>x[0]===b);return r?r[1]:null;}
export const isDerby=(a,b)=>{initRivals();return !!rivalKind(a,b);};
export const derbyName=(a,b)=>rivalKind(a,b)==='c'?'Clásico':'Derbi';

/* ---------- Historial contra cada club ---------- */
const H=()=>S.h2h||(S.h2h={});
/** Tras cada partido oficial tuyo: guarda el resultado contra ese rival. */
export function recordH2H(m){
 if(!m.us||m.ref.k==='fr')return;const o=m.us==='h'?'a':'h',opp=m[o],my=m.score[m.us],op=m.score[o];
 const r=H()[opp]||(H()[opp]={w:0,d:0,l:0,gf:0,ga:0,last:[]}),res=my>op?'G':my<op?'P':'E';
 if(res==='G')r.w++;else if(res==='P')r.l++;else r.d++;r.gf+=my;r.ga+=op;r.last=r.last.concat([[seasonLabel(),m.us==='h'?'c':'f',my,op,res]]).slice(-8);
 if(isDerby(S.user,opp))derbyAfter(opp,res,my,op);
}
/** Ganar o perder un derbi se nota en la grada, el vestuario y la directiva. */
function derbyAfter(opp,res,my,op){
 const n=derbyName(S.user,opp),t=T(opp);
 if(res==='G'){if(S.club)S.club.mood=clamp(S.club.mood+6,0,100);squad(S.user).forEach(p=>p.hap=clamp((p.hap??70)+3,0,100));S.mgr.conf=clamp(S.mgr.conf+2,0,100);
  news(`¡${n} ganado! ${my}-${op} a ${t.name}. La afición está en una nube y el vestuario lo celebra.`,'good',{cat:'dir',subj:`¡${n} ganado!`});}
 else if(res==='P'){if(S.club)S.club.mood=clamp(S.club.mood-6,0,100);squad(S.user).forEach(p=>p.hap=clamp((p.hap??70)-2,0,100));S.mgr.conf=clamp(S.mgr.conf-2,0,100);
  news(`${n} perdido ante ${t.name} (${my}-${op}). Duele: la afición y la directiva no lo olvidarán pronto.`,'bad',{cat:'dir',subj:`${n} perdido`});}
}
export const h2hOf=opp=>H()[opp]||null;
/** Resumen corto: «3G 1E 2P · últimos: G P E». */
export function h2hTxt(opp){const r=h2hOf(opp);if(!r)return 'Primer enfrentamiento';return `${r.w}G ${r.d}E ${r.l}P · goles ${r.gf}-${r.ga}`;}
export const h2hDots=opp=>{const r=h2hOf(opp);return r?`<span class="formdots">${r.last.slice(-5).map(x=>`<span class="${x[4]}" title="${x[0]}: ${x[2]}-${x[3]}">${x[4]}</span>`).join('')}</span>`:'';};
/** Racha actual contra un rival (por ejemplo: «3 victorias seguidas»). */
export function h2hStreak(opp){const r=h2hOf(opp);if(!r||r.last.length<2)return '';const k=r.last[r.last.length-1][4];let n=0;for(let i=r.last.length-1;i>=0&&r.last[i][4]===k;i--)n++;
 return n>=2?`${n} ${k==='G'?'victorias':k==='P'?'derrotas':'empates'} seguid${k==='G'||k==='P'?'as':'os'}`:'';}
/** Semana de derbi: aviso al empezar la jornada. */
export function derbyWeekNews(opp){const t=T(opp),n=derbyName(S.user,opp),st=h2hStreak(opp);
 news(`Semana de ${n.toLowerCase()}: toca ${t.name}. La ciudad no habla de otra cosa. ${h2hOf(opp)?`Historial: ${h2hTxt(opp)}${st?' ('+st+')':''}.`:'Será el primero de tu etapa.'} En los derbis hay más tensión (más tarjetas) y el estadio se llena.`,'',{cat:'com',subj:`Semana de ${n.toLowerCase()}: ${t.name}`});}
