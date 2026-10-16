/* El Banquillo · tcenter.ts — Centro de entrenamiento: catálogo de sesiones con propósito, semana con mañana y tarde,
 * responsables del cuerpo técnico por área, plan individual (carga y foco) e informe semanal de desarrollo.
 * Se apoya en el sistema anterior (S.sched, S.train) para que todo lo demás del juego siga funcionando igual. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,pick,rnd} from './core';
import {S,T,squad} from './state';
import {MATCH_DAY,PRESETS_T,applySched,sched} from './training2';
import {crew} from './staff';
import {learnTactic,tfam} from './plans';
import {nextMatch} from './competitions';

/** Categorías de sesión. */
export const TCATS={tec:{n:'Técnica',i:'🎯',c:'#3a8ae0'},tac:{n:'Táctica',i:'🧠',c:'#8e5be0'},fis:{n:'Físico',i:'🏃',c:'#e07a2a'},ata:{n:'Ataque',i:'⚽',c:'#d0452f'},def:{n:'Defensa',i:'🛡️',c:'#2f8f5a'},rec:{n:'Recuperación',i:'🧊',c:'#3bb0c9'},esp:{n:'Especiales',i:'⭐',c:'#d6a32b'}};
/** Áreas del cuerpo técnico: quién dirige cada tipo de sesión y con qué atributo. */
export const AREAS={tec:{n:'Técnica',cats:['tec'],role:['ent','seg'],at:'ent'},tac:{n:'Táctica',cats:['tac','esp'],role:['seg','ent'],at:'tac'},fis:{n:'Preparación física',cats:['fis'],role:['ent','fis'],at:'ent'},atd:{n:'Ataque y defensa',cats:['ata','def'],role:['ent','seg'],at:'ent'},rec:{n:'Recuperación',cats:['rec'],role:['fis'],at:'fis'}};
/** Catálogo: at = atributos que trabaja, load = carga (0 descanso … 3 muy dura), x = efectos especiales. ses = clave del sistema antiguo. */
export const DRILLS={
 rondo:{c:'tec',n:'Rondos',d:'Pase corto y toma de decisiones bajo presión.',at:['pas','dec'],load:1,ses:'tec'},
 control:{c:'tec',n:'Control y primer toque',d:'Recepción orientada y primer toque.',at:['pas','reg'],load:1,ses:'tec'},
 regate:{c:'tec',n:'Regate y uno contra uno',d:'Conducción, regate y desborde.',at:['reg','vel'],load:2,ses:'tec'},
 defin:{c:'tec',n:'Definición',d:'Tiro a puerta desde todas las posiciones.',at:['tir'],load:1,ses:'tec'},
 paselar:{c:'tec',n:'Pase largo y cambio de orientación',d:'Visión y precisión en el envío largo.',at:['pas','vis'],load:1,ses:'tec'},
 posic:{c:'tac',n:'Posicionamiento',d:'Distancias entre líneas y ocupación de espacios. Afianza la formación.',at:['col','dec'],load:1,ses:'tac',x:{fam:2,chem:.6}},
 presion:{c:'tac',n:'Presión coordinada',d:'Saltar a presionar juntos y cerrar líneas de pase.',at:['res','col'],load:2,ses:'tac',x:{tf:['pre','alt'],fam:1}},
 salida:{c:'tac',n:'Salida de balón',d:'Sacar el balón jugado desde atrás.',at:['pas','col'],load:1,ses:'tac',x:{tf:['est','pos'],fam:1}},
 transic:{c:'tac',n:'Transiciones',d:'Contraataque al robar y repliegue al perder.',at:['vel','dec'],load:2,ses:'tac',x:{tf:['rec','cont'],fam:1}},
 colect:{c:'tac',n:'Movimientos colectivos',d:'Automatismos de todo el equipo: química y dominio del sistema.',at:['dec','vis'],load:1,ses:'tac',x:{fam:2.5,chem:1.2}},
 fuerza:{c:'fis',n:'Fuerza',d:'Gimnasio y trabajo de fuerza.',at:['fis'],load:2,ses:'fis'},
 resis:{c:'fis',n:'Resistencia',d:'Volumen aeróbico: aguantan más los 90 minutos.',at:['res'],load:3,ses:'fis'},
 veloc:{c:'fis',n:'Velocidad',d:'Sprints, aceleración y cambios de ritmo.',at:['vel'],load:2,ses:'fis'},
 poten:{c:'fis',n:'Potencia',d:'Saltos y fuerza explosiva.',at:['fis','vel','cab'],load:3,ses:'fis'},
 final:{c:'ata',n:'Finalización',d:'Remate dentro del área y en el uno contra uno con el portero.',at:['tir','cab'],load:1,ses:'ata'},
 ocas:{c:'ata',n:'Creación de ocasiones',d:'Último pase y desmarques.',at:['vis','pas','reg'],load:1,ses:'ata'},
 centros:{c:'ata',n:'Centros y remate',d:'Centros desde la banda y ataque al área.',at:['pas','cab'],load:1,ses:'ata'},
 marcaje:{c:'def',n:'Marcaje',d:'Vigilancias y defensa al hombre.',at:['def','col'],load:1,ses:'def'},
 duelos:{c:'def',n:'Duelos',d:'Entradas, choque y balón dividido.',at:['def','fis'],load:2,ses:'def'},
 area:{c:'def',n:'Defensa del área',d:'Despejes, centros laterales y juego aéreo defensivo.',at:['cab','col'],load:1,ses:'def'},
 porteros:{c:'def',n:'Porteros',d:'Paradas, blocaje y juego con los pies (solo porteros).',at:['por'],load:1,ses:'def',gk:1},
 descanso:{c:'rec',n:'Descanso',d:'Día libre: recuperan mucha energía y la moral sube un poco.',at:[],load:0,ses:'des',x:{rest:2,hap:.4}},
 movil:{c:'rec',n:'Movilidad',d:'Estiramientos y movilidad: baja el riesgo de lesión.',at:[],load:0,ses:'rec',x:{rest:1.2,inj:-.3}},
 recup:{c:'rec',n:'Recuperación activa',d:'Piscina y trote suave tras el partido.',at:[],load:0,ses:'rec',x:{rest:1.6}},
 bp:{c:'esp',n:'Balón parado',d:'Ensayar córners, faltas y su defensa.',at:['cab'],load:1,ses:'bp',x:{sp:3}},
 cohes:{c:'esp',n:'Cohesión del equipo',d:'Actividades de grupo: química y buen ambiente.',at:[],load:0,ses:'tac',x:{chem:2,hap:.8}},
 rival:{c:'esp',n:'Preparar al rival',d:'Vídeo y ensayo del plan para el próximo partido. Mejor la víspera.',at:['dec'],load:1,ses:'prep',x:{riv:1}},
 sistema:{c:'esp',n:'Adaptación al sistema',d:'Mucho trabajo del sistema nuevo: lo dominan antes.',at:['col'],load:1,ses:'tac',x:{fam:5}}};
