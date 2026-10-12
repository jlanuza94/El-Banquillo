/* El Banquillo · clubplus.ts — Club: filial en una liga de verdad, clubes afiliados, límite salarial y préstamos bancarios. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,rnd} from './core';
import {COUNTRIES} from './data';
import {LG,PL,S,T,dirty,findLg,lgName,lowest,setTeam,squad,uLg,unit} from './state';
import {news,townName} from './world';
import {assignNum} from './players';
import {fixLineup} from './tactics';

/* ---------- Límite salarial (presupuesto de sueldos separado del de fichajes) ---------- */
export const wageBill=()=>squad(S.user).reduce((a,p)=>a+p.wage,0)+(filial()?squad(filial().id).reduce((a,p)=>a+p.wage,0):0);
/** La directiva fija un límite de sueldos semanal: algo por encima de lo que pagas ahora. */
export function setWageCap(extra=0){const b=wageBill();S.wageCap=r3(Math.max(b*1.1,b+unit(LG(uLg()).rep)*.02)+extra);}
export const wageRoom=()=>r3((S.wageCap??Infinity)-wageBill());
/** ¿Cabe este sueldo nuevo (o la subida) en el límite? Devuelve '' o el motivo. */
export function wageCheck(newWage,oldWage=0){if(S.wageCap==null)return '';const room=wageRoom()+oldWage;return newWage<=room+1e-9?'':`La directiva no lo aprueba: con ese sueldo superas el límite salarial (te quedan ${money(Math.max(0,room))}/sem). Puedes subirlo en Club y finanzas a cambio de presupuesto de fichajes.`;}
/** Pasar dinero de fichajes a sueldos (o al revés). 1 € a la semana de límite cuesta 40 € de fichajes. */
export function moveBudget(dir){
 const step=r3(Math.max(.0005,(S.wageCap||wageBill())*.1));
 if(dir>0){const cost=r3(step*40);if(cost>S.budget)return 'No tienes presupuesto de fichajes suficiente.';S.budget=r3(S.budget-cost);S.wageCap=r3(S.wageCap+step);return '';}
 if(S.wageCap-step<wageBill())return 'No puedes bajar el límite por debajo de lo que ya pagas en sueldos.';
 S.wageCap=r3(S.wageCap-step);S.budget=r3(S.budget+step*32);return '';
}

/* ---------- Préstamos bancarios ---------- */
export const loanOffers=()=>{const u=unit(LG(uLg()).rep);return [[r2(u*3),2],[r2(u*6),3],[r2(u*12),4]];};
export const MAX_BANK=2;
export function takeBankLoan(i){
 S.bank=S.bank||[];if(S.bank.length>=MAX_BANK)return `Ya tienes ${MAX_BANK} préstamos.`;
 const [amt,yrs]=loanOffers()[i],total=r3(amt*(1+.06*yrs)),weeks=yrs*38,weekly=r3(total/weeks);
 S.bank.push({amt,weekly,left:weeks,yrs});S.budget=r3(S.budget+amt);S.mgr.conf=clamp(S.mgr.conf-2,0,100);
 news(`El banco te presta ${money(amt)}. Devolverás ${money(weekly)} a la semana durante ${yrs} temporadas (${money(total)} en total, un 6% de interés al año).`,'',{cat:'dir',subj:`Préstamo bancario de ${money(amt)}`});
 return '';
}
export const bankWeekly=()=>{let pay=0;(S.bank||[]).forEach(b=>{if(b.left>0){pay+=b.weekly;b.left--;}});S.bank=(S.bank||[]).filter(b=>b.left>0);return r3(pay);};
export const bankDebt=()=>(S.bank||[]).reduce((a,b)=>a+b.weekly*b.left,0);
export const bankWeeklyCost=()=>(S.bank||[]).reduce((a,b)=>a+b.weekly,0);

/* ---------- Clubes afiliados ---------- */
export const MAX_AFF=2;
export const affiliates=()=>(S.affil||[]).filter(id=>T(id)&&id!==S.user);
export function affCandidates(){
 const my=T(S.user),L=LG(my.lg),c=L.c;
 return S.teams.filter(t=>t.id!==S.user&&!t.parent&&!affiliates().includes(t.id)&&LG(t.lg).c===c&&LG(t.lg).lv>L.lv).sort((a,b)=>b.rep-a.rep).slice(0,4);
}
export function addAffiliate(id){S.affil=affiliates();if(S.affil.length>=MAX_AFF)return `Ya tienes ${MAX_AFF} clubes afiliados.`;S.affil.push(+id);news(`${T(id).name} pasa a ser club afiliado: acogerá a tus cedidos y te dará preferencia con sus jugadores.`,'good',{cat:'dir',subj:`Nuevo afiliado: ${T(id).name}`});return '';}
export function removeAffiliate(id){S.affil=affiliates().filter(x=>x!==+id);}
export const isAffiliate=tid=>affiliates().includes(tid);

