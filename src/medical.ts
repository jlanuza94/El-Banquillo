/* El Banquillo · medical.ts — Lesiones con más detalle: riesgo visible antes de alinear, planes de recuperación y recaídas. */
// @ts-nocheck — usa el estado heredado S.
import {S} from './state';

/** Riesgo de lesión de 0 a 100 y sus motivos. */
export function injRisk(p){
 const why=[];let r=8;
 if(p.prone){r+=p.prone*30;why.push('propenso a lesionarse');}
 const e=p.energy??100;if(e<55){r+=28;why.push('muy cansado');}else if(e<70){r+=12;why.push('algo cansado');}
 if(p.recov>0){r+=26;why.push('recién recuperado (riesgo de recaída)');}
 if(p.age>=32){r+=10;why.push('veterano');}else if(p.age>=30)r+=5;
 if(p.team===S.user&&S.train&&S.train.int==='i'){r+=8;why.push('entrenamiento intenso');}
 r=Math.min(100,Math.round(r));return{r,lv:r>=45?'alto':r>=25?'medio':'bajo',why};
}
/** Peso en el sorteo de lesiones del partido (más riesgo, más papeletas). */
export const injWeight=(p,en)=>1+(p.prone||0)*1.5+(en<55?1:en<70?.35:0)+(p.recov>0?1.5:0)+(p.age>=32?.35:0);
/** Etiqueta para la plantilla. */
export function riskTag(p){if(p.inj)return '';const k=injRisk(p);return k.lv==='alto'?`<span class="tag bad" title="Riesgo de lesión alto: ${k.why.join(', ')}">Riesgo alto</span>`:'';}

export const PLANS={c:{n:'Conservador',d:'Una jornada más de baja, pero vuelve al 100% y sin riesgo de recaída.'},n:{n:'Normal',d:'Lo que dicen los médicos. Tras volver, 3 jornadas con algo de riesgo de recaída.'},a:{n:'Acelerado',d:'Vuelve un 35% antes, pero cansado y con 6 jornadas de alto riesgo de recaída.'}};
/** Elige el plan de recuperación de un lesionado (una vez por lesión). */
export function setPlan(p,k){
 if(!p||!p.inj||p.rplan||!PLANS[k])return 'Ya no se puede cambiar el plan.';p.rplan=k;
 if(k==='c')p.inj+=Math.max(1,Math.ceil(p.inj*.25));else if(k==='a')p.inj=Math.max(1,Math.round(p.inj*.65));
 return '';
}
/** Al volver de una lesión: el plan decide la energía y los días de riesgo. */
export function onRecovered(p){const k=p.rplan||'n';p.recov=k==='c'?0:k==='a'?6:3;if(k==='a')p.energy=Math.min(p.energy??100,75);else if(k==='c')p.energy=100;p.rplan=null;}
/** Una lesión sobre otra reciente dura más. */
export const relapseMult=p=>p.recov>0?1.5:1;
