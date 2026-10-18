/* El Banquillo · youthcl.ts — Liga de Campeones Sub-19 (Europa) y Copa Libertadores Sub-20 (América):
 * las canteras de los clubes que juegan la competición continental, más el campeón juvenil de tu país.
 * Fase de grupos (6 jornadas) y eliminatorias a partido único con penaltis. Tus canteranos juegan de verdad. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,pick,rnd,shuffle} from './core';
import {COUNTRIES} from './data';
import {LG,S,T,seasonLabel,uLg} from './state';
import {news} from './world';
import {aiYouthStr} from './youthclubs';
import {userYouthStr,youthPlay} from './youth';
import {u19List} from './u19';

export const YCL_N=['Liga de Campeones Sub-19','Copa Libertadores Sub-20'];
const GW=[4,7,10,13,16,18],KW=[22,26,30,33],KO_N={16:'Octavos de final',8:'Cuartos de final',4:'Semifinales',2:'Final'};
const P=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
const str=id=>id===S.user?userYouthStr():aiYouthStr(id);
function goals(a,b){const l=clamp(1.35*Math.pow(a/b,2.4),.2,4.5);let L=Math.exp(-l),k=0,p=1;do{k++;p*=rnd();}while(p>L);return k-1;}
export const yclName=id=>T(id)?T(id).name+(S.ycl&&S.ycl.ci===1?' Sub-20':' Sub-19'):'?';
/** Al empezar la temporada (en cuanto hay competición continental): participantes y grupos. */
export function yclSetup(){
 const c=LG(uLg()).c,conf=COUNTRIES[c].conf,ci=conf==='eu'?0:conf==='sa'||conf==='na'?1:-1;
 if(ci<0||!S.conts||!S.conts[ci]){S.ycl={s:S.seasonN,none:1};return;}
 let teams=S.conts[ci].teams.filter(id=>T(id));const champ=S.ylChampS===S.seasonN-1;
 if(champ&&!teams.includes(S.user)){teams=teams.slice().sort((a,b)=>aiYouthStr(b)-aiYouthStr(a));teams[teams.length-1]=S.user;}
 const G=teams.length/4,pots=teams.slice().sort((a,b)=>str(b)-str(a)),groups=Array.from({length:G},()=>[]);
 for(let p=0;p<4;p++)shuffle(pots.slice(p*G,p*G+G)).forEach((id,g)=>groups[g].push(id));
 S.ycl={s:S.seasonN,ci,n:YCL_N[ci],groups,gr:0,res:[],ko:[],champ:null,me:teams.includes(S.user),via:champ&&!S.conts[ci].teams.includes(S.user)?'champ':'ct'};
 if(S.ycl.me)news(`Tu sub-19 jugará la ${S.ycl.n}${S.ycl.via==='champ'?' como campeona juvenil de tu país':''}. Rivales de grupo: ${groups.find(g=>g.includes(S.user)).filter(id=>id!==S.user).map(id=>T(id).name).join(', ')}.`,'good',{cat:'oje',subj:`🏆 ${S.ycl.n}`,act:[{l:'Ver cantera',a:'vtab',k:'can',v:'ycl',go:'cantera'}]});
}
function play(h,a,ko){let hg=goals(str(h),str(a)),ag=goals(str(a),str(h)),pen=null;if(ko&&hg===ag){let x=0,y=0;for(let i=0;i<5;i++){x+=rnd()<.75?1:0;y+=rnd()<.75?1:0;}while(x===y){x+=rnd()<.75?1:0;y+=rnd()<.75?1:0;}pen=[x,y];}
 const r={h,a,hg,ag,pen,w:hg>ag?h:ag>hg?a:pen?(pen[0]>pen[1]?h:a):null};
 if(h===S.user||a===S.user){const me=h===S.user,my=me?hg:ag,op=me?ag:hg,gl=youthPlay(my,op),sc=Object.entries(gl||{}).map(([id,n])=>{const p=u19List().find(x=>x.id===id);return p?p.name.split(' ').slice(-1)[0]+(n>1?' ('+n+')':''):'';}).filter(Boolean);
  news(`${S.ycl.n}: ${yclName(h)} ${hg}-${ag} ${yclName(a)}${pen?` (penaltis ${pen[0]}-${pen[1]})`:''}.${sc.length?' Goles de tu sub-19: '+sc.join(', ')+'.':''}`,r.w===S.user||(!ko&&my>op)?'good':my<op||(ko&&r.w!==S.user)?'bad':'',{cat:'oje',subj:`${S.ycl.n}: ${my}-${op}`,quiet:false});}
 return r;}
