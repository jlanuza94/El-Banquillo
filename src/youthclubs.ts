/* El Banquillo · youthclubs.ts — Cantera y sub-19 de todos los clubes según su categoría:
 * Primera, Segunda y Tercera tienen cantera (15-17) y sub-19 (17-19); Cuarta y Quinta solo sub-19.
 * Al subir a Tercera o más arriba el club recupera la cantera; al bajar a Cuarta la pierde.
 * Las plantillas juveniles de los clubes de la IA se generan al vuelo (siempre iguales para ese club y temporada)
 * y no se guardan en la partida, para que no pese más. */
// @ts-nocheck — usa el estado heredado S.
import {COUNTRIES,LV_NAMES,NAMES} from './data';
import {LG,RT,S,T,squad} from './state';

export const CANTERA_MAX_LV=2;
/** ¿Tiene este club cantera? Solo los de Primera, Segunda y Tercera. */
export const hasCantera=tid=>tid!=null&&!!T(tid)&&LG(T(tid).lg).lv<=CANTERA_MAX_LV;
export const lvName=lv=>LV_NAMES[lv]||'';

/** PRNG propio (no toca el del juego) para que la generación sea determinista. */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const POSS=['POR','DEF','DEF','DEF','MED','MED','MED','DEL','DEL'];
const SEQ=['POR','POR','DEF','DEF','DEF','DEF','DEF','DEF','MED','MED','MED','MED','MED','MED','DEL','DEL','DEL','DEL'];

/** Nivel (media de los 14 mejores) del primer equipo, con un tope por categoría si aún no hay plantilla. */
function teamLevel(tid){const o=squad(tid).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,14);return o.length?o.reduce((a,b)=>a+b,0)/o.length:60-LG(T(tid).lg).lv*6;}

/** Juveniles de un club de la IA: {u19:[≥25], cant:[~14 o vacía]}. Deterministas por club y temporada. */
export function aiYouth(tid){
 const key=tid+':'+S.seasonN+':'+LG(T(tid).lg).lv;RT.yc=RT.yc||{};if(RT.yc[tid]&&RT.yc[tid].k===key)return RT.yc[tid];
 const t=T(tid),c=LG(t.lg).c,r=mulberry(hash(t.name+'|'+tid+'|'+S.seasonN)),pk=a=>a[Math.floor(r()*a.length)];
 const g=()=>{let u=0;for(let i=0;i<6;i++)u+=r();return u-3;};
 const lvl=teamLevel(tid),fac=hasCantera(tid)?1:.94;
 const mk=(age,i,base)=>{const nat=r()<.86?c:Math.floor(r()*COUNTRIES.length),[F,L]=NAMES[COUNTRIES[nat].lang];
  const pos=i<SEQ.length?SEQ[i]:pk(POSS),ovr=Math.round(Math.max(18,Math.min(80,base+(age-17)*3.2+g()*5.5)));
  const pot=Math.round(Math.max(ovr/10+.3,Math.min(9.6,ovr/10+1.4+(19-age)*.35+g()*.9))*10)/10;
  return{name:pk(F)+' '+pk(L),nat,pos,age,ovr,pot};};
 const nU=25+Math.floor(r()*4),u19=[];for(let i=0;i<nU;i++)u19.push(mk(17+Math.floor(r()*3),i,lvl*.74*fac));
 const cant=[];if(hasCantera(tid)){const nC=12+Math.floor(r()*4);for(let i=0;i<nC;i++)cant.push(mk(15+Math.floor(r()*3),i,lvl*.62));}
 const sort=a=>a.sort((x,y)=>SEQ.indexOf(x.pos)-SEQ.indexOf(y.pos)||y.ovr-x.ovr);
 return RT.yc[tid]={k:key,u19:sort(u19),cant:sort(cant)};
}
/** Fuerza de la sub-19 de un club (media de los 11 mejores), para la liga juvenil. */
export function aiYouthStr(tid){const o=aiYouth(tid).u19.map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11);return o.reduce((a,b)=>a+b,0)/Math.max(1,o.length);}

/** Dónde entra un juvenil nuevo de tu club: a la cantera si la tienes; si no (Cuarta/Quinta), a la sub-19 con 17 años.
 * Devuelve false si no hay sitio. */
export function addYouthToClub(y,capCant=14){
 if(hasCantera(S.user)){S.academy=S.academy||[];if(S.academy.length>=capCant)return false;S.academy.push(y);return true;}
 S.u19=S.u19||[];if(S.u19.length>=30)return false;if(y.age<17)y.age=17;y.u19=1;S.u19.push(y);return true;
}
/** Tras los ascensos y descensos: si tu club pierde la cantera, sus chavales pasan a la sub-19 (si caben) o se marchan;
 * si la recupera, te avisa. hadC es si la tenía antes de moverse de categoría. */
export function canteraAfterMoves(hadC,news){
 if(S.user==null)return;const now=hasCantera(S.user),lv=LG(T(S.user).lg).lv;
 if(hadC&&!now){S.u19=S.u19||[];const ac=S.academy||[],kept=[],gone=[];
  ac.slice().sort((a,b)=>b.pot-a.pot).forEach(p=>{if(S.u19.length<30){p.age=Math.max(p.age,16);p.u19=1;S.u19.push(p);kept.push(p.name);}else gone.push(p.name);});
  S.academy=[];
  news(`Al bajar a ${lvName(lv)} el club pierde la cantera: en Cuarta y Quinta solo hay sub-19.${kept.length?` Pasan a la sub-19: ${kept.join(', ')}.`:''}${gone.length?` Se marchan: ${gone.join(', ')}.`:''} Si vuelves a Tercera, la recuperas.`,'bad',{cat:'oje',subj:'El club pierde la cantera'});}
 else if(!hadC&&now){S.academy=S.academy||[];news(`¡Con el ascenso a ${lvName(lv)} el club recupera la cantera! Llegan los primeros chavales de 15 a 17 años.`,'good',{cat:'oje',subj:'El club recupera la cantera'});}
}
