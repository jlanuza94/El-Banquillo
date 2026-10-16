/* El Banquillo · progress.ts — Informe mensual de progreso (como las flechas del FMM): cada 4 jornadas se compara a cada
 * jugador tuyo con cómo estaba el mes anterior, se apuntan las subidas y bajadas de cada atributo y te llega un resumen. */
// @ts-nocheck — usa el estado heredado S.
import {AT_NAME,ATTRS} from './data';
import {S,squad} from './state';
import {news} from './world';

const mine=()=>squad(S.user).filter(p=>!p.loan).concat(S.u19||[]);
/** Diferencias de un jugador con su foto del mes pasado, en puntos de 0 a 100. */
export function atDiff(p){if(!p.atm)return null;const d={};ATTRS.forEach(k=>{if(p.at[k]==null||p.atm[k]==null)return;const v=Math.round((p.at[k]-p.atm[k])*10);if(v)d[k]=v;});return d;}
/** Flecha para un atributo en la ficha (la del último informe). */
export const atArrow=(p,k)=>{const v=p.atd&&p.atd[k];return v?`<i class="atar ${v>0?'up':'dn'}" title="${v>0?'+':''}${v} el último mes">${v>0?'▲':'▼'}</i>`:'';};
export function progressMonthly(force){
 if(S.user==null||(!force&&(S.week%4!==0||S.progW===S.week)))return null;S.progW=S.week;
 const rows=[];
 const plans=mine().filter(p=>p.tf&&p.tf!=='auto'&&p.tf!=='rol'&&p.atm&&p.at[p.tf]!=null&&p.atm[p.tf]!=null).map(p=>[p,p.tf,Math.round((p.at[p.tf]-p.atm[p.tf])*10)]);
 mine().forEach(p=>{const d=atDiff(p);p.atd=d||{};if(d){const sum=Object.values(d).reduce((a,b)=>a+b,0),dov=Math.round(p.ovr-(p.ovm??p.ovr));if(sum||dov)rows.push({p,d,sum,dov});}
  p.atm={...p.at};p.ovm=p.ovr;});
 if(plans.length){const ok=plans.filter(x=>x[2]>0),no=plans.filter(x=>x[2]<=0);news(`Planes individuales del mes. ${ok.length?'Funcionan: '+ok.map(([p,k,d])=>`${p.name} (${AT_NAME[k].toLowerCase()} +${d})`).join(', ')+'.':''}${no.length?` Sin avances: ${no.map(([p,k])=>`${p.name} (${AT_NAME[k].toLowerCase()})`).join(', ')}. Prueba más carga, más minutos o mejores entrenadores.`:''}`,ok.length>=no.length?'good':'',{cat:'pla',subj:`🎯 Planes individuales: ${ok.length} de ${plans.length} funcionan`,act:plans.slice(0,3).map(([p])=>({l:p.name.split(' ').slice(-1)[0],a:'ficha',id:p.id}))});}
 if(!rows.length)return rows;
 const up=rows.filter(r=>r.sum>0).sort((a,b)=>b.sum-a.sum).slice(0,5),dn=rows.filter(r=>r.sum<0).sort((a,b)=>a.sum-b.sum).slice(0,3);
 const det=r=>Object.entries(r.d).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3).map(([k,v])=>`${AT_NAME[k].toLowerCase()} ${v>0?'▲+':'▼'}${v}`).join(', ');
 const txt=(up.length?`Los que más crecen: ${up.map(r=>`${r.p.name}${r.dov?` (media ${r.dov>0?'+':''}${r.dov})`:''}: ${det(r)}`).join(' · ')}.`:'Este mes nadie ha dado un paso adelante.')+(dn.length?` Bajan: ${dn.map(r=>`${r.p.name}: ${det(r)}`).join(' · ')}.`:'');
 news(`Informe de progreso del mes. ${txt} Mira las flechas en la ficha de cada jugador.`,up.length?'good':'',{cat:'pla',subj:`📈 Progreso del mes${up[0]?': '+up[0].p.name+' vuela':''}`,act:up.slice(0,3).map(r=>({l:r.p.name.split(' ').slice(-1)[0],a:'ficha',id:r.p.id}))});
 return rows;
}
