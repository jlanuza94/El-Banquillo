/* El Banquillo · match2d.js — Animación del partido en 2D (canvas). */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {FREE,formRows,freeCoords} from './freeboard';
import {pick,rnd} from './core';
import {FORMS,SPEEDS,W} from './data';
import {PL,RT,S,T,lum} from './state';
import {GRP} from './data';
import {slotsOf} from './tactics';
import {DEF_DUTY} from './positions';
import {playAt} from './replay';
export let A2=null;
export const a2Key=m=>JSON.stringify(m.ref)+'|'+m.h+'|'+m.a;
export function basePos(m,s){if(m.f[s]===FREE&&m[s]===S.user)return freeCoords().map(c=>{const X=4+(95-c.y)*.92,Y=c.x;return s==='h'?[X,Y]:[100-X,100-Y];});const rows=[[['POR'],89]].concat(formRows(m.f[s])),out=[];rows.forEach(([list,y])=>list.forEach((sp,k)=>{let yy=y;if(sp==='MCD'&&list.some(x=>x!=='MCD'))yy+=7;const X=4+(95-yy)*.92,Y=(k+1)/(list.length+1)*100;out.push(s==='h'?[X,Y]:[100-X,100-Y]);}));return out;}
const DUR=2700;
const rgb=h=>{const n=parseInt(String(h||'#888').slice(1),16);return [n>>16,n>>8&255,n&255];};
const cdist=(a,b)=>{const A=rgb(a),B=rgb(b);return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);};
/** Equipación de cada equipo en la 2D: si se parecen, el visitante sale con la segunda (o de blanco/negro). */
function kits(m){const h=T(m.h),a=T(m.a),H={f:h.c1,e:h.c2};let A={f:a.c1,e:a.c2};
 if(cdist(h.c1,a.c1)<110){A=cdist(h.c1,a.c2)>=110?{f:a.c2,e:a.c1}:lum(h.c1)>.5?{f:'#1b1b1b',e:'#e9e9e9'}:{f:'#f4f4f4',e:'#1b1b1b'};}
 return {h:H,a:A};}
