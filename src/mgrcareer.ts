/* El Banquillo · mgrcareer.ts — La carrera del entrenador: licencias (C, B, A, Pro) que se ganan temporada
 * a temporada, insignias por lo conseguido, y cómo eso cambia las ganas de los jugadores de venir a tu club.
 * También: ofrecer un puesto de técnico a los jugadores que se van a retirar (como en FM Mobile). */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,rnd} from './core';
import {unit} from './state';
import {COURSES,MAIN,at20Grow,courseWeekly,eligibility,histMatch,histTitle,licExpiryCheck,validLevel} from './coach';
import {LG,S,T,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {isDerby} from './rivals';
import {ST_ROLES,crew,makeStaff,crewLevel,staffMax,staffWage} from './staff';

export const LICS=[['Licencia C','Recién empezado'],['Licencia B','Entrenador con oficio'],['Licencia A','Entrenador de prestigio'],['Licencia Pro','Élite de los banquillos']];
/** Licencia actual (0-3): sube con la reputación y las temporadas dirigidas. */
/** Nivel de licencia válido en tu federación (-1 sin licencia, 0 C … 3 Pro). */
export function licence(){return S.mgr?validLevel():-1;}
export const licName=lv=>lv<0?'Sin licencia':COURSES[MAIN[lv]].n;
/** Insignias: lo que has logrado en tu carrera. */
export const BADGES={debut:['🎬','Debut','Dirige tu primer partido oficial'],win1:['✅','Primera victoria','Gana tu primer partido oficial'],racha:['🔥','En racha','Gana 5 partidos oficiales seguidos'],goleada:['💥','Goleada','Gana por 5 goles o más'],derbi:['⚔️','Rey del derbi','Gana un derbi'],remontada:['↩️','Remontada','Gana un partido que ibas perdiendo por 2'],cero:['🧱','Muralla','Termina 5 partidos seguidos sin encajar'],lic_C:['C','Licencia C','Consigue la Licencia C','basic'],lic_B:['B','Licencia B','Consigue la Licencia B','basic'],lic_A:['A','Licencia A','Consigue la Licencia A','adv'],lic_PRO:['PRO','Licencia Pro','Consigue la Licencia Pro','pro'],lic_YB:['🌱','Youth B','Especialista en desarrollo juvenil','spec'],lic_EYA:['🌳','Elite Youth A','Especialista en jóvenes de élite','spec'],lic_GKB:['🧤','Goalkeeper B','Entrenador de porteros','spec'],lic_GKA:['🥅','Goalkeeper A','Porteros de alto nivel','spec'],lic_FUT:['⚽','Futsal B','Entrenador de fútbol sala','spec'],cien:['💯','Centenario','100 partidos oficiales dirigidos'],invicto:['🛡️','Invicto','10 partidos seguidos sin perder'],mentor:['👨‍🏫','Aprendiz','Has tenido un mentor'],sel:['🌍','Seleccionador','Has dirigido a una selección'],asc:['⬆️','Ascenso','Has subido de categoría'],liga:['🏆','Campeón de liga','Has ganado una liga'],copa:['🥇','Copa','Has ganado una copa'],cant:['🌱','Cantera','Has hecho debutar a 5 canteranos'],obj:['🎯','Cumplidor','3 objetivos de la directiva cumplidos'],ojo:['🔎','Buen ojo','Has vendido un jugador por el triple de lo que costó'],fiel:['🤝','Fiel','5 temporadas en el mismo club'],mes:['🏅','Entrenador del mes','Has sido entrenador del mes']};
export function badges(){const B=S.mgr&&S.mgr.badges||{};return Object.keys(BADGES).filter(k=>B[k]);}
export function giveBadge(k){S.mgr.badges=S.mgr.badges||{};if(S.mgr.badges[k]||!BADGES[k])return;S.mgr.badges[k]={s:seasonLabel(),club:T(S.user).name};const b=BADGES[k];news(`Nueva insignia de entrenador: ${b[0]} ${b[1]}. ${b[2]}.`,'good',{cat:'dir',subj:`Insignia: ${b[1]}`});}
/** Al acabar la temporada: cuenta la temporada, revisa la licencia y las insignias. */
export function careerSeasonEnd(sm){
 const M=S.mgr;if(!M)return;const l0=licence();M.seasons=(M.seasons||0)+1;M.objOk=(M.objOk||0)+(sm.ok?1:0);M.sameClub=M.lastClub===S.user?(M.sameClub||1)+1:1;M.lastClub=S.user;
 if(sm.up)giveBadge('asc');if(sm.champ)giveBadge('liga');if((S.titles||[]).some(x=>!x.name.startsWith('Liga')))giveBadge('copa');if(M.objOk>=3)giveBadge('obj');if(M.sameClub>=5)giveBadge('fiel');
 if(squad(S.user).filter(p=>p.home&&p.st&&p.st.pj>0).length>=5)giveBadge('cant');

 // experiencia de la temporada, mentor y licencia que exige tu división
 addXp((sm.ok?60:15)+(sm.up?80:0)+(sm.champ?120:0),'temporada');
 if(M.mentor){mentorSeasonEnd();}
 const E=eligibility(T(S.user));if(!E.ok&&!(M.course)){M.conf=clamp(M.conf-15,0,100);news(`Incumples la normativa: ${E.miss[0]}. La directiva no está contenta: matricúlate en Mi carrera › Formación.`,'bad',{cat:'dir',subj:'Te falta la licencia'});}
 (S.titles||[]).filter(x=>x.season===seasonLabel()).forEach(x=>histTitle(x.name));
 licExpiryCheck();
}
/* ---------- Ganas de venir a tu club ---------- */
let XI={k:'',v:55};
const xiAvg=()=>{const k=S.day+'|'+S.week+'|'+S.user;if(XI.k!==k){const L=squad(S.user).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11);XI={k,v:L.length?L.reduce((a,b)=>a+b,0)/L.length:55};}return XI.v;};
/** Ganas de un jugador de fichar por tu club (0-100) y el motivo principal. */
export function joinWill(p){
 if(!S.mgr||p.team===S.user)return {v:100,why:''};
 const me=T(S.user),his=p.team!=null?T(p.team):null,xi=xiAvg();let v=50;const why=[];
 const dRep=(me.rep||50)-(his?his.rep||50:35);v+=clamp(dRep*1.1,-30,25);if(dRep<-12)why.push('su club es más grande que el tuyo');
 const m=(S.mgr.rep-40)*.45+licence()*5;v+=m;if(m<-6)why.push('aún no te conoce como entrenador');else if(m>12)why.push('le atrae tu prestigio');
 if(p.ovr>=xi+2){v+=10;why.push('sería titular');}else if(p.ovr<xi-8){v-=12;why.push('tendría pocos minutos');}
 if(his&&LG(his.lg).c===LG(uLg()).c&&LG(his.lg).lv<LG(uLg()).lv){v-=15;why.push('juega en una división superior');}
 if(p.team===null){v+=18;why.push('está sin equipo');}if(p.age>=31)v+=6;if((p.hap??70)<40){v+=15;why.push('no está a gusto en su club');}
 if(p.ovr>xi+12)v-=(p.ovr-xi-12)*2;
 return {v:Math.round(clamp(v,0,100)),why:why.slice(0,2).join(' y ')};
}
/** Jugadores que quieren venir: buenos para tu equipo y con muchas ganas (se refresca cada día). */
let INT={k:'',v:[]};
export function interested(n=30){
 const k=S.day+'|'+S.week+'|'+S.user+'|'+Math.round(S.mgr?S.mgr.rep:0);if(INT.k===k)return INT.v;
 const xi=xiAvg(),c=LG(uLg()).c,L=Object.values(S.players).filter(p=>p.team!==S.user&&!p.loan&&p.ovr>=xi-3&&p.age<=33&&(p.team===null||LG(T(p.team).lg).c===c||p.ovr>=xi+3));
 const out=L.map(p=>[p,joinWill(p)]).filter(x=>x[1].v>=70).sort((a,b)=>b[0].ovr-a[0].ovr).slice(0,n);INT={k,v:out};return out;
}
/* ---------- De jugador a técnico ---------- */
/** Puesto que mejor le va a un jugador que se retira. */
export function suggestRole(p){const a=p.at;return (a.lid??5)>=7?'seg':(a.dec??5)>=7||(a.con??5)>=7?'ent':(a.res??5)>=7?'fis':(a.vis??5)>=7?'dca':'ent';}
/** Crea un técnico a partir de un jugador (sus atributos mentales marcan cómo entrenará). */
export function staffFromPlayer(p,role){
 const a=p.at,m=makeStaff(role,crewLevel()+.4),b=v=>clamp(Math.round((v??5)+(rnd()-.5)*1.6),1,10);
 m.name=p.name;m.nat=p.nat;m.age=p.age+1;m.ex=1;m.from=p.team!=null&&T(p.team)?T(p.team).short:null;
 m.at.tac=b(((a.dec??5)+(a.vis??5))/2);m.at.mot=b(a.lid);m.at.ent=b(((a.con??5)+(a.dec??5))/2);m.at.jui=b(((a.vis??5)+(a.col??5))/2);m.at.jpo=b(((a.vis??5)+(a.dec??5))/2);m.at.jov=b(((a.lid??5)+(a.con??5))/2);m.at.fis=b(((a.res??5)+(a.con??5))/2);
 m.wage=staffWage(m);m.yrs=2;return m;
}
/** Veteranos que pueden retirarse este verano (los tuyos y los de tu país). */
export function retiring(){const c=LG(uLg()).c;return Object.values(S.players).filter(p=>p.age>=33&&p.team!=null&&(p.team===S.user||LG(T(p.team).lg).c===c)).sort((a,b)=>(b.team===S.user)-(a.team===S.user)||(b.at.lid??5)+(b.at.dec??5)-(a.at.lid??5)-(a.at.dec??5)).slice(0,30);}
/** Ofrecerle un puesto de técnico: si acepta, al retirarse en verano entra en tu cuerpo técnico. */
export function offerStaffRole(id,role){
 const p=S.players[id];if(!p)return 'Ese jugador ya no está.';if(p.toStaffNo===S.seasonN)return `${p.name} ya te dijo que no esta temporada.`;
 const ch=clamp(.35+(S.mgr.rep-40)/100+licence()*.08+(p.team===S.user?.25:0)+((p.at.lid??5)-5)*.03,.1,.95);
 if(rnd()>ch){p.toStaffNo=S.seasonN;news(`${p.name} prefiere no comprometerse aún como ${ST_ROLES[role].n.toLowerCase()} en tu club.`,'',{cat:'sta'});return '';}
 p.toStaff=role;news(`${p.name} acepta: cuando se retire este verano será tu ${ST_ROLES[role].n.toLowerCase()}.`,'good',{cat:'sta',subj:`${p.name} será técnico`});return '';
}
/** En la retirada: los que aceptaron entran en tu cuerpo técnico (o en la lista de candidatos si no hay plaza). */
export function retireToStaff(p){if(!p.toStaff)return false;const m=staffFromPlayer(p,p.toStaff);S.crew=S.crew||[];
 if(crew(m.role).length<staffMax(m.role)){S.crew.push(m);news(`${m.name} cuelga las botas y empieza como ${ST_ROLES[m.role].n.toLowerCase()} en tu club.`,'good',{cat:'sta'});}
 else{S.staffPool=(S.staffPool||[]);S.staffPool.unshift(m);news(`${m.name} se retira y quiere entrenar contigo, pero no tienes plaza de ${ST_ROLES[m.role].n.toLowerCase()}: está entre los candidatos.`,'',{cat:'sta'});}
 return true;}

