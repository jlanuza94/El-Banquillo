/* El Banquillo · tactics2.ts — Táctica que engancha: fases del juego, sistemas famosos, dominio de cada rol,
 * consejos sobre el rival y análisis de por dónde se ataca durante el partido. */
// @ts-nocheck — usa el estado heredado S.
import {GRP,SPN,TAC0} from './data';
import {PL,S,T,squad} from './state';
import {autoLineup,eff,setFormation,slotsOf,teamPower,userRoles} from './tactics';
import {available} from './state';
import {roleList} from './roles';
import {DEF_DUTY,userPos} from './positions';

/* ---------- Fases del juego: al perder y al recuperar el balón ---------- */
/** Efecto de las transiciones (se suma a tacMods). A: táctica propia, B: la del rival. */
export function phaseMods(A,B,velDel,ment){
 let own=1,opp=1,drain=1,poss=0;const op=B||{};
 if(A.per==='cpr'){opp*=.965;drain*=1.06;poss+=.015;if(op.rec==='cont')opp*=1.045;}
 else if(A.per==='rep'){opp*=.975;own*=.985;poss-=.01;if(op.rec==='pau')own*=.99;}
 if(A.rec==='cont'){const open=op.lin==='alt'||op.per==='cpr'||ment==='att';own*=(open?1.04:1)*(1+.01*((velDel||5)-5));poss-=.02;}
 else if(A.rec==='pau'){poss+=.025;own*=.985;opp*=.985;}
 return {own,opp,drain,poss};
}
/* ---------- Sistemas famosos listos para cargar ---------- */
export const PRESETS={
 gegen:{g:'Presión',n:'Gegenpress',d:'Presión altísima y contrapresión al perder: robar arriba y atacar rápido. Cansa mucho.',f:'4-3-3',ment:'att',tac:{pre:'alt',lin:'alt',rit:'rap',anc:'nor',est:'dir',per:'cpr',rec:'cont'},roles:{DC:'dpr',MC:'box',MCD:'piv'},du:{MC:'ata'}},
 tiki:{g:'Posesión',n:'Tiki-taka',d:'Posesión paciente, pases cortos y presión tras pérdida. Necesita buenos pasadores.',f:'4-3-3',ment:'bal',tac:{pre:'alt',lin:'alt',rit:'len',anc:'anc',est:'pos',per:'cpr',rec:'pau'},roles:{DC:'f9',MC:'org',MCD:'ore',DFC:'csa'},du:{}},
 cate:{g:'Defensivo',n:'Catenaccio',d:'Bloque bajo, línea de cinco y salir a la contra. Ideal para defender un resultado.',f:'5-3-2',ment:'def',tac:{pre:'baj',lin:'baj',rit:'nor',anc:'est',est:'con',per:'rep',rec:'cont'},roles:{DFC:'sto',MC:'mcc',DC:'dob'},du:{MC:'def'}},
 contra:{g:'Contra',n:'Contraataque',d:'Esperar atrás y salir como un rayo con extremos y delanteros rápidos.',f:'4-4-2',ment:'bal',tac:{pre:'med',lin:'baj',rit:'rap',anc:'anc',est:'con',per:'rep',rec:'cont'},roles:{MD:'eba',MI:'eba',DC:'dar'},du:{}},
 directo:{g:'Directo',n:'Juego directo',d:'Balón largo a un delantero fuerte y a pelear las segundas jugadas.',f:'4-4-2',ment:'bal',tac:{pre:'med',lin:'med',rit:'rap',anc:'anc',est:'dir',per:'nor',rec:'cont'},roles:{DC:'dob'},du:{}},
 autobus:{n:'El autobús',g:'Defensivo',d:'Diez detrás del balón, líneas juntas y a esperar un error o un balón parado. Para sacar puntos en campos difíciles.',f:'5-4-1',ment:'def',tac:{pre:'baj',lin:'baj',rit:'len',anc:'est',est:'con',per:'rep',rec:'nor',ent:'dur',tie:'si'},roles:{DFC:'sto',MI:'cdb',MD:'cdb',MC:'mcc',DC:'dob'},du:{MI:'def',MD:'def'}},
 cholo:{n:'Bloque y contra (cholismo)',g:'Defensivo',d:'Dos líneas de cuatro muy juntas, entradas duras y salida rápida al robar. Sufrir, competir y matar a la contra.',f:'4-4-2',ment:'def',tac:{pre:'med',lin:'baj',rit:'nor',anc:'est',est:'con',per:'rep',rec:'cont',ent:'dur',tie:'si'},roles:{MI:'cdb',MD:'cdb',MC:'mcc',DC:'dpr'},du:{}},
 muro:{n:'Muro y transición',g:'Contra',d:'Doble pivote que protege a la defensa y tres por delante que salen disparados. Sólido y peligroso al espacio.',f:'4-2-3-1',ment:'bal',tac:{pre:'med',lin:'baj',rit:'rap',anc:'nor',est:'con',per:'rep',rec:'cont'},roles:{MCD:'piv',MCO:'lle',EI:'ext',ED:'ext',DC:'dar'},du:{MCO:'ata'}},
 presion:{n:'Presión total',g:'Presión',d:'Asfixiar al rival en su campo durante 90 minutos: entradas duras, línea alta y robar cerca de su portería. Exige un físico enorme.',f:'4-2-3-1',ment:'att',tac:{pre:'alt',lin:'alt',rit:'rap',anc:'nor',est:'dir',per:'cpr',rec:'cont',ent:'dur'},roles:{DC:'dpr',MCO:'lle',MCD:'piv',EI:'ede',ED:'ede'},du:{MCO:'ata'}},
 jposi:{n:'Juego de posición',g:'Posesión',d:'Salida de balón desde el portero, superioridad por dentro y extremos a pierna cambiada. El balón es tuyo y el rival corre.',f:'4-3-3',ment:'bal',tac:{pre:'alt',lin:'alt',rit:'nor',anc:'anc',est:'pos',per:'cpr',rec:'pau',off:'si'},roles:{POR:'pol',DFC:'csa',MCD:'ore',MC:'org',EI:'epc',ED:'epc',DC:'f9',LD:'lof',LI:'lof'},du:{}},
 rombo:{n:'Rombo',g:'Posesión',d:'Cuatro medios en rombo y dos puntas: dominio total del centro. Las bandas quedan para los laterales.',f:'4-3-1-2',ment:'bal',tac:{pre:'med',lin:'med',rit:'nor',anc:'est',est:'pos',per:'nor',rec:'nor'},roles:{MCO:'eng',MC:'box',MCD:'piv',DC:'dar',LD:'lof',LI:'lof'},du:{LD:'ata',LI:'ata'}},
 mpunta:{n:'Mediapunta libre',g:'Posesión',d:'Todo pasa por tu 10: un enganche con libertad entre líneas, rodeado de trabajadores. Ideal si tienes un creativo.',f:'4-2-3-1',ment:'bal',tac:{pre:'med',lin:'med',rit:'nor',anc:'nor',est:'pos',per:'nor',rec:'pau'},roles:{MCO:'eng',MCD:'ore',EI:'int',ED:'int',DC:'dar'},du:{}},
 bandas:{n:'Juego por bandas',g:'Directo',d:'Extremos pegados a la cal, laterales que doblan y centros al área para un nueve rematador.',f:'4-4-2',ment:'bal',tac:{pre:'med',lin:'med',rit:'nor',anc:'anc',est:'dir',per:'nor',rec:'nor'},roles:{MI:'eba',MD:'eba',LD:'lof',LI:'lof',DC:'dob'},du:{LD:'ata',LI:'ata'}},
 kick:{n:'Fútbol británico',g:'Directo',d:'Balón largo, segunda jugada, entradas fuertes y mucho ritmo. Funciona en campos malos y con jugadores físicos.',f:'4-4-2',ment:'bal',tac:{pre:'med',lin:'med',rit:'rap',anc:'anc',est:'dir',per:'nor',rec:'cont',ent:'dur'},roles:{DC:'dob',MC:'box',MI:'eba',MD:'eba',DFC:'sto'},du:{}},
 carril:{n:'Tres centrales y carrileros',g:'Ofensivo',d:'Tres centrales cubren atrás para que las bandas suban sin miedo. Mucha gente en ataque y dos puntas.',f:'3-5-2',ment:'bal',tac:{pre:'med',lin:'med',rit:'nor',anc:'anc',est:'equ',per:'nor',rec:'cont'},roles:{DFC:'csa',MI:'eba',MD:'eba',MCD:'ore',DC:'dar'},du:{MI:'ata',MD:'ata'}},
 total:{n:'Fútbol total',g:'Ofensivo',d:'Todos atacan y todos defienden: rotaciones, presión arriba y posesión. Precioso cuando sale; muy arriesgado cuando no.',f:'3-4-3',ment:'att',tac:{pre:'alt',lin:'alt',rit:'rap',anc:'anc',est:'pos',per:'cpr',rec:'nor',off:'si'},roles:{DFC:'csa',MC:'box',DC:'f9',EI:'ext',ED:'ext'},du:{}},
 ataque:{n:'Ataque total',g:'Ofensivo',d:'Mentalidad ofensiva, ritmo alto y todo el mundo arriba. Para remontar o pasar por encima de rivales débiles.',f:'4-3-3',ment:'att',tac:{pre:'alt',lin:'alt',rit:'rap',anc:'anc',est:'dir',per:'cpr',rec:'cont'},roles:{LD:'lof',LI:'lof',MC:'box',EI:'ext',ED:'ext',DC:'dar'},du:{LD:'ata',LI:'ata',MC:'ata'}},
 control:{n:'Control y pausa',g:'Posesión',d:'Tener el balón para no sufrir: ritmo lento, pases seguros y perder tiempo cuando vas ganando. Ideal para guardar ventajas.',f:'4-1-4-1',ment:'bal',tac:{pre:'med',lin:'med',rit:'len',anc:'nor',est:'pos',per:'nor',rec:'pau',tie:'si'},roles:{MCD:'ore',MC:'org',MI:'int',MD:'int',DC:'f9'},du:{}},
 sombra:{n:'Delantero sombra',g:'Contra',d:'Un 4-4-1-1 donde el mediapunta llega desde atrás al área. Equilibrado, difícil de marcar y muy útil en categorías bajas.',f:'4-5-1',ment:'bal',tac:{pre:'med',lin:'med',rit:'nor',anc:'nor',est:'equ',per:'nor',rec:'cont'},roles:{DC:'dar',MC:'box',MCD:'piv',MI:'eba',MD:'eba'},du:{}},
};
/** Cuánto encaja tu plantilla en un sistema: el mejor once posible con sus roles (media de 0 a 100) y los puestos flojos. */
export function presetFit(k){
 const P=PRESETS[k],sl=slotsOf(P.f),pool=squad(S.user).filter(p=>!p.loan&&available(p)),used=new Set(),rl=s=>{const r=P.roles[s];return r&&roleList(s).some(x=>x[0]===r)?r:roleList(s)[0][0];};
 const order=sl.map((s,i)=>i).sort((a,b)=>(sl[a]==='POR'?-1:0)-(sl[b]==='POR'?-1:0));const v=[];
 order.forEach(i=>{const s=sl[i],r=rl(s);let best=null,bv=-1;pool.forEach(p=>{if(used.has(p.id))return;const e=eff(p,s,100,r);if(e>bv){bv=e;best=p;}});if(best){used.add(best.id);v[i]=[s,bv];}else v[i]=[s,0];});
 const avg=v.reduce((a,x)=>a+x[1],0)/sl.length,weak=v.filter(x=>x[1]<avg-6).map(x=>x[0]);
 return{avg,weak:[...new Set(weak)]};
}
/** Carga un sistema famoso en tu equipo (formación, mentalidad, instrucciones, roles y cometidos). */
export function applyPreset(k){
 const P=PRESETS[k];if(!P)return;const t=T(S.user);t.style=k;
 if(t.formation!==P.f)setFormation(P.f);
 t.ment=P.ment;t.tac=Object.assign({},TAC0,P.tac);
 const sl=slotsOf(t.formation);t.roles=sl.map(s=>{const r=P.roles[s];return r&&roleList(s).some(x=>x[0]===r)?r:roleList(s)[0][0];});
 userPos(sl);t.duty=sl.map(s=>P.du[s]||DEF_DUTY[s]||'apo');t.pi=sl.map(()=>[]);
}
/* ---------- Dominio del rol: cada jugador aprende el rol que juega ---------- */
export const ROLE_FAM0=50;
export const roleFam=(p,role)=>!p||!role?ROLE_FAM0:(p.rf&&p.rf[role]!=null?p.rf[role]:ROLE_FAM0);
/** Multiplicador por dominio del rol: de 0,97 (nunca lo ha jugado) a 1,02 (lo domina). */
export const famMult=(p,role)=>!role||!p||!p.rf?1:.97+.05*roleFam(p,role)/100;
/** Tras un partido: los que jugaron suman dominio en su rol; el resto de sus roles se olvida un poco. */
export function learnRoles(m){
 const us=m.us;if(!us||!m.ro||!m.ro[us])return;const sl=slotsOf(m.f[us]);
 m.lu[us].forEach((id,i)=>{const p=PL(id),r=m.ro[us][i];if(!p||!r)return;p.rf=p.rf||{};
  Object.keys(p.rf).forEach(k=>{if(k!==r)p.rf[k]=Math.max(20,p.rf[k]-1);});
  p.rf[r]=Math.min(100,roleFam(p,r)+(p.per==='pro'?8:6));});
}
/* ---------- Informe del rival: puntos débiles y qué hacer (con botón para aplicarlo) ---------- */
export function rivalAdvice(oid){
 const o=T(oid),lu=autoLineup(oid,o.formation),sl=slotsOf(o.formation),tp=teamPower(lu,o.formation),tac=Object.assign({},TAC0,o.tac||{}),out=[];
 const at=(i,k)=>{const p=PL(lu[i]);return p?p.at[k]:5;};
 sl.forEach((s,i)=>{const p=PL(lu[i]);if(!p)return;
  if((s==='LD'||s==='LI')&&p.at.vel<=4)out.push({t:`Su ${SPN[s].toLowerCase()} (${p.name}) es lento (velocidad ${p.at.vel}): ataca su banda con un extremo rápido y juega ancho.`,k:'anc',v:'anc',l:'Jugar ancho'});
  if(s==='DFC'&&p.at.cab<=4)out.push({t:`${p.name} sufre por arriba (cabeza ${p.at.cab}): centros al área y un delantero objetivo.`,k:'est',v:'dir',l:'Juego directo'});
  if(s==='POR'&&p.at.por<=4)out.push({t:`Su portero es flojo (${p.at.por}): chuta mucho, también de lejos.`,k:'rit',v:'rap',l:'Ritmo rápido'});
  if(s==='DFC'&&p.at.vel<=4&&tac.lin!=='baj')out.push({t:`${p.name} es lento y juegan con la línea ${tac.lin==='alt'?'alta':'media'}: balones a la espalda.`,k:'rec',v:'cont',l:'Contraataque al recuperar'});});
 const pas=sl.map((s,i)=>GRP[s]==='DEF'?at(i,'pas'):null).filter(x=>x!=null),pa=pas.reduce((a,b)=>a+b,0)/Math.max(1,pas.length);
 if(pa<=4.5)out.push({t:`Sus defensas sacan mal el balón (pase ${pa.toFixed(1)}): presiona arriba.`,k:'pre',v:'alt',l:'Presión alta'});
 if(tac.pre==='alt')out.push({t:'Presionan muy arriba: pausa el juego al recuperar o busca la espalda con juego directo.',k:'rec',v:'pau',l:'Pausar al recuperar'});
 if(tac.est==='con'||tac.rec==='cont')out.push({t:'Les encanta la contra: repliega al perder el balón y no adelantes la línea.',k:'per',v:'rep',l:'Replegar al perder'});
 if(tp.mid<tp.def&&tp.mid<tp.atk)out.push({t:'Su centro del campo es lo más flojo: domina el balón.',k:'est',v:'pos',l:'Posesión'});
 return out.slice(0,5);
}
/* ---------- Análisis en directo: por dónde atacan los dos equipos ---------- */
/** Reparto de ataques por carril {l,c,r} en porcentaje, desde el punto de vista del que ataca. */
export function laneShare(m,s){const z=(m.lz&&m.lz[s])||{l:0,c:0,r:0},t=z.l+z.c+z.r;return t?{l:Math.round(z.l/t*100),c:Math.round(z.c/t*100),r:Math.round(z.r/t*100),n:t}:null;}
/** Consejo del ayudante según por dónde nos llegan. */
export function laneTip(m){
 const us=m.us,o=us==='h'?'a':'h',L=laneShare(m,o);if(!L||L.n<8)return null;
 if(L.l>=45)return 'Nos hacen daño por nuestra banda derecha: cierra al lateral derecho (instrucción «Quedarse cerrado») o pon un extremo defensivo.';
 if(L.r>=45)return 'Nos hacen daño por nuestra banda izquierda: cierra al lateral izquierdo (instrucción «Quedarse cerrado») o pon un extremo defensivo.';
 if(L.c>=55)return 'Nos llegan por el centro: un pivote defensivo o «Tapar al mediapunta» nos daría solidez.';
 return null;
}
