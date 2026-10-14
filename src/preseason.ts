/* El Banquillo · preseason.ts — La pretemporada: unas 4 semanas para revisar la plantilla, montar el once,
 * reforzarse en el mercado y jugar amistosos. Tu segundo te prepara un informe y te propone qué fichar. */
// @ts-nocheck — usa el estado heredado S.
import {GRP,SPN} from './data';
import {LG,S,T,lgTeams,squad,uLg} from './state';
import {strength} from './players';
import {slotRate} from './tactics';
import {FIRST_LG} from './calendar';
import {news} from './world';

export const PRE_FR=4,PRE_GAP=3;
/** ¿Estamos en pretemporada? */
export const inPre=()=>!!S.pre&&S.week===0&&S.ci===0&&(S.day??0)<FIRST_LG;
/** Días que faltan para la primera jornada. */
export const daysToLeague=()=>Math.max(0,FIRST_LG-(S.day??0));
/** Un amistoso como mucho cada 3 días. */
export const friendlyWait=()=>Math.max(0,(S.pre.last??-9)+PRE_GAP-(S.day??0));
export function markPre(k){if(inPre()){S.pre.seen=S.pre.seen||{};S.pre.seen[k]=1;}}
const KEY=['POR','DFC','LD','LI','MC','MCD','MCO','MD','MI','ED','EI','DC'];
/** Informe de pretemporada de tu segundo. */
export function preReport(){
 const sq=squad(S.user).filter(p=>!p.loan),top=sq.map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11),avg=top.reduce((a,b)=>a+b,0)/Math.max(1,top.length)/10;
 const L=lgTeams(uLg()).map(t=>[t.id,strength(t.id)]).sort((a,b)=>b[1]-a[1]),rank=L.findIndex(x=>x[0]===S.user)+1,n=L.length;
 const pos=KEY.map(sp=>{const r=sq.map(p=>slotRate(p,sp)/10).sort((a,b)=>b-a),nat=sq.filter(p=>p.sp===sp||(p.alt||[]).includes(sp)).length;return{sp,best:r[0]||0,second:r[1]||0,nat};});
 const weak=pos.filter(x=>x.best<avg-.6).sort((a,b)=>a.best-b.best),thin=pos.filter(x=>!weak.includes(x)&&x.nat<(x.sp==='DFC'||x.sp==='MC'?3:x.sp==='POR'?2:1));
 // quién sobra: los peores de la plantilla que ya no van a mejorar, y jóvenes que necesitan minutos
 const byQ=sq.slice().sort((a,b)=>a.ovr-b.ovr),sell=byQ.filter(p=>p.age>=27&&p.ovr/10<avg-1.1).slice(0,3),loan=sq.filter(p=>p.age<=21&&p.ovr/10<avg-.9&&p.pot*10>p.ovr+5).slice(0,3);
 const exp=sq.filter(p=>p.contract<=1);
 const sign=weak.slice(0,2).map(x=>x.sp);if(sign.length<2)thin.slice(0,2-sign.length).forEach(x=>sign.push(x.sp));
 return {avg,rank,n,weak,thin,sell,loan,exp,sign,size:sq.length};
}
/** Al empezar la pretemporada: el informe llega a la bandeja. */
export function preWelcome(){
 if(S.user==null||S.jobless||!S.pre)return;const R=preReport();
 const lvl=R.rank<=3?'de los más fuertes':R.rank<=Math.ceil(R.n/2)?'de la mitad alta':R.rank<=R.n-3?'de la mitad baja':'de los más flojos';
 news(`Empieza la pretemporada. Tu segundo ha repasado la plantilla: el once es ${lvl} de la liga (${R.rank}º de ${R.n} por nivel).${R.sign.length?` Recomienda fichar ${R.sign.map(sp=>(SPN[sp]||sp).toLowerCase()).join(' y ')}.`:''}${R.sell.length?` Sobran ${R.sell.length}.`:''} Tienes ${daysToLeague()} días y ${PRE_FR} amistosos para preparar la temporada.`,'',
  {cat:'sta',subj:'Informe de pretemporada',act:[{l:'Ver informe',a:'pre-rep'}]});
}
/** El informe completo (ventana). */
export function preReportHTML(esc,nameBtn,PL){
 const R=preReport(),li=a=>a.length?a.join(''):'<li class="muted">Nada que destacar.</li>';
 return `<div class="eyebrow">Informe de pretemporada · tu segundo entrenador</div><h2 style="margin:4px 0 6px">Así está tu plantilla</h2>
 <p style="margin:0 0 8px">Tu once tiene una media de <b>${R.avg.toFixed(1)}</b>: es el <b>${R.rank}º de ${R.n}</b> de la liga por nivel. ${R.size} jugadores en la plantilla.</p>
 <h3>Puntos débiles</h3><ul class="ttips">${li(R.weak.slice(0,4).map(x=>`<li><b>${SPN[x.sp]||x.sp}</b>: tu mejor ahí rinde ${x.best.toFixed(1)}, por debajo del resto del once.</li>`))}</ul>
 ${R.thin.length?`<h3>Poca profundidad</h3><ul class="ttips">${R.thin.slice(0,4).map(x=>`<li><b>${SPN[x.sp]||x.sp}</b>: solo ${x.nat} jugador${x.nat===1?'':'es'} natural${x.nat===1?'':'es'}; una lesión te deja sin recambio.</li>`).join('')}</ul>`:''}
 <h3>Qué fichar</h3>${R.sign.length?`<div class="chips">${R.sign.map(sp=>`<button class="btn sm primary" data-a="pre-buy" data-v="${sp}">Buscar ${(SPN[sp]||sp).toLowerCase()}</button>`).join('')}</div>`:'<p class="small muted">La plantilla está completa: ficha solo si llega una ganga.</p>'}
 <h3>Sobran o conviene ceder</h3><ul class="ttips">${li(R.sell.map(p=>`<li>${nameBtn(p)} (${p.age} años, ${(p.ovr/10).toFixed(1)}): no va a contar; véndelo o cédelo para liberar sueldo.</li>`).concat(R.loan.map(p=>`<li>${nameBtn(p)} (${p.age} años): necesita minutos; una cesión le haría crecer.</li>`)))}</ul>
 <h3>Contratos que acaban</h3><ul class="ttips">${li(R.exp.slice(0,6).map(p=>`<li>${nameBtn(p)} (${p.age} años, ${(p.ovr/10).toFixed(1)}): renuévalo o véndelo antes de que se vaya libre.</li>`))}</ul>`;
}
/** Lista de tareas de la pretemporada (para Inicio). */
export function preTasks(){
 const s=(S.pre&&S.pre.seen)||{},played=PRE_FR-S.pre.left;
 return [['rep','Leer el informe de tu segundo',!!s.rep,'pre-rep',null],['pl','Revisar la plantilla',!!s.pl,'view','plantilla'],['tac','Montar el once y la táctica',!!s.tac,'view','tacticas'],
  ['mk','Buscar refuerzos en el mercado',!!s.mk,'view','mercado'],['fr',`Jugar amistosos (${played} de ${PRE_FR})`,played>=2,null,null]];
}

