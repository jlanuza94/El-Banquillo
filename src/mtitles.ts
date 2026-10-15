/* El Banquillo · mtitles.ts — Títulos de reputación del entrenador (como en FM Mobile): uno por categoría.
 * Al empezar tienes uno de cada; los demás se desbloquean jugando. Cada título tiene un efecto pequeño. */
// @ts-nocheck — usa el estado heredado S.
import {S} from './state';
import {news} from './world';

export const TCATS=[['peo','Gestión de grupo'],['spe','Especialidad'],['squ','Plantilla'],['tac','Táctica']];
/** [cat, icono, nombre, descripción, efecto, requisito: [contador, objetivo, texto] o null si viene de serie] */
export const TITLES={
 sec:['peo','📢','Secador','Tus broncas son legendarias: en el vestuario se te respeta y se te teme.','Las charlas «Exigir» y «Echar la bronca» funcionan mejor y salen mal menos veces.',null],
 pad:['peo','🤝','Padre del vestuario','Los jugadores saben que tu puerta siempre está abierta.','El ánimo de la plantilla sube un poco cada semana.',['games',60,'Dirige 60 partidos oficiales']],
 est:['peo','⭐','Hacedor de estrellas','Los jóvenes crecen a tu lado.','Los jugadores de 21 años o menos progresan un 10% más rápido.',['yg',150,'Alinea 150 veces a jugadores de 21 años o menos']],
 roc:['peo','🪨','Inquebrantable','Tus equipos nunca se rinden.','Cuando vas perdiendo, tu equipo crea un 4% más.',['cb',3,'Gana 3 partidos en los que ibas perdiendo']],
 tod:['spe','⚖️','Todoterreno','Sabes sacar partido de cualquier plantilla.','+1% de rendimiento en partidos oficiales.',null],
 mur:['spe','🧱','Muralla','Tus equipos son un hueso duro de roer.','El rival crea un 2% menos.',['csT',25,'Deja la portería a cero en 25 partidos oficiales']],
 gol:['spe','⚽','Ataque total','Tus equipos juegan para marcar.','Tu equipo crea un 2% más.',['gf',150,'Marca 150 goles en partidos oficiales']],
 cop:['spe','🏆','Copero','Las noches de copa son lo tuyo.','+3% de rendimiento en copas y torneos continentales.',['cupw',10,'Gana 10 partidos de copa o continentales']],
 neg:['squ','💼','Negociador','Sabes regatear en los despachos.','Los fichajes te cuestan un 3% menos.',null],
 ojo:['squ','🔎','Cazatalentos','Tienes buen ojo para los fichajes.','Los fichajes llegan más contentos y se adaptan antes.',['sign',10,'Ficha a 10 jugadores']],
 fie:['squ','🏠','Hombre de club','La directiva sabe que construyes a largo plazo.','La confianza de la directiva baja un 30% menos tras malos resultados.',['seas',3,'Completa 3 temporadas en el mismo club']],
 cnt:['squ','🌱','Apuesta por la cantera','Confías en la casa.','Los canteranos ganan ánimo cuando juegan y crecen un 5% más.',['ydeb',5,'Haz debutar a 5 canteranos en partido oficial']],
 piz:['tac','📋','Pizarrista','Tu equipo aprende rápido lo que le pides.','Las instrucciones nuevas se dominan antes.',null],
 cnt2:['tac','⚡','Rey del contragolpe','Nadie castiga los espacios como tus equipos.','Con estilo contragolpe, tu equipo crea un 3% más.',['wCon',20,'Gana 20 partidos con estilo contragolpe']],
 pos:['tac','🎯','Arquitecto de la posesión','Tus equipos tienen el balón y no lo sueltan.','Con estilo posesión, tu equipo crea un 3% más y tiene más el balón.',['wPos',20,'Gana 20 partidos con estilo posesión']],
 pre:['tac','🐺','Presión total','Tus equipos asfixian al rival.','Con presión alta, tus jugadores se cansan menos.',['wPre',20,'Gana 20 partidos con presión alta']]};
const C=()=>(S.mgr&&(S.mgr.tc||(S.mgr.tc={games:S.mgr.games||0})))||{};
export const tCount=k=>C()[k]||0;
export function tInc(k,n=1){if(!S.mgr)return;const c=C();c[k]=(c[k]||0)+n;checkTitles();}
export const tUnlocked=k=>{const T=TITLES[k];if(!T)return false;if(!T[5])return true;return tCount(T[5][0])>=T[5][1];};
/** Títulos elegidos (uno por categoría). Al principio, los que vienen de serie. */
export function myTitles(){const M=S.mgr;if(!M)return {};if(!M.titles)M.titles={peo:'sec',spe:'tod',squ:'neg',tac:'piz'};return M.titles;}
export const hasTitle=k=>!!S.mgr&&Object.values(myTitles()).includes(k);
export function setTitle(k){const T=TITLES[k];if(!T||!tUnlocked(k))return;myTitles()[T[0]]=k;}
/** Aviso la primera vez que se desbloquea un título. */
export function checkTitles(){const M=S.mgr;if(!M)return;M.tnew=M.tnew||{};Object.entries(TITLES).forEach(([k,T])=>{if(T[5]&&!M.tnew[k]&&tUnlocked(k)){M.tnew[k]=1;news(`Nuevo título de entrenador disponible: ${T[1]} ${T[2]}. ${T[4]} Elígelo en Mi carrera › Perfil.`,'good',{cat:'dir',subj:`Título: ${T[2]}`});}});}
/** Tras cada partido oficial: suma a los contadores de los títulos. */
export function titlesMatch(m){
 if(!S.mgr||!m.us||m.ref.k==='fr')return;const us=m.us,o=us==='h'?'a':'h',d=m.score[us]-m.score[o],t=m.tac[us]||{},c=C();
 const add=(k,n=1)=>{c[k]=(c[k]||0)+n;};
 add('games');add('gf',m.score[us]);if(m.score[o]===0)add('csT');
 add('yg',(m.lu[us]||[]).filter(id=>{const p=S.players[id];return p&&p.age<=21;}).length);
 if(d>0){if(m.ref.k!=='lg')add('cupw');if(t.est==='con')add('wCon');if(t.est==='pos')add('wPos');if(t.pre==='alt')add('wPre');
  let a=0,b=0,worst=0;m.ev.forEach(e=>{if(e.t==='goal'){if(e.s===us)a++;else b++;worst=Math.min(worst,a-b);}});if(worst<0)add('cb');}
 (m.lu[us]||[]).forEach(id=>{const p=S.players[id];if(p&&p.home&&!p.debut){p.debut=1;add('ydeb');}});
 checkTitles();
}
/** Efecto en el partido para tu equipo (s): [ocasiones propias, ocasiones del rival, cansancio, posesión]. */
export function titleMods(m,s){
 if(!S.mgr||m.us!==s||m.ref.k==='fr')return null;const o=s==='h'?'a':'h',t=m.tac[s]||{};let own=1,opp=1,dr=1,ps=0;
 if(hasTitle('tod'))own*=1.01;if(hasTitle('mur'))opp*=.98;if(hasTitle('gol'))own*=1.02;if(hasTitle('cop')&&m.ref.k!=='lg')own*=1.03;
 if(hasTitle('roc')&&m.score&&m.score[s]<m.score[o])own*=1.04;
 if(hasTitle('cnt2')&&t.est==='con')own*=1.03;if(hasTitle('pos')&&t.est==='pos'){own*=1.03;ps+=.02;}if(hasTitle('pre')&&t.pre==='alt')dr*=.95;
 return {own,opp,dr,ps};
}
