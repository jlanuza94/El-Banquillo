/* El Banquillo · views/analysis.ts — Análisis: tu temporada en gráficos, informes de partido con mapa de tiros, estadísticas avanzadas y el próximo rival. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {TACS,TAC0,posChip} from '../data';
import {PL,S,T,crest,qBadge,qc,squad,uLg} from '../state';
import {nextMatch} from '../competitions';
import {nRounds} from '../tactics';
import {nameBtn} from './common';
import {GOALT} from '../engine';

const h01=(s)=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%1000)/1000;};
const RES={g:'Gol',s:'Parada',p:'Al palo',m:'Fuera'};
/** Mapa de tiros de un equipo: medio campo con la portería arriba. Cuanto más xG, más cerca y más grande. */
export function shotMap(rec,side,title){
 const W=100,H=72,sh=rec.sh.filter(x=>x[0]===side);
 const dots=sh.map((x,i)=>{const xg=x[2]/100,k=String(rec.h)+rec.a+rec.wk+i+side,d=4+(1-Math.sqrt(Math.min(1,xg/.8)))*46+h01(k+'d')*6,lat=(h01(k+'w')-.5)*(18+d*1.25);
  const cx=50+lat,cy=4+d,r=2+xg*7,res=x[3],p=PL(x[1]);
  const t=`${x[4]}' · ${p?p.name:'—'} · xG ${xg.toFixed(2)} · ${RES[res]}`;
  return res==='g'?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f2c230" stroke="#111" stroke-width=".6"><title>${esc(t)}</title></circle>`
   :res==='s'?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,.85)" stroke="#111" stroke-width=".5"><title>${esc(t)}</title></circle>`
   :res==='p'?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="1.5 1"><title>${esc(t)}</title></circle>`
   :`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.65)" stroke-width=".8"><title>${esc(t)}</title></circle>`;}).join('');
 const st=rec.st[side?'a':'h'];
 return `<figure class="shotmap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de tiros de ${esc(title)}"><rect width="${W}" height="${H}" fill="#2b7a44"/><g fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".6"><rect x="2" y="2" width="96" height="68"/><rect x="22" y="2" width="56" height="18"/><rect x="38" y="2" width="24" height="6"/><path d="M40 20 A 12 12 0 0 0 60 20"/><line x1="44" y1="1" x2="56" y2="1" stroke="#fff" stroke-width="1.6"/></g>${dots}</svg>
 <figcaption><b>${esc(title)}</b> · ${st.sh} tiros · ${st.ot} a puerta · xG ${(+st.xg).toFixed(2)}</figcaption></figure>`;
}
const legend=`<div class="row small muted" style="gap:12px;margin:4px 0 10px"><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#f2c230" stroke="#111"/></svg> Gol</span><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#fff" stroke="#111"/></svg> Parada</span><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="none" stroke="#666" stroke-dasharray="2 1"/></svg> Palo</span><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="none" stroke="#999"/></svg> Fuera</span><span>Más grande = ocasión más clara</span></div>`;

/** Informe completo de un partido (para el modal y el final del partido en directo). */
export function reportBody(rec){
 const H=T(rec.h),A=T(rec.a),s=rec.st,row=(l,a,b)=>`<div class="stat"><span>${a}</span><span class="c">${l}</span><span class="r">${b}</span></div>`;
 const pls=rec.pl.filter(r=>PL(r[0])).sort((a,b)=>b[2]-a[2]);
 const tbl=side=>`<div class="tbl"><table><thead><tr><th>Jugador</th><th class="r">Nota</th><th class="r">G</th><th class="r">A</th><th class="r">xG</th><th class="r" title="Pases clave">PC</th><th class="r" title="Entradas">ENT</th><th class="r" title="Regates">REG</th><th class="r" title="Duelos ganados">DUE</th></tr></thead><tbody>${pls.filter(r=>r[1]===side).map(r=>{const p=PL(r[0]);return `<tr class="${r[0]===rec.mvp?'me':''}"><td>${posChip(p)} ${nameBtn(p)}</td><td class="r">${r[2]?qBadge(r[2]):'—'}</td><td class="n">${r[8]||''}</td><td class="n">${r[9]||''}</td><td class="n">${(r[3]/100).toFixed(2)}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td class="n">${r[6]}</td><td class="n">${r[7]}</td></tr>`;}).join('')}</tbody></table></div>`;
 return `<div class="eyebrow">${esc(rec.label)}</div><div class="versus" style="margin:6px 0 10px"><div class="side">${crest(H,'lg')}<div class="tn">${esc(H.name)}</div></div><div class="vs" style="font-size:34px">${rec.hg} - ${rec.ag}</div><div class="side">${crest(A,'lg')}<div class="tn">${esc(A.name)}</div></div></div>
 ${rec.pen?`<p class="small muted" style="text-align:center;margin:-4px 0 8px">Penaltis ${rec.pen[0]}-${rec.pen[1]}</p>`:''}
 ${row('Posesión',rec.poss+'%',(100-rec.poss)+'%')}${row('Goles esperados (xG)',(+s.h.xg).toFixed(2),(+s.a.xg).toFixed(2))}${row('Tiros',s.h.sh,s.a.sh)}${row('A puerta',s.h.ot,s.a.ot)}${row('Córners',s.h.co,s.a.co)}${row('Faltas',s.h.fo,s.a.fo)}${row('Pases buenos',(s.h.pa?Math.round(s.h.pc/s.h.pa*100):0)+'%',(s.a.pa?Math.round(s.a.pc/s.a.pa*100):0)+'%')}
 <h3 style="margin:14px 0 4px">Mapa de tiros</h3>${legend}<div class="shotmaps">${shotMap(rec,0,H.name)}${shotMap(rec,1,A.name)}</div>
 <h3 style="margin:14px 0 4px">${esc(H.name)}</h3>${tbl(0)}<h3 style="margin:14px 0 4px">${esc(A.name)}</h3>${tbl(1)}`;
}

