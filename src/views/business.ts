/* El Banquillo · views/business.ts — Club › Negocios (tienda, camiseta, negocios, nombre del estadio) y la gráfica del dinero. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {posChip} from '../data';
import {S,squad} from '../state';
import {BIZ,BIZ_MAX,KIT_P,bizCost,bizLv,bizMult,bizUpkeep,kitActive,kitCost,kitMult,kitPrice,topShirts} from '../business';
import {nameBtn} from './common';
import {KIT_PATS,kitLocked,kitSVG,myKit,myKit2} from '../kit';
import {seasonLabel} from '../state';
import {nRounds} from '../tactics';

/** Cómo ha ido el presupuesto esta temporada y hacia dónde va. */
export function finChart(){
 const F=S.fin||[];if(F.length<2)return '';const net=f=>f.tv+f.tix+(f.spo||0)+(f.shop||0)+(f.biz||0)-f.wages;
 let b=S.budget-F.reduce((a,f)=>a+net(f),0);const pts=[b,...F.map(f=>(b+=net(f)))],avg=F.reduce((a,f)=>a+net(f),0)/F.length,left=Math.max(0,nRounds()-S.week),proj=S.budget+avg*left;
 const all=pts.concat([proj]),mn=Math.min(...all),mx=Math.max(...all),W=320,H=90,X=i=>8+i*(W-16)/(pts.length+left-1||1),Y=v=>H-10-(v-mn)/((mx-mn)||1)*(H-24);
 return `<section class="panel"><div class="panel-h"><h2>El dinero esta temporada</h2><span class="eyebrow">Proyección a final: <b style="color:var(${proj>=S.budget?'--win':'--loss'})">${money(proj)}</b></span></div>
 <svg viewBox="0 0 ${W} ${H}" class="fchart" role="img" aria-label="Evolución del presupuesto"><polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${pts.map((v,i)=>X(i)+','+Y(v)).join(' ')}"/>${left?`<line x1="${X(pts.length-1)}" y1="${Y(S.budget)}" x2="${X(pts.length-1+left)}" y2="${Y(proj)}" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 4"/>`:''}<circle cx="${X(pts.length-1)}" cy="${Y(S.budget)}" r="4" fill="var(--accent)"/></svg>
 <p class="small muted" style="margin:4px 0 0">Ahora tienes ${money(S.budget)}. Ganas de media ${avg>=0?'+':''}${money(avg)} por jornada; la línea discontinua es lo que tendrás si sigue igual.</p></section>`;
}
const FC=[['tv','Televisión','#4a7fd4'],['tix','Taquilla','#2f9e48'],['spo','Patrocinio','#e0b22e'],['shop','Tienda','#c46bd6'],['biz','Negocios','#29b3b0']];
/** Finanzas como en el FMM: barras por jornada (ingresos arriba, gastos abajo), el presupuesto en línea, el reparto de la temporada y la historia de temporadas anteriores. */
export function finBig(){
 const F=S.fin||[],H=S.finH||[];if(!F.length&&!H.length)return '';
 const inc=f=>FC.reduce((a,[k])=>a+(f[k]||0),0),mxI=Math.max(.001,...F.map(inc)),mxE=Math.max(.001,...F.map(f=>f.wages||0)),top=Math.max(mxI,mxE);
 const W=640,Hh=200,mid=110,sc=(Hh-30)/2/top,bw=Math.max(3,Math.min(18,(W-40)/Math.max(1,F.length)-3));
 let bars='';F.forEach((f,i)=>{const x=24+i*((W-40)/Math.max(1,F.length));let y=mid;FC.forEach(([k,,c])=>{const h=(f[k]||0)*sc;if(h>0){y-=h;bars+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${c}"/>`;}});const he=(f.wages||0)*sc;bars+=`<rect x="${x}" y="${mid}" width="${bw}" height="${he}" fill="#d0473c" opacity=".85"/>`;});
 let b=S.budget-F.reduce((a,f)=>a+inc(f)-(f.wages||0),0);const bp=F.map(f=>(b+=inc(f)-(f.wages||0))),bmin=Math.min(0,...bp),bmax=Math.max(.001,...bp),by=v=>Hh-12-(v-bmin)/((bmax-bmin)||1)*(Hh-40);
 const line=F.length>1?`<polyline fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 3" points="${bp.map((v,i)=>(24+i*((W-40)/F.length)+bw/2)+','+by(v)).join(' ')}"/>`:'';
 const tot=k=>F.reduce((a,f)=>a+(f[k]||0),0),ti=FC.reduce((a,[k])=>a+tot(k),0),te=tot('wages');
 const hist=H.length?`<h3 style="margin:12px 0 4px">Temporadas anteriores</h3><div class="tbl"><table><thead><tr><th>Temporada</th><th class="r">Ingresos</th><th class="r">Gastos</th><th class="r">Balance</th><th class="r">Caja final</th></tr></thead><tbody>${H.slice().reverse().map(h=>{const i=FC.reduce((a,[k])=>a+(h[k]||0),0),n=i-h.wages;return `<tr><td class="num">${esc(h.s)}</td><td class="n">${money(i)}</td><td class="n">${money(h.wages)}</td><td class="n" style="color:var(${n>=0?'--win':'--loss'})">${n>=0?'+':''}${money(n)}</td><td class="n">${money(h.b)}</td></tr>`;}).join('')}</tbody></table></div>`:'';
 return `<section class="panel"><div class="panel-h"><h2>Ingresos y gastos</h2><span class="eyebrow">Temporada ${seasonLabel()} · ${F.length} jornada${F.length===1?'':'s'}</span></div>
 <div class="finst ${ti-te>=0?'ok':'bad'}">${ti-te>=0?`Vas ganando dinero esta temporada: +${money(ti-te)}.`:`Esta temporada pierdes dinero: ${money(ti-te)}. Vigila los sueldos.`}</div>
 ${F.length?`<svg viewBox="0 0 ${W} ${Hh}" class="fbig" role="img" aria-label="Ingresos y gastos por jornada"><line x1="20" x2="${W-6}" y1="${mid}" y2="${mid}" stroke="var(--line)"/>${bars}${line}<text x="22" y="12" font-size="10" fill="var(--muted)">Ingresos ↑</text><text x="22" y="${Hh-2}" font-size="10" fill="var(--muted)">Sueldos y gastos ↓ · línea: presupuesto</text></svg>`:''}
 <div class="flegend">${FC.map(([k,n,c])=>`<span><i style="background:${c}"></i>${n} <b>${money(tot(k))}</b></span>`).join('')}<span><i style="background:#d0473c"></i>Gastos <b>${money(te)}</b></span></div>
 <div class="fsplit">${FC.map(([k,n,c])=>`<div><span>${n}</span><i><b style="width:${ti?Math.round(tot(k)/ti*100):0}%;background:${c}"></b></i><em>${ti?Math.round(tot(k)/ti*100):0}%</em></div>`).join('')}</div>${hist}</section>`;
}
/** Diseñador de la camiseta de la temporada: colores y dibujo, con vista previa y las de temporadas pasadas. */
function kitDesigner(){const aw=S.kitEd==='a',k=aw?myKit2():myKit(),lock=kitLocked(),prev=Object.entries(S.kits||{}).filter(([n])=>+n!==S.seasonN).sort((a,b)=>b[0]-a[0]).slice(0,5);
 return `<div class="kitd"><div class="kitp">${kitSVG(k,'big')}<small>${seasonLabel()}</small><span class="kit2m" title="${aw?'Primera':'Segunda'} equipación">${kitSVG(aw?myKit():myKit2(),'sm')}</span></div><div class="kitc"><div class="seg kited"><button data-a="kit-ed" data-v="h" aria-pressed="${!aw}">Primera</button><button data-a="kit-ed" data-v="a" aria-pressed="${aw}">Segunda</button></div><b>${aw?'Segunda equipación':'Equipación'} ${seasonLabel()}</b>${aw?'<p class="small muted" style="margin:2px 0 0">Se usa fuera de casa cuando tus colores chocan con los del rival.</p>':''}
 ${lock?'<p class="small muted" style="margin:2px 0 0">Ya presentada: es la camiseta de esta temporada. El próximo verano podrás diseñar otra.</p>':`<div class="row" style="gap:10px;margin:4px 0"><label class="kcol">Color principal <input type="color" id="kitC1" value="${k.c1}"></label><label class="kcol">Color secundario <input type="color" id="kitC2" value="${k.c2}"></label></div>
 <div class="seg kitpats">${KIT_PATS.map(([v,l])=>`<button data-a="kit-pat" data-v="${v}" aria-pressed="${k.pat===v}">${l}</button>`).join('')}</div>
 <p class="small muted" style="margin:4px 0 0">Diséñala y preséntala: si es distinta a la del año pasado, vende algo más. Se ve en tu alineación y en el partido.</p>`}
 ${prev.length?`<div class="kith">${prev.map(([n,x])=>`<span title="${seasonLabel(+n)}">${kitSVG(x,'sm')}<small>${seasonLabel(+n).slice(2)}</small></span>`).join('')}</div>`:''}</div></div>`;}
