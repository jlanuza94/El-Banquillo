/* El Banquillo · playoffs.ts — Formatos reales: copas con su nombre de verdad y liguilla o playoffs
 * al final de la temporada regular en México (Liguilla), Colombia (cuadrangulares, aquí liguilla a eliminación) y la MLS. */
// @ts-nocheck — usa el estado heredado S.
import {COUNTRIES} from './data';
import {LG,S,T,seasonLabel,uLg} from './state';
import {news} from './world';

export const CUP_REAL={ESP:'Copa del Rey',ING:'FA Cup',ITA:'Coppa Italia',ALE:'DFB-Pokal',FRA:'Coupe de France',PRT:'Taça de Portugal',BRA:'Copa do Brasil',ARG:'Copa Argentina',NED:'KNVB Beker',MEX:'Copa MX',BEL:'Copa de Bélgica',TUR:'Copa de Turquía',SCO:'Scottish Cup',USA:'US Open Cup',JPN:'Copa del Emperador',COL:'Copa Colombia'};
export const realCup=c=>CUP_REAL[(COUNTRIES[c]||{}).code]||null;
/** Países con fase final tras la liga regular, y cómo se llama. */
export const PO_N={MEX:'Liguilla',COL:'Liguilla',USA:'Playoffs de la MLS'};
export const poName=()=>S.po?S.po.n:PO_N[COUNTRIES[LG(uLg()).c].code]||null;
export const needsPO=()=>!!PO_N[COUNTRIES[LG(uLg()).c].code];
const RN=['Cuartos de final','Semifinales','Final'];
export const poRound=()=>S.po?RN[S.po.round]:'';
/** Arranca la liguilla con los 8 primeros de la tabla: 1-8, 2-7, 3-6 y 4-5 (en casa el mejor clasificado). */
export function setupPO(tb,mkTie){
 if(S.po&&S.po.season===S.seasonN)return;const top=tb.slice(0,8).map(r=>r.id),code=COUNTRIES[LG(uLg()).c].code;
 S.po={season:S.seasonN,lg:uLg(),n:PO_N[code],round:0,ties:[[0,7],[1,6],[2,5],[3,4]].map(([a,b])=>mkTie(top[a],top[b])),champ:null,done:false,inIt:top.includes(S.user)};
 news(`Empieza la ${S.po.n}: los 8 primeros se juegan el título a partido único.${S.po.inIt?' ¡Estás dentro!':' Esta vez no te has clasificado.'}`,S.po.inIt?'good':'',{cat:'com',subj:`${S.po.n}: ${S.po.inIt?'clasificado':'eliminado'}`});
}
export const userTie=()=>S.po?S.po.ties.findIndex(f=>!f.played&&(f.h===S.user||f.a===S.user)):-1;
/** Simula lo que falta de la ronda y, si está completa, prepara la siguiente o corona al campeón. */
export function poAdvance(quickMatch,applyResult,mkTie){
 const P=S.po;if(!P||P.done)return;
 P.ties.forEach((f,i)=>{if(!f.played){const m=quickMatch({k:'po',i});applyResult(m);}});
 const win=P.ties.map(f=>f.w||(f.hg>f.ag?f.h:f.a));
 if(P.round>=2){P.champ=win[0];P.done=true;const c=T(P.champ);
  if(P.champ===S.user){S.titles.push({season:seasonLabel(),name:`${P.n} · ${COUNTRIES[LG(P.lg).c].n}`});news(`¡CAMPEONES DE LA ${P.n.toUpperCase()}!`,'good',{cat:'com',subj:`¡Campeones de la ${P.n}!`});}
  else news(`${c.name} gana la ${P.n}.`,'',{cat:'com'});return;}
 P.round++;P.hist=(P.hist||[]).concat([P.ties]);P.ties=[];for(let i=0;i<win.length;i+=2)P.ties.push(mkTie(win[i],win[i+1]));
 if(!P.ties.some(f=>f.h===S.user||f.a===S.user)&&P.inIt&&!P.out){P.out=1;news(`Eliminado de la ${P.n}.`,'bad',{cat:'com'});}
}
