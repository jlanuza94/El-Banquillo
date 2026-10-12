/* El Banquillo · competitions.js — Calendario de la temporada, copas nacionales, Mundial de Clubes y competiciones continentales. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {money,r2,r3,rnd,shuffle} from './core';
import {COUNTRIES,LV_NAMES} from './data';
import {nC,wcs,cName,LG,S,T,findLg,lgTeams,seasonLabel,uLg,unit} from './state';
import {strength} from './players';
import {news} from './world';
import {applyResult,createMatch,playerTick,quickMatch,step} from './engine';
import {unlock} from './club';
import {processWeek} from './squad';
export const CUP_AFTER=[3,8,13,18,23,28,33],CWC_AFTER=[5,10,15,20,25,30];export const NCUP=CUP_AFTER.length;
export const CWC_NAMES=['Fase de grupos · Jornada 1','Fase de grupos · Jornada 2','Fase de grupos · Jornada 3','Cuartos de final','Semifinales','Final'];
export const cupName=c=>`Copa de ${cName(c)}`;
export const cupRoundName=rd=>{const n=rd.n;return n<=2?'Final':n<=4?'Semifinales':n<=8?'Cuartos de final':n<=16?'Octavos de final':n<=32?'Dieciseisavos':(['Primera','Segunda','Tercera'][rd.k]||'Otra')+' ronda';};
export function cupRounds(n){let r=0;while(n>1){const P=1<<Math.floor(Math.log2(n));n=r===0?Math.ceil(n/2):n===P?n/2:P;r++;}return r;}
export const mkTie=(h,a,g)=>({h,a,g,hg:null,ag:null,pen:null,w:null,played:false,ev:[]});
export function buildCal(){const cal=[];for(let w=0;w<38;w++){cal.push({t:'lg',r:w});const c=CUP_AFTER.indexOf(w);if(c>=0)cal.push({t:'cup',s:c});const d=CWC_AFTER.indexOf(w);if(d>=0)cal.push({t:'cwc',s:d});const e=CT_AFTER.indexOf(w);if(e>=0)cal.push({t:'ct',s:e});}return cal;}
/** Mundial de Clubes: 16 equipos. Campeones de los países más fuertes y, si faltan, subcampeones. */
export function cwcFrom(tops){const ord=wcs().sort((a,b)=>COUNTRIES[b].top-COUNTRIES[a].top),q=ord.slice(0,16).map(c=>tops[c][0].id);for(const c of ord){if(q.length>=16)break;q.push(tops[c][1].id);}return q;}
export function setupCups(){
 S.cups=wcs().map(c=>{const ids=S.teams.filter(t=>LG(t.lg).c===c).map(t=>t.id);return{c,R:cupRounds(ids.length),alive:ids,rounds:[],winner:null};});
 let q=S.cwcQual;
 if(!q||q.length!==16){const tops=wcs().map(c=>lgTeams(findLg(c,0).id).sort((a,b)=>strength(b.id)-strength(a.id)));q=cwcFrom(tops);}
 const pots=q.slice().sort((a,b)=>strength(b)-strength(a)),groups=[[],[],[],[]];
 for(let p=0;p<4;p++)shuffle(pots.slice(p*4,p*4+4)).forEach((id,g)=>groups[g].push(id));
 const PAIRS=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 S.cwc={teams:q,groups,dates:[0,1,2].map(d=>groups.flatMap((g,gi)=>PAIRS[d].map(([x,y])=>mkTie(g[x],g[y],gi)))),winner:null};
}
export function cwcWelcome(){if(S.cwc&&S.cwc.teams.includes(S.user)){const fee=r2(unit(76)*2);S.budget=r3(S.budget+fee);news(`¡Clasificados para el Mundial de Clubes! Cobras ${money(fee)} por participar. Grupo ${'ABCD'[S.cwc.groups.findIndex(g=>g.includes(S.user))]}.`,'good');}}
export const cupSlotRound=(cup,s)=>{const k=s-(NCUP-cup.R);return k>=0?k:null;};
export const userCup=()=>S.cups?S.cups[LG(uLg()).c]:null;
export function getFx(ref){return ref.k==='fr'?S.fr[ref.i]:ref.k==='lg'?S.fixtures[ref.lg][ref.r][ref.i]:ref.k==='cup'?S.cups[ref.c].rounds[ref.r].matches[ref.i]:ref.k==='ct'?S.conts[ref.ct].dates[ref.s][ref.i]:S.cwc.dates[ref.s][ref.i];}
export const curEvent=()=>S.cal&&S.ci<S.cal.length?S.cal[S.ci]:null;
export function userRefFor(ev){
 const me=f=>f.h===S.user||f.a===S.user;
 if(ev.t==='lg'){const i=S.fixtures[uLg()][ev.r].findIndex(me);return{k:'lg',lg:uLg(),r:ev.r,i};}
 if(ev.t==='cup'){const cup=userCup();if(!cup)return null;const k=cupSlotRound(cup,ev.s);if(k==null||!cup.rounds[k])return null;const i=cup.rounds[k].matches.findIndex(me);return i>=0?{k:'cup',c:cup.c,r:k,i}:null;}
 if(ev.t==='ct'){if(!S.conts)return null;for(let ct=0;ct<S.conts.length;ct++){const d=S.conts[ct].dates[ev.s];if(!d)continue;const i=d.findIndex(me);if(i>=0)return{k:'ct',ct,s:ev.s,i};}return null;}
 if(!S.cwc||!S.cwc.dates[ev.s])return null;const i=S.cwc.dates[ev.s].findIndex(me);return i>=0?{k:'cwc',s:ev.s,i}:null;
}
export function compLabel(ref){
 if(ref.k==='lg')return `${LV_NAMES[LG(ref.lg).lv]} · Jornada ${ref.r+1}`;
 if(ref.k==='cup')return `${cupName(ref.c)} · ${cupRoundName(S.cups[ref.c].rounds[ref.r])}`;
 if(ref.k==='ct')return `${CONTS[ref.ct].n} · ${ref.s<6?'Grupo '+GL[S.conts[ref.ct].dates[ref.s][ref.i].g]+', jornada '+(ref.s+1):CT_STAGES[ref.s]}`;
 return `Mundial de Clubes · ${ref.s<3?'Grupo '+'ABCD'[S.cwc.dates[ref.s][ref.i].g]+', jornada '+(ref.s+1):CWC_NAMES[ref.s]}`;
}
export function nextMatch(){const ev=curEvent();if(!ev)return null;const ref=userRefFor(ev);return ref?{ev,ref,fx:getFx(ref),label:compLabel(ref)}:null;}
export function drawCup(cup,k){
 const n=cup.alive.length,P=1<<Math.floor(Math.log2(n)),lvOf=id=>LG(T(id).lg).lv;
 let play=shuffle(cup.alive.slice()),byes=[];
 if(k===0){if(n%2)byes=[play.pop()];}
 else if(n!==P){byes=play.slice(2*(n-P));play=play.slice(0,2*(n-P));}
 shuffle(play);const matches=[];
 for(let i=0;i+1<play.length;i+=2){let h=play[i],a=play[i+1];if(lvOf(a)>lvOf(h)||(lvOf(a)===lvOf(h)&&rnd()<.5))[h,a]=[a,h];matches.push(mkTie(h,a));}
 cup.rounds[k]={n,k,matches,byes};
}
export function cwcTable(g){
 const t={};S.cwc.groups[g].forEach(id=>t[id]={id,pj:0,pts:0,gf:0,gc:0});
 S.cwc.dates.slice(0,3).forEach(d=>d&&d.forEach(f=>{if(f.g!==g||!f.played)return;const H=t[f.h],A=t[f.a];H.pj++;A.pj++;H.gf+=f.hg;H.gc+=f.ag;A.gf+=f.ag;A.gc+=f.hg;if(f.hg>f.ag)H.pts+=3;else if(f.hg<f.ag)A.pts+=3;else{H.pts++;A.pts++;}}));
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf||strength(b.id)-strength(a.id));
}
export function drawCwcKo(s){
 const C=S.cwc;
 if(s===3){const t=[0,1,2,3].map(cwcTable);C.dates[3]=[[0,1],[1,0],[2,3],[3,2]].map(([x,y])=>mkTie(t[x][0].id,t[y][1].id));}
 else if(s===4){const w=C.dates[3].map(f=>f.w);C.dates[4]=[mkTie(w[0],w[2]),mkTie(w[1],w[3])];}
 else if(s===5){const w=C.dates[4].map(f=>f.w);C.dates[5]=[mkTie(w[0],w[1])];}
}
export function prepEvent(ev){
 if(ev.t==='cup'&&S.cups)S.cups.forEach(cup=>{const k=cupSlotRound(cup,ev.s);if(k!=null&&!cup.rounds[k]&&cup.alive.length>1)drawCup(cup,k);});
 if(ev.t==='cwc'&&S.cwc&&!S.cwc.dates[ev.s])drawCwcKo(ev.s);
 if(ev.t==='ct'&&S.conts)S.conts.forEach((C,ci)=>{if(!C.dates[ev.s])drawCtKo(ci,ev.s);});
}
export function eventRefs(ev){
 const out=[];
 if(ev.t==='lg')S.leagues.forEach(L=>S.fixtures[L.id][ev.r].forEach((f,i)=>out.push({k:'lg',lg:L.id,r:ev.r,i})));
 else if(ev.t==='cup'){if(S.cups)S.cups.forEach(cup=>{const k=cupSlotRound(cup,ev.s);if(k!=null&&cup.rounds[k])cup.rounds[k].matches.forEach((f,i)=>out.push({k:'cup',c:cup.c,r:k,i}));});}
 else if(ev.t==='ct'){if(S.conts)S.conts.forEach((C,ct)=>(C.dates[ev.s]||[]).forEach((f,i)=>out.push({k:'ct',ct,s:ev.s,i})));}
 else if(S.cwc&&S.cwc.dates[ev.s])S.cwc.dates[ev.s].forEach((f,i)=>out.push({k:'cwc',s:ev.s,i}));
 return out;
}
export function completeEvent(ev){
 const uc=LG(uLg()).c;
 eventRefs(ev).forEach(ref=>{if(getFx(ref).played)return;const near=false;
  let m;if(near){m=createMatch(ref);m.auto=true;while(!m.done)step(m);}else m=quickMatch(ref);applyResult(m);});
 if(ev.t==='lg'){processWeek();return;}
 playerTick(false);
 if(ev.t==='cup')resolveCups(ev.s);else if(ev.t==='ct')resolveCt(ev.s);else resolveCwc(ev.s);
}
export function advance(){while(S.cal&&S.ci<S.cal.length){const ev=S.cal[S.ci];prepEvent(ev);if(ev.t==='lg'||userRefFor(ev))break;completeEvent(ev);S.ci++;}}
export function resolveCups(s){
 S.cups.forEach(cup=>{const k=cupSlotRound(cup,s);if(k==null||!cup.rounds[k])return;const rd=cup.rounds[k],C=COUNTRIES[cup.c];
  cup.alive=[...rd.byes,...rd.matches.map(f=>f.w)];
  const um=rd.matches.find(f=>f.h===S.user||f.a===S.user);
  if(um){const nm=cupRoundName(rd);
   if(um.w===S.user){const pr=r2(.12*unit(C.top)*Math.pow(1.5,k));S.budget=r3(S.budget+pr);news(`${cupName(cup.c)} · ${nm}: ¡pasas de ronda! Premio de ${money(pr)}.`,'good');}
   else news(`${cupName(cup.c)} · ${nm}: eliminados por ${T(um.w).name}.`,'bad');}
  if(cup.alive.length===1&&cup.winner==null){cup.winner=cup.alive[0];
   if(cup.winner===S.user){unlock('copa');const pr=r2(unit(C.top)*2);S.budget=r3(S.budget+pr);S.titles.push({season:seasonLabel(),name:cupName(cup.c)});news(`¡CAMPEONES DE LA ${cupName(cup.c).toUpperCase()}! Premio de ${money(pr)}.`,'good');}
   else if(cup.c===LG(uLg()).c)news(`${T(cup.winner).name} gana la ${cupName(cup.c)}.`);}
 });
}
export function resolveCwc(s){
 const C=S.cwc,d=C.dates[s],u=unit(76),um=d.find(f=>f.h===S.user||f.a===S.user);
 if(um){if(um.w===S.user){const pr=r2(u*.6);S.budget=r3(S.budget+pr);news(`Mundial de Clubes · ${CWC_NAMES[s]}: victoria y ${money(pr)} de premio.`,'good');}
  else if(s>=3)news(`Mundial de Clubes · ${CWC_NAMES[s]}: eliminados por ${T(um.w).name}.`,'bad');}
 if(s===2&&C.teams.includes(S.user)){const g=C.groups.findIndex(x=>x.includes(S.user)),p=cwcTable(g).findIndex(r=>r.id===S.user);news(p<2?`Mundial de Clubes: ¡a cuartos como ${p+1}º de grupo!`:'Mundial de Clubes: eliminados en la fase de grupos.',p<2?'good':'bad');}
 if(s===5){C.winner=d[0].w;
  if(C.winner===S.user){unlock('cwc');const pr=r2(u*8);S.budget=r3(S.budget+pr);S.titles.push({season:seasonLabel(),name:'Mundial de Clubes'});news(`¡CAMPEONES DEL MUNDO DE CLUBES! Premio de ${money(pr)}.`,'good');}
  else news(`${T(C.winner).name} (${COUNTRIES[LG(T(C.winner).lg).c].n}) gana el Mundial de Clubes.`);}
}
export const CT_AFTER=[1,4,7,9,12,16,19,21,24,26,29,31,34];
export const CT_STAGES=['Grupos · J1','Grupos · J2','Grupos · J3','Grupos · J4','Grupos · J5','Grupos · J6','Octavos · ida','Octavos · vuelta','Cuartos · ida','Cuartos · vuelta','Semifinal · ida','Semifinal · vuelta','Final'];
export const CONTS=[{n:'Liga de Campeones',reg:'Europa',q:{1:5,0:5,2:5,3:5,4:5,5:4,8:3},q16:{1:5,0:5,2:4,3:4,4:4,5:3,8:3,10:2,11:1,12:1},G:8,top:76},{n:'Copa Libertad',reg:'América',q:{6:6,7:6,9:4},q16:{6:5,7:5,9:2,15:2,13:2},G:4,top:69}];
/** Plazas por país (con los países nuevos se reparten de otra forma; siempre 32 y 16 equipos). */
export const quotas=C=>nC()>10&&C.q16?C.q16:C.q;
export const GL='ABCDEFGH';
export function ctQualify(tabFor){return CONTS.map(C=>Object.entries(quotas(C)).flatMap(([c,n])=>tabFor(+c).slice(0,n)));}
export function setupConts(){
 const q=S.ctQual&&S.ctQual.length===2?S.ctQual:ctQualify(c=>lgTeams(findLg(c,0).id).sort((a,b)=>strength(b.id)-strength(a.id)).map(t=>t.id));
 const P=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 S.conts=CONTS.map((C,ci)=>{const teams=q[ci].filter(id=>T(id)),pots=teams.slice().sort((a,b)=>strength(b)-strength(a)),groups=Array.from({length:C.G},()=>[]);
  for(let p=0;p<4;p++)shuffle(pots.slice(p*C.G,p*C.G+C.G)).forEach((id,g)=>groups[g].push(id));
  const dates=[0,1,2,3,4,5].map(d=>groups.flatMap((g,gi)=>P[d%3].map(([x,y])=>d<3?mkTie(g[x],g[y],gi):mkTie(g[y],g[x],gi))));
  return{teams,groups,dates,winner:null};});
}
export function ctTable(ci,g){
 const C=S.conts[ci],t={};C.groups[g].forEach(id=>t[id]={id,pj:0,pts:0,gf:0,gc:0});
 C.dates.slice(0,6).forEach(d=>d&&d.forEach(f=>{if(f.g!==g||!f.played)return;const H=t[f.h],A=t[f.a];H.pj++;A.pj++;H.gf+=f.hg;H.gc+=f.ag;A.gf+=f.ag;A.gc+=f.hg;if(f.hg>f.ag)H.pts+=3;else if(f.hg<f.ag)A.pts+=3;else{H.pts++;A.pts++;}}));
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf||strength(b.id)-strength(a.id));
}
export function drawCtKo(ci,s){
 const C=S.conts[ci],G=CONTS[ci].G,leg1=(h,a,i)=>Object.assign(mkTie(h,a),{leg:1,tie:i}),leg2=d=>d.map((f,i)=>Object.assign(mkTie(f.a,f.h),{leg:2,tie:i}));
 const tabs=()=>Array.from({length:G},(_,g)=>ctTable(ci,g));
 if(s===6){if(G!==8){C.dates[6]=[];return;}const t=tabs();C.dates[6]=[[0,1],[1,0],[2,3],[3,2],[4,5],[5,4],[6,7],[7,6]].map(([x,y],i)=>leg1(t[y][1].id,t[x][0].id,i));}
 else if(s===7){C.dates[7]=G===8?leg2(C.dates[6]):[];}
 else if(s===8){let w;if(G===8)w=C.dates[7].map(f=>f.w);else{const t=tabs();w=[];[[0,1],[1,0],[2,3],[3,2]].forEach(([x,y])=>{w.push(t[x][0].id,t[y][1].id);});}
  C.dates[8]=[0,1,2,3].map(i=>G===8?leg1(w[2*i],w[2*i+1],i):leg1(w[2*i+1],w[2*i],i));}
 else if(s===9||s===11)C.dates[s]=leg2(C.dates[s-1]);
 else if(s===10){const w=C.dates[9].map(f=>f.w);C.dates[10]=[leg1(w[0],w[1],0),leg1(w[2],w[3],1)];}
 else if(s===12){const w=C.dates[11].map(f=>f.w);C.dates[12]=[mkTie(w[0],w[1])];}
}
export function ctOf(id){if(!S.conts)return -1;return S.conts.findIndex(C=>C.teams.includes(id));}
export function ctWelcome(){const ci=ctOf(S.user);if(ci<0)return;const u=unit(CONTS[ci].top),fee=r2(u*1.5);S.budget=r3(S.budget+fee);
 news(`¡Clasificados para la ${CONTS[ci].n}! Cobras ${money(fee)} por participar. Grupo ${GL[S.conts[ci].groups.findIndex(g=>g.includes(S.user))]}.`,'good');}
