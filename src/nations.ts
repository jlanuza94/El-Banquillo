/* El Banquillo · nations.ts — Selecciones nacionales: convocatorias, parones FIFA, Mundial, Eurocopa y Copa América,
 * y la posibilidad de ser seleccionador a la vez que entrenas a un club. */
// @ts-nocheck — usa el estado heredado S.
import {nC,wcs} from './state';
import {retosNT} from './retos';
import {unlock} from './club';
import {clamp,money,pick,r2,rnd,shuffle} from './core';
import {COUNTRIES,GRP} from './data';
import {PL,S,T,seasonLabel,squad} from './state';
import {news} from './world';
import {poisson} from './engine';

/* ---------- Torneos ---------- */
export const EUROPE=[0,1,2,3,4,5,8,10,11,12],AMERICA=[6,7,9,13,15];
export const TOURN={wc:{n:'Mundial',sh:'MUN'},eu:{n:'Eurocopa',sh:'EUR'},ca:{n:'Copa América',sh:'CAM'}};
/** Año del verano en que acaba la temporada actual (la 2026/27 acaba en el verano de 2027). */
export const summerYear=(n=S.seasonN)=>2026+n;
/** Torneos que se juegan en el verano que acaba la temporada n. */
export function tournamentsIn(n=S.seasonN){const y=summerYear(n);return y%4===2?['wc']:y%4===0?['eu','ca']:[];}
/** Próximo verano con torneos: [n, lista]. */
export function nextTournaments(){for(let n=S.seasonN;n<S.seasonN+4;n++){const t=tournamentsIn(n);if(t.length)return[n,t];}return[S.seasonN,[]];}
const members=k=>(k==='wc'?wcs():k==='eu'?EUROPE:AMERICA).filter(c=>c<nC());

/* ---------- Jugadores y convocatorias ---------- */
const NEED={POR:3,DEF:8,MED:7,DEL:5};
const grp=p=>GRP[p.sp]||p.pos;
/** Jugadores elegibles de un país, de mejor a peor. */
export function pool(c,n=60){return Object.values(S.players).filter(p=>p.nat===c&&p.age>=17&&!p.ret).sort((a,b)=>b.ovr-a.ovr).slice(0,n);}
/** Convocatoria automática: los mejores 23, con 3 porteros, 8 defensas, 7 medios y 5 delanteros. */
export function autoCall(c){const P=pool(c,90),out=[];Object.entries(NEED).forEach(([g,k])=>out.push(...P.filter(p=>grp(p)===g&&!p.inj).slice(0,k)));
 if(out.length<23)out.push(...P.filter(p=>!out.includes(p)).slice(0,23-out.length));return out.slice(0,23).map(p=>p.id);}
/** Convocatoria vigente de un país: la tuya si eres su seleccionador, si no la automática. */
export function callOf(c){if(S.nt&&S.nt.c===c&&S.nt.call&&S.nt.call.length){const ids=S.nt.call.filter(id=>PL(id)&&PL(id).nat===c);if(ids.length>=18)return ids;}return autoCall(c);}
/** Once titular de una convocatoria (4-4-2 por media) y su fuerza. */
export function xiOf(ids){const ps=ids.map(PL).filter(p=>p&&!p.inj).sort((a,b)=>b.ovr-a.ovr),take=(g,k)=>ps.filter(p=>grp(p)===g).slice(0,k);
 let xi=[...take('POR',1),...take('DEF',4),...take('MED',4),...take('DEL',2)];if(xi.length<11)xi.push(...ps.filter(p=>!xi.includes(p)).slice(0,11-xi.length));return xi;}
export const strengthOf=ids=>{const xi=xiOf(ids);return xi.length?xi.reduce((a,p)=>a+p.ovr,0)/xi.length:40;};

/* ---------- Ranking (tipo Elo) ---------- */
export function initIntl(){if(S.intl)return;S.intl={elo:COUNTRIES.map((_,c)=>Math.round(1300+strengthOf(autoCall(c))*6)),hist:[],last:null,titles:COUNTRIES.map(()=>({wc:0,eu:0,ca:0}))};}
export const ranking=()=>wcs().sort((a,b)=>(S.intl.elo[b]??1500)-(S.intl.elo[a]??1500));
const eloUpd=(a,b,ga,gb,k=30)=>{const E=1/(1+10**((S.intl.elo[b]-S.intl.elo[a])/400)),Sa=ga>gb?1:ga<gb?0:.5,d=Math.round(k*(Sa-E));S.intl.elo[a]+=d;S.intl.elo[b]-=d;};

