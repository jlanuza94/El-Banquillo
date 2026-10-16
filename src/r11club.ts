/* El Banquillo · r11club.ts — Recurrir sanciones, subastas por tus joyas, peleas en el vestuario, patrocinadores
 * negociables (principal y de manga), redes sociales con rumores, récords de cada liga y árbol de habilidades. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,rnd,shuffle} from './core';
import {LG,PL,S,T,lgName,lunit,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {fanSay} from './fans';
import {relations} from './relations';
import {licence,mgrLevel} from './mgrcareer';

/* ---------- 1. Recurrir una sanción ---------- */
export const appealFee=()=>r3(Math.max(.002,lunit(uLg())*.04));
/** Al caer una sanción a un jugador tuyo: el club puede recurrirla (una vez). */
export function appealOffer(p){if(!p||p.team!==S.user||!(p.susp>0))return;S.apl=S.apl||{};if(S.apl[p.id]===S.seasonN)return;
 news(`El comité sanciona a ${p.name} con ${p.susp} partido${p.susp>1?'s':''}. Puedes recurrir (${money(appealFee())} en abogados): si el comité te da la razón, se le rebaja un partido.`,'bad',{cat:'pla',subj:`Sanción a ${p.name}: ¿recurres?`,act:[{l:`Recurrir (${money(appealFee())})`,a:'appeal',id:p.id}]});}
/** Resultado del recurso. */
export function appeal(id){const p=PL(id);S.apl=S.apl||{};if(!p||p.team!==S.user||!(p.susp>0))return 'Ya no hay sanción que recurrir.';if(S.apl[id]===S.seasonN)return 'Ya recurriste esta temporada por este jugador.';
 S.apl[id]=S.seasonN;S.budget=r3(S.budget-appealFee());const ok=rnd()<(p.susp>=3?.4:.3);
 if(ok){p.susp--;news(`✅ Recurso aceptado: a ${p.name} le rebajan la sanción${p.susp?` a ${p.susp} partido${p.susp>1?'s':''}`:': puede jugar el próximo partido'}.`,'good',{cat:'pla'});return `Recurso aceptado: ${p.name} cumple un partido menos.`;}
 news(`❌ Recurso desestimado: ${p.name} cumplirá sus ${p.susp} partido${p.susp>1?'s':''} de sanción.`,'bad',{cat:'pla'});return 'El comité mantiene la sanción.';}

/* ---------- 2. Subasta por una joya tuya ---------- */
/** Arranca la subasta: el club que preguntó primero y 1-2 más pujan durante unos días. */
export function startAuction(p,first,cands){
 const others=shuffle(cands.filter(t=>t.id!==first.id)).slice(0,1+(rnd()<.5?1:0));
 const base=r2(p.value*(1.3+rnd()*.4));S.auc={pid:p.id,end:(S.day??0)+4,bids:[{t:first.id,a:base}],cl:[first.id,...others.map(t=>t.id)]};
 S.offers[p.id]={team:first.id,amount:base,incoming:true,big:1,auc:1};
 news(`🔨 ¡Subasta por ${p.name}! ${first.name} abre con ${money(base)} y ${others.map(t=>t.name).join(' y ')} ${others.length>1?'también quieren':'también quiere'} entrar. Durante 4 días las ofertas pueden subir: acepta cuando quieras o espera a la mejor.`,'good',{cat:'mer',subj:`🔨 Subasta por ${p.name}`,act:[{l:'Ver la mejor oferta',a:'offer-view',id:p.id},{l:'Ver ficha',a:'ficha',id:p.id}]});
}
/** Cada día: algún club sube su puja hasta que termina. */
export function aucDaily(){const A=S.auc;if(!A)return;const p=PL(A.pid),o=S.offers[A.pid];
 if(!p||p.team!==S.user||!o||!o.auc){S.auc=null;return;}
 if((S.day??0)>=A.end){S.auc=null;news(`🔨 Se cierra la subasta por ${p.name}: la mejor oferta es de ${T(o.team).name}, ${money(o.amount)}. Respóndela antes de la próxima jornada.`,'',{cat:'mer',subj:`Subasta cerrada: ${p.name}`,act:[{l:'Ver oferta',a:'offer-view',id:p.id}]});return;}
 if(rnd()>.6)return;const who=A.cl.filter(id=>id!==o.team&&T(id));if(!who.length)return;const tid=pick(who),amt=r2(o.amount*(1.06+rnd()*.1));
 A.bids.push({t:tid,a:amt});S.offers[A.pid]={team:tid,amount:amt,incoming:true,big:1,auc:1};
 news(`🔨 ${T(tid).name} sube la puja por ${p.name}: ${money(amt)}.`,'good',{cat:'mer',key:'auc'+p.id,subj:`Puja por ${p.name}: ${money(amt)}`,act:[{l:'Ver oferta',a:'offer-view',id:p.id}]});}
