/* El Banquillo · worldhist.ts — Historia del mundo: enciclopedia de cada temporada, salón de la fama (jugadores y entrenadores) y récords. */
// @ts-nocheck — usa el estado heredado S.
import {COUNTRIES,LV_NAMES} from './data';
import {LG,S,T,lgName,seasonLabel} from './state';

const nm=id=>id!=null&&T(id)?T(id).name:'—';
/** Al terminar la temporada: guarda la página de la enciclopedia (con nombres, para que no cambien aunque los clubes cambien). */
export function recordSeason(sm,tabs){
 const lbl=seasonLabel(),A=(S.awards||[]).find(a=>a.season===lbl);
 const champs=S.leagues.map((L,i)=>({c:L.c,lv:L.lv,lg:lgName(L.id),champ:nm(tabs[i][0].id),runner:nm(tabs[i][1].id),pts:tabs[i][0].pts}));
 const tr=(S.tlog||[]).filter(x=>x.season===lbl&&x.fee).sort((a,b)=>b.fee-a.fee)[0];
 const page={season:lbl,champs,cups:(S.cups||[]).map(c=>({c:c.c,w:nm(c.winner)})),conts:(S.conts||[]).map((C,i)=>({i,w:nm(C.winner)})),cwc:S.cwc?nm(S.cwc.winner):null,
  ballon:A&&A.ballon&&A.ballon[0]?{name:A.ballon[0].name,club:A.ballon[0].club}:null,boot:A&&A.boot?{name:A.boot.name,g:A.boot.g,club:A.boot.club}:null,young:A&&A.young?{name:A.young.name,club:A.young.club}:null,
  transfer:tr?{name:tr.name,fee:tr.fee,from:tr.from!=null?nm(tr.from):'Libre',to:nm(tr.to)}:null,
  me:{club:T(S.user).name,lg:lgName(sm.lg),pos:sm.pos,up:sm.up,down:sm.down,champ:sm.champ}};
 S.ency=(S.ency||[]).concat([page]).slice(-60);
 // entrenadores campeones de Primera
 S.leagues.forEach((L,i)=>{if(L.lv!==0)return;const id=tabs[i][0].id,who=id===S.user?'Tú':(S.coaches&&S.coaches[id]&&S.coaches[id].name);if(!who)return;
  const ct=S.coachHall||(S.coachHall={});const e=ct[who]||(ct[who]={n:0,titles:[]});e.n++;e.titles.push(`${COUNTRIES[L.c].n} ${lbl} (${T(id).name})`);});
 // récords del mundo
 const W=S.wrec||(S.wrec={});
 if(page.boot&&(!W.goals||page.boot.g>W.goals.g))W.goals={...page.boot,season:lbl};
 champs.filter(c=>c.lv===0).forEach(c=>{if(!W.pts||c.pts>W.pts.pts)W.pts={club:c.champ,lg:c.lg,pts:c.pts,season:lbl};});
}
/** Cada traspaso: actualiza el récord del mundo y los récords de cada club. */
export function transferRecord(x){
 if(!x||!x.fee)return;const W=S.wrec||(S.wrec={});if(!W.fee||x.fee>W.fee.fee)W.fee={name:x.name,fee:x.fee,from:x.from!=null?nm(x.from):'Libre',to:nm(x.to),season:seasonLabel()};
 const R=S.clubRec||(S.clubRec={});
 if(x.to!=null){const r=R[x.to]||(R[x.to]={});if(!r.buy||x.fee>r.buy.fee)r.buy={name:x.name,fee:x.fee,season:seasonLabel()};}
 if(x.from!=null){const r=R[x.from]||(R[x.from]={});if(!r.sell||x.fee>r.sell.fee)r.sell={name:x.name,fee:x.fee,season:seasonLabel()};}
}
/** Récords de un club a partir de su historia. */
export function clubRecords(tid){
 const H=(S.chist&&S.chist[tid])||{t:[],s:[]},R=(S.clubRec||{})[tid]||{};
 const best=H.s.slice().sort((a,b)=>LG(a[1]).lv-LG(b[1]).lv||a[2]-b[2])[0],top=H.s.filter(x=>LG(x[1]).lv===0).length;
 return{best:best?`${best[2]}º en ${lgName(best[1])} (${best[0]})`:null,top,titles:H.t.length,buy:R.buy,sell:R.sell};
}
export const lvName=lv=>LV_NAMES[lv];
