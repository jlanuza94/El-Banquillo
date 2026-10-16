/* El Banquillo · views/fiplus.ts — Más ficha de jugador: el plan individual (carga, foco, puesto y rasgo, con su progreso)
 * y los datos avanzados (mapa de calor y cómo se compara con los de su puesto en su liga, en percentiles). */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {ATTRS,AT_NAME,GRP,SPN,TRAITS} from '../data';
import {S,T} from '../state';
import {ILOAD,pLoad} from '../tcenter';
import {learnablePos,learnableTr} from '../devplus';

const FOCO=p=>ATTRS.filter(k=>(p.pos==='POR'||k!=='por')&&!['lid','con','gra'].includes(k));
const bar=v=>`<span class="fpb"><i style="width:${Math.round(v||0)}%"></i></span>`;
/** Ficha › Desarrollo: todo el plan individual en un sitio y si está funcionando. */
export function fiPlanHTML(p){
 const l=pLoad(p),D=p.dev&&typeof p.dev==='object'?p.dev:{},f=p.tf||'auto';
 const d=f!=='auto'&&f!=='rol'&&p.atm&&p.at[f]!=null&&p.atm[f]!=null?Math.round((p.at[f]-p.atm[f])*10):null;
 const how=f==='auto'?'Trabaja lo que entrene el equipo cada semana, ajustado a su puesto.':f==='rol'?'Trabaja siempre lo más flojo de lo que necesita su puesto.':d==null?'Aún no hay datos de este mes.':d>0?`Este mes: ${AT_NAME[f].toLowerCase()} +${d} ✓`:'Este mes sin avances: prueba carga alta, más minutos o mejores entrenadores.';
 const sel=(k,list,names)=>`<select data-dev="${p.id}|${k}"><option value="" ${!D[k]?'selected':''}>— Nada —</option>${list.map(x=>`<option value="${x}" ${D[k]===x?'selected':''}>${esc(names[x])}</option>`).join('')}</select>`;
 return `<h3 style="margin:0 0 4px">Plan individual</h3><p class="small muted" style="margin:0 0 8px">Decide cómo entrena ${esc(p.name.split(' ')[0])}. El informe mensual de progreso te dirá si el plan funciona.</p>
 <div class="fplan"><span class="fpl">Carga</span><div class="seg tcil">${Object.entries(ILOAD).map(([k,v])=>`<button data-a="tc-load" data-id="${p.id}" data-v="${k}" aria-pressed="${l===k}" title="${esc(v.d)}">${v.n}</button>`).join('')}</div>
 <span class="fpl">Foco</span><div><select data-tf="${p.id}"><option value="auto" ${f==='auto'?'selected':''}>Según las sesiones</option><option value="rol" ${f==='rol'?'selected':''}>Lo más flojo de su puesto</option>${FOCO(p).map(k=>`<option value="${k}" ${f===k?'selected':''}>${AT_NAME[k]} (${Math.round(p.at[k]*10)})</option>`).join('')}</select><div class="small ${d>0?'pos':d===0?'neg':'muted'}">${how}</div></div>
 <span class="fpl">Aprender puesto</span><div>${sel('pos',learnablePos(p),SPN)}${D.pos?`<div class="small muted">${esc(SPN[D.pos])}: ${Math.round(D.posP||0)}% ${bar(D.posP)}</div>`:''}</div>
 <span class="fpl">Aprender rasgo</span><div>${sel('tr',learnableTr(p),TRAITS)}${D.tr?`<div class="small muted">${esc(TRAITS[D.tr])}: ${Math.round(D.trP||0)}% ${bar(D.trP)}</div>`:''}</div></div>
 <p class="small muted" style="margin:8px 0 0">${esc(ILOAD[l].d)} Mejoras esta temporada: <b>${p.sg?'+'+p.sg:'ninguna'}</b>.</p>`;
}
/* ---------- Datos avanzados ---------- */
const XY={POR:[6,50],LI:[26,14],DFC:[22,50],LD:[26,86],MCD:[38,50],MI:[54,14],MC:[52,50],MD:[54,86],MCO:[68,50],EI:[78,16],DC:[86,50],ED:[78,84]};
/** Mapa de calor: dónde suele moverse según su puesto, los puestos que domina y cómo juega. */
export function heatHTML(p){
 const s=p.st||{},fw=((s.g||0)+(s.dr||0)*.3)/Math.max(1,s.pj||1),bk=(s.tk||0)/Math.max(1,s.pj||1);
 const pts=[[p.sp,1]].concat((p.alt||[]).slice(0,2).map(x=>[x,.45]));let id=0;
 const blobs=pts.flatMap(([sp,w])=>{const [x,y]=XY[sp]||[50,50],dx=Math.min(10,fw*6)-Math.min(8,bk*1.5);return [[x+dx*.5,y,16*w,.85*w],[x+dx+6,y+(y<40?6:y>60?-6:8),11*w,.5*w],[x-8,y+(y<40?4:y>60?-4:-8),10*w,.4*w]];});
 return `<h3 style="margin:12px 0 6px">Mapa de calor</h3><svg class="heat" viewBox="0 0 100 64" role="img" aria-label="Mapa de calor de ${esc(p.name)}"><defs><radialGradient id="hg"><stop offset="0" stop-color="#ff3b1f" stop-opacity=".95"/><stop offset=".45" stop-color="#ffb21f" stop-opacity=".6"/><stop offset="1" stop-color="#ffe14d" stop-opacity="0"/></radialGradient></defs>
 <rect width="100" height="64" rx="2" fill="#2f7d3c"/><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5"><rect x="1" y="1" width="98" height="62"/><line x1="50" y1="1" x2="50" y2="63"/><circle cx="50" cy="32" r="8"/><rect x="1" y="18" width="14" height="28"/><rect x="85" y="18" width="14" height="28"/></g>
 ${blobs.map(([x,y,r,o])=>`<ellipse cx="${Math.max(4,Math.min(96,x))}" cy="${Math.max(4,Math.min(60,y*.64))}" rx="${r}" ry="${r*.75}" fill="url(#hg)" opacity="${o}"/>`).join('')}<text x="97" y="61" text-anchor="end" font-size="4" fill="rgba(255,255,255,.7)">ataca →</text></svg>`;
}
const MET=[['g','Goles'],['a','Asistencias'],['xg','xG'],['kp','Pases clave'],['dr','Regates'],['tk','Entradas'],['du','Duelos ganados'],['nota','Nota media']];
const v90=(q,k)=>{const s=q.st;if(k==='nota')return s.rs/s.pj;const v=k==='xg'?(s.xg||0)/100:(s[k]||0);return v/s.mi*90;};
/** Cómo se compara con los de su línea en su liga (por 90 minutos). 50 = la media. */
export function percHTML(p){
 const s=p.st;if(!s||(s.mi||0)<180||p.team==null)return '';const g=GRP[p.sp]||p.pos,lg=T(p.team).lg;
 const peers=Object.values(S.players).filter(q=>q.team!=null&&T(q.team)&&T(q.team).lg===lg&&(GRP[q.sp]||q.pos)===g&&q.st&&q.st.mi>=180&&q.st.pj);
 if(peers.length<6)return '';
 const rows=MET.filter(([k])=>!(g==='POR'&&['g','a','xg','dr'].includes(k))).map(([k,n])=>{const me=v90(p,k),L=peers.map(q=>v90(q,k)),pc=Math.round(L.filter(x=>x<me).length/L.length*100);return [n,pc,k==='nota'?me.toFixed(2):me.toFixed(2)];});
 return `<h3 style="margin:12px 0 4px">Comparado con su puesto</h3><p class="small muted" style="margin:0 0 6px">Percentil frente a ${peers.length} ${({POR:'porteros',DEF:'defensas',MED:'centrocampistas',DEL:'delanteros'})[g]} de su liga, por 90 minutos. 50 es la media; 90 o más, de los mejores.</p>
 <div class="pctl">${rows.map(([n,pc,v])=>`<div class="pcr"><span>${n}</span><span class="pcb"><i class="${pc>=80?'q5':pc>=60?'q4':pc>=40?'q3':'q1'}" style="width:${Math.max(3,pc)}%"></i></span><b>${pc}</b><small>${v}</small></div>`).join('')}</div>`;
}
