/* El Banquillo · extras2.ts — Más duelo y más largo plazo:
 * rival que cambia en el partido, charlas individuales, árbitros, tanda de penaltis jugada, parejas, capitanes,
 * jugadores que hablan en la prensa, proyecto a 3 años, estadio nuevo, pujas por fichajes, atributos del entrenador
 * y ofertas de grandes clubes. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,rnd} from './core';
import {COUNTRIES,GRP,NAMES} from './data';
import {LG,PL,S,T,lgName,seasonLabel,setTeam,squad,uLg} from './state';
import {news} from './world';
import {langOf} from './tactics';

const h01=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%10000)/10000;};

/* ---------- 1. El rival cambia en el partido ---------- */
/** El entrenador rival reacciona al marcador: se vuelca si pierde y se cierra si gana. */
export function aiInMatch(m,s,addEv,live){
 if(!m.us||s===m.us||m.min<60)return;const o=s==='h'?'a':'h',d=m.score[s]-m.score[o];m.aic=m.aic||{};const seg=(S.crew||[]).find(x=>x.role==='seg'),who=seg?seg.name.split(' ')[0]:'Tu ayudante';
 if(d<0&&!m.aic.att&&m.min>=(d<=-2?60:68)){m.aic.att=1;m.ment[s]='att';m.tac[s]=Object.assign({},m.tac[s],{rit:'rap',lin:'alt'});if(live)addEv(m,'sys',null,`${who}: «El rival se ha volcado: juega con la línea alta y a ritmo rápido. Al contragolpe les podemos matar.»`);}
 else if(d>0&&!m.aic.def&&m.min>=72){m.aic.def=1;m.ment[s]='def';m.tac[s]=Object.assign({},m.tac[s],{lin:'baj',rit:'len'});if(live)addEv(m,'sys',null,`${who}: «Se han encerrado atrás para guardar el resultado. Ancho y paciencia: hay que abrirles.»`);}
}

/* ---------- 2. Charlas individuales en el descanso ---------- */
export const ITALK={exi:'Exigirle más',ani:'Animarle',elo:'Felicitarle'};
/** Hablas con un jugador en el descanso: reacciona según su carácter y cómo va su partido. */
export function indivTalk(m,pid,tone,rating){
 const p=PL(pid);if(!p)return null;m.itk=m.itk||{};if(Object.keys(m.itk).length>=2)return 'Ya has hablado con dos jugadores en este descanso.';if(m.itk[pid])return 'Ya has hablado con él.';
 const r=rating??6,lid=p.at.lid??5;let d=0,txt='';
 if(tone==='exi'){d=p.per==='tem'||p.age<=20?-1:(p.per==='pro'||p.per==='lid'||lid>=7||r<6)?1:0;txt=d>0?'aprieta los dientes: va a dar más.':d<0?'se lo toma mal y se encierra.':'asiente sin más.';}
 else if(tone==='ani'){d=r<6.2||(p.hap??70)<50?1:0;txt=d>0?'recupera la confianza.':'ya estaba bien: no cambia nada.';}
 else{d=r>=6.8?1:r<5.8?-1:0;txt=d>0?'se viene arriba.':d<0?'no entiende el elogio: está jugando mal.':'lo agradece.';}
 m.itk[pid]=tone;p.form=clamp((p.form||0)+d,-3,3);return {d,txt:`${p.name} ${txt}`};
}

/* ---------- 3. Árbitros con personalidad ---------- */
export const REFS={est:{n:'Estricto',d:'Pita mucho y saca tarjetas: cuidado con las entradas duras.',c:1.45,dur:.985},nor:{n:'Normal',d:'Ni muy permisivo ni muy tarjetero.',c:1,dur:.975},dej:{n:'Deja jugar',d:'Permite el contacto: las entradas duras salen más baratas.',c:.68,dur:.962}};
export function refFor(ref,home){const r=h01('ref'+JSON.stringify(ref)+S.seasonN),t=T(home),c=LG(t.lg).c,[F,L]=NAMES[COUNTRIES[c].lang],nm=F[Math.floor(h01('rn'+JSON.stringify(ref))*F.length)]+' '+L[Math.floor(h01('rl'+JSON.stringify(ref)+S.seasonN)*L.length)];
 return {k:r<.3?'est':r<.75?'nor':'dej',name:nm};}