/* =================== Carrera profunda: cursos, experiencia, especialidades, mentor y contactos =================== */
/** Licencia que exige un club según la normativa. */
export function reqLic(t){return eligibility(t).need;}
/** Cada jornada: avanza el curso y la mentoría. */
export function careerWeekly(){const M=S.mgr;if(!M)return;
 courseWeekly(k=>{M.rep=clamp(M.rep+(COURSES[k].lv!=null?2:1),0,100);addXp(COURSES[k].lv!=null?40:20,'formación');giveBadge('lic_'+k);});
 if(M.mentor)addXp(2,'mentor');
}
/* ---------- Experiencia y nivel ---------- */
export function addXp(n,why){const M=S.mgr;if(!M)return;const l0=mgrLevel();M.xp=(M.xp||0)+n;const l1=mgrLevel();if(l1>l0)news(`Subes a nivel ${l1} como entrenador. Cada nivel suma un poco a tu reputación.`,'good',{cat:'dir',subj:`Nivel ${l1} de entrenador`}),M.rep=clamp(M.rep+.5,0,100);}
export const mgrLevel=()=>Math.floor(Math.sqrt(((S.mgr&&S.mgr.xp)||0)/40))+1;
export const levelXp=l=>40*(l-1)*(l-1);
/** Tras cada partido oficial: experiencia, partidos dirigidos y racha. */
export function careerMatch(m){const M=S.mgr;if(!M||!m.us||m.ref.k==='fr')return;const us=m.us,o=us==='h'?'a':'h',d=m.score[us]-m.score[o];
 M.games=(M.games||0)+1;histMatch(d);M.wst=d>0?(M.wst||0)+1:0;M.cs=m.score[o]===0?(M.cs||0)+1:0;giveBadge('debut');if(d>0)giveBadge('win1');if(M.wst>=5)giveBadge('racha');if(d>=5)giveBadge('goleada');if(M.cs>=5)giveBadge('cero');if(d>0&&isDerby(m.h,m.a))giveBadge('derbi');
 {let a=0,b=0,worst=0;m.ev.forEach(e=>{if(e.t==='goal'){if(e.s===us)a++;else b++;worst=Math.min(worst,a-b);}});if(d>0&&worst<=-2)giveBadge('remontada');}M.wins=(M.wins||0)+(d>0?1:0);M.unb=d<0?0:(M.unb||0)+1;addXp(d>0?12:d===0?7:3,'partido');
 if(M.games>=100)giveBadge('cien');if(M.unb>=10)giveBadge('invicto');}
