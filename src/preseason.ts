/* El Banquillo · preseason.ts — La pretemporada: unas 4 semanas para revisar la plantilla, montar el once,
 * reforzarse en el mercado y jugar amistosos. Tu segundo te prepara un informe y te propone qué fichar. */
// @ts-nocheck — usa el estado heredado S.
import {GRP,SPN} from './data';
import {LG,S,T,lgTeams,squad,uLg,unit} from './state';
import {money,pick,rnd} from './core';
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
{ptInvite(pick,unit,rnd);if(S.ptour)news(`Invitación: el ${S.ptour.n} te invita a jugarlo con ${S.ptour.teams.slice(1).map(id=>T(id).name).join(', ')}. Semifinal y final; el campeón cobra ${money(S.ptour.prize[0])}, el finalista ${money(S.ptour.prize[1])}.`,'',{cat:'com',subj:`Invitación: ${S.ptour.n}`,act:[{l:'Participar',a:'pt-join',v:'yes'},{l:'No, gracias',a:'pt-join',v:'no'}],once:'pt'});}
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
  ['mk','Buscar refuerzos en el mercado',!!s.mk,'view','mercado'],['fr',`Jugar amistosos (${played} de ${PRE_FR})`,played>=2,null,null],['int',`Partido interno: titulares contra suplentes (${S.pre.intN||0} de ${INT_MAX})`,(S.pre.intN||0)>=1,null,null]];
}

/** Mercado de invierno: aviso una semana antes (con lo que recomienda tu segundo) y cuando abre. */
export function winterWeekly(winRounds,inWindow,windowTxt){
 if(S.user==null||S.jobless)return;const w=winRounds();
 if(!inWindow()&&S.week===w[1]-1&&S.winPre!==S.seasonN){S.winPre=S.seasonN;const R=preReport();
  news(`La semana que viene abre el mercado de invierno. ${R.sign.length?`Tu segundo recomienda reforzar ${R.sign.map(sp=>(SPN[sp]||sp).toLowerCase()).join(' y ')}.`:'La plantilla está bien cubierta.'}${R.exp.length?` Ojo: ${R.exp.length} jugador${R.exp.length>1?'es acaban':' acaba'} contrato en junio.`:''}`,'',{cat:'mer',subj:'Se acerca el mercado de invierno',act:[{l:'Ver informe',a:'pre-rep'}]});}
 if(inWindow()&&S.week>=w[1]&&S.winOpen!==S.seasonN){S.winOpen=S.seasonN;news(`¡Abre el mercado de invierno! ${windowTxt()}`,'good',{cat:'mer',subj:'Abre el mercado de invierno',act:[{l:'Ir al mercado',a:'view',v:'mercado'}]});}
}

/* ---------- Torneo de pretemporada: 4 equipos, semifinales y final, con premio ---------- */
const TNAMES=['Trofeo de Verano','Torneo Internacional de Pretemporada','Copa de Verano','Trofeo de la Ciudad'];
/** Al empezar la pretemporada llega la invitación: tú decides si participas. */
export function ptInvite(pick,unit,rnd){
 const me=strength(S.user),my=LG(uLg()),C=S.teams.filter(t=>t.id!==S.user&&!t.parent&&Math.abs(strength(t.id)-me)<9);
 if(C.length<3)return;const pool=C.slice().sort(()=>rnd()-.5),a=pool.find(t=>strength(t.id)>me+2)||pool[0],rest=pool.filter(t=>t!==a),b=rest.find(t=>LG(t.lg).c!==my.c)||rest[0],c=rest.find(t=>t!==b)||rest[1];
 const u=unit(my.rep);
 S.ptour={n:`${pick(TNAMES)} ${2026+S.seasonN}`,teams:[S.user,a.id,b.id,c.id],sf:[[S.user,a.id],[b.id,c.id]],st:'inv',res:[],prize:[Math.round(u*6*1000)/1000,Math.round(u*2.5*1000)/1000,Math.round(u*1000)/1000],champ:null};
}
export const ptOn=()=>!!S.ptour&&inPre()&&S.ptour.st!=='no';
/** Tu próximo partido del torneo: [rival, fase] o null. */
export function ptNext(){const P=S.ptour;if(!P||!inPre())return null;if(P.st==='sf')return [P.sf[0][1],'Semifinal'];if(P.st==='final')return [P.final[1],'Final'];return null;}
/** Resultado de un partido del torneo: devuelve el ganador (con penaltis si hace falta). */
const winner=(h,a,sh,sa,pen)=>sh>sa?h:sa>sh?a:pen[0]>pen[1]?h:a;
/** Tras jugar tu partido del torneo (m: el partido ya acabado). sim(h,a) simula un partido de la IA y devuelve [goles h, goles a]. */
export function ptAfter(m,sim,shootout,money){
 const P=S.ptour,us=m.us,h=m.h,a=m.a,pen=m.score.h===m.score.a?shootout():null,w=winner(h,a,m.score.h,m.score.a,pen||[0,0]);
 P.res.push({f:P.st,h,a,sh:m.score.h,sa:m.score.a,pen,d:S.day??0});
 if(P.st==='sf'){const [x,y]=P.sf[1],[gx,gy]=sim(x,y),p2=gx===gy?shootout():null,w2=winner(x,y,gx,gy,p2||[0,0]);P.res.push({f:'sf',h:x,a:y,sh:gx,sa:gy,pen:p2});
  if(w===S.user){P.final=[S.user,w2];P.st='final';return `${P.n}: ¡a la final! Ganas ${m.score[us]}-${m.score[us==='h'?'a':'h']}${pen?' en los penaltis':''}. En la final, contra ${T(w2).name}.`;}
  const [gf1,gf2]=sim(w,w2),p3=gf1===gf2?shootout():null,ch=winner(w,w2,gf1,gf2,p3||[0,0]);P.res.push({f:'final',h:w,a:w2,sh:gf1,sa:gf2,pen:p3});P.champ=ch;P.st='done';
  S.budget=Math.round((S.budget+P.prize[2])*1000)/1000;return `${P.n}: caes en la semifinal. ${T(ch).name} gana el torneo. Cobras ${money(P.prize[2])} por participar.`;}
 if(P.st==='final'){P.champ=w;P.st='done';const won=w===S.user,amt=won?P.prize[0]:P.prize[1];S.budget=Math.round((S.budget+amt)*1000)/1000;if(won)S.chem=Math.min(100,(S.chem||60)+3);
  if(won){S.ptWins=(S.ptWins||[]).concat([P.n]);}
  return won?`¡Campeones del ${P.n}! Ganas la final${pen?' en los penaltis':''} y cobras ${money(amt)}. El vestuario sale con la moral por las nubes.`:`${P.n}: pierdes la final${pen?' en los penaltis':''}. Cobras ${money(amt)} como finalista.`;}
 return '';
}