const GKX=s=>s==='h'?5:95;
/** De coordenadas de ataque (x hacia la portería rival, y desde la banda izquierda del que ataca) a coordenadas del campo. */
const real=(s,ax,ay)=>s==='h'?{x:ax,y:ay}:{x:100-ax,y:100-ay};
const att=(s,P)=>s==='h'?{ax:P.x,ay:P.y}:{ax:100-P.x,ay:100-P.y};
const R_=(a,b)=>a+Math.random()*(b-a);
export function a2Reset(m){A2={key:a2Key(m),P:{},ball:{x:50,y:50,z:0},side:'h',holder:null,seq:null,q:[],seen:m.min,shot:null,trail:[],lastTs:null,base:{h:basePos(m,'h'),a:basePos(m,'a')}};}
function teamOf(m,id){return m.lu.h.includes(id)?'h':m.lu.a.includes(id)?'a':null;}
/** Elige a un jugador de una línea (DEF, MED, DEL) cerca de un carril. */
function pickIn(m,s,g,ay,not){
 const sl=slotsOf(m.f[s]),B=A2.base[s];let idx=m.lu[s].map((id,i)=>id&&i>0&&id!==not&&GRP[sl[i]]===g?i:-1).filter(i=>i>=0);
 if(!idx.length)idx=m.lu[s].map((id,i)=>id&&i>0&&id!==not?i:-1).filter(i=>i>=0);if(!idx.length)return m.lu[s][0];
 idx.sort((i,j)=>Math.abs(att(s,{x:B[i][0],y:B[i][1]}).ay-ay)-Math.abs(att(s,{x:B[j][0],y:B[j][1]}).ay-ay));
 return m.lu[s][idx[Math.random()<.7?0:Math.min(1,idx.length-1)]];
}
/** Convierte la jugada que calculó el motor en fotogramas clave: quién tiene el balón y dónde. */
export function buildSeq(m,ph){
 const s=ph.s,o=s==='h'?'a':'h',L=ph.lane==='l'?R_(10,22):ph.lane==='r'?R_(78,90):R_(38,62),K=[];
 const add=(t,ax,ay,who,k)=>K.push({t,ax,ay,who,k:k||'p'});
 const shooter=ph.pid&&teamOf(m,ph.pid)===s?ph.pid:pickIn(m,s,'DEL',50),gk=m.lu[o][0];
 let t=0;
 if(ph.kind==='corner'){const cy=L<50?1.5:98.5,cr=ph.ast&&teamOf(m,ph.ast)===s?ph.ast:pickIn(m,s,'MED',cy,shooter);add(0,99,cy,cr,'set');add(700,99,cy,cr,'p');t=1400;add(t,R_(88,92),R_(42,58),shooter,'cross');}
 else if(ph.kind==='pen'){add(0,88.5,50,shooter,'set');t=1100;add(t,88.5,50,shooter,'p');}
 else if(ph.kind==='fk'){const fy=R_(35,65);add(0,R_(72,78),fy,shooter,'set');t=1000;add(t,K[0].ax,fy,shooter,'p');}
 else{
  const d=Math.random()<.18?m.lu[s][0]:pickIn(m,s,'DEF',R_(30,70));add(0,d===m.lu[s][0]?8:R_(20,30),d===m.lu[s][0]?50:R_(30,70),d);
  const md=pickIn(m,s,'MED',R_(35,65),d);add(650,R_(40,50),R_(35,65),md);add(1100,R_(52,58),K[1].ay+R_(-6,6),md,'d');
  const wide=ph.ast&&teamOf(m,ph.ast)===s&&ph.ast!==shooter?ph.ast:pickIn(m,s,L<30||L>70?'DEL':'MED',L,md===shooter?null:shooter);
  add(1650,R_(64,74),L,wide);t=1650;
  if(ph.out==='lost'){add(2100,K[3].ax+R_(3,7),L+R_(-4,4),wide,'d');const thief=pickIn(m,o,'DEF',100-L);add(2350,K[4].ax,K[4].ay,thief,'tk');add(2900,K[4].ax-R_(8,14),100-(100-K[4].ay)*.9,thief,'d');}
  else if(ph.out==='build'){const back=pickIn(m,s,'MED',50,wide);add(2200,R_(54,60),R_(40,60),back);add(2800,R_(58,66),100-L,pickIn(m,s,'MED',100-L,back));}
  else if(L<30||L>70){add(2050,R_(80,86),L<50?R_(6,14):R_(86,94),wide,'d');t=2600;add(t,R_(86,91),R_(42,58),shooter,'cross');}
  else{t=2300;add(t,R_(80,86),R_(42,58),shooter,'thr');}
 }
 if(['goal','save','miss','post'].includes(ph.out)){
  const st=t+(ph.kind==='pen'?0:350),sp=ph.out==='goal'?520:600;
  add(st,K[K.length-1].ax,K[K.length-1].ay,shooter,'sh');
  if(ph.out==='goal')add(st+sp,100.6,R_(45.5,54.5),null,'g');
  else if(ph.out==='save')add(st+sp,97.2,R_(45,55),gk,'sv');
  else if(ph.out==='post'){const py=Math.random()<.5?44.6:55.4;add(st+sp,99.6,py,null,'po');add(st+sp+450,R_(88,93),py+(py<50?-8:8),null,'rb');}
  else add(st+sp,101.5,Math.random()<.5?R_(30,42):R_(58,70),null,'ms');
 }
 const end=K[K.length-1].t+(ph.out==='goal'?1900:ph.out==='lost'||ph.out==='build'?150:700);
 return {ph,s,K:K.map(k=>({...k,...real(s,k.ax,k.ay)})),end,el:0};
}
/** Siguiente jugada a dibujar: los goles pasan delante; si vamos con retraso, se saltan las jugadas sin peligro. */
function nextSeq(m){
 let ph=A2.q.shift();
 while(ph&&A2.q.length&&(ph.out==='build'||ph.out==='lost'))ph=A2.q.shift();
 if(!ph){if(m.done||m.paused)return null;const pm=m.min?m.possSum/m.min:.5;ph={min:m.min,s:Math.random()<pm?'h':'a',out:Math.random()<.4?'lost':'build',lane:Math.random()<.5?(Math.random()<.5?'l':'r'):'c',kind:'open'};}
 return buildSeq(m,ph);
}
function seqAt(Q,el){const K=Q.K;if(el>=K[K.length-1].t){const k=K[K.length-1];return {x:k.x,y:k.y,who:k.who,f:1,a:k,b:k,i:K.length-1};}
 let i=0;while(i<K.length-1&&K[i+1].t<=el)i++;const a=K[i],b=K[i+1],f=Math.max(0,Math.min(1,(el-a.t)/Math.max(1,b.t-a.t)));
 const same=a.who&&a.who===b.who,e=same?f:f*(2-f);
 return {x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e,who:same||f<.02?a.who:(b.k==='tk'&&f>.7?b.who:null),f,a,b,i};}
