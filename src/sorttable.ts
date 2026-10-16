/* El Banquillo · sorttable.ts — Ordenar cualquier tabla tocando su cabecera (como en FM): primero de mayor a menor, otro toque al revés. */
// @ts-nocheck — usa el estado heredado S.
import {RT,S} from './state';

const POS=['POR','LI','DFC','LD','MCD','MI','MC','MD','MCO','EI','ED','DC'];
/** Valor de una celda para ordenar: posición en el campo, número (con k/M de dinero) o texto. */
export function cellVal(td){
 if(!td)return null;if(td.dataset&&td.dataset.v!=null)return +td.dataset.v;
 const t=(td.textContent||'').replace(/\s+/g,' ').trim();if(!t||t==='—'||t==='-'||t==='–')return null;
 const w=t.split(' ')[0];if(POS.includes(w))return 100-POS.indexOf(w);
 const m=t.replace(/[€$£]/g,'').match(/^([+\-−]?)\s*(\d+(?:[.,]\d+)?)\s*([kKM])?/);
 if(m){let n=parseFloat(m[2].replace(',','.'));if(m[3]==='M')n*=1e6;else if(m[3])n*=1e3;return m[1]&&m[1]!=='+'?-n:n;}
 return t.toLowerCase();
}
const keyOf=tb=>{const all=[...document.querySelectorAll('main table')];return [S&&S.view,S&&S.plTab,JSON.stringify((S&&S.vt)||{}),all.indexOf(tb)].join('|');};
function sortTable(tb,col,dir){
 const body=tb.tBodies[0];if(!body)return;const rows=[...body.rows];if(rows.length<2)return;
 const v=rows.map((r,i)=>({r,i,v:cellVal(r.cells[col])}));
 v.sort((a,b)=>{if(a.v==null&&b.v==null)return a.i-b.i;if(a.v==null)return 1;if(b.v==null)return -1;
  const c=typeof a.v==='number'&&typeof b.v==='number'?a.v-b.v:String(a.v).localeCompare(String(b.v),'es');return (c*dir)||a.i-b.i;});
 v.forEach(x=>body.appendChild(x.r));
 [...tb.tHead.rows[0].cells].forEach((th,i)=>{th.classList.toggle('sorted',i===col);th.dataset.dir=i===col?(dir>0?'asc':'desc'):'';});
}
/** Tras cada repintado, vuelve a aplicar el orden que eligió el jugador. */
export function applySorts(){RT.sorts=RT.sorts||{};document.querySelectorAll('main table').forEach(tb=>{const s=RT.sorts[keyOf(tb)];if(s&&tb.tHead)sortTable(tb,s.col,s.dir);});}
if(typeof document!=='undefined')document.addEventListener('click',e=>{
 const th=e.target.closest&&e.target.closest('main thead th');if(!th||th.closest('[data-nosort]'))return;
 const tb=th.closest('table'),col=[...th.parentNode.cells].indexOf(th);if(!tb.tBodies[0]||tb.tHead.rows.length!==1)return;
 RT.sorts=RT.sorts||{};const k=keyOf(tb),cur=RT.sorts[k];
 const first=cellVal([...tb.tBodies[0].rows].map(r=>r.cells[col]).find(c=>cellVal(c)!=null));
 const dir=cur&&cur.col===col?-cur.dir:(typeof first==='number'?-1:1);
 RT.sorts[k]={col,dir};sortTable(tb,col,dir);
});