/* ---------- Partido interno: titulares contra suplentes, 90 minutos ---------- */
export const INT_MAX=2;
/** Juega el partido interno. Devuelve el resumen para la ventana. */
export function internalMatch(eff,slotsOf,autoLineup,rnd,poisson,news2){
 const t=T(S.user),sl=slotsOf(t.formation),xi=t.lineup.slice(),pool=squad(S.user).filter(p=>!p.loan&&!p.inj&&!xi.includes(p.id));
 const res=[];sl.forEach((sp,i)=>{const b=pool.filter(p=>!res.includes(p.id)).sort((x,y)=>eff(y,sp)-eff(x,sp))[0];res.push(b?b.id:null);});
 const pw=(ids)=>{const v=ids.map((id,i)=>{const p=id&&S.players[id];return p?eff(p,sl[i]):35;});return v.reduce((a,b)=>a+b,0)/v.length;};
 const A=pw(xi),B=pw(res),ga=poisson(1.35*Math.pow(A/Math.max(1,B),2.4)),gb=poisson(1.35*Math.pow(B/Math.max(1,A),2.4));
 const rate=(ids,goals,conc)=>{const out=[],sc={};for(let g=0;g<goals;g++){const c=ids.map((id,i)=>[id,/DC|ED|EI|MCO/.test(sl[i])?4:/MC|MD|MI/.test(sl[i])?2:.4]).filter(x=>x[0]);let r=rnd()*c.reduce((a,x)=>a+x[1],0);for(const [id,w] of c){r-=w;if(r<=0){sc[id]=(sc[id]||0)+1;break;}}}
  ids.forEach((id,i)=>{const p=id&&S.players[id];if(!p)return;let v=6.2+(eff(p,sl[i])/10-6)*.5+(rnd()-.5)*1.4+(sc[id]||0)*.9+(goals>conc?.3:goals<conc?-.3:0);out.push([id,sl[i],Math.max(3,Math.min(10,Math.round(v*10)/10)),sc[id]||0]);});return out;};
 const ra=rate(xi,ga,gb),rb=rate(res,gb,ga);
 // efectos: química, dominio de la formación, cansancio y moral de los que destacan
 S.chem=Math.min(100,(S.chem||60)+3);S.famil[t.formation]=Math.min(100,(S.famil[t.formation]??40)+4);
 xi.concat(res).forEach(id=>{const p=id&&S.players[id];if(p)p.energy=Math.max(40,(p.energy||100)-14);});
 ra.concat(rb).sort((x,y)=>y[2]-x[2]).slice(0,3).forEach(([id])=>{const p=S.players[id];if(p)p.form=Math.min(3,(p.form||0)+1);});
 S.pre.intN=(S.pre.intN||0)+1;S.pre.last=S.day??0;
 const R={ga,gb,ra,rb,best:ra.concat(rb).sort((x,y)=>y[2]-x[2])[0]};S.pre.intLast=R;
 news2(`Partido interno: titulares ${ga}-${gb} suplentes. Destaca ${S.players[R.best[0]]?S.players[R.best[0]].name:''} (${R.best[2].toFixed(1)}). Sube la química del equipo.`,ga>=gb?'good':'');
 return R;
}

/** Estado de la invitación al torneo para la bandeja: null si aún hay que decidir. */
export function ptMailState(){const P=S.ptour;if(!P||P.st==='inv')return null;
 if(P.st==='no')return {ok:false,txt:'Rechazaste la invitación.'};
 const next=ptNext(),R=P.res||[];
 return {ok:true,txt:P.st==='done'?(P.champ===S.user?`🏆 ¡Campeón del ${P.n}!`:`Torneo terminado · campeón: ${T(P.champ)?T(P.champ).name:'—'}`):`✓ Te has apuntado al ${P.n}.${next?` Próximo: ${next[1].toLowerCase()} contra ${T(next[0]).name}.`:''}`};}
