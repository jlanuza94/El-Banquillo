/* El Banquillo · mgrcareer.ts — La carrera del entrenador: licencias (C, B, A, Pro) que se ganan temporada
 * a temporada, insignias por lo conseguido, y cómo eso cambia las ganas de los jugadores de venir a tu club.
 * También: ofrecer un puesto de técnico a los jugadores que se van a retirar (como en FM Mobile). */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,rnd} from './core';
import {LG,S,T,squad,uLg} from './state';
import {news} from './world';
import {ST_ROLES,crew,makeStaff,crewLevel,staffMax,staffWage} from './staff';

export const LICS=[['Licencia C','Recién empezado'],['Licencia B','Entrenador con oficio'],['Licencia A','Entrenador de prestigio'],['Licencia Pro','Élite de los banquillos']];
/** Licencia actual (0-3): sube con la reputación y las temporadas dirigidas. */
export function licence(){const M=S.mgr;if(!M)return 0;const yrs=M.seasons||0;return M.rep>=72&&yrs>=3?3:M.rep>=52&&yrs>=2?2:M.rep>=32||yrs>=1?1:0;}
/** Insignias: lo que has logrado en tu carrera. */
export const BADGES={asc:['⬆️','Ascenso','Has subido de categoría'],liga:['🏆','Campeón de liga','Has ganado una liga'],copa:['🥇','Copa','Has ganado una copa'],cant:['🌱','Cantera','Has hecho debutar a 5 canteranos'],obj:['🎯','Cumplidor','3 objetivos de la directiva cumplidos'],ojo:['🔎','Buen ojo','Has vendido un jugador por el triple de lo que costó'],fiel:['🤝','Fiel','5 temporadas en el mismo club'],mes:['🏅','Entrenador del mes','Has sido entrenador del mes']};
export function badges(){const B=S.mgr&&S.mgr.badges||{};return Object.keys(BADGES).filter(k=>B[k]);}
export function giveBadge(k){S.mgr.badges=S.mgr.badges||{};if(S.mgr.badges[k])return;S.mgr.badges[k]=S.seasonN;const b=BADGES[k];news(`Nueva insignia de entrenador: ${b[0]} ${b[1]}. ${b[2]}.`,'good',{cat:'dir',subj:`Insignia: ${b[1]}`});}
/** Al acabar la temporada: cuenta la temporada, revisa la licencia y las insignias. */
export function careerSeasonEnd(sm){
 const M=S.mgr;if(!M)return;const l0=licence();M.seasons=(M.seasons||0)+1;M.objOk=(M.objOk||0)+(sm.ok?1:0);M.sameClub=M.lastClub===S.user?(M.sameClub||1)+1:1;M.lastClub=S.user;
 if(sm.up)giveBadge('asc');if(sm.champ)giveBadge('liga');if((S.titles||[]).some(x=>!x.name.startsWith('Liga')))giveBadge('copa');if(M.objOk>=3)giveBadge('obj');if(M.sameClub>=5)giveBadge('fiel');
 if(squad(S.user).filter(p=>p.home&&p.st&&p.st.pj>0).length>=5)giveBadge('cant');
 const l1=licence();if(l1>l0)news(`¡Consigues la ${LICS[l1][0]}! Los jugadores te ven con otros ojos: más de ellos querrán venir a tu club.`,'good',{cat:'dir',subj:`Nueva licencia: ${LICS[l1][0]}`});
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
