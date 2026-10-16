/* El Banquillo · state.js — Estado global de la partida (S) y accesos rápidos a equipos, jugadores y ligas. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {esc,r3,setRngState} from './core';
import {COUNTRIES,LV_NAMES,LV_SH} from './data';
/** Países que existen en este mundo (las partidas antiguas tienen 10; las nuevas, todos). Siempre 0..n-1. */
export const nC=()=>S&&S.leagues&&S.leagues.length?Math.max(...S.leagues.map(L=>L.c))+1:COUNTRIES.length;
export const wcs=()=>Array.from({length:nC()},(_,i)=>i);
export let S=null;
export function setS(v){S=v;if(v&&v.rng)setRngState(v.rng);}
/** Variables de ejecución compartidas entre módulos (temporizadores y cachés). */
export const RT={timer:null,toastT:null,saveT:null,SQ:null,keyCache:null,startC:0,startLv:4};
export const T=id=>S.teams[id];
export const PL=id=>S.players[id];
export const LG=id=>S.leagues[id];
export const dirty=()=>{RT.SQ=null;RT.keyCache=null;};
export function squad(tid){if(!RT.SQ){RT.SQ={};for(const p of Object.values(S.players)){const k=p.team===null?'fa':p.team;(RT.SQ[k]||(RT.SQ[k]=[])).push(p);}}return (RT.SQ[tid]||[]).slice();}
/** Cambia de club a un jugador. Actualiza la caché de plantillas sin reconstruirla entera (es lo que más se repite en verano). */
export const setTeam=(p,t)=>{const old=p.team;p.team=t;if(t!==null)p.fa=0;RT.keyCache=null;if(!RT.SQ)return;const ko=old===null?'fa':old,kn=t===null?'fa':t;if(ko===kn)return;const a=RT.SQ[ko];if(a){const i=a.indexOf(p);if(i>=0)a.splice(i,1);}(RT.SQ[kn]||(RT.SQ[kn]=[])).push(p);};
export const available=p=>p&&!p.inj&&!p.susp;
export const shortNm=id=>{const p=PL(id);if(!p)return '—';const [f,...l]=p.name.split(' ');return f[0]+'. '+l.join(' ');};
export const lastNm=id=>{const p=PL(id);return p?p.name.split(' ').slice(1).join(' '):'';};
export const seasonLabel=(n)=>{const y=2025+(n||S.seasonN);return y+'/'+String(y+1).slice(2);};
export const uLg=()=>T(S.user).lg;
/** Nombre de un país (o el que le hayas puesto en el editor). */
export const cName=c=>(S&&S.cNames&&S.cNames[c])||COUNTRIES[c].n;
export const lgName=(id,short)=>{const L=LG(id),c=COUNTRIES[L.c];if(short)return `${c.code} ${LV_SH[L.lv]}`;const own=S&&S.lgNames&&S.lgNames[id];return own?`${cName(L.c)} · ${own}`:`${cName(L.c)} · ${LV_NAMES[L.lv]}`;};
export const lgTeams=id=>S.teams.filter(t=>t.lg===id);
export const findLg=(c,lv)=>S.leagues.find(L=>L.c===c&&L.lv===lv);
export const lowest=L=>L.lv===COUNTRIES[L.c].lv-1;
export function lum(hex){const n=parseInt(hex.slice(1),16);const r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255;return .2126*r+.7152*g+.0722*b;}
export function crestStyle(t){return `--c1:${t.c1};--c2:${t.c2};--ct:${lum(t.c1)>.55?'#111':'#fff'}`;}
export function crest(t,cls=''){return `<span class="crest ${cls} ${t.cs?'cs-'+t.cs:''}" style="${crestStyle(t)}" aria-hidden="true">${esc(t.short)}</span>`;}
export const qc=v=>v>=8?'q5':v>=7?'q4':v>=6?'q3':v>=5?'q2':'q1';
export const rt=p=>Math.round(p.ovr);
export const qBadge=(v10,cls='')=>`<span class="q ${qc(v10)} ${cls}">${Math.round(v10*10)}</span>`;
export const pBadge=p=>qBadge(p.ovr/10);
export const atCell=v=>`<span class="at ${qc(v)}">${Math.round(v*10)}</span>`;
/* economy scales with league level */
export const unit=rep=>.4*Math.pow(2.5,(rep-74.5)/10);
/** Riqueza de cada país (como en el mundo real): la Premier tiene mucho más dinero; Portugal, Argentina o Escocia, mucho menos.
 * Orden de COUNTRIES: España, Inglaterra, Italia, Alemania, Francia, Portugal, Brasil, Argentina, Países Bajos, México, Bélgica, Turquía, Escocia, EE. UU., Japón, Colombia. */
export const CWEALTH=[1,2.4,1,1.25,.95,.45,.5,.3,.6,.7,.5,.55,.35,.9,.7,.3];
/** La riqueza del país pesa sobre todo arriba: en las categorías bajas todos se parecen más. */
export const cwF=(c,lv)=>1+((CWEALTH[c]??.5)-1)*(lv===0?1:lv===1?.7:lv===2?.45:.25);
/** «Unidad» de dinero de una liga: su nivel y lo rico que es su país. */
export const lunit=id=>{const L=LG(id);return unit(L.rep)*cwF(L.c,L.lv);};
/** Los gigantes de cada liga (como Madrid, Barça y Atlético en España, o PSG en Francia) tienen muchísimo más dinero que el resto. */
const GIANTS={0:[3.2,3,2],1:[2,1.9,1.8,1.7,1.5,1.4],2:[2.2,1.9,1.7,1.4],3:[3.2,1.7,1.4],4:[3.6,1.4,1.2],5:[2.4,2.2,1.8],6:[1.8,1.7,1.6,1.5],7:[2.2,2],8:[2,1.8,1.6]};
/** Factor de riqueza de un club: los grandes de Primera según su reputación; en las categorías bajas, 1. */
export function clubWF(t){const L=LG(t.lg);if(!L||L.lv>0)return 1;RT.cwf=RT.cwf&&RT.cwf.s===S.seasonN?RT.cwf:{s:S.seasonN,m:{}};
 let r=RT.cwf.m[L.id];if(!r){r=RT.cwf.m[L.id]={};lgTeams(L.id).slice().sort((a,b)=>b.rep-a.rep).forEach((x,i)=>{const G=GIANTS[L.c]||[2,1.5,1.3];r[x.id]=i<G.length?G[i]:i>=14?.85:1;});}
 return r[t.id]??1;}
/** Parte de la tele que se lleva cada club: los grandes cobran más. */
export const tvShare=t=>.7+.3*clubWF(t);
export const econ=id=>{const L=LG(id),u=lunit(id);return{tv:r3(u*.5),tix:u*.875,prize:u,promo:L.lv>0?u*12.5:0,champ:L.lv===0?u*5:0,cap:L.lv===0?L.rep+20:L.rep+12};};
