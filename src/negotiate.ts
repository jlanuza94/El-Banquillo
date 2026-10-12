/* El Banquillo · negotiate.ts — Negociaciones más ricas:
 *  · primas por objetivos (por gol, por partido jugado y por ascenso) que abaratan el sueldo fijo;
 *  · cláusula de salida si el equipo desciende;
 *  · cláusula de recompra al vender;
 *  · el jugador contraoferta cuando tu propuesta se queda cerca. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,ri} from './core';
import {GRP} from './data';
import {LG,PL,S,T,setTeam,squad,uLg} from './state';
import {news} from './world';

/** Goles que espera marcar por semana según su posición (para valorar la prima por gol). */
const gpw=p=>({DEL:.42,MED:.13,DEF:.04,POR:0})[GRP[p.sp]||p.pos]||.1;
/** Lo que el jugador valora las primas, en «sueldo semanal equivalente». */
export function bonusWeekly(p,t){return(t.gb||0)*gpw(p)*.9+(t.ab||0)*.7+(t.pb||0)*.12/38;}
/** Primas en miles de € desde el formulario. */
export function readBonus(){const g=id=>document.getElementById(id),num=id=>parseFloat(g(id)?.value||'0')||0;return{gb:r3(num('tGoal')/1000),ab:r3(num('tApp')/1000),pb:r3(num('tPromo')/1000),rel:!!g('tRel')?.checked};}
/** Campos extra del formulario de contrato. */
export function bonusFields(p){
 const atk=['DEL','MED'].includes(GRP[p.sp]||p.pos),b=p.bon||{};
 return `<details style="margin-top:10px" ${b.gb||b.ab||b.pb||p.rel?'open':''}><summary class="small"><b>Primas y cláusulas</b> (opcional: abaratan el sueldo fijo)</summary>
 <div class="filters" style="margin-top:8px"><label class="f"><span class="eyebrow">Prima por gol (miles €)</span><input type="number" id="tGoal" min="0" step="0.5" value="${Math.round((b.gb||0)*2000)/2}" ${atk?'':'title="Para un defensa o portero vale poco"'}></label>
 <label class="f"><span class="eyebrow">Prima por partido (miles €)</span><input type="number" id="tApp" min="0" step="0.5" value="${Math.round((b.ab||0)*2000)/2}"></label>
 <label class="f"><span class="eyebrow">Prima por ascenso (miles €)</span><input type="number" id="tPromo" min="0" step="5" value="${Math.round((b.pb||0)*1000)}"></label></div>
 <label class="chk" style="margin-top:6px"><input type="checkbox" id="tRel" ${p.rel?'checked':''}> Cláusula de salida si descendemos (le da tranquilidad, pero si bajáis se irá gratis)</label>
 <p class="small muted" style="margin:6px 0 0">Las primas se pagan solo si se cumplen: por cada gol, por cada partido que juegue y al ascender. A un delantero le gusta mucho la prima por gol.</p></details>`;
}
/** Guarda primas y cláusulas en el contrato firmado. */
export function applyTerms(p,t){p.bon=(t.gb||t.ab||t.pb)?{gb:t.gb||0,ab:t.ab||0,pb:t.pb||0}:null;p.rel=t.rel?1:0;p.bpj=(p.st&&p.st.pj)||0;p.bg=(p.st&&p.st.g)||0;}
/** Cada jornada: paga las primas de los partidos jugados y los goles. Devuelve el total pagado. */
export function weeklyBonuses(){
 let tot=0;squad(S.user).forEach(p=>{const st=p.st||{},pj=st.pj||0,g=st.g||0;if(p.bon){const dp=Math.max(0,pj-(p.bpj||0)),dg=Math.max(0,g-(p.bg||0));tot+=dp*(p.bon.ab||0)+dg*(p.bon.gb||0);}p.bpj=pj;p.bg=g;});
 if(tot>0)S.budget=r3(S.budget-tot);return r3(tot);
}
/** Fin de temporada: primas de ascenso y salidas por la cláusula de descenso. */
export function seasonContracts(sm){
 const out=[];let paid=0;
 if(sm.up)squad(S.user).forEach(p=>{if(p.bon&&p.bon.pb){paid+=p.bon.pb;}});
 if(paid){S.budget=r3(S.budget-paid);news(`Primas por el ascenso: pagas ${money(paid)} a los jugadores que las tenían en su contrato.`,'',{cat:'dir'});}
 if(sm.down){const L=LG(uLg());squad(S.user).filter(p=>p.rel&&!p.loan).forEach(p=>{const to=S.teams.filter(t=>t.id!==S.user&&t.lg===L.id&&squad(t.id).length<26);if(!to.length)return;const t=pick(to);setTeam(p,t.id);p.contract=ri(2,4);p.rel=0;p.bon=null;out.push(`${p.name} (${t.name})`);});
  if(out.length)news(`Cláusula de descenso: se marchan gratis ${out.join(', ')}.`,'bad',{cat:'mer',subj:'Salidas por la cláusula de descenso'});}
 // los contadores se ponen a cero con la temporada nueva
 squad(S.user).forEach(p=>{p.bpj=0;p.bg=0;});
}

/* ---------- Cláusula de recompra ---------- */
export const BB_MULT=1.6,BB_YEARS=2;
/** Al vender con recompra: cobras un 10% menos, pero durante 2 temporadas puedes recuperarlo por el 160% de lo que pagaron. */
export function setBuyback(p,amount){p.bb={t:S.user,price:r2(amount*BB_MULT),until:S.seasonN+BB_YEARS};}
export const canBuyback=p=>!!(p&&p.bb&&p.bb.t===S.user&&p.team!==S.user&&p.team!==null&&S.seasonN<=p.bb.until);
export function doBuyback(p){
 if(!canBuyback(p))return 'La cláusula de recompra ya no está vigente.';if(p.bb.price>S.budget)return `No te llega el presupuesto: la recompra cuesta ${money(p.bb.price)}.`;
 const from=p.team,price=p.bb.price;S.budget=r3(S.budget-price);if(T(from).cash!=null)T(from).cash=r2(T(from).cash+price);
 setTeam(p,S.user);p.bb=null;p.role=p.role||'ro';p.hap=Math.max(p.hap??70,70);p.contract=Math.max(p.contract,2);
 news(`Ejecutas la cláusula de recompra: ${p.name} vuelve desde ${T(from).name} por ${money(price)}.`,'good',{cat:'mer',subj:`Recompra: ${p.name}`});return '';
}

/* ---------- Contraofertas del jugador ---------- */
/** Si tu propuesta se queda cerca, el jugador propone dos alternativas: más sueldo o algo más de sueldo con prima por gol o por partido. */
export function counters(p,t,ratio){
 if(ratio<.7||ratio>=1)return null;const extra=Math.max(.0005,(t.w+(t.bonus||0)/40+bonusWeekly(p,t))*(1/ratio-1));
 const c1={...t,w:r3(t.w+extra*1.02)};
 const atk=gpw(p)>=.13,c2=atk?{...t,w:r3(t.w+extra*.45),gb:r3((t.gb||0)+extra*.65/(gpw(p)*.9))}:{...t,w:r3(t.w+extra*.45),ab:r3((t.ab||0)+extra*.65/.7)};
 return[c1,c2];
}
export const counterTxt=(c,p)=>`${money(c.w)}/sem${c.gb?` + ${money(c.gb)} por gol`:''}${c.ab?` + ${money(c.ab)} por partido`:''}`;
