/* El Banquillo · boot.js — Arranque: carga la partida guardada y pinta la pantalla. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {ensureU19} from './u19';
import {migrateCoach} from './coach';
import {applySched,sched} from './training2';
import {mgrInit} from './extras2';
import {assignObjectives} from './extras';
import {seedGems} from './scoutplus';
import {initCash} from './economy';
import {setWageCap} from './clubplus';
import {initCoaches,setExpectations} from './living';
import {deriveAttrs} from './players';
import {setupYouth} from './youth';
import {migrateCrew} from './staff';
import {migrateInbox} from './inbox';
import {$app,clamp,r2,rnd} from './core';
import {TAC0} from './data';
import {LG,S,T,dirty,seasonLabel,squad,uLg,setS} from './state';
import {decorate} from './players';
import {news} from './world';
import {autoLineup,slotsOf} from './tactics';
import {prepTactics} from './engine';
import {assignRoles} from './market';
import {aboBase,genSponsors,initClub} from './club';
import {clubReq,mgrSalary} from './career';
import {genScoutPool} from './academy';
import {loadAsync} from './persist';
import {render} from './views/common';
export function start(data){
 if(data&&data.S&&data.S.v===4){boot(data.S);return;}
 $app.innerHTML='<div class="wrap"><div class="empty">Cargando partida…</div></div>';
 loadAsync().then(boot,()=>boot(null));
}
export function boot(st){
 setS(st||null);dirty();
 if(S&&S.user!=null&&!S.cal){S.cal=Array.from({length:18},(_,r)=>({t:'lg',r}));S.ci=S.week;S.cups=null;S.cwc=null;S.titles=[];news('Novedad: copa nacional y Mundial de Clubes. Empiezan la próxima temporada.','good');}
 if(S&&S.user!=null){if(!S.gemsV)seedGems(40);if(S.objV==null)assignObjectives();mgrInit();migrateCoach();if(!S.sched){sched();applySched();}migrateInbox();migrateCrew();if(!S.yl)setupYouth();if(!S.coaches){initCoaches();setExpectations();}if(S.wageCap==null)setWageCap();(S.academy||[]).concat((S.prospects||[]).map(x=>x.p)).forEach(p=>{if(p.at.cab==null){if(!p.h)p.h=180;deriveAttrs(p);}});}
 if(S&&S.user!=null){if(!S.mgr){const t=T(S.user);S.mgr={rep:clamp(clubReq(t)+8,5,100),sal:mgrSalary(t),yrs:2,conf:60,savings:0,warned:0,clubs:[{season:seasonLabel(),club:t.name}]};}
  S.scouts=S.scouts||[];S.academy=S.academy||[];ensureU19();S.prospects=S.prospects||[];S.jobOffers=S.jobOffers||[];S.applied=S.applied||{};if(!S.scoutPool||!S.scoutPool.length)genScoutPool();
  initCash();  if(!S.club){initClub(T(S.user));}if(!S.club.fac.med)S.club.fac.med=1;if(!S.club.abo)S.club.abo=aboBase(uLg());S.ach=S.ach||{};if(S.mgr.joinN==null)S.mgr.joinN=S.seasonN;if(!S.mgr.countries)S.mgr.countries=[LG(uLg()).c];squad(S.user).forEach(p=>{if(!p.ph)p.ph=[[seasonLabel(),p.ovr]];});Object.values(S.players).forEach(p=>{if(p.prone==null)p.prone=rnd()<.12?r2(.6+rnd()*.6):r2(rnd()*.3);if(!p.agc)p.agc=r2(.04+rnd()*.08);});if(!S.spOffers)genSponsors();S.tlog=S.tlog||[];S.halls=S.halls||[];S.legends=S.legends||[];S.rec=S.rec||{};S.fr=S.fr||[];
  let mig=0;Object.values(S.players).forEach(p=>{if(!p.sp){decorate(p,null,false);mig++;}});S.academy.forEach(p=>{if(!p.sp)decorate(p,null,false);});S.prospects.forEach(x=>{if(!x.p.sp)decorate(x.p,null,false);});
  if(mig){assignRoles(false);S.tg=S.tg||0;dirty();news('Novedad: posiciones exactas, pie bueno, carácter, felicidad, roles y cláusulas en los contratos, y estadísticas con notas.','good');
   S.teams.forEach(t=>{if(t.id!==S.user)t.lineup=[];});const ut=T(S.user);if(ut.lineup.length!==slotsOf(ut.formation).length)ut.lineup=autoLineup(ut.id,ut.formation);}}
 if(S&&S.match){S.match.paused=true;S.match.subOpen=false;if(!S.match.talks)S.match.talks={};if(!S.match.tac){S.match.tac={h:Object.assign({},TAC0),a:Object.assign({},TAC0)};S.match.ord={h:{},a:{}};S.match.marked={};prepTactics(S.match);}S.match.inM=S.match.inM||{};S.match.outM=S.match.outM||{};}
 render();
}
