/* El Banquillo · economy.ts — Economía viva:
 *  · el valor de cada jugador sube y baja con su rendimiento, edad, potencial, liga, contrato, selección y lesiones;
 *  · cada club de la IA tiene su caja: gana o pierde dinero según dónde queda, los premios, ascensos y traspasos;
 *  · la IA planifica su plantilla cada verano según lo que le falta y el dinero que tiene. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,ri,rnd} from './core';
import {GRP} from './data';
import {LG,PL,S,T,lgName,lgTeams,seasonLabel,setTeam,squad,uLg,unit} from './state';
import {news} from './world';
import {assignNum,baseWage,genPlayer} from './players';

/* ======================= Valor de mercado ======================= */
/** Valor «de catálogo»: solo media y edad (la base de todo). */
export function baseValue(p){let v=.25*Math.pow(1.115,p.ovr-50);if(p.age<=21)v*=1.5;else if(p.age<=24)v*=1.25;else if(p.age>=33)v*=.45;else if(p.age>=30)v*=.7;return v;}
/** Multiplicadores que hacen que el valor se mueva. Devuelve [factor, motivo principal]. */
export function valueFactors(p){
 const f={},ok=!!(S&&S.teams&&S.leagues); // al cargar una partida aún no existen los clubes
 if(p.age<=23&&p.pot*10>p.ovr)f.pot=1+Math.min(.9,(p.pot*10-p.ovr)*.03);
 if(p.st&&p.st.pj>=4){const avg=p.st.rs/p.st.pj;f.form=clamp(1+(avg-6.5)*.32,.72,1.4);if(p.st.g>=10&&GRP[p.sp]!=='POR')f.form*=1+Math.min(.25,(p.st.g-8)*.02);}
 else if(p.lf)f.form=clamp(1+(p.lf-6.5)*.18,.82,1.22); // lo que hizo la temporada pasada aún pesa al empezar
 if(p.team!==null&&ok&&T(p.team)){const rep=LG(T(p.team).lg).rep;f.lg=clamp(1+(rep-62)/150,.82,1.18);}else if(p.team===null)f.lg=.85;
 if(p.team!==null){f.con=p.contract<=1?.75-.15*clamp(((S&&S.week)||0)/38,0,1):p.contract===2?.93:1;}
 if(p.caps)f.int=p.caps>=15?1.1:1.04;
 if(p.inj>=8)f.inj=.85;
 if(p.req)f.req=.92;
 return f;
}
export function targetValue(p){const f=valueFactors(p);let v=baseValue(p);Object.values(f).forEach(x=>v*=x);return v;}
const roundV=v=>v>=1?Math.round(v*20)/20:Math.max(.005,Math.round(v*200)/200);
/** Fija el valor ya (al crear un jugador o al cambiar su media). */
export function setValueNow(p){p.value=roundV(targetValue(p));}
/** Cada jornada el valor se acerca a su objetivo: sube o baja poco a poco. Cada 6 jornadas se guarda la referencia para la tendencia. */
export function valueWeekly(){
 const mark=S.week%6===0;
 for(const p of Object.values(S.players)){
  const t=targetValue(p);p.value=roundV(p.value+(t-p.value)*.18);
  if(mark){p.vt=p.value;if(p.team===S.user||(S.short&&S.short.includes(p.id)))p.vh=(p.vh||[]).concat([[S.seasonN,S.week,p.value]]).slice(-14);}
 }
 if(S.week%6===5)marketReport();
}
/** Tendencia en % desde la última referencia (cada 6 jornadas). */
export const trend=p=>p.vt?Math.round((p.value/p.vt-1)*100):0;
/** Etiqueta ▲/▼ para tablas y fichas. */
export function trendTag(p){const t=trend(p);if(Math.abs(t)<4)return '';return `<span class="vtr ${t>0?'up':'dn'}" title="Su valor ha ${t>0?'subido':'bajado'} un ${Math.abs(t)}% en las últimas jornadas">${t>0?'▲':'▼'}${Math.abs(t)}%</span>`;}
/** Qué explica el valor de un jugador (para la ficha). */
export function valueWhy(p){
 const f=valueFactors(p),out=[];
 if(f.form>1.08)out.push(['Está en gran forma','good']);else if(f.form&&f.form<.92)out.push(['Mala temporada','bad']);
 if(f.pot>1.15)out.push(['Mucho margen de mejora','good']);
 if(f.con&&f.con<.8)out.push(['Le queda poco contrato','bad']);
 if(f.lg>1.1)out.push(['Juega en una liga top','good']);else if(f.lg<.85)out.push(['Liga de poco escaparate','bad']);
 if(f.int)out.push(['Internacional con su país','good']);
 if(f.inj)out.push(['Lesión larga','bad']);
 if(f.req)out.push(['Ha pedido salir','bad']);
 if(p.age>=30)out.push(['Edad: su valor baja cada año','bad']);
 return out;
}
/** «Bolsa de jugadores»: cada 6 jornadas, los que más suben y bajan en tu liga y en tu plantilla. */
function marketReport(){
 const lg=uLg(),ids=new Set(lgTeams(lg).map(t=>t.id)),ps=Object.values(S.players).filter(p=>ids.has(p.team)&&p.vt&&p.value>=.02);
 if(ps.length<10)return;const by=ps.map(p=>[p,(p.value/p.vt-1)]).sort((a,b)=>b[1]-a[1]);
 const up=by.slice(0,3).filter(x=>x[1]>.04),dn=by.slice(-3).reverse().filter(x=>x[1]<-.04);if(!up.length&&!dn.length)return;
 const f=([p,d])=>`${p.name} (${T(p.team).short}) ${d>0?'+':''}${Math.round(d*100)}% → ${money(p.value)}`;
 news(`Bolsa de jugadores de ${lgName(lg)}. ${up.length?'Suben: '+up.map(f).join('; ')+'.':''} ${dn.length?'Bajan: '+dn.map(f).join('; ')+'.':''}`,'',{cat:'mer',subj:'Bolsa de jugadores: quién sube y quién baja',quiet:true});
}

