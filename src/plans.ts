/* El Banquillo · plans.ts — Tácticas guardadas (A, B y C), aprendizaje de la táctica y jugadas ensayadas. */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {GRP,TAC0,TACS} from './data';
import {PL,S,T} from './state';
import {eff,setFormation,slotsOf,userRoles} from './tactics';
import {remapRoles} from './roles';

export const SLOTS=['A','B','C'];
/** Guarda la táctica actual (formación, mentalidad, instrucciones, roles e instrucciones al rival) en A, B o C. */
export function savePlan(k,name){
 const t=T(S.user);t.plans=t.plans||{};
 t.plans[k]={name:name||(t.plans[k]&&t.plans[k].name)||`Táctica ${k}`,formation:t.formation,ment:t.ment,tac:Object.assign({},TAC0,t.tac||{}),roles:userRoles().slice(),duty:(t.duty||[]).slice(),pi:(t.pi||[]).map(x=>x.slice()),oi:Object.assign({},t.oi||{})};
 t.curPlan=k;
}
export function loadPlan(k){
 const t=T(S.user),P=t.plans&&t.plans[k];if(!P)return false;
 if(P.formation!==t.formation)setFormation(P.formation);
 t.ment=P.ment;t.tac=Object.assign({},P.tac);t.roles=P.roles.length===slotsOf(t.formation).length?P.roles.slice():t.roles;t.oi=Object.assign({},P.oi);if(P.duty&&P.duty.length===slotsOf(t.formation).length){t.duty=P.duty.slice();t.pi=(P.pi||[]).map(x=>x.slice());}t.curPlan=k;
 return true;
}
/** Reparte a los jugadores en los huecos de otra formación (los mismos 11, cada uno donde mejor encaja). */
export function remapXI(ids,newF){
 const slots=slotsOf(newF),left=ids.filter(id=>id&&PL(id)),lu=Array(slots.length).fill(null);
 const pass=ok=>slots.forEach((s,i)=>{if(lu[i])return;const k=left.findIndex(id=>ok(PL(id),s));if(k>=0){lu[i]=left[k];left.splice(k,1);}});
 pass((p,s)=>p.sp===s);pass((p,s)=>p.alt&&p.alt.includes(s));pass((p,s)=>GRP[p.sp]===GRP[s]);
 slots.forEach((s,i)=>{if(lu[i]||!left.length)return;left.sort((x,y)=>eff(PL(y),s)-eff(PL(x),s));lu[i]=left.shift();});
 return lu;
}
/** Cambia de táctica en pleno partido: formación, mentalidad, instrucciones, roles e instrucciones al rival. */
export function planInMatch(m,k){
 const t=T(m[m.us]),P=t.plans&&t.plans[k];if(!P)return false;const us=m.us;
 if(P.formation!==m.f[us]){const oldSl=slotsOf(m.f[us]);m.lu[us]=remapXI(m.lu[us],P.formation);m.ro[us]=remapRoles(oldSl,m.ro[us],slotsOf(P.formation));m.f[us]=P.formation;}
 if(P.roles.length===slotsOf(m.f[us]).length)m.ro[us]=P.roles.slice();
 {const n=slotsOf(m.f[us]).length;if(m.du){if(P.duty&&P.duty.length===n){m.du[us]=P.duty.slice();m.pi[us]=(P.pi||[]).map(x=>x.slice());}else if(m.du[us]&&m.du[us].length!==n){m.du[us]=null;m.pi[us]=null;}}}
 m.ment[us]=P.ment;m.tac[us]=Object.assign({},P.tac);m.oi=m.oi||{};m.oi[us]=Object.assign({},P.oi);m.plan=k;
 return true;
}

