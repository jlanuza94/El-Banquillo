/* El Banquillo · market.js — Mercado: ventanas, fichajes entre clubes, ofertas, negociación y ventas. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {bigTransfer} from './living';
import {agentName,agentOf,inContacts} from './connected';
import {esc} from './core';
import {diff} from './difficulty';
import {applyDeal,bidWorth,dealPrice,firstPay,hotMult,sellOnIn,sellOnOut,SON_PCT} from './market2';
import {buyMult,sellMult} from './staff';
import {clamp,money,pick,r2,r3,ri,rnd} from './core';
import {PERS,ROLES,SPN} from './data';
import {RT,LG,PL,S,T,econ,lgName,rt,seasonLabel,setTeam,squad,uLg,unit} from './state';
import {assignNum,baseWage,endYear,ensureSquad,signWage} from './players';
import {news} from './world';
import {fixLineup,leaders,setAdapt} from './tactics';
import {step} from './engine';
import {maxExtra,renState} from './contracts';
import {unlock} from './club';
import {save} from './persist';
import {render,toast} from './views/common';
export const inWindow=()=>S.week<=4||(S.week>=19&&S.week<=22);
export const isDeadline=()=>S.week===4||S.week===22;
export const windowTxt=()=>inWindow()?`Mercado abierto: cierra tras la jornada ${S.week<=4?5:23}${isDeadline()?' (¡último día!)':''}.`:`Mercado cerrado: abre tras la jornada ${S.week<19?19:'38 (verano)'}. Puedes fichar agentes libres y renovar.`;
export function tlog(x){S.tlog=S.tlog||[];S.tlog.unshift(Object.assign({season:seasonLabel(),wk:S.week+1},x));S.tlog=S.tlog.slice(0,80);}
export function aiTransfers(n){
 const all=Object.values(S.players),teams=S.teams.filter(t=>t.id!==S.user),myLg=uLg();let done=0;
 for(let k=0;k<n;k++){
  const b=pick(teams);const sq=squad(b.id);if(sq.length>=27)continue;
  const g=pick(['DEF','MED','DEL','DEF','MED','DEL','POR']),mine=sq.filter(p=>p.pos===g).map(p=>p.ovr).sort((x,y)=>y-x);
  const need=mine.length?mine[Math.min(mine.length-1,g==='POR'?0:2)]:0,bRep=LG(b.lg).rep,maxVal=unit(bRep)*25;
  let best=null,bs=-1;
  for(let i=0;i<150;i++){const p=all[Math.floor(rnd()*all.length)];if(!p||p.pos!==g||p.team===b.id||p.team===S.user||p.loan||!S.players[p.id])continue;
   if(p.ovr<=need+2||p.ovr>b.rep+5||p.age>31||p.value>maxVal)continue;if(p.team!==null&&LG(T(p.team).lg).rep>bRep+3)continue;
   const sc=p.ovr-p.age*.2+rnd()*3;if(sc>bs){bs=sc;best=p;}}
  if(!best)continue;
  const from=best.team,fee=from===null?0:r2(best.value*(1+rnd()*.3));
  setTeam(best,b.id);assignNum(best);best.contract=ri(2,4);best.cl=r2(best.value*(2+rnd()*3));best.wage=Math.max(best.wage,baseWage(best));
  if(from!==null)ensureSquad(from);
  const sq2=squad(b.id);if(sq2.length>25){const w=sq2.filter(p=>p!==best).sort((x,y)=>x.ovr-y.ovr)[0];if(w)setTeam(w,null);}
  if(fee)sellOnIn(best,fee);
  done++;tlog({name:best.name,pid:best.id,from:from===null?null:from,to:b.id,fee});
  if(!bigTransfer(best,from,b.id,fee)&&((from!==null&&T(from).lg===myLg)||b.lg===myLg||fee>=5))news(`Mercado: ${best.name} ficha por ${b.name}${from!==null?' desde '+T(from).name:' como agente libre'}${fee?' por '+money(fee):''}.`);
 }
 return done;
}
export function isKey(p){if(p.team===null)return false;if(!RT.keyCache){RT.keyCache=new Set();S.teams.forEach(t=>squad(t.id).sort((a,b)=>b.ovr-a.ovr).slice(0,3).forEach(x=>RT.keyCache.add(x.id)));}return RT.keyCache.has(p.id);}
export const askPrice=p=>{const d=dealPrice(p.id);if(d!=null)return d;return p.team===null?r2(Math.max(.005,p.value*.25*buyMult())):r2(p.value*1.2*(isKey(p)?1.3:1)*(p.contract<=1?.6:1)*buyMult()*hotMult(p)*diff().price*(inContacts(p)?.94:1));};
export function refuses(p){const e=econ(uLg()),my=LG(uLg()).rep;return p.ovr>e.cap&&(p.team===null||LG(T(p.team).lg).rep>my||p.ovr>e.cap+4);}
export function negState(id){return S.neg[id]||(S.neg[id]={tries:0,counter:null,msg:'',kind:'',closed:false});}
/** opt: {inst: nº de plazos, son: ofrecer % de futura venta, swap: id de un jugador tuyo que entra en la operación} */
export function makeBid(id,amt,opt={}){
 const p=PL(id),n=negState(id),ask=askPrice(p);
 if(n.closed)return;
 if(p.team!==null&&!inWindow()){n.msg='El mercado está cerrado. Solo puedes fichar agentes libres hasta que se abra.';n.kind='no';return;}
 if(!(amt>0)){n.msg='Escribe una cantidad válida.';n.kind='no';return;}
 if(p.team===null)opt={};n.opt=opt;
 if(firstPay(amt,opt)>S.budget){n.msg=`No tienes tanto dinero. Tu presupuesto es ${money(S.budget)}${(opt.inst||1)>1?' y el primer plazo es de '+money(firstPay(amt,opt)):''}.`;n.kind='no';return;}
 if(opt.swap){const q=PL(opt.swap);if(!q||q.team!==S.user||q.loan){n.msg='Ese jugador no puede entrar en la operación.';n.kind='no';return;}if(squad(S.user).length<=16){n.msg='Necesitas al menos 16 jugadores: no puedes incluir a nadie en la operación.';n.kind='no';return;}}
 if(squad(S.user).length>=30){n.msg='Tu plantilla ya tiene 30 jugadores. Vende a alguien antes.';n.kind='no';return;}
 if(refuses(p)){n.msg=`${p.name} no quiere jugar en ${lgName(uLg())}. Asciende primero o busca otro objetivo.`;n.kind='no';n.closed=true;return;}
 n.tries++;
 const ratio=bidWorth(amt,opt,p)/(n.counter||ask);
 let accept=ratio>=1;
 if(!accept&&ratio>=.65)accept=rnd()<(ratio-.65)/.35*.75;
 if(accept){n.agreed=amt;n.deal=opt;n.tries=0;const extra=[(opt.inst||1)>1?`en ${opt.inst} plazos (${money(firstPay(amt,opt))} ahora)`:'',opt.son?`con un ${Math.round(SON_PCT*100)}% de futura venta para ellos`:'',opt.swap?`con ${PL(opt.swap).name} incluido`:''].filter(Boolean).join(', ');
  n.msg=`${p.team===null?'Trato hecho con su agente':T(p.team).name+' acepta '+money(amt)+(extra?' '+extra:'')}. Ahora negocia el contrato con el jugador.`;n.kind='ok';return;}
 if(n.tries>=3){n.closed=true;n.msg=`${p.team===null?'El agente de '+p.name:T(p.team).name} da por cerradas las negociaciones esta jornada.`;n.kind='no';return;}
 if(ratio<.65){n.msg=`Oferta rechazada: ${p.team===null?'el jugador':'el club'} ni la considera. Necesitarás acercarte bastante más.`;n.kind='no';}
 else{n.counter=r2(Math.max(amt*1.05,(n.counter||ask)*(.92+rnd()*.1)));n.msg=`Oferta rechazada. Piden ${money(n.counter)}. Te quedan ${3-n.tries} intento${3-n.tries>1?'s':''}.`;n.kind='no';}
}
export function completeBuy(p,price,t){
 S.chem=clamp(S.chem-3,20,100);p.sg=0;p.tf='auto';p.paid=price;
 const from=p.team,now=applyDeal(p,price,from,(S.neg[p.id]||{}).deal);S.budget=r3(S.budget-now-(t.bonus||0)-agentFee(p,price));setTeam(p,S.user);p.wage=t.w;p.contract=t.yrs;p.role=t.role;p.cl=t.cl;p.hap=clamp(72+(ROLES[t.role].l>=ROLES[expRole(p)].l?6:-6),0,100);p.req=0;p.prom=null;p.energy=Math.max(p.energy,80);assignNum(p);
 if(from!==null)ensureSquad(from);setAdapt(p);if(!p.ph||!p.ph.length)p.ph=[[seasonLabel(),p.ovr]];
 S.short=S.short.filter(x=>x!==p.id);delete S.neg[p.id];
 if(!S.rec)S.rec={};if(price>0&&(!S.rec.buy||price>S.rec.buy.fee))S.rec.buy={name:p.name,fee:price,season:seasonLabel()};tlog({name:p.name,pid:p.id,from,to:S.user,fee:price});
 news(`Fichaje: ${p.name} (${SPN[p.sp].toLowerCase()}, ${rt(p)}) llega por ${money(price)}${from!==null?' desde '+T(from).name:' como agente libre'}. Contrato hasta junio de ${endYear(p)}, rol: ${ROLES[t.role].n.toLowerCase()}.`,'good');
 S.modal=null;toast(`${p.name} ya es jugador tuyo.`);
}
export function expRole(p){
 const sq=squad(S.user).filter(x=>x!==p&&!x.loan).map(x=>x.ovr).sort((a,b)=>b-a);const r=sq.filter(o=>o>p.ovr).length;
 const base=r<=2?'cl':r<=10?'ti':r<=16?'ro':'su';return base==='su'&&p.age<=21?'jo':base;
}
export function assignRoles(force){squad(S.user).forEach(p=>{if(force||!p.role)p.role=p.loan?'ro':expRole(p);});}
export function termsDemand(p,mode){return mode==='buy'?r3(signWage(p)*agentOf(p).wage):renState(p.id).demand;}
export function evalTerms(p,mode,t){
 const D=termsDemand(p,mode),e=ROLES[expRole(p)].l,o=ROLES[t.role].l;
 let f=1+.15*Math.max(0,e-o)-.05*Math.max(0,o-e);if(t.role==='jo'&&p.age>21)f+=.3;
 const wantsFree=p.per==='amb'||p.age<=22;let cf=1;if(wantsFree){if(t.cl<p.value*2)cf=.95;else if(t.cl>p.value*4)cf=1.08;}else if(t.cl>p.value*5)cf=1.04;
 const A=agentOf(p),bonusF=A.bonus&&mode==='buy'&&(t.bonus||0)<D*8?.95:1;
 return (t.w+(t.bonus||0)/40)/(D*f*cf)*(1+A.acc)*bonusF;
}
export function readTerms(){const g=id=>document.getElementById(id);const num=id=>parseFloat(String(g(id)?.value||'').replace(',','.'));
 return{w:r3(num('tWage')/1000),yrs:+(g('tYears')?.value||3),role:g('tRole')?.value||'ro',cl:r2(num('tClause')),bonus:r3((num('tBonus')||0)/1000)};}