/** Pujas de la subasta en curso para un jugador (para la ventana de la oferta). */
export const aucBids=pid=>S.auc&&S.auc.pid===pid?S.auc.bids.slice().reverse():null;

/* ---------- 3. Peleas en el vestuario ---------- */
/** De vez en cuando dos jugadores que se llevan mal acaban discutiendo en el entrenamiento. */
export function fightWeekly(force){
 if(S.user==null||(!force&&(S.fight||rnd()>.07)))return null;const sq=squad(S.user).filter(p=>!p.loan&&!p.inj);
 for(const p of shuffle(sq.slice())){const R=relations(p);const n=R.neg.find(x=>x.p&&!x.p.loan&&x.p.team===S.user);if(!n)continue;const q=n.p;
  S.fight={a:p.id,b:q.id,w:S.week};p.hap=clamp((p.hap??70)-4,0,100);q.hap=clamp((q.hap??70)-4,0,100);
  news(`🥊 Bronca en el entrenamiento: ${p.name} y ${q.name} se han encarado delante de todos (${n.why.toLowerCase()}). El vestuario espera tu reacción.`,'bad',{cat:'pla',subj:`Pelea: ${p.name} y ${q.name}`,act:[{l:'Multar a los dos',a:'fight',v:'fine'},{l:'Reunirlos y hablar',a:'fight',v:'talk'},{l:'Dejarlo pasar',a:'fight',v:'ign'}]});
  return {p,q};}
 return null;}
/** Tu decisión tras la pelea. */
export function fightAct(v){const F=S.fight;if(!F||F.done)return 'Eso ya está resuelto.';const a=PL(F.a),b=PL(F.b);if(!a||!b){S.fight=null;return '';}F.done=1;
 if(v==='fine'){[a,b].forEach(p=>p.hap=clamp((p.hap??70)-6,0,100));S.budget=r3(S.budget+r3((a.wage+b.wage)*.5));squad(S.user).forEach(p=>{if(p!==a&&p!==b&&p.per==='pro')p.hap=clamp((p.hap??70)+2,0,100);});F.feud=0;return `Multa de media semana de sueldo a ${a.name} y ${b.name}. Están molestos, pero el vestuario ve que hay mano dura.`;}
 if(v==='talk'){const ok=rnd()<.62;[a,b].forEach(p=>p.hap=clamp((p.hap??70)+(ok?5:-3),0,100));F.feud=ok?0:1;return ok?`Hacen las paces: ${a.name} y ${b.name} se dan la mano delante del grupo.`:`La reunión no sale bien: ${a.name} y ${b.name} siguen sin hablarse.`;}
 F.feud=rnd()<.45?1:0;if(F.feud){[a,b].forEach(p=>p.hap=clamp((p.hap??70)-5,0,100));return `Lo dejas pasar… y el mal rollo sigue. ${a.name} y ${b.name} ya no se pasan el balón en los entrenamientos.`;}return 'Lo dejas pasar y se olvida en un par de días.';}
/** ¿Siguen enfadados? (para el vestuario y la química). */
export const feudPair=()=>S.fight&&S.fight.feud&&S.week-S.fight.w<8?[S.fight.a,S.fight.b]:null;
/** Química: si los dos que están peleados juegan juntos, el equipo pierde un poco. */
export function feudMult(lu){const f=feudPair();return f&&lu.includes(f[0])&&lu.includes(f[1])?.985:1;}
export function fightWeeklyTidy(){if(S.fight&&S.week-S.fight.w>=8)S.fight=null;}

/* ---------- 4. Patrocinadores: negociar y patrocinador de manga ---------- */
const SP2=['Cervezas del Norte','Talleres Rueda','Panadería La Espiga','Constructora Horizonte','Óptica Visión','Lácteos del Valle','Autoescuela Rápida','Clínica Dental Sonrisa'];
export function genSleeve(){const u=lunit(uLg()),n=shuffle(SP2.slice());S.sponsor2=null;S.sp2Offers=[0,1].map(i=>({name:n[i],weekly:r3(u*(.06+rnd()*.05))}));}
/** Pedir más dinero a una oferta: puede subir, quedarse igual o retirarse. */
export function negSponsor(i,second){const L=second?S.sp2Offers:S.spOffers,o=L&&L[i];if(!o)return 'Esa oferta ya no está.';if(o.neg)return `${o.name} ya te dio su última palabra.`;o.neg=1;
 const r=rnd();if(r<.5){const k=1.12+rnd()*.1;['weekly','win','obj'].forEach(f=>{if(o[f])o[f]=r3(o[f]*k);});return `${o.name} acepta mejorar su oferta un ${Math.round((k-1)*100)}%.`;}
 if(r<.8)return `${o.name} no se mueve: es su última oferta.`;
 if(L.length>1){L.splice(i,1);return `${o.name} se siente presionado y retira su oferta.`;}return `${o.name} no se mueve: es su última oferta.`;}