/* ---------- Especialidades ---------- */
export const SPECS={tac:['🧠','Táctico','+1 en Táctica: tu equipo rinde algo más y aprende antes las tácticas.'],mot:['🔥','Motivador','+1 en Motivación: charlas más efectivas y vestuario más unido.'],can:['🌱','Formador','+1 en Cantera: los jóvenes crecen más rápido.'],neg:['🤝','Negociador','+1 en Negociación: fichajes más baratos.'],fis:['💪','Preparador físico','Menos lesiones y mejor recuperación.']};
export const hasSpec=k=>!!(S.mgr&&(S.mgr.spec||[]).includes(k));
export function pickSpec(k){const M=S.mgr;M.spec=M.spec||[];if(!SPECS[k]||M.spec.includes(k)||M.spec.length>=licence())return;M.spec.push(k);M.specPick=M.spec.length<licence();news(`Te especializas: ${SPECS[k][1]}. ${SPECS[k][2]}`,'good',{cat:'dir'});}
/* ---------- Mentor ---------- */
/** Entrenadores de prestigio que podrían ser tu mentor (más reputación que tú). */
export function mentorCands(){const M=S.mgr;if(!S.coaches)return [];return Object.entries(S.coaches).filter(([id,c])=>T(id)&&c.rep>=M.rep+8).sort((a,b)=>b[1].rep-a[1].rep).slice(0,5).map(([id,c])=>({tid:id,name:c.name,rep:c.rep,st:c.st}));}
export function askMentor(tid){const M=S.mgr,c=S.coaches&&S.coaches[tid];if(!c)return 'Ya no entrena.';if(M.mentorAsk===S.seasonN)return 'Esta temporada ya pediste un mentor.';M.mentorAsk=S.seasonN;
 const ch=clamp(.75-(c.rep-M.rep)/80+licence()*.05,.15,.9);if(rnd()>ch){news(`${c.name} está muy ocupado y no puede ser tu mentor esta temporada.`,'',{cat:'dir'});return '';}
 M.mentor={tid,name:c.name,since:S.seasonN};giveBadge('mentor');news(`${c.name} acepta ser tu mentor: hablaréis cada semana. Ganarás experiencia y mejorarás donde él es fuerte.`,'good',{cat:'dir',subj:`Tu mentor: ${c.name}`});return '';}