/* ======================= Caja de los clubes ======================= */
/** Dinero inicial de un club de la IA (igual que el tuyo, sin la dificultad). */
const startCash=t=>{const L=LG(t.lg);return r2(Math.max(unit(L.rep)*4,unit(L.rep)*(12+(t.rep-L.rep)*2)));};
/** Gestión de cada club: 'der' derrochador (gasta lo que no tiene), 'aus' austero, 'nor' normal. */
const gesOf=t=>t.ges||(t.ges=rnd()<.15?'der':rnd()<.25?'aus':'nor');
export const GES={der:'Derrochador',aus:'Austero',nor:'Prudente'};
export function initCash(){S.teams.forEach(t=>{if(t.cash==null){t.cash=startCash(t);t.cash0=t.cash;}gesOf(t);});}
/** Puntos de sanción de un club esta temporada (concurso de acreedores). */
export const dedOf=t=>t&&t.ded&&t.ded.s===S.seasonN?t.ded.n:0;
export const squadValue=tid=>squad(tid).reduce((a,p)=>a+p.value,0);
export const wageBillOf=tid=>squad(tid).reduce((a,p)=>a+(p.wage||0),0);
/** Dinero que se mueve en un traspaso entre dos clubes de la IA, o contigo. */
export function payFee(from,to,fee){if(!fee)return;initCash();if(from!=null&&T(from)&&from!==S.user){T(from).cash=r2(T(from).cash+fee);T(from).fees=r2((T(from).fees||0)+fee);}
 if(to!=null&&T(to)&&to!==S.user){T(to).cash=r2(T(to).cash-fee);T(to).fees=r2((T(to).fees||0)-fee);}}
