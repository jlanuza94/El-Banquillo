/* El Banquillo · coach.ts — El entrenador como personaje con carrera profesional (módulo de entrenadores y licencias).
 *
 * Fuente única de verdad: todo vive en S.mgr (el guardado de siempre). Campos nuevos, todos opcionales:
 *  name, nat, born, bg (trayectoria como jugador), lead (estilo de liderazgo), langs
 *  lics: [{k, jur, got, exp, conv:[jur]}]   diplomas (no se borran nunca; la vigencia se recalcula)
 *  course: {k, jur, left, tot, h, renew?}   inscripción en curso
 *  at20: atributos 1-20 por grupos; pot: potencial (techo)
 *  hist: [{tid, club, lg, from, to, g, w, d, l, titles}] trayectoria profesional
 *  badges: {id: {s: temporada, club}} insignias (una vez por logro)
 * migrateCoach() convierte las partidas antiguas sin perder nada.
 *
 * Las horas y niveles son referencias de la Convención de Entrenadores de la UEFA (2020) y equivalentes de otras
 * confederaciones: van marcadas como «pendientes de verificación» con cada federación. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,r3,rnd} from './core';
import {COUNTRIES} from './data';
import {LG,S,T,seasonLabel,uLg,unit} from './state';
import {news} from './world';

/* ---------- Jurisdicciones ---------- */
export const JURS={UEFA:'UEFA (Europa)',CONMEBOL:'CONMEBOL (Sudamérica)',CONCACAF:'CONCACAF (Norte y Centroamérica)',AFC:'AFC (Asia)'};
const JUR_BY={ESP:'UEFA',ING:'UEFA',ITA:'UEFA',ALE:'UEFA',FRA:'UEFA',PRT:'UEFA',NED:'UEFA',BEL:'UEFA',TUR:'UEFA',SCO:'UEFA',BRA:'CONMEBOL',ARG:'CONMEBOL',COL:'CONMEBOL',MEX:'CONCACAF',USA:'CONCACAF',JPN:'AFC'};
export const jurOf=c=>JUR_BY[(COUNTRIES[c]||{}).code]||'UEFA';
export const myJur=()=>jurOf(LG(uLg()).c);
/* ---------- Catálogo de cursos (horas de referencia) ---------- */
/** lv: nivel en la escalera principal (0 C … 3 Pro); spec: especialización. pre: diploma necesario antes. */
export const COURSES={
 C:{n:'Licencia C',lv:0,h:60,fam:'basic',pre:null,seasons:0,rep:0,use:'Fútbol base y fundamentos del entrenamiento.'},
 B:{n:'Licencia B',lv:1,h:120,fam:'basic',pre:'C',seasons:0,rep:12,use:'Desarrollo individual y colectivo; fútbol juvenil y amateur.'},
 A:{n:'Licencia A',lv:2,h:180,fam:'adv',pre:'B',seasons:1,rep:30,use:'Preparación táctica avanzada y rendimiento colectivo.'},
 PRO:{n:'Licencia Pro',lv:3,h:360,fam:'pro',pre:'A',seasons:2,rep:48,use:'Dirección técnica al máximo nivel profesional.'},
 YB:{n:'Youth B',spec:1,h:60,fam:'spec',pre:'B',seasons:0,rep:10,use:'Especialización en desarrollo juvenil.',at:['dvi','tec']},
 EYA:{n:'Elite Youth A',spec:1,h:120,fam:'spec',pre:'YB',seasons:1,rep:28,use:'Desarrollo de jóvenes de élite.',at:['dvi','pla']},
 GKB:{n:'Goalkeeper B',spec:1,h:60,fam:'spec',pre:'B',seasons:0,rep:10,use:'Entrenamiento especializado de porteros.',at:['tec','obs']},
 GKA:{n:'Goalkeeper A',spec:1,h:120,fam:'spec',pre:'GKB',seasons:1,rep:28,use:'Porteros de alto nivel.',at:['tec','eva']},
 FUT:{n:'Futsal B',spec:1,h:120,fam:'spec',pre:'B',seasons:0,rep:10,use:'Entrenamiento de fútbol sala.',at:['tec','tra']},
};
export const MAIN=['C','B','A','PRO'];
/** Jornadas que dura un curso (aprox. 15 horas por semana lectiva). */
export const courseWeeks=k=>Math.max(3,Math.round(COURSES[k].h/22));
export const courseCost=k=>r3(unit(LG(uLg()).rep)*COURSES[k].h/80);
export const VALID=3;  // temporadas de vigencia; se renueva con un curso de actualización
export const licLabel=(k,jur)=>`${jur||myJur()} ${COURSES[k].n.replace('Licencia ','')}`;
/* ---------- Diplomas, vigencia y reconocimiento ---------- */
export const diplomas=()=>(S.mgr&&S.mgr.lics)||[];
export const hasDiploma=k=>diplomas().some(l=>l.k===k);
/** Estado de un diploma en tu jurisdicción actual. */
export function licStatus(l,jur=myJur()){const exp=l.exp<S.seasonN,rec=l.jur===jur||(l.conv||[]).includes(jur);return {exp,rec,ok:!exp&&rec,txt:exp?'Caducada: renuévala':!rec?`No reconocida en ${jur}: pide la convalidación`:`Vigente hasta ${seasonLabel(l.exp)}`};}
/** Nivel principal válido aquí (-1 sin licencia, 0 C … 3 Pro). Es lo que mira la elegibilidad. */
export function validLevel(jur){return Math.max(-1,...diplomas().filter(l=>COURSES[l.k]&&COURSES[l.k].lv!=null&&licStatus(l,jur).ok).map(l=>COURSES[l.k].lv));}
/** Nivel principal obtenido alguna vez (aunque haya caducado o no se reconozca aquí). */
export const topDiploma=()=>Math.max(-1,...diplomas().filter(l=>COURSES[l.k]&&COURSES[l.k].lv!=null).map(l=>COURSES[l.k].lv));
function grant(k,jur){S.mgr.lics=S.mgr.lics||[];const old=S.mgr.lics.find(l=>l.k===k);if(old){old.exp=S.seasonN+VALID;if(!old.conv)old.conv=[];if(old.jur!==jur&&!old.conv.includes(jur))old.conv.push(jur);return old;}const l={k,jur,got:S.seasonN,exp:S.seasonN+VALID,conv:[]};S.mgr.lics.push(l);S.mgr.badges=S.mgr.badges||{};if(!S.mgr.badges['lic_'+k])S.mgr.badges['lic_'+k]={s:seasonLabel(),club:T(S.user)?T(S.user).name:''};return l;}
/* ---------- Reglas (motor normativo) ---------- */
/** Cada regla: jurisdicción, competición, cargo, licencia mínima, vigencia, fuente y estado de verificación. */
export const RULES=[
 {jur:'*',comp:'Primera división (liga fuerte)',test:L=>L.lv===0&&L.rep>=70,role:'Primer entrenador',need:3,from:'2020',src:'Convención de Entrenadores UEFA 2020 (referencia)',rev:'2026',st:'Pendiente de verificación'},
 {jur:'*',comp:'Primera división',test:L=>L.lv===0&&L.rep<70,role:'Primer entrenador',need:2,from:'2020',src:'Convención de Entrenadores UEFA 2020 (referencia)',rev:'2026',st:'Pendiente de verificación'},
 {jur:'*',comp:'Segunda división',test:L=>L.lv===1,role:'Primer entrenador',need:1,from:'2020',src:'Reglamentos nacionales (referencia)',rev:'2026',st:'Pendiente de verificación'},
 {jur:'*',comp:'Tercera división y amateur',test:L=>L.lv>=2,role:'Primer entrenador',need:0,from:'2020',src:'Reglamentos nacionales (referencia)',rev:'2026',st:'Pendiente de verificación'},
 {jur:'*',comp:'Selección nacional',test:()=>false,nt:1,role:'Seleccionador',need:2,from:'2020',src:'Reglamentos de las federaciones (referencia)',rev:'2026',st:'Pendiente de verificación'},
];
export const ruleFor=L=>RULES.find(r=>!r.nt&&r.test(L));
/** ¿Puedes dirigir este club? Devuelve lo que falta, por separado (requisitos y preferencias). */
export function eligibility(t){const L=LG(t.lg),r=ruleFor(L),jur=jurOf(L.c),have=validLevel(jur),miss=[];
 if(have<r.need){const top=topDiploma();miss.push(top>=r.need?`Tu ${COURSES[MAIN[r.need]].n} no es válida en ${jur} (${diplomas().some(l=>COURSES[l.k].lv>=r.need&&l.exp<S.seasonN)?'caducada':'sin convalidar'})`:`Exige la ${COURSES[MAIN[r.need]].n} (${jur})`);}
 return {ok:!miss.length,need:r.need,rule:r,jur,miss};}
