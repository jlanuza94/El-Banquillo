/* El Banquillo · scoutplus.ts — Buscar jugadores y joyas: búsquedas guardadas, avisos de seguimiento,
 * misiones de ojeo por el mundo y joyas escondidas que otros clubes también buscan. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,gauss,money,pick,r2,ri,rnd} from './core';
import {COUNTRIES,GRP,SPN} from './data';
import {LG,PL,S,T,setTeam,wcs} from './state';
import {news} from './world';
import {grade,knowledge,scoutReport} from './scouting';
import {assignNum,baseWage} from './players';
import {crew} from './staff';

/* ---------- Búsquedas guardadas ---------- */
const MK_KEYS=['pos','sp','c','lv','min','age','max','sort','ok','last','nat','wage','pot','atk','atv','rep','gem'];
export function saveSearch(name){S.mkSaved=S.mkSaved||[];const f={};MK_KEYS.forEach(k=>f[k]=S.mk[k]);S.mkSaved=S.mkSaved.filter(x=>x.n!==name).concat([{n:name,f}]).slice(-8);}
export function loadSearch(i){const x=(S.mkSaved||[])[i];if(!x)return;Object.assign(S.mk,x.f,{limit:40,tab:'buy'});}
export function delSearch(i){(S.mkSaved||[]).splice(i,1);}
/** Nombre automático de la búsqueda según sus filtros. */
export function searchName(){const m=S.mk,p=[];if(m.sp)p.push(SPN[m.sp]);else if(m.pos!=='ALL')p.push(m.pos);if(m.age)p.push('≤'+m.age+' años');if(m.pot)p.push('pot. '+m.pot+'+');if(m.atk&&m.atv)p.push(m.atk+' '+m.atv+'+');if(m.nat!==''&&m.nat!=null&&COUNTRIES[+m.nat])p.push(COUNTRIES[+m.nat].n);if(m.max)p.push('≤'+money(+m.max));return p.join(' · ')||'Mi búsqueda';}

/* ---------- Avisos de la lista de seguimiento ---------- */
export function shortlistWeekly(){
 S.shortSnap=S.shortSnap||{};const snap={};
 (S.short||[]).forEach(id=>{const p=PL(id);if(!p||p.team===S.user)return;const o=S.shortSnap[id],now={v:p.value,inj:p.inj||0,t:p.team,c:p.contract};snap[id]=now;if(!o)return;
  const act=[{l:'Ver ficha',a:'ficha',id}];
  if(now.t!==o.t)news(`${p.name}, al que seguías, ha fichado por ${now.t===null?'nadie (es agente libre)':T(now.t).name}.`,now.t===null?'good':'bad',{cat:'oje',subj:`Seguimiento: ${p.name} cambia de club`,act});
  else if(now.v<=o.v*.88)news(`${p.name} ha bajado de valor: ahora ${money(now.v)} (antes ${money(o.v)}). Buen momento para ofertar.`,'good',{cat:'oje',subj:`Seguimiento: ${p.name} más barato`,act});
  if(now.inj>2&&!o.inj)news(`${p.name}, al que sigues, se ha lesionado (${now.inj} jornadas).`,'bad',{cat:'oje',subj:`Seguimiento: ${p.name} lesionado`,act});
  if(now.c<=1&&o.c>1&&now.t!==null)news(`${p.name} entra en su último año de contrato: su club lo venderá más barato y en verano podría salir gratis.`,'good',{cat:'oje',subj:`Seguimiento: ${p.name} acaba contrato`,act});
 });
 S.shortSnap=snap;
}