export function negociosHTML(){
 const C=S.club,shirts=topShirts(5),kp=kitPrice();
 const shop=`<section class="panel"><div class="panel-h"><h2>Tienda y camiseta</h2><span class="eyebrow">Ventas ×${(bizMult('shop')*kitMult()).toFixed(2)}</span></div>
 <div class="eyebrow" style="margin-bottom:4px">Precio de la camiseta</div><div class="seg">${Object.entries(KIT_P).map(([k,v])=>`<button data-a="kit-p" data-v="${k}" aria-pressed="${kp===k}">${esc(v.n)}</button>`).join('')}</div>
 <p class="small muted" style="margin:4px 0 10px">Barata: la afición te lo agradece cada semana, pero ganas menos por camiseta. Cara: más dinero y algo de enfado.</p>
 ${kitDesigner()}
 <div class="offer"><span class="t"><b>Nueva equipación</b><br><span class="small muted">${S.kitS===S.seasonN?(kitActive()?`En marcha: +35% de ventas hasta la jornada ${S.kitW}.`:'Ya presentada esta temporada.'):`Presenta la camiseta de la temporada: +35% de ventas durante 8 jornadas y la afición se ilusiona.`}</span></span>${S.kitS===S.seasonN?'':`<button class="btn sm primary" data-a="kit-launch">Presentar · ${money(kitCost())}</button>`}</div>
 <h3 style="margin:12px 0 4px">Camisetas más vendidas</h3>${shirts.length?shirts.map((x,i)=>`<div class="offer"><b class="num" style="width:20px">${i+1}</b>${posChip(x.p)}<span class="t">${nameBtn(x.p)}</span><b class="num">${x.u.toLocaleString('es')}</b></div>`).join(''):'<p class="small muted" style="margin:0">Aún no se ha vendido ninguna esta temporada. Los goles, ser internacional y ser joven y de la casa venden camisetas.</p>'}</section>`;
 const biz=`<section class="panel"><div class="panel-h"><h2>Negocios del club</h2><span class="eyebrow">Mantenimiento ${money(bizUpkeep())}/sem</span></div>
 ${Object.entries(BIZ).map(([k,b])=>{const l=bizLv(k),max=l>=BIZ_MAX,lock=b.cap&&C&&C.cap<b.cap;return `<div class="bizr"><span class="bzi">${b.i}</span><span class="t"><b>${esc(b.n)}</b> <span class="bzl">${'●'.repeat(l)}${'○'.repeat(BIZ_MAX-l)}</span><br><span class="small muted">${esc(b.d)}</span></span>${max?'<span class="tag xi">Al máximo</span>':lock?'<span class="tag">Estadio pequeño</span>':`<button class="btn sm ${S.budget>=bizCost(k)?'primary':''}" data-a="biz-buy" data-v="${k}">${l?'Mejorar':'Abrir'} · ${money(bizCost(k))}</button>`}</div>`;}).join('')}
 <p class="small muted" style="margin:8px 0 0">Es una inversión: cuesta dinero ahora y te lo devuelve poco a poco. Con más aficionados y un estadio más grande rinden más.</p></section>`;
 const name=`<section class="panel"><div class="panel-h"><h2>Nombre del estadio</h2></div>${S.naming&&S.naming.until>=S.seasonN?`<p style="margin:0">Se llama <b>«Estadio ${esc(S.naming.name)}»</b>: ${money(S.naming.weekly)} por semana hasta el final de la temporada ${S.naming.until-S.seasonN+1>1?'dentro de '+(S.naming.until-S.seasonN+1)+' temporadas':'actual'}.</p>`:S.namingOffer?`<p style="margin:0 0 8px"><b>${esc(S.namingOffer.name)}</b> ofrece ${money(S.namingOffer.weekly)} por semana durante 3 temporadas por ponerle su nombre al estadio.</p><div class="row"><button class="btn primary" data-a="naming-ok">Aceptar</button><button class="btn" data-a="naming-no">Rechazar</button></div>`:'<p class="small muted" style="margin:0">Algún verano llegará una empresa queriendo ponerle su nombre a tu estadio. Dinero fijo cada semana, aunque a parte de la afición no le gusta.</p>'}</section>`;
 return `<div class="grid"><div class="stack">${biz}</div><div class="stack">${shop}${name}</div></div>`;
}