export function pickSleeve(i){const o=S.sp2Offers&&S.sp2Offers[i];if(!o)return '';S.sponsor2=o;news(`Patrocinio de manga: firmas con ${o.name} por ${money(o.weekly)}/sem.`,'good',{cat:'dir'});return '';}
export const sleeveIncome=()=>S.sponsor2?S.sponsor2.weekly:0;

/* ---------- 5. Redes sociales: rumores, jugadores y prensa ---------- */
const J=['@MercadoAlDía','@RumorFútbol','@ElChiringo_FC','@PeriodistaDeCampo','@InfoFichajes'];
/** Cada semana: los periodistas cuentan rumores (algunos ciertos) y los jugadores publican. */
export function socialWeekly(){
 if(S.user==null)return;const sq=squad(S.user).filter(p=>!p.loan);if(!sq.length)return;
 const I=S.interest||{},hot=Object.keys(I).filter(id=>PL(id)&&PL(id).team===S.user&&I[id].length);
 if(hot.length&&rnd()<.6){const p=PL(pick(hot)),t=T(I[p.id][0]);fanSay(`🚨 ${t.name} prepara una oferta por ${p.name}. Hablan de ${money(r2(p.value*(1.1+rnd()*.5)))}. Os iré contando.`,0,pick(J));}
 else if(rnd()<.35){const p=pick(sq.filter(x=>x.ovr>=50)||sq)||pick(sq),c=S.teams.filter(t=>t.id!==S.user&&t.rep>=p.ovr);if(c.length)fanSay(`Ojo: me dicen que ${pick(c).name} pregunta por ${p.name}. Rumor sin confirmar. 👀`,0,pick(J));}
 if(rnd()<.4){const p=pick(sq);const h='@'+p.name.split(' ').map(x=>x.toLowerCase()).join('_').normalize('NFD').replace(/[̀-ͯ]/g,'');
  fanSay(pick([`Semana de trabajo duro 💪 A por el próximo. #${(T(S.user).short||'').toUpperCase()}`,`Gracias por el cariño de siempre, afición ❤️`,`Recuperación, gimnasio y a seguir 🔁`,`Orgulloso de este grupo. Vamos!! ⚽`]),1,h);}
}
/** Me gusta y compartidos de un mensaje (depende de la masa social). */
export function socLikes(i,txt){const fans=S.club?S.club.fans:2000;let h=0;for(const c of String(txt))h=(h*31+c.charCodeAt(0))|0;const r=((h>>>0)%1000)/1000;return [Math.max(1,Math.round(fans*(.004+.03*r))),Math.max(0,Math.round(fans*(.0008+.006*r)))];}

/* ---------- 6. Récords de cada liga ---------- */
/** Al cerrar la temporada: puntos, goles y máximo goleador históricos de cada liga, y títulos por club. */
export function leagueRecords(tabs){
 const R=S.lrec||(S.lrec={}),lbl=seasonLabel(),best={};
 Object.values(S.players).forEach(p=>{if(p.team==null||!p.goals)return;const t=T(p.team);if(!t)return;const b=best[t.lg];if(!b||p.goals>b.goals)best[t.lg]=p;});
 S.leagues.forEach((L,i)=>{const tb=tabs[i];if(!tb||!tb.length)return;const r=R[L.id]||(R[L.id]={t:{}});const ch=tb[0];
  r.t[ch.id]=(r.t[ch.id]||0)+1;if(!r.pts||ch.pts>r.pts[0])r.pts=[ch.pts,T(ch.id).name,lbl];
  const gf=tb.slice().sort((a,b)=>b.gf-a.gf)[0];if(!r.gf||gf.gf>r.gf[0])r.gf=[gf.gf,T(gf.id).name,lbl];
  const gc=tb.slice().sort((a,b)=>a.gc-b.gc)[0];if(!r.gc||gc.gc<r.gc[0])r.gc=[gc.gc,T(gc.id).name,lbl];
  const p=best[L.id];if(p&&(!r.sc||p.goals>r.sc[0]))r.sc=[p.goals,p.name,T(p.team).name,lbl];});
}
export function leagueRecHTML(lg,esc){const r=S.lrec&&S.lrec[lg];
 if(!r)return `<section class="panel"><div class="panel-h"><h2>Récords de la liga</h2></div><div class="empty small">Se apuntan al terminar cada temporada.</div></section>`;
 const tit=Object.entries(r.t||{}).filter(([id])=>T(id)).sort((a,b)=>b[1]-a[1]).slice(0,5);
 return `<section class="panel"><div class="panel-h"><h2>Récords de ${esc(lgName(lg))}</h2><span class="eyebrow">Desde que empezaste</span></div><div class="kv" style="margin-top:0">
 ${r.pts?`<span>Más puntos de un campeón</span><b>${r.pts[0]} · ${esc(r.pts[1])} (${esc(r.pts[2])})</b>`:''}
 ${r.gf?`<span>Más goles de un equipo</span><b>${r.gf[0]} · ${esc(r.gf[1])} (${esc(r.gf[2])})</b>`:''}
 ${r.gc?`<span>Menos goles encajados</span><b>${r.gc[0]} · ${esc(r.gc[1])} (${esc(r.gc[2])})</b>`:''}
 ${r.sc?`<span>Más goles de un jugador</span><b>${r.sc[0]} · ${esc(r.sc[1])}, ${esc(r.sc[2])} (${esc(r.sc[3])})</b>`:''}
 ${tit.length?`<span>Campeones</span><b>${tit.map(([id,n])=>`${esc(T(id).name)} ${n}`).join(' · ')}</b>`:''}</div></section>`;}