/** Sesión por defecto para cada día del sistema antiguo. */
const FROM_SES={fis:'resis',tec:'rondo',tac:'posic',ata:'final',def:'marcaje',bp:'bp',prep:'rival',rec:'recup',des:'descanso',m:''};
export const SLOTS=['Mañana','Tarde'];
/** La semana: 7 días × 2 sesiones (la tarde puede ir libre). Si el segundo cambió el plan antiguo, se rehace. */
export function tcPlan(){
 const s=sched(),src=s.join();
 if(!S.tc||!S.tc.d||S.tc.d.length!==7||S.tc.src!==src){S.tc=Object.assign(S.tc||{},{d:s.map((k,i)=>i===MATCH_DAY?['','']:[FROM_SES[k]||'',''] ),src});}
 S.tc.st=S.tc.st||{};S.tc.ind=S.tc.ind||{};S.tc.hist=S.tc.hist||[];return S.tc;
}
/** Cambia una sesión y sincroniza el plan antiguo (enfoque, intensidad…) con la de la mañana. */
export function setDrill(d,slot,k){const P=tcPlan();if(d===MATCH_DAY||(k&&!DRILLS[k]))return;P.d[d][slot]=k||'';const s=sched();
 s[d]=DRILLS[P.d[d][0]]?DRILLS[P.d[d][0]].ses:(DRILLS[P.d[d][1]]?DRILLS[P.d[d][1]].ses:'des');applySched();P.src=s.join();}
