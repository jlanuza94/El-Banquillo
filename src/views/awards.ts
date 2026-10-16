/* El Banquillo · views/awards.ts — Estadísticas, once ideal, premios y comparador de jugadores. */
// @ts-nocheck — usa el estado heredado S.
import {wcs} from '../state';
import {flag} from '../flags';
import {esc,money} from '../core';
import {ATTRS,AT_NAME,COUNTRIES,GRP,LV_NAMES,SPN,newSt,posChip} from '../data';
import {slotRate} from '../tactics';
import {LG,PL,S,T,crest,lgName,qBadge,qc,uLg} from '../state';
import {bestXI,minPJ,playersOf,ranking} from '../awards';
import {seen} from '../scouting';
import {atCellS,nameBtn,pBadgeS,potTxt,vtab} from './common';

const avgR=p=>p.st&&p.st.pj?p.st.rs/p.st.pj:0;
const who=c=>c?`${PL(c.pid)?nameBtn(PL(c.pid)):esc(c.name)} <span class="small muted">· ${esc(c.club)}</span>`:'—';
function lgPicker(lg){const L=LG(lg);return `<div class="row" style="margin-bottom:12px;align-items:flex-end"><label class="f"><span class="eyebrow">País</span><select id="awC">${wcs().map(i=>COUNTRIES[i]).map((c,i)=>`<option value="${i}" ${i===L.c?'selected':''}>${c.n}</option>`).join('')}</select></label>${flag(COUNTRIES[L.c].code)}
 <div class="seg" style="max-width:100%;overflow-x:auto">${Array.from({length:COUNTRIES[L.c].lv},(_,i)=>`<button data-a="aw-lv" data-v="${i}" aria-pressed="${L.lv===i}">${LV_NAMES[i]}</button>`).join('')}</div></div>`;}

