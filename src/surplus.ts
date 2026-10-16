/* El Banquillo · surplus.ts — Equilibrio del dinero: si acumulas mucho presupuesto sin invertir, la directiva
 * se queda una parte (la mitad, en mejorar el club) para que no se dispare; y lo que gastas en fichajes se apunta. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,r3} from './core';
import {S,T,lunit,uLg} from './state';
import {news,startBudget} from './world';
import {FAC_N} from './club';

/** Apunta lo que gastas en traspasos esta temporada. */
export function noteSpend(v){if(!(v>0))return;if(!S.spent||S.spent.s!==S.seasonN)S.spent={s:S.seasonN,v:0};S.spent.v=r3(S.spent.v+v);}
export const spentNow=()=>S.spent&&S.spent.s===S.seasonN?S.spent.v:0;
/** Tope que la directiva considera razonable para la caja de fichajes. */
export const surplusCap=()=>Math.max(startBudget(T(S.user))*2.5,lunit(uLg())*30);
/** Fin de temporada: si la caja pasa del tope y casi no has gastado, la directiva reinvierte parte del exceso. */
export function boardSurplus(){
 if(S.user==null)return null;const cap=surplusCap(),ex=S.budget-cap;
 if(!(ex>0)||spentNow()>S.budget*.15)return null;
 const take=r3(ex*.4),C=S.club;S.budget=r3(S.budget-take);let what='';
 if(C&&C.fac){const k=['ent','can','med'].filter(x=>(C.fac[x]||1)<5).sort((a,b)=>(C.fac[a]||1)-(C.fac[b]||1))[0];if(k){C.fac[k]=(C.fac[k]||1)+1;what=` Con la mitad mejora ${FAC_N[k].toLowerCase()} (nivel ${C.fac[k]}).`;}}
 if(C)C.mood=clamp(C.mood+1,0,100);
 news(`La directiva ve demasiado dinero parado en la caja de fichajes (${money(S.budget+take)}) y apenas lo has usado. Se queda ${money(take)} para el club.${what} Tu presupuesto queda en ${money(S.budget)}. Invertir en la plantilla evita que vuelva a pasar.`,'',{cat:'dir',subj:'💼 La directiva reinvierte tu superávit'});
 return take;
}
