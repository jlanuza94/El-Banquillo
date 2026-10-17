/* El Banquillo · views/posthub.ts — Resumen tras el partido (como el «Post-Match Hub» del FMM): marcador, mejor jugador,
 * estadísticas clave, lo que salió bien y mal, análisis de jugadores y la frase de la prensa. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {PL,S,T,crest,qBadge} from '../state';

const dec=v=>(Math.round(v*10)/10).toFixed(1).replace('.',',');
/** Lo bueno y lo malo: sale del informe táctico y de los números del partido. */
function goodBad(r,us){const o=us==='h'?'a':'h',G=[],B=[],R=r.tr,me=r.st[us],op=r.st[o];
 if(R&&R.f){R.f.filter(x=>x[2]-x[3]>.04).sort((a,b)=>(b[2]-b[3])-(a[2]-a[3])).slice(0,3).forEach(x=>G.push(x[1]));R.f.filter(x=>x[2]-x[3]<-.04).sort((a,b)=>(a[2]-a[3])-(b[2]-b[3])).slice(0,2).forEach(x=>B.push(x[1]));}
 const side=us==='h'?0:1,mine=(r.pl||[]).filter(x=>x[1]===side),kp=mine.reduce((a,x)=>a+(x[4]||0),0),tk=mine.reduce((a,x)=>a+(x[5]||0),0),dr=mine.reduce((a,x)=>a+(x[6]||0),0);
 if(kp>=9)G.push('El centro del campo creó mucho');if(tk>=20)G.push('La defensa entró bien al corte');if(dr>=12)G.push('Mucho desborde por las bandas');
 if(me.fo<op.fo-3)G.push('Provocaste muchas faltas del rival');if(me.xg>op.xg+.8)G.push('Dominaste en ocasiones');
 const gk=mine.find(x=>PL(x[0])&&PL(x[0]).sp==='POR');const conc=us==='h'?r.ag:r.hg;if(gk&&conc>=2&&op.ot&&conc/op.ot>.45)B.push('Pocas paradas del portero');
 if(op.xg>me.xg+.8)B.push('El rival tuvo más y mejores ocasiones');if(me.sh>=8&&me.ot/me.sh<.3)B.push('Poca puntería: muchos tiros fuera');if((me.yc||0)>=4||(me.rc||0))B.push('Demasiadas tarjetas');
 return [G.slice(0,4),B.slice(0,3)];}
/** Frase de la prensa según el resultado y lo que pasó. */
function quote(r,us){const o=us==='h'?'a':'h',H=T(r.h).name,A=T(r.a).name,me=us==='h'?r.hg:r.ag,op=us==='h'?r.ag:r.hg,tot=r.hg+r.ag;
 if(me===op)return tot>=4?`${H} y ${A} empataron a ${r.hg} en un partido loco en el que los dos fueron a por todas.`:tot===0?`${H} y ${A} firmaron un empate sin goles en un partido muy cerrado.`:`Reparto de puntos entre ${H} y ${A} (${r.hg}-${r.ag}).`;
 const w=me>op?T(r[us]).name:T(r[o]).name,l=me>op?T(r[o]).name:T(r[us]).name,d=Math.abs(me-op);
 return d>=3?`Exhibición de ${w}, que pasó por encima de ${l}.`:r.st[me>op?us:o].xg<r.st[me>op?o:us].xg-.4?`${w} se llevó los tres puntos con más eficacia que juego ante ${l}.`:`${w} ganó a ${l} y suma tres puntos de oro.`;}
export function postHubHTML(r){if(!r)return '<div class="empty">No hay datos de este partido.</div>';
 const us=r.h===S.user?'h':r.a===S.user?'a':'h',side=us==='h'?0:1,H=T(r.h),A=T(r.a),mv=r.mvp&&PL(r.mvp);
 const tr=s=>{const L=(r.pl||[]).filter(x=>x[1]===s&&x[2]);return L.length?L.reduce((a,x)=>a+x[2],0)/L.length:0;};
 const cc=s=>(r.sh||[]).filter(x=>x[0]===s&&x[2]>=30).length;
 const row=(l,a,b,fmt=v=>v)=>`<div class="phrow"><b class="${a>b?'hi':''}">${fmt(a)}</b><span>${l}</span><b class="${b>a?'hi':''}">${fmt(b)}</b></div>`;
 const [G,B]=goodBad(r,us),mine=(r.pl||[]).filter(x=>x[1]===side&&PL(x[0]));
 const best=(i,lbl)=>{const x=mine.slice().sort((a,b)=>(b[i]||0)-(a[i]||0))[0];return x&&x[i]?`<div class="phpa good"><b>${typeof x[i]==='number'&&x[i]%1?dec(x[i]):x[i]}</b><span>${esc(PL(x[0]).name)}<small>${lbl}</small></span></div>`:'';};
 const worst=(()=>{const x=mine.filter(x=>x[2]).sort((a,b)=>a[2]-b[2])[0];return x?`<div class="phpa bad"><b>${dec(x[2])}</b><span>${esc(PL(x[0]).name)}<small>Nota más baja</small></span></div>`:'';})();
 const gk=mine.find(x=>PL(x[0]).sp==='POR'),opOt=r.st[us==='h'?'a':'h'].ot,conc=us==='h'?r.ag:r.hg;
 const saves=gk?`<div class="phpa ${opOt&&(opOt-conc)/opOt<.6?'bad':'good'}"><b>${Math.max(0,opOt-conc)}/${opOt}</b><span>${esc(PL(gk[0]).name)}<small>Paradas</small></span></div>`:'';
 return `<div class="phub"><div class="phl"><section class="phbox phscore"><div class="eyebrow">${esc(r.label||'')}</div>
 <div class="phsc"><div>${crest(H,'lg')}<b>${esc(H.name)}</b></div><div class="phres">${r.hg} - ${r.ag}${r.pen?`<small>pen. ${r.pen[0]}-${r.pen[1]}</small>`:''}</div><div>${crest(A,'lg')}<b>${esc(A.name)}</b></div></div>
 ${mv?`<div class="phmvp">★ ${esc(mv.name)}</div>`:''}</section>
 <section class="phbox"><h3>Estadísticas</h3>${row('Posesión',r.poss,100-r.poss,v=>v+'%')}${row('Nota del equipo',tr(0),tr(1),dec)}${row('Ocasiones claras',cc(0),cc(1))}${row('Tiros',r.st.h.sh,r.st.a.sh)}${row('A puerta',r.st.h.ot,r.st.a.ot)}${row('Goles esperados',r.st.h.xg,r.st.a.xg,v=>(+v).toFixed(2).replace('.',','))}</section>
 <section class="phbox"><h3>Análisis de jugadores</h3><div class="phpg">${best(4,'Pases clave')}${best(9,'Asistencias')}${saves}${worst}</div></section></div>
 <div class="phr"><section class="phbox"><h3>Lo positivo</h3>${G.length?G.map(t=>`<div class="phgb g"><i>👍</i>${esc(t)}</div>`).join(''):'<p class="small muted">Nada destacable.</p>'}
 <h3>Lo negativo</h3>${B.length?B.map(t=>`<div class="phgb b"><i>👎</i>${esc(t)}</div>`).join(''):'<p class="small muted">Nada que reprochar.</p>'}</section>
 <section class="phbox phq">«${esc(quote(r,us))}»</section>
 ${r.n?`<button class="btn" data-a="trep" data-v="${r.n}">📋 Informe táctico completo</button>`:''}</div></div>`;}
