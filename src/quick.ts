/* El Banquillo · quick.ts — Modo rápido (tu segundo se encarga de lo rutinario) y búsqueda global. */
// @ts-nocheck — usa el estado heredado S.
import {plain} from './core';
import {GRP} from './data';
import {LG,PL,S,T,squad,uLg} from './state';
import {news} from './world';
import {answerPress} from './club';
import {ST_ROLES,crew,hireStaff,staffWage} from './staff';
import {askPrice,refuses} from './market';
import {estOvr,knowledge} from './scouting';
import {wageCheck} from './clubplus';
import {promoteYouth} from './academy';
import {COUNTRIES} from './data';

export const MODES={profundo:{n:'Profundo',d:'Controlas todo: entrenamiento, cuerpo técnico, prensa, análisis y editor.'},rapido:{n:'Rápido',d:'Tu segundo se encarga de lo rutinario (prensa, patrocinador, entrenamiento, rotación, cuerpo técnico y cantera) y el menú se simplifica. Tú eliges el once, las tácticas y los fichajes.'}};
export const quick=()=>S&&S.mode==='rapido';
/** Secciones que se esconden del menú en modo rápido (siguen accesibles desde «Más»). */
export const DEEP_ONLY=['entreno','staff','analisis','editor'];

/** Cada jornada en modo rápido: el segundo decide lo rutinario y lo cuenta en la bandeja. */
export function quickWeekly(){
 if(!quick())return;const done=[];
 S.autoRot=true;
 if(S.press){answerPress(0);done.push('respondió a la prensa');}
 if(!S.sponsor&&S.spOffers&&S.spOffers.length){S.sponsor=S.spOffers.slice().sort((a,b)=>(b.weekly+b.win*.4)-(a.weekly+a.win*.4))[0];done.push(`firmó con ${S.sponsor.name} como patrocinador`);}
 // entrenamiento: descanso si el equipo está fundido; si no, equilibrado
 const sq=squad(S.user),en=sq.reduce((a,p)=>a+p.energy,0)/Math.max(1,sq.length);S.train={focus:en<72?'des':'eq',int:'n'};
 // cuerpo técnico: cubre los puestos vacíos con el mejor candidato asequible
 Object.entries(ST_ROLES).forEach(([r,R])=>{if(crew(r).length>=Math.min(R.max,r==='ent'?2:1))return;const c=(S.staffPool||[]).filter(m=>m.role===r&&staffWage(m)<=Math.max(.001,S.budget/40)).sort((a,b)=>b.at[R.at[0]]-a.at[R.at[0]])[0];if(c&&!hireStaff(c.id))done.push(`contrató a ${c.name} (${R.n.toLowerCase()})`);});
 // cantera: sube a los de 18 años con futuro
 (S.academy||[]).filter(p=>p.age>=18&&p.pot*10>=sq.map(x=>x.ovr).sort((a,b)=>b-a)[15]).forEach(p=>{if(sq.length<28&&!wageCheck(p.wage||0)){promoteYouth(p.id);done.push(`subió a ${p.name} de la cantera`);}});
 if(done.length)news(`Tu segundo ${done.join(', ')}.`,'',{cat:'sta',subj:'Lo que ha hecho tu segundo',quiet:true});
}
/** Fichajes recomendados: refuerzos para tu línea más floja que te puedes permitir. */
let SUG={k:'',v:null};
export function suggestions(n=3){
 const key=[S.seasonN,S.week,Math.round(S.budget*100),squad(S.user).length,S.user].join('|');if(SUG.k===key)return SUG.v;
 const v=suggestions0(n);SUG={k:key,v};return v;
}
function suggestions0(n){
 const sq=squad(S.user),lines=['POR','DEF','MED','DEL'].map(g=>{const v=sq.filter(p=>(GRP[p.sp]||p.pos)===g).map(p=>p.ovr).sort((a,b)=>b-a),k=g==='POR'?1:g==='DEL'?2:4;return[g,v.slice(0,k).reduce((a,b)=>a+b,0)/Math.max(1,Math.min(k,v.length))||0];});
 const all=sq.map(p=>p.ovr).sort((a,b)=>b-a),avg=all.slice(0,11).reduce((a,b)=>a+b,0)/11;
 const [g,lv]=lines.sort((a,b)=>(a[1]-avg)-(b[1]-avg))[0],budget=Math.max(0,S.budget);
 const c=Object.values(S.players).filter(p=>p.team!==S.user&&!p.loan&&(GRP[p.sp]||p.pos)===g&&p.age<=30&&knowledge(p)>=50&&!refuses(p)&&askPrice(p)<=budget*.8&&estOvr(p)>lv+2);
 return{g,list:c.sort((a,b)=>estOvr(b)/Math.sqrt(askPrice(b)+.05)-estOvr(a)/Math.sqrt(askPrice(a)+.05)).slice(0,n)};
}

/* ---------- Búsqueda global ---------- */
/** Busca jugadores, clubes y ligas por nombre. */
export function search(q){
 q=plain(String(q||'').toLowerCase().trim());if(q.length<2)return{pl:[],cl:[],lg:[]};
 const pl=[];for(const p of Object.values(S.players)){if(plain(p.name.toLowerCase()).includes(q)){pl.push(p);if(pl.length>=12)break;}}
 const cl=S.teams.filter(t=>plain(t.name.toLowerCase()).includes(q)).slice(0,8);
 const lg=S.leagues.filter(L=>plain((COUNTRIES[L.c].n+' '+(S.lgNames&&S.lgNames[L.id]||'')).toLowerCase()).includes(q)).slice(0,5);
 return{pl,cl,lg};
}
