/* El Banquillo · extras.ts — Lo que hace que cada día enganche:
 * objetivos de temporada por jugador, momentos de partido, lesiones con decisión, rivalidad con entrenadores,
 * gala de fin de temporada, clima y estado del campo, vídeo del rival a balón parado y fichar técnicos de otros clubes. */
// @ts-nocheck — usa el estado heredado S.
import {playShootout} from './extras2';
import {staffMax} from './staff';
import {nextMatch} from './competitions';
import {dateOf,dayOfEvent} from './calendar';
import {clamp,money,pick,r2,r3,ri} from './core';
import {COUNTRIES,FORMS,GRP} from './data';
import {LG,PL,S,T,lgName,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {coachOf} from './living';

/* ---------- 1. Objetivos de temporada por jugador ---------- */
export const OBJ_N={g:'goles',a:'asistencias',pj:'partidos',cs:'porterías a cero'};
/** Pacta con cada jugador importante (y con los jóvenes) un objetivo para la temporada. */
export function assignObjectives(){
 squad(S.user).forEach(p=>{if(p.loan){p.obj=0;return;}const g=GRP[p.sp]||p.pos,key=p.role==='cl'||p.role==='ti';let o=null;
  if(p.age<=21&&!key)o={k:'pj',n:clamp(Math.round(6+(p.ovr-40)/4),6,18)};
  else if(key&&g==='DEL')o={k:'g',n:clamp(Math.round(6+(p.ovr-50)/2.5),5,28)};
  else if(key&&(g==='MED'||p.sp==='ED'||p.sp==='EI'))o=p.sp==='MCD'?{k:'pj',n:24}:{k:'a',n:clamp(Math.round(3+(p.ovr-50)/5),3,14)};
  else if(key&&g==='POR')o={k:'cs',n:clamp(Math.round(6+(p.ovr-50)/5),6,16)};
  else if(key)o={k:'pj',n:clamp(Math.round(18+(p.ovr-50)/5),16,30)};
  p.obj=o?Object.assign(o,{done:0}):0;});
 S.objV=S.seasonN;
}
export const objProg=p=>{if(!p.obj||!p.st)return 0;return p.st[p.obj.k]||0;};
/** Cada jornada: si alguien cumple su objetivo, lo celebra. */
export function objectivesWeekly(){squad(S.user).forEach(p=>{const o=p.obj;if(!o||o.done||objProg(p)<o.n)return;o.done=1;p.hap=clamp((p.hap||70)+8,0,100);
 news(`${p.name} cumple su objetivo de la temporada: ${o.n} ${OBJ_N[o.k]}. Está encantado.`,'good',{cat:'pla',subj:`Objetivo cumplido: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});});}
/** Fin de temporada: los que lo cumplieron se revalorizan; los que no, se frustran. */
export function objectivesSeasonEnd(){
 const ok=[],ko=[];squad(S.user).forEach(p=>{const o=p.obj;if(!o)return;if(o.done||objProg(p)>=o.n){ok.push(p.name);p.value=r3(p.value*1.08);}else{ko.push(p.name);p.hap=clamp((p.hap||70)-6,0,100);}p.obj=0;});
 if(ok.length||ko.length)news(`Objetivos de los jugadores: ${ok.length} cumplidos${ok.length?' ('+ok.slice(0,6).join(', ')+')':''}${ko.length?`; sin cumplir: ${ko.slice(0,6).join(', ')}`:''}.`,ok.length>=ko.length?'good':'',{cat:'pla',subj:'Balance de objetivos de los jugadores'});
}

/* ---------- 2 y 5. Momentos de partido y lesiones con decisión ---------- */
/** Penalti a favor en tu partido: eliges quién lo tira. */
export function momentPen(m,s){const c=m.lu[s].filter(Boolean).map(PL).filter(p=>p.sp!=='POR').sort((a,b)=>b.at.tir-a.at.tir).slice(0,3);
 m.mom={k:'pen',s,txt:'¡Penalti a favor! ¿Quién lo tira?',opts:c.map(p=>[p.id,`${p.name.split(' ').slice(1).join(' ')||p.name} · remate ${p.at.tir} · partidos grandes ${p.at.gra??5}${m.pk[s]===p.id?' (lanzador)':''}`])};m.paused=true;}
export function momentRed(m){m.mom={k:'red',txt:`¡${T(m[m.us==='h'?'a':'h']).short} se queda con diez! ¿Qué haces?`,opts:[['ata','Arriesgar: a por ellos (más ataque, más riesgo)'],['man','Mantener el plan y mover el balón'],['cie','Cerrar el partido (si vas ganando)']]};m.paused=true;}
export function momentInj(m,id){const p=PL(id);m.mom={k:'inj',pid:id,txt:`${p.name} se ha hecho daño. El médico dice que puede seguir, pero hay riesgo.`,opts:[['sub','Cambiarlo ahora'],['agu','Que aguante (puede agravarse)']]};m.paused=true;}
export function momentGk(m){m.mom={k:'gk',txt:'Último minuto, perdéis por uno y hay córner. ¿Subes al portero?',opts:[['gk','¡Sí, todos arriba!'],['no','No, que se quede']]};m.paused=true;}
/** Probabilidad de un momento cada minuto (sin tocar el azar del motor). */
export function momentsTick(m){const us=m.us;if(!us||m.auto||m.mom||m.done)return;const o=us==='h'?'a':'h';
 if(m.min>=88&&m.score[us]===m.score[o]-1&&!m.gkTry&&Math.random()<.35){m.gkTry=1;momentGk(m);}}
/** Resolver la decisión del jugador. Devuelve el texto para el acta. */
export function resolveMoment(m,v,h){
 const M=m.mom;if(!M)return;m.mom=null;const us=m.us,o=us==='h'?'a':'h';
 if(M.k==='pen'){const P=PL(v),g=m.lu[o][0]?PL(m.lu[o][0]):null,ok=Math.random()<clamp(.66+.025*(P.at.tir-5)+.012*((P.at.gra??5)-5)-(g?.02*(g.at.por-5):0)+(P.tr&&P.tr.includes('bal')?.04:0)-(m.en[v]!=null&&m.en[v]<50?.05:0),.45,.93);
  m.st[us].sh++;h.shotLog(m,us,v,.76,ok?'g':'s');
  if(ok){m.score[us]++;m.st[us].ot++;if(m.ref.k==='lg')P.goals++;m.flash=m.min;h.addEv(m,'goal',us,`¡Penalti y gol! ${P.name} no falla. (${h.scoreStr(m)})`,v);}
  else h.addEv(m,'shot',us,`¡Penalti fallado! ${P.name} no puede con ${g?g.name:'el portero'}.`,v);}
 else if(M.k==='red'){m.mm=m.mm||{};if(v==='ata'){m.ment[us]='att';m.mm[us]={own:1.06,opp:1.04};}else if(v==='man')m.mm[us]={own:1.03,opp:1};else{m.ment[us]='def';m.mm[us]={own:.97,opp:.95};}
  h.addEv(m,'sys',null,v==='ata'?'Vas a por ellos con uno más.':v==='man'?'Mantienes el plan: a mover el balón.':'Cierras el partido.');}
 else if(M.k==='inj'){if(v==='sub'){m.subOpen=true;m.subFor=M.pid;}else{m.forced=m.forced||{};m.forced[M.pid]=1;if(Math.random()<.5){delete m.hurt[M.pid];h.addEv(m,'sys',null,`${PL(M.pid).name} aprieta los dientes y sigue como si nada.`);}else h.addEv(m,'sys',null,`${PL(M.pid).name} sigue, pero cojea.`);}}
 else if(M.k==='so'){playShootout(m,v,h.addEv);}
 else if(M.k==='gk'){const gk=m.lu[us][0];if(v==='gk'){const r=Math.random();
   if(r<.09&&gk){m.score[us]++;m.st[us].sh++;m.st[us].ot++;m.flash=m.min;h.shotLog(m,us,gk,.3,'g');h.addEv(m,'goal',us,`¡¡GOL DEL PORTERO!! ${PL(gk).name} sube al córner y la mete de cabeza. (${h.scoreStr(m)})`,gk);}
   else if(r<.16){const id=h.pickScorer(m,o);if(id){m.score[o]++;m.st[o].sh++;m.st[o].ot++;h.shotLog(m,o,id,.6,'g');h.addEv(m,'goal',o,`Contra con la portería vacía: ${PL(id).name} marca desde lejos. (${h.scoreStr(m)})`,id);}}
   else h.addEv(m,'sys',null,'El portero sube, el córner se despeja y vuelve corriendo a su portería.');}
  else h.addEv(m,'sys',null,'El portero se queda en su sitio.');}
}
/** Tras el partido: si forzaste a un lesionado, la lesión puede ser más larga. */
export function forcedAfter(m){Object.keys(m.forced||{}).forEach(id=>{const p=PL(id);if(!p||!p.pInj)return;if(Math.random()<.55){p.pInj=Math.round(p.pInj*1.6)+1;news(`Forzar a ${p.name} ha salido caro: la lesión se ha agravado (${p.pInj} jornadas).`,'bad',{cat:'med',subj:`Lesión agravada: ${p.name}`});}});}

/* ---------- 3. Rivalidad con otros entrenadores ---------- */
const cKey=c=>c?c.name:null;
export function coachH2H(tid){const c=coachOf(tid);return c&&S.cvs&&S.cvs[cKey(c)]||null;}
export function recordCoach(m){if(!m.us)return;const o=m.us==='h'?'a':'h',c=coachOf(m[o]);if(!c)return;S.cvs=S.cvs||{};const r=S.cvs[cKey(c)]||(S.cvs[cKey(c)]={w:0,d:0,l:0}),d=m.score[m.us]-m.score[o];if(d>0)r.w++;else if(d<0)r.l++;else r.d++;
 if(S.pique&&S.pique.opp===m[o]&&S.pique.resp==='r'){if(d>0){S.mgr.rep=clamp(S.mgr.rep+1,0,100);news(`Ganas a ${T(m[o]).name} después del cruce de declaraciones con ${c.name}: la prensa te da la razón.`,'good',{cat:'pre'});}else if(d<0){S.mgr.conf=clamp(S.mgr.conf-3,0,100);news(`${c.name} gana el duelo dialéctico: tras responderle, pierdes contra ${T(m[o]).name}.`,'bad',{cat:'pre'});}}
 if(S.pique&&S.pique.opp===m[o])S.pique=null;}
const PIQUES=['«Su equipo juega a no perder. Nosotros vamos a ganar»','«Mucho hablar, pero en el campo se verá quién es quién»','«No me preocupa su entrenador; me preocupan sus delanteros, y tampoco mucho»','«Si nos ganan será por suerte»'];
/** Antes de ciertos partidos, el entrenador rival suelta una frase. Puedes responderle o ignorarle. */
export function piqueWeekly(opp,derby,last){const c=coachOf(opp);if(!c||S.pique&&S.pique.opp===opp)return;const r=coachH2H(opp);
 if(Math.random()>(derby?.6:(r&&r.l>r.w)?.35:c.rep>=70?.2:.07))return;
 S.pique={opp,resp:null};news(`${c.name}, entrenador de ${T(opp).name}, en la previa: ${pick(PIQUES)}`,'',{cat:'pre',subj:`Pique: ${c.name} habla de ti`,act:[{l:'Responderle',a:'pique',v:'r'},{l:'Ignorarle',a:'pique',v:'i'}]});}

/* ---------- 4. Gala de fin de temporada ---------- */
export function galaAwards(){
 const sq=squad(S.user).filter(p=>p.st&&p.st.pj>0),avg=p=>p.st.pj?p.st.rs/p.st.pj:0,best=(L,f)=>L.slice().sort((a,b)=>f(b)-f(a))[0]||null;
 const reg=sq.filter(p=>p.st.pj>=8),grow=p=>{const h=p.ph&&p.ph.length?p.ph[p.ph.length-1][1]:p.ovr;return p.ovr-h;};
 const out=[];const add=(k,n,p,t)=>{if(p)out.push({k,n,id:p.id,t});};
 add('mvp','Jugador de la temporada',best(reg,avg),p=>`nota media ${avg(p).toFixed(2)} en ${p.st.pj} partidos`);
 add('jov','Mejor joven',best(reg.filter(p=>p.age<=21),avg),p=>`${p.age} años · nota ${avg(p).toFixed(2)}`);
 add('gol','Máximo goleador',best(sq.filter(p=>p.st.g>0),p=>p.st.g),p=>`${p.st.g} goles`);
 add('asi','Rey de las asistencias',best(sq.filter(p=>p.st.a>0),p=>p.st.a),p=>`${p.st.a} asistencias`);
 add('rev','Revelación',best(sq.filter(p=>grow(p)>0),grow),p=>`ha subido ${(grow(p)/10).toFixed(1)} de media`);
 return out.map(x=>Object.assign(x,{t:typeof x.t==='function'?x.t(PL(x.id)):x.t}));
}
/** Al empezar la temporada nueva: la gala queda en la historia y los premiados se alegran. */
export function galaSeasonEnd(){const A=galaAwards();if(!A.length)return;S.galas=(S.galas||[]).concat([{season:seasonLabel(),a:A.map(x=>({n:x.n,p:PL(x.id).name,t:x.t}))}]).slice(-20);
 A.forEach(x=>{const p=PL(x.id);p.hap=clamp((p.hap||70)+5,0,100);});
 news(`Gala del club ${seasonLabel()}: ${A.map(x=>`${x.n}, ${PL(x.id).name}`).join(' · ')}.`,'good',{cat:'pla',subj:`Gala del club ${seasonLabel()}`});}

/* ---------- 6. Clima y estado del campo ---------- */
export const WX={sol:{n:'Despejado',i:'☀️',d:'Sin efectos.'},llu:{n:'Lluvia',i:'🌧️',d:'El balón corre y resbala: el juego de toque sufre; el directo y los disparos lejanos ganan.'},cal:{n:'Calor',i:'🥵',d:'Los jugadores se cansan bastante más.'},fri:{n:'Frío',i:'🥶',d:'Partido trabado: menos ritmo y algo más de riesgo de lesión.'},nie:{n:'Nieve',i:'❄️',d:'Todo cuesta: menos ocasiones para los dos y el mejor equipo pierde ventaja.'}};
export const PITCH={bue:{n:'Césped perfecto',d:''},irr:{n:'Campo irregular',d:'El toque sufre un poco.'},emb:{n:'Campo embarrado',d:'Se corre peor y el toque sufre mucho.'}};
const HOT=['BRA','MEX','COL','ARG','PRT','USA','TUR'],COLD=['SCO','ALE','NED','BEL','ING','JPN'];
function h01(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%10000)/10000;}
/** El tiempo de un partido sale de su fecha y del país: es el mismo en la previa y en el partido. */
export function weatherFor(ref,home,month){
 const t=T(home),L=LG(t.lg),code=COUNTRIES[L.c].code,r=h01(JSON.stringify(ref)+'|'+S.seasonN+'|'+home),r2_=h01('p'+JSON.stringify(ref)+S.seasonN),south=['BRA','ARG','COL'].includes(code);
 const winter=south?[5,6,7].includes(month):[11,0,1].includes(month),summer=south?[11,0,1].includes(month):[6,7,4].includes(month);
 let k='sol';if(winter){k=r<.3?'llu':r<.55?'fri':COLD.includes(code)&&r<.65?'nie':'sol';}else if(summer){k=HOT.includes(code)?(r<.45?'cal':r<.55?'llu':'sol'):(r<.2?'cal':r<.32?'llu':'sol');}else k=r<.3?'llu':r<.4&&COLD.includes(code)?'fri':'sol';
 const p=k==='llu'&&r2_<.45?'emb':L.lv>=2&&r2_<.35?'irr':'bue';
 return {k,p};
}
/** Efecto del tiempo y del campo en la táctica de un equipo. */
export function weatherMods(wx,A){let own=1,opp=1,drain=1,poss=0;if(!wx)return {own,opp,drain,poss};
 if(wx.k==='llu'){if(A.est==='pos')own*=.96;if(A.est==='dir')own*=1.03;}
 if(wx.k==='cal')drain*=1.14;if(wx.k==='fri'){own*=.98;drain*=.97;}if(wx.k==='nie'){own*=.93;opp*=.97;}
 if(wx.p==='irr'&&A.est==='pos')own*=.98;if(wx.p==='emb'){own*=.96;drain*=1.06;if(A.est==='pos')own*=.97;}
 return {own,opp,drain,poss};}
/** El tiempo previsto para tu próximo partido. */
export function nextWeather(){const nm=nextMatch();return nm?weatherFor(nm.ref,nm.fx.h,dateOf(dayOfEvent(S.ci)).getUTCMonth()):null;}
export const wxTxt=wx=>wx?`${WX[wx.k].i} ${WX[wx.k].n}${wx.p!=='bue'?' · '+PITCH[wx.p].n.toLowerCase():''}`:'';

/* ---------- 7. Vídeo del rival: balón parado ---------- */
export function rivalSetPieces(oid){
 const sq=squad(oid).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,14),hd=sq.slice().sort((a,b)=>(b.at.cab??5)-(a.at.cab??5))[0],tk=sq.slice().sort((a,b)=>b.at.pas-a.at.pas)[0],r=h01('sp'+oid+S.seasonN);
 return {ck:r<.4?'Al primer palo':r<.75?'Al segundo palo':'En corto',fk:r*7%1<.5?'Directas a puerta':'Colgadas al área',hd,tk};}
export const spPrepFor=oid=>S.spPrep&&S.spPrep.opp===oid;
/** Cuánto se reduce el peligro del rival a balón parado tras preparar el vídeo (mejor segundo, más se reduce). */
export function spPrepMult(){const seg=(S.crew||[]).find(x=>x.role==='seg'),tac=seg?seg.at.tac:4;return clamp(.8-.025*(tac-5),.62,.9);}

/* ---------- 8. Fichar técnicos de otros clubes ---------- */
export function staffMarket(makeStaff,crewLevel){
 const key=S.seasonN*2+(S.week>=((S.fixtures&&S.fixtures[0]&&S.fixtures[0].length)||38)/2?1:0);if(S.staffMk&&S.staffMkN===key)return S.staffMk;
 const my=LG(uLg()).rep,clubs=S.teams.filter(t=>!t.parent&&t.id!==S.user&&LG(t.lg).rep>=my-5);
 S.staffMk=['seg','ent','ent','fis','fis','dd','dca','seg','dd','dca'].map(role=>{const t=pick(clubs),m=makeStaff(role,crewLevel()+1.6+Math.random()*1.2);m.club=t.id;m.fee=r3(m.wage*26);
  if(role==='seg')m.form=pick(Object.keys(FORMS).slice(0,8));if(role==='dd')m.contacts=Array.from(new Set([LG(t.lg).c].concat(m.contacts||[])));return m;});
 S.staffMkN=key;return S.staffMk;
}
/** Contratar a un técnico de otro club: pagas su indemnización y trae lo que sabe. */
export function hireFromClub(id,R){
 const i=(S.staffMk||[]).findIndex(x=>x.id===id);if(i<0)return 'Ya no está disponible.';const m=S.staffMk[i],role=R[m.role];
 if((S.crew||[]).filter(x=>x.role===m.role).length>=staffMax(m.role))return `Ya tienes el cupo de ${role.pl.toLowerCase()}: despide a alguno antes.`;
 if(S.budget<m.fee)return `Su club pide ${money(m.fee)} de indemnización y no tienes tanto presupuesto.`;
 S.budget=r3(S.budget-m.fee);m.yrs=3;S.staffMk.splice(i,1);S.crew.push(m);const from=T(m.club);
 let extra='';if(m.form){S.famil=S.famil||{};S.famil[m.form]=clamp((S.famil[m.form]??40)+25,0,100);extra=` Conoce a fondo el ${m.form}: tu equipo lo domina mejor.`;}
 if(m.role==='dd'){S.know=S.know||{};const c=LG(from.lg).c;Object.values(S.players).forEach(p=>{if(p.team!==null&&p.team!==S.user&&LG(T(p.team).lg).c===c)S.know[p.id]=Math.min(100,(S.know[p.id]||0)+25);});extra=` Trae sus contactos en ${COUNTRIES[c].n}: conoces mejor a sus jugadores.`;}
 news(`${m.name} deja ${from.name} para unirse a tu cuerpo técnico como ${role.n.toLowerCase()} (indemnización ${money(m.fee)}).${extra}`,'good',{cat:'sta',subj:`Fichaje para el banquillo: ${m.name}`});return '';
}