/* ---------- Partido entre selecciones ---------- */
/** Simula un partido. Si ko, hay penaltis. Suma internacionalidades y goles a los jugadores. */
export function ntMatch(a,b,ko,k=30){
 const ca=callOf(a),cb=callOf(b),sa=strengthOf(ca),sb=strengthOf(cb),d=(sa-sb)/9+(S.intl.elo[a]-S.intl.elo[b])/900;
 const ga=poisson(1.25*Math.exp(d/2)),gb=poisson(1.25*Math.exp(-d/2));
 [[ca,ga],[cb,gb]].forEach(([ids,g])=>{const xi=xiOf(ids);const subs=shuffle(ids.filter(id=>!xi.some(p=>p.id===id))).slice(0,4).map(PL);
  [...xi,...subs].forEach(p=>{p.caps=(p.caps||0)+1;});
  for(let i=0;i<g;i++){const w=xi.flatMap(p=>Array(grp(p)==='DEL'?6:grp(p)==='MED'?3:grp(p)==='DEF'?1:0).fill(p));if(w.length){const s=pick(w);s.ig=(s.ig||0)+1;}}});
 let pen=null;if(ko&&ga===gb){const pa=.5+clamp((sa-sb)/80,-.15,.15);pen=rnd()<pa?[5,4]:[4,5];}
 eloUpd(a,b,ga+(pen?(pen[0]>pen[1]?.1:-.1):0),gb,k);
 return{a,b,ga,gb,pen,w:ga>gb||(pen&&pen[0]>pen[1])?a:b};
}
const fmt=r=>`${COUNTRIES[r.a].n} ${r.ga}-${r.gb} ${COUNTRIES[r.b].n}${r.pen?` (pen. ${r.pen[0]}-${r.pen[1]})`:''}`;

/** Juega un torneo completo: grupos y eliminatorias. Devuelve el resumen. */
export function playTournament(k){
 const tm=shuffle(members(k).slice()),T0={k,n:TOURN[k].n,season:seasonLabel(),groups:[],ko:[],champ:null,runner:null,top:null};
 const nG=tm.length>=8?2:1,groups=Array.from({length:nG},(_,g)=>tm.filter((_,i)=>i%nG===g));
 const gTables=groups.map(gs=>{const tb=gs.map(c=>({c,pts:0,gf:0,ga:0}));const ms=[];
  for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const r=ntMatch(gs[i],gs[j],false);ms.push(r);
   const A=tb.find(x=>x.c===r.a),B=tb.find(x=>x.c===r.b);A.gf+=r.ga;A.ga+=r.gb;B.gf+=r.gb;B.ga+=r.ga;if(r.ga>r.gb)A.pts+=3;else if(r.ga<r.gb)B.pts+=3;else{A.pts++;B.pts++;}}
  tb.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf||S.intl.elo[y.c]-S.intl.elo[x.c]);return{tb,ms};});
 T0.groups=gTables.map(g=>({tb:g.tb,ms:g.ms.map(fmt)}));
 let fin;
 if(tm.length===3){fin=[gTables[0].tb[0].c,gTables[0].tb[1].c];}
 else{const semis=nG===2?[[gTables[0].tb[0].c,gTables[1].tb[1].c],[gTables[1].tb[0].c,gTables[0].tb[1].c]]:[[gTables[0].tb[0].c,gTables[0].tb[3].c],[gTables[0].tb[1].c,gTables[0].tb[2].c]];
  const sr=semis.map(([a,b])=>ntMatch(a,b,true,40));T0.ko.push({rd:'Semifinales',ms:sr.map(fmt)});T0.semi=sr.flatMap(r=>[r.a,r.b]);fin=sr.map(r=>r.w);}
 const f=ntMatch(fin[0],fin[1],true,50);T0.ko.push({rd:'Final',ms:[fmt(f)]});T0.champ=f.w;T0.runner=f.w===f.a?f.b:f.a;
 S.intl.titles[T0.champ][k]++;
 // máximo goleador del torneo: el que más goles internacionales sumó en este torneo
 return T0;
}
/** Puesto alcanzado por un país en un torneo: 1 campeón, 2 finalista, 3 semifinal, 4 fase de grupos. */
export function placeOf(T0,c){return T0.champ===c?1:T0.runner===c?2:(T0.semi||[]).includes(c)?3:4;}