/* ---------- 4. Tanda de penaltis jugada ---------- */
export function momentShootout(m){m.mom={k:'so',txt:'¡Penaltis! Elige el orden de tus lanzadores.',opts:[['best','Los mejores primero'],['last','El mejor tira el quinto'],['brave','Los de más carácter (partidos grandes)']]};m.paused=true;}
/** Tanda penalti a penalti: cada lanzamiento sale en el acta. */
export function playShootout(m,order,addEv){
 const us=m.us,o=us==='h'?'a':'h',live=m.lu,on=s=>live[s].filter(Boolean).map(PL).filter(p=>p.sp!=='POR'||live[s].filter(Boolean).length<6);
 const by=(L,k)=>L.slice().sort((a,b)=>(b.at[k]??5)-(a.at[k]??5));let mine=by(on(us),'tir');
 if(order==='last'&&mine.length>=5){const b=mine.shift();mine.splice(4,0,b);}else if(order==='brave')mine=by(on(us),'gra');
 const theirs=by(on(o),'tir'),gk={h:PL(live.h[0]),a:PL(live.a[0])},sc={h:0,a:0};
 const kick=(s,p,i)=>{const g=gk[s==='h'?'a':'h'],ok=Math.random()<clamp(.76+.02*(p.at.tir-6)+.015*((p.at.gra??5)-5)-(g?.02*(g.at.por-5):0),.5,.92);if(ok)sc[s]++;addEv(m,'sys',null,`Penalti ${i+1} · ${T(m[s]).short}: ${p.name} ${ok?'✓ gol':'✗ fallo'} (${sc.h}-${sc.a})`);};
 const seq=s=>s===us?mine:theirs;let i=0;
 for(;i<5;i++){for(const s of ['h','a']){const L=seq(s);kick(s,L[i%L.length],i);}const left=4-i;if(Math.abs(sc.h-sc.a)>left)break;}
 while(sc.h===sc.a){i++;for(const s of ['h','a']){const L=seq(s);kick(s,L[i%L.length],i);}}
 m.pen=[sc.h,sc.a];addEv(m,'sys',null,`Penaltis: ${T(m.h).short} ${m.pen[0]}-${m.pen[1]} ${T(m.a).short} · pasa ${T(m.pen[0]>m.pen[1]?m.h:m.a).name}`);
}

/* ---------- 5. Parejas que se entienden (o no se soportan) ---------- */
const near=(a,b)=>{const g=[GRP[a.sp]||a.pos,GRP[b.sp]||b.pos].sort().join('');return ['DEFDEF','MEDMED','DELDEL','DELMED','DEFMED','DEFPOR'].includes(g);};
/** +1 se entienden de memoria, -1 no se soportan, 0 normal. Sale de quiénes son (idioma, país, carácter). */
export function duo(a,b){if(!a||!b||a.id===b.id||!near(a,b))return 0;const k=[a.id,b.id].sort().join('|'),r=h01('duo'+k);
 const good=.05+(a.nat===b.nat?.05:0)+(langOf(a)===langOf(b)?.03:0)+(a.per==='lid'||b.per==='lid'?.02:0),bad=.025+(a.per==='tem'&&b.per==='tem'?.08:0)+(langOf(a)!==langOf(b)?.01:0);
 return r<good?1:r>1-bad?-1:0;}
export function duosOf(ids){const P=ids.map(PL).filter(Boolean),out=[];for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const v=duo(P[i],P[j]);if(v)out.push([P[i],P[j],v]);}return out;}
/** Efecto de las parejas del once en el rendimiento. */
export function duoMult(ids){const D=duosOf(ids);return clamp(1+.006*D.filter(x=>x[2]>0).length-.008*D.filter(x=>x[2]<0).length,.96,1.04);}

