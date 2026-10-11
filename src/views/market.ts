/* El Banquillo · views/market.js — Pantallas del mercado. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {esc,money,plain} from '../core';
import {ATTRS,COUNTRIES,LV_NAMES,AT_NAME,AT_SH,POS_ORD,SPN,posChip} from '../data';
import {RT,LG,PL,S,T,crest,lgName,pBadge,rt,seasonLabel,squad} from '../state';
import {table} from '../tactics';
import {askPrice,inWindow,refuses,sell,windowTxt} from '../market';
import {contractTxt} from '../contracts';
import {attrCells,clubCell,nameBtn,potTxt} from './common';
export function marketRow(p){
 const pr=askPrice(p),no=refuses(p),fav=S.short.includes(p.id);
 return `<tr><td><button class="star ${fav?'on':''}" data-a="fav" data-id="${p.id}" aria-label="${fav?'Dejar de seguir':'Seguir'}" aria-pressed="${fav}">${fav?'★':'☆'}</button></td><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td>${clubCell(p)}</td><td class="n">${p.age}</td><td class="r">${pBadge(p)}</td><td class="n">${potTxt(p)}</td>${attrCells(p)}<td>${contractTxt(p)}</td><td class="n">${money(pr)}</td>
 <td class="r">${no?'<span class="tag" title="No quiere jugar en tu liga">No vendría</span>':`<span class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px"><button class="btn sm ${S.budget>=pr?'primary':''}" data-a="neg" data-id="${p.id}">Ofertar</button>${p.team!==null?`<button class="btn sm" data-a="loan" data-id="${p.id}">Cesión</button>`:''}</span>`}</td></tr>`;
}
export function mkList(){
 RT.keyCache=null;const mk=S.mk;
 if(mk.tab==='moves'){const L=(S.tlog||[]).filter(x=>x.season===seasonLabel());return L.length?`<p class="small muted" style="margin:0 0 8px">Últimos traspasos entre clubes de todo el mundo esta temporada.</p><div class="tbl"><table><thead><tr><th>J</th><th>Jugador</th><th>De</th><th>A</th><th class="r">Precio</th></tr></thead><tbody>${L.slice(0,60).map(x=>{const pl=PL(x.pid);return `<tr class="${x.to===S.user||x.from===S.user?'me':''}"><td class="num">${x.wk}</td><td>${pl?nameBtn(pl):esc(x.name)}</td><td>${x.from==null?'<span class="tag">Libre</span>':`<span class="teamcell">${crest(T(x.from),'sm')}${esc(T(x.from).short)}</span>`}</td><td><span class="teamcell">${crest(T(x.to),'sm')}${esc(T(x.to).short)} <span class="divtag">${lgName(T(x.to).lg,true)}</span></span></td><td class="n">${x.fee?money(x.fee):'Libre'}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay traspasos esta temporada. Los clubes se mueven cuando abre el mercado.</div>';}
 if(mk.tab==='sell'){
  const sq=squad(S.user).sort((a,b)=>POS_ORD[a.pos]-POS_ORD[b.pos]||b.ovr-a.ovr);
  return `<div class="tbl"><table><thead><tr><th>Pos</th><th>Nombre</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Valor</th><th class="r">Sueldo/sem</th><th>Contrato</th><th></th></tr></thead><tbody>
  ${sq.map(p=>`<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td class="n">${p.age}</td><td class="r">${pBadge(p)}</td><td class="n">${money(p.value)}</td><td class="n">${money(p.wage)}</td><td>${contractTxt(p)}</td><td class="r">${p.loan?'':`<span class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px"><button class="btn sm" data-a="sell" data-id="${p.id}">Buscar oferta</button><button class="btn sm" data-a="loanout" data-id="${p.id}">Ceder</button><button class="btn sm" data-a="renew" data-id="${p.id}">Renovar</button></span>`}</td></tr>`).join('')}</tbody></table></div>`;
 }
 const head=`<thead><tr><th></th><th>Pos</th><th>Nombre</th><th>Club</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Pot.</th>${ATTRS.map(k=>`<th class="r" title="${AT_NAME[k]}">${AT_SH[k]}</th>`).join('')}<th>Contrato</th><th class="r">Precio</th><th></th></tr></thead>`;
 if(mk.tab==='short'){
  const l=S.short.map(PL).filter(p=>p&&p.team!==S.user);
  return l.length?`<div class="tbl"><table>${head}<tbody>${l.map(marketRow).join('')}</tbody></table></div>`:'<div class="empty">Aún no sigues a nadie. Marca la estrella ☆ de un jugador en Buscar para tenerlo aquí.</div>';
 }
 const q=plain(mk.q.trim().toLowerCase()),max=parseFloat(mk.max),age=parseInt(mk.age),min=parseFloat(mk.min),lv=mk.lv===''?null:+mk.lv;
 let list=Object.values(S.players).filter(p=>{
  if(p.team===S.user||p.loan)return false;
  if(mk.pos!=='ALL'&&p.pos!==mk.pos)return false;
  if(mk.sp&&p.sp!==mk.sp&&!(p.alt&&p.alt.includes(mk.sp)))return false;
  if(mk.c==='FA'){if(p.team!==null)return false;}
  else{if(mk.c!=='ALL'&&(p.team===null||LG(T(p.team).lg).c!==+mk.c))return false;if(lv!==null&&(p.team===null||LG(T(p.team).lg).lv!==lv))return false;}
  if(mk.last&&(p.team===null||p.contract>1))return false;
  if(age&&p.age>age)return false;if(min&&p.ovr<min*10)return false;
  if(max&&askPrice(p)>max)return false;
  if(mk.ok&&refuses(p))return false;
  if(q&&!plain(p.name.toLowerCase()).includes(q)&&!(p.team!==null&&plain(T(p.team).name.toLowerCase()).includes(q)))return false;
  return true;});
 const so={ovr:(a,b)=>b.ovr-a.ovr,price:(a,b)=>askPrice(a)-askPrice(b),age:(a,b)=>a.age-b.age,pot:(a,b)=>b.pot-a.pot,ganga:(a,b)=>b.ovr/Math.sqrt(askPrice(b)+.05)-a.ovr/Math.sqrt(askPrice(a)+.05)}[mk.sort]||((a,b)=>b.at[mk.sort]-a.at[mk.sort]||b.ovr-a.ovr);
 list.sort(so);
 const total=list.length;list=list.slice(0,mk.limit);
 if(!total)return `<div class="empty">Ningún jugador cumple estos filtros. Prueba a subir el precio máximo o quitar algún filtro.</div>`;
 return `<p class="small muted" style="margin:0 0 8px">${total} jugador${total>1?'es':''} encontrado${total>1?'s':''}</p><div class="tbl"><table>${head}<tbody>${list.map(marketRow).join('')}</tbody></table></div>
 ${total>list.length?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-a="mk-more">Mostrar más (${total-list.length})</button></div>`:''}`;
}
export function mercadoView(){
 const mk=S.mk,wages=squad(S.user).reduce((a,p)=>a+p.wage,0);
 const sel=(id,cur,opts)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===v?'selected':''}>${l}</option>`).join('')}</select>`;
 return `<div class="${inWindow()?'negmsg ok':'negmsg'}" style="margin:0 0 14px">${windowTxt()}</div><section class="panel"><div class="panel-h"><div class="seg"><button data-a="mk-tab" data-v="moves" aria-pressed="${mk.tab==='moves'}">Movimientos</button><button data-a="mk-tab" data-v="buy" aria-pressed="${mk.tab==='buy'}">Buscar</button><button data-a="mk-tab" data-v="short" aria-pressed="${mk.tab==='short'}">Seguimiento (${S.short.filter(id=>PL(id)&&PL(id).team!==S.user).length})</button><button data-a="mk-tab" data-v="sell" aria-pressed="${mk.tab==='sell'}">Vender</button></div>
 <span class="small muted">Presupuesto ${money(S.budget)} · Sueldos ${money(wages)}/sem · ${squad(S.user).length} jugadores</span></div>
 ${mk.tab==='buy'?`<div class="filters">
  <div class="chips">${['ALL','POR','DEF','MED','DEL'].map(p=>`<button class="btn sm ${mk.pos===p?'dark':''}" data-a="mk-pos" data-v="${p}">${p==='ALL'?'Todos':p}</button>`).join('')}</div>
  <label class="f"><span class="eyebrow">Buscar</span><input type="search" id="mkq" placeholder="Nombre o club" value="${esc(mk.q)}"></label>
  <label class="f"><span class="eyebrow">Posición exacta</span>${sel('mksp',mk.sp||'',[['','Cualquiera'],...Object.entries(SPN).map(([k,v])=>[k,v])])}</label>
  <label class="f"><span class="eyebrow">País</span>${sel('mkc',mk.c,[['ALL','Todos'],...COUNTRIES.map((c,i)=>[String(i),c.n]),['FA','Agentes libres']])}</label>
  <label class="f"><span class="eyebrow">División</span>${sel('mklv',mk.lv,[['','Todas'],...LV_NAMES.map((n,i)=>[String(i),n])])}</label>
  <label class="f"><span class="eyebrow">Media mín.</span>${sel('mkmin',mk.min,[['','Cualquiera'],['4','4+'],['5','5+'],['6','6+'],['6.5','6.5+'],['7','7+'],['8','8+']])}</label>
  <label class="f"><span class="eyebrow">Edad máx.</span>${sel('mkage',mk.age,[['','Cualquiera'],['21','21'],['23','23'],['26','26'],['30','30']])}</label>
  <label class="f"><span class="eyebrow">Precio máx.</span>${sel('mkmax',mk.max,[['','Sin límite'],['0.05','€50k'],['0.1','€100k'],['0.25','€250k'],['0.5','€500k'],['1','€1M'],['2','€2M'],['5','€5M']])}</label>
  <label class="f"><span class="eyebrow">Ordenar por</span>${sel('mksort',mk.sort,[['ovr','Media'],['pot','Potencial'],['ganga','Mejor calidad-precio'],['price','Precio'],['age','Edad'],['tir','Tiro'],['pas','Pase'],['reg','Regate'],['def','Defensa'],['fis','Físico'],['por','Portería']])}</label>
  <label class="chk"><input type="checkbox" id="mkok" ${mk.ok?'checked':''}> Solo los que vendrían</label>
  <label class="chk"><input type="checkbox" id="mklast" ${mk.last?'checked':''}> Último año de contrato (más baratos)</label></div>`:mk.tab==='sell'?'<p class="small muted" style="margin:0 0 10px">Pide una oferta, cede a un jugador hasta final de temporada (el otro club paga su sueldo) o renueva su contrato. Cada club responde una vez por jornada.</p>':''}
 <div id="mklist">${mkList()}</div></section>`;
}
