/* El Banquillo · retos.ts — Retos que eliges tú (hasta 3 a la vez) y que dan medallas de bronce, plata u oro. */
// @ts-nocheck — usa el estado heredado S.
import {unlock} from './club';
import {clamp,money} from './core';
import {COUNTRIES} from './data';
import {LG,PL,S,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {toast} from './views/common';

/** m: medalla (b bronce, p plata, o oro). goal: objetivo numérico para la barra de progreso. */
export const RETOS={
 racha:{n:'Racha de hierro',d:'Encadena 10 partidos de liga sin perder.',m:'b',goal:10},
 muro:{n:'El muro',d:'Deja la portería a cero en 12 partidos de liga de una misma temporada.',m:'p',goal:12},
 gol:{n:'Máquina de goles',d:'Marca 75 goles de liga en una temporada.',m:'p',goal:75},
 cantera:{n:'La Masía',d:'Gana un partido oficial con 6 canteranos en el once.',m:'p',goal:6},
 joven:{n:'Divino tesoro',d:'Gana un partido oficial con un once de media de edad por debajo de 23 años.',m:'b',goal:1},
 lleno:{n:'Olla a presión',d:'Llena tu estadio en 8 partidos de casa seguidos.',m:'b',goal:8},
 austero:{n:'Sin gastar un euro',d:'Termina entre los 3 primeros de tu liga sin pagar ningún traspaso esa temporada.',m:'o',goal:1},
 local:{n:'De la tierra',d:'Cumple el objetivo con al menos 15 jugadores de tu país en la plantilla.',m:'p',goal:15},
 cohete:{n:'Cohete',d:'Sube 3 divisiones en 3 temporadas como máximo desde que aceptas el reto.',m:'o',goal:3},
 hucha:{n:'Hucha llena',d:'Llega a 10M de presupuesto para fichajes.',m:'b',goal:10},
 palabra:{n:'Palabra de míster',d:'Cumple 5 promesas a tus jugadores.',m:'b',goal:5},
 mundo:{n:'Gloria mundial',d:'Gana el Mundial, la Eurocopa o la Copa América como seleccionador.',m:'o',goal:1},
};
export const MEDAL={b:['Bronce','#b0743a'],p:['Plata','#9aa3ab'],o:['Oro','#d9a400']};
export const MAX_ACT=3;
const R=()=>S.retos||(S.retos={act:[],st:{},done:{}});

export function startReto(id){const X=R();if(!RETOS[id])return 'Ese reto no existe.';if(X.done[id])return 'Ya lo conseguiste.';if(X.act.includes(id))return '';if(X.act.length>=MAX_ACT)return `Solo puedes tener ${MAX_ACT} retos activos. Abandona uno primero.`;
 X.act.push(id);X.st[id]={p:0,s0:S.seasonN,lv0:LG(uLg()).lv,pr0:S.promKept||0};news(`Nuevo reto: ${RETOS[id].n}. ${RETOS[id].d}`,'',{cat:'dir',quiet:true});return '';}
export function dropReto(id){const X=R();X.act=X.act.filter(x=>x!==id);delete X.st[id];}
/** Progreso actual de un reto activo (0..goal). */
export const progress=id=>{const st=R().st[id];return st?Math.min(RETOS[id].goal,st.p||0):0;};
function setP(id,v){const X=R();if(!X.act.includes(id))return;X.st[id].p=Math.max(X.st[id].p||0,v);if(X.st[id].p>=RETOS[id].goal)complete(id);}
function resetP(id,v=0){const X=R();if(X.act.includes(id))X.st[id].p=v;}
function complete(id){const X=R(),r=RETOS[id];X.act=X.act.filter(x=>x!==id);delete X.st[id];X.done[id]=seasonLabel();
 const rep={b:1,p:2,o:4}[r.m];S.mgr.rep=clamp(S.mgr.rep+rep,0,100);
 news(`¡Reto conseguido: ${r.n}! Medalla de ${MEDAL[r.m][0].toLowerCase()} y +${rep} de reputación.`,'good',{cat:'dir',subj:`Medalla de ${MEDAL[r.m][0].toLowerCase()}: ${r.n}`});toast(`Medalla de ${MEDAL[r.m][0].toLowerCase()}: ${r.n}`);if(r.m==='o')unlock('oro');if(Object.keys(X.done).length>=5)unlock('medal5');}
const on=id=>R().act.includes(id);

/** Tras cada partido oficial tuyo. */
export function retosMatch(m){
 if(!m.us||m.ref.k==='fr'||!S.retos||!R().act.length)return;const o=m.us==='h'?'a':'h',my=m.score[m.us],op=m.score[o],won=my>op;
 const xi=(m.xi0?m.xi0[m.us]:m.lu[m.us]).filter(Boolean).map(PL).filter(Boolean);
 if(m.ref.k==='lg'){
  if(on('racha')){if(my<op)resetP('racha');else setP('racha',progress('racha')+1);}
  if(on('muro')&&op===0)setP('muro',progress('muro')+1);
  if(on('gol'))setP('gol',progress('gol')+my);
 }
 if(won&&on('cantera'))setP('cantera',xi.filter(p=>p.home).length);
 if(won&&on('joven')&&xi.length>=11&&xi.reduce((a,p)=>a+p.age,0)/xi.length<23)setP('joven',1);
}
/** Cada jornada (después de cobrar y de jugar). */
export function retosWeekly(home){
 if(!S.retos||!R().act.length)return;
 if(on('hucha'))setP('hucha',Math.floor(S.budget));
 if(on('lleno')&&home&&S.club){if(S.club.lastAtt>=S.club.cap)setP('lleno',progress('lleno')+1);else resetP('lleno');}
 if(on('palabra'))setP('palabra',(S.promKept||0)-(R().st.palabra.pr0||0));
 if(on('local')){const c=LG(uLg()).c;R().st.local.p=Math.min(14,squad(S.user).filter(p=>p.nat===c).length);}
}
/** Al acabar la temporada (antes de ascensos y descensos). */
export function retosSeason(sm){
 if(!S.retos)return;
 if(on('austero')&&sm.pos<=3&&!(S.buysSeason>0))setP('austero',1);
 if(on('local')&&sm.ok&&squad(S.user).filter(p=>p.nat===LG(uLg()).c).length>=15)setP('local',15);
 resetP('muro');resetP('gol');S.buysSeason=0;
}
/** Al empezar la nueva temporada (ya con la liga nueva). */
export function retosNewSeason(){
 if(!S.retos||!on('cohete'))return;const st=R().st.cohete,up=st.lv0-LG(uLg()).lv;
 if(up>=3){setP('cohete',3);return;}
 st.p=Math.max(0,up);if(S.seasonN-st.s0>=3){news('Reto fallido: Cohete. Se acabó el plazo de 3 temporadas. Puedes volver a intentarlo.','bad',{cat:'dir'});dropReto('cohete');}
}
/** Gana un torneo de selecciones como seleccionador. */
export const retosNT=()=>{if(S.retos&&on('mundo'))setP('mundo',1);};
export const medals=()=>{const d=R().done;return Object.keys(d).reduce((a,k)=>{a[RETOS[k].m]++;return a;},{b:0,p:0,o:0});};