/* ---------- Verano: torneos ---------- */
/** Se llama al empezar la nueva temporada: juega los torneos del verano y avisa de lo que pasó. */
export function summerTournaments(){
 initIntl();const ks=tournamentsIn(S.seasonN-1);if(!ks.length)return;
 const before=Object.fromEntries(Object.values(S.players).map(p=>[p.id,p.ig||0]));
 ks.forEach(k=>{const T0=playTournament(k);T0.year=summerYear(S.seasonN-1);
  const sc=Object.values(S.players).filter(p=>members(k).includes(p.nat)).map(p=>[p,(p.ig||0)-(before[p.id]||0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])[0];
  if(sc)T0.top={name:sc[0].name,g:sc[1],c:sc[0].nat};
  S.intl.hist.unshift(T0);S.intl.hist=S.intl.hist.slice(0,12);
  // los campeones se revalorizan; los de tu club vuelven contentos
  callOf(T0.champ).map(PL).forEach(p=>{if(!p)return;p.value=r2(p.value*1.06);if(p.team===S.user)p.hap=clamp((p.hap??70)+6,0,100);});
  const mine=squad(S.user).filter(p=>callOf(p.nat).includes(p.id)&&members(k).includes(p.nat));
  news(`${T0.n} ${summerYear(S.seasonN-1)}: ¡${COUNTRIES[T0.champ].n} campeona! Final ante ${COUNTRIES[T0.runner].n}.${T0.top?` Máximo goleador: ${T0.top.name} (${T0.top.g}).`:''}${mine.length?` De tu club fueron ${mine.length}: ${mine.map(p=>p.name).join(', ')}.`:''}`,'',{cat:'com',subj:`${T0.n}: campeona ${COUNTRIES[T0.champ].n}`,act:[{l:'Ver selecciones',a:'view',v:'selecciones'}]});
  if(S.nt&&members(k).includes(S.nt.c))ntJudge(T0);
 });
}
/** La federación juzga al seleccionador según lo esperado por el ranking. */
function ntJudge(T0){
 const c=S.nt.c,place=placeOf(T0,c),field=members(T0.k),rk=ranking().filter(x=>field.includes(x)).indexOf(c)+1;
 const exp=rk<=1?1.6:rk<=2?2.2:rk<=4?3:4,diff=exp-place;
 S.nt.res=S.nt.res||[];S.nt.res.unshift({season:String(T0.year),n:T0.n,place});
 S.mgr.rep=clamp(S.mgr.rep+diff*3+(place===1?6:0),0,100);
 if(place===1){retosNT();unlock('ntcamp');S.mgr.titles=(S.mgr.titles||0)+1;S.ntTitles=(S.ntTitles||[]);S.ntTitles.push({n:T0.n,c,season:T0.season});}
 const txt=place===1?`¡Campeón con ${COUNTRIES[c].n}! Tu reputación se dispara.`:place===2?`Finalista con ${COUNTRIES[c].n}.`:place===3?`Semifinalista con ${COUNTRIES[c].n}.`:`${COUNTRIES[c].n} cae en la fase de grupos.`;
 if(diff<=-1.5){news(`${txt} La federación esperaba mucho más y te destituye como seleccionador.`,'bad',{cat:'dir',subj:'Destituido como seleccionador'});S.nt=null;return;}
 news(`${txt} ${diff>=0?'La federación está satisfecha.':'La federación esperaba algo más, pero sigues en el cargo.'}`,diff>=0?'good':'',{cat:'dir',subj:`${T0.n} con ${COUNTRIES[c].n}`});
}

/* ---------- Parones FIFA durante la temporada ---------- */
export const FIFA_WEEKS=[9,27];
/** Semana de selecciones: tus internacionales se van con su país, vuelven cansados y alguno tocado. */
export function fifaWeek(){
 if(!FIFA_WEEKS.includes(S.week))return;initIntl();
 const order=shuffle(wcs()),res=[];
 for(let i=0;i+1<order.length;i+=2)res.push(ntMatch(order[i],order[i+1],false,15));
 const called=squad(S.user).filter(p=>!p.loan&&callOf(p.nat).includes(p.id)),hurt=[];
 called.forEach(p=>{p.energy=Math.max(40,(p.energy??100)-12);p.hap=clamp((p.hap??70)+2,0,100);if(rnd()<.04&&!p.inj){p.inj=1+(rnd()<.4?1:0);p.injT='Lesión con su selección';hurt.push(p);}});
 const my=S.nt?res.find(r=>r.a===S.nt.c||r.b===S.nt.c):null;
 if(my){const won=my.w===S.nt.c&&my.ga!==my.gb;S.mgr.rep=clamp(S.mgr.rep+(my.ga===my.gb?0:won?.6:-.6),0,100);}
 if(called.length||my)news(`Parón de selecciones.${called.length?` Convocados de tu club: ${called.map(p=>p.name).join(', ')}. Vuelven más cansados.`:''}${hurt.length?` ${hurt.map(p=>p.name).join(', ')} vuelve${hurt.length>1?'n':''} lesionado${hurt.length>1?'s':''}.`:''}${my?` Tu selección: ${fmt(my)}.`:''}`,hurt.length?'bad':'',{cat:'com',subj:'Parón de selecciones',quiet:!hurt.length&&!my});
}

/* ---------- Ser seleccionador ---------- */
/** Reputación que pide cada federación: más cuanto mejor está en el ranking. */
export const ntReq=c=>{const n=nC(),r=ranking().indexOf(c);return Math.round(48+(n-1-r)*40/(n-1));};
export const NT_SAL=c=>Math.round((.002+(nC()-1-ranking().indexOf(c))*.0012*9/(nC()-1))*2000)/2000;
export function applyNT(c){
 initIntl();if(S.nt)return 'Ya eres seleccionador.';S.ntApplied=S.ntApplied||{};if(S.ntApplied[c]===S.seasonN)return 'Ya te rechazaron esta temporada.';
 const req=ntReq(c),ch=clamp(.3+(S.mgr.rep-req)/25,0,.9);S.ntApplied[c]=S.seasonN;
 if(rnd()<ch){takeNT(c);return '';}
 news(`La federación de ${COUNTRIES[c].n} prefiere a otro candidato.`,'bad',{cat:'dir'});return `${COUNTRIES[c].n} ha elegido a otro seleccionador.`;
}
export function takeNT(c){S.nt={c,since:seasonLabel(),call:[],res:[]};unlock('selec');news(`Eres el nuevo seleccionador de ${COUNTRIES[c].n}. Compaginarás el cargo con tu club. Cobrarás ${money(NT_SAL(c))}/sem extra y tú eliges la convocatoria.`,'good',{cat:'dir',subj:`Seleccionador de ${COUNTRIES[c].n}`,act:[{l:'Convocatoria',a:'view',v:'selecciones'}]});}
export function leaveNT(){if(!S.nt)return;news(`Dejas el cargo de seleccionador de ${COUNTRIES[S.nt.c].n}.`,'',{cat:'dir'});S.nt=null;}
/** Al final de temporada alguna federación puede llamarte si tu reputación es alta. */
export function ntOffers(){
 initIntl();if(S.nt||rnd()>.35)return;const c=wcs().filter(c=>S.mgr.rep>=ntReq(c)-4).sort((a,b)=>ntReq(b)-ntReq(a))[0];if(c==null)return;
 S.ntOffer=c;news(`La federación de ${COUNTRIES[c].n} te ofrece ser su seleccionador, compaginándolo con tu club.`,'good',{cat:'dir',subj:`Oferta: seleccionador de ${COUNTRIES[c].n}`,act:[{l:'Aceptar',a:'nt-accept'},{l:'Ver selecciones',a:'view',v:'selecciones'}]});
}
/** Marca o desmarca un jugador en tu convocatoria (máximo 23). */
export function toggleCall(id){
 if(!S.nt)return 'No eres seleccionador.';const p=PL(id);if(!p||p.nat!==S.nt.c)return 'No es de tu país.';
 if(!S.nt.call||!S.nt.call.length)S.nt.call=autoCall(S.nt.c);
 const i=S.nt.call.indexOf(id);if(i>=0){S.nt.call.splice(i,1);return '';}if(S.nt.call.length>=23)return 'Ya tienes 23 convocados: quita a alguno primero.';S.nt.call.push(id);return '';
}
export const ntSalary=()=>S.nt?NT_SAL(S.nt.c):0;