/* ---------- Cursos: inscripción, progreso y examen ---------- */
/** Por qué no puedes matricularte en un curso ('' si puedes). */
export function courseBlock(k){const M=S.mgr,C=COURSES[k];if(!C)return 'Ese curso no existe.';if(M.course)return 'Ya estás matriculado en un curso.';
 if(hasDiploma(k)){const l=diplomas().find(x=>x.k===k);return l.exp<S.seasonN?'':'Ya tienes este diploma.';}
 if(C.pre&&!hasDiploma(C.pre))return `Antes necesitas la ${COURSES[C.pre].n}.`;
 if((M.seasons||0)<C.seasons)return `Necesitas ${C.seasons} temporada${C.seasons>1?'s':''} entrenando.`;
 if(M.rep<C.rep)return `Necesitas reputación ${C.rep} (tienes ${Math.round(M.rep)}).`;return '';}
/** Matricularse (renovar si está caducada). Lo pagas de tus ahorros; con confianza 70+ la directiva puede pagarlo. */
export function enroll(k){const b=courseBlock(k);if(b)return b;const M=S.mgr,renew=hasDiploma(k),fee=renew?r3(courseCost(k)*.25):courseCost(k);
 if((M.savings||0)>=fee)M.savings=r3(M.savings-fee);else if(M.conf>=70&&S.budget>=fee)S.budget=r3(S.budget-fee);else return `Cuesta ${money(fee)} y no te llega con tus ahorros (${money(M.savings||0)}). Con confianza 70 o más, la directiva te lo pagaría.`;
 const wk=renew?2:courseWeeks(k);M.course={k,jur:myJur(),left:wk,tot:wk,h:renew?Math.round(COURSES[k].h/6):COURSES[k].h,renew};
 news(`Te matriculas en ${renew?'la actualización de la ':'el curso de '}${licLabel(k)}: ${wk} jornadas.`,'good',{cat:'dir',subj:`Formación: ${COURSES[k].n}`});return '';}
