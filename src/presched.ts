/* El Banquillo · presched.ts — Pretemporada con calendario (como en FM): unas 6 semanas con amistosos programados
 * en fechas fijas y el torneo de verano (semifinal y final) en el calendario; «Continuar» se para en cada partido.
 * También la puesta a punto: cuanto más y mejor preparas la temporada, mejor llega físicamente tu equipo. */
// @ts-nocheck — usa el estado heredado S.
import {ptNext} from './preseason';
import {clamp} from './core';
import {S,T,squad} from './state';
import {FIRST_LG} from './calendar';
import {news} from './world';

/** Días de los amistosos y del torneo (contando desde el primer día de pretemporada). */
export const FR_DAYS=[5,11,17,32,40],PT_DAYS=[24,26];
/** Calendario de pretemporada: se crea al empezar con rivales variados (de tu nivel, más flojos y algún grande). */
export function preSchedule(opts){
 if(!S.pre||S.pre.sch)return S.pre&&S.pre.sch;const o=opts()||[];
 const order=[o[0],o[2],o[1],o[3],o[0]].map((x,i)=>x??o[i%Math.max(1,o.length)]);
 S.pre.sch=FR_DAYS.map((d,i)=>({d,t:'fr',opp:order[i],st:0}));S.pre.left=S.pre.sch.length;return S.pre.sch;
}
/** Al apuntarte al torneo, sus partidos entran en el calendario. */
export function preAddTour(){if(!S.pre||!S.pre.sch)return;S.pre.sch=S.pre.sch.filter(x=>x.t!=='pt');S.pre.sch.push({d:PT_DAYS[0],t:'pt',ph:'Semifinal',st:0},{d:PT_DAYS[1],t:'pt',ph:'Final',st:0});S.pre.sch.sort((a,b)=>a.d-b.d);}
/** Partidos pendientes de la pretemporada (los de días ya pasados que no jugaste se dan por suspendidos). */
export const preList=()=>((S.pre&&S.pre.sch)||[]).filter(x=>x.d<FIRST_LG);
export const preToday=()=>preList().find(x=>!x.st&&x.d===(S.day??0))||null;
export const preNextEv=()=>preList().find(x=>!x.st&&x.d>=(S.day??0))||null;
/** Pasa un día: los partidos que se quedaron sin jugar se suspenden. */
export function preDayPassed(){(S.pre&&S.pre.sch||[]).forEach(x=>{if(!x.st&&x.d<(S.day??0)){x.st=2;if(x.t==='fr'&&S.pre.left>0)S.pre.left--;}});}
export function preMark(t){const x=preToday()||preList().find(y=>!y.st&&y.t===t);if(x)x.st=1;}
export function preSetOpp(i,tid){const x=preList()[i];if(x&&!x.st&&x.t==='fr')x.opp=tid;}
export function preCancel(i){const x=preList()[i];if(x&&!x.st){x.st=2;if(x.t==='fr'&&S.pre.left>0)S.pre.left--;}}
/** Rival del partido de hoy (para el amistoso) o del torneo. */
export const preOppOf=(x,ptNext)=>x.t==='fr'?x.opp:(ptNext()&&ptNext()[0]);
/* ---------- Puesta a punto ---------- */
/** 0-100: sube con cada amistoso y partido interno, y un poco con cada día de trabajo. */
export const preFit=()=>Math.round(clamp((S.pre&&S.pre.fit)||0,0,100));
export function fitAdd(v){if(!S.pre)return;S.pre.fit=clamp((S.pre.fit||0)+v,0,100);}
/** Al llegar la primera jornada: cómo llega el equipo y su efecto las 4 primeras jornadas. */
export function fitStart(){
 if(!S.pre||S.pre.fitDone)return;S.pre.fitDone=1;const f=preFit();
 S.fitW={until:4,m:f>=85?1.015:f>=65?1:f>=45?.98:.95,inj:f>=65?1:f>=45?1.3:1.7,f};
 news(`Puesta a punto: el equipo llega al ${f}% a la primera jornada. ${f>=85?'Están como un tiro: se notará en las primeras semanas.':f>=65?'Buen trabajo de pretemporada.':f>=45?'Les falta un punto de forma: las primeras jornadas costarán algo más y hay más riesgo de lesiones.':'Han hecho muy poca pretemporada: van a sufrir físicamente las primeras jornadas y se lesionarán más.'}`,f>=65?'good':'bad',{cat:'sta',subj:`💪 Puesta a punto: ${f}%`});
}
export const fitMult=()=>S.fitW&&S.week<S.fitW.until?S.fitW.m:1;
export const fitInj=()=>S.fitW&&S.week<S.fitW.until?S.fitW.inj:1;
/** Partido de hoy que de verdad se puede jugar (el del torneo, solo si sigues vivo). */
export function preTodayOk(){const x=preToday();if(!x)return null;if(x.t==='pt'&&!ptNext()){x.st=2;return null;}return x;}