function mentorSeasonEnd(){const M=S.mgr,A=M.at||(M.at={tac:5,mot:5,can:5,neg:5}),k=pick(['tac','mot','can','neg']);A[k]=Math.min(10,Math.round((A[k]+.4)*100)/100);
 news(`Tu temporada con ${M.mentor.name} da sus frutos: mejoras en ${({tac:'táctica',mot:'motivación',can:'cantera',neg:'negociación'})[k]}.`,'good',{cat:'dir'});if(S.seasonN-M.mentor.since>=1){news(`Termina tu etapa con ${M.mentor.name} como mentor.`,'',{cat:'dir'});M.mentor=null;}}
/* ---------- Red de contactos ---------- */
/** Clubes con los que tienes relación: los que entrenaste y con los que hiciste traspasos. */
export function network(){const M=S.mgr,N={};const add=(id,v,why)=>{if(id==null||!T(id)||id===S.user)return;const e=N[id]||(N[id]={id,v:0,why:new Set()});e.v+=v;e.why.add(why);};
 S.teams.forEach(t=>{if((M.clubs||[]).some(c=>c.club===t.name))add(t.id,5,'lo entrenaste');});
 (S.tlog||[]).forEach(x=>{if(x.to===S.user)add(x.from,1,'traspasos');else if(x.from===S.user)add(x.to,1,'traspasos');});
 return Object.values(N).map(e=>({id:e.id,v:e.v,why:[...e.why].join(' y ')})).sort((a,b)=>b.v-a.v);}