export function yclTable(g){const t={};S.ycl.groups[g].forEach(id=>t[id]={id,pj:0,pts:0,gf:0,gc:0});
 S.ycl.res.filter(r=>r.g===g).forEach(r=>{const H=t[r.h],A=t[r.a];H.pj++;A.pj++;H.gf+=r.hg;H.gc+=r.ag;A.gf+=r.ag;A.gc+=r.hg;if(r.hg>r.ag)H.pts+=3;else if(r.hg<r.ag)A.pts+=3;else{H.pts++;A.pts++;}});
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);}
/** Cada jornada de liga: si toca, se juega una fecha de grupos o una ronda de eliminatorias. */
export function yclWeekly(){
 if(S.user==null)return;if(!S.ycl||S.ycl.s!==S.seasonN){if(S.week<GW[0]-1||!S.conts)return;yclSetup();}
 const Y=S.ycl;if(Y.none||Y.champ!=null)return;
 const gi=GW.indexOf(S.week);
 if(gi>=0&&Y.gr===gi){Y.groups.forEach((g,k)=>P[gi%3].forEach(([x,y])=>{const r=gi<3?play(g[x],g[y]):play(g[y],g[x]);r.g=k;Y.res.push(r);}));Y.gr++;
  if(Y.gr===6){const q=[];Y.groups.forEach((g,k)=>{const tb=yclTable(k);q.push([tb[0].id,tb[1].id]);});
   const ties=[];for(let k=0;k<q.length;k+=2){ties.push([q[k][0],q[k+1]?q[k+1][1]:q[0][1]],[q[k+1]?q[k+1][0]:q[0][0],q[k][1]]);}Y.next=ties;
   if(Y.me){const out=!q.some(x=>x.includes(S.user));news(out?`Tu sub-19 cae en la fase de grupos de la ${Y.n}.`:`¡Tu sub-19 pasa la fase de grupos de la ${Y.n}! ${KO_N[ties.length*2]}: contra ${yclName(ties.flat()[ties.flat().indexOf(S.user)^1])}.`,out?'':'good',{cat:'oje',subj:`${Y.n}: ${out?'eliminados':'¡a eliminatorias!'}`});}}
  return;}
 const ki=KW.indexOf(S.week),need=Y.next?Y.next.length*2:0;
 if(ki>=0&&Y.next&&Y.gr===6&&KW.slice(4-Math.log2(need)).indexOf(S.week)===0){const rd=Y.next.map(([h,a])=>play(h,a,true));Y.ko.push({n:KO_N[need],ms:rd});const w=rd.map(r=>r.w);
  if(w.length===1){Y.champ=w[0];if(w[0]===S.user){S.titles=S.titles||[];S.titles.push({season:seasonLabel(),name:Y.n});u19List().forEach(p=>{p.pot=Math.min(9.9,(p.pot||5)+.15);});news(`¡TU SUB-19 GANA LA ${Y.n.toUpperCase()}! Toda Europa habla de tu cantera: los chavales crecen en confianza (potencial +).`,'good',{cat:'oje',subj:`🏆 ¡Campeones de la ${Y.n}!`});}
   else news(`${Y.n}: ${yclName(w[0])} es campeona${Y.me?'.':''}`,'',{cat:'oje',subj:`${Y.n}: campeón ${yclName(w[0])}`,quiet:!Y.me});Y.next=null;}
  else{const nx=[];for(let k=0;k<w.length;k+=2)nx.push([w[k],w[k+1]]);Y.next=nx;}}
}
/** Panel en la cantera. */
export function yclHTML(esc){
 const Y=S.ycl;if(!Y||Y.none||Y.s!==S.seasonN)return `<section class="panel"><div class="empty">${Y&&Y.none?'En tu continente no hay competición juvenil continental.':'La competición continental juvenil empieza tras las primeras jornadas. Juegan las canteras de los clubes que están en la Liga de Campeones (o la Copa Libertadores) y el campeón de la liga sub-19 de tu país.'}</div></section>`;
 const mine=Y.groups.findIndex(g=>g.includes(S.user));
 const tbH=k=>`<div class="tbl"><table><thead><tr><th>Grupo ${'ABCDEFGH'[k]}</th><th class="r">PJ</th><th class="r">DG</th><th class="r">Pts</th></tr></thead><tbody>${yclTable(k).map(r=>`<tr class="${r.id===S.user?'me':''}"><td>${esc(yclName(r.id))}</td><td class="n">${r.pj}</td><td class="n">${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div>`;
 return `<section class="panel"><div class="panel-h"><h2>🏆 ${esc(Y.n)}</h2><span class="eyebrow">${Y.champ!=null?'Campeón: '+esc(yclName(Y.champ)):Y.gr<6?`Grupos · jornada ${Y.gr} de 6`:'Eliminatorias'}</span></div>
 ${Y.me?'':`<p class="small muted" style="margin:0 0 8px">Tu sub-19 no juega esta edición. Para entrar: clasifica a tu primer equipo para la competición continental o gana la liga sub-19 de tu país.</p>`}
 <div class="grid">${mine>=0?tbH(mine):''}${Y.ko.map(r=>`<div><div class="eyebrow" style="margin:6px 0 4px">${r.n}</div>${r.ms.map(m=>`<div class="small ${m.h===S.user||m.a===S.user?'pos':''}">${esc(yclName(m.h))} ${m.hg}-${m.ag} ${esc(yclName(m.a))}${m.pen?` (${m.pen[0]}-${m.pen[1]} p.)`:''}</div>`).join('')}</div>`).join('')}</div>
 <details style="margin-top:8px"><summary class="small">Todos los grupos</summary><div class="grid">${Y.groups.map((g,k)=>k===mine?'':tbH(k)).join('')}</div></details></section>`;
}