export function tcPreset(k){if(!PRESETS_T[k])return;S.sched=PRESETS_T[k].s.slice();applySched();S.tc=null;tcPlan();}
/** Carga de un día y de la semana (0 = descanso). */
export const dayLoad=d=>{const P=tcPlan();if(d===MATCH_DAY)return 3;return P.d[d].reduce((a,k)=>a+(DRILLS[k]?DRILLS[k].load:0),0);};
export const weekLoad=()=>{let s=0;for(let d=0;d<7;d++)if(d!==MATCH_DAY)s+=dayLoad(d);return s;};
/** Avisos de planificación. */
export function tcWarnings(){const P=tcPlan(),W=[],L=weekLoad();
 if(dayLoad(MATCH_DAY-1)>=3)W.push('La víspera del partido tiene mucha carga: llegarán cansados.');
 const post=P.d[MATCH_DAY+1]||[];if(!post.some(k=>DRILLS[k]&&DRILLS[k].c==='rec'))W.push('El día después del partido conviene recuperación o descanso.');
 if(L>=14)W.push('Semana muy dura: más mejora, pero mucho riesgo de fatiga y lesiones.');
 if(!P.d.some(x=>x.some(k=>k==='descanso')))W.push('No hay ningún día de descanso en la semana.');
 if(!P.d[MATCH_DAY-1].includes('rival'))W.push('Consejo: «Preparar al rival» la víspera da un extra en el partido.');
 return W;}
/* ---------- Cuerpo técnico por área ---------- */
const mem=id=>(S.crew||[]).find(x=>x.id===id);
/** Responsable de un área: el elegido o, si no hay, el mejor disponible. */
export function areaLead(a){const A=AREAS[a],P=tcPlan(),m=mem(P.st[a]);if(m&&A.role.includes(m.role))return m;
 const c=A.role.flatMap(r=>crew(r));return c.sort((x,y)=>(y.at[A.at]||0)-(x.at[A.at]||0))[0]||null;}
export const areaQ=a=>{const m=areaLead(a);return m?(m.at[AREAS[a].at]||4):3;};
/** Multiplicador de un área (0,88 sin nadie bueno; hasta 1,15 con un técnico de élite). */
export const areaMult=a=>.85+.03*areaQ(a);
export const catArea=c=>Object.keys(AREAS).find(a=>AREAS[a].cats.includes(c));
export function setLead(a,id){const P=tcPlan();if(!AREAS[a])return;P.st[a]=id||null;}
/* ---------- Plan individual ---------- */
export const ILOAD={rest:{n:'Descanso',d:'No entrena fuerte: recupera, no mejora.',g:0,f:-1.5},low:{n:'Baja',d:'Menos carga y menos riesgo.',g:.75,f:-.7},nor:{n:'Normal',d:'Sigue el plan del equipo.',g:1,f:0},alta:{n:'Alta',d:'Más mejora, más fatiga y riesgo de lesión.',g:1.25,f:1}};
export const pLoad=p=>{const P=tcPlan();return (P.ind[p.id]&&P.ind[p.id].l)||'nor';};
export function setPLoad(id,l){const P=tcPlan();if(!ILOAD[l])return;P.ind[id]=Object.assign(P.ind[id]||{},{l});}
/** Peso de cada atributo en la semana (según las sesiones y la calidad de su responsable). */
export function weekAt(){const P=tcPlan(),w={};P.d.forEach((x,d)=>{if(d===MATCH_DAY)return;x.forEach(k=>{const D=DRILLS[k];if(!D)return;const m=areaMult(catArea(D.c));D.at.forEach(a=>w[a]=(w[a]||0)+m);});});return w;}
/** Atributo que trabajará un jugador esta semana: su foco individual o uno del plan, según su puesto. */
export function pickAt(p,W){
 if(p.tf==='rol'){const w=W[p.pos]||{},L=Object.entries(w).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]).filter(a=>p.at[a]!=null&&p.at[a]<10).sort((a,b)=>p.at[a]-p.at[b]);if(L.length)return rnd()<.7?L[0]:pick(L);}
 else if(p.tf&&p.tf!=='auto')return p.tf;const w=weekAt(),L=Object.entries(w).filter(([a])=>(a!=='por'||p.pos==='POR')&&p.at[a]<10);if(!L.length)return null;
 const sc=L.map(([a,v])=>[a,v*(.35+((W[p.pos]||{})[a]||0)*3)]),tot=sc.reduce((s,x)=>s+x[1],0);let r=rnd()*tot;for(const [a,v] of sc){r-=v;if(r<=0)return a;}return sc[0][0];}