/** Convalidar en otra federación un diploma B o superior: trámite corto. */
export function convalidate(k){const l=diplomas().find(x=>x.k===k),jur=myJur();if(!l)return 'No tienes ese diploma.';if(l.jur===jur||(l.conv||[]).includes(jur))return 'Ya es válido aquí.';if(S.mgr.course)return 'Termina antes tu curso actual.';
 const fee=r3(courseCost(k)*.15);if((S.mgr.savings||0)<fee)return `El trámite cuesta ${money(fee)}.`;S.mgr.savings=r3(S.mgr.savings-fee);S.mgr.course={k,jur,left:3,tot:3,h:0,conv:1};news(`Pides a ${jur} que reconozca tu ${COURSES[k].n}: 3 jornadas de trámite.`,'',{cat:'dir'});return '';}
/** Cada jornada: avanza el curso. Al final hay examen: la nota depende de tus atributos y de la experiencia. */
export function courseWeekly(onPass){const M=S.mgr;if(!M||!M.course)return;const c=M.course;c.left--;if(c.left>0)return;M.course=null;
 if(c.conv){const l=diplomas().find(x=>x.k===c.k);if(l){l.conv=l.conv||[];if(!l.conv.includes(c.jur))l.conv.push(c.jur);}news(`${c.jur} reconoce tu ${COURSES[c.k].n}.`,'good',{cat:'dir'});return;}
 const score=clamp(5+(attrAvg()-10)*.35+(M.seasons||0)*.3+(c.renew?3:0)+rnd()*3,0,10);
 if(score<4.5&&!c.renew){news(`Suspendes el examen de la ${COURSES[c.k].n} (${score.toFixed(1)}). Puedes volver a matricularte.`,'bad',{cat:'dir',subj:'Examen suspendido'});return;}
 grant(c.k,c.jur);if(!c.renew){(COURSES[c.k].at||['est','tco']).forEach(a=>bumpAt(a,1));}
 news(c.renew?`Renuevas la ${COURSES[c.k].n}: vigente hasta ${seasonLabel(S.seasonN+VALID)}.`:`¡Aprobado con un ${score.toFixed(1)}! Ya tienes la ${licLabel(c.k,c.jur)}.`,'good',{cat:'dir',subj:`Diploma: ${COURSES[c.k].n}`});
 if(onPass)onPass(c.k);}