export const inNetwork=id=>network().some(e=>String(e.id)===String(id));
/* ---------- Entrevista de trabajo ---------- */
export function interviewQs(t){const big=reqLic(t)>=2,lv=LG(t.lg).lv;return [
 {q:'¿Cuál es tu objetivo para esta temporada?',o:[['Pelear por todo desde el primer día',big?2:-1],['Crecer paso a paso y consolidar el proyecto',big?0:2],['Lo que diga la directiva',0]]},
 {q:'¿Qué harás con los jóvenes de la cantera?',o:[['Les daré minutos de verdad',lv>=2?2:1],['Jugarán si se lo ganan',1],['Prefiero veteranos que ganen ya',big?1:-1]]},
 {q:'¿Cómo quieres que juegue el equipo?',o:[['Fútbol de ataque y posesión',big?2:0],['Ordenado y difícil de batir',big?0:2],['Me adapto a la plantilla',1]]}];}
/** Probabilidad de que te contraten tras la entrevista (score: suma de respuestas). */
export function interviewChance(t,score,clubReq){const M=S.mgr,E=eligibility(t),miss=Math.max(0,E.need-validLevel(E.jur));return clamp(.3+(M.rep-clubReq(t))/30+score*.05+(inNetwork(t.id)?.15:0)-miss*.25+mgrLevel()*.01,.03,.92);}
