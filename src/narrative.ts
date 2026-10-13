/* El Banquillo · narrative.ts — Prensa con memoria: tras cada partido tuyo, la prensa cuenta la historia
 * que hay detrás (rachas, derbis, remontadas, goleadores en racha, la ley del ex, canteranos...). Una por partido como mucho. */
// @ts-nocheck — usa el estado heredado S.
import {PL,S,T,seasonLabel} from './state';
import {news} from './world';
import {isDerby} from './rivals';

const ORD=['','primer','segundo','tercer','cuarto','quinto','sexto','séptimo','octavo','noveno','décimo'];
const ord=n=>ORD[n]||`${n}.º`;
/** Resultados de tus partidos oficiales, del más reciente al más antiguo: 'G', 'E' o 'P'. */
function results(filter){return (S.mlog||[]).filter(filter||(()=>true)).map(r=>{const home=r.h===S.user,my=home?r.hg:r.ag,op=home?r.ag:r.hg;return my>op?'G':my<op?'P':'E';});}
const streak=(R,f)=>{let n=0;for(const x of R){if(f(x))n++;else break;}return n;};

/** Historias candidatas para el partido que acaba de jugarse (m). Cada una con su clave para no repetirla. */
export function stories(m){
 const us=m.us,o=us==='h'?'a':'h',opp=m[o],my=m.score[us],op=m.score[o],L=[],me=T(S.user),rv=T(opp);
 const R=results(),w=streak(R,x=>x==='G'),nl=streak(R,x=>x!=='P'),l=streak(R,x=>x==='P'),nw=streak(R,x=>x!=='G');
 // remontada: llegó a ir perdiendo por 2 o más y no perdió
 {let a=0,b=0,worst=0;m.ev.filter(e=>e.t==='goal').forEach(e=>{if(e.s===us)a++;else b++;worst=Math.min(worst,a-b);});if(worst<=-2&&my>=op)L.push([9,'rem'+S.seasonN+'.'+S.week,`¡Remontada! ${me.name} iba perdiendo por ${-worst} goles y acaba ${my>op?'ganando':'empatando'} ${my}-${op} ante ${rv.name}. El vestuario lo celebra como un título.`,'good']);}
 // derbi
 if(isDerby(m.h,m.a)){const D=results(r=>r.h===opp||r.a===opp);const dw=streak(D,x=>x!=='G'),dg=streak(D,x=>x==='G');
  if(dw>=3)L.push([8,'dw'+dw,`${me.name} encadena ${dw} derbis seguidos sin ganar a ${rv.name}. La afición empieza a impacientarse.`,'bad']);
  else if(dg>=2)L.push([8,'dg'+dg+S.seasonN,`${dg} derbis seguidos ganados a ${rv.name}. La ciudad es de ${me.name}.`,'good']);}
 // rachas
 if(w>=4)L.push([7,'w'+w+'.'+S.seasonN,`${me.name} suma su ${ord(w)} victoria seguida. ¿Hasta dónde puede llegar?`,'good']);
 else if(nl>=8&&nl%2===0)L.push([6,'nl'+nl+'.'+S.seasonN,`${nl} partidos seguidos sin perder: ${me.name} es un muro.`,'good']);
 if(l>=3)L.push([7,'l'+l+'.'+S.seasonN,`${l} derrotas seguidas. La prensa habla de crisis en ${me.name}.`,'bad']);
 else if(nw>=5)L.push([6,'nw'+nw+'.'+S.seasonN,`${nw} partidos seguidos sin ganar. ${me.name} necesita una victoria ya.`,'bad']);
 // goleada
 if(my-op>=4)L.push([5,'gol'+S.seasonN+'.'+S.week,`Exhibición de ${me.name}: ${my}-${op} a ${rv.name}.`,'good']);
 // goleadores
 const G=m.ev.filter(e=>e.t==='goal'&&e.s===us&&e.pid);
 [...new Set(G.map(e=>e.pid))].forEach(id=>{const p=PL(id);if(!p||p.team!==S.user)return;const n=G.filter(e=>e.pid===id).length;
  if(n>=3)L.push([8,'hat'+id+S.seasonN+S.week,`¡Hat-trick de ${p.name}! ${n} goles ante ${rv.name}.`,'good']);
  // en racha: marca en varios partidos seguidos (registro de partidos: goles por jugador en la columna 8)
  const run=streak((S.mlog||[]),r=>(r.pl||[]).some(x=>x[0]===id&&x[8]>0));if(run>=4)L.push([6,'run'+id+run,`${p.name} marca en su ${ord(run)} partido seguido. Está en estado de gracia.`,'good']);
  // la ley del ex
  if((p.hist||[]).some(h=>h[1]===rv.short))L.push([7,'ex'+id+opp+S.seasonN,`La ley del ex: ${p.name} marca ante ${rv.name}, su antiguo club.`,'']);
  // primer gol con el club / canterano
  const tot=(S.mlog||[]).reduce((a,r)=>a+((r.pl||[]).find(x=>x[0]===id)||[])[8]||0,0);
  if(tot===n&&((p.h0&&p.h0[1]===seasonLabel())||(p.home&&p.age<=21)))L.push([5,'first'+id,p.home?`El canterano ${p.name} estrena su cuenta goleadora con el primer equipo.`:`Primer gol de ${p.name} con la camiseta de ${me.name}.`,'good']);});
 return L.sort((a,b)=>b[0]-a[0]);
}
/** Tras cada partido oficial tuyo: la mejor historia que no se haya contado ya. */
export function pressStory(m){
 if(!m.us||m.ref.k==='fr')return null;S.narr=S.narr||{};
 const st=stories(m).find(x=>!S.narr[x[1]]);if(!st)return null;S.narr[st[1]]=S.week+1;
 const keys=Object.keys(S.narr);if(keys.length>200)keys.slice(0,keys.length-200).forEach(k=>delete S.narr[k]);
 news(st[2],st[3],{cat:'pre',subj:st[2].split(/[.!¿?]/).filter(Boolean)[0].slice(0,70)});return st[2];
}
