/* El Banquillo · calendar.ts — Calendario día a día al estilo FM: cada evento tiene su fecha y «Continuar» avanza un día.
 *  · Semana 1: pretemporada (amistosos).
 *  · Liga en sábado; copa, competiciones continentales y Mundial de Clubes entre semana (miércoles y jueves). */
// @ts-nocheck — usa el estado heredado S.
import {S} from './state';
import {nextMatch} from './competitions';

const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DAYS_L=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
export const MONTHS_L=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const FIRST_LG=12; // la primera jornada de liga es el sábado de la segunda semana

/** Día (desde el inicio de la temporada) de cada evento del calendario de competiciones. */
export function eventDays(){
 if(S._evd&&S._evd.n===S.cal.length&&S._evd.s===S.seasonN)return S._evd.d;
 const d=[];let lastLg=-1,extra=0;
 S.cal.forEach(ev=>{if(ev.t==='lg'){lastLg=ev.r;extra=0;d.push(FIRST_LG+7*ev.r);}else{d.push(lastLg<0?FIRST_LG-3+extra:FIRST_LG+7*lastLg+4+extra);extra++;}});
 Object.defineProperty(S,'_evd',{value:{n:S.cal.length,s:S.seasonN,d},enumerable:false,configurable:true,writable:true});
 return d;
}
export const dayOfEvent=i=>{const d=eventDays();return i<d.length?d[i]:(d.length?d[d.length-1]+3:0);};
/** Lunes de inicio de temporada (primera semana de agosto). */
export function seasonStart(n=S.seasonN){const y=2025+n,dt=new Date(Date.UTC(y,7,3));while(dt.getUTCDay()!==1)dt.setUTCDate(dt.getUTCDate()+1);return dt;}
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
 if(wd===6)return 'Día libre';
 return wd===0||wd===3?'Entrenamiento y análisis':'Entrenamiento';
}
/** Continuar: avanza un día; el día del partido devuelve 'match' para que la pantalla ofrezca jugarlo. */
export function continueDay(){
 syncDay();
 if(isMatchDay())return 'match';
 S.day++;
 return isMatchDay()?'match':'day';
}
/** Días que faltan para el próximo partido. */
export const daysToMatch=()=>{syncDay();return nextMatch()?Math.max(0,dayOfEvent(S.ci)-S.day):null;};