/** Fin de temporada: cada club cobra según su puesto (los mismos premios que tú), su afición y sus ascensos; los descensos duelen. */
export function clubSeasonFinance(tabs){
 initCash();const rich=[],poor=[];
 S.leagues.forEach((L,li)=>{const tb=tabs[li],u=unit(L.rep),lowestL=!S.leagues.some(x=>x.c===L.c&&x.lv>L.lv);
  tb.forEach((row,i)=>{const t=T(row.id);if(!t||t.id===S.user)return;const pos=i+1;
   const prize=u*(21-pos)*.5+(L.lv>0&&pos<=3?u*12.5:0)+(L.lv===0&&pos===1?u*5:0);
   const op=u*(3+clamp((t.rep-L.rep)*.4,-2,6)+(rnd()*4-2))-(!lowestL&&pos>=18?u*4:0);
   const g=gesOf(t),wages=wageBillOf(t.id)*38*.095*(g==='der'?1.5:g==='aus'?.85:1); // parte de los sueldos que no cubren la tele y la taquilla
   const net=r2(prize+op-wages);t.last={season:seasonLabel(),pos,lg:L.id,prize:r2(prize),op:r2(op-wages),fees:r2(t.fees||0),start:t.cash0??t.cash};
   t.cash0=t.cash=r2(t.cash+net);t.fees=0;
   if(pos===1)rich.push(t);if(t.cash<-u*3)poor.push(t);if(t.cash<-u*6)t.broke=1;
   // la reputación sigue a los resultados
   const exp=tb.length/2+.5;t.rep=clamp(t.rep+(exp-pos)*.22,LG(t.lg).rep-25,LG(t.lg).rep+25);
  });});
 const my=LG(uLg());const champ=rich.find(t=>LG(t.lg).c===my.c&&LG(t.lg).lv===0);
 if(champ)news(`Informe económico: ${champ.name}, campeón de ${lgName(champ.lg)}, cierra la temporada con ${money(champ.cash)} en caja.`,'',{cat:'com',quiet:true});
 return poor;
}
/** Club en números rojos: vende a su mejor jugador al club que pueda pagarlo. */
export function crisisSales(poor){
 poor.forEach(t=>{if(t.broke)bankrupt(t);});
 poor.forEach(t=>{const sq=squad(t.id).sort((a,b)=>b.value-a.value),p=sq[0];if(!p||sq.length<=18)return;
  const buyers=S.teams.filter(b=>b.id!==t.id&&b.id!==S.user&&(b.cash||0)>p.value*1.2&&LG(b.lg).rep>=LG(t.lg).rep-5);if(!buyers.length)return;
  const b=buyers.sort((x,y)=>y.cash-x.cash)[0],fee=r2(p.value*(.85+rnd()*.2));setTeam(p,b.id);assignNum(p);p.contract=ri(2,4);p.wage=Math.max(p.wage,baseWage(p));payFee(t.id,b.id,fee);
  if(LG(t.lg).c===LG(uLg()).c||LG(b.lg).c===LG(uLg()).c)news(`Crisis en ${t.name}: con las cuentas en rojo, vende a ${p.name} a ${b.name} por ${money(fee)}.`,'bad',{cat:'mer',subj:`Venta forzosa: ${p.name}`});});
}

/** Quiebra: concurso de acreedores. Vende a sus mejores jugadores, pierde reputación, empieza la temporada con 10 puntos menos y pasa a gestión austera. */
export function bankrupt(t){
 const u=unit(LG(t.lg).rep),mine=LG(t.lg).c===LG(uLg()).c,sold=[];t.broke=0;
 squad(t.id).sort((a,b)=>b.value-a.value).slice(0,4).forEach(p=>{if(squad(t.id).length<=18)return;
  const buyers=S.teams.filter(b=>b.id!==t.id&&b.id!==S.user&&(b.cash||0)>p.value*.8);if(!buyers.length)return;
  const b=buyers.sort((x,y)=>y.cash-x.cash)[0],fee=r2(p.value*(.55+rnd()*.15));setTeam(p,b.id);assignNum(p);p.contract=ri(2,4);p.wage=Math.max(p.wage,baseWage(p));payFee(t.id,b.id,fee);sold.push(`${p.name} (${money(fee)})`);});
 squad(t.id).forEach(p=>{p.wage=r3(p.wage*.8);p.hap=clamp((p.hap??70)-15,0,100);});
 t.cash=Math.max(t.cash,r2(-u*2));t.cash0=t.cash;t.rep=clamp(t.rep-8,LG(t.lg).rep-25,LG(t.lg).rep+25);t.ges='aus';t.ded={n:10,s:S.seasonN+1};t.quiebras=(t.quiebras||0)+1;
 if(mine||t.id===S.user)news(`¡Quiebra! ${t.name} entra en concurso de acreedores: empezará la temporada con 10 puntos menos, rebaja sueldos un 20% y malvende a sus estrellas${sold.length?': '+sold.join(', '):''}.`,'bad',{cat:'com',subj:`Concurso de acreedores: ${t.name}`});
}
/** Tu club también puede quebrar: deuda muy grande al acabar la temporada. */
export function userBankruptcy(){
 if(S.user==null||S.jobless)return false;const u=unit(LG(uLg()).rep);if(S.budget>-u*6)return false;
 const t=T(S.user);t.ded={n:10,s:S.seasonN+1};t.quiebras=(t.quiebras||0)+1;t.rep=clamp(t.rep-6,LG(t.lg).rep-25,LG(t.lg).rep+25);
 squad(S.user).forEach(p=>{p.wage=r3(p.wage*.85);p.hap=clamp((p.hap??70)-12,0,100);});
 S.budget=r3(-u*2);
 news(`¡Concurso de acreedores! La deuda de ${t.name} es insostenible: el club empezará la próxima temporada con 10 puntos menos, se rebajan los sueldos un 15% y la directiva te vigilará de cerca.`,'bad',{cat:'dir',subj:'El club entra en concurso de acreedores'});
 if(S.mgr)S.mgr.conf=clamp(S.mgr.conf-25,0,100);return true;
}