/** Mercado de invierno: aviso una semana antes (con lo que recomienda tu segundo) y cuando abre. */
export function winterWeekly(winRounds,inWindow,windowTxt){
 if(S.user==null||S.jobless)return;const w=winRounds();
 if(!inWindow()&&S.week===w[1]-1&&S.winPre!==S.seasonN){S.winPre=S.seasonN;const R=preReport();
  news(`La semana que viene abre el mercado de invierno. ${R.sign.length?`Tu segundo recomienda reforzar ${R.sign.map(sp=>(SPN[sp]||sp).toLowerCase()).join(' y ')}.`:'La plantilla está bien cubierta.'}${R.exp.length?` Ojo: ${R.exp.length} jugador${R.exp.length>1?'es acaban':' acaba'} contrato en junio.`:''}`,'',{cat:'mer',subj:'Se acerca el mercado de invierno',act:[{l:'Ver informe',a:'pre-rep'}]});}
 if(inWindow()&&S.week>=w[1]&&S.winOpen!==S.seasonN){S.winOpen=S.seasonN;news(`¡Abre el mercado de invierno! ${windowTxt()}`,'good',{cat:'mer',subj:'Abre el mercado de invierno',act:[{l:'Ir al mercado',a:'view',v:'mercado'}]});}
}