export function a2Frame(ts){
 requestAnimationFrame(a2Frame);
 const cv=document.getElementById('pitch2d'),m=S&&S.match;if(!cv||!m)return;
 if(!A2||A2.key!==a2Key(m))a2Reset(m);
 const W=cv.clientWidth|0;if(!W)return;const H=Math.round(W*.62),dpr=Math.min(2,window.devicePixelRatio||1);
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const dt=A2.lastTs==null?16:Math.min(60,ts-A2.lastTs);A2.lastTs=ts;
 const R=RT.replay&&RT.replay.P;let rp=null;
 if(R){if(RT.replay.t0==null){RT.replay.t0=ts;}const ms=ts-RT.replay.t0;rp=playAt(R,ms);if(ms>R.end){RT.replay.t0=null;}}
 const red=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mult=m.speed>=4?2.1:m.speed>=2?1.4:1;
 // jugadas nuevas del motor
 (m.pl||[]).forEach(ph=>{if(ph.min>A2.seen){A2.seen=ph.min;if(ph.out==='goal'){A2.q=[ph];A2.seq=null;}else{A2.q.push(ph);if(A2.q.length>3)A2.q=A2.q.filter((x,i)=>x.out!=='build'&&x.out!=='lost'||i>=A2.q.length-1);}}});
 if(m.min<A2.seen)A2.seen=m.min;
 let Q=A2.seq,st=null;
 if(!rp){
  if(!Q||Q.el>Q.end){Q=A2.seq=nextSeq(m);if(Q&&Q.K[0].who){const p0=A2.P[Q.K[0].who];if(p0&&Q.ph.kind==='open'){const k0=Q.K[0];k0.x=p0.x;k0.y=p0.y;}}}
  if(Q){const going=!m.paused||Q.el<Q.end;if(going)Q.el+=dt*mult;st=seqAt(Q,Q.el);A2.side=Q.s;
   if(st.b&&st.b.k==='tk'&&st.f>.7||st.a.k==='tk'||st.a.k==='d'&&teamOf(m,st.a.who)!==Q.s)A2.side=teamOf(m,st.who||st.a.who)||Q.s;
   A2.holder=st.who;A2.ball.x=st.x;A2.ball.y=st.y;
   const dist=Math.hypot(st.b.x-st.a.x,st.b.y-st.a.y),air=st.b.k==='cross'||dist>28&&st.a.who!==st.b.who&&!st.who;A2.ball.z=air?Math.sin(Math.PI*st.f)*Math.min(1,dist/30):0;
   if(st.f<.05&&st.a.who&&st.b.who!==st.a.who&&st.i>A2.lastI){A2.lastI=st.i;}
   if(Q.el<30)A2.lastI=-1;
   if(st.a.who!==st.b.who&&st.a.who&&st.b.k!=='tk'){const key=Q.ph.min+'|'+st.i;if(!A2.trail.some(x=>x.key===key))A2.trail.push({key,x1:st.a.x,y1:st.a.y,x2:st.b.x,y2:st.b.y,t:ts,s:Q.s});}
   A2.shot=st.a.k==='sh'||st.b.k==='g'?{goal:st.b.k==='g'||st.a.k==='g'}:null;
   if(st.a.k==='g'||st.f>=1&&st.b.k==='g')A2.goalT=A2.goalT&&ts-A2.goalT<2000?A2.goalT:ts;
  }
 }else{A2.side=R.s;A2.holder=rp.who;A2.ball={x:rp.x,y:rp.y,z:0};}
 A2.trail=A2.trail.filter(x=>ts-x.t<1800).slice(-4);
 const run=!!rp||!m.paused||(Q&&Q.el<Q.end);
 // dónde quiere estar cada jugador: bloque que sigue al balón, línea y anchura según la táctica, presión al que lleva el balón
 const bx=A2.ball.x,by=A2.ball.y,pos={},sl2={h:slotsOf(m.f.h),a:slotsOf(m.f.a)};
 const up=Q&&!rp?Q.K.filter(k=>k.who&&k.t>Q.el&&k.t-Q.el<1100):[];
 ['h','a'].forEach(s=>{const dir=s==='h'?1:-1,tac=(m.tac&&m.tac[s])||{},has=A2.side===s;
  const lin=tac.lin==='alt'?1.3:tac.lin==='baj'?.7:1,wid=has?(tac.anc==='anc'?1.14:tac.anc==='est'?.88:1):.86;
  const press=has?[]:m.lu[s].filter((id,i)=>id&&i>0&&A2.P[id]).sort((a,b)=>Math.hypot(A2.P[a].x-bx,A2.P[a].y-by)-Math.hypot(A2.P[b].x-bx,A2.P[b].y-by)).slice(0,tac.pre==='alt'?2:tac.pre==='baj'?0:1);
  m.lu[s].forEach((id,i)=>{if(!id)return;const b=A2.base[s][i]||[50,50],pl=PL(id);
   let x,y;
   if(i===0){x=GKX(s)+dir*Math.max(0,((s==='h'?bx:100-bx)-50)*.07);y=50+(by-50)*.25;}
   else{const du=m.du&&m.du[s]&&m.du[s][i],dd=du?(du==='ata'?1:du==='def'?-1:0)-(DEF_DUTY[sl2[s][i]]==='ata'?1:DEF_DUTY[sl2[s][i]]==='def'?-1:0):0;
    x=b[0]+(bx-50)*.45+(has?8*lin:-5*(2-lin))*dir+dd*(has?5:3)*dir;y=50+(b[1]-50)*wid+(by-b[1])*(has?.12:.28);
    x+=Math.sin(ts/1300+i*1.9+(s==='h'?0:2.5))*.8;y+=Math.cos(ts/1100+i*2.3)*.9;}
   if(press.includes(id)){x=bx-2.6*dir;y=by+(A2.P[id].y>by?2:-2);}
   const u=up.find(k=>k.who===id);if(u){x=u.x;y=u.y;}
   x=Math.max(1.5,Math.min(98.5,x));y=Math.max(2,Math.min(98,y));
   const P=A2.P[id]||(A2.P[id]={x,y});
   if(id===A2.holder){P.x=bx-1.2*dir;P.y=by;}
   else if(run||red){const v=(red?999:(12+((pl&&pl.at&&pl.at.vel)||5)*1.1)*mult)*dt/1000,dx=x-P.x,dy=y-P.y,dd=Math.hypot(dx,dy);if(dd>v){P.x+=dx/dd*v;P.y+=dy/dd*v;}else{P.x=x;P.y=y;}}
   pos[id]=P;});});
 if(A2.holder&&A2.P[A2.holder]&&!rp){const h=A2.P[A2.holder];if(Math.hypot(h.x-bx,h.y-by)>3){h.x=bx-(A2.side==='h'?1.2:-1.2);h.y=by;}}
 // campo
 const X=v=>v/100*W,Y=v=>v/100*H;
 for(let i=0;i<14;i++){c.fillStyle=i%2?'#2a7140':'#2f7b46';c.fillRect(i*W/14,0,W/14+1,H);}
 const vg=c.createRadialGradient(W/2,H/2,W*.15,W/2,H/2,W*.7);vg.addColorStop(0,'rgba(255,255,255,.04)');vg.addColorStop(1,'rgba(0,0,0,.18)');c.fillStyle=vg;c.fillRect(0,0,W,H);
 c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=Math.max(1.4,W/450);
 c.strokeRect(X(2),Y(3),X(96),Y(94));c.beginPath();c.moveTo(X(50),Y(3));c.lineTo(X(50),Y(97));c.stroke();
 c.beginPath();c.arc(X(50),Y(50),W*.08,0,Math.PI*2);c.stroke();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(X(50),Y(50),2,0,Math.PI*2);c.fill();
 [[2,1],[98,-1]].forEach(([gx,d])=>{c.strokeRect(Math.min(X(gx),X(gx+15*d)),Y(22),Math.abs(X(15)),Y(56));c.strokeRect(Math.min(X(gx),X(gx+5*d)),Y(37),Math.abs(X(5)),Y(26));
  c.beginPath();c.arc(X(gx+10.5*d),Y(50),2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(X(gx+10.5*d),Y(50),W*.08,d>0?-0.93:Math.PI-0.93+0,d>0?0.93:Math.PI+0.93);c.save();c.beginPath();c.rect(d>0?X(gx+15):0,0,d>0?W:X(gx-15),H);c.clip();c.beginPath();c.arc(X(gx+10.5*d),Y(50),W*.08,0,Math.PI*2);c.stroke();c.restore();
  c.fillStyle='rgba(255,255,255,.92)';c.fillRect(Math.min(X(gx),X(gx-1.3*d)),Y(44),Math.abs(X(1.3)),Y(12));c.fillStyle='rgba(255,255,255,.85)';});
 [[2,3],[98,3],[2,97],[98,97]].forEach(([x,y])=>{c.beginPath();c.arc(X(x),Y(y),W*.012,x<50?(y<50?0:-Math.PI/2):(y<50?Math.PI/2:Math.PI),x<50?(y<50?Math.PI/2:0):(y<50?Math.PI:Math.PI*1.5));c.stroke();});
 // rastro de los últimos pases: por dónde llega el ataque
 A2.trail.forEach(tr=>{const a=1-(ts-tr.t)/1800;c.strokeStyle=`rgba(255,255,255,${(.45*a).toFixed(2)})`;c.setLineDash([5,5]);c.lineWidth=1.6;c.beginPath();c.moveTo(X(tr.x1),Y(tr.y1));c.lineTo(X(tr.x2),Y(tr.y2));c.stroke();c.setLineDash([]);});
 // jugadores
 const r=Math.max(6,W*.017);c.font=`700 ${Math.round(r*1.05)}px "Barlow Condensed",Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';
 const KT=kits(m);
 ['h','a'].forEach(s=>{const t=KT[s];m.lu[s].forEach((id,i)=>{const P=pos[id];if(!P)return;const pl=PL(id),px=X(P.x),py=Y(P.y);
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(px+r*.25,py+r*.75,r*.95,r*.42,0,0,Math.PI*2);c.fill();
  if(id===A2.holder){c.strokeStyle='rgba(255,236,140,.9)';c.lineWidth=2;c.beginPath();c.arc(px,py,r*1.55,0,Math.PI*2);c.stroke();}
  c.beginPath();c.arc(px,py,r,0,Math.PI*2);c.fillStyle=i===0?(s==='h'?'#f2c230':'#7fd1ff'):t.f;c.fill();c.lineWidth=2;c.strokeStyle=i===0?'#111':t.e;c.stroke();
  if(r>=7){c.fillStyle=i===0?'#111':(lum(t.f)>.55?'#111':'#fff');c.fillText(pl?pl.num:'',px,py+.5);}
  if(id===A2.holder&&pl&&W>380){c.font=`700 ${Math.round(r*1.05)}px "Barlow Condensed",Arial,sans-serif`;const nm=pl.name.split(' ').slice(1).join(' ');const tw=c.measureText(nm).width+8;c.fillStyle='rgba(0,0,0,.6)';c.fillRect(px-tw/2,py-r*2.9,tw,r*1.45);c.fillStyle='#fff';c.fillText(nm,px,py-r*2.15);}});});
 // balón (con sombra y altura en los centros y pases largos)
 const br=Math.max(3,W*.0075),z=A2.ball.z||0;
 c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(X(A2.ball.x)+z*br*1.5,Y(A2.ball.y)+br*.6,br*(1-z*.3),br*.5*(1-z*.3),0,0,Math.PI*2);c.fill();
 c.beginPath();c.arc(X(A2.ball.x),Y(A2.ball.y)-z*H*.05,br*(1+z*.6),0,Math.PI*2);c.fillStyle='#fff';c.fill();c.lineWidth=1.2;c.strokeStyle='#111';c.stroke();
 // marcador
 c.fillStyle='rgba(0,0,0,.55)';c.fillRect(8,8,Math.max(120,W*.22),26);c.fillStyle='#fff';c.textAlign='left';c.font=`700 15px "Barlow Condensed",Arial,sans-serif`;
 c.fillText(`${T(m.h).short} ${m.score.h}-${m.score.a} ${T(m.a).short} · ${m.done?'Final':m.min+"'"}`,14,21);
 if(Q&&!rp){const k=Q.ph.out,lab=k==='goal'&&Q.el>=Q.K[Q.K.length-1].t?null:Q.el>(Q.K.find(x=>x.k==='sh')||{t:1e9}).t?(k==='save'?'¡PARADA!':k==='post'?'¡AL PALO!':k==='miss'?'FUERA':''):'';
  if(lab){c.fillStyle='rgba(0,0,0,.6)';c.textAlign='center';c.font=`800 ${Math.max(14,Math.round(W*.03))}px "Barlow Condensed",Arial,sans-serif`;const tw=c.measureText(lab).width+20;c.fillRect(W/2-tw/2,H-38,tw,28);c.fillStyle='#fff';c.fillText(lab,W/2,H-23);}}
 if(rp){const e=R.e,pl=PL(e.pid);c.fillStyle='rgba(180,20,20,.85)';c.textAlign='right';c.font=`700 ${Math.max(13,Math.round(W*.022))}px "Barlow Condensed",Arial,sans-serif`;const lb=`REPETICIÓN · ${e.min}' ${pl?pl.name:''}`;const tw=c.measureText(lb).width+16;c.fillRect(W-tw-8,8,tw,26);c.fillStyle='#fff';c.fillText(lb,W-16,21);
  if(rp.goal)goalBanner(c,W,H,Math.min(1,(ts-RT.replay.t0-R.K[R.K.length-1].t)/250));return;}
 if(Q&&Q.ph.out==='goal'&&Q.el>=Q.K[Q.K.length-1].t)goalBanner(c,W,H,Math.min(1,(Q.el-Q.K[Q.K.length-1].t)/250));
 if(m.paused&&!m.done&&!(Q&&Q.el<Q.end)){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,0,W,H);}
}
function goalBanner(c,W,H,a){c.globalAlpha=Math.max(0,a);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.fillStyle='#f4cf5c';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.round(W*.12)}px "Big Shoulders Display",Impact,sans-serif`;c.fillText('¡GOL!',W/2,H/2);c.globalAlpha=1;}
export function startAnim2d(){if(typeof requestAnimationFrame!=='undefined'&&typeof document!=='undefined')requestAnimationFrame(a2Frame);}