/* ---------- Filial ---------- */
export const filial=()=>S.teams.find(t=>t.parent===S.user)||null;
/** Crea el filial convirtiendo un club de la última división de tu país. */
export function createFilial(){
 if(filial())return 'Ya tienes un filial.';
 const my=T(S.user),L=LG(my.lg),low=findLg(L.c,COUNTRIES[L.c].lv-1);
 if(low.id===L.id)return 'Tu equipo está en la última división: el filial tiene que jugar en una categoría inferior.';
 const t=S.teams.filter(x=>x.lg===low.id&&x.id!==S.user).sort((a,b)=>a.rep-b.rep)[0];
 const old=t.name;t.parent=S.user;t.name=my.name+' B';t.short=(my.short.slice(0,2)+'B').toUpperCase();t.c1=my.c1;t.c2=my.c2;t.rep=Math.min(t.rep,my.rep-6);
 if(S.coaches)delete S.coaches[t.id];
 if(S.wageCap!=null)S.wageCap=r3(S.wageCap+squad(t.id).reduce((a,p)=>a+p.wage,0)); // la directiva asume los sueldos del filial
 news(`Nace el filial: ${old} se convierte en ${t.name} y jugará en ${lgName(low.id)}. Sus jugadores ya son tuyos: puedes subirlos al primer equipo o bajar a los que necesiten minutos.`,'good',{cat:'dir',subj:'Nuevo equipo filial',act:[{l:'Ver filial',a:'view',v:'club'}]});
 return '';
}
/** Mover jugadores entre el primer equipo y el filial. */
export function toFilial(pid){const b=filial(),p=PL(pid);if(!b||!p||p.team!==S.user||p.loan)return 'No se puede.';if(squad(S.user).length<=16)return 'Necesitas al menos 16 jugadores en el primer equipo.';if(squad(b.id).length>=30)return 'El filial está lleno.';
 setTeam(p,b.id);assignNum(p);const t=T(S.user),i=t.lineup.indexOf(pid);if(i>=0)t.lineup[i]=null;fixLineup();return '';}
export function fromFilial(pid){const b=filial(),p=PL(pid);if(!b||!p||p.team!==b.id)return 'No se puede.';if(squad(S.user).length>=30)return 'Tu plantilla ya tiene 30 jugadores.';if(squad(b.id).length<=16)return 'El filial necesita al menos 16 jugadores.';
 setTeam(p,S.user);assignNum(p);p.role=p.role||'jo';p.hap=Math.max(p.hap??70,72);return '';}
/**
 * Ascensos y descensos con filial: un filial nunca puede jugar en la misma división que su primer equipo
 * (ni por encima). Si le toca subir y no puede, sube el siguiente de la tabla.
 */
export function fixFilialMoves(tabs,moves){
 const b=filial();if(!b)return moves;const parentNew=(moves.find(m=>m[0]===S.user)||[S.user,T(S.user).lg])[1],pLv=LG(parentNew).lv;
 const bL=LG(b.lg),idx=S.leagues.indexOf(bL),tb=tabs[idx],up=moves.findIndex(m=>m[0]===b.id&&LG(m[1]).lv<bL.lv);
 if(up>=0&&LG(moves[up][1]).lv<=pLv){const next=tb.slice(3).find(r=>!moves.some(m=>m[0]===r.id));moves[up]=[next.id,moves[up][1]];}
 // si el primer equipo baja a la división del filial, el filial baja una más (o se disuelve si no hay más abajo)
 const bNew=(moves.find(m=>m[0]===b.id)||[b.id,b.lg])[1];
 if(LG(bNew).lv<=pLv){const C=LG(bNew).c,below=findLg(C,pLv+1);
  if(!below){b.parent=null;b.name=townName(COUNTRIES[C].tw)+' CF';news(`Tu filial ${b.name} se independiza: con el primer equipo en la última división no puede competir en la misma categoría.`,'bad',{cat:'dir'});}
  else{const swap=tabs[S.leagues.indexOf(below)].find(r=>!moves.some(m=>m[0]===r.id)&&r.id!==S.user);moves=moves.filter(m=>m[0]!==b.id);moves.push([b.id,below.id]);if(swap)moves.push([swap.id,bNew]);}}
 return moves;
}