/** Multiplicador de mejora de un jugador: la calidad de los técnicos de lo que se entrena y su carga individual. */
export function tcGrowMult(p){const P=tcPlan(),L=ILOAD[pLoad(p)],cats=P.d.flat().filter(k=>DRILLS[k]&&DRILLS[k].load>0).map(k=>catArea(DRILLS[k].c)),q=cats.length?cats.reduce((a,c)=>a+areaMult(c),0)/cats.length:1;return L.g*q;}
/* ---------- Efectos de la semana ---------- */
/** Tras cada jornada: fatiga, recuperación, lesiones, efectos tácticos y el informe. Devuelve el informe. */
export function tcWeekly(famOf){
 const P=tcPlan(),t=T(S.user),f=t.formation,all=P.d.flatMap((x,d)=>d===MATCH_DAY?[]:x).filter(k=>DRILLS[k]),L=weekLoad(),rq=areaMult('rec');
 let fam=0,chem=0,hap=0,rest=0,inj=0,sp=0;const tf=[];
 all.forEach(k=>{const X=DRILLS[k].x||{},m=areaMult(catArea(DRILLS[k].c));fam+=(X.fam||0)*m;chem+=(X.chem||0)*m;hap+=X.hap||0;rest+=(X.rest||0)*rq;inj+=X.inj||0;sp+=(X.sp||0)*m;if(X.tf)tf.push(X.tf);});
 if(fam)S.famil[f]=clamp(famOf(f)+fam,0,100);if(chem)S.chem=clamp(S.chem+chem,20,100);if(sp)S.spFam=clamp((S.spFam??40)+sp,0,100);
 if(tf.length){const F=tfam();tf.forEach(([k,o])=>{if(F[k]&&F[k][o]!=null)F[k][o]=clamp(F[k][o]+3*areaMult('tac'),15,100);});}
 const nm=nextMatch(),opp=nm?(nm.fx.h===S.user?nm.fx.a:nm.fx.h):null;
 S.tcRiv=P.d[MATCH_DAY-1].includes('rival')&&opp!=null?{opp,b:1+.012*areaMult('tac')}:all.includes('rival')&&opp!=null?{opp,b:1+.006*areaMult('tac')}:null;
 const R={wk:S.week,load:L,inj:[],ups:P.ups||0,en:0,hap:0,tr:0,n:0};P.ups=0;
 squad(S.user).filter(p=>!p.loan).forEach(p=>{const il=ILOAD[pLoad(p)];
  const fat=Math.max(0,(L-7)*1.1+il.f*4)-rest*2.2;p.energy=clamp(Math.round((p.energy||0)-fat),25,100);
  if(hap)p.hap=clamp((p.hap??70)+hap,0,100);
  const risk=Math.max(0,.0015*(L-8)+(il.f>0?.004:0)+(p.energy<55?.004:0))*Math.max(.3,1+inj)*(1+(p.prone||0))*(1.2-.02*areaQ('rec'));
  if(!p.inj&&risk>0&&rnd()<risk){p.inj=1+(rnd()<.35?1:0);p.injT='Sobrecarga en el entrenamiento';R.inj.push(p.name);}
  R.en+=p.energy;R.hap+=p.hap??70;R.tr+=p.trA??6;R.n++;});
 if(R.n){R.en=Math.round(R.en/R.n);R.hap=Math.round(R.hap/R.n);R.tr=Math.round(R.tr/R.n*10)/10;}
 R.chem=Math.round(S.chem);R.fam=Math.round(famOf(f));
 P.hist.push(R);if(P.hist.length>12)P.hist.shift();P.last=R;return R;}
/** Mejoras de la semana (las cuenta trainPlayer). */
export function tcCountUp(){const P=tcPlan();P.ups=(P.ups||0)+1;}
/** Multiplicador del partido por haber preparado al rival. */
export const rivMult=opp=>S.tcRiv&&String(S.tcRiv.opp)===String(opp)?S.tcRiv.b:1;
/** Aprendizaje táctico extra si hay sesiones tácticas (lo usa el entrenamiento semanal). */
export function tcTacLearn(){const P=tcPlan(),n=P.d.flat().filter(k=>DRILLS[k]&&DRILLS[k].c==='tac').length;if(n)learnTactic(T(S.user).tac,n*.8*areaMult('tac'));}