/* ---------- Gráficos de la temporada ---------- */
function lineChart(vals,{min,max,invert,label,color,fmt}){
 const W=320,H=120,n=vals.length;if(n<2)return '<div class="empty">Hacen falta al menos dos jornadas.</div>';
 const X=i=>18+i*(W-30)/(n-1),Y=v=>{const t=(v-min)/((max-min)||1);return 10+(invert?t:1-t)*(H-28);};
 const pts=vals.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
 const ticks=[min,Math.round((min+max)/2),max].map(v=>`<text x="2" y="${Y(v)+3}" font-size="8" fill="var(--muted)">${fmt?fmt(v):v}</text>`).join('');
 return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(label)}">${ticks}<polyline fill="none" stroke="${color||'var(--accent)'}" stroke-width="2.4" points="${pts}"/>${vals.map((v,i)=>i===n-1?`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="var(--ink)"/><text x="${X(i)-4}" y="${Y(v)<20?Y(v)+14:Y(v)-7}" font-size="9" fill="var(--ink)" text-anchor="end">${fmt?fmt(v):v}</text>`:'').join('')}<text x="${W/2}" y="${H-2}" font-size="8" fill="var(--muted)" text-anchor="middle">Jornadas</text></svg>`;
}
function xgBars(tl){
 const W=320,H=130,n=tl.length;if(!n)return '';const bw=(W-20)/n,mx=Math.max(2,...tl.map(x=>Math.max(x.xf,x.xa)));
 const mid=H/2;return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="xG a favor y en contra por jornada">${tl.map((x,i)=>{const hf=x.xf/mx*(mid-10),ha=x.xa/mx*(mid-10),cx=10+i*bw;return `<rect x="${cx+1}" y="${mid-hf}" width="${Math.max(1,bw-2)}" height="${hf}" fill="var(--win)"><title>J${x.r+1}: xG a favor ${x.xf.toFixed(2)} · goles ${x.gf}</title></rect><rect x="${cx+1}" y="${mid}" width="${Math.max(1,bw-2)}" height="${ha}" fill="var(--loss)"><title>J${x.r+1}: xG en contra ${x.xa.toFixed(2)} · goles ${x.ga}</title></rect>`;}).join('')}<line x1="8" x2="${W-8}" y1="${mid}" y2="${mid}" stroke="var(--line)"/><text x="10" y="10" font-size="8" fill="var(--muted)">xG a favor</text><text x="10" y="${H-3}" font-size="8" fill="var(--muted)">xG en contra</text></svg>`;
}

export function analisisView(){
 const tab=S.anTab||'temp';
 const seg=`<div class="seg" style="margin-bottom:14px;max-width:100%;overflow-x:auto">${[['temp','Temporada'],['part','Partidos'],['jug','Jugadores'],['riv','Próximo rival']].map(([k,l])=>`<button data-a="an-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
 if(tab==='temp'){
  const tl=S.tl||[];
  if(!tl.length)return seg+'<section class="panel"><div class="empty">Los gráficos aparecen tras la primera jornada de liga.</div></section>';
  const f=tl.reduce((a,x)=>a+x.xf,0),a=tl.reduce((a,x)=>a+x.xa,0),gf=tl.reduce((a,x)=>a+x.gf,0),ga=tl.reduce((a,x)=>a+x.ga,0);
  const luck=gf-f,luckA=ga-a;
  const last5=tl.slice(-5),form=last5.map(x=>x.gf>x.ga?'G':x.gf<x.ga?'P':'E');
  return seg+`<div class="grid"><section class="panel"><div class="panel-h"><h2>Puesto</h2><span class="eyebrow">${tl[tl.length-1].pos}º tras ${tl.length} jornadas</span></div>${lineChart(tl.map(x=>x.pos),{min:1,max:20,invert:true,label:'Puesto en la liga',fmt:v=>v+'º'})}
  <h3 style="margin:12px 0 4px">Puntos</h3>${lineChart(tl.map(x=>x.pts),{min:0,max:Math.max(6,tl[tl.length-1].pts),label:'Puntos acumulados',color:'var(--win)'})}</section>
  <div class="stack"><section class="panel"><div class="panel-h"><h2>Goles esperados</h2><span class="eyebrow">Por jornada</span></div>${xgBars(tl)}
  <div class="kv"><span>Goles a favor / xG</span><b>${gf} / ${f.toFixed(1)}</b><span>Goles en contra / xG</span><b>${ga} / ${a.toFixed(1)}</b><span>Forma (últimos 5)</span><b>${form.join(' ')}</b></div>
${(()=>{const fx=(S.fixtures[uLg()]||[]).flat().filter(f=>f.played&&(f.h===S.user||f.a===S.user)),c={};let n=0;
   fx.forEach(f=>{const me=f.h===S.user?'h':'a';(f.ev||[]).filter(e=>e.t==='goal'&&e.gt).forEach(e=>{const k=e.gt;c[k]=c[k]||[0,0];c[k][e.s===me?0:1]++;n++;});});
   if(!n)return '';return `<h3 style="margin:12px 0 4px">Cómo marcas y cómo encajas</h3><div class="kv">${Object.keys(c).sort((x,y)=>c[y][0]+c[y][1]-c[x][0]-c[x][1]).map(k=>`<span>${GOALT[k]?GOALT[k].n:k}</span><b>${c[k][0]} a favor · ${c[k][1]} en contra</b>`).join('')}</div>`;})()}
  <p class="small muted" style="margin:8px 0 0">${luck>3?'Marcas más de lo que generas: tu delantera está acertada, pero puede que no dure.':luck<-3?'Generas más de lo que marcas: con algo de puntería llegarán los goles.':'Marcas más o menos lo que generas.'} ${luckA<-3?'Encajas menos de lo esperado: tu portero está salvando puntos.':luckA>3?'Encajas más de lo esperado: algo de mala suerte o un portero flojo.':''}</p></section></div></div>`;
 }
 if(tab==='part'){
  const L=(S.mlog||[]).filter(x=>x.sn===S.seasonN);
  return seg+`<section class="panel"><div class="panel-h"><h2>Tus partidos</h2><span class="eyebrow">${L.length} esta temporada</span></div>
  ${L.length?L.map((r,i)=>{const me=T(S.user),home=r.h===S.user,my=home?r.hg:r.ag,op=home?r.ag:r.hg,res=my>op?'G':my<op?'P':'E';return `<button class="mrow" data-a="an-match" data-i="${(S.mlog||[]).indexOf(r)}" style="grid-template-columns:28px minmax(0,1fr) auto"><span class="formdots"><span class="${res}">${res}</span></span><span class="msubj">${esc(T(r.h).short)} ${r.hg}-${r.ag} ${esc(T(r.a).short)} <span class="small muted">· ${esc(r.label)}</span></span><span class="mcat">xG ${(+r.st[home?'h':'a'].xg).toFixed(1)}–${(+r.st[home?'a':'h'].xg).toFixed(1)}</span></button>`;}).join(''):'<div class="empty">Aún no has jugado partidos oficiales esta temporada.</div>'}
  <p class="small muted" style="margin:8px 0 0">Toca un partido para ver su informe con el mapa de tiros y las estadísticas de cada jugador.</p></section>`;
 }
 if(tab==='jug'){
  const p90=S.anP90,sq=squad(S.user).filter(p=>p.st&&p.st.pj).sort((a,b)=>b.st.mi-a.st.mi),f=(p,v)=>p90?(p.st.mi?v*90/p.st.mi:0).toFixed(2):v;
  return seg+`<section class="panel"><div class="panel-h"><h2>Estadísticas avanzadas</h2><div class="seg"><button data-a="an-p90" data-v="0" aria-pressed="${!p90}">Totales</button><button data-a="an-p90" data-v="1" aria-pressed="${!!p90}">Por 90 minutos</button></div></div>
  ${sq.length?`<div class="tbl"><table><thead><tr><th>Pos</th><th>Jugador</th><th class="r">PJ</th><th class="r">Min</th><th class="r">G</th><th class="r">xG</th><th class="r">A</th><th class="r" title="Pases clave">PC</th><th class="r" title="Entradas">ENT</th><th class="r" title="Regates">REG</th><th class="r" title="Duelos ganados">DUE</th><th class="r">Nota</th></tr></thead><tbody>${sq.map(p=>{const s=p.st;return `<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td class="n">${s.pj}</td><td class="n">${s.mi}</td><td class="n">${f(p,s.g)}</td><td class="n">${p90?f(p,(s.xg||0)/100):((s.xg||0)/100).toFixed(1)}</td><td class="n">${f(p,s.a)}</td><td class="n">${f(p,s.kp||0)}</td><td class="n">${f(p,s.tk||0)}</td><td class="n">${f(p,s.dr||0)}</td><td class="n">${f(p,s.du||0)}</td><td class="r">${qBadge(s.rs/s.pj)}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay datos esta temporada.</div>'}
  <p class="small muted" style="margin:8px 0 0">xG: goles esperados de sus tiros. Si marca mucho más que su xG, está muy acertado (o tiene suerte); si marca menos, le falta puntería.</p></section>`;
 }
 // próximo rival
 const nm=nextMatch();if(!nm)return seg+'<section class="panel"><div class="empty">No hay próximo partido.</div></section>';
 const oid=nm.fx.h===S.user?nm.fx.a:nm.fx.h,o=T(oid),F=(S.tform&&S.tform[oid])||[],tac=Object.assign({},TAC0,o.tac||{});
 const av=k=>F.length?F.reduce((a,x)=>a+x[k],0)/F.length:0;
 const top=squad(oid).filter(p=>p.st&&p.st.pj).sort((a,b)=>(b.st.g+b.st.a*.7)-(a.st.g+a.st.a*.7)).slice(0,4);
 const tips=[];if(F.length){if(av(4)/10>1.6)tips.push('Conceden muchas ocasiones: ataca con decisión.');if(av(3)/10<1)tips.push('Les cuesta generar peligro: un bloque ordenado debería bastar.');if(av(5)>56)tips.push('Les gusta tener el balón: presionar su salida puede hacerles daño.');if(av(5)<44)tips.push('Juegan sin balón y a la contra: cuidado con adelantar la línea.');
  const hw=F.filter(x=>x[6]),aw=F.filter(x=>!x[6]);if(hw.length&&aw.length){const hp=hw.reduce((a,x)=>a+(x[1]>x[2]?3:x[1]===x[2]?1:0),0)/hw.length,ap=aw.reduce((a,x)=>a+(x[1]>x[2]?3:x[1]===x[2]?1:0),0)/aw.length;if(hp-ap>1)tips.push('Son mucho más fuertes en casa que fuera.');}}
 return seg+`<div class="grid"><section class="panel"><div class="panel-h"><h2>${esc(o.name)}</h2><span class="eyebrow">${esc(nm.label)}</span></div>
 <div class="kv" style="margin-top:0"><span>Formación</span><b>${o.formation}</b><span>Estilo</span><b>${TACS.est.o[tac.est]} · presión ${TACS.pre.o[tac.pre].toLowerCase()}</b>${F.length?`<span>Goles (últimos ${F.length})</span><b>${F.reduce((a,x)=>a+x[1],0)} a favor · ${F.reduce((a,x)=>a+x[2],0)} en contra</b><span>xG medio</span><b>${(av(3)/10).toFixed(2)} a favor · ${(av(4)/10).toFixed(2)} en contra</b><span>Posesión media</span><b>${Math.round(av(5))}%</b>`:''}</div>
 ${F.length?`<h3 style="margin:12px 0 4px">Últimos partidos</h3>${F.map(x=>{const r=x[1]>x[2]?'G':x[1]<x[2]?'P':'E';return `<div class="offer"><span class="formdots"><span class="${r}">${r}</span></span><span class="t">${x[6]?'vs':'en'} ${esc(T(x[0]).name)} <b>${x[1]}-${x[2]}</b><br><span class="small muted">xG ${(x[3]/10).toFixed(1)}–${(x[4]/10).toFixed(1)} · posesión ${x[5]}%</span></span></div>`;}).join('')}`:'<p class="small muted">Aún no ha jugado partidos oficiales esta temporada.</p>'}</section>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Jugadores peligrosos</h2></div>${top.length?top.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)}<br><span class="small muted">${p.st.g} goles · ${p.st.a} asist. · xG ${((p.st.xg||0)/100).toFixed(1)}</span></span>${qBadge(p.st.rs/p.st.pj)}</div>`).join(''):'<div class="empty">Sin datos todavía.</div>'}</section>
 <section class="panel"><div class="panel-h"><h2>Claves</h2></div><ul class="news">${(tips.length?tips:['Sin datos suficientes para sacar conclusiones.']).map(t=>`<li><span class="wk"></span><span class="t">${esc(t)}</span></li>`).join('')}</ul></section></div></div>`;
}
