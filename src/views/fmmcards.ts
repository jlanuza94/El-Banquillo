/* El Banquillo · views/fmmcards.ts — Tarjetas al estilo FM Mobile: la del jugador al lado de un mensaje de la bandeja
 * y la tarjeta grande de un fichaje («X ficha a Y»). */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {SPN} from '../data';
import {PL,S,T,crest,crestStyle,lgName,seasonLabel} from '../state';
import {faceSVG} from './pcard';
import {contractLabel} from '../contracts';
import {keyAttrs,nf} from './common';
import {AT_NAME,GRP} from '../data';
import {grade,seen} from '../scouting';
import {squad} from '../state';

/** Tarjeta del jugador para el lateral de un mensaje: cara, dorsal, puesto, edad, valor, sueldo y contrato. */
export function sideCard(p){if(!p)return '';const t=p.team!=null?T(p.team):null,s=p.st||{};
 return `<aside class="sidec"><div class="sch" style="${t?crestStyle(t):''}"><span class="scn">${p.num||''}</span>${t?`<span class="scr crest">${esc(t.short)}</span>`:''}<span class="scf">${nf(p.nat)}</span>${faceSVG(p)}</div>
 <div class="scname">${esc(p.name.split(' ').slice(-1)[0].toUpperCase())}</div><div class="scpos">${esc(SPN[p.sp]||p.sp)}</div>
 <div class="sckv"><span>Edad</span><b>${p.age}</b><span>Media</span><b>${Math.round(p.ovr)}</b><span>Valor</span><b>${money(p.value)}</b><span>Sueldo</span><b>${money(p.wage)}</b><span>Contrato</span><b>${esc(contractLabel(p).replace('Hasta junio de ','Jun '))}</b>${s.pj?`<span>Temporada</span><b>${s.pj} PJ · ${s.g||0} G · ${s.a||0} A</b>`:''}</div>
 <button class="btn sm" data-a="ficha" data-id="${p.id}" style="width:100%;margin-top:6px">Ver ficha</button></aside>`;}
/** Tarjeta grande de un fichaje, como la del FMM: cabecera amarilla, cromo con el precio y edad, partidos y goles en grande. */
export function transferCard(tr){const p=PL(tr.pid);if(!p)return '';const to=T(tr.to),from=tr.from!=null?T(tr.from):null,car=p.car||[0,0,0];
 return `<div class="trcard"><div class="trh">${esc((to?to.name:'').toUpperCase())} FICHA A ${esc(p.name.split(' ').slice(-1)[0].toUpperCase())}</div>
 <p class="trtx">${esc(to?to.name:'')} ${from?`ficha a ${esc(p.name)}, del ${esc(from.name)},`:`ficha al agente libre ${esc(p.name)}`} por ${tr.fee?money(tr.fee):'nada (libre)'}.</p>
 <div class="trb"><div class="trc"><div class="trface" style="${to?crestStyle(to):''}">${faceSVG(p)}<span class="trfl">${nf(p.nat)}</span></div><div class="trn">${esc(p.name.split(' ').slice(-1)[0].toUpperCase())}</div><div class="trf">${tr.fee?money(tr.fee):'LIBRE'}</div></div>
 <div class="trs"><div><small>EDAD</small><b>${p.age}</b></div><div><small>PARTIDOS</small><b>${car[0]||0}</b></div><div><small>GOLES</small><b>${car[1]||0}</b></div></div></div>
 <div class="trfoot">${from?`<span class="crest" style="${crestStyle(from)}">${esc(from.short)}</span> → `:''}${to?`<span class="crest" style="${crestStyle(to)}">${esc(to.short)}</span> <span class="small">${esc(lgName(to.lg))}</span>`:''}</div></div>`;}
/** Jugador del que habla un mensaje: el del fichaje o el primero de sus botones. */
export function mailPlayer(m){if(m.tr&&PL(m.tr.pid))return PL(m.tr.pid);const a=(m.act||[]).find(x=>x.id!=null&&PL(x.id));return a?PL(a.id):null;}

