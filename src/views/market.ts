/* El Banquillo · views/market.js — Pantallas del mercado. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {wcs} from '../state';
import {TS} from '../marketfm';
import {missionCountries,missionOf,missionScouts} from '../scoutplus';
import {canBuyback} from '../negotiate';
import {trendTag} from '../economy';
import {esc,money,plain} from '../core';
import {ATTRS,COUNTRIES,LV_NAMES,AT_NAME,AT_SH,POS_ORD,SPN,posChip} from '../data';
import {RT,LG,PL,S,T,crest,lgName,pBadge,rt,seasonLabel,squad} from '../state';
import {table} from '../tactics';
import {askPrice,inWindow,refuses,sell,windowTxt} from '../market';
import {contractTxt} from '../contracts';
import {attrCells,attrHead,clubCell,nameBtn,pBadgeS,potTxt} from './common';
import {EXACT,estAt as estAt0,estOvr as estOvr0,estPot as estPot0,knowledge} from '../scouting';
export function marketRow(p){
 const pr=askPrice(p),no=refuses(p),fav=S.short.includes(p.id),gem=p.gem&&knowledge(p)>=60?' <span class="tag gem" title="Tu ojeador cree que puede ser una joya">💎</span>':'';
 return `<tr><td><button class="star ${fav?'on':''}" data-a="fav" data-id="${p.id}" aria-label="${fav?'Dejar de seguir':'Seguir'}" aria-pressed="${fav}">${fav?'★':'☆'}</button></td><td>${posChip(p)}</td><td>${nameBtn(p)}${gem}</td><td>${clubCell(p)}</td><td class="n">${p.age}</td><td class="r">${pBadgeS(p)}</td><td class="n">${potTxt(p)}</td>${attrCells(p)}<td>${contractTxt(p)}</td><td class="n">${money(pr)}${trendTag(p)}</td>
 <td class="r">${no?'<span class="tag" title="No quiere jugar en tu liga">No vendría</span>':`<span class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px"><button class="btn sm ${S.budget>=pr?'primary':''}" data-a="neg" data-id="${p.id}">Ofertar</button>${canBuyback(p)?`<button class="btn sm primary" data-a="buyback" data-id="${p.id}" title="Cláusula de recompra">Recomprar · ${money(p.bb.price)}</button>`:''}${p.team!==null?`<button class="btn sm" data-a="loan" data-id="${p.id}">Cesión</button>`:''}${knowledge(p)<EXACT?`<button class="btn sm" data-a="scout" data-id="${p.id}" title="Pedir un informe">Ojear</button>`:''}</span>`}</td></tr>`;
}
export function mkList(){
 RT.keyCache=null;const mk=S.mk;
 if(mk.tab==='moves'){const L=(S.tlog||[]).filter(x=>x.season===seasonLabel());return L.length?`<p class="small muted" style="margin:0 0 8px">Últimos traspasos entre clubes de todo el mundo esta temporada.</p><div class="tbl"><table><thead><tr><th>J</th><th>Jugador</th><th>De</th><th>A</th><th class="r">Precio</th></tr></thead><tbody>${L.slice(0,60).map(x=>{const pl=PL(x.pid);return `<tr class="${x.to===S.user||x.from===S.user?'me':''}"><td class="num">${x.wk}</td><td>${pl?nameBtn(pl):esc(x.name)}</td><td>${x.from==null?'<span class="tag">Libre</span>':`<span class="teamcell">${crest(T(x.from),'sm')}${esc(T(x.from).short)}</span>`}</td><td><span class="teamcell">${crest(T(x.to),'sm')}${esc(T(x.to).short)} <span class="divtag">${lgName(T(x.to).lg,true)}</span></span></td><td class="n">${x.fee?money(x.fee):'Libre'}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay traspasos esta temporada. Los clubes se mueven cuando abre el mercado.</div>';}
 if(mk.tab==='sell'){
  const sq=squad(S.user).sort((a,b)=>POS_ORD[a.pos]-POS_ORD[b.pos]||b.ovr-a.ovr);
  return `<p class="small muted" style="margin:0 0 8px">Marca el estado de cada jugador: <b>Transferible</b> (le llegarán más ofertas), <b>Cedible</b> (habrá clubes que pidan su cesión) o <b>Intocable</b> (nadie preguntará por él).</p><div class="tbl"><table><thead><tr><th>Pos</th><th>Nombre</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Valor</th><th class="r">Sueldo/sem</th><th>Contrato</th><th>Estado</th><th></th></tr></thead><tbody>
  ${sq.map(p=>`<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td class="n">${p.age}</td><td class="r">${pBadge(p)}</td><td class="n">${money(p.value)}${trendTag(p)}</td><td class="n">${money(p.wage)}</td><td>${contractTxt(p)}</td><td>${p.loan?'':`<select data-ts="${p.id}" class="ts-${p.ts||'n'}" aria-label="Estado de ${esc(p.name)}">${Object.entries(TS).map(([k,l])=>`<option value="${k}" ${(p.ts||'')===k?'selected':''}>${l}</option>`).join('')}</select>`}</td><td class="r">${p.loan?'':`<span class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px"><button class="btn sm" data-a="sell" data-id="${p.id}">Buscar oferta</button><button class="btn sm" data-a="loanout" data-id="${p.id}">Ceder</button><button class="btn sm" data-a="renew" data-id="${p.id}">Renovar</button></span>`}</td></tr>`).join('')}</tbody></table></div>`;
 }
 const head=`<thead><tr><th></th><th>Pos</th><th>Nombre</th><th>Club</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Pot.</th>${attrHead()}<th>Contrato</th><th class="r">Precio</th><th></th></tr></thead>`;
 if(mk.tab==='ojeo')return missionsHTML();
 if(mk.tab==='ofe')return offersHub();
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
  if(age&&p.age>age)return false;if(min&&estOvr0(p)<min*10)return false;
  if(max&&askPrice(p)>max)return false;
  if(mk.ok&&refuses(p))return false;
  if(mk.nat!==''&&mk.nat!=null&&p.nat!==+mk.nat)return false;
  if(mk.wage&&p.wage>+mk.wage)return false;
  if(mk.pot&&(p.age>23||estPot0(p)<+mk.pot))return false;
  if(mk.atk&&mk.atv&&estAt0(p,mk.atk)<+mk.atv)return false;
  if(mk.rep&&knowledge(p)<EXACT)return false;
  if(mk.gem&&!(p.gem&&knowledge(p)>=60))return false;
  if(q&&!plain(p.name.toLowerCase()).includes(q)&&!(p.team!==null&&plain(T(p.team).name.toLowerCase()).includes(q)))return false;
  return true;});
 // se ordena por lo que sabes de cada jugador (el centro de su rango), no por sus valores reales
 const memo=(fn)=>{const c=new Map();return p=>{let v=c.get(p.id);if(v===undefined){v=fn(p);c.set(p.id,v);}return v;};};
 const estOvr=memo(estOvr0),estPot=memo(estPot0),estAt=(p,k)=>memoAt(p.id+k,p,k),atC=new Map(),memoAt=(key,p,k)=>{let v=atC.get(key);if(v===undefined){v=estAt0(p,k);atC.set(key,v);}return v;};
 const so={ovr:(a,b)=>estOvr(b)-estOvr(a),price:(a,b)=>askPrice(a)-askPrice(b),age:(a,b)=>a.age-b.age,pot:(a,b)=>estPot(b)-estPot(a),ganga:(a,b)=>estOvr(b)/Math.sqrt(askPrice(b)+.05)-estOvr(a)/Math.sqrt(askPrice(a)+.05)}[mk.sort]||((a,b)=>estAt(b,mk.sort)-estAt(a,mk.sort)||estOvr(b)-estOvr(a));
 list.sort(so);
 const total=list.length;list=list.slice(0,mk.limit);
 if(!total)return `<div class="empty">Ningún jugador cumple estos filtros. Prueba a subir el precio máximo o quitar algún filtro.</div>`;
 return `<p class="small muted" style="margin:0 0 8px">${total} jugador${total>1?'es':''} encontrado${total>1?'s':''}</p><div class="tbl"><table>${head}<tbody>${list.map(marketRow).join('')}</tbody></table></div>
 ${total>list.length?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-a="mk-more">Mostrar más (${total-list.length})</button></div>`:''}`;
}
/** Todas las negociaciones en un sitio: tus ofertas en curso, las que recibes y tus transferibles. */
function offersHub(){
 const mine=Object.entries(S.neg||{}).map(([id,n])=>[PL(id),n]).filter(([p,n])=>p&&p.team!==S.user&&(n.wait||n.agreed||n.counter||n.msg));
 const st=n=>n.wait?['Esperando respuesta','']:n.agreed?['Aceptada: negocia el contrato','xi']:n.closed?['Negociación cerrada','bad']:n.counter?[`Piden ${money(n.counter)}`,'']:['En curso',''];
 const inc=Object.entries(S.offers||{}).filter(([id,o])=>o.incoming&&PL(id)&&PL(id).team===S.user);
 const list=squad(S.user).filter(p=>p.ts&&!p.loan);
 return `<h3 style="margin:0 0 6px">Tus ofertas</h3>${mine.length?mine.map(([p,n])=>{const s_=st(n);return `<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} <span class="small muted">· ${p.team!==null?esc(T(p.team).name):'agente libre'}${n.wait?' · ofreces '+money(n.wait.amt):n.agreed?' · '+money(n.agreed):''}</span><br><span class="small muted">${esc(n.msg||'')}</span></span><span class="tag ${s_[1]}">${s_[0]}</span><button class="btn sm ${n.agreed?'primary':''}" data-a="neg" data-id="${p.id}">${n.agreed?'Contrato':'Abrir'}</button></div>`;}).join(''):'<div class="empty">No tienes negociaciones en marcha. Busca jugadores y haz una oferta: el club responde en 1 o 2 días.</div>'}
 <h3 style="margin:14px 0 6px">Ofertas que recibes</h3>${inc.length?inc.map(([id,o])=>{const p=PL(id);return `<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> ofrece <b>${money(o.amount)}</b> por ${nameBtn(p)} <span class="small muted">(valor ${money(p.value)})</span></span><button class="btn sm primary" data-a="offer-view" data-id="${id}">Ver</button></div>`;}).join(''):'<div class="empty">Nadie ha preguntado por tus jugadores. Márcalos como «Transferible» en Vender para atraer ofertas.</div>'}
 <h3 style="margin:14px 0 6px">Tu lista</h3>${list.length?list.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} <span class="small muted">· valor ${money(p.value)}</span></span><span class="tag ${p.ts==='no'?'onxi':''}">${TS[p.ts]}</span></div>`).join(''):'<div class="empty">Ningún jugador marcado.</div>'}`;
}
/** Misiones de ojeo: cada ojeador de primer equipo puede ir a un país a buscar un tipo de jugador. */
function missionsHTML(){
 const sen=missionScouts(),F=S.misF||{};
 const sel=(id,cur,opts)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 return `<p class="small muted" style="margin:0 0 10px">Manda a un ojeador a un país a buscar un tipo de jugador. Cada semana puede volver con un informe completo; cuanto mejor juzga el potencial, más fácil que encuentre una <b>joya 💎</b>: chavales que hoy no destacan pero pueden ser estrellas. Si tardas en ficharlas, otro club grande se te adelanta. Mejores ojeadores en Cantera y ojeo › Ojeadores.</p>
 ${sen.map(sc=>{const M=missionOf(sc.id);return `<div class="offer" style="align-items:flex-start"><span class="t"><b>${esc(sc.name)}</b> <span class="small muted">· ${sc.virt?'segundo entrenador':'ojeador'} · juzga potencial ${sc.jpo||'?'}</span><br>
 ${M?`<span class="small">En misión en <b>${esc(COUNTRIES[M.c].n)}</b> · ${M.g==='ALL'?'cualquier puesto':M.g} · ${M.age?'hasta '+M.age+' años':'cualquier edad'} · vuelve en ${Math.max(0,M.until-S.week)} jornada${M.until-S.week===1?'':'s'}</span><br><span class="small muted">Encontrados: ${M.found.length?M.found.map(id=>PL(id)?nameBtn(PL(id))+(PL(id).gem?' 💎':''):'').join(', '):'aún nada'}</span>`
 :`<span class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap">${sel('misC',F.misC??wcs()[0],missionCountries().map(i=>[i,COUNTRIES[i].n]))}${sel('misG',F.misG||'ALL',[['ALL','Cualquier puesto'],['POR','Porteros'],['DEF','Defensas'],['MED','Medios'],['DEL','Delanteros']])}${sel('misA',F.misA||'21',[['19','Hasta 19 años'],['21','Hasta 21'],['23','Hasta 23'],['0','Cualquier edad']])}${sel('misW',F.misW||'4',[['4','4 jornadas'],['8','8 jornadas']])}</span>`}</span>
 ${M?`<button class="btn sm" data-a="mis-stop" data-id="${sc.id}">Volver</button>`:`<button class="btn sm primary" data-a="mis-go" data-id="${sc.id}">Enviar</button>`}</div>`;}).join('')}`;
}
export function mercadoView(){
 const mk=S.mk,wages=squad(S.user).reduce((a,p)=>a+p.wage,0);
 const sel=(id,cur,opts)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===v?'selected':''}>${l}</option>`).join('')}</select>`;
 const feed=S.dlD===S.day&&S.dlFeed&&S.dlFeed.length?`<section class="panel dlfeed"><div class="panel-h"><h2>⏰ Día de cierre en directo</h2><span class="eyebrow">${S.dlDone===S.day?'Mercado cerrado':'Pulsa Continuar para avanzar la hora'}</span></div>${S.dlFeed.slice().reverse().map(x=>`<div class="offer"><b class="num" style="min-width:44px">${x.h}</b><span class="t small">${esc(x.t)}</span></div>`).join('')}</section>`:'';
 return feed+`<div class="${inWindow()?'negmsg ok':'negmsg'} wbanner" style="margin:0 0 14px">${windowTxt()}</div><section class="panel"><div class="panel-h"><div class="seg"><button data-a="mk-tab" data-v="moves" aria-pressed="${mk.tab==='moves'}">Movimientos</button><button data-a="mk-tab" data-v="buy" aria-pressed="${mk.tab==='buy'}">Buscar</button><button data-a="mk-tab" data-v="short" aria-pressed="${mk.tab==='short'}">Seguimiento (${S.short.filter(id=>PL(id)&&PL(id).team!==S.user).length})</button><button data-a="mk-tab" data-v="ofe" aria-pressed="${mk.tab==='ofe'}">Ofertas${(()=>{const k=Object.values(S.neg||{}).filter(n=>n.wait||n.agreed).length+Object.values(S.offers||{}).filter(o=>o.incoming).length;return k?' ('+k+')':'';})()}</button><button data-a="mk-tab" data-v="ojeo" aria-pressed="${mk.tab==='ojeo'}">Misiones de ojeo</button><button data-a="mk-tab" data-v="sell" aria-pressed="${mk.tab==='sell'}">Vender</button></div>
 <span class="small muted">Presupuesto ${money(S.budget)} · Sueldos ${money(wages)}/sem · ${squad(S.user).length} jugadores</span></div>
 ${mk.tab==='buy'?`<div class="filters">
  <div class="chips">${['ALL','POR','DEF','MED','DEL'].map(p=>`<button class="btn sm ${mk.pos===p?'dark':''}" data-a="mk-pos" data-v="${p}">${p==='ALL'?'Todos':p}</button>`).join('')}</div>
  <label class="f"><span class="eyebrow">Buscar</span><input type="search" id="mkq" placeholder="Nombre o club" value="${esc(mk.q)}"></label>
  <label class="f"><span class="eyebrow">Posición exacta</span>${sel('mksp',mk.sp||'',[['','Cualquiera'],...Object.entries(SPN).map(([k,v])=>[k,v])])}</label>
  <label class="f"><span class="eyebrow">Media mín.</span>${sel('mkmin',mk.min,[['','Cualquiera'],['4','4+'],['5','5+'],['6','6+'],['6.5','6.5+'],['7','7+'],['8','8+']])}</label>
  <label class="f"><span class="eyebrow">Precio máx.</span>${sel('mkmax',mk.max,[['','Sin límite'],['0.05','€50k'],['0.1','€100k'],['0.25','€250k'],['0.5','€500k'],['1','€1M'],['2','€2M'],['5','€5M']])}</label>
  <label class="f"><span class="eyebrow">Ordenar por</span>${sel('mksort',mk.sort,[['ovr','Media'],['pot','Potencial'],['ganga','Mejor calidad-precio'],['price','Precio'],['age','Edad'],...ATTRS.map(k=>[k,AT_NAME[k]])])}</label>
  <button class="btn sm advbtn" data-a="mk-adv" aria-pressed="${!!mk.adv}">${mk.adv?'Menos filtros':'Más filtros'}${(n=>n?` (${n})`:'')([mk.c!=='ALL'?mk.c:'',mk.lv,mk.age,mk.ok,mk.nat,mk.wage,mk.pot,mk.atk,mk.last,mk.rep,mk.gem].filter(x=>x!==''&&x!=null&&x!==false).length)}</button>
  ${mk.adv?`<div class="advfil">
  <label class="f"><span class="eyebrow">País</span>${sel('mkc',mk.c,[['ALL','Todos'],...wcs().map(i=>[String(i),COUNTRIES[i].n]),['FA','Agentes libres']])}</label>
  <label class="f"><span class="eyebrow">División</span>${sel('mklv',mk.lv,[['','Todas'],...LV_NAMES.map((n,i)=>[String(i),n])])}</label>
  <label class="f"><span class="eyebrow">Edad máx.</span>${sel('mkage',mk.age,[['','Cualquiera'],['21','21'],['23','23'],['26','26'],['30','30']])}</label>
  <label class="chk"><input type="checkbox" id="mkok" ${mk.ok?'checked':''}> Solo los que vendrían</label>
  <label class="f"><span class="eyebrow">Nacionalidad</span>${sel('mknat',mk.nat??'',[['','Cualquiera'],...COUNTRIES.map((c,i)=>[String(i),c.n])])}</label>
  <label class="f"><span class="eyebrow">Sueldo máx.</span>${sel('mkwage',mk.wage||'',[['','Sin límite'],['0.002','€2k/sem'],['0.005','€5k/sem'],['0.01','€10k/sem'],['0.025','€25k/sem'],['0.05','€50k/sem']])}</label>
  <label class="f"><span class="eyebrow">Potencial mín.</span>${sel('mkpot',mk.pot||'',[['','Cualquiera'],['6','6+'],['7','7+'],['7.5','7.5+'],['8','8+'],['8.5','8.5+']])}</label>
  <label class="f"><span class="eyebrow">Atributo</span>${sel('mkatk',mk.atk||'',[['','Ninguno'],...ATTRS.map(k=>[k,AT_NAME[k]])])}</label>
  <label class="f"><span class="eyebrow">Mínimo</span>${sel('mkatv',mk.atv||'',[['','—'],...[5,6,7,8,9].map(v=>[String(v),v+'+'])])}</label>
  <label class="chk"><input type="checkbox" id="mklast" ${mk.last?'checked':''}> Último año de contrato (más baratos)</label>
  <label class="chk"><input type="checkbox" id="mkrep" ${mk.rep?'checked':''}> Solo con informe completo</label>
  <label class="chk"><input type="checkbox" id="mkgem" ${mk.gem?'checked':''}> Solo posibles joyas 💎</label>
  </div>`:''}</div>
  <div class="chips" style="margin:6px 0 10px"><button class="btn sm" data-a="mk-save">Guardar esta búsqueda</button>${(S.mkSaved||[]).map((x,i)=>`<span class="savedq"><button class="btn sm dark" data-a="mk-load" data-i="${i}">${esc(x.n)}</button><button class="btn sm" data-a="mk-del" data-i="${i}" aria-label="Borrar búsqueda">×</button></span>`).join('')}</div>`:mk.tab==='sell'?'<p class="small muted" style="margin:0 0 10px">Pide una oferta, cede a un jugador hasta final de temporada (el otro club paga su sueldo) o renueva su contrato. Cada club responde una vez por jornada.</p>':''}
 <div id="mklist">${mkList()}</div></section>`;
}
