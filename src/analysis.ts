/* El Banquillo · analysis.ts — Datos de partido: estadísticas por jugador, informes, forma de los equipos y evolución de tu temporada. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,rnd} from './core';
import {GRP,WIDE} from './data';
import {PL,S,T,uLg} from './state';
import {posOf,slotsOf} from './tactics';
import {poisson} from './engine';

/** Reparte `n` acciones entre los jugadores según su peso (sorteo uno a uno). */
function share(n,ws,add){const tot=ws.reduce((a,x)=>a+x[1],0);if(!tot)return;for(let i=0;i<n;i++){let r=rnd()*tot;for(const [id,w] of ws){r-=w;if(r<=0){add(id);break;}}}}
/**
 * Detalle por jugador de un partido: xG (de sus tiros), pases clave, entradas, regates y duelos ganados.
 * Depende de sus atributos, su puesto y los minutos jugados.
 */
export function matchDetail(m){
 const D={},get=id=>D[id]||(D[id]={xg:0,kp:0,tk:0,dr:0,du:0});
 (m.sh||[]).forEach(x=>{if(x[1])get(x[1]).xg+=x[2];});
 const poss=clamp(m.possSum/Math.max(1,m.min),.2,.8);
 ['h','a'].forEach(s=>{
  const sl=slotsOf(m.f[s]),posOfId={};(m.xi0[s]||[]).forEach((id,i)=>{if(id)posOfId[id]=sl[i];});
  const ids=Object.keys(m.played).filter(id=>PL(id)&&PL(id).team===m[s]);
  const mins=id=>Math.max(0,((m.outM[id]!=null?m.outM[id]:m.min)-(m.inM[id]||0))/90);
  const W=(fn)=>ids.map(id=>{const p=PL(id),slot=posOfId[id]||p.sp,g=GRP[slot]||p.pos;return[id,Math.max(0,fn(p,g,slot))*mins(id)];});
  const my=s==='h'?poss:1-poss;
  share(Math.round(m.st[s].sh*.75),W((p,g)=>(p.at.pas+(p.at.vis??p.at.pas))*({POR:0,DEF:.35,MED:1.4,DEL:1}[g])),id=>get(id).kp++);
  share(poisson(17*(1.3-my)),W((p,g)=>(p.at.def+(p.at.col??p.at.def))*({POR:0,DEF:1.3,MED:1,DEL:.3}[g])),id=>get(id).tk++);
  share(poisson(10*(.6+my*.8)),W((p,g,slot)=>(p.at.reg+(p.at.vel??p.at.reg))*({POR:0,DEF:.35,MED:.8,DEL:1.3}[g])*(WIDE.includes(slot)?1.4:1)),id=>get(id).dr++);
  share(poisson(42),W((p,g)=>((p.at.fis)+(p.at.cab??p.at.fis))*({POR:.15,DEF:1.2,MED:1,DEL:1}[g])),id=>get(id).du++);
 });
 return D;
}

/** Ficha compacta de un partido para el informe (tus partidos, el mapa de tiros y las notas). */
export function matchRecord(m){
 const st=k=>({sh:m.st[k].sh,ot:m.st[k].ot,xg:Math.round((m.st[k].xg||0)*100)/100,co:m.st[k].co||0,fo:m.st[k].fo||0,yc:m.st[k].yc,rc:m.st[k].rc,pa:m.st[k].pa||0,pc:m.st[k].pc||0});
 const D=m.det||{},pl=Object.keys(m.played).filter(id=>PL(id)).map(id=>{const d=D[id]||{};return[id,PL(id).team===m.h?0:1,m.rat&&m.rat[id]||0,d.xg||0,d.kp||0,d.tk||0,d.dr||0,d.du||0];});
 const g={},a={};m.ev.forEach(e=>{if(e.t==='goal'){g[e.pid]=(g[e.pid]||0)+1;if(e.ast)a[e.ast]=(a[e.ast]||0)+1;}});
 return{sn:S.seasonN,wk:S.week,label:m.label||'',h:m.h,a:m.a,hg:m.score.h,ag:m.score.a,pen:m.pen||null,poss:Math.round(m.possSum/Math.max(1,m.min)*100),st:{h:st('h'),a:st('a')},sh:(m.sh||[]).slice(),pl:pl.map(r=>r.concat([g[r[0]]||0,a[r[0]]||0])),mvp:m.mvp||null};
}
/** Últimos partidos de cada equipo (para el análisis del rival). */
function teamForm(m){
 S.tform=S.tform||{};const poss=Math.round(m.possSum/Math.max(1,m.min)*100);
 ['h','a'].forEach(s=>{const o=s==='h'?'a':'h',L=S.tform[m[s]]=(S.tform[m[s]]||[]);
  L.unshift([m[o],m.score[s],m.score[o],Math.round((m.st[s].xg||0)*10),Math.round((m.st[o].xg||0)*10),s==='h'?poss:100-poss,s==='h'?1:0,m.ref.k]);if(L.length>6)L.length=6;});
}
/** Se llama al aplicar el resultado de cualquier partido oficial. */
export function recordMatch(m){
 if(m.ref.k==='fr')return;
 teamForm(m);
 if(m.us){S.mlog=S.mlog||[];S.mlog.unshift(matchRecord(m));if(S.mlog.length>40)S.mlog.length=40;}
}
/** Evolución de tu temporada en liga: puntos, puesto y xG jornada a jornada. */
export function recordRound(m,r){
 if(!m||!m.us||m.ref.k!=='lg')return;S.tl=S.tl||[];
 const my=m.score[m.us],op=m.score[m.us==='h'?'a':'h'],last=S.tl[S.tl.length-1];
 S.tl.push({r,pts:(last?last.pts:0)+(my>op?3:my===op?1:0),pos:posOf(S.user),xf:Math.round((m.st[m.us].xg||0)*100)/100,xa:Math.round((m.st[m.us==='h'?'a':'h'].xg||0)*100)/100,gf:my,ga:op});
}