/** Historial del jugador como en el FMM: temporada, club con su escudo, traspaso, partidos, goles, asistencias, tarjetas y nota; con la temporada en curso arriba y el total abajo. */
export function historyTable(p){
 const byShort=sh=>S.teams.find(t=>t.short===sh),lbl=seasonLabel(),s=p.st||{};
 const tfNow=(S.tlog||[]).find(x=>x.pid===p.id&&x.season===lbl&&x.to===p.team);
 const rows=[];if(p.team!=null&&(s.pj||tfNow))rows.push({sn:lbl,t:T(p.team),fee:tfNow?(tfNow.fee||-1):0,pj:s.pj||0,g:s.g||0,a:s.a||0,yc:s.yc||0,rc:s.rc||0,r:s.pj?s.rs/s.pj:null,cur:1});
 (p.hist||[]).slice().reverse().forEach(h=>rows.push({sn:h[0],t:byShort(h[1]),sh:h[1],fee:h[8]||0,pj:h[2],g:h[3],a:h[4],yc:h[6],rc:h[7],r:h[5]}));
 if(!rows.length)return '';const tot=k=>rows.reduce((a,r)=>a+(r[k]||0),0),fees=rows.reduce((a,r)=>a+(r.fee>0?r.fee:0),0),d=v=>v==null?'-':v;
 return `<div class="tbl fhist" style="margin-top:6px"><table><thead><tr><th>Temporada</th><th>Equipo</th><th class="r">Traspaso</th><th class="r">PJ</th><th class="r">G</th><th class="r">A</th><th class="r">Am.</th><th class="r">Ro.</th><th class="r">Nota</th></tr></thead><tbody>
 ${rows.map(r=>`<tr class="${r.cur?'cur':''}"><td class="num">${esc(r.sn)}</td><td><span class="teamcell">${r.t?crest(r.t,'sm'):''}<b class="hcl">${esc(r.t?r.t.name:r.sh||'')}</b></span></td><td class="r">${r.fee>0?money(r.fee):r.fee<0?'Libre':''}</td><td class="n">${r.pj}</td><td class="n">${r.g}</td><td class="n">${r.a}</td><td class="n">${d(r.yc)}</td><td class="n">${d(r.rc)}</td><td class="n">${r.r!=null?(+r.r).toFixed(2):'-'}</td></tr>`).join('')}
 <tr class="tot"><td>-</td><td><b>TOTAL</b></td><td class="r">${fees?money(fees):''}</td><td class="n">${tot('pj')}</td><td class="n">${tot('g')}</td><td class="n">${tot('a')}</td><td class="n">${tot('yc')}</td><td class="n">${tot('rc')}</td><td class="n">-</td></tr></tbody></table></div>`;}

const CUP=`<svg class="cupsvg" viewBox="0 0 100 120" aria-hidden="true"><defs><linearGradient id="cupg" x1="0" x2="1"><stop offset="0" stop-color="#9aa0a6"/><stop offset=".45" stop-color="#f4f6f8"/><stop offset="1" stop-color="#8a9096"/></linearGradient></defs><path d="M22 10h56v22c0 22-12 36-28 38-16-2-28-16-28-38z" fill="url(#cupg)"/><path d="M22 18H8c0 16 8 24 18 26M78 18h14c0 16-8 24-18 26" fill="none" stroke="#b9bec4" stroke-width="5"/><rect x="44" y="70" width="12" height="20" fill="url(#cupg)"/><path d="M30 90h40l6 14H24z" fill="#3b7a46"/><rect x="24" y="104" width="52" height="8" rx="2" fill="#2a5a34"/></svg>`;
/** Tabla de campeones al acabar la liga, con el trofeo (como el «Winners» del FMM). */
export function winnersHTML(tb,lgLabel){return `<section class="panel wboard"><div class="wbh">CAMPEONES · ${esc(lgLabel)}</div><div class="wbb"><div class="wbl">${tb.slice(0,6).map((r,i)=>`<div class="wbr ${i===0?'first':''} ${r.id===S.user?'me':''}"><span>${i+1}º</span>${crest(T(r.id),'sm')}<b>${esc(T(r.id).name)}</b><em>${r.pts}</em></div>`).join('')}</div>${CUP}</div></section>`;}
/** Diploma de entrenador del año (si ganas la liga). */
export function certHTML(lgLabel,season,name,club){return `<section class="cert"><div class="certin"><div class="certlg">${esc(lgLabel.toUpperCase())}</div><div class="certt">ENTRENADOR DEL AÑO</div><div class="certn">${esc((name||'Tú').toUpperCase())}</div><div class="certf"><span>${esc(season)}</span><i class="seal"></i><span class="sig">${esc(club)}</span></div></div></section>`;}

