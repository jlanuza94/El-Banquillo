/* El Banquillo · club.js — Negocio del club, directiva, prensa y logros. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {nsAttMult} from './extras2';
import {mail,markKey} from './inbox';
import {clamp,money,r2,r3,rnd,shuffle} from './core';
import {LG,PL,S,T,seasonLabel,squad,uLg,unit} from './state';
import {news} from './world';
import {CONTS} from './competitions';
import {academyIntake} from './academy';
import {toast} from './views/common';
export const SPONSORS=['Banco Meridiano','Seguros Atalaya','Telecom Brisa','Autos Vértice','Energía Solaris','Café Altura','Aerolínea Nimbo','Supermercados Plaza','Bebidas Rayo','Constructora Pilar','Lácteos Valle','Tecnología Órbita','Hoteles Mirador','Neumáticos Senda','Moda Alba','Logística Faro'];
export const priceBase=lg=>Math.round(8+unit(LG(lg).rep)*50);
export function initClub(t){const L=LG(t.lg),cap=Math.round(clamp(1500+(L.rep-40)*360+(t.rep-L.rep)*250,800,90000)/100)*100;
 S.club={cap,price:priceBase(t.lg),fans:Math.round(cap*(.8+rnd()*.15)),mood:60,fac:{ent:1,can:1,med:1},build:null,lastAtt:0};S.club.abo=aboBase(t.lg);S.sponsor=null;genSponsors();sellAbonos(true);}
export function genSponsors(){const u=unit(LG(uLg()).rep),n=shuffle(SPONSORS.slice());S.spOffers=[{name:n[0],type:'fijo',weekly:r3(u*.25),win:0,obj:0},{name:n[1],type:'var',weekly:r3(u*.12),win:r3(u*.28),obj:0},{name:n[2],type:'obj',weekly:r3(u*.16),win:0,obj:r2(u*10)}];}
export const spDesc=o=>o.type==='fijo'?`${money(o.weekly)}/sem fijos, pase lo que pase.`:o.type==='var'?`${money(o.weekly)}/sem + ${money(o.win)} por cada victoria de liga.`:`${money(o.weekly)}/sem + ${money(o.obj)} si cumples el objetivo de la directiva.`;
export function attendance(){const C=S.club,p0=priceBase(uLg()),d=nsAttMult()*C.fans*(1+(C.mood-50)/150)*clamp(1.45-.45*C.price/p0,.15,1.4);return Math.round(Math.min(C.cap,Math.max(C.socios||0,d)));}
/* ---------- Abonos, tienda y afición ---------- */
/** Precio normal del abono de temporada: unas 17 entradas sueltas (sale más barato que ir a los 19 partidos de casa). */
export const aboBase=lg=>priceBase(lg)*17;
/** Cuántos socios sacarían el abono con el precio y el ánimo actuales. */
export function sociosFor(abo){const C=S.club,b=aboBase(uLg()),share=.5*clamp(1.6-.6*abo/b,.15,1.3)*(1+(C.mood-50)/150);return Math.round(Math.min(C.cap*.85,C.fans*share));}
/** En verano se venden los abonos: el dinero entra de golpe y esos asientos quedan ocupados toda la temporada. */
export function sellAbonos(quiet){const C=S.club;if(!C.abo)C.abo=aboBase(uLg());C.socios=sociosFor(C.abo);const inc=r3(C.socios*C.abo/1e6);C.aboInc=inc;if(C.socios>=10000)unlock('socios');if(quiet)return 0; // al llegar a un club, los abonos ya estaban vendidos (van en el presupuesto inicial)
 S.budget=r3(S.budget+inc);
 if(!quiet)news(`Campaña de abonos: ${C.socios.toLocaleString('es')} socios a ${C.abo}€. Ingresas ${money(inc)}.`,'good',{cat:'dir',subj:'Campaña de abonos'});return inc;}
