/* El Banquillo · talks.ts — Los jugadores piden reunirse contigo: minutos, sueldo, salir a un club grande o renovar.
 * Lo que les prometas se vigila: cumplir sube tu credibilidad; fallar enfada al jugador y a sus amigos del vestuario. */
// @ts-nocheck — usa el estado heredado S.
import {unlock} from './club';
import {clamp,money,pick,r3,rnd} from './core';
import {ROLES} from './data';
import {LG,PL,S,squad,uLg} from './state';
import {news} from './world';
import {baseWage} from './players';
import {minShare} from './squad';
import {wageCheck} from './clubplus';
import {langOf} from './tactics';

export const TOPICS={
 min:{n:'Quiere jugar más',q:p=>`Míster, no estoy jugando lo que esperaba. Como ${ROLES[p.role||'ro'].n.toLowerCase()} necesito más minutos.`},
 raise:{n:'Pide una subida de sueldo',q:p=>`Estoy rindiendo a buen nivel y creo que merezco cobrar más. Ahora gano ${money(p.wage)}/sem.`},
 big:{n:'Quiere dar el salto',q:p=>'Siento que estoy para jugar en un club más grande. Quiero saber qué planes tiene para mí.'},
 ren:{n:'Quiere saber si renovará',q:p=>'Me queda poco contrato y quiero saber si cuenta conmigo la próxima temporada.'},
};
/** Respuestas posibles para cada tema. */
export const ANSWERS={
 min:[['prom','Te prometo más minutos'],['earn','Tendrás que ganártelo en los entrenamientos'],['loan','Si quieres, te busco una cesión']],
 raise:[['yes','Te subo el sueldo un 20%'],['later','Lo hablaremos en unas semanas'],['no','Ahora mismo no hay dinero']],
 big:[['key','Eres clave en mi proyecto'],['sell','Si llega una buena oferta, te dejaré ir'],['stay','No te vas a ningún sitio']],
 ren:[['prom','Te prometo una renovación pronto'],['nego','Sentémonos ya a negociar'],['wait','Lo veremos al final de temporada']],
};
export const PROM_N={min:'Más minutos',ren:'Renovación',raise:'Subida de sueldo',sell:'Dejarle salir si llega una buena oferta',loan:'Buscarle una cesión'};

/** Credibilidad del míster con el vestuario (0-100): sube al cumplir promesas y baja al romperlas. */
export const cred=()=>S.cred??70;
const credMult=()=>clamp(cred()/70,.4,1.3);
const hapAdd=(p,v)=>{p.hap=clamp((p.hap??70)+v,0,100);};