/** Informe de ojeo como en el FMM: nota grande, puntos fuertes y débiles, y comparación con tu mejor jugador en su puesto. */
export function scoutCard(sr){const p=PL(sr.pid);if(!p)return '';const sn=seen(p),gr=grade(p),ks=keyAttrs(p),v=k=>sn.exact?p.at[k]:(sn.at[k][0]+sn.at[k][1])/2;
 const all=Object.keys(AT_NAME).filter(k=>p.at[k]!=null&&(k!=='por'||p.sp==='POR')).map(k=>[k,v(k)]).sort((a,b)=>b[1]-a[1]),pros=all.slice(0,3),cons=ks.map(k=>[k,v(k)]).sort((a,b)=>a[1]-b[1]).slice(0,2);
 const g=GRP[p.sp]||p.pos,mine=squad(S.user).filter(x=>!x.loan&&(GRP[x.sp]||x.pos)===g).sort((a,b)=>b.ovr-a.ovr)[0],ovr=sn.exact?Math.round(p.ovr):`${Math.round(sn.ovr[0]*10)}–${Math.round(sn.ovr[1]*10)}`;
 const cmp=mine?ks.map(k=>{const a=v(k),b=mine.at[k];return `<div class="scmp"><span>${esc(AT_NAME[k])}</span><b class="${a>b+.4?'up':a<b-.4?'dn':''}">${Math.round(a*10)}</b><i>vs</i><b>${Math.round(b*10)}</b></div>`;}).join(''):'';
 return `<div class="scard"><div class="scg g${gr.g}">${gr.g}</div><div class="scb"><div class="sct"><b>${esc(p.name)}</b> · ${esc(SPN[p.sp]||p.sp)} · ${p.age} años${p.team!=null&&T(p.team)?' · '+esc(T(p.team).name):' · libre'}</div><p class="small" style="margin:2px 0 6px">${esc(gr.txt)}</p>
 <div class="scpc"><div><div class="eyebrow">Puntos fuertes</div>${pros.map(([k,x])=>`<div class="scp up">▲ ${esc(AT_NAME[k])} <b>${Math.round(x*10)}</b></div>`).join('')}</div><div><div class="eyebrow">Puntos débiles</div>${cons.map(([k,x])=>`<div class="scp dn">▼ ${esc(AT_NAME[k])} <b>${Math.round(x*10)}</b></div>`).join('')}</div></div>
 <div class="kv" style="margin-top:6px"><span>Media</span><b>${ovr}</b>${p.age<=23?`<span>Potencial</span><b>${sn.pot.map(x=>Math.round(x*10)).join('–')}</b>`:''}<span>Precio</span><b>${p.team==null?'Libre':money(p.value*1.2)}</b><span>Ojeador</span><b>${esc(sr.by||'')}</b></div>
 ${mine?`<div class="eyebrow" style="margin-top:8px">Frente a ${esc(mine.name)} (tu mejor ${esc(g==='POR'?'portero':g==='DEF'?'defensa':g==='MED'?'medio':'delantero')})</div><div class="scmpw">${cmp}</div>`:''}</div></div>`;}
