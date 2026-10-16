/* El Banquillo · contracts.js — Contratos, renovaciones, cesiones y opciones de compra. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {onLoanedOut} from './talks';
import {isAffiliate,wageCheck} from './clubplus';
import {LOAN_OBJ} from './connected';
import {agentOf} from './connected';
import {clamp,money,pick,r2,r3,rnd,shuffle} from './core';
import {GRP,posChip} from './data';
import {LG,PL,S,T,lgName,pBadge,rt,seasonLabel,setTeam,squad,uLg} from './state';
import {assignNum,baseWage,endYear,ensureSquad} from './players';
import {news} from './world';
import {fixLineup,setAdapt} from './tactics';
import {agentFee,expRole,inWindow,refuses,tlog} from './market';
import {interested} from './market2';
import {nameBtn,toast} from './views/common';
export const maxExtra=p=>p.age>=31?2:p.age>=29?3:4;
export function renState(id){const p=PL(id);if(S.ren[id])return S.ren[id];
 // lo que pide depende de quién le quiere, de si se ve por encima del club y de su apego
 const why=[];let f=1;const big=interested(p.id).filter(t=>T(t)&&t!==S.user&&LG(T(t).lg).rep>LG(uLg()).rep),over=p.ovr*10-(T(S.user).rep||50)>6;
 if(big.length){f*=Math.min(1.45,1.18+.08*big.length);why.push(`sabe que ${T(big[0]).name}${big.length>1?' y otros clubes':''} le quiere${big.length>1?'n':''}`);}
 if(over&&p.age<=29){f*=1.12;why.push('se ve por encima del nivel del club');if(p.per==='amb')f*=1.08;}
 if(p.home||p.per==='lea'){f*=.93;why.push(p.home?'es de la casa y quiere seguir':'es leal al club');}
 if(p.hap>=80)f*=.96;
 const st=S.ren[id]={demand:r3(Math.max(p.wage*1.08,baseWage(p)*(1.1+rnd()*.3))*(p.hap<50?1.1:1)*agentOf(p).wage*f),tries:0,msg:why.length?`${p.name} ${f>1?'pide más':'te lo pone fácil'}: ${why.join(', ')}.`:'',kind:'',closed:false,why};
 // en su último año, si le quiere un grande (o es ambicioso y el club se le queda pequeño), puede negarse a renovar
 if(p.noRen!==S.seasonN&&p.contract<=1&&!p.home&&p.per!=='lea'&&(big.length||(p.per==='amb'&&over))&&rnd()<(big.length?.45:.3))p.noRen=S.seasonN;
 if(p.noRen===S.seasonN){st.closed=true;st.msg=`${p.name} no quiere renovar: ${why[0]||'quiere probar suerte en otro club'}. Si no lo vendes antes, se irá libre al final de la temporada.`;st.kind='no';}
 return st;}
export function makeRenew(id,w,n){
 const p=PL(id),st=renState(id);if(st.closed)return;
 if(!(w>0)){st.msg='Escribe un sueldo válido.';st.kind='no';return;}
 if(!(n>p.contract)){st.msg='Elige una fecha posterior a la de su contrato actual.';st.kind='no';return;}
 if(n-1>maxExtra(p)){st.msg=`A sus ${p.age} años, ${p.name} solo firma hasta junio de ${2025+S.seasonN+maxExtra(p)+1}.`;st.kind='no';return;}
 {const wc=wageCheck(w,p.wage);if(wc){st.msg=wc;st.kind='no';return;}}
 st.tries++;
 const ratio=w/st.demand;let ok=ratio>=1;if(!ok&&ratio>=.85)ok=rnd()<(ratio-.85)/.15*.7;
 if(ok){p.wage=r3(w);p.contract=n;delete S.ren[id];S.modal=null;const hot=p.big&&p.big.s===S.seasonN;p.cl=Math.max(p.cl||0,Math.round(p.value*(hot?5:3)*100)/100);if(hot)p.hap=Math.min(100,(p.hap??70)+6);news(`${p.name} renueva hasta junio de ${endYear(p)} por ${money(p.wage)}/semana. Cláusula: ${money(p.cl)}.${hot?' Con este contrato, el club que le seguía tendrá que pagar mucho más.':''}`,'good');toast(`${p.name} ha renovado.`);return;}
 if(st.tries>=3){st.closed=true;st.msg=`${p.name} rompe las negociaciones hasta la próxima jornada.`;st.kind='no';return;}
 st.msg=`Rechaza la propuesta. Quiere al menos ${money(st.demand)} a la semana. Te quedan ${3-st.tries} intento${3-st.tries>1?'s':''}.`;st.kind='no';
}
export const loanFee=p=>r2(Math.max(.005,p.value*.06));
export const loansIn=()=>squad(S.user).filter(p=>p.loan).length;
export function requestLoan(id,withOpt){
 const p=PL(id),st=S.loanTry[id]||(S.loanTry[id]={msg:'',kind:'',closed:false});if(st.closed)return;
 const fee=r2(loanFee(p)*(withOpt?1.5:1)),from=p.team;
 if(!inWindow()){st.msg='El mercado está cerrado: las cesiones solo se hacen con el mercado abierto.';st.kind='no';return;}
 if(refuses(p)){st.msg=`${p.name} no quiere jugar en ${lgName(uLg())}.`;st.kind='no';st.closed=true;return;}
 if(loansIn()>=4){st.msg='Ya tienes 4 cedidos, que es el máximo.';st.kind='no';return;}
 if(squad(S.user).length>=30){st.msg='Tu plantilla ya tiene 30 jugadores.';st.kind='no';return;}
 if(fee>S.budget){st.msg=`No te llega para la cuota de ${money(fee)}.`;st.kind='no';return;}
 {const wc=wageCheck(p.wage);if(wc){st.msg=wc;st.kind='no';return;}}
 const rank=squad(from).sort((a,b)=>b.ovr-a.ovr).indexOf(p);
 st.closed=true;
 if(rank<11&&p.age>21){st.msg=`${T(from).name} no cede a un titular.`;st.kind='no';return;}
 if(rnd()>(withOpt?.7:.85)){st.msg=`${T(from).name} prefiere no cederlo esta jornada.`;st.kind='no';return;}
 S.chem=clamp(S.chem-2,20,100);p.sg=0;p.tf='auto';p.role='ro';p.hap=70;S.budget=r3(S.budget-fee);p.loan={from};if(withOpt)p.loan.opt=optPrice(p);setTeam(p,S.user);p.energy=Math.max(p.energy,80);assignNum(p);ensureSquad(from);setAdapt(p);
 news(`Cesión: ${p.name} (${rt(p)}) llega cedido desde ${T(from).name} hasta final de temporada${withOpt?` con opción de compra de ${money(p.loan.opt)}`:''}.`,'good');
 S.modal=null;toast(`${p.name} llega cedido.`);
}
export const optPrice=p=>r2(p.value*1.15);
export function buyOption(id){
 const p=PL(id);if(!p||!p.loan||!p.loan.opt||p.team!==S.user)return;const price=p.loan.opt,fee=agentFee(p,price);
 if(price+fee>S.budget)return toast(`No te llega: necesitas ${money(price+fee)} con la comisión del agente.`);
 const from=p.loan.from;S.budget=r3(S.budget-price-fee);p.loan=null;p.contract=3;p.cl=r2(p.value*3);p.paid=price;p.hap=clamp(p.hap+6,0,100);p.role=p.role==='ro'?expRole(p):p.role;
 if(!S.rec)S.rec={};if(!S.rec.buy||price>S.rec.buy.fee)S.rec.buy={name:p.name,fee:price,season:seasonLabel()};tlog({name:p.name,pid:p.id,from,to:S.user,fee:price});
 news(`Ejecutas la opción de compra: ${p.name} es tuyo en propiedad por ${money(price)}. Contrato hasta junio de ${endYear(p)}.`,'good');S.modal=null;toast(`${p.name} ya es tuyo.`);
}
/** Minutos que tendría cedido en un club: depende de cuántos de su línea son mejores que él allí. */
export function loanMinutes(p,tid){const g=GRP[p.sp]||p.pos,need={POR:1,DEF:4,MED:4,DEL:2}[g]||3,better=squad(tid).filter(x=>(GRP[x.sp]||x.pos)===g&&x.ovr>p.ovr).length;
 return better<need?[85,'Titular']:better<need+2?[50,'Rotación']:[15,'Suplente'];}
