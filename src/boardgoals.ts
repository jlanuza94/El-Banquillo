/* El Banquillo · boardgoals.ts — Objetivos concretos de la directiva para cada temporada (además del puesto en liga):
 * minutos para los jóvenes, sueldos, partidos ganados en casa, goles, porterías a cero, ventas o llenar el estadio.
 * Cumplirlos da confianza, prestigio y algo de presupuesto; fallarlos resta un poco de confianza. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r3,shuffle} from './core';
import {LG,S,T,lunit,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {table} from './tactics';
import {wageBill} from './clubplus';

const log=()=>(S.mlog||[]).filter(r=>r.sn===S.seasonN&&!/amistoso/i.test(r.label||''));
const me=r=>r.h===S.user?[r.hg,r.ag,1]:[r.ag,r.hg,0];
const lgRow=()=>table(uLg()).find(r=>r.id===S.user)||{gf:0};
/** Tipos de objetivo: texto, cómo se mide (valor actual), y si es «al menos» (true) o «como mucho» (false). */
export const BG={
 min21:{g:'can',n:t=>`Dar ${t} minutos a menores de 21 años`,v:()=>squad(S.user).filter(p=>p.age<=21&&!p.loan).reduce((a,p)=>a+(p.st?p.st.mi||0:0),0),up:1},
 wage:{g:'fin',n:t=>`Acabar con los sueldos por debajo de ${money(t)}/sem`,v:()=>wageBill(),up:0},
 sell:{g:'fin',n:t=>`Ingresar ${money(t)} en ventas`,v:()=>r3((S.tlog||[]).filter(x=>x.from===S.user&&x.season===seasonLabel()).reduce((a,x)=>a+(x.fee||0),0)),up:1},
 home:{g:'dep',n:t=>`Ganar ${t} partidos en casa`,v:()=>log().filter(r=>r.h===S.user&&r.hg>r.ag).length,up:1},
 gf:{g:'dep',n:t=>`Marcar ${t} goles en liga`,v:()=>lgRow().gf||0,up:1},
 cs:{g:'dep',n:t=>`Dejar la portería a cero en ${t} partidos`,v:()=>log().filter(r=>me(r)[1]===0).length,up:1},
 fill:{g:'fin',n:t=>`Llenar el estadio en ${t} partidos`,v:()=>(S.fullHomes||0)-((S.bgoals&&S.bgoals.fh0)||0),up:1},
};
/** Al empezar la temporada: tres objetivos (uno de cantera, uno deportivo y uno económico). */
export function newBoardGoals(){
 if(S.user==null)return;const lv=LG(uLg()).lv,n=(table(uLg()).length||20),G=[];
 G.push(['min21',[2200,1800,1500,1200,900][lv]||1200]);
 const dep=pick(['home','gf','cs']);G.push([dep,dep==='home'?Math.round(n*.3):dep==='gf'?Math.round(n*1.4):Math.round(n*.25)]);
 const fin=pick(['wage','sell','fill']);G.push([fin,fin==='wage'?r3(wageBill()*1.08):fin==='sell'?r3(lunit(uLg())*3):5]);
 S.bgoals={s:S.seasonN,u:S.user,fh0:S.fullHomes||0,L:G.map(([k,t])=>({k,t,ok:null}))};
 news(`La directiva te marca tres objetivos para esta temporada, además del de la liga: ${S.bgoals.L.map(x=>BG[x.k].n(x.t).toLowerCase()).join('; ')}. Cumplirlos te dará confianza, prestigio y algo de presupuesto.`,'',{cat:'dir',subj:'🎯 Objetivos de la directiva'});
}
export const goalProg=x=>{const B=BG[x.k],v=B.v();return {v,pct:B.up?clamp(v/x.t,0,1):(v<=x.t?1:clamp(x.t/v,0,1)),done:B.up?v>=x.t:v<=x.t};};
/** Cada semana: avisa cuando cumples uno «al menos». */
export function goalsWeekly(){const G=S.bgoals;if(!G||G.s!==S.seasonN||G.u!==S.user)return;G.L.forEach(x=>{if(x.ok==null&&BG[x.k].up&&goalProg(x).done){x.ok=true;reward(x);}});}
function reward(x){const u=lunit(uLg());S.mgr.conf=clamp(S.mgr.conf+4,0,100);S.mgr.rep=clamp(S.mgr.rep+1,0,100);S.budget=r3(S.budget+u*2);
 news(`Objetivo de la directiva cumplido: ${BG[x.k].n(x.t).toLowerCase()}. Te premian con ${money(u*2)} para fichajes y más confianza.`,'good',{cat:'dir',subj:'🎯 Objetivo cumplido'});}
/** Final de temporada: se cierran los que faltan. */
export function goalsSeasonEnd(){const G=S.bgoals;if(!G||G.s!==S.seasonN||G.u!==S.user)return;G.L.forEach(x=>{if(x.ok!=null)return;const d=goalProg(x).done;x.ok=d;if(d)reward(x);else{S.mgr.conf=clamp(S.mgr.conf-2,0,100);}});
 const ok=G.L.filter(x=>x.ok).length;news(`Balance de los objetivos de la directiva: ${ok} de ${G.L.length} cumplidos.`,ok>=2?'good':'',{cat:'dir',subj:`🎯 Objetivos: ${ok}/${G.L.length}`});}
export function goalsHTML(esc){
 const G=S.bgoals;if(!G||G.s!==S.seasonN||G.u!==S.user)return '';
 return `<section class="panel"><div class="panel-h"><h2>🎯 Objetivos de la directiva</h2><span class="eyebrow">${G.L.filter(x=>x.ok).length}/${G.L.length} cumplidos</span></div>
 ${G.L.map(x=>{const P=goalProg(x),B=BG[x.k];return `<div class="bgl"><div class="bgt"><span>${esc(B.n(x.t))}</span><b class="${x.ok===true?'pos':x.ok===false?'neg':''}">${x.ok===true?'✔ Cumplido':x.ok===false?'✖ Fallado':B.k==='wage'||x.k==='wage'?money(P.v):x.k==='sell'?money(P.v):Math.round(P.v)+' / '+x.t}</b></div><span class="bgb"><i class="${P.done?'ok':''}" style="width:${Math.round(P.pct*100)}%"></i></span></div>`;}).join('')}</section>`;
}