/* ---------- 6. Capitanes y jerarquía ---------- */
export function captainWeekly(){
 const t=T(S.user),sq=squad(S.user).filter(p=>!p.loan),cap=PL(t.cap)&&PL(t.cap).team===S.user?PL(t.cap):null;if(!cap)return;const lid=cap.at.lid??5,vc=(t.vc||[]).map(PL).filter(p=>p&&p.team===S.user);
 if((cap.hap??70)<40){sq.filter(p=>p!==cap&&langOf(p)===langOf(cap)).forEach(p=>p.hap=clamp((p.hap??70)-.6,0,100));return;}
 const sad=sq.filter(p=>p!==cap&&(p.hap??70)<40);if(!sad.length)return;const p=pick(sad),chance=.15+.04*(lid-5)+.03*vc.filter(v=>(v.at.lid??5)>=6).length;
 if(rnd()<chance){p.hap=clamp((p.hap??70)+8,0,100);news(`Tu capitán ${cap.name} habla con ${p.name} y calma las aguas en el vestuario.`,'good',{cat:'pla',subj:`El capitán media: ${p.name}`});}
}

/* ---------- 7. Jugadores que piden salir en público ---------- */
export function publicWeekly(){
 squad(S.user).forEach(p=>{if(p.loan||(p.hap??70)>=28||p.pub===S.seasonN||!['cl','ti'].includes(p.role)||rnd()>.22)return;p.pub=S.seasonN;p.value=r3(p.value*.92);
  squad(S.user).forEach(q=>{if(q!==p&&langOf(q)===langOf(p))q.hap=clamp((q.hap??70)-3,0,100);});if(S.club)S.club.mood=clamp(S.club.mood-2,0,100);
  news(`${p.name}, en la prensa: «No me siento valorado. Quiero salir.» Sus compañeros de idioma están inquietos y su precio baja.`,'bad',{cat:'pre',subj:`${p.name} pide salir en público`,act:[{l:'Hablar con él',a:'ficha',id:p.id},{l:'Multarle',a:'pub-fine',id:p.id},{l:'Ponerlo en venta',a:'pub-sell',id:p.id}]});});
}
export function fineHim(pid){const p=PL(pid);if(!p)return;p.hap=clamp((p.hap??70)-6,0,100);squad(S.user).forEach(q=>{if(q!==p)q.hap=clamp((q.hap??70)+1,0,100);});news(`Multa a ${p.name} por sus declaraciones. El vestuario aplaude la mano dura; él, no tanto.`,'',{cat:'pla'});}

/* ---------- 8. Proyecto a 3 años con la directiva ---------- */
export const PROJ={asc:{n:'Ascender',d:'Subir al menos una división en 3 temporadas.'},can:{n:'Apostar por la cantera',d:'En la tercera temporada, al menos 4 canteranos con 10 partidos o más.'},eco:{n:'Sanear las cuentas',d:'Terminar la tercera temporada con un 50% más de presupuesto que ahora.'},tit:{n:'Ganar un título',d:'Ganar cualquier título (liga o copa) en 3 temporadas.'}};
export function projOffer(){if(S.proj||S.projOff===S.seasonN)return;S.projOff=S.seasonN;news('La directiva quiere pactar contigo un proyecto a 3 años. Te juzgarán por él, no solo por cada temporada.','',{cat:'dir',subj:'Proyecto a 3 años',act:Object.entries(PROJ).map(([k,v])=>({l:v.n,a:'proj',v:k}))});}
export function startProject(k){if(S.proj||!PROJ[k])return;S.proj={k,start:S.seasonN,end:S.seasonN+2,lv:LG(uLg()).lv,budget:S.budget,titles:(S.titles||[]).length};news(`Proyecto pactado con la directiva: ${PROJ[k].n.toLowerCase()}. ${PROJ[k].d}`,'good',{cat:'dir'});}
export function projState(){const P=S.proj;if(!P)return null;const sq=squad(S.user);
 const done=P.k==='asc'?LG(uLg()).lv<P.lv:P.k==='can'?sq.filter(p=>p.home&&p.st&&p.st.pj>=10).length>=4:P.k==='eco'?S.budget>=P.budget*1.5:(S.titles||[]).length>P.titles;
 return {done,left:P.end-S.seasonN};}
