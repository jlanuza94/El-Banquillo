/* El Banquillo · match2d.js — Animación del partido en 2D (canvas). */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {FREE,formRows,freeCoords} from './freeboard';
import {pick,rnd} from './core';
import {FORMS,SPEEDS,W} from './data';
import {PL,RT,S,T,lum} from './state';
import {playAt} from './replay';
export let A2=null;
export const a2Key=m=>JSON.stringify(m.ref)+'|'+m.h+'|'+m.a;
export function basePos(m,s){if(m.f[s]===FREE&&m[s]===S.user)return freeCoords().map(c=>{const X=4+(95-c.y)*.92,Y=c.x;return s==='h'?[X,Y]:[100-X,100-Y];});const rows=[[['POR'],89]].concat(formRows(m.f[s])),out=[];rows.forEach(([list,y])=>list.forEach((sp,k)=>{let yy=y;if(sp==='MCD'&&list.some(x=>x!=='MCD'))yy+=7;const X=4+(95-yy)*.92,Y=(k+1)/(list.length+1)*100;out.push(s==='h'?[X,Y]:[100-X,100-Y]);}));return out;}
export function a2Reset(m){A2={key:a2Key(m),P:{},ball:{x:50,y:50},side:'h',holder:null,last:0,evN:m.ev.length,shot:null,base:{h:basePos(m,'h'),a:basePos(m,'a')}};}
export function a2Frame(ts){
 requestAnimationFrame(a2Frame);
 const cv=document.getElementById('pitch2d'),m=S&&S.match;if(!cv||!m)return;
 if(!A2||A2.key!==a2Key(m))a2Reset(m);
 const W=cv.clientWidth|0;if(!W)return;const H=Math.round(W*.62),dpr=Math.min(2,window.devicePixelRatio||1);
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const R=RT.replay&&RT.replay.P;let rp=null;
 if(R){if(RT.replay.t0==null){RT.replay.t0=ts;A2.P={};}const ms=ts-RT.replay.t0;rp=playAt(R,ms);if(ms>R.end){RT.replay.t0=null;}}
 const run=!!rp||(!m.paused&&!m.done),red=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(rp){A2.side=R.s;A2.holder=rp.who;A2.ball={x:rp.x,y:rp.y};A2.shot=null;A2.evN=m.ev.length;}
 if(m.ev.length<A2.evN)A2.evN=m.ev.length;
 for(let i=A2.evN;i<m.ev.length;i++){const e=m.ev[i];if((e.t==='goal'||e.t==='shot')&&e.s){A2.shot={s:e.s,goal:e.t==='goal',t:ts,y:e.t==='goal'?50:50+(rnd()<.5?-1:1)*(8+rnd()*6)};A2.side=e.s;A2.holder=e.pid||A2.holder;}}
 A2.evN=m.ev.length;
 if(A2.shot&&ts-A2.shot.t>(A2.shot.goal?1700:800)){if(A2.shot.goal){A2.side=A2.shot.s==='h'?'a':'h';A2.ball={x:50,y:50};}A2.shot=null;A2.last=ts;}
 if(!rp&&run&&!A2.shot&&ts-A2.last>Math.max(160,SPEEDS[m.speed]*.6)){A2.last=ts;const poss=m.min?m.possSum/m.min:.5;if(rnd()>.72)A2.side=rnd()<poss?'h':'a';const ids=m.lu[A2.side].filter(Boolean);const field=ids.slice(1);A2.holder=field.length?pick(field):ids[0]||null;}
 // player targets
 const pos={};['h','a'].forEach(s=>{const dir=s==='h'?1:-1;m.lu[s].forEach((id,i)=>{if(!id)return;const b=A2.base[s][i]||[50,50];let x=b[0]+(A2.side===s?7:-5)*dir+(A2.ball.x-b[0])*.08,y=b[1]+(A2.ball.y-b[1])*.18;
  if(i>0)y+=Math.sin(ts/900+i*1.7+(s==='h'?0:3))*1.4;if(id===A2.holder&&!A2.shot){x=A2.ball.x-2*dir;y=A2.ball.y;}
  const P=A2.P[id]||(A2.P[id]={x,y});if(run||red){const k=red?1:rp?.16:.07;P.x+=(x-P.x)*k;P.y+=(y-P.y)*k;}pos[id]=P;});});
 let bx=A2.ball.x,by=A2.ball.y;
 if(!rp){
 if(A2.shot){bx=A2.shot.s==='h'?99:1;by=A2.shot.y;}else if(A2.holder&&A2.P[A2.holder]){const h=A2.P[A2.holder],dir=A2.side==='h'?1:-1;bx=h.x+1.6*dir;by=h.y;}
 if(run||red||A2.shot){const k=red?1:A2.shot?.12:.15;A2.ball.x+=(bx-A2.ball.x)*k;A2.ball.y+=(by-A2.ball.y)*k;}
 }
 // pitch
 for(let i=0;i<12;i++){c.fillStyle=i%2?'#2c7642':'#2f7d46';c.fillRect(i*W/12,0,W/12+1,H);}
 c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=Math.max(1.5,W/400);const X=v=>v/100*W,Y=v=>v/100*H;
 c.strokeRect(X(2),Y(3),X(96),Y(94));c.beginPath();c.moveTo(X(50),Y(3));c.lineTo(X(50),Y(97));c.stroke();
 c.beginPath();c.arc(X(50),Y(50),W*.08,0,Math.PI*2);c.stroke();
 [[2,1],[98,-1]].forEach(([gx,d])=>{c.strokeRect(Math.min(X(gx),X(gx+14*d)),Y(24),Math.abs(X(14)),Y(52));c.strokeRect(Math.min(X(gx),X(gx+5*d)),Y(38),Math.abs(X(5)),Y(24));c.fillStyle='rgba(255,255,255,.9)';c.fillRect(Math.min(X(gx),X(gx-1.2*d)),Y(44),Math.abs(X(1.2)),Y(12));});
 // players
 const r=Math.max(6,W*.017);c.font=`700 ${Math.round(r*1.05)}px "Barlow Condensed",Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';
 ['h','a'].forEach(s=>{const t=T(m[s]);m.lu[s].forEach((id,i)=>{const P=pos[id];if(!P)return;const pl=PL(id);
  c.beginPath();c.arc(X(P.x),Y(P.y),r,0,Math.PI*2);c.fillStyle=i===0?(s==='h'?'#f2c230':'#7fd1ff'):t.c1;c.fill();c.lineWidth=2;c.strokeStyle=i===0?'#111':t.c2;c.stroke();
  if(r>=7){c.fillStyle=i===0?'#111':(lum(t.c1)>.55?'#111':'#fff');c.fillText(pl?pl.num:'',X(P.x),Y(P.y)+.5);}
  if(id===A2.holder&&!A2.shot&&pl&&W>420){c.fillStyle='rgba(0,0,0,.55)';const nm=pl.name.split(' ').slice(1).join(' ');const tw=c.measureText(nm).width+8;c.fillRect(X(P.x)-tw/2,Y(P.y)-r*2.6,tw,r*1.4);c.fillStyle='#fff';c.fillText(nm,X(P.x),Y(P.y)-r*1.9);}});});
 c.beginPath();c.arc(X(A2.ball.x),Y(A2.ball.y),Math.max(3,W*.0075),0,Math.PI*2);c.fillStyle='#fff';c.fill();c.lineWidth=1.2;c.strokeStyle='#111';c.stroke();
 c.fillStyle='rgba(0,0,0,.5)';c.fillRect(8,8,Math.max(110,W*.2),26);c.fillStyle='#fff';c.textAlign='left';c.font=`700 15px "Barlow Condensed",Arial,sans-serif`;
 c.fillText(`${T(m.h).short} ${m.score.h}-${m.score.a} ${T(m.a).short} · ${m.done?'Final':m.min+"'"}`,14,21);
 if(rp){const e=R.e,pl=PL(e.pid);c.fillStyle='rgba(180,20,20,.85)';c.textAlign='right';c.font=`700 ${Math.max(13,Math.round(W*.022))}px "Barlow Condensed",Arial,sans-serif`;const lb=`REPETICIÓN · ${e.min}' ${pl?pl.name:''}`;const tw=c.measureText(lb).width+16;c.fillRect(W-tw-8,8,tw,26);c.fillStyle='#fff';c.fillText(lb,W-16,21);
  if(rp.goal){const a=Math.min(1,(ts-RT.replay.t0-R.K[R.K.length-1].t)/250);c.globalAlpha=Math.max(0,a);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.fillStyle='#f4cf5c';c.textAlign='center';c.font=`900 ${Math.round(W*.12)}px "Big Shoulders Display",Impact,sans-serif`;c.fillText('¡GOL!',W/2,H/2);c.globalAlpha=1;}return;}
 if(A2.shot&&A2.shot.goal){const a=Math.min(1,(ts-A2.shot.t)/250);c.globalAlpha=a;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.fillStyle='#f4cf5c';c.textAlign='center';c.font=`900 ${Math.round(W*.12)}px "Big Shoulders Display",Impact,sans-serif`;c.fillText('¡GOL!',W/2,H/2);c.globalAlpha=1;}
 if(m.paused&&!m.done){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,0,W,H);}
}
export function startAnim2d(){if(typeof requestAnimationFrame!=='undefined'&&typeof document!=='undefined')requestAnimationFrame(a2Frame);}