export function makeLoanOut(id){
 if(S.lo[id]&&S.lo[id].opts)return S.lo[id];const p=PL(id),my=LG(uLg()).rep;
 const c=shuffle(S.teams.filter(t=>t.id!==S.user&&!t.parent&&t.rep<=p.ovr+4&&t.rep>=p.ovr-12&&Math.abs(LG(t.lg).rep-my)<=22)).slice(0,6).map(t=>t.id);
 return S.lo[id]=c.length?{team:c[0],opts:c}:{none:true};
}
export function acceptLoanOut(id,obj,to){
 const p=PL(id),sq=squad(S.user);let o=S.lo[id];if(to&&(isAffiliate(+to)||(o&&o.opts&&o.opts.includes(+to))))o={team:+to};else if(!o||o.none)return toast('Ningún club lo quiere cedido ahora mismo.');
 if(!inWindow())return toast('El mercado está cerrado.');
 if(sq.length<=16)return toast('Necesitas al menos 16 jugadores en plantilla.');
 if(p.pos==='POR'&&sq.filter(x=>x.pos==='POR').length<=1)return toast('No puedes quedarte sin porteros.');
 onLoanedOut(p);p.loan={from:S.user};if(obj&&LOAN_OBJ[obj])p.loan.obj=LOAN_OBJ[obj][1];p.lpj=0;p.lmt=0;p.lo0=p.ovr;p.lwarn=0;setTeam(p,o.team);assignNum(p);
 const t=T(S.user),i=t.lineup.indexOf(id);if(i>=0)t.lineup[i]=null;fixLineup();
 news(`${p.name} se marcha cedido a ${T(o.team).name} hasta final de temporada. Ellos pagan su sueldo.${p.loan.obj?` Se comprometen a que juegue al menos el ${Math.round(p.loan.obj*100)}% de los partidos.`:''}`);
 delete S.lo[id];S.modal=null;toast(`${p.name} cedido a ${T(o.team).name}.`);
}
export function contractTxt(p){
 if(p.loan)return `<span class="tag">${p.loan.from===S.user?'Cedido en '+T(p.team).short:'Cedido por '+T(p.loan.from).short}</span>`;
 if(p.team===null)return '<span class="muted">—</span>';
 return p.contract<=1?`<span class="tag bad">Jun ${endYear(p)}</span>`:`<span class="num">Jun ${endYear(p)}</span>`;
}
export function contractLabel(p){
 if(p.loan)return p.loan.from===S.user?`Cedido en ${T(p.team).name} (vuelve en junio)`:`Cedido por ${T(p.loan.from).name} hasta junio${p.loan.opt?' · opción de compra '+money(p.loan.opt):''}`;
 if(p.team===null)return 'Sin equipo';
 return `Hasta junio de ${endYear(p)}${p.contract<=1?' (último año)':''}`;
}
export function contractsPanel(){
 const ex=squad(S.user).filter(p=>!p.loan&&p.contract<=1).sort((a,b)=>b.ovr-a.ovr);if(!ex.length)return '';
 return `<section class="panel"><div class="panel-h"><h2>Contratos que acaban</h2><span class="eyebrow">Se van libres en junio</span></div>
 ${ex.slice(0,6).map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} ${pBadge(p)} <span class="muted small">${p.age} años · ${money(p.wage)}/sem</span></span><button class="btn sm" data-a="renew" data-id="${p.id}">Renovar</button></div>`).join('')}
 ${ex.length>6?`<p class="small muted" style="margin:8px 0 0">Y ${ex.length-6} más. Los verás marcados en rojo en Plantilla.</p>`:''}</section>`;
}
