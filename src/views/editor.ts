/* El Banquillo · views/editor.ts — Editor y mods. */
// @ts-nocheck — usa el estado heredado S.
import {esc,plain} from '../core';
import {AT_GROUPS,AT_NAME,COUNTRIES,FOOT,LV_NAMES,SPN,posChip} from '../data';
import {LG,PL,S,T,cName,crest,lgName,squad} from '../state';
import {CREST_SHAPES} from '../mods';
import {pBadge} from '../state';

const sel=(id,cur,opts)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(cur)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
const q=s=>plain(String(s||'').toLowerCase());

function modReport(m){if(!m||(!m.nE&&!m.nW))return m&&m.check?'<p class="small" style="color:var(--win)">✓ Sin errores: se puede importar todo.</p>':'';const li=(x,c)=>`<li class="small"><b style="color:${c}">${x.l?'Línea '+x.l:'Archivo'}</b> · ${esc(x.m)}</li>`;return `<div class="modrep">${m.nE?`<div class="eyebrow" style="color:var(--loss)">${m.nE} error${m.nE>1?'es':''} · esas filas no se aplican</div><ul>${m.errors.map(x=>li(x,'var(--loss)')).join('')}${m.nE>m.errors.length?`<li class="small muted">… y ${m.nE-m.errors.length} más</li>`:''}</ul>`:''}${m.nW?`<div class="eyebrow" style="color:#b07a00">${m.nW} aviso${m.nW>1?'s':''}</div><ul>${m.warns.map(x=>li(x,'#b07a00')).join('')}</ul>`:''}</div>`;}
export function editorView(){
 const tab=S.edTab||'club';
 const seg=`<div class="seg" style="margin-bottom:14px;max-width:100%;overflow-x:auto">${[['club','Clubes'],['pl','Jugadores'],['names','Ligas y países'],['io','Importar y exportar']].map(([k,l])=>`<button data-a="ed-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
 const intro=`<p class="small muted" style="margin:0 0 12px">Cambia nombres, colores, escudos y jugadores a tu gusto (por ejemplo, para jugar con nombres reales). Los cambios se guardan en esta partida y puedes exportarlos como mod para usarlos en otra.</p>`;
 if(tab==='club'){
  const term=q(S.edQ),res=term?S.teams.filter(t=>q(t.name).includes(term)).slice(0,25):[];const t=S.edClub!=null?T(S.edClub):null;
  return seg+intro+`<div class="grid"><section class="panel"><div class="panel-h"><h2>Buscar club</h2></div>
  <div class="row" style="align-items:flex-end"><label class="f" style="flex:1"><span class="eyebrow">Nombre</span><input type="search" id="edQ" value="${esc(S.edQ||'')}" placeholder="Escribe parte del nombre"></label><button class="btn" data-a="ed-search">Buscar</button><button class="btn" data-a="ed-mine">Mi club</button></div>
  ${res.map(x=>`<button class="mrow" data-a="ed-club" data-id="${x.id}" style="grid-template-columns:auto minmax(0,1fr)">${crest(x,'sm')}<span class="msubj">${esc(x.name)} <span class="small muted">· ${esc(lgName(x.lg))}</span></span></button>`).join('')||(term?'<div class="empty">Ningún club con ese nombre.</div>':'')}</section>
  ${t?`<section class="panel"><div class="panel-h"><h2>Editar club</h2>${crest(t,'lg')}</div>
  <div class="filters"><label class="f" style="flex:2"><span class="eyebrow">Nombre</span><input id="edName" maxlength="60" value="${esc(t.name)}"></label><label class="f"><span class="eyebrow">Abreviatura</span><input id="edShort" maxlength="3" value="${esc(t.short)}" style="width:70px;text-transform:uppercase"></label>
  <label class="f"><span class="eyebrow">Color principal</span><input type="color" id="edC1" value="${t.c1}"></label><label class="f"><span class="eyebrow">Color del borde</span><input type="color" id="edC2" value="${t.c2}"></label>
  <label class="f"><span class="eyebrow">Escudo</span>${sel('edCs',t.cs||'',Object.entries(CREST_SHAPES))}</label></div>
  <div class="acts" style="justify-content:flex-start"><button class="btn primary" data-a="ed-club-save" data-id="${t.id}">Guardar</button><button class="btn" data-a="ed-squad" data-id="${t.id}">Ver sus jugadores</button></div></section>`:''}</div>`;
 }
 if(tab==='pl'){
  const term=q(S.edPQ);let res=[];
  if(S.edSquad!=null)res=squad(S.edSquad).sort((a,b)=>a.sp.localeCompare(b.sp));
  else if(term.length>=2)res=Object.values(S.players).filter(p=>q(p.name).includes(term)).slice(0,30);
  const p=S.edPl?PL(S.edPl):null;
  return seg+intro+`<div class="grid"><section class="panel"><div class="panel-h"><h2>Buscar jugador</h2>${S.edSquad!=null?`<span class="eyebrow">${esc(T(S.edSquad).name)}</span>`:''}</div>
  <div class="row" style="align-items:flex-end"><label class="f" style="flex:1"><span class="eyebrow">Nombre</span><input type="search" id="edPQ" value="${esc(S.edPQ||'')}" placeholder="Al menos 2 letras"></label><button class="btn" data-a="ed-psearch">Buscar</button><button class="btn" data-a="ed-squad" data-id="${S.user}">Mi plantilla</button></div>
  ${res.map(x=>`<button class="mrow" data-a="ed-pl" data-id="${x.id}" style="grid-template-columns:auto minmax(0,1fr) auto">${posChip(x)}<span class="msubj">${esc(x.name)} <span class="small muted">· ${x.team!==null?esc(T(x.team).short):'Libre'} · ${x.age}</span></span>${pBadge(x)}</button>`).join('')}</section>
  ${p?`<section class="panel"><div class="panel-h"><h2>Editar jugador</h2>${pBadge(p)}</div>
  <div class="filters"><label class="f" style="flex:2"><span class="eyebrow">Nombre</span><input id="edPName" maxlength="60" value="${esc(p.name)}"></label>
  <label class="f"><span class="eyebrow">País</span>${sel('edPNat',p.nat,COUNTRIES.map((c,i)=>[i,cName(i)]))}</label>
  <label class="f"><span class="eyebrow">Posición</span>${sel('edPSp',p.sp,Object.entries(SPN))}</label>
  <label class="f"><span class="eyebrow">Edad</span><input type="number" id="edPAge" min="15" max="45" value="${p.age}" style="width:70px"></label>
  <label class="f"><span class="eyebrow">Pie</span>${sel('edPFoot',p.foot,Object.entries(FOOT))}</label>
  <label class="f"><span class="eyebrow">Potencial</span><input type="number" id="edPPot" min="1" max="10" step="0.5" value="${(Math.round(p.pot*2)/2).toFixed(1)}" style="width:80px"></label></div>
  ${AT_GROUPS.map(([n,ks])=>`<div class="eyebrow" style="margin:10px 0 4px">${n}</div><div class="filters">${ks.map(k=>`<label class="f"><span class="eyebrow">${AT_NAME[k]}</span><input type="number" id="edA-${k}" min="1" max="10" value="${p.at[k]}" style="width:64px"></label>`).join('')}</div>`).join('')}
  <div class="acts" style="justify-content:flex-start"><button class="btn primary" data-a="ed-pl-save" data-id="${p.id}">Guardar</button></div></section>`:''}</div>`;
 }
 if(tab==='names'){
  return seg+intro+`<section class="panel"><div class="panel-h"><h2>Ligas y países</h2></div>
  ${COUNTRIES.map((c,i)=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="filters"><label class="f"><span class="eyebrow">País</span><input id="edCn-${i}" value="${esc((S.cNames||{})[i]||'')}" placeholder="${esc(c.n)}"></label>
   ${S.leagues.filter(L=>L.c===i).map(L=>`<label class="f"><span class="eyebrow">${LV_NAMES[L.lv]}</span><input id="edLn-${L.id}" value="${esc((S.lgNames||{})[L.id]||'')}" placeholder="${esc(LV_NAMES[L.lv])}"></label>`).join('')}</div></div>`).join('')}
  <p class="small muted" style="margin:8px 0">Deja un campo vacío para usar el nombre original.</p><button class="btn primary" data-a="ed-names-save">Guardar nombres</button></section>`;
 }
 return seg+`<div class="grid"><section class="panel"><div class="panel-h"><h2>Exportar</h2></div>
 <div class="stack" style="gap:8px"><button class="btn" data-a="io-mod">Mod con tus cambios (JSON)</button><button class="btn" data-a="io-mod-all">Mod completo con todos los jugadores (JSON)</button><button class="btn" data-a="io-clubs">Clubes (CSV para Excel o Sheets)</button><button class="btn" data-a="io-squad">Jugadores de tu club (CSV)</button><button class="btn" data-a="io-players">Todos los jugadores (CSV, archivo grande)</button></div>
 <p class="small muted" style="margin:10px 0 0">Los CSV se abren con Excel, Numbers o Google Sheets. Cambia lo que quieras (nombres, colores en formato #rrggbb, atributos del 1 al 10…) y vuelve a importarlos.</p></section>
 <section class="panel"><div class="panel-h"><h2>Importar</h2></div>
 <label class="f"><span class="eyebrow">Archivo (JSON o CSV)</span><input type="file" id="ioFile" accept=".json,.csv,.txt,application/json,text/csv"></label>
 <label class="f" style="margin-top:10px"><span class="eyebrow">O pega aquí el contenido</span><textarea id="ioTxt" style="width:100%;height:120px;font:12px var(--f-num);border:1px solid var(--line);border-radius:4px;background:var(--surface);color:var(--ink)"></textarea></label>
 <div class="acts" style="justify-content:flex-start"><button class="btn" data-a="io-check">Comprobar sin importar</button><button class="btn primary" data-a="io-paste">Importar texto</button></div>
 ${S.ioMsg?`<div class="negmsg ${S.ioMsg.ok&&!S.ioMsg.nE?'ok':'no'}">${esc(S.ioMsg.msg)}</div>${modReport(S.ioMsg)}`:''}
 <p class="small muted" style="margin:10px 0 0">Un mod en JSON trae nombres y colores de clubes, nombres de ligas y países y los jugadores que hayas editado. En los CSV de jugadores, si no hay columna id, se asignan por club y posición.</p></section></div>`;
}