/** Tienda del club: camisetas y recuerdos. Vende más con más aficionados, buen ánimo y estrellas en la plantilla. */
export function shopWeekly(){const C=S.club;if(!C)return 0;const my=LG(uLg()).rep,stars=squad(S.user).filter(p=>p.ovr>=my+10).length;return r3(C.fans*(.35+C.mood/100)*.45*(1+Math.min(.5,stars*.08))/1e6);}
/** Cosas que hacen reaccionar a la afición (fichajes, ventas de ídolos…). */
export function fansReact(d,why){const C=S.club;if(!C)return;C.mood=clamp(C.mood+d,0,100);if(why)news(`Afición: ${why}`,d>0?'good':'bad',{cat:'dir',quiet:true});}
export const facCost=k=>{const l=S.club.fac[k];return r2(unit(LG(uLg()).rep)*8*l);};
export const facMaint=()=>r3((S.club.fac.ent+S.club.fac.can+(S.club.fac.med||1)-3)*unit(LG(uLg()).rep)*.02);
export const FAC_N={ent:'Ciudad deportiva',can:'Academia de cantera',med:'Centro médico'};
export const seatCost=()=>.0006+unit(LG(uLg()).rep)*.004;
export function clubWeekly(won,lost){
 const C=S.club;C.mood=clamp(C.mood+(won?3:lost?-3:0)+(55-C.mood)*.05-(C.price>priceBase(uLg())*1.3?1:0),0,100);
 if(C.build&&S.week+1>=C.build.until)finishBuild();
 if(C.mood<22&&rnd()<.3){S.mgr.conf=clamp(S.mgr.conf-2,0,100);news('Pañuelos en la grada: la afición está muy descontenta y la directiva toma nota.','bad',{cat:'dir',subj:'Protesta de la afición'});}
 else if(C.mood>85&&rnd()<.2){squad(S.user).forEach(p=>p.hap=clamp((p.hap??70)+1,0,100));news('La afición está entusiasmada: el ambiente en el estadio empuja al equipo.','good',{cat:'dir',quiet:true});}
}
export function finishBuild(){const C=S.club,b=C.build;if(!b)return;if(b.type==='cap'){C.cap+=b.add;news(`Terminan las obras: el estadio ya tiene ${C.cap.toLocaleString('es')} asientos.`,'good');}else{C.fac[b.type]=(C.fac[b.type]||1)+1;news(`${FAC_N[b.type]}: ya es de nivel ${C.fac[b.type]}.`,'good');if(['ent','can','med'].every(k=>(C.fac[k]||1)>=5))unlock('ciudad');}C.build=null;}
export function startBuild(type,add){
 const C=S.club;if(C.build)return toast('Ya hay unas obras en marcha.');
 let cost,weeks;if(type==='cap'){cost=r2(add*seatCost());weeks=10;}else{if(C.fac[type]>=5)return toast('Ya está al nivel máximo.');cost=facCost(type);weeks=8;}
 if(cost>S.budget)return toast(`No tienes presupuesto: cuesta ${money(cost)}.`);
 S.budget=r3(S.budget-cost);C.build={type,add:add||0,until:S.week+weeks};news(`Empiezan las obras (${money(cost)}). Terminarán en ${weeks} jornadas.`,'good');toast('Obras en marcha.');
}
export const BREQ={money:{n:'Más dinero para fichajes',min:60,d:'La directiva te da un extra para el mercado.'},stad:{n:'Que el club pague una ampliación del estadio',min:55,d:'Solo si el estadio se está llenando (90% o más).'},fac:{n:'Mejorar una instalación gratis',min:75,d:'La directiva paga el siguiente nivel de la instalación más baja.'},youth:{n:'Más inversión en la cantera',min:50,d:'Llegan 2 juveniles más a la academia ahora.'},pat:{n:'Pedir paciencia',min:0,d:'Si la confianza está baja, la directiva te da algo de margen. A cambio, tu reputación baja un poco.'}};
export function boardAsk(k){
 S.breq=S.breq&&S.breq.s===S.seasonN?S.breq:{s:S.seasonN,used:{}};if(S.breq.used[k])return['Ya lo pediste esta temporada.','no'];S.breq.used[k]=1;
 const M=S.mgr,u=unit(LG(uLg()).rep),C=S.club;
 if(k==='pat'){if(M.conf>=40)return['La directiva dice que ahora mismo no hace falta: confía en ti.','no'];M.conf=clamp(M.conf+10,0,100);M.rep=clamp(M.rep-2,0,100);return['Te dan margen: la confianza sube 10 puntos.','ok'];}
 if(M.conf<BREQ[k].min){M.conf=clamp(M.conf-2,0,100);return[`La directiva lo rechaza: primero quiere ver resultados (confianza mínima ${BREQ[k].min}).`,'no'];}
 if(k==='money'){const g=r2(u*12*M.conf/100);S.budget=r3(S.budget+g);news(`La directiva aporta ${money(g)} extra para fichajes.`,'good');return[`Aprobado: ${money(g)} más para fichajes.`,'ok'];}
 if(k==='stad'){if(C.build)return['Ya hay obras en marcha.','no'];if(C.lastAtt<C.cap*.9){delete S.breq.used[k];return['El estadio no se llena: la directiva no ve necesaria la ampliación.','no'];}const add=Math.round(C.cap*.15/50)*50;C.build={type:'cap',add,until:S.week+10};news(`La directiva paga la ampliación del estadio: ${add.toLocaleString('es')} asientos más.`,'good');return['Aprobado: empiezan las obras, pagadas por el club.','ok'];}
 if(k==='fac'){if(C.build)return['Ya hay obras en marcha.','no'];const t=['ent','can','med'].sort((a,b)=>(C.fac[a]||1)-(C.fac[b]||1))[0];if(C.fac[t]>=5)return['Las instalaciones ya están al máximo.','no'];C.build={type:t,add:0,until:S.week+8};return[`Aprobado: la directiva paga la mejora: ${FAC_N[t].toLowerCase()}.`,'ok'];}
 if(k==='youth'){const g=academyIntake(2);return[g.length?`Llegan a la cantera: ${g.join(', ')}.`:'La cantera está llena.',g.length?'ok':'no'];}
}
export function makePress(m){
 if(rnd()>.55||m.ref.k==='fr')return;const us=m.us,o=us==='h'?'a':'h',my=m.score[us],op=m.score[o],opp=T(m[o]);
 const sq=squad(S.user),unhappy=sq.find(p=>p.req||p.hap<28),offer=Object.entries(S.offers).find(([id,x])=>x.incoming&&PL(id)&&PL(id).team===S.user);
 const worst=Object.keys(m.rat||{}).filter(id=>PL(id)&&PL(id).team===S.user).sort((a,b)=>m.rat[a]-m.rat[b])[0];
 let q;
 if(unhappy&&rnd()<.6)q={q:`Se dice que ${unhappy.name} no está a gusto. ¿Qué tiene que decir?`,o:[['Es muy importante para nosotros',{pl:[unhappy.id,8],team:1}],['Nadie es imprescindible',{pl:[unhappy.id,-10],board:2}],['No hablo de casos individuales',{}]]};
 else if(offer&&rnd()<.6){const p=PL(offer[0]);q={q:`Hay ofertas por ${p.name}. ¿Está en venta?`,o:[['No está en venta',{pl:[p.id,6],fans:3}],['Escucharemos ofertas',{pl:[p.id,-6],board:2}],['Ya veremos qué pasa',{}]]};}
 else if(my>op)q={q:`Victoria ante ${opp.name}. ¿El equipo está para pelear por todo?`,o:[['Vamos partido a partido',{team:2,board:1}],['¡Claro que sí, a por todo!',{fans:6,team:3,board:-1}],['El rival nos lo puso fácil',{fans:-2,team:1,rival:[opp.id,.03]}]]};
 else if(my<op)q={q:`Derrota ante ${opp.name}. ¿Qué ha fallado?`,o:[['La culpa es mía',{team:3,board:-2}],[worst?`${PL(worst).name} no ha estado a la altura`:'Algunos no han estado a la altura',{team:-3,board:1,fans:2,pl:worst?[worst,-10]:null}],['El árbitro nos ha perjudicado',{fans:4,board:-1,team:1}]]};
 else q={q:`Empate ante ${opp.name}. ¿Está satisfecho?`,o:[['Es un punto valioso',{team:1}],['Merecimos ganar',{fans:2,team:2}],['Hay que mejorar mucho',{team:-2,board:2}]]};
 S.press=q;mail(`Los periodistas te esperan antes del próximo partido: «${q.q}»`,{cat:'pre',subj:'Rueda de prensa',key:'press',act:[{l:'Responder',a:'view',v:'inicio'}]});
}
export function answerPress(i){
 const q=S.press;if(!q)return;const e=q.o[i][1],sq=squad(S.user),out=[];
 if(e.team){sq.forEach(p=>p.hap=clamp(p.hap+e.team,0,100));out.push(e.team>0?'la plantilla lo agradece':'la plantilla no se lo toma bien');}
 if(e.fans&&S.club){S.club.mood=clamp(S.club.mood+e.fans,0,100);out.push(e.fans>0?'a la afición le gusta':'la afición se molesta');}
 if(e.board){S.mgr.conf=clamp(S.mgr.conf+e.board,0,100);out.push(e.board>0?'la directiva lo valora':'la directiva prefiere más prudencia');}
 if(e.pl&&PL(e.pl[0])){const p=PL(e.pl[0]);p.hap=clamp(p.hap+e.pl[1],0,100);out.push(`${p.name} ${e.pl[1]>0?'se siente respaldado':'se siente señalado'}`);}
 if(e.rival){S.rivalBoost={team:e.rival[0],v:e.rival[1],until:S.seasonN};out.push(`${T(e.rival[0]).name} se lo apunta para el próximo partido`);}
 news(`Prensa: «${q.o[i][0]}». ${out.length?out.join(', ')+'.':'Sin consecuencias.'}`);S.press=null;markKey('press');
}
export const ACH={desc:['Lo descubrí yo','Un jugador que fichaste o subiste de la cantera con poca media se convierte en estrella (+1.5 de media y 7.0 o más).'],asc:['Primer ascenso','Consigue tu primer ascenso.'],cima:['De abajo a la cima','Llega a Primera empezando en la última división.'],liga:['Campeón de liga','Gana cualquier liga.'],liga1:['Campeón de Primera','Gana una liga de Primera División.'],copa:['Rey de copas','Gana una copa nacional.'],cont:['Campeón continental','Gana la Liga de Campeones o la Copa Libertad.'],cwc:['Campeón del mundo','Gana el Mundial de Clubes.'],tri:['Triplete','Liga de Primera, copa y continental en la misma temporada.'],inv:['Invicto','Termina una liga sin perder.'],manita:['Manita','Gana un partido por 5 goles o más.'],casa:['Hecho en casa','Alinea a 5 canteranos en el mismo once.'],joven:['Debut precoz','Haz debutar a un jugador de 17 años o menos.'],gang:['Ojo de halcón','Vende a un jugador por 5 veces lo que pagaste.'],neg:['Fábrica de talento','Vende a un canterano por 2M o más.'],fiel:['Fiel al escudo','Cumple 10 temporadas en el mismo club.'],millo:['Club millonario','Llega a 50M de presupuesto.'],lleno:['Fortaleza','Llena tu estadio en 10 partidos de una temporada.'],nomad:['Trotamundos','Entrena en 3 países distintos.'],selec:['Seleccionador','Dirige a una selección nacional.'],ntcamp:['Gloria con tu país','Gana un torneo de selecciones como seleccionador.'],socios:['Marea de socios','Consigue 10.000 socios con abono.'],ciudad:['Instalaciones de élite','Lleva las tres instalaciones al nivel 5.'],palabra:['Hombre de palabra','Cumple 10 promesas a tus jugadores.'],medal5:['Coleccionista','Consigue 5 medallas en los retos.'],oro:['Medalla de oro','Consigue un reto de oro.']};
export function unlock(k){S.ach=S.ach||{};if(S.ach[k]||!ACH[k])return;S.ach[k]=seasonLabel();news(`Logro desbloqueado: ${ACH[k][0]}.`,'good');toast(`Logro: ${ACH[k][0]}`);}
export function achSeason(sm){
 if(sm.up)unlock('asc');if(sm.champ)unlock('liga');if(sm.champ&&sm.L.lv===0)unlock('liga1');
 if(sm.up&&sm.L.lv===1&&S.startLow)unlock('cima');
 if(sm.tb[sm.pos-1].p===0)unlock('inv');
 const lbl=seasonLabel(),ts=S.titles.filter(x=>x.season===lbl).map(x=>x.name);
 if(sm.champ&&sm.L.lv===0&&ts.some(n=>n.startsWith('Copa de'))&&ts.some(n=>CONTS.some(C=>C.n===n)))unlock('tri');
 if(S.mgr.joinN!=null&&S.seasonN-S.mgr.joinN+1>=10)unlock('fiel');
 if((S.fullHomes||0)>=10)unlock('lleno');S.fullHomes=0;
}