/** Aviso de caducidad al empezar la temporada en que vence. */
export function licExpiryCheck(){diplomas().forEach(l=>{if(l.exp===S.seasonN)news(`Tu ${COURSES[l.k].n} caduca al final de esta temporada. Haz el curso de actualización en Mi carrera › Formación.`,'bad',{cat:'dir',subj:'Licencia a punto de caducar'});});}
/* ---------- Atributos 1-20 ---------- */
export const AT20={
 'Táctico':{ofe:'Organización ofensiva',dfn:'Organización defensiva',tra:'Transiciones',est:'Estrategia',ada:'Adaptación'},
 'Entrenamiento':{tec:'Técnica',tco:'Táctica colectiva',pfi:'Preparación física',dvi:'Desarrollo individual'},
 'Liderazgo':{mot:'Motivación',dis:'Disciplina',com:'Comunicación',ves:'Gestión del vestuario'},
 'Dirección':{gpe:'Gestión de personal',pla:'Planificación',dir:'Relación con la directiva'},
 'Análisis':{obs:'Observación del rival',eva:'Evaluación de partidos',dec:'Toma de decisiones'}};
export const AT20K=Object.values(AT20).flatMap(g=>Object.keys(g));
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
export const attrAvg=()=>{const A=S.mgr&&S.mgr.at20;return A?avg(AT20K.map(k=>A[k]||8)):8;};
export function bumpAt(k,v){const M=S.mgr;if(!M.at20)return;const cap=M.pot||16;M.at20[k]=clamp(Math.round(((M.at20[k]||8)+v)*10)/10,1,Math.max(cap,M.at20[k]||1));}
/** Los atributos que usa el resto del juego (táctica, motivación, cantera y negociación, 0-10), sacados de los 1-20. */
export function legacyAt(k){const A=S.mgr&&S.mgr.at20;if(!A)return null;const g=ks=>avg(ks.map(x=>A[x]||8))/2;
 return k==='tac'?g(['ofe','dfn','tra','est','ada']):k==='mot'?g(['mot','com','ves','dis']):k==='can'?g(['dvi','tec','pla']):k==='neg'?g(['gpe','dir','pla']):null;}
