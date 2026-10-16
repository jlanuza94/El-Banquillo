/* El Banquillo · calendar.ts — Calendario día a día al estilo FM: cada evento tiene su fecha y «Continuar» avanza un día.
 *  · Semana 1: pretemporada (amistosos).
 *  · Liga en sábado; copa, competiciones continentales y Mundial de Clubes entre semana (miércoles y jueves). */
// @ts-nocheck — usa el estado heredado S.
import {fitAdd,fitStart,preDayPassed} from './presched';
import {LG,S,uLg} from './state';
import {COUNTRIES} from './data';
import {nextMatch} from './competitions';

const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DAYS_L=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
export const MONTHS_L=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const FIRST_LG=47; // pretemporada de unas 6 semanas y media: la primera jornada de liga es el sábado de la séptima semana
const PRE_EXTRA=FIRST_LG-12; // días que se adelanta el inicio para que la primera jornada caiga en su fecha real

/** Día (desde el inicio de la temporada) de cada evento del calendario de competiciones. */
/** Calendario real de cada país: inicio de temporada [mes, día], parón [tras la jornada, semanas] con su nombre,
 *  ventanas de fichajes [cierre del primero, apertura y cierre del segundo] y torneos cortos (Apertura y Clausura). */
export const CALS={
 ESP:{st:[7,10],brk:[17,1,'Parón de Navidad'],w:[2,19,22],wn:['de verano','de invierno']},
 ING:{st:[7,3],brk:null,w:[2,19,22],wn:['de verano','de invierno']},
 ITA:{st:[7,10],brk:[18,1,'Parón de Navidad'],w:[2,19,22],wn:['de verano','de invierno']},
 ALE:{st:[7,17],brk:[16,3,'Parón invernal'],w:[2,17,20],wn:['de verano','de invierno']},
 FRA:{st:[7,3],brk:[17,2,'Parón de invierno'],w:[3,19,22],wn:['de verano','de invierno']},
 PRT:{st:[7,3],brk:[16,1,'Parón de Navidad'],w:[3,19,22],wn:['de verano','de invierno']},
 NED:{st:[7,3],brk:[17,3,'Parón invernal'],w:[3,18,21],wn:['de verano','de invierno']},
 BEL:{st:[6,20],brk:[20,2,'Parón de invierno'],w:[4,21,24],wn:['de verano','de invierno']},
 TUR:{st:[7,3],brk:[17,3,'Parón invernal'],w:[3,19,22],wn:['de verano','de invierno']},
 SCO:{st:[6,27],brk:[21,3,'Parón invernal'],w:[4,21,24],wn:['de verano','de invierno']},
 BRA:{st:[3,5],brk:[10,2,'Parón de mitad de año'],w:[2,12,15],wn:['de pretemporada','de mitad de año']},
 ARG:{st:[0,20],brk:[16,3,'Receso de invierno'],w:[3,17,20],wn:['de verano','de invierno']},
 MEX:{st:[6,10],brk:[17,4,'Parón entre torneos'],w:[3,18,21],wn:['de verano','de invierno'],tor:1},
 USA:{st:[1,20],brk:[20,1,'Parón del All-Star'],w:[6,20,24],wn:['de pretemporada','de verano']},
 JPN:{st:[1,10],brk:[18,2,'Parón de verano'],w:[4,18,21],wn:['de invierno','de verano']},
 SWE:{st:[2,30],brk:[16,2,'Parón de verano'],w:[4,14,17],wn:['de invierno','de verano']},
 NOR:{st:[2,30],brk:[16,2,'Parón de verano'],w:[4,14,17],wn:['de invierno','de verano']},
 KOR:{st:[1,25],brk:[18,2,'Parón de verano'],w:[4,18,21],wn:['de invierno','de verano']},
 KSA:{st:[7,20],brk:[16,3,'Parón de invierno'],w:[3,17,20],wn:['de verano','de invierno']},
 URU:{st:[1,1],brk:[15,3,'Parón entre torneos'],w:[3,17,20],wn:['de verano','de invierno'],tor:1},
 CHI:{st:[1,10],brk:[16,3,'Parón de mitad de año'],w:[3,17,20],wn:['de verano','de invierno']},
 ECU:{st:[1,20],brk:[16,3,'Parón entre etapas'],w:[3,17,20],wn:['de verano','de invierno'],tor:1},
 AUT:{st:[6,24],brk:[16,6,'Parón invernal'],w:[3,17,20],wn:['de verano','de invierno']},
 SUI:{st:[6,20],brk:[17,5,'Parón invernal'],w:[3,18,21],wn:['de verano','de invierno']},
 COL:{st:[0,20],brk:[18,3,'Parón entre torneos'],w:[3,19,22],wn:['de pretemporada','de mitad de año'],tor:1},
};
const DEF_CAL=CALS.ESP;
/** País cuyo calendario sigue tu temporada (el de tu liga al empezarla). */
export const calCode=()=>{const c=S&&S.calC!=null?S.calC:(S&&S.user!=null&&S.leagues?LG(uLg()).c:0);return (COUNTRIES[c]||COUNTRIES[0]).code;};
export const cal=()=>CALS[calCode()]||DEF_CAL;
/** Día de una jornada de liga, contando el parón. */
export function lgDay(r){const C=cal();return FIRST_LG+7*r+(C.brk&&r>C.brk[0]?C.brk[1]*7:0);}
/** Ventanas de fichajes en jornadas: [cierre de la primera, apertura y cierre de la segunda]. */
export const winRounds=()=>cal().w;
/** Torneo corto (Apertura o Clausura) en las ligas que lo usan. */
export const torneo=r=>cal().tor?(r<19?'Apertura':'Clausura'):'';
export function eventDays(){
 if(S._evd&&S._evd.n===S.cal.length&&S._evd.s===S.seasonN&&S._evd.c===calCode())return S._evd.d;
 const d=[];let lastLg=-1,extra=0;
 S.cal.forEach(ev=>{if(ev.t==='lg'){lastLg=ev.r;extra=0;d.push(lgDay(ev.r));}else{d.push(lastLg<0?FIRST_LG-3+extra:lgDay(lastLg)+4+extra);extra++;}});
 Object.defineProperty(S,'_evd',{value:{n:S.cal.length,s:S.seasonN,c:calCode(),d},enumerable:false,configurable:true,writable:true});
 return d;
}
export const dayOfEvent=i=>{const d=eventDays();return i<d.length?d[i]:(d.length?d[d.length-1]+3:0);};
/** Lunes de inicio de temporada (primera semana de agosto). */
export function seasonStart(n=S.seasonN){const C=cal(),y=(C.st[0]>=6?2025:2026)+n,dt=new Date(Date.UTC(y,C.st[0],C.st[1]));while(dt.getUTCDay()!==1)dt.setUTCDate(dt.getUTCDate()+1);dt.setUTCDate(dt.getUTCDate()-PRE_EXTRA);return dt;}
export function dateOf(day){const dt=seasonStart();dt.setUTCDate(dt.getUTCDate()+day);return dt;}
export const dateTxt=(day,long)=>{const dt=dateOf(day),w=(dt.getUTCDay()+6)%7;return long?`${DAYS_L[w]} ${dt.getUTCDate()} de ${MONTHS_L[dt.getUTCMonth()].toLowerCase()} de ${dt.getUTCFullYear()}`:`${DAYS[w]} ${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;};
export const weekday=day=>(dateOf(day).getUTCDay()+6)%7;
/** El día actual nunca va por detrás del último partido jugado (por ejemplo, tras simular varias jornadas). */
export function syncDay(){if(S.day==null)S.day=S.ci>0?dayOfEvent(S.ci-1):0;const min=S.ci>0?dayOfEvent(S.ci-1):0;if(S.day<min)S.day=min;return S.day;}
/** ¿Hoy toca jugar? */
export function isMatchDay(){syncDay();const nm=nextMatch();return !!nm&&S.day>=dayOfEvent(S.ci);}
/** Qué hay hoy en la agenda (para la cabecera). */
export function agenda(){
 syncDay();const nm=nextMatch(),ev=dayOfEvent(S.ci),wd=weekday(S.day);
 if(nm&&S.day>=ev)return 'Día de partido';
 if(nm&&ev-S.day===1)return 'Víspera de partido: descanso activo';
 if(S.day<FIRST_LG&&S.pre&&S.pre.left>0)return 'Pretemporada';
 {const C=cal();if(C.brk&&S.day>lgDay(C.brk[0])&&S.day<lgDay(C.brk[0]+1)-3)return C.brk[2];}
 if(wd===6)return 'Día libre';
 return wd===0||wd===3?'Entrenamiento y análisis':'Entrenamiento';
}
/** Continuar: avanza un día; el día del partido devuelve 'match' para que la pantalla ofrezca jugarlo. */
export function continueDay(){
 syncDay();
 if(isMatchDay())return 'match';
 S.day++;if(S.pre&&S.pre.sch){preDayPassed();if(S.day<FIRST_LG)fitAdd(.6);else fitStart();}
 return isMatchDay()?'match':'day';
}
/** Días que faltan para el próximo partido. */
export const daysToMatch=()=>{syncDay();return nextMatch()?Math.max(0,dayOfEvent(S.ci)-S.day):null;};