/* ---------- 7. Árbol de habilidades del entrenador ---------- */
export const TREE={tac:['🧠','Táctico',['+1 en Táctica: tu equipo rinde algo más en cada partido.','+2 en Táctica: un poco más de rendimiento.','+3 en Táctica: lectura de partido de élite.']],
 mot:['🔥','Motivador',['+1 en Motivación: vestuario más unido.','+2: el grupo aguanta mejor las malas rachas.','+3: tu vestuario es una piña.']],
 can:['🌱','Formador',['+1 en Cantera: los jóvenes crecen más rápido.','+2: crecen más rápido todavía.','+3: tu cantera es una fábrica de talento.']],
 neg:['🤝','Negociador',['+1 en Negociación: fichajes algo más baratos.','+2: aún más baratos.','+3: sacas las mejores rebajas.']],
 ojo:['🔭','Ojeador',['Conoces antes a los jugadores que ojeas.','Los conoces todavía antes: ves su nivel real con menos informes.','Ojo de lince: casi no necesitas informes.']],
 fis:['💪','Preparador físico',['Menos lesiones y recuperación más rápida.','Todavía menos lesiones.','Tu plantilla casi no se rompe.']]};
export const specLv=k=>Math.min(3,((S.mgr&&S.mgr.spec)||[]).filter(x=>x===k).length);
/** Puntos de habilidad: uno por licencia y uno cada 4 niveles de experiencia. */
export const skillPts=()=>Math.max(0,licence()+1)+Math.floor(mgrLevel()/4);
export const skillFree=()=>skillPts()-((S.mgr&&S.mgr.spec)||[]).length;
/** El nivel 2 pide licencia B; el 3, licencia A. */
export const tierReq=n=>n<=1?-1:n===2?1:2;
export function pickSkill(k){const M=S.mgr;if(!M||!TREE[k])return '';M.spec=M.spec||[];const n=specLv(k)+1;
 if(n>3)return 'Ya tienes esa rama al máximo.';if(skillFree()<=0)return 'No te quedan puntos: sácate licencias y gana experiencia.';if(licence()<tierReq(n))return `El nivel ${n} pide licencia ${n===2?'B':'A'}.`;
 M.spec.push(k);news(`Nueva habilidad: ${TREE[k][1]} nivel ${n}. ${TREE[k][2][n-1]}`,'good',{cat:'dir'});return `${TREE[k][1]} sube a nivel ${n}.`;}
export function skillTreeHTML(esc){const free=skillFree();
 return `<section class="panel"><div class="panel-h"><h2>Árbol de habilidades</h2><span class="eyebrow">${free>0?`${free} punto${free>1?'s':''} libre${free>1?'s':''}`:'Sin puntos libres'}</span></div>
 <p class="small muted" style="margin:0 0 8px">Ganas un punto por cada licencia y otro cada 4 niveles de experiencia. El nivel 2 de cada rama pide licencia B y el 3, licencia A.</p>
 <div class="skilltree">${Object.entries(TREE).map(([k,[ic,n,L]])=>{const lv=specLv(k);return `<div class="skbr"><div class="skh"><span>${ic}</span><b>${esc(n)}</b><span class="small muted">${lv}/3</span></div>
 ${L.map((d,i)=>`<div class="sknode ${i<lv?'on':i===lv&&free>0&&licence()>=tierReq(i+1)?'next':'lock'}"><span class="small">${i+1}</span><span class="small">${esc(d)}</span></div>`).join('')}
 ${lv<3?`<button class="btn sm ${free>0&&licence()>=tierReq(lv+1)?'primary':''}" data-a="skill" data-v="${k}" ${free>0&&licence()>=tierReq(lv+1)?'':'disabled'}>Subir a nivel ${lv+1}</button>`:'<span class="small muted">Rama completa</span>'}</div>`;}).join('')}</div></section>`;}
