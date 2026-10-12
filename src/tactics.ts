/* El Banquillo · tactics.js — Valoración de jugadores por puesto, alineaciones, fuerza del equipo y clasificación. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {defaultRoles,remapRoles,roleRate} from './roles';
import {clamp} from './core';
import {COUNTRIES,FORMS,GRP,MENT,POS_ORD,WIDE} from './data';
import {LG,PL,S,T,available,lgTeams,lowest,squad,uLg} from './state';
import {rateA} from './players';
export function slotsOf(f){return ['POR',...FORMS[f].flatMap(r=>r[0])];}
export function counts(f){const c={DEF:0,MED:0,DEL:0};FORMS[f].forEach(r=>r[0].forEach(x=>c[GRP[x]]++));return c;}
export function prof(p,s){if(p.sp===s)return 1;if(s==='POR'||p.sp==='POR')return .45;if(p.alt&&p.alt.includes(s))return .95;const a=GRP[p.sp],b=GRP[s];if(a===b)return .86;return Math.abs(POS_ORD[a]-POS_ORD[b])===1?.8:.68;}
export function footF(p,s){if((s==='LI'||s==='MI')&&p.foot==='D')return p.wf>=4?1:p.wf===3?.98:.95;if((s==='LD'||s==='MD')&&p.foot==='I')return p.wf>=4?1:p.wf===3?.98:.95;return 1;}
export const hasTr=(p,t)=>p.tr&&p.tr.includes(t);
export function traitBonus(p,s){let b=0;if(hasTr(p,'mur')&&GRP[s]==='DEF')b+=2;if(hasTr(p,'vel')&&WIDE.includes(s))b+=1.5;if(hasTr(p,'par')&&s==='POR')b+=2;return b;}
export const hapMult=p=>p.team===S.user&&p.hap!=null?(p.hap<30?.95:p.hap<50?.98:p.hap>80?1.02:1)*(p.adapt>0?.96:1):1;
export const langOf=p=>COUNTRIES[p.nat].lang;
export function influence(p,sq){sq=sq||squad(S.user);const rank=sq.slice().sort((a,b)=>b.ovr-a.ovr).indexOf(p);return Math.round(clamp((p.age-18)*3,0,40)+((p.st&&S.tg)?p.st.pj/S.tg*20:10)+(rank<3?20:rank<8?10:0)+(p.per==='lid'?25:0)+(T(S.user).cap===p.id?10:0));}
export function leaders(n){const sq=squad(S.user).filter(p=>!p.loan);return sq.map(p=>[p,influence(p,sq)]).sort((a,b)=>b[1]-a[1]).slice(0,n||3);}
export function setAdapt(p){const same=squad(S.user).filter(x=>x!==p&&langOf(x)===langOf(p)).length;p.adapt=same>=3?2:same>=1?5:8;if(same>=3)p.hap=clamp((p.hap||70)+5,0,100);}
export const slotRate=(p,slot,role)=>roleRate(p,slot,role)*10*prof(p,slot)*footF(p,slot)+traitBonus(p,slot);
export function eff(p,slot,en,role){const e=en==null?p.energy:en;return slotRate(p,slot,role)*(.75+.25*e/100)*hapMult(p)+p.form;}
/** Roles del once de tu equipo (uno por hueco de la formación). */
export function userRoles(){const t=T(S.user),sl=slotsOf(t.formation);if(!t.roles||t.roles.length!==sl.length)t.roles=defaultRoles(sl);return t.roles;}
export function autoLineup(tid,f){
 const slots=slotsOf(f),pool=squad(tid).filter(available),used=new Set(),lu=Array(slots.length).fill(null);
 const pass=ok=>slots.forEach((s,i)=>{if(lu[i])return;let b=null,bv=-1;for(const p of pool){if(used.has(p.id)||!ok(p,s))continue;const v=eff(p,s);if(v>bv){bv=v;b=p;}}if(b){lu[i]=b.id;used.add(b.id);}});
 pass((p,s)=>p.sp===s);pass((p,s)=>GRP[p.sp]===GRP[s]&&(s!=='POR'||p.sp==='POR'));pass(()=>true);
 return lu;
}
export function teamPower(lu,f,en,hurt,mult=1,roles=null){
 const slots=slotsOf(f),g={POR:[],DEF:[],MED:[],DEL:[]},all=[];
 slots.forEach((s,i)=>{const p=PL(lu[i]);let v=p?eff(p,s,en?en[p.id]:null,roles?roles[i]:null):20;if(p&&hurt&&hurt[p.id])v*=.55;g[GRP[s]].push(v);all.push(v);});
 const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:20;
 const c=counts(f);
 const G=avg(g.POR),D=avg(g.DEF)*(1+.05*(c.DEF-4)),M=avg(g.MED)*(1+.05*(c.MED-4)),A=avg(g.DEL)*(1+.06*(c.DEL-2));
 return{atk:(.6*A+.4*M)*mult,def:(.55*D+.2*M+.25*G)*mult,mid:M*mult,ovr:avg(all)};
}
export const famOf=f=>S.famil&&S.famil[f]!=null?S.famil[f]:40;
export const chemMult=f=>.92+.06*S.chem/100+.04*famOf(f)/100;
export function xg(A,D,home,mA,mD){return clamp(1.18*Math.pow(A.atk/D.def,3)*(home===true?1.12:home===false?.92:1)*MENT[mA].own*MENT[mD].opp,.15,4.5);}
export function lineupIssues(){const t=T(S.user);return t.lineup.map((id,i)=>({i,id})).filter(x=>!x.id||!available(PL(x.id))||PL(x.id).team!==S.user);}
export function fixLineup(){
 const t=T(S.user),slots=slotsOf(t.formation);let fixed=0;
 t.lineup=slots.map((s,i)=>{const id=t.lineup[i];return (id&&PL(id)&&PL(id).team===S.user&&available(PL(id)))?id:null;});
 slots.forEach((s,i)=>{if(t.lineup[i])return;const b=squad(S.user).filter(p=>available(p)&&!t.lineup.includes(p.id)).sort((x,y)=>eff(y,s)-eff(x,s))[0];if(b){t.lineup[i]=b.id;fixed++;}});
 return fixed;
}
export function setFormation(f){
 const t=T(S.user),left=t.lineup.filter(id=>id&&PL(id)),slots=slotsOf(f),lu=Array(slots.length).fill(null);
 const pass=ok=>slots.forEach((s,i)=>{if(lu[i])return;const k=left.findIndex(id=>ok(PL(id),s));if(k>=0){lu[i]=left[k];left.splice(k,1);}});
 pass((p,s)=>p.sp===s);pass((p,s)=>p.alt&&p.alt.includes(s));pass((p,s)=>GRP[p.sp]===GRP[s]);
 slots.forEach((s,i)=>{if(lu[i]||!left.length)return;left.sort((x,y)=>eff(PL(y),s)-eff(PL(x),s));lu[i]=left.shift();});
 t.roles=remapRoles(t.formation?slotsOf(t.formation):[],t.roles,slots);t.formation=f;t.lineup=lu;fixLineup();
}
export function table(lg){
 const t={};lgTeams(lg).forEach(tm=>t[tm.id]={id:tm.id,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0,form:[]});
 S.fixtures[lg].forEach(rd=>rd.forEach(f=>{if(!f.played)return;const H=t[f.h],A=t[f.a];H.pj++;A.pj++;H.gf+=f.hg;H.gc+=f.ag;A.gf+=f.ag;A.gc+=f.hg;
  if(f.hg>f.ag){H.g++;A.p++;H.pts+=3;H.form.push('G');A.form.push('P');}else if(f.hg<f.ag){A.g++;H.p++;A.pts+=3;A.form.push('G');H.form.push('P');}else{H.e++;A.e++;H.pts++;A.pts++;H.form.push('E');A.form.push('E');}}));
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf||T(a.id).name.localeCompare(T(b.id).name));
}
export const posOf=tid=>table(T(tid).lg).findIndex(r=>r.id===tid)+1;
export const nRounds=()=>S.fixtures[0].length;
export const nextFixture=()=>S.week<nRounds()?S.fixtures[uLg()][S.week].find(f=>f.h===S.user||f.a===S.user):null;
export function zoneOf(lg,i){const L=LG(lg);if(L.lv===0&&i===0)return 'z1';if(L.lv>0&&i<3)return 'z4';if(!lowest(L)&&i>=17)return 'z3';return '';}