export function resolveCt(s){
 S.conts.forEach((C,ci)=>{const d=C.dates[s];if(!d||!d.length)return;const u=unit(CONTS[ci].top),um=d.find(f=>f.h===S.user||f.a===S.user);
  if(um){const st=CT_STAGES[s];
   if(s<6){const won=(um.h===S.user&&um.hg>um.ag)||(um.a===S.user&&um.ag>um.hg);if(won){const pr=r2(u*.3);S.budget=r3(S.budget+pr);news(`${CONTS[ci].n} · ${st}: victoria y ${money(pr)}.`,'good');}}
   else if(um.leg!==1){if(um.w===S.user){const pr=r2(u*(s===12?4:.6));S.budget=r3(S.budget+pr);if(s<12)news(`${CONTS[ci].n} · ${st}: ¡eliminatoria superada! ${money(pr)} de premio.`,'good');}else news(`${CONTS[ci].n} · ${st}: eliminados por ${T(um.w).name}.`,'bad');}}
  if(s===5&&C.teams.includes(S.user)){const g=C.groups.findIndex(x=>x.includes(S.user)),p=ctTable(ci,g).findIndex(r=>r.id===S.user);news(p<2?`${CONTS[ci].n}: ¡pasamos de grupo como ${p+1}º!`:`${CONTS[ci].n}: eliminados en la fase de grupos.`,p<2?'good':'bad');}
  if(s===12){C.winner=d[0].w;if(C.winner===S.user){unlock('cont');S.titles.push({season:seasonLabel(),name:CONTS[ci].n});news(`¡CAMPEONES DE LA ${CONTS[ci].n.toUpperCase()}! Premio de ${money(r2(u*5))}.`,'good');}else news(`${T(C.winner).name} gana la ${CONTS[ci].n}.`);}
 });
}
export function ctStatus(){
 if(!S.conts)return 'Empieza la próxima temporada';const ci=ctOf(S.user);if(ci<0)return 'No clasificado';const C=S.conts[ci];
 if(C.winner===S.user)return '¡Campeón!';
 const me=f=>f.h===S.user||f.a===S.user;
 for(let s=6;s<=12;s++){const d=C.dates[s];if(d&&d.some(f=>me(f)&&f.played&&f.leg!==1&&f.w!==S.user))return `Eliminado en ${CT_STAGES[s].split(' ·')[0].toLowerCase()}`;}
 const ko=[6,8].some(s=>C.dates[s]&&C.dates[s].some(me));
 if(C.dates[8]&&!ko)return 'Eliminado en la fase de grupos';
 if(ko)return 'En eliminatorias';
 return `Grupo ${GL[C.groups.findIndex(g=>g.includes(S.user))]}`;
}
export function cupStatus(){
 const cup=userCup();if(!cup)return 'Empieza la próxima temporada';
 if(cup.winner===S.user)return '¡Campeón!';
 if(!cup.alive.includes(S.user)){const rd=cup.rounds.find(rd=>rd&&rd.matches.some(f=>(f.h===S.user||f.a===S.user)&&f.played&&f.w!==S.user));return rd?`Eliminado en ${cupRoundName(rd).toLowerCase()}`:'Eliminado';}
 if(!cup.rounds.length)return `Debuta tras la jornada ${CUP_AFTER[NCUP-cup.R]+1}`;
 return 'Sigues vivo';
}
export function cwcStatus(){
 const C=S.cwc;if(!C)return 'Empieza la próxima temporada';
 if(C.winner===S.user)return '¡Campeón del mundo!';
 if(!C.teams.includes(S.user))return 'No clasificado (lo juegan los campeones de Primera)';
 const inKo=C.dates[3]&&C.dates[3].some(f=>f.h===S.user||f.a===S.user);
 const out=[3,4,5].some(s=>C.dates[s]&&C.dates[s].some(f=>(f.h===S.user||f.a===S.user)&&f.played&&f.w!==S.user));
 if(out)return 'Eliminado';if(C.dates[3]&&!inKo)return 'Eliminado en la fase de grupos';
 return `Grupo ${'ABCD'[C.groups.findIndex(g=>g.includes(S.user))]}`;
}
