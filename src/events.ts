/* El Banquillo · events.js — Clics, cambios de formularios y teclado. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {queueScout,scoutWeeks} from './scouting';
import {fireStaff,hireStaff,renewStaff} from './staff';
import {KEY,clamp,pick,r2,rnd} from './core';
import {COUNTRIES,MENT,OIS,TAC0,TACS} from './data';
import {RT,LG,PL,S,T,available,dirty,findLg,lgName,rt,uLg,setS} from './state';
import {news,pickTeam} from './world';
import {autoLineup,fixLineup,nRounds,setFormation,userRoles} from './tactics';
import {addEv,doSub,talkEffect} from './engine';
import {finishRound,newSeason,playFriendly,playMatch,runTimer,simRun,simState,simToEnd,stopSim} from './season';
import {inWindow,makeBid,makeOffer,makeTerms,negState,readTerms,refuses,sell} from './market';
import {acceptLoanOut,buyOption,makeLoanOut,renState,requestLoan} from './contracts';
import {answerPress,boardAsk,spDesc,startBuild} from './club';
import {chatOpt} from './squad';
import {clubReq,jobCandidates,loseJob,makeJobOffer,takeJob} from './career';
import {promoteYouth,regionOf,signProspect} from './academy';
import {deleteSlot,exportCode,importCode,loadSlot,save,saveNow} from './persist';
import {render,toast} from './views/common';
import {markAll,markRead} from './inbox';
import {mkList} from './views/market';
import {boot,start} from './boot';
export function placeInSlot(pid,i){
 const t=T(S.user),p=PL(pid);if(!available(p)){toast(`${p.name} no está disponible (${p.inj?'lesionado':'sancionado'}).`);return;}
 const j=t.lineup.indexOf(pid);if(j>=0)t.lineup[j]=t.lineup[i];t.lineup[i]=pid;S.sel=null;
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el)return;
 const a=el.dataset.a,d=el.dataset;
 if(!S||S.user==null){if(a==='slot-load'){loadSlot(+d.id).then(o=>{if(o)boot(o);else{toast('No se pudo cargar esa partida.');}});return;}
  if(a==='slot-del'){RT.delConfirm=+d.id;render();return;}if(a==='slot-del-no'){RT.delConfirm=null;render();return;}
  if(a==='slot-del-ok'){RT.delConfirm=null;deleteSlot(+d.id).then(render);return;}
  if(a==='pick-team')pickTeam(+d.i);else if(a==='start-c'){RT.startC=+d.v;RT.startLv=COUNTRIES[RT.startC].lv-1;render();}else if(a==='start-lv'){RT.startLv=+d.v;render();}return;}
 if(a==='ov'&&e.target!==el)return;
 const m=S.match;
 switch(a){
  case'view':if(S.match&&d.v!=='partido'&&!S.match.paused){S.match.paused=true;clearInterval(RT.timer);RT.timer=null;}S.view=d.v;S.sel=null;S.moreOpen=false;if(d.v==='liga'){S.ligaLg=uLg();S.ligaRound=clamp(S.week-(S.week>=nRounds()?1:0),0,nRounds()-1);}window.scrollTo(0,0);break;
  case'slot':{const i=+d.i,t=T(S.user);if(S.sel&&S.sel.type==='player'){placeInSlot(S.sel.id,i);}else if(S.sel&&S.sel.type==='slot'){if(S.sel.i===i)S.sel=null;else{const x=t.lineup[i];t.lineup[i]=t.lineup[S.sel.i];t.lineup[S.sel.i]=x;S.sel=null;}}else S.sel={type:'slot',i};break;}
  case'row':{if(S.sel&&S.sel.type==='slot')placeInSlot(d.id,S.sel.i);else if(S.sel&&S.sel.id===d.id)S.sel=null;else S.sel={type:'player',id:d.id};break;}
  case'ficha':S.modal={type:'ficha',id:d.id};break;
  case'scout':{const err=queueScout(d.id);toast(err||`${PL(d.id).name} queda en la lista de ojeo. Tendrás el informe en ${scoutWeeks()} jornada${scoutWeeks()>1?'s':''}.`);break;}
  case'aw-tab':S.awTab=d.v;break;
  case'aw-stat':S.awStat=d.v;break;
  case'aw-lv':{const L=LG(S.awLg!=null?S.awLg:uLg());S.awLg=findLg(L.c,+d.v).id;break;}
  case'cmp':{if(S.cmpA&&S.cmpA!==d.id&&PL(S.cmpA)){S.modal={type:'cmp',a:S.cmpA,b:d.id};S.cmpA=null;}else{S.cmpA=d.id;S.modal=null;toast(`Ahora abre la ficha de otro jugador y pulsa «Comparar».`);}break;}
  case'mail-open':S.mailSel=d.id;markRead(d.id);break;
  case'mail-back':S.mailSel=null;break;
  case'mail-cat':S.mailCat=d.v;S.mailSel=null;break;
  case'mail-all':markAll(S.mailCat);break;
  case'offer-view':{const o=S.offers[d.id];if(o&&o.incoming&&PL(d.id)&&PL(d.id).team===S.user)S.modal={type:'sell',id:d.id};else toast('Esa oferta ya ha caducado.');break;}
  case'pl-open':S.view='plantilla';S.plTab=d.v;window.scrollTo(0,0);break;
  case'ment':T(S.user).ment=d.v;break;
  case'auto':T(S.user).lineup=autoLineup(S.user,T(S.user).formation);S.sel=null;toast('Once con los mejores jugadores disponibles.');break;
  case'fixlu':{const k=fixLineup();toast(k?`Cubiertos ${k} hueco${k>1?'s':''}.`:'No quedan suplentes disponibles.');break;}
  case'play':playMatch();return;
  case'm-play':m.paused=false;m.alert='';m.subOpen=false;render();runTimer();return;
  case'm-pause':m.paused=true;clearInterval(RT.timer);RT.timer=null;break;
  case'm-speed':m.speed=+d.v;render();runTimer();return;
  case'm-ment':if(m.ment[m.us]!==d.v){m.ment[m.us]=d.v;addEv(m,'sys',null,`${T(m[m.us]).short} cambia a mentalidad ${MENT[d.v].label.toLowerCase()}`);}break;
  case'm-oi':{m.oi=m.oi||{};const o=m.oi[m.us]=m.oi[m.us]||{};o[d.v]=!o[d.v];addEv(m,'sys',null,`${o[d.v]?'Nueva instrucción':'Se retira la instrucción'}: ${OIS[d.v].n.toLowerCase()}.`);break;}
  case'oi':{const t=T(S.user);t.oi=t.oi||{};t.oi[d.v]=!t.oi[d.v];break;}
  case'm-subs':m.subOpen=true;m.paused=true;clearInterval(RT.timer);RT.timer=null;break;
  case'm-subclose':m.subOpen=false;break;
  case'm-dosub':{const o=document.getElementById('subOut').value,n=document.getElementById('subIn').value;if(o&&n&&doSub(m,m.us,o,n)){m.alert='';m.subOpen=false;toast('Cambio hecho.');}break;}
  case'm-sim':simToEnd();return;
  case'm-finish':finishRound();return;
  case'liga-r':S.ligaRound=clamp(S.ligaRound+(+d.d),0,nRounds()-1);break;
  case'liga-lv':S.ligaLg=findLg(LG(S.ligaLg).c,+d.v).id;break;
  case'liga-mine':S.ligaLg=uLg();break;
  case'cup-tab':S.cupTab=d.v;break;
  case'more':S.moreOpen=true;break;
  case'press':answerPress(+d.i);break;
  case'board':S.boardMsg=boardAsk(d.k);break;
  case'more-close':if(e.target!==el)return;S.moreOpen=false;break;
  case'sim-menu':S.modal={type:'sim'};break;
  case'sim-go':{const st=document.getElementById('simStop');S.simStop=st?st.checked:true;S.modal=null;S.moreOpen=false;if(S.match&&!S.match.done){toast('Termina antes el partido en juego.');break;}simRun(d.v,S.simStop);return;}
  case'sim-stop':stopSim();return;
  case'friendly':playFriendly(+d.id);return;
  case'pre-skip':if(S.pre)S.pre.left=0;break;
  case'sponsor':{const o=S.spOffers[+d.i];if(o){S.sponsor=o;news(`Firmas con ${o.name}: ${spDesc(o)}`,'good');}break;}
  case'price':S.club.price=clamp(S.club.price+(+d.d)*(S.club.price>=30?2:1),2,250);break;
  case'build':startBuild(d.t,+d.n||0);break;
  case'tac':{const t=T(S.user);t.tac=Object.assign({},TAC0,t.tac||{});t.tac[d.k]=d.v;break;}
  case'hi-tab':S.hiTab=d.v;break;
  case'v2d':S.v2d=d.v==='1';break;
  case'backup':{const code=exportCode();S.modal={type:'backup',code};try{navigator.clipboard.writeText(code).then(()=>toast('Copia de seguridad copiada al portapapeles.'),()=>{});}catch(err){}break;}
  case'bk-select':{const ta=document.getElementById('bkTxt');if(ta){ta.focus();ta.select();}return;}
  case'restore':S.modal={type:'restore'};break;
  case'rs-go':{const v=document.getElementById('rsTxt')?.value;if(importCode(v)){toast('Partida restaurada.');return;}S.modal={type:'restore',err:'El código no es válido o está incompleto. Copia el texto entero, empezando por EB1:'};break;}
  case'ct-sel':S.ctSel=+d.v;break;
  case'ct-open':S.modal=null;S.view='copas';S.cupTab='ct';S.ctSel=+d.v;break;
  case'talk':{if(!m||m.talks[d.p])break;const r=talkEffect(m,d.p,d.v);m.talks[d.p]={opt:d.v,d:r.d,txt:r.txt};m.mult[m.us]*=1+r.d;addEv(m,'sys',null,`Charla ${d.p==='pre'?'previa':'del descanso'}: ${r.txt}`);break;}
  case'scout-hire':{const i=S.scoutPool.findIndex(x=>x.id===d.id);if(i>=0&&S.scouts.length<3){const sc=S.scoutPool.splice(i,1)[0];sc.reg=Math.max(0,regionOf(LG(uLg()).c));S.scouts.push(sc);toast(`${sc.name} se une como ojeador.`);}break;}
  case'scout-fire':S.scouts=S.scouts.filter(x=>x.id!==d.id);break;
  case'pros-sign':signProspect(d.id);break;
  case'ac-up':promoteYouth(d.id);break;
  case'ac-free':{const p=S.academy.find(x=>x.id===d.id);S.academy=S.academy.filter(x=>x.id!==d.id);if(p)toast(`${p.name} deja la cantera.`);break;}
  case'job-yes':{const o=S.jobOffers[+d.i];if(o)takeJob(o);break;}
  case'job-no':S.jobOffers.splice(+d.i,1);break;
  case'job-search':S.showJobs=!S.showJobs;break;
  case'job-apply':{const t=T(+d.id),ch=clamp(.3+(S.mgr.rep-clubReq(t))/30,.05,.9);if(rnd()<ch){S.modal={type:'joboffer',o:makeJobOffer(t)};}else{S.applied[t.id]=S.seasonN;toast(`${t.name} prefiere a otro candidato.`);}break;}
  case'joboffer-ok':{const o=S.modal&&S.modal.o;if(o)takeJob(o);break;}
  case'resign':S.modal={type:'resign'};break;
  case'resign-ok':S.mgr.rep=clamp(S.mgr.rep-3,0,100);news(`Dimites como entrenador de ${T(S.user).name}.`);loseJob('dimisión');break;
  case'jobless-take':{const o=S.jobless&&S.jobless.offers[+d.i];if(o)takeJob(o);break;}
  case'jobless-more':{const r=S.mgr.rep,c=jobCandidates(r,Math.max(0,r-35),5);S.jobless.offers=c.map(makeJobOffer);break;}
  case'tr-focus':S.train.focus=d.v;break;
  case'tr-int':S.train.int=d.v;break;
  case'st-hire':{const err=hireStaff(d.id);if(err)toast(err);break;}
  case'st-fire':S.modal={type:'stfire',id:d.id};break;
  case'st-fire-ok':fireStaff(d.id);S.modal=null;break;
  case'st-renew':renewStaff(d.id);break;
  case'cup-open':S.modal=null;S.view='copas';S.cupTab='cup';S.cupC=null;break;
  case'cwc-open':S.modal=null;S.view='copas';S.cupTab='cwc';break;
  case'mk-tab':S.mk.tab=d.v;S.mk.limit=40;break;
  case'mk-pos':S.mk.pos=d.v;S.mk.limit=40;break;
  case'mk-more':S.mk.limit+=40;break;
  case'fav':{const i=S.short.indexOf(d.id);if(i>=0)S.short.splice(i,1);else{S.short.push(d.id);toast('Añadido a Seguimiento.');}break;}
  case'neg':negState(d.id);S.modal={type:'neg',id:d.id};break;
  case'bid':{const g=x=>document.getElementById(x),v=parseFloat(String(g('bidAmt')?.value||'').replace(',','.'));makeBid(d.id,v,{inst:+(g('bidInst')?.value||1),son:!!g('bidSon')?.checked,swap:g('bidSwap')?.value||null});break;}
  case'sell-son':{const o=S.offers[d.id];if(o&&!o.son){o.amount=r2(o.amount*.9);o.son=1;}sell(d.id,true);return;}
  case'pay-clause':{const p=PL(d.id),n=negState(d.id);if(!inWindow()){n.msg='El mercado está cerrado.';n.kind='no';break;}if(refuses(p)){n.msg=`${p.name} no quiere jugar en ${lgName(uLg())}.`;n.kind='no';n.closed=true;break;}if(p.cl>S.budget){n.msg='No te llega para pagar la cláusula.';n.kind='no';break;}n.agreed=p.cl;n.viaClause=1;n.tries=0;n.msg='';break;}
  case'terms-ok':makeTerms(d.id,d.m,readTerms());break;
  case'chat':S.modal={type:'chat',id:d.id};break;
  case'chat-opt':{const r=chatOpt(PL(d.id),d.v);S.modal={type:'chat',id:d.id,msg:r[0],kind:r[1]};break;}
  case'pl-tab':S.plTab=d.v;break;
  case'ld-tab':S.ldTab=d.v;break;
  case'renew':renState(d.id);S.modal={type:'renew',id:d.id};break;
  case'loan':S.modal={type:'loan',id:d.id};break;
  case'loan-ok':requestLoan(d.id,d.o==='1');break;
  case'buy-opt':buyOption(d.id);break;
  case'loanout':if(PL(d.id).loan)break;makeLoanOut(d.id);S.modal={type:'loanout',id:d.id};break;
  case'loanout-ok':acceptLoanOut(d.id);break;
  case'sell':if(!inWindow()){toast('El mercado está cerrado.');break;}makeOffer(d.id);S.modal={type:'sell',id:d.id};break;
  case'sell-ok':sell(d.id);return;
  case'offer-no':{const o=S.offers[d.id];if(!o)break;delete S.offers[d.id];const p=PL(d.id);news(`Rechazas la oferta de ${T(o.team).name} por ${p.name}.`);if(LG(T(o.team).lg).rep>LG(uLg()).rep+3&&(p.per==='amb'||p.hap<60)){p.hap=clamp(p.hap-12,0,100);news(`${p.name} quería ese traspaso a un club más grande y está molesto.`,'bad');if(p.hap<25&&!p.req){p.req=1;news(`${p.name} pide salir del club.`,'bad');}}break;}
  case'ov':case'modal-close':S.modal=null;break;
  case'new-season':newSeason();return;
  case'new-game':case'to-saves':saveNow();clearInterval(RT.timer);RT.timer=null;setS(null);dirty();render();window.scrollTo(0,0);return;
  case'new-game-ok':clearInterval(RT.timer);RT.timer=null;clearTimeout(RT.saveT);RT.saveT=null;setS(null);dirty();try{localStorage.removeItem(KEY);}catch(err){}render();window.scrollTo(0,0);return;
 }
 save();render();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&S&&(S.modal||S.moreOpen)){S.modal=null;S.moreOpen=false;render();return;}
 if(e.key==='Enter'&&e.target.id==='bidAmt'){e.preventDefault();document.querySelector('[data-a="bid"]')?.click();return;}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr[data-a]')){e.preventDefault();e.target.click();}
});
document.addEventListener('change',e=>{
 if(!S||S.user==null)return;const id=e.target.id,v=e.target.value;
 const map={mksp:'sp',mkc:'c',mklv:'lv',mkmin:'min',mkage:'age',mkmax:'max',mksort:'sort'};
 if(id==='formSel'){setFormation(v);S.sel=null;}
 else if(id==='cupC'){S.cupC=+v;}
 else if(id==='hiC'){S.hiC=+v;}
 else if(id==='t-cap'||id==='t-pk'||id==='t-fk'||id==='t-ck'){T(S.user)[id.slice(2)]=v||null;}
 else if(e.target.dataset&&e.target.dataset.role!=null){userRoles()[+e.target.dataset.role]=v;}
 else if(e.target.dataset&&e.target.dataset.ord){const t=T(S.user);t.orders=t.orders||{};t.orders[e.target.dataset.ord]=v;}
 else if((id==='m-est'||id==='m-pre')&&S.match){S.match.tac[S.match.us][id.slice(2)]=v;addEv(S.match,'sys',null,`Cambio táctico: ${id==='m-est'?'estilo':'presión'} ${(id==='m-est'?TACS.est.o:TACS.pre.o)[v].toLowerCase()}`);}
 else if(e.target.dataset&&e.target.dataset.job){const sc=S.scouts.find(x=>x.id===e.target.dataset.job);if(sc)sc.job=v;}
 else if(e.target.dataset&&e.target.dataset.reg){const sc=S.scouts.find(x=>x.id===e.target.dataset.reg);if(sc)sc.reg=+v;}
 else if(e.target.dataset&&e.target.dataset.tf){const p=PL(e.target.dataset.tf);if(p)p.tf=v;}
 else if(id==='awC'){const c=+v,cur=LG(S.awLg!=null?S.awLg:uLg());S.awLg=findLg(c,Math.min(cur.lv,COUNTRIES[c].lv-1)).id;}
 else if(id==='lgC'){const c=+v,cur=LG(S.ligaLg);S.ligaLg=(findLg(c,Math.min(cur.lv,COUNTRIES[c].lv-1))).id;}
 else if(map[id]){S.mk[map[id]]=v;S.mk.limit=40;}
 else if(id==='mkok'){S.mk.ok=e.target.checked;S.mk.limit=40;}
 else if(id==='mklast'){S.mk.last=e.target.checked;S.mk.limit=40;}
 else return;
 save();render();
});
document.addEventListener('input',e=>{
 if(!S||e.target.id!=='mkq')return;S.mk.q=e.target.value;S.mk.limit=40;
 const box=document.getElementById('mklist');if(box)box.innerHTML=mkList();
});
