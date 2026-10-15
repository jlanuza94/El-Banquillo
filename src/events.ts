/* El Banquillo · events.js — Clics, cambios de formularios y teclado. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {setDrill,setLead,setPLoad,tcPreset} from './tcenter';
import {TITLES,hasTitle,setTitle,tInc} from './mtitles';
const TITLES_CAT=k=>TITLES[k]?TITLES[k][0]:'peo';
import {askMentor,interviewChance,interviewQs,pickSpec} from './mgrcareer';
import {convalidate,eligibility,enroll} from './coach';
import {oopSwap} from './oop';
import {offerStaffRole} from './mgrcareer';
import {INT_MAX,friendlyWait as fWait2,inPre,internalMatch} from './preseason';
import {playTour} from './season';
import {eff} from './tactics';
import {poisson} from './engine';
import {markPre} from './preseason';
import {COND_MAX} from './plans';
import {DELEG,deleg,delegWeekly,setDeleg} from './delegate';
import {PRESETS_T,setPreset,setSession} from './training2';
import {dlActive,dlStep} from './marketfm';
import {aiTransfers,isDeadline} from './market';
import {incomingOffer} from './squad';
import {lgDay} from './calendar';
import {poAdvance} from './playoffs';
import {applyResult,createMatch,quickMatch} from './engine';
import {compLabel,mkTie} from './competitions';
import {TS,processBids,sendBid} from './marketfm';
import {fineHim,indivTalk,jobDecision,startProject,startStadium} from './extras2';
import {liveRatings} from './engine';
import {seatCost} from './club';
import {hireFromClub,resolveMoment} from './extras';
import {pickScorer,scoreStr,shotLog} from './engine';
import {ST_ROLES} from './staff';
import {recallLoan,setDev} from './devplus';
import {delSearch,loadSearch,saveSearch,searchName,startMission,stopMission} from './scoutplus';
import {PRESETS,applyPreset} from './tactics2';
import {userPos} from './positions';
import {MAX_SUBS,removeFromTeam,setSub,subsOf} from './tactics';
import {continueDay} from './calendar';
import {FREE,afterMove,coordsOf,moveDot,spAt,moveSlotTo} from './freeboard';
import {roleList} from './roles';
import {doBuyback,setBuyback} from './negotiate';
import {PLANS,setPlan} from './medical';
import {saveName} from './saveio';
import {tutEnd,tutGo,tutStart} from './tutorial';
import {matchFx,soundOn,startReplay,stopReplay,toggleSound} from './replay';
import {dropReto,startReto} from './retos';
import {applyNT,autoCall,leaveNT,takeNT,toggleCall} from './nations';
import {meetAnswer,onOfferRejected} from './talks';
import {cycleTheme,THEMES} from './theme';
import {searchResults} from './views/search';
import {editClub,editNames,editPlayer,exportClubsCSV,exportMod,exportPlayersCSV,importData} from './mods';
import {addAffiliate,createFilial,fromFilial,moveBudget,removeAffiliate,takeBankLoan,toFilial} from './clubplus';
import {loadPlan,planInMatch,savePlan} from './plans';
import {addPair,removePair} from './mentor';
import {DIFF} from './difficulty';
import {queueScout,scoutWeeks} from './scouting';
import {fireStaff,hireStaff,renewStaff,staffCourse,staffMax} from './staff';
import {KEY,clamp,money,pick,r2,r3,rnd} from './core';
import {ATTRS,COUNTRIES,MENT,OIS,TAC0,TACS} from './data';
import {RT,LG,PL,S,T,available,dirty,findLg,lgName,rt,uLg,setS} from './state';
import {news,pickTeam} from './world';
import {autoLineup,fixLineup,nRounds,rotateLineup,setFormation,slotsOf,teamPower,userRoles} from './tactics';
import {addEv,doSub,talkEffect} from './engine';
import {finishRound,newSeason,playFriendly,playMatch,runTimer,simRun,simState,simToEnd,stopSim} from './season';
import {inWindow,makeBid,makeOffer,makeTerms,negState,readTerms,refuses,sell} from './market';
import {acceptLoanOut,buyOption,makeLoanOut,renState,requestLoan} from './contracts';
import {answerPress,boardAsk,spDesc,startBuild} from './club';
import {chatOpt} from './squad';
import {clubReq,jobCandidates,loseJob,makeJobOffer,takeJob} from './career';
import {promoteYouth,regionOf,signProspect} from './academy';
import {deleteSlot,exportCode,freeSlot,importCode,loadSlot,save,saveNow} from './persist';
import {render,toast} from './views/common';
import {markAll,markRead} from './inbox';
import {mkList} from './views/market';
import {boot,start} from './boot';
/** Descarga un archivo (y, si el navegador no deja, lo copia al portapapeles). */
export function download(name,text,mime){
 if(typeof window!=='undefined'&&window.ElBanquillo&&window.ElBanquillo.saveFile){try{window.ElBanquillo.saveFile(name,String(text));return;}catch(e){}}
 try{const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:mime+';charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast(`Descargando ${name}…`);}
 catch(e){try{navigator.clipboard.writeText(text);toast('No se pudo descargar: copiado al portapapeles.');}catch(err){toast('No se pudo descargar el archivo.');}}
}
export function placeInSlot(pid,i){
 const t=T(S.user),p=PL(pid);if(!available(p)){toast(`${p.name} no está disponible (${p.inj?'lesionado':'sancionado'}).`);return;}
 const j=t.lineup.indexOf(pid),prev=t.lineup[i];if(j>=0)t.lineup[j]=prev;
 else if(t.subs&&t.subs.length){const b=t.subs.indexOf(pid);t.subs=t.subs.filter(x=>x!==pid);if(prev&&b>=0)t.subs.splice(b,0,prev);}
 t.lineup[i]=pid;S.sel=null;
}
/** Barra de probabilidad de la oferta (se actualiza al escribir o tocar +/−). */
function oddsUpd(i){const o=document.getElementById('ngOdds');if(!o)return;const v=+i.value||0,ask=+i.dataset.ask||0,L=v>=ask?['Muy probable','hi']:v>=ask*.92?['Posible contraoferta','md']:v>=ask*.8?['Difícil','lo']:['Casi imposible','no'];o.className='ngodds '+L[1];o.querySelector('span').textContent=L[0];}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el)return;
 const a=el.dataset.a,d=el.dataset;
 if(a==='bid-step'||a==='bid-set'){const i=document.getElementById('bidAmt');if(!i)return;const ask=+i.dataset.ask||0;let v=a==='bid-set'?+d.v:Math.max(0,(+i.value||0)+(+d.v)*Math.max(1,ask));i.value=(Math.round(v*1000)/1000).toFixed(3);oddsUpd(i);return;}
 if(a==='theme'){const t=cycleTheme();toast('Tema: '+THEMES[t]+(t==='auto'?' (como el móvil)':''));render();return;}
 if(!S||S.user==null){if(a==='slot-load'){loadSlot(+d.id).then(o=>{if(o)boot(o);else{toast('No se pudo cargar esa partida.');}});return;}
  if(a==='slot-del'){RT.delConfirm=+d.id;render();return;}if(a==='slot-del-no'){RT.delConfirm=null;render();return;}
  if(a==='slot-del-ok'){RT.delConfirm=null;deleteSlot(+d.id).then(render);return;}
  if(a==='start-go'){RT.startScreen=d.v;if(d.v==='new')RT.startStep=RT.startStep||'c';render();window.scrollTo(0,0);return;}
  if(a==='start-diff'){RT.diff=d.v;render();return;}
  if(a==='start-mode'){RT.mode=d.v;render();return;}
  if(a==='seed-go'){const v=parseInt(document.getElementById('seedIn')?.value||'',10);if(v>=0){RT.seed=v;setS(null);render();}return;}
  if(a==='seed-new'){RT.seed=null;setS(null);render();return;}
  if(a==='mod-clear'){RT.mod=null;RT.modMsg=null;setS(null);render();return;}
  const rdC=()=>{const g=id=>document.getElementById(id),c=RT.coach=RT.coach||{};if(g('cName')){c.first=g('cName').value.trim();c.sur=g('cSur')?g('cSur').value.trim():'';c.name=[c.first,c.sur].filter(Boolean).join(' ')||undefined;}if(g('cNat'))c.nat=+g('cNat').value;if(g('cAge'))c.age=+g('cAge').value;};
  if(a==='cc-step'){rdC();RT.cstep=+d.v;render();return;}
  if(a==='start-lic'){rdC();RT.coach.lic=d.v;render();return;}
  if(a==='start-bg'||a==='start-lead'){rdC();RT.coach[a==='start-bg'?'bg':'lead']=d.v;render();return;}
  if(a==='pick-team'){RT.pickT=+d.i;RT.startStep='coach';RT.cstep=0;render();window.scrollTo(0,0);return;}
  if(a==='start-sign'){rdC();pickTeam(RT.pickT);RT.pickT=null;return;}
  if(false){}else if(a==='start-c'){RT.startC=+d.v;RT.startLv=COUNTRIES[RT.startC].lv-1;RT.startStep='d';render();document.getElementById('nuevo')?.scrollIntoView({block:'start'});}else if(a==='start-lv'){RT.startLv=+d.v;RT.startStep='club';render();document.getElementById('nuevo')?.scrollIntoView({block:'start'});}else if(a==='start-step'){RT.startStep=d.v;render();}return;}
 if(a==='ov'&&e.target!==el)return;
 const m=S.match;
 switch(a){
  case'view':if(S.match&&d.v!=='partido'&&!S.match.paused){S.match.paused=true;clearInterval(RT.timer);RT.timer=null;}if(d.v==='plantilla')markPre('pl');else if(d.v==='tacticas')markPre('tac');else if(d.v==='mercado')markPre('mk');S.view=d.v;S.sel=null;S.moreOpen=false;if(d.v==='liga'||(d.v==='mundo'&&S.ligaLg==null)){S.ligaLg=uLg();S.ligaRound=clamp(S.week-(S.week>=nRounds()?1:0),0,nRounds()-1);}window.scrollTo(0,0);break;
  case'slot':{const i=+d.i,t=T(S.user);if(S.sel&&S.sel.type==='player'){placeInSlot(S.sel.id,i);}else if(S.sel&&S.sel.type==='slot'){if(S.sel.i===i)S.sel=null;else{const x=t.lineup[i];t.lineup[i]=t.lineup[S.sel.i];t.lineup[S.sel.i]=x;S.sel=null;}}else S.sel={type:'slot',i};break;}
  case'bslot':{if(S.sel&&S.sel.type==='player'&&S.sel.id!==d.pid){setSub(S.sel.id,+d.k);S.sel=null;}else if(S.sel&&S.sel.type==='slot'&&d.pid){placeInSlot(d.pid,S.sel.i);}else S.sel=d.pid&&!(S.sel&&S.sel.id===d.pid)?{type:'player',id:d.pid}:null;break;}
  case'lj-k':S.ljK=d.v;break;
  case'mk-kind':S.mkKind=d.v;break;
  case'mk-sort':{const k=d.v;if(S.mk.sort===k)S.mk.dir=-(S.mk.dir||1);else{S.mk.sort=k;S.mk.dir=1;}S.mk.limit=40;break;}
  case'mk-attr':S.mk.attr=!S.mk.attr;break;
  case'm-preok':if(S.match)S.match.preOk=true;break;
  case'sub-add':{const t=T(S.user),n=subsOf(t).length;if(n<MAX_SUBS)setSub(d.id,n);break;}
  case'sub-rem':removeFromTeam(d.id);break;
  case'mk-view':S.mk.view=d.v;break;
  case'm-w':S.mw=d.v;break;
  case'lmode':S.lmode=d.v;break;
  case'lph':S.lph=d.v;S.oopSel=null;S.sel=null;break;
  case'oop-slot':{const i=+d.i;if(S.oopSel==null||S.oopSel===i)S.oopSel=S.oopSel===i?null:i;else{oopSwap(T(S.user),S.oopSel,i);S.oopSel=null;}break;}
  case'vtab':S.vt=S.vt||{};S.vt[d.k]=d.v;S.sel=null;if(d.go)S.view=d.go;document.querySelector('main')?.scrollTo?.(0,0);break;
  case'loan-recall':{const err=recallLoan(d.id);if(err)toast(err);break;}
  case'dev-set':break;
  case'pub-fine':fineHim(d.id);break;
  case'pub-sell':S.view='mercado';S.mk.tab='sell';break;
  case'proj':startProject(d.v);break;
  case'ns-build':{const err=startStadium(seatCost);if(err)toast(err);break;}
  case'po-play':{if(!S.po)break;S.match=createMatch({k:'po',i:+d.i});S.match.label=compLabel({k:'po',i:+d.i});S.view='partido';break;}
  case'po-sim':poAdvance(quickMatch,applyResult,mkTie);break;
  case'tc-slot':S.tcSel={d:+d.d,s:+d.s};S.vt=S.vt||{};S.vt.ent='ses';break;
  case'tc-pick':if(S.tcSel){setDrill(S.tcSel.d,S.tcSel.s,d.v);S.tcSel=null;S.vt.ent='cal';}break;
  case'tc-clear':if(S.tcSel){setDrill(S.tcSel.d,S.tcSel.s,'');S.tcSel=null;S.vt.ent='cal';}break;
  case'tc-cancel':S.tcSel=null;S.vt.ent='cal';break;
  case'tc-cat':S.tcCat=d.v;break;
  case'tc-load':setPLoad(d.id,d.v);break;
  case'tr-preset':tcPreset(d.v);toast('Semana: '+PRESETS_T[d.v].n.toLowerCase()+'.');break;
  case'pique':if(S.pique){S.pique.resp=d.v;toast(d.v==='r'?'Le respondes en la prensa. Ahora toca ganar.':'Prefieres no entrar al trapo.');}break;
  case'sp-prep':S.spPrep={opp:+d.id};toast('El equipo prepara la defensa a balón parado contra este rival.');break;
  case'staff-club':{const err=hireFromClub(d.id,ST_ROLES);if(err)toast(err);break;}
  case'preset':{const t=T(S.user),b=teamPower(t.lineup,t.formation,null,null,1,userRoles()).ovr;applyPreset(d.v);const a=teamPower(t.lineup,t.formation,null,null,1,userRoles()).ovr,dp=Math.round((a/b-1)*100);
   toast(`Sistema cargado: ${PRESETS[d.v].n}. `+(dp<=-3?`Ojo: tu once rinde un ${-dp}% menos en ${t.formation}. Pulsa «Alinear mejores» o busca jugadores para este sistema.`:dp>=3?`Tu once rinde un ${dp}% más en ${t.formation}.`:'Tu plantilla encaja bien en este sistema.'));break;}
  case'pos-sel':S.posSel=+d.i;break;
  case'duty':{const t=T(S.user);userPos(slotsOf(t.formation));t.duty[+d.i]=d.v;break;}
  case'pi-tog':{const t=T(S.user),sl=slotsOf(t.formation);userPos(sl);const L=t.pi[+d.i]=t.pi[+d.i]||[],k=L.indexOf(d.v);if(k>=0)L.splice(k,1);else{if(L.length>=3){toast('Máximo 3 instrucciones por puesto.');break;}L.push(d.v);}break;}
  case'pos-put':placeInSlot(d.id,+d.i);break;
  case'subs-auto':T(S.user).subs=[];toast('Banquillo automático: entran los mejores disponibles.');break;
  case'row':{if(S.view==='plantilla'){S.sel=null;S.modal={type:'ficha',id:d.id};break;}if(S.sel&&S.sel.type==='slot')placeInSlot(d.id,S.sel.i);else if(S.sel&&S.sel.id===d.id)S.sel=null;else S.sel={type:'player',id:d.id};break;}
  case'mk-adv':S.mk.adv=!S.mk.adv;break;
  case'ficha':S.modal={type:'ficha',id:d.id};break;
  case'scout':{const err=queueScout(d.id);toast(err||`${PL(d.id).name} queda en la lista de ojeo. Tendrás el informe en ${scoutWeeks()} jornada${scoutWeeks()>1?'s':''}.`);break;}
  case'aw-tab':S.awTab=d.v;break;
  case'aw-stat':S.awStat=d.v;break;
  case'aw-lv':{const L=LG(S.awLg!=null?S.awLg:uLg());S.awLg=findLg(L.c,+d.v).id;break;}
  case'cmp':{if(S.cmpA&&S.cmpA!==d.id&&PL(S.cmpA)){S.modal={type:'cmp',a:S.cmpA,b:d.id};S.cmpA=null;}else{S.cmpA=d.id;S.modal=null;toast(`Ahora abre la ficha de otro jugador y pulsa «Comparar».`);}break;}
  case'rot-tog':S.autoRot=S.autoRot===false;break;
  case'rot-now':{const n=rotateLineup();toast(n?`Tu segundo hace ${n} cambio${n>1?'s':''} en el once.`:'No hace falta rotar: todos están frescos.');break;}
  case'mentor-add':{const err=addPair(document.getElementById('mtY')?.value,document.getElementById('mtM')?.value);toast(err||'Tutelaje en marcha.');break;}
  case'mentor-del':removePair(d.id);break;
  case'club-open':S.modal={type:'club',id:+d.id};break;
  case'bud-move':{const e=moveBudget(+d.v);if(e)toast(e);break;}
  case'bank-take':{const e=takeBankLoan(+d.i);if(e)toast(e);break;}
  case'fil-create':{const e=createFilial();toast(e||'Ya tienes filial.');break;}
  case'fil-up':{const e=fromFilial(d.id);toast(e||'Sube al primer equipo.');break;}
  case'fil-down':{const id=document.getElementById('filDown')?.value;const e=id?toFilial(id):'Elige un jugador.';toast(e||'Baja al filial.');break;}
  case'aff-add':{const e=addAffiliate(d.id);if(e)toast(e);break;}
  case'aff-del':removeAffiliate(d.id);break;
  case'ed-tab':S.edTab=d.v;S.ioMsg=null;break;
  case'ed-search':S.edQ=document.getElementById('edQ')?.value||'';break;
  case'ed-mine':S.edClub=S.user;break;
  case'ed-club':S.edClub=+d.id;break;
  case'ed-club-save':{const g=x=>document.getElementById(x)?.value;const e=editClub(+d.id,{name:g('edName'),short:g('edShort'),c1:g('edC1'),c2:g('edC2'),cs:g('edCs')});toast(e||'Club guardado.');break;}
  case'ed-squad':S.edSquad=+d.id;S.edTab='pl';S.edPl=null;break;
  case'ed-psearch':S.edPQ=document.getElementById('edPQ')?.value||'';S.edSquad=null;break;
  case'ed-pl':S.edPl=d.id;break;
  case'ed-pl-save':{const g=x=>document.getElementById(x)?.value,o={name:g('edPName'),nat:g('edPNat'),sp:g('edPSp'),age:g('edPAge'),foot:g('edPFoot'),pot:g('edPPot')};ATTRS.forEach(k=>o[k]=g('edA-'+k));const e=editPlayer(d.id,o);if(!e)PL(d.id).edited=1;toast(e||'Jugador guardado.');break;}
  case'ed-names-save':{const cn={},ln={};COUNTRIES.forEach((c,i)=>cn[i]=document.getElementById('edCn-'+i)?.value||'');S.leagues.forEach(L=>ln[L.id]=document.getElementById('edLn-'+L.id)?.value||'');editNames(cn,ln);toast('Nombres guardados.');break;}
  case'io-mod':download('el-banquillo-mod.json',exportMod(false),'application/json');break;
  case'io-mod-all':download('el-banquillo-mod-completo.json',exportMod(true),'application/json');break;
  case'io-clubs':download('clubes.csv',exportClubsCSV(),'text/csv');break;
  case'io-squad':download('mi-plantilla.csv',exportPlayersCSV(S.user),'text/csv');break;
  case'io-players':download('jugadores.csv',exportPlayersCSV(null),'text/csv');break;
  case'io-paste':{S.ioMsg=importData(document.getElementById('ioTxt')?.value||'');break;}
  case'gsearch':S.modal={type:'search'};render();setTimeout(()=>document.getElementById('gsq')?.focus(),30);return;
  case'gs-lg':S.modal=null;S.view='mundo';S.ligaLg=+d.id;break;
  case'set-mode':S.mode=d.v;toast(d.v==='rapido'?'Modo rápido: tu segundo se encarga de lo rutinario.':'Modo profundo: controlas todo.');break;
  case'an-tab':S.anTab=d.v;break;
  case'an-p90':S.anP90=d.v==='1';break;
  case'deleg':{setDeleg(d.v,!deleg(d.v));if(d.v==='tr'&&deleg('tr')){S.delegWhy=null;delegWeekly();}if(d.v==='oj'&&deleg('oj'))delegWeekly();toast(deleg(d.v)?`${DELEG[d.v].n}: lo lleva tu cuerpo técnico.`:`${DELEG[d.v].n}: lo llevas tú.`);break;}
  case'cond-add':{const t=T(S.user);t.cond=t.cond||[];if(t.cond.length<COND_MAX)t.cond.push({w:t.cond.length===0?'win':t.cond.length===1?'lose':'draw',min:t.cond.length===0?75:65,plan:null,ment:t.cond.length===0?'def':t.cond.length===1?'att':null});break;}
  case'cond-del':{const t=T(S.user);(t.cond||[]).splice(+d.i,1);break;}
  case'help':S.modal={type:'help',v:d.v};break;
  case'an-match':S.modal={type:'mrep',i:+d.i};break;
  case'trep':S.modal=d.v==='live'?{type:'trep',live:1}:{type:'trep',n:+d.v};break;
  case'plan-save':savePlan(d.v);toast(`Táctica ${d.v} guardada.`);break;
  case'plan-load':loadPlan(d.v);S.sel=null;toast(`Usas la táctica ${d.v}.`);break;
  case'm-plan':if(m&&planInMatch(m,d.v))addEv(m,'sys',null,`${T(m[m.us]).short} cambia a la táctica ${d.v}: ${m.f[m.us]}, ${MENT[m.ment[m.us]].label.toLowerCase()}.`);break;
  case'sp':{const t=T(S.user);t.sp=Object.assign({},t.sp||{});t.sp[d.k]=d.v;break;}
  case'set-diff':S.diff=d.v;toast(`Dificultad: ${DIFF[d.v].n}.`);break;
  case'mail-open':S.mailSel=d.id;markRead(d.id);break;
  case'mail-back':S.mailSel=null;break;
  case'mail-cat':S.mailCat=d.v;S.mailSel=null;break;
  case'mail-all':markAll(S.mailCat);break;
  case'offer-view':{const o=S.offers[d.id];if(o&&o.incoming&&PL(d.id)&&PL(d.id).team===S.user)S.modal={type:'sell',id:d.id};else toast('Esa oferta ya ha caducado.');break;}
  case'pl-open':S.view='plantilla';S.plTab=d.v;window.scrollTo(0,0);break;
  case'ment':T(S.user).ment=d.v;break;
  case'xi-clear':{const t=T(S.user);t.lineup=t.lineup.map(()=>null);t.subs=[];S.sel=null;toast('Once vacío: arrastra jugadores de la lista al campo, o toca un hueco y luego un jugador.');break;}
  case'auto':T(S.user).lineup=autoLineup(S.user,T(S.user).formation);S.sel=null;toast('Once con los mejores jugadores disponibles.');break;
  case'fixlu':{const k=fixLineup();toast(k?`Cubiertos ${k} hueco${k>1?'s':''}.`:'No quedan suplentes disponibles.');break;}
  case'play':S.modal=null;playMatch();return;
  case'mom':resolveMoment(m,d.v,{shotLog,addEv,scoreStr,pickScorer});if(m.subOpen){m.paused=true;}break;
  case'm-play':if(m&&m.mom){toast('Primero decide qué hacer.');return;}stopReplay();matchFx(m);m.paused=false;m.alert='';m.subOpen=false;render();runTimer();return;
  case'm-pause':m.paused=true;clearInterval(RT.timer);RT.timer=null;break;
  case'm-speed':m.speed=+d.v;S.mSpeed=+d.v;render();runTimer();return;
  case'm-ment':if(m.ment[m.us]!==d.v){m.ment[m.us]=d.v;addEv(m,'sys',null,`${T(m[m.us]).short} cambia a mentalidad ${MENT[d.v].label.toLowerCase()}`);}break;
  case'm-oi':{m.oi=m.oi||{};const o=m.oi[m.us]=m.oi[m.us]||{};o[d.v]=!o[d.v];addEv(m,'sys',null,`${o[d.v]?'Nueva instrucción':'Se retira la instrucción'}: ${OIS[d.v].n.toLowerCase()}.`);break;}
  case'oi':{const t=T(S.user);t.oi=t.oi||{};t.oi[d.v]=!t.oi[d.v];break;}
  case'm-tab':S.mtab=d.v;break;
  case'm-side':S.mside=d.v;break;
  case'm-subout':m.subOut=d.id;m.subOpen=true;m.paused=true;clearInterval(RT.timer);RT.timer=null;break;
  case'm-subs':m.subOpen=true;m.paused=true;clearInterval(RT.timer);RT.timer=null;break;
  case'm-subclose':m.subOpen=false;break;
  case'm-dosub':{const o=document.getElementById('subOut').value,n=document.getElementById('subIn').value;if(o&&n&&doSub(m,m.us,o,n)){m.alert='';m.subOpen=false;toast('Cambio hecho.');}break;}
  case'm-sim':simToEnd();return;
  case'm-finish':if(m&&m.mom){toast('Primero decide qué hacer.');return;}finishRound();return;
  case'itk':{const pid=document.getElementById('itkP')?.value;const r=indivTalk(m,pid,d.v,liveRatings(m)[pid]);if(typeof r==='string')toast(r);else if(r){addEv(m,'sys',null,`Charla en el descanso: ${r.txt}`);toast(r.txt);}break;}
  case'liga-r':S.ligaRound=clamp(S.ligaRound+(+d.d),0,nRounds()-1);break;
  case'liga-lv':S.ligaLg=findLg(LG(S.ligaLg).c,+d.v).id;break;
  case'liga-mine':S.ligaLg=uLg();break;
  case'w-country':{const c=+d.v,cur=LG(S.ligaLg);S.ligaLg=findLg(c,Math.min(cur.lv,COUNTRIES[c].lv-1)).id;break;}
  case'cup-tab':S.cupTab=d.v;break;
  case'more':S.moreOpen=true;break;
  case'press':answerPress(+d.i);break;
  case'board':S.boardMsg=boardAsk(d.k);break;
  case'more-close':if(e.target!==el)return;S.moreOpen=false;break;
  case'sim-menu':S.modal={type:'sim'};break;
  case'sim-go':{const st=document.getElementById('simStop');S.simStop=st?st.checked:true;S.modal=null;S.moreOpen=false;if(S.match&&!S.match.done){toast('Termina antes el partido en juego.');break;}simRun(d.v,S.simStop);return;}
  case'sim-stop':stopSim();return;
  case'friendly':playFriendly(+d.id);return;
  case'pre-rep':markPre('rep');S.modal={type:'prerep'};break;
  case'pt-join':if(S.ptour&&S.ptour.st==='inv'){S.ptour.st=d.v==='yes'?'sf':'no';toast(d.v==='yes'?`Te apuntas al ${S.ptour.n}.`:'Rechazas la invitación.');}S.modal=null;break;
  case'pt-play':playTour();return;
  case'pt-view':S.modal={type:'ptour'};break;
  case'int-play':{if(!inPre()||(S.pre.intN||0)>=INT_MAX)break;if(fWait2()>0){toast(`Los jugadores necesitan descanso: dentro de ${fWait2()} día${fWait2()>1?'s':''}.`);break;}internalMatch(eff,slotsOf,autoLineup,rnd,poisson,news);markPre('int');S.modal={type:'intm'};break;}
  case'pre-buy':markPre('mk');S.modal=null;S.view='mercado';S.mk.tab='buy';S.mk.pos='ALL';S.mk.sp=d.v;S.mk.limit=40;break;
  case'pre-skip':if(S.pre)S.pre.left=0;break;
  case'sponsor':{const o=S.spOffers[+d.i];if(o){S.sponsor=o;news(`Firmas con ${o.name}: ${spDesc(o)}`,'good');}break;}
  case'abo':S.club.abo=clamp(S.club.abo+(+d.d)*(S.club.abo>=300?20:S.club.abo>=100?10:5),20,6000);break;
  case'price':S.club.price=clamp(S.club.price+(+d.d)*(S.club.price>=30?2:1),2,250);break;
  case'build':startBuild(d.t,+d.n||0);break;
  case'car-title':setTitle(d.v);S.vt=S.vt||{};S.vt.ttc=TITLES_CAT(d.v);break;
  case'car-tcat':S.vt=S.vt||{};S.vt.ttc=d.v;break;
  case'tac':{const t=T(S.user);t.tac=Object.assign({},TAC0,t.tac||{});t.tac[d.k]=d.v;break;}
  case'hi-tab':S.hiTab=d.v;break;
  case'v2d':S.v2d=d.v==='1';break;
  case'replay':if(m&&!m.done&&!m.paused){m.paused=true;clearInterval(RT.timer);RT.timer=null;}S.v2d=true;startReplay(+d.i);render();window.document.getElementById('pitch2d')?.scrollIntoView({block:'center'});return;
  case'replay-stop':stopReplay();break;
  case'sound':{const v=toggleSound();toast(v?'Sonido y vibración activados':'Sonido y vibración desactivados');break;}
  case'save-file':{const n=saveName();download(n,exportCode(),'text/plain');break;}
  case'save-share':{const n=saveName(),code=exportCode();try{const f=new File([code],n,{type:'text/plain'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Partida de El Banquillo'}).catch(()=>{});}else{download(n,code,'text/plain');}}catch(err){download(n,code,'text/plain');}break;}
  case'backup':{const code=exportCode();S.modal={type:'backup',code};try{navigator.clipboard.writeText(code).then(()=>toast('Copia de seguridad copiada al portapapeles.'),()=>{});}catch(err){}break;}
  case'bk-select':{const ta=document.getElementById('bkTxt');if(ta){ta.focus();ta.select();}return;}
  case'restore':S.modal={type:'restore'};break;
  case'rs-go':{const v=document.getElementById('rsTxt')?.value;if(importCode(v)){toast('Partida restaurada.');return;}S.modal={type:'restore',err:'El código no es válido o está incompleto. Copia el texto entero, empezando por EB1:'};break;}
  case'ct-sel':S.ctSel=+d.v;break;
  case'ct-open':S.modal=null;S.view='copas';S.cupTab='ct';S.ctSel=+d.v;break;
  case'talk':{if(!m||m.talks[d.p])break;const r=talkEffect(m,d.p,d.v);if(d.v==='exi'||d.v==='bro'){if(m.ref.k!=='fr')tInc('bro');if(hasTitle('sec'))r.d=r.d>0?r.d*1.4:r.d*.6;}m.talks[d.p]={opt:d.v,d:r.d,txt:r.txt};m.mult[m.us]*=1+r.d;addEv(m,'sys',null,`Charla ${d.p==='pre'?'previa':'del descanso'}: ${r.txt}`);break;}
  case'scout-hire':{const i=S.scoutPool.findIndex(x=>x.id===d.id);if(i>=0&&S.scoutPool[i].fee&&S.budget<S.scoutPool[i].fee){toast(`No te llega para la indemnización (${money(S.scoutPool[i].fee)}).`);break;}if(i>=0&&S.scouts.length<staffMax('sc')){const sc=S.scoutPool.splice(i,1)[0];if(sc.fee){S.budget=r3(S.budget-sc.fee);if(T(sc.club))T(sc.club).cash=r2((T(sc.club).cash||0)+sc.fee);sc.fee=0;sc.club=null;}sc.reg=Math.max(0,regionOf(LG(uLg()).c));S.scouts.push(sc);toast(`${sc.name} se une como ojeador.`);}break;}
  case'scout-fire':S.scouts=S.scouts.filter(x=>x.id!==d.id);break;
  case'pros-sign':signProspect(d.id);break;
  case'ac-up':promoteYouth(d.id);break;
  case'ac-free':{const p=S.academy.find(x=>x.id===d.id);S.academy=S.academy.filter(x=>x.id!==d.id);if(p)toast(`${p.name} deja la cantera.`);break;}
  case'job-yes':{const o=S.jobOffers[+d.i];if(o){jobDecision(o,true);takeJob(o);}break;}
  case'job-no':jobDecision(S.jobOffers[+d.i],false);S.jobOffers.splice(+d.i,1);break;
  case'job-search':S.showJobs=!S.showJobs;break;
  case'job-apply':{const t=T(+d.id),E=eligibility(t);if(!E.ok){toast(`No puedes optar: ${E.miss[0]}.`);break;}S.modal={type:'interview',tid:t.id,i:0,score:0};break;}
  case'iv-ans':{const md=S.modal;if(!md||md.type!=='interview')break;const t=T(md.tid),Q=interviewQs(t);md.score+=Q[md.i].o[+d.v][1];md.i++;if(md.i>=Q.length){const ch=interviewChance(t,md.score,clubReq);if(rnd()<ch){S.modal={type:'joboffer',o:makeJobOffer(t)};}else{S.applied[t.id]=S.seasonN;S.modal=null;toast(`${t.name} prefiere a otro candidato (tenías un ${Math.round(ch*100)}% de opciones).`);}}break;}
  case'car-course':{const e=enroll(d.v);if(e)toast(e);break;}
  case'car-conv':{const e=convalidate(d.v);if(e)toast(e);break;}
  case'car-rules':S.modal={type:'rules'};break;
  case'car-spec':pickSpec(d.v);break;
  case'car-mentor':{const e=askMentor(d.id);if(e)toast(e);break;}
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
  case'st-offer':{const r=document.getElementById('rr_'+d.id)?.value||'ent';const err=offerStaffRole(d.id,r);if(err)toast(err);break;}
  case'st-course':{const err=staffCourse(d.id);if(err)toast(err);break;}
  case'st-slot':S.vt=S.vt||{};S.vt.st='fich';S.stRole=d.v;break;
  case'st-role':S.stRole=d.v||null;break;
  case'cup-open':S.modal=null;S.view='copas';S.cupTab='cup';S.cupC=null;break;
  case'cwc-open':S.modal=null;S.view='copas';S.cupTab='cwc';break;
  case'mk-tab':S.mk.tab=d.v;S.mk.limit=40;break;
  case'mk-save':saveSearch(searchName());toast('Búsqueda guardada.');break;
  case'mk-load':loadSearch(+d.i);break;
  case'mk-del':delSearch(+d.i);break;
  case'mis-go':{const F=S.misF||{},err=startMission(d.id,F.misC??(S.mk.c!=='ALL'&&S.mk.c!=='FA'?S.mk.c:wcs()[0]),F.misG||'ALL',F.misA||'21',F.misW||'4');if(err)toast(err);else toast('Ojeador en camino.');break;}
  case'mis-stop':stopMission(d.id);break;
  case'mk-pos':S.mk.pos=d.v;S.mk.limit=40;break;
  case'mk-fa':S.view='mercado';S.mk.tab='buy';S.mk.c='FA';S.mk.adv=true;S.mk.sort='ovr';S.mk.limit=40;S.modal=null;break;
  case'mk-more':S.mk.limit+=40;break;
  case'fav':{const i=S.short.indexOf(d.id);if(i>=0)S.short.splice(i,1);else{S.short.push(d.id);toast('Añadido a Seguimiento.');}break;}
  case'neg':negState(d.id);S.modal={type:'neg',id:d.id};break;
  case'bid':{const g=x=>document.getElementById(x),v=parseFloat(String(g('bidAmt')?.value||'').replace(',','.'));sendBid(d.id,v,{inst:+(g('bidInst')?.value||1),son:!!g('bidSon')?.checked,swap:g('bidSwap')?.value||null});break;}
  case'sell-son':{const o=S.offers[d.id];if(o&&!o.son){o.amount=r2(o.amount*.9);o.son=1;}sell(d.id,true);return;}
  case'pay-clause':{const p=PL(d.id),n=negState(d.id);if(!inWindow()){n.msg='El mercado está cerrado.';n.kind='no';break;}if(refuses(p)){n.msg=`${p.name} no quiere jugar en ${lgName(uLg())}.`;n.kind='no';n.closed=true;break;}if(p.cl>S.budget){n.msg='No te llega para pagar la cláusula.';n.kind='no';break;}n.agreed=p.cl;n.viaClause=1;n.tries=0;n.msg='';break;}
  case'terms-ok':makeTerms(d.id,d.m,readTerms());break;
  case'terms-counter':{const st=d.m==='buy'?S.neg[d.id]:S.ren[d.id],c=st&&st.counters&&st.counters[+d.i];if(c)makeTerms(d.id,d.m,c,true);break;}
  case'sell-bb':{const o=S.offers[d.id];if(o&&!o.bbk){o.amount=r2(o.amount*.9);o.bbk=1;}const p=PL(d.id),amt=o?o.amount:0;sell(d.id);if(p.team!==S.user)setBuyback(p,amt);render();return;}
  case'buyback':{const e=doBuyback(PL(d.id));if(e)toast(e);else S.modal=null;break;}
  case'chat':S.modal={type:'chat',id:d.id};break;
  case'nt-tab':S.ntTab=d.v;break;
  case'nt-apply':{const e=applyNT(+d.v);if(e)toast(e);else S.ntTab='mi';break;}
  case'nt-accept':if(S.ntOffer!=null){takeNT(S.ntOffer);S.ntOffer=null;S.view='selecciones';S.ntTab='mi';}else toast('Esa oferta ya no está disponible.');break;
  case'nt-leave':leaveNT();S.ntTab='rk';break;
  case'nt-call':{const e=toggleCall(d.id);if(e)toast(e);break;}
  case'nt-auto':if(S.nt)S.nt.call=autoCall(S.nt.c);break;
  case'reto-start':{const e=startReto(d.v);if(e)toast(e);break;}
  case'reto-drop':dropReto(d.v);break;
  case'tut-next':tutGo(1);window.scrollTo(0,0);break;
  case'tut-prev':tutGo(-1);window.scrollTo(0,0);break;
  case'tut-skip':tutEnd();break;
  case'tut-again':tutStart(true);window.scrollTo(0,0);break;
  case'rplan':{const p=PL(d.id),e=setPlan(p,d.v);toast(e||`${p.name}: plan ${PLANS[d.v].n.toLowerCase()}. Volverá en ${p.inj} partido${p.inj>1?'s':''}.`);break;}
  case'enc-s':S.encS=d.v;break;
  case'fb-start':{const t=T(S.user);t.free=coordsOf(t.formation);setFormation(FREE);break;}
  case'fb-from':{const t=T(S.user);t.free=coordsOf(d.v);setFormation(FREE);afterMove(slotsOf(FREE),roleList);break;}
  case'fb-place':{if(S.fbSel==null)return;const r=el.getBoundingClientRect();moveDot(S.fbSel,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);S.fbSel=null;afterMove(slotsOf(FREE),roleList);break;}
  case'cal-m':S.calM=d.v==='0'?0:(S.calM||0)+(+d.v);break;
  case'continue':{if(S.match){S.view='partido';break;}if(S.week>=nRounds()){S.view='inicio';break;}
   if(dlActive(isDeadline,lgDay)){dlStep(aiTransfers,incomingOffer);break;}
   const r=continueDay();processBids(false);if(r==='match'){S.modal={type:'matchday'};}else{S.modal=null;}break;}
  case'meet':S.modal=S.meet?{type:'meet'}:null;if(!S.meet)toast('Esa reunión ya no está pendiente.');break;
  case'meet-ans':{const id=S.meet&&S.meet.id,r=meetAnswer(d.v);if(r[2]==='renew'&&id){renState(id);S.modal={type:'renew',id};}else S.modal={type:'meet',done:r,id};break;}
  case'chat-opt':{const r=chatOpt(PL(d.id),d.v);S.modal={type:'chat',id:d.id,msg:r[0],kind:r[1]};break;}
  case'pl-tab':S.plTab=d.v;break;
  case'ld-tab':S.ldTab=d.v;break;
  case'renew':renState(d.id);S.modal={type:'renew',id:d.id};break;
  case'loan':S.modal={type:'loan',id:d.id};break;
  case'loan-ok':requestLoan(d.id,d.o==='1');break;
  case'buy-opt':buyOption(d.id);break;
  case'loanout':if(PL(d.id).loan)break;makeLoanOut(d.id);S.modal={type:'loanout',id:d.id};break;
  case'loanout-ok':acceptLoanOut(d.id,document.getElementById('loanObj')?.value||'',document.getElementById('loanTo')?.value||'');break;
  case'sell':if(!inWindow()){toast('El mercado está cerrado.');break;}makeOffer(d.id);S.modal={type:'sell',id:d.id};break;
  case'sell-ok':sell(d.id);return;
  case'offer-no':{const o=S.offers[d.id];if(!o)break;delete S.offers[d.id];const p=PL(d.id);news(`Rechazas la oferta de ${T(o.team).name} por ${p.name}.`);onOfferRejected(p,o.amount);if(LG(T(o.team).lg).rep>LG(uLg()).rep+3&&(p.per==='amb'||p.hap<60)){p.hap=clamp(p.hap-12,0,100);news(`${p.name} quería ese traspaso a un club más grande y está molesto.`,'bad');if(p.hap<25&&!p.req){p.req=1;news(`${p.name} pide salir del club.`,'bad');}}break;}
  case'ov':case'modal-close':S.modal=null;break;
  case'new-season':newSeason();return;
  case'new-game':case'to-saves':RT.startScreen=a==='to-saves'?'saves':'title';RT.startStep=null;saveNow();clearInterval(RT.timer);RT.timer=null;setS(null);dirty();render();window.scrollTo(0,0);return;
  case'new-game-ok':clearInterval(RT.timer);RT.timer=null;clearTimeout(RT.saveT);RT.saveT=null;setS(null);dirty();try{localStorage.removeItem(KEY);}catch(err){}render();window.scrollTo(0,0);return;
 }
 save();render();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&S&&(S.modal||S.moreOpen)){S.modal=null;S.moreOpen=false;render();return;}
 if(e.key===' '&&S&&S.user!=null&&!S.modal&&!S.match&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault();document.querySelector('[data-a="continue"]')?.click();return;}
 if(e.key==='/'&&S&&S.user!=null&&!S.modal&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();document.querySelector('[data-a="gsearch"]')?.click();return;}
 if(e.key==='Enter'&&e.target.id==='bidAmt'){e.preventDefault();document.querySelector('[data-a="bid"]')?.click();return;}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr[data-a]')){e.preventDefault();e.target.click();}
});
document.addEventListener('change',e=>{
 if(e.target.id==='saveFile'){const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{if(freeSlot()==null){toast('Ya tienes 5 partidas guardadas: borra una en «Mis partidas» para abrir otra.');return;}if(S&&S.user!=null)saveNow();if(importCode(String(rd.result),true))toast(`Partida «${f.name}» abierta.`);else toast('Ese archivo no es una partida válida de El Banquillo.');};rd.readAsText(f);return;}
 if(e.target.id==='ioFile'||e.target.id==='modFile'){const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{
   if(e.target.id==='modFile'){RT.mod=String(rd.result);try{const o=JSON.parse(RT.mod);if(o&&o.seed!=null)RT.seed=o.seed;}catch(err){}setS(null);render();toast(`Mod «${f.name}» cargado: se aplicará al mundo nuevo.`);return;}
   S.ioMsg=importData(String(rd.result));save();render();};rd.readAsText(f);return;}
 if(!S||S.user==null)return;const id=e.target.id,v=e.target.value;
 const map={mksp:'sp',mkc:'c',mklv:'lv',mkmin:'min',mkage:'age',mkmax:'max',mksort:'sort',mknat:'nat',mkwage:'wage',mkpot:'pot',mkatk:'atk',mkatv:'atv'};
 if(e.target.dataset&&e.target.dataset.cond!=null){const t=T(S.user),r=(t.cond||[])[+e.target.dataset.cond],k=e.target.dataset.k;if(r){r[k]=k==='min'?+v:(v||null);}save();render();return;}
 if(id==='formSel'){setFormation(v);S.sel=null;}
 if(id==='oopSel'){const t=T(S.user);t.oop=v||null;t.oopMap=null;S.oopSel=null;}
 else if(id==='cupC'){S.cupC=+v;}
 else if(id==='hiC'){S.hiC=+v;}
 else if(id==='t-cap'||id==='t-pk'||id==='t-fk'||id==='t-ck'){T(S.user)[id.slice(2)]=v||null;}
 else if(e.target.dataset&&e.target.dataset.role!=null){userRoles()[+e.target.dataset.role]=v;}
 else if(e.target.dataset&&e.target.dataset.ord){const t=T(S.user);t.orders=t.orders||{};t.orders[e.target.dataset.ord]=v;}
 else if((id==='m-est'||id==='m-pre'||id==='m-per'||id==='m-rec')&&S.match){const k=id.slice(2);S.match.tac[S.match.us][k]=v;addEv(S.match,'sys',null,`Cambio táctico: ${TACS[k].n.toLowerCase()} · ${TACS[k].o[v].toLowerCase()}`);}
 else if(e.target.dataset&&e.target.dataset.job){const sc=S.scouts.find(x=>x.id===e.target.dataset.job);if(sc)sc.job=v;}
 else if(e.target.dataset&&e.target.dataset.reg){const sc=S.scouts.find(x=>x.id===e.target.dataset.reg);if(sc)sc.reg=+v;}
 else if(e.target.dataset&&e.target.dataset.tclead){setLead(e.target.dataset.tclead,v);}
 else if(e.target.dataset&&e.target.dataset.tf){const p=PL(e.target.dataset.tf);if(p)p.tf=v;}
 else if(e.target.dataset&&e.target.dataset.dev){const [pid,k]=e.target.dataset.dev.split('|');setDev(pid,k,v);}
 else if(id==='t-vc0'||id==='t-vc1'){const t=T(S.user);t.vc=t.vc||[];t.vc[+id.slice(4)]=v||null;}
 else if(e.target.dataset&&e.target.dataset.ts){const p=PL(e.target.dataset.ts);if(p&&p.team===S.user){p.ts=v;toast(`${p.name}: ${TS[v].toLowerCase()}.`);}}
 else if(e.target.dataset&&e.target.dataset.ses!=null){setSession(+e.target.dataset.ses,v);}
 else if(id==='rotTh'){S.rot={th:+v};}
 else if(id==='awC'){const c=+v,cur=LG(S.awLg!=null?S.awLg:uLg());S.awLg=findLg(c,Math.min(cur.lv,COUNTRIES[c].lv-1)).id;}
 else if(id==='lgC'){const c=+v,cur=LG(S.ligaLg);S.ligaLg=(findLg(c,Math.min(cur.lv,COUNTRIES[c].lv-1))).id;}
 else if(map[id]){S.mk[map[id]]=v;S.mk.limit=40;if(id==='mksort')S.mk.dir=1;}
 else if(id==='mkok'){S.mk.ok=e.target.checked;S.mk.limit=40;}
 else if(id==='mklast'){S.mk.last=e.target.checked;S.mk.limit=40;}
 else if(id==='mkrep'){S.mk.rep=e.target.checked;S.mk.limit=40;}
 else if(id==='mkgem'){S.mk.gem=e.target.checked;S.mk.limit=40;}
 else if(id==='misC'||id==='misG'||id==='misA'||id==='misW'){S.misF=S.misF||{};S.misF[id]=v;}
 else return;
 save();render();
});
document.addEventListener('input',e=>{
 if(e.target.id==='bidAmt'){oddsUpd(e.target);return;}
 if(S&&e.target.id==='gsq'){const box=document.getElementById('gsres');if(box)box.innerHTML=searchResults(e.target.value);return;}
 if(!S||e.target.id!=='mkq')return;S.mk.q=e.target.value;S.mk.limit=40;
 const box=document.getElementById('mklist');if(box)box.innerHTML=mkList();
});
/* Pizarra libre: arrastrar a un jugador (ratón o dedo). Un toque sin mover lo selecciona. */
let FB=null;
document.addEventListener('pointerdown',e=>{const d=e.target.closest&&e.target.closest('.fbdot[data-fb]');if(!d||!S||S.user==null)return;const pitch=d.closest('.fbpitch');if(!pitch)return;
 e.preventDefault();FB={d,i:+d.dataset.fb,r:pitch.getBoundingClientRect(),x0:e.clientX,y0:e.clientY,moved:false};try{d.setPointerCapture(e.pointerId);}catch(err){}});
document.addEventListener('pointermove',e=>{if(!FB)return;const dx=e.clientX-FB.x0,dy=e.clientY-FB.y0;if(!FB.moved&&Math.hypot(dx,dy)<6)return;FB.moved=true;
 const x=Math.max(6,Math.min(94,(e.clientX-FB.r.left)/FB.r.width*100)),y=Math.max(12,Math.min(82,(e.clientY-FB.r.top)/FB.r.height*100));
 FB.d.style.left=x+'%';FB.d.style.top=y+'%';FB.d.classList.add('drag');const l=FB.d.querySelector('.fbsp');if(l)l.textContent=spAt(x,y);FB.x=x;FB.y=y;});
document.addEventListener('pointerup',e=>{if(!FB)return;const f=FB;FB=null;
 if(f.moved&&f.x!=null){moveDot(f.i,f.x,f.y);S.fbSel=null;afterMove(slotsOf(FREE),roleList);}else S.fbSel=S.fbSel===f.i?null:f.i;
 e.stopPropagation();save();render();});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.fbdot[data-fb]'))e.stopPropagation();},true);

/* Alineación estilo FM: arrastra jugadores de la lista al campo, al banquillo o de vuelta a la lista.
 * En el móvil se coge desde el asa ⠿ (así la lista sigue pudiendo desplazarse); en el campo y el banquillo, directamente. */
let DG=null,DG_T=0;
const fitOf=pid=>{const r=document.querySelector(`[data-fit][data-pid="${pid}"]`);return r?r.dataset.fit||'':'';};
const dropAt=(x,y)=>{for(const el of document.elementsFromPoint(x,y)){if(el.closest('.toast,.dragghost'))continue;const t=el.closest('.fmgrid .slot[data-i], .bslot[data-k], .fmlist, .fmgrid .vcell');if(t)return t;}return null;};
document.addEventListener('pointerdown',e=>{if(!S||S.user==null||e.button>0)return;const el=e.target.closest&&e.target.closest('.fmgrid [data-drag]');if(!el)return;
 if(e.pointerType!=='mouse'&&el.dataset.drag==='list'&&!e.target.closest('.grip'))return;
 if(el.dataset.drag==='list'&&e.target.closest('.grip'))e.preventDefault();
 DG={el,pid:el.dataset.pid,src:el.dataset.drag,x0:e.clientX,y0:e.clientY,moved:false,over:null};});
document.addEventListener('pointermove',e=>{if(!DG)return;if(!DG.moved){if(Math.hypot(e.clientX-DG.x0,e.clientY-DG.y0)<7)return;DG.moved=true;
  const p=PL(DG.pid);const g=document.createElement('div');if(DG.src==='slot'){g.className='dragghost vs dgchip';g.innerHTML=DG.el.innerHTML;DG.el.classList.add('dragging');}else{g.className='dragghost';g.textContent=p?p.name.split(' ').slice(1).join(' ')||p.name:'';}document.body.appendChild(g);DG.g=g;
  document.body.classList.add('fmdrag');const fit=fitOf(DG.pid);document.querySelectorAll('.fmgrid .slot[data-i]').forEach(s=>s.classList.add('fit'+(fit[+s.dataset.i]||4)));
  try{DG.el.setPointerCapture(e.pointerId);}catch(err){}}
 e.preventDefault();DG.g.style.transform=DG.src==='slot'?`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-60%)`:`translate(${e.clientX+10}px,${e.clientY-28}px)`;
 const t=dropAt(e.clientX,e.clientY);if(t!==DG.over){DG.over&&DG.over.classList.remove('over');DG.over=t;t&&t.classList.add('over');}},{passive:false});
const endDrag=e=>{if(!DG)return;const d=DG;DG=null;if(!d.moved)return;
 d.g&&d.g.remove();d.el&&d.el.classList.remove('dragging');document.body.classList.remove('fmdrag');d.over&&d.over.classList.remove('over');
 document.querySelectorAll('.fmgrid .slot').forEach(s=>s.classList.remove('fit1','fit2','fit3','fit4'));
 DG_T=Date.now();if(e.type==='pointercancel')return;
 const t=dropAt(e.clientX,e.clientY);if(!t)return;
 if(t.matches('.vcell')){if(d.src==='slot'&&moveSlotTo(+d.el.dataset.i,+t.dataset.cx,+t.dataset.cy)){afterMove(slotsOf(FREE),roleList);toast('Formación libre: puedes seguir moviendo jugadores o volver a una fija en el selector.');}}
 else if(t.matches('.slot[data-i]'))placeInSlot(d.pid,+t.dataset.i);
 else if(t.matches('.bslot[data-k]'))setSub(d.pid,+t.dataset.k);
 else if(d.src!=='list')removeFromTeam(d.pid);
 S.sel=null;save();render();};
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
document.addEventListener('click',e=>{if(Date.now()-DG_T<350&&e.target.closest&&e.target.closest('.fmgrid')){e.stopPropagation();e.preventDefault();}},true);