/* ======================= Plantillas de la IA ======================= */
export const TARGET={POR:3,DEF:8,MED:8,DEL:5};
const grp=p=>GRP[p.sp]||p.pos;
/** Lo que más necesita un club: la línea con menos jugadores (o la más floja si están completas). */
export function needOf(tid){
 const sq=squad(tid),t=T(tid),gaps=Object.entries(TARGET).map(([g,n])=>{const v=sq.filter(p=>grp(p)===g).map(p=>p.ovr).sort((a,b)=>b-a),k=g==='POR'?1:g==='DEL'?2:4;
  const top=v.slice(0,k).reduce((a,b)=>a+b,0)/Math.max(1,Math.min(k,v.length))||0;return{g,miss:n-v.length,weak:t.rep-top};});
 return gaps.sort((a,b)=>(b.miss>0)-(a.miss>0)||b.miss-a.miss||b.weak-a.weak)[0];
}
/** Un club de la IA busca un jugador para la línea g con el dinero que tiene. Devuelve el fichado o null. */
export function aiBuy(t,g,all){
 initCash();const L=LG(t.lg),sq=squad(t.id),cur=sq.filter(p=>grp(p)===g).map(p=>p.ovr).sort((a,b)=>b-a),need=cur.length?cur[Math.min(cur.length-1,g==='POR'?0:2)]:0;
 const ge=gesOf(t),budget=Math.max(0,t.cash*(ge==='aus'?.4:.6)+(ge==='der'?unit(L.rep)*6:0)),maxOvr=t.rep+6;let best=null,bs=-1;all=all||Object.values(S.players);
 for(let i=0;i<180;i++){const p=all[Math.floor(rnd()*all.length)];if(!p||grp(p)!==g||p.team===t.id||p.team===S.user||p.loan||!S.players[p.id])continue;
  if(p.ovr<=need+1||p.ovr>maxOvr||p.age>32)continue;const fee=p.team===null?0:p.value*(p.contract<=1?.7:1.1);if(fee>budget)continue;
  if(p.team!==null&&LG(T(p.team).lg).rep>L.rep+4)continue;
  const sc=p.ovr-p.age*.25+(p.age<=23?(p.pot*10-p.ovr)*.2:0)-fee/Math.max(.05,unit(L.rep))*.6+rnd()*3;if(sc>bs){bs=sc;best=p;}}
 if(!best)return null;
 const from=best.team,fee=from===null?0:r2(best.value*(best.contract<=1?.7:1.1)*(.95+rnd()*.2));
 setTeam(best,t.id);assignNum(best);best.contract=ri(2,4);best.cl=r2(best.value*(2+rnd()*3));best.wage=Math.max(best.wage,baseWage(best));
 payFee(from,t.id,fee);return{p:best,from,fee};
}
/** Verano: cada club de la IA ajusta su plantilla (24 jugadores: 3 porteros, 8 defensas, 8 medios y 5 delanteros). */
export function aiSummerPlan(t,all){
 initCash();let sq=squad(t.id);
 // cantera: dos juveniles cada verano
 for(let k=0;k<2;k++){const p=genPlayer(pick(['DEF','MED','DEL','MED','DEF']),t.rep-9,t.id,[17,18]);assignNum(p);}
 // salen los que sobran: primero los peores y los más mayores (los jóvenes con futuro se quedan)
 sq=squad(t.id);if(sq.length>24){sq.sort((a,b)=>(a.ovr-a.age*.3+(a.age<=19?(a.pot*10-a.ovr)*.5:0))-(b.ovr-b.age*.3+(b.age<=19?(b.pot*10-b.ovr)*.5:0))).slice(0,sq.length-24).forEach(p=>{setTeam(p,null);p.contract=0;});}
 // cubre huecos: fichando si hay dinero; si no, con jugadores modestos
 for(let k=0;k<6;k++){const n=needOf(t.id);if(n.miss<=0)break;if(!aiBuy(t,n.g,all)){const p=genPlayer(n.g,t.rep-4,t.id);assignNum(p);}}
 // con caja de sobra, refuerza sus líneas más flojas (los ricos gastan más)
 const u=unit(LG(t.lg).rep),tries=(t.cash>u*10?3:t.cash>u*6?2:t.cash>u*3?1:0)+(gesOf(t)==='der'?2:0);
 for(let k=0;k<tries;k++){const n=needOf(t.id);if(n.weak<=1)break;const r=aiBuy(t,n.g,all);if(!r)break;
  const s2=squad(t.id);if(s2.length>25){const w=s2.filter(p=>p!==r.p).sort((a,b)=>(a.ovr-a.age*.3)-(b.ovr-b.age*.3))[0];if(w){setTeam(w,null);w.contract=0;}}}
}