/** Crecimiento al final de la temporada (lo que más has trabajado, hasta tu potencial). */
export function at20Grow(sm,ctx){const ks=[];if(sm.ok||sm.up||sm.champ)ks.push('ofe','dfn','est');if(ctx.youth)ks.push('dvi','pla');if(ctx.deals)ks.push('gpe','dir');if(ctx.happy)ks.push('ves','mot');ks.push('eva','dec');ks.forEach(k=>bumpAt(k,.6));}
/* ---------- Perfil inicial ---------- */
export const BG={none:['Sin pasado como jugador','Empiezas desde cero: sin licencias.'],amat:['Exjugador amateur','Empiezas con la Licencia C.'],pro:['Exjugador profesional','Licencias C y B por la vía de exjugador, y más reputación.']};
export const LEAD={tac:['Estratega','+táctica y análisis'],mot:['Motivador','+motivación y comunicación'],dis:['Disciplinado','+disciplina y preparación física'],pat:['Paternal','+vestuario y desarrollo de jóvenes']};
/** Crea el entrenador al empezar partida (o migra el de una partida antigua). */
export function createCoach(o={}){const M=S.mgr,bg=o.bg||'amat',lead=o.lead||'tac',c=LG(uLg()).c;
 M.name=o.name||M.name||'Tú';M.nat=o.nat??c;M.born=o.age?(2025+S.seasonN-o.age):(M.born||2025+S.seasonN-34);M.bg=bg;M.lead=lead;M.langs=o.langs||[COUNTRIES[M.nat]?COUNTRIES[M.nat].lang:'es'];
 const base=bg==='pro'?9:bg==='amat'?7:6,A={};AT20K.forEach(k=>A[k]=clamp(Math.round(base+rnd()*3),1,20));
 const boost={tac:['ofe','dfn','est','obs','eva'],mot:['mot','com','ves'],dis:['dis','pfi','pla'],pat:['ves','dvi','com']}[lead];boost.forEach(k=>A[k]=clamp(A[k]+3,1,20));
 M.at20=A;M.pot=clamp(Math.round(14+rnd()*5+(o.age&&o.age<35?1:0)),12,20);M.lics=[];
 if(bg!=='none')grant('C',myJur());if(bg==='pro'){grant('B',myJur());M.rep=clamp(M.rep+8,0,100);}
 M.hist=[{tid:S.user,club:T(S.user).name,lg:T(S.user).lg,from:seasonLabel(),to:null,g:0,w:0,d:0,l:0,titles:[]}];M.v2=1;}
/** Partidas anteriores: crea el perfil a partir de lo que ya había, sin tocar nada del juego. */
export function migrateCoach(){const M=S.mgr;if(!M||M.v2)return;
 const A={},o=M.at||{tac:5,mot:5,can:5,neg:5};AT20K.forEach(k=>A[k]=8);['ofe','dfn','tra','est','ada','obs','eva','dec'].forEach(k=>A[k]=Math.round(o.tac*2));['mot','com','ves','dis'].forEach(k=>A[k]=Math.round(o.mot*2));['dvi','tec','pla'].forEach(k=>A[k]=Math.round(o.can*2));['gpe','dir'].forEach(k=>A[k]=Math.round(o.neg*2));
 M.at20=A;M.pot=Math.max(16,...Object.values(A));M.name=M.name||'Tú';M.nat=M.nat??LG(uLg()).c;M.bg=M.bg||'amat';M.lead=M.lead||'tac';
 const lv=M.lic!=null?M.lic:0;M.lics=M.lics||[];for(let i=0;i<=lv&&i<4;i++)grant(MAIN[i],myJur());
 M.hist=M.hist||(M.clubs||[]).map((c,i,a)=>({tid:null,club:c.club,from:c.season,to:i<a.length-1?a[i+1].season:null,g:0,w:0,d:0,l:0,titles:[]}));if(M.hist.length&&M.hist[M.hist.length-1].to==null)M.hist[M.hist.length-1].tid=S.user;
 if(M.badges)Object.keys(M.badges).forEach(k=>{if(typeof M.badges[k]!=='object')M.badges[k]={s:seasonLabel(M.badges[k]),club:T(S.user).name};});
 M.v2=1;}
/* ---------- Trayectoria ---------- */
export const curJob=()=>{const H=S.mgr&&S.mgr.hist;return H&&H.length?H[H.length-1]:null;};
export function histMatch(d){const j=curJob();if(!j)return;j.g++;if(d>0)j.w++;else if(d<0)j.l++;else j.d++;}
export function histTitle(name){const j=curJob();if(j&&!j.titles.includes(name))j.titles.push(name);}
export function histNewJob(t){const H=S.mgr.hist=S.mgr.hist||[];const j=curJob();if(j&&!j.to)j.to=seasonLabel();H.push({tid:t.id,club:t.name,lg:t.lg,from:seasonLabel(),to:null,g:0,w:0,d:0,l:0,titles:[]});}
export const coachAge=()=>S.mgr&&S.mgr.born?2025+S.seasonN-S.mgr.born:null;