/* ---------- Joyas escondidas ---------- */
/** Siembra joyas: chavales flojos de ligas pequeñas o divisiones bajas con un potencial enorme. */
export function seedGems(n){
 const pool=Object.values(S.players).filter(p=>p.team!==null&&p.team!==S.user&&p.age>=16&&p.age<=19&&p.ovr<=55&&!p.gem&&T(p.team)&&!T(p.team).parent&&(LG(T(p.team).lg).lv>=2||COUNTRIES[LG(T(p.team).lg).c].top<72));
 for(let i=0;i<n&&pool.length;i++){const p=pool.splice(Math.floor(rnd()*pool.length),1)[0];p.gem=1;p.pot=r2(clamp(7.8+rnd()*1.4,1,10));}
 S.gemsV=1;
}
export const isGem=p=>!!(p&&p.gem);
/** Las joyas que ya despuntan llaman la atención de los grandes: si tardas, otro se te adelanta. */
export function gemsWeekly(){
 const big=S.teams.filter(t=>!t.parent&&LG(t.lg).lv===0&&t.id!==S.user).sort((a,b)=>b.rep-a.rep).slice(0,30);
 Object.values(S.players).forEach(p=>{if(!p.gem||p.team===S.user||p.loan||p.ovr<60||rnd()>.012)return;const from=p.team;if(from!==null&&LG(T(from).lg).lv===0&&T(from).rep>=70)return;
  const b=pick(big);if(!b||b.id===from)return;const fee=r2(p.value*1.3);setTeam(p,b.id);assignNum(p);p.contract=ri(3,5);p.wage=Math.max(p.wage,baseWage(p));
  if((S.short||[]).includes(p.id)||knowledge(p)>=60)news(`${b.name} se adelanta y ficha a ${p.name} (${p.age} años) por ${money(fee)}. Era una de las joyas que tenías vistas.`,'bad',{cat:'oje',subj:`Te quitan una joya: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});});
}

/* ---------- Misiones de ojeo por el mundo ---------- */
export const MIS_WEEKS=[4,8];
/** Quién puede ir de misión: tus ojeadores y, siempre, tu segundo entrenador (juzga peor el potencial). */
export function missionScouts(){const dd=crew('seg')[0]||crew('dd')[0];return (S.scouts||[]).concat([{id:'seg',name:dd?dd.name:'Tu segundo entrenador',jui:4,jpo:4,virt:1}]);}
const scoutBy=id=>missionScouts().find(x=>x.id===id);
/** Manda a un ojeador a buscar un tipo de jugador en un país. */
export function startMission(scId,c,g,age,weeks,pot,money_){
 const sc=scoutBy(scId);if(!sc)return 'Ese ojeador ya no está.';
 S.missions=(S.missions||[]).filter(x=>x.sc!==scId);
 S.missions.push({sc:scId,c:+c,g:g||'ALL',age:+age||0,pot:+pot||0,mx:money_||'0',until:S.week+(+weeks||4),found:[],rep:{}});return '';
}
/** El encargo: puesto (línea o puesto exacto), potencial mínimo y lo que te puedes gastar. */
export const MIS_POT=[['0','Cualquier potencial'],['65','Potencial 65+'],['75','Potencial 75+'],['85','Potencial 85+']];
export const MIS_MX=[['0','Cualquier precio'],['b','Que pueda pagar'],['c','Barato (¼ del presupuesto)'],['f','Solo libres']];
const fitsPos=(p,g)=>g==='ALL'||(['POR','DEF','MED','DEL'].includes(g)?(GRP[p.sp]||p.pos)===g:p.sp===g||(p.alt||[]).includes(g));
const fee=p=>p.team===null?0:p.value*1.2;
const fitsMx=(p,mx)=>mx==='f'?p.team===null:mx==='b'?fee(p)<=Math.max(0,S.budget):mx==='c'?fee(p)<=Math.max(0,S.budget)*.25:true;
/** Riesgo del fichaje según el ojeador: lesiones, carácter, adaptación y lo incierto de su potencial. */
export function riskOf(p,jp=5){
 const W=[];let r=0;
 if((p.prone||0)>=.5){r+=2;W.push('propenso a lesionarse');}
 if(p.per==='tem'){r+=1;W.push('temperamental');}
 if(p.per==='amb'&&LG(T(S.user).lg).lv>=2){r+=1;W.push('ambicioso: querrá jugar más arriba');}
 const my=COUNTRIES[LG(T(S.user).lg).c];if(my&&COUNTRIES[p.nat]&&COUNTRIES[p.nat].lang!==my.lang){r+=1;W.push('le costará adaptarse al idioma');}
 if(p.age<=19&&jp<7){r+=1;W.push('muy joven: su techo es una incógnita');}
 if(p.per==='pro'||p.per==='lea'){r=Math.max(0,r-1);W.push(p.per==='pro'?'muy profesional':'leal');}
 return {lv:r>=3?'alto':r>=1?'medio':'bajo',why:W};
}
export function stopMission(scId){S.missions=(S.missions||[]).filter(x=>x.sc!==scId);}
/** Cada jornada: el ojeador busca en su país; cuanto mejor juzga el potencial, más fácil que encuentre una joya. */
export function missionsWeekly(){
 S.missions=S.missions||[];S.know=S.know||{};const all=Object.values(S.players);
 S.missions=S.missions.filter(M=>{const sc=scoutBy(M.sc);if(!sc)return false;
  const jp=sc.jpo||sc.jui||5;
  if(rnd()<.5+.04*jp){
   const pool=all.filter(p=>p.team!==S.user&&!p.loan&&!M.found.includes(p.id)&&(p.team===null?p.nat===M.c:LG(T(p.team).lg).c===M.c)&&fitsPos(p,M.g)&&(!M.age||p.age<=M.age)&&(!M.pot||p.pot*10>=M.pot-(11-jp))&&fitsMx(p,M.mx||'0'));
   let best=null,bs=-1e9;for(const p of pool){const s=(p.age<=23?p.pot*10:p.ovr)-p.age*.3+(p.gem?6+jp:0)+gauss()*(11-jp)*1.6;if(s>bs){bs=s;best=p;}}
   if(best){M.found.push(best.id);S.know[best.id]=100;M.rep=M.rep||{};const rk=riskOf(best,jp);M.rep[best.id]=[grade(best).g,rk.lv,rk.why.join(', ')];scoutReport(best,sc.name+` (misión en ${COUNTRIES[M.c].n})`,rk);if(best.gem)news(`${sc.name}: «En ${COUNTRIES[M.c].n} he visto a ${best.name}, ${best.age} años. Ahora no destaca, pero tiene algo especial: puede ser una joya.»`,'good',{cat:'oje',subj:`💎 Posible joya: ${best.name}`,act:[{l:'Ver ficha',a:'ficha',id:best.id},{l:'Seguir',a:'fav',id:best.id}]});}
  }
  if(S.week>=M.until){const R=M.rep||{},top=M.found.filter(id=>PL(id)&&PL(id).team!==S.user).sort((a,b)=>((R[a]||'D')[0]>(R[b]||'D')[0]?1:-1)||PL(b).pot-PL(a).pot)[0];news(`${sc.name} vuelve de su misión en ${COUNTRIES[M.c].n}: ${M.found.length} informe${M.found.length===1?'':'s'}.${top?` Su recomendación: ${PL(top).name} (nota ${(R[top]||'?')[0]}, riesgo ${(R[top]||[])[1]||'?'}).`:''}`,'',{cat:'oje',subj:`Fin de la misión en ${COUNTRIES[M.c].n}`,act:[{l:'Ver misiones',a:'mk-tab',v:'ojeo'}]});return false;}
  return true;});
}
export const missionOf=scId=>(S.missions||[]).find(x=>x.sc===scId);
export const missionCountries=()=>wcs();