export function makeTerms(id,mode,t){
 const p=PL(id),st=mode==='buy'?negState(id):renState(id);if(st.closed)return;
 if(!(t.w>0)||!(t.cl>0)){st.msg='Revisa el sueldo y la cláusula.';st.kind='no';return;}
 if(mode==='renew'){if(p.req||p.hap<35){st.msg=`${p.name} está descontento y no quiere renovar. Habla con él o mejora su situación.`;st.kind='no';return;}
  if(!(t.yrs>p.contract)){st.msg='Elige una fecha posterior a la de su contrato actual.';st.kind='no';return;}
  if(t.yrs-1>maxExtra(p)){st.msg=`A sus ${p.age} años, ${p.name} solo firma hasta junio de ${2025+S.seasonN+maxExtra(p)+1}.`;st.kind='no';return;}}
 else if(t.yrs>maxExtra(p)+1){st.msg=`A sus ${p.age} años, ${p.name} solo firma ${maxExtra(p)+1} temporadas.`;st.kind='no';return;}
 const cost=(mode==='buy'?firstPay(st.agreed,st.deal)+agentFee(p,st.agreed):0)+(t.bonus||0);if(cost>S.budget){st.msg=`No te llega el presupuesto (${money(S.budget)}) para pagar ${money(cost)}.`;st.kind='no';return;}
 st.ttries=(st.ttries||0)+1;const ratio=evalTerms(p,mode,t);let ok=ratio>=1;if(!ok&&ratio>=.85)ok=rnd()<(ratio-.85)/.15*.7;
 if(ok){if(mode==='buy'){completeBuy(p,st.agreed,t);}else{p.wage=t.w;p.contract=t.yrs;p.role=t.role;p.cl=t.cl;S.budget=r3(S.budget-(t.bonus||0));p.hap=clamp(p.hap+6,0,100);if(p.prom&&p.prom.type==='ren'){p.prom=null;p.hap=clamp(p.hap+4,0,100);}delete S.ren[id];S.modal=null;news(`${p.name} renueva hasta junio de ${endYear(p)}: ${money(p.wage)}/sem, ${ROLES[p.role].n.toLowerCase()}, cláusula ${money(p.cl)}.`,'good');toast(`${p.name} ha renovado.`);}return;}
 if(st.ttries>=3){st.closed=true;st.msg=`${p.name} rompe las negociaciones hasta la próxima jornada.`;st.kind='no';return;}
 const D=termsDemand(p,mode);st.msg=`Rechaza tu propuesta${ratio<.85?' (está lejos de lo que pide)':''}. Pide unos ${money(D)}/sem siendo ${ROLES[expRole(p)].n.toLowerCase()}. Una prima de fichaje o un rol mejor ayudan. Te quedan ${3-st.ttries} intento${3-st.ttries>1?'s':''}.`;st.kind='no';
}
export const agentFee=(p,fee)=>r3(Math.max(.002,(fee>0?fee:p.value*.5)*(p.agc||.07)*agentOf(p).fee));
export function termsForm(p,mode){
 const D=termsDemand(p,mode),er=expRole(p),yOpts=[];
 if(mode==='renew')for(let n=p.contract+1;n<=Math.min(5,maxExtra(p)+1);n++)yOpts.push(n);else for(let n=1;n<=Math.min(5,maxExtra(p)+1);n++)yOpts.push(n);
 const wantsFree=p.per==='amb'||p.age<=22;
 return `<div class="kv"><span>Su agente</span><b>${esc(agentName(p))} · ${agentOf(p).n}</b><span>Sueldo que pide</span><b>${money(D)}/sem</b>${mode==='buy'?`<span>Comisión de su agente</span><b>${money(agentFee(p,negState(p.id).agreed||0))} (${Math.round((p.agc||.07)*100)}%)</b>`:''}<span>Rol que espera</span><b>${ROLES[er].n}</b><span>Cláusula</span><b>${wantsFree?'La quiere baja (menos de '+money(p.value*2)+')':'Le da igual'}</b><span>Carácter</span><b>${PERS[p.per].n}</b></div>
 ${yOpts.length?`<div class="filters" style="margin-top:14px"><label class="f"><span class="eyebrow">Sueldo (miles €/sem)</span><input type="number" id="tWage" min="0.5" step="0.5" value="${Math.round(D*2000)/2}"></label>
 <label class="f"><span class="eyebrow">Hasta</span><select id="tYears">${yOpts.map(n=>`<option value="${n}" ${n===yOpts[Math.min(yOpts.length-1,mode==='renew'?1:2)]?'selected':''}>Jun ${2025+S.seasonN+n}</option>`).join('')}</select></label>
 <label class="f"><span class="eyebrow">Rol</span><select id="tRole">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${k===er?'selected':''}>${v.n}</option>`).join('')}</select></label>
 <label class="f"><span class="eyebrow">Cláusula (M€)</span><input type="number" id="tClause" min="0.01" step="0.05" value="${r2(Math.max(.05,p.value*3)).toFixed(2)}"></label>
 <label class="f"><span class="eyebrow">Prima de fichaje (miles €)</span><input type="number" id="tBonus" min="0" step="1" value="0"></label></div>
 <p class="small muted" style="margin:6px 0 0">Prometer un rol mejor abarata el sueldo, pero si luego no juega lo que esperaba se enfadará. La prima se paga una vez y equivale a unas 40 semanas de sueldo extra. Una cláusula baja facilita que otro club se lo lleve pagándola.</p>`:'<div class="negmsg">Ya tiene el contrato más largo que está dispuesto a firmar.</div>'}`;
}
export function makeOffer(id){
 if(S.offers[id])return S.offers[id];const p=PL(id),my=LG(uLg()).rep;
 let teams=S.teams.filter(t=>t.id!==S.user&&Math.abs(t.rep-p.ovr)<8&&Math.abs(LG(t.lg).rep-my)<20);if(!teams.length)teams=S.teams.filter(t=>t.id!==S.user&&Math.abs(t.rep-p.ovr)<14);if(!teams.length)teams=S.teams.filter(t=>t.id!==S.user);
 const t=pick(teams);return S.offers[id]={team:t.id,amount:r2(p.value*(.72+rnd()*.36)*(LG(t.lg).rep>my?1.1:1)*sellMult())};
}
export function sell(id,son){
 const p=PL(id),o=S.offers[id],sq=squad(S.user);
 if(p.loan)return toast('No puedes vender a un jugador cedido.');
 if(!inWindow())return toast('El mercado está cerrado.');
 if(sq.length<=16)return toast('Necesitas al menos 16 jugadores en plantilla.');
 if(p.pos==='POR'&&sq.filter(x=>x.pos==='POR').length<=1)return toast('No puedes quedarte sin porteros.');
 const wasLeader=leaders(3).some(([L])=>L===p);
 if(!S.rec)S.rec={};if(!S.rec.sell||o.amount>S.rec.sell.fee)S.rec.sell={name:p.name,fee:o.amount,season:seasonLabel()};tlog({name:p.name,pid:p.id,from:S.user,to:o.team,fee:o.amount});
 if(p.paid&&o.amount>=p.paid*5&&p.paid>=.01)unlock('gang');if(p.home&&o.amount>=2)unlock('neg');
 S.budget=r3(S.budget+o.amount);sellOnOut(p,o.amount);if(son)p.son={team:S.user,pct:SON_PCT};setTeam(p,o.team);assignNum(p);p.req=0;p.prom=null;p.cl=r2(p.value*(2+rnd()*2));
 const t=T(S.user),i=t.lineup.indexOf(id);if(i>=0)t.lineup[i]=null;fixLineup();
 news(`Venta: ${p.name} se marcha a ${T(o.team).name} por ${money(o.amount)}.`);
 if(wasLeader){squad(S.user).forEach(x=>x.hap=clamp(x.hap-6,0,100));S.chem=clamp(S.chem-4,20,100);news(`El vestuario no entiende la venta de ${p.name}, uno de sus líderes.`,'bad');}
 delete S.offers[id];S.modal=null;save();render();toast(`Vendido por ${money(o.amount)}.`);
}