/* ---------- Aprender la táctica ---------- */
/** Dominio de cada opción de las instrucciones (0-100). Sube al usarla en partidos y con el entrenamiento táctico. */
export function tfam(){
 if(!S.tfam){S.tfam={};Object.entries(TACS).forEach(([k,v])=>{S.tfam[k]={};Object.keys(v.o).forEach(o=>S.tfam[k][o]=o===TAC0[k]?70:35);});}
 return S.tfam;
}
/** Media del dominio de las instrucciones que usas ahora. */
export function planFam(tac){const F=tfam(),t=Object.assign({},TAC0,tac||{});const v=Object.keys(TACS).map(k=>F[k][t[k]]??35);return v.reduce((a,b)=>a+b,0)/v.length;}
/** Efecto en el partido: con una táctica que el equipo aún no domina rinde algo menos (hasta un 1,5%); muy trabajada, un poco más. */
export const famMult=tac=>clamp(.985+.015*planFam(tac)/70,.985,1.006);
/** Cada partido oficial con unas instrucciones las afianza; lo que no se usa se olvida poco a poco. */
export function learnTactic(tac,extra=0){
 const F=tfam(),t=Object.assign({},TAC0,tac||{});
 Object.keys(TACS).forEach(k=>Object.keys(F[k]).forEach(o=>{F[k][o]=clamp(F[k][o]+(o===t[k]?5+extra:-.6),15,100);}));
 S.spFam=clamp((S.spFam??40)+(extra?3:.5),0,100);
}

/* ---------- Jugadas ensayadas ---------- */
export const SP={
 co:{n:'Córners a favor',o:{pp:['Al primer palo','Busca la cabeza de tus rematadores: rinde con buenos cabeceadores.'],sp:['Al segundo palo','Centro largo para que remate el que llega: rinde con buen remate.'],cor:['En corto','Pocas ocasiones claras pero casi sin contragolpes. Rinde con buen pase.']}},
 cd:{n:'Córners en contra',o:{zon:['En zona','Cada uno defiende su espacio: depende del cabezazo de tu equipo.'],ind:['Al hombre','Cada uno marca a un rival: depende de la colocación y las entradas.']}},
 fk:{n:'Faltas cerca del área',o:{dir:['Tiro directo','El lanzador busca la portería.'],cen:['Centro al área','Más remates, menos goles directos.']}},
};
export const SP0={co:'pp',cd:'zon',fk:'dir'};
export const spOf=t=>Object.assign({},SP0,(t&&t.sp)||{});
/** Multiplicador de gol en un córner a favor según la jugada y los jugadores (y lo ensayada que está). */
export function cornerMult(attIds,ck,defIds,attSp,defSp,fam){
 const av=(ids,k)=>{const v=ids.map(id=>PL(id)).filter(Boolean).map(p=>p.at[k]??5);return v.length?v.reduce((a,b)=>a+b,0)/v.length:5;};
 const best=(ids,k)=>Math.max(5,...ids.map(id=>PL(id)).filter(Boolean).map(p=>p.at[k]??5));
 let f=attSp.co==='pp'?1+.1*(best(attIds,'cab')-6):attSp.co==='sp'?1+.1*(best(attIds,'tir')-6):.75+.05*((ck?ck.at.pas:5)-5);
 f*=defSp.cd==='zon'?1-.05*(av(defIds,'cab')-5):1-.05*((av(defIds,'col')+av(defIds,'def'))/2-5);
 return clamp(f,.4,1.8)*(.85+.3*(fam??40)/100);
}

/* ---------- Planes condicionales: tu segundo cambia la táctica según el marcador ---------- */
export const COND_W={win:'Vamos ganando',draw:'Vamos empatando',lose:'Vamos perdiendo'};
export const COND_MAX=3;
export const condsOf=t=>(t&&t.cond)||[];
/** Cada minuto de un partido tuyo: aplica la primera regla que se cumpla (cada regla, una vez). */
export function condTick(m,addEv,MENT){
 const us=m.us;if(!us||m.done)return;const t=T(m[us]),R=condsOf(t);if(!R.length)return;
 const o=us==='h'?'a':'h',d=m.score[us]-m.score[o],st=d>0?'win':d<0?'lose':'draw';m.condDone=m.condDone||{};
 R.forEach((r,i)=>{if(m.condDone[i]||m.min<r.min||r.w!==st)return;if(!r.plan&&!r.ment)return;m.condDone[i]=1;
  const P=[];if(r.plan&&planInMatch(m,r.plan))P.push(`táctica ${r.plan}`);if(r.ment){m.ment[us]=r.ment;P.push(`mentalidad ${MENT[r.ment].label.toLowerCase()}`);}
  if(P.length)addEv(m,'sys',null,`Plan previsto (${COND_W[st].toLowerCase()} en el ${r.min}'): ${T(m[us]).short} pasa a ${P.join(' y ')}.`);});
}