export function premiosView(){
 const tab=S.awTab||'race',lg=S.awLg!=null?S.awLg:uLg();
 const seg=`<div class="seg" style="margin-bottom:14px;max-width:100%;overflow-x:auto">${[['race','Balón de Oro'],['stats','Estadísticas'],['xi','Once ideal'],['hist','Palmarés']].map(([k,l])=>`<button data-a="aw-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
 if(tab==='race'){
  const all=Object.values(S.players),world=ranking(all,true,10),young=ranking(all.filter(p=>p.age<=21),true,5),mine=ranking(playersOf(uLg()),false,5);
  const row=([p],i)=>`<div class="offer"><b class="num" style="width:22px">${i+1}</b>${posChip(p)}<span class="t">${nameBtn(p)} <span class="small muted">· ${esc(T(p.team).name)} · ${lgName(T(p.team).lg,true)}</span><br><span class="small muted">${p.st.pj} PJ · ${p.st.g} goles · ${p.st.a} asist. · ${p.st.mv} MVP</span></span>${qBadge(avgR(p))}</div>`;
  return seg+`<div class="grid"><section class="panel"><div class="panel-h"><h2>Carrera por el Balón de Oro</h2><span class="eyebrow">${S.week?'Tras '+S.week+' jornadas':'Empieza la temporada'}</span></div>${world.length?world.map(row).join(''):'<div class="empty">Aún no se ha jugado lo suficiente.</div>'}
  <p class="small muted" style="margin:8px 0 0">Cuenta la nota media, los goles, las asistencias, los MVP, la posición del equipo y el nivel de la liga. Hace falta jugar al menos ${minPJ()} partidos.</p></section>
  <div class="stack"><section class="panel"><div class="panel-h"><h2>Mejor de tu liga</h2><span class="eyebrow">${esc(lgName(uLg()))}</span></div>${mine.length?mine.map(row).join(''):'<div class="empty">Aún no hay datos.</div>'}</section>
  <section class="panel"><div class="panel-h"><h2>Mejor joven</h2><span class="eyebrow">21 años o menos</span></div>${young.length?young.map(row).join(''):'<div class="empty">Aún no hay datos.</div>'}</section></div></div>`;
 }
 if(tab==='stats'){
  const k=S.awStat||'g',m=minPJ(),pl=playersOf(lg).filter(p=>p.st&&p.st.pj);
  const defs={g:['Goles',p=>p.st.g],a:['Asistencias',p=>p.st.a],ga:['Goles + asist.',p=>p.st.g+p.st.a],r:['Nota media',p=>p.st.pj>=m?avgR(p):0],mv:['MVP',p=>p.st.mv],cs:['Porterías a cero',p=>GRP[p.sp]==='POR'?p.st.cs:0],gm:['Goles por partido',p=>p.st.pj>=m?p.st.g/p.st.pj:0],yc:['Tarjetas',p=>p.st.yc+p.st.rc*2]};
  const f=defs[k][1],list=pl.filter(p=>f(p)>0).sort((a,b)=>f(b)-f(a)).slice(0,20);
  const fmt=v=>k==='r'?v.toFixed(2):k==='gm'?v.toFixed(2):v;
  return seg+lgPicker(lg)+`<section class="panel"><div class="panel-h"><h2>${esc(lgName(lg))}</h2><div class="chips">${Object.entries(defs).map(([x,[l]])=>`<button class="btn sm ${k===x?'dark':''}" data-a="aw-stat" data-v="${x}">${l}</button>`).join('')}</div></div>
  ${list.length?`<div class="tbl"><table><thead><tr><th>#</th><th>Pos</th><th>Jugador</th><th>Club</th><th class="r">PJ</th><th class="r">G</th><th class="r">A</th><th class="r">Nota</th><th class="r">${defs[k][0]}</th></tr></thead><tbody>${list.map((p,i)=>`<tr class="${p.team===S.user?'me':''}"><td class="n">${i+1}</td><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td><span class="teamcell">${crest(T(p.team),'sm')}${esc(T(p.team).short)}</span></td><td class="n">${p.st.pj}</td><td class="n">${p.st.g}</td><td class="n">${p.st.a}</td><td class="r">${qBadge(avgR(p))}</td><td class="n"><b>${fmt(f(p))}</b></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay datos esta temporada.</div>'}
  ${k==='r'||k==='gm'?`<p class="small muted" style="margin:8px 0 0">Mínimo ${m} partidos.</p>`:''}</section>`;
 }
 if(tab==='xi'){
  const xi=bestXI(lg),lines=[['Portero',['POR']],['Defensa',['LD','DFC','LI']],['Medio',['MC','MCD','MCO']],['Ataque',['ED','DC','EI']]];
  return seg+lgPicker(lg)+`<section class="panel"><div class="panel-h"><h2>Once ideal · ${esc(lgName(lg))}</h2><span class="eyebrow">4-3-3 · por nota media</span></div>
  ${lines.map(([n,sl])=>`<h3 style="margin:12px 0 4px">${n}</h3>${xi.filter(([s])=>sl.includes(s)).map(([s,p])=>`<div class="offer"><span class="pos ${GRP[s]}">${s}</span><span class="t">${p?`${nameBtn(p)} <span class="small muted">· ${esc(T(p.team).name)} · ${p.st.pj} PJ · ${p.st.g} G · ${p.st.a} A</span>`:'<span class="muted">Nadie con partidos suficientes</span>'}</span>${p?qBadge(avgR(p)):''}</div>`).join('')}`).join('')}
  <p class="small muted" style="margin:8px 0 0">Mínimo ${minPJ()} partidos. Al final de cada temporada se guarda el once ideal de tu liga en el palmarés.</p></section>`;
 }
 const A=(S.awards||[]).slice().reverse();
 return seg+`<section class="panel"><div class="panel-h"><h2>Palmarés de premios</h2><span class="eyebrow">${A.length} temporada${A.length===1?'':'s'}</span></div>
 ${A.length?A.map(a=>`<h3 style="margin:14px 0 4px">${a.season}</h3><div class="kv" style="margin-top:0"><span>Balón de Oro</span><b>${who(a.ballon[0])}</b><span>Bota de Oro</span><b>${who(a.boot)}${a.boot?' · '+a.boot.g+' goles':''}</b><span>Mejor joven</span><b>${who(a.young)}</b><span>Mejor portero</span><b>${who(a.gk)}</b>${a.leagues[a.xiLg]?`<span>Mejor de ${esc(lgName(a.xiLg))}</span><b>${who(a.leagues[a.xiLg])}</b>`:''}${a.lga?`<span>Mejor joven de ${esc(lgName(a.xiLg))}</span><b>${who(a.lga.young)}</b><span>Pichichi de ${esc(lgName(a.xiLg))}</span><b>${who(a.lga.boot)}${a.lga.boot?' · '+a.lga.boot.g+' goles':''}</b><span>Mejor portero de ${esc(lgName(a.xiLg))}</span><b>${who(a.lga.gk)}</b>`:''}</div>
  <details style="margin-top:6px"><summary class="small">Mejores de cada Primera y once ideal</summary><div class="kv">${Object.entries(a.leagues).filter(([l])=>+l!==a.xiLg).map(([l,c])=>`<span>${esc(lgName(+l))}</span><b>${who(c)}</b>`).join('')}</div>
  <p class="small" style="margin:8px 0 0"><b>Once ideal de ${esc(lgName(a.xiLg))}:</b> ${a.xi.filter(([,c])=>c).map(([s,c])=>`${s} ${esc(c.name)}${c.c===S.user?' ★':''}`).join(' · ')}</p></details>`).join(''):'<div class="empty">Los premios se entregan al terminar cada temporada.</div>'}</section>`;
}

/** Comparador de dos jugadores (respeta lo que sabes de cada uno). */
export function compareHTML(a,b){
 const sa=seen(a),sb=seen(b),sta=a.st||newSt(),stb=b.st||newSt();
 const bar=(r,right,win)=>{const v=(r[0]+r[1])/2;return `<span class="abar${win?' win':''}" style="direction:${right?'rtl':'ltr'}"><i class="${qc(v)}" style="width:${v*10}%"></i></span>`;};
 const keys=ATTRS.filter(k=>k!=='por'||a.pos==='POR'||b.pos==='POR');
 const head=p=>`<div style="text-align:center;min-width:0"><div class="small muted">${p.team===null?'Libre':esc(T(p.team).short)}</div><b>${esc(p.name)}</b><div class="row" style="justify-content:center;margin-top:4px">${posChip(p)}${pBadgeS(p)}</div><div class="small muted">${p.age} años · ${money(p.value)}</div></div>`;
 const rowS=(l,x,y,hi)=>{const nx=parseFloat(String(x).replace(/[^\d.-]/g,'')),ny=parseFloat(String(y).replace(/[^\d.-]/g,''));const wa=hi!=null&&!isNaN(nx)&&!isNaN(ny)&&nx!==ny&&((nx>ny)===hi),wb=hi!=null&&!isNaN(nx)&&!isNaN(ny)&&nx!==ny&&!wa;return `<div class="cmp2"><span class="num${wa?' cw':''}">${x}</span><span class="small muted">${l}</span><span class="num${wb?' cw':''}">${y}</span></div>`;};
 const av=(sn,k)=>(sn.at[k][0]+sn.at[k][1])/2;let wA=0,wB=0;keys.forEach(k=>{const x=av(sa,k),y=av(sb,k);if(x>y)wA++;else if(y>x)wB++;});
 const tb=vtab('cm',[['at','Atributos'],['st','Estadísticas'],['po','Posiciones'],['co','Contrato']],'at'),ks=['at','st','po','co'];
 let body='';
 if(tb.cur==='at')body=`<p class="small muted" style="margin:0 0 6px;text-align:center">Mejor en ${wA} atributo${wA===1?'':'s'} · ${wB} para ${esc(b.name.split(' ').slice(-1)[0])}</p>${keys.map(k=>{const x=av(sa,k),y=av(sb,k);return `<div class="cmp2"><span class="row" style="gap:6px;justify-content:flex-end">${bar(sa.at[k],true,x>y)}${atCellS(a,k,sa)}</span><span class="small muted">${AT_NAME[k]}</span><span class="row" style="gap:6px">${atCellS(b,k,sb)}${bar(sb.at[k],false,y>x)}</span></div>`;}).join('')}`;
 else if(tb.cur==='st'){const n=s=>s.pj?(s.rs/s.pj).toFixed(2):'—',g90=s=>s.mi?(s.g/s.mi*90).toFixed(2):'—';body=`${rowS('Partidos',sta.pj,stb.pj,true)}${rowS('Minutos',sta.mi||0,stb.mi||0,true)}${rowS('Goles',sta.g,stb.g,true)}${rowS('Asistencias',sta.a,stb.a,true)}${rowS('Goles/90',g90(sta),g90(stb),true)}${rowS('Nota media',n(sta),n(stb),true)}${rowS('MVP',sta.mv||0,stb.mv||0,true)}${rowS('Tarjetas',sta.yc||0,stb.yc||0,false)}<h3 style="margin:10px 0 4px">Carrera</h3>${rowS('Partidos',a.car?a.car[0]:0,b.car?b.car[0]:0,true)}${rowS('Goles',a.car?a.car[1]:0,b.car?b.car[1]:0,true)}${rowS('Internacional',a.caps||0,b.caps||0,true)}`;}
 else if(tb.cur==='po'){const SP=['POR','LI','DFC','LD','MCD','MI','MC','MD','MCO','EI','DC','ED'];body=SP.map(sp=>rowS(SPN[sp],Math.round(slotRate(a,sp)),Math.round(slotRate(b,sp)),true)).join('');}
 else body=`${rowS('Valor',money(a.value),money(b.value),null)}${rowS('Sueldo/sem',money(a.wage),money(b.wage),null)}${rowS('Contrato',a.contract+' año'+(a.contract===1?'':'s'),b.contract+' año'+(b.contract===1?'':'s'),true)}${rowS('Edad',a.age,b.age,false)}${rowS('Potencial',a.age<=23?potTxt(a):'—',b.age<=23?potTxt(b):'—',null)}`;
 const ix=ks.indexOf(tb.cur);
 return `<div class="eyebrow">Comparar jugadores</div><div class="cmpgrid">${head(a)}<span class="vs">VS</span>${head(b)}</div>
 <div class="fitabs" style="margin-top:8px">${tb.bar}</div><div class="fisw" data-swipe="cm" data-tabs="${ks.join(',')}"><div class="fibody" style="margin-top:8px">${body}</div></div><div class="fidots">${ks.map((k,i)=>`<i class="${i===ix?'on':''}"></i>`).join('')}</div>
 <div class="acts"><button class="btn" data-a="ficha" data-id="${a.id}">Ficha de ${esc(a.name.split(' ')[0])}</button><button class="btn" data-a="ficha" data-id="${b.id}">Ficha de ${esc(b.name.split(' ')[0])}</button><button class="btn primary" data-a="modal-close">Cerrar</button></div>`;
}