/** Al terminar cada temporada: cómo va el proyecto. */
export function projSeasonEnd(){
 const P=S.proj;if(!P)return;const st=projState(),M=S.mgr;
 if(st.done&&(P.k!=='can'||S.seasonN>=P.end)){M.rep=clamp(M.rep+8,0,100);M.conf=clamp(M.conf+20,0,100);const b=r2(Math.max(.2,S.budget*.1));S.budget=r3(S.budget+b);news(`¡Proyecto cumplido: ${PROJ[P.k].n.toLowerCase()}! La directiva te premia con ${money(b)} y su total confianza.`,'good',{cat:'dir',subj:'Proyecto cumplido'});S.proj=null;S.projHist=(S.projHist||[]).concat([{k:P.k,ok:1,season:seasonLabel()}]);return;}
 if(S.seasonN>=P.end){M.conf=clamp(M.conf-15,0,100);news(`El proyecto (${PROJ[P.k].n.toLowerCase()}) no se ha cumplido. La directiva está decepcionada.`,'bad',{cat:'dir',subj:'Proyecto fallido'});S.proj=null;S.projHist=(S.projHist||[]).concat([{k:P.k,ok:0,season:seasonLabel()}]);return;}
 M.conf=clamp(M.conf+3,0,100);news(`Proyecto (${PROJ[P.k].n.toLowerCase()}): queda${P.end-S.seasonN===1?' 1 temporada':'n '+(P.end-S.seasonN)+' temporadas'}. La directiva sigue confiando.`,'',{cat:'dir'});
}

/* ---------- 9. Estadio nuevo ---------- */
export const nsCost=(seatCost)=>{const C=S.club,add=Math.max(C.cap,15000);return {add,cost:r3(add*seatCost()*.8),weeks:60};};
export function startStadium(seatCost){
 const C=S.club;if(C.ns)return 'Ya estás construyendo un estadio.';if(C.build)return 'Termina primero las obras en marcha.';if(S.mgr.conf<55)return 'La directiva no se fía lo bastante (confianza de 55 o más).';
 const X=nsCost(seatCost),down=r3(X.cost*.1);if(S.budget<down)return `Necesitas ${money(down)} de entrada.`;
 S.budget=r3(S.budget-down);C.ns={add:X.add,left:X.weeks,weekly:r3(X.cost*.9/X.weeks),total:X.weeks};news(`¡Empiezan las obras del estadio nuevo! ${X.add.toLocaleString('es')} asientos más. Pagas ${money(down)} ahora y ${money(C.ns.weekly)} cada jornada durante ${X.weeks} jornadas. Mientras, se juega en un estadio provisional con menos ambiente.`,'good',{cat:'dir',subj:'Estadio nuevo: empiezan las obras'});return '';}
export function stadiumWeekly(){const C=S.club;if(!C||!C.ns)return;S.budget=r3(S.budget-C.ns.weekly);C.ns.left--;
 if(C.ns.left<=0){C.cap+=C.ns.add;C.fans=Math.round(C.fans*1.12);C.mood=clamp(C.mood+12,0,100);news(`¡Inauguramos el estadio nuevo! Ahora caben ${C.cap.toLocaleString('es')} aficionados. La ciudad está de fiesta.`,'good',{cat:'dir',subj:'Estadio nuevo inaugurado'});C.ns=null;}}
/** Durante las obras se juega en un campo provisional: algo menos de público. */
export const nsAttMult=()=>S.club&&S.club.ns?.9:1;

/* ---------- 10. Pujas por un fichaje ---------- */
/** Al aceptar tu oferta, a veces otro club ya tenía un acuerdo: el jugador elegirá. */
export function maybeRival(p,n,interested){
 if(p.team===null)return;const big=interested(p.id).filter(id=>id!==S.user&&id!==p.team);const chance=big.length?.55:p.ovr>=65?.18:.08;if(rnd()>chance)return;
 const pool=big.length?big:S.teams.filter(t=>!t.parent&&t.id!==S.user&&t.id!==p.team&&Math.abs(t.rep-(T(p.team).rep+5))<12).map(t=>t.id);if(!pool.length)return;
 const r=pick(pool),R=T(r);n.rival={team:r,w:r3(Math.max(p.wage,.001)*(1.15+rnd()*.35)),role:p.ovr>=R.rep?'ti':'ro'};
 n.msg+=` Ojo: ${R.name} también ha llegado a un acuerdo con su club y le ofrece unos ${money(n.rival.w)}/sem. ${p.name} elegirá la mejor propuesta: dinero, minutos y proyecto.`;
}
/** Comparar tu propuesta con la del rival. true si el jugador se va con el otro. */
export function rivalWins(p,n,t,ROLES){
 const R=n.rival;if(!R)return false;const myRep=LG(uLg()).rep,rr=LG(T(R.team).lg).rep;
 const mine=t.w/R.w*.55+(ROLES[t.role].l/ROLES[R.role].l)*.3+(1+(myRep-rr)/60)*.15,theirs=1+(rnd()-.5)*.15;
 if(mine>=theirs)return false;
 const fee=n.agreed||p.value;setTeam(p,R.team);p.wage=R.w;p.contract=3;news(`${p.name} elige ${T(R.team).name}: su propuesta le convenció más (sueldo, minutos y proyecto). Se marcha por ${money(fee)}.`,'bad',{cat:'mer',subj:`Pierdes la puja por ${p.name}`});
 n.closed=true;n.msg=`${p.name} ha elegido ${T(R.team).name}.`;n.kind='no';return true;
}