function topicFor(p){
 if(p.loan||p.prom)return null;
 const tg=S.tg||0,R=ROLES[p.role||'ro'],avg=p.st&&p.st.pj?p.st.rs/p.st.pj:0,my=LG(uLg()).rep;
 if(p.contract<=1&&S.week>=8&&rnd()<.5)return 'ren';
 if(tg>=6&&minShare(p)<R.min-.1&&(p.hap??70)<68)return 'min';
 if(p.st&&p.st.pj>=8&&avg>=7&&p.wage<baseWage(p)*.95)return 'raise';
 if(p.per==='amb'&&p.ovr>my+8&&(p.hap??70)<75)return 'big';
 return null;
}
/** Cada jornada: algún jugador puede pedir una reunión. Si la ignoras dos jornadas, se lo toma mal. */
export function meetWeekly(){
 const m=S.meet;
 if(m){const p=PL(m.id);if(!p||p.team!==S.user){S.meet=null;}else if(S.week-m.wk>=2){hapAdd(p,-6);news(`${p.name} pidió hablar contigo y no le recibiste. Está molesto.`,'bad',{cat:'pla',from:p.name,subj:'No me has recibido'});S.meet=null;}return;}
 if(rnd()>.22)return;
 const c=squad(S.user).filter(p=>!p.loan&&(p.mt==null||S.week-p.mt>=8||p.mt>S.week)).map(p=>[p,topicFor(p)]).filter(x=>x[1]);if(!c.length)return;
 const [p,t]=pick(c);p.mt=S.week;S.meet={id:p.id,topic:t,wk:S.week};
 news(`${p.name} quiere hablar contigo: ${TOPICS[t].n.toLowerCase()}.`,'',{cat:'pla',from:p.name,subj:`Reunión: ${TOPICS[t].n.toLowerCase()}`,act:[{l:'Reunirse',a:'meet'}]});
}
/** Responde en la reunión. Devuelve [mensaje, 'ok'|'no'|''] y, si hace falta, una acción siguiente. */
export function meetAnswer(k){
 const m=S.meet;if(!m)return['No hay ninguna reunión pendiente.',''];const p=PL(m.id);if(!p){S.meet=null;return['',''];}
 const t=m.topic,cm=credMult(),loyal=p.per==='lea'||p.per==='pro';let r;
 if(t==='min'){
  if(k==='prom'){const order=['su','jo','ro','ti','cl'],i=order.indexOf(p.role||'ro');p.role=order[Math.min(4,Math.max(i+1,2))];hapAdd(p,10*cm);p.prom={type:'min',until:S.week+8};r=[`Le prometes más minutos: ahora es ${ROLES[p.role].n.toLowerCase()}. Tienes 8 jornadas para cumplir.`,'ok'];}
  else if(k==='earn'){if(loyal||rnd()<.45*cm){hapAdd(p,4);r=['Lo acepta: entrenará más fuerte para ganarse el puesto.','ok'];}else{hapAdd(p,-7);r=['No le convence: cree que no cuentas con él.','no'];}}
  else{hapAdd(p,5);p.prom={type:'loan',until:loanDeadline()};r=['Le parece bien salir cedido. Prométele una cesión antes de que cierre el mercado (desde su ficha).','ok'];}
 }else if(t==='raise'){
  if(k==='yes'){const nw=Math.max(p.wage+.0005,Math.round(p.wage*1.2*2000)/2000),e=wageCheck(nw,p.wage);if(e)return[e,'no'];p.wage=nw;hapAdd(p,12);jealousy(p);r=[`Le subes el sueldo a ${money(nw)}/sem. Está encantado.`,'ok'];}
  else if(k==='later'){hapAdd(p,3*cm);p.prom={type:'raise',until:S.week+10,w0:p.wage};r=['Acepta esperar. Tienes 10 jornadas para subirle el sueldo (renovando su contrato).','ok'];}
  else{hapAdd(p,-10);if(p.per==='amb'&&p.hap<40&&!p.req){p.req=1;r=['Se enfada y pide salir del club.','no'];}else r=['No le gusta, pero lo entiende.','no'];}
 }else if(t==='big'){
  if(k==='key'){if(['cl','ti'].includes(p.role)&&rnd()<.8*cm){hapAdd(p,8);r=['Se siente valorado y se queda tranquilo.','ok'];}else{hapAdd(p,-4);r=['No se lo cree: no juega como un jugador clave.','no'];}}
  else if(k==='sell'){hapAdd(p,10);p.prom={type:'sell',until:S.week+38,v:p.value};r=['Le alivia saberlo. Si rechazas una buena oferta por él, romperás tu promesa.','ok'];}
  else{hapAdd(p,-12);if(p.hap<30&&!p.req)p.req=1;r=['No le ha gustado nada.'+(p.req?' Pide salir del club.':''),'no'];}
 }else{
  if(k==='prom'){hapAdd(p,8*cm);p.prom={type:'ren',until:S.week+6};r=['Le prometes renovar. Tienes 6 jornadas para cumplirlo.','ok'];}
  else if(k==='nego'){hapAdd(p,5);S.meet=null;return['Os sentáis a negociar su renovación.','ok','renew'];}
  else{hapAdd(p,p.per==='amb'?-8:-3);r=['Le deja con dudas sobre su futuro.','no'];}
 }
 S.meet=null;return r;
}
const loanDeadline=()=>S.week<=5?5:S.week<=23?23:S.week+38-S.week%38+5;
/** Si subes mucho a uno, los que rinden igual y cobran menos se quejan un poco. */
function jealousy(p){squad(S.user).filter(x=>x!==p&&!x.loan&&x.ovr>=p.ovr&&x.wage<p.wage).forEach(x=>hapAdd(x,-3));}

/** Resultado de una promesa: cumplida o rota. Afecta al jugador, al vestuario y a tu credibilidad. */
export function promResult(p,ok,why){
 const T0=PROM_N[p.prom.type]||'promesa';p.prom=null;
 if(ok){S.promKept=(S.promKept||0)+1;if(S.promKept>=10)unlock('palabra');hapAdd(p,8);S.cred=clamp(cred()+4,0,100);news(`${p.name} está satisfecho: cumpliste tu promesa (${T0.toLowerCase()}).`,'good',{cat:'pla',quiet:true});return;}
 hapAdd(p,-15);S.cred=clamp(cred()-12,0,100);S.chem=clamp((S.chem??60)-3,20,100);
 const mates=squad(S.user).filter(x=>x!==p&&langOf(x)===langOf(p));mates.forEach(x=>hapAdd(x,-4));
 news(`${p.name} se siente engañado: no cumpliste tu promesa (${T0.toLowerCase()})${why?' — '+why:''}. ${mates.length?'Sus compañeros más cercanos también se molestan. ':''}Tu credibilidad en el vestuario baja.`,'bad',{cat:'pla',from:p.name,subj:'Promesa rota'});
}
/** Comprueba las promesas que vencen esta jornada (se llama desde la rutina semanal de ánimo). */
export function checkProm(p){
 const pr=p.prom;if(!pr||S.week<pr.until)return;
 if(pr.type==='ren')return promResult(p,p.contract>1);
 if(pr.type==='min')return promResult(p,minShare(p)>=ROLES[p.role||'ro'].min-.05);
 if(pr.type==='raise')return promResult(p,p.wage>pr.w0*1.04);
 if(pr.type==='loan')return promResult(p,false,'no le buscaste cesión');
 if(pr.type==='sell'){p.prom=null;return;}
}
/** Al rechazar una oferta: si le prometiste dejarle salir y la oferta era buena, rompes la promesa. */
export function onOfferRejected(p,price){if(p.prom&&p.prom.type==='sell'&&price>=p.value*.9)promResult(p,false,`rechazaste ${money(price)} por él`);}
/** Al cederlo: cumple la promesa de cesión. */
export function onLoanedOut(p){if(p.prom&&p.prom.type==='loan')promResult(p,true);}
/** Promesas activas de tu plantilla. */
export const activeProms=()=>squad(S.user).filter(p=>p.prom).map(p=>({p,type:p.prom.type,left:Math.max(0,p.prom.until-S.week)}));