/* ---------- 11. Atributos del entrenador ---------- */
export const MGR_AT={tac:'Táctica',mot:'Motivación',can:'Cantera',neg:'Negociación'};
export const mgrAt=k=>(S&&S.mgr&&S.mgr.at&&S.mgr.at[k])??5;
export function mgrInit(){if(S.mgr&&!S.mgr.at)S.mgr.at={tac:5,mot:5,can:5,neg:5};}
/** Al terminar la temporada mejoras en lo que más has trabajado. */
export function mgrGrow(sm){mgrInit();const A=S.mgr.at,up=[],add=(k,v)=>{if(A[k]>=10)return;A[k]=Math.min(10,r2(A[k]+v));up.push(MGR_AT[k]);};
 if(sm.ok||sm.up||sm.champ)add('tac',.5);const sq=squad(S.user);if(sq.filter(p=>p.home&&p.st&&p.st.pj>=10).length>=2)add('can',.5);
 if((S.buysSeason||0)+((S.tlog||[]).filter(x=>x.from===S.user&&x.season===seasonLabel()).length)>=3)add('neg',.5);
 const avg=sq.length?sq.reduce((a,p)=>a+(p.hap??70),0)/sq.length:60;if(avg>=65)add('mot',.5);
 if(up.length)news(`Creces como entrenador: mejoras en ${up.join(', ').toLowerCase()}.`,'good',{cat:'dir',subj:'Tus atributos de entrenador'});}

/* ---------- 12. Ofertas de grandes clubes con dilema ---------- */
/** A mitad de temporada, si vas bien, un grande puede llamar. Aceptar duele a tu afición; rechazar te da lealtad. */
export function bigOfferWeekly(pos,clubReq,jobCandidates,makeJobOffer){
 if(S.week!==19||pos>3||S.bigOff===S.seasonN)return;S.bigOff=S.seasonN;const cur=clubReq(T(S.user)),c=jobCandidates(S.mgr.rep+18,cur+10,1)[0];if(!c)return;
 const o=makeJobOffer(c);o.until=S.week+3;o.big=1;S.jobOffers=(S.jobOffers||[]).concat([o]);
 news(`¡${c.name} (${lgName(c.lg)}), un grande, te quiere ya! Si te vas a mitad de temporada, tu afición no lo olvidará; si te quedas, te lo agradecerá.`,'good',{cat:'dir',from:c.name,subj:`Un grande te llama: ${c.name}`,act:[{l:'Ver oferta',a:'view',v:'inicio'}]});
}
export function jobDecision(o,took){if(!o)return;const club=T(S.user).name;
 if(took){news(`La afición de ${club} se siente traicionada por tu marcha a mitad de temporada.`,'bad',{cat:'pre'});S.mgr.loyal=0;}
 else if(o.big){S.mgr.conf=clamp(S.mgr.conf+8,0,100);if(S.club)S.club.mood=clamp(S.club.mood+8,0,100);S.mgr.loyal=(S.mgr.loyal||0)+1;news(`Rechazas a ${T(o.team).name}. La afición de ${club} corea tu nombre y la directiva te lo agradece.`,'good',{cat:'pre',subj:'Te quedas: la afición te lo agradece'});}}
