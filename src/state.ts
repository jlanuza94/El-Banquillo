/* El Banquillo · state.js — Estado global de la partida (S) y accesos rápidos a equipos, jugadores y ligas. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {esc,r3,setRngState} from './core';
import {COUNTRIES,LV_NAMES,LV_SH} from './data';
export let S=null;
export function setS(v){S=v;if(v&&v.rng)setRngState(v.rng);}
/** Variables de ejecución compartidas entre módulos (temporizadores y cachés). */
export const RT={timer:null,toastT:null,saveT:null,SQ:null,keyCache:null,startC:0,startLv:4};
export const T=id=>S.teams[id];
export const PL=id=>S.players[id];
export const LG=id=>S.leagues[id];
export const dirty=()=>{RT.SQ=null;RT.keyCache=null;};
export function squad(tid){if(!RT.SQ){RT.SQ={};for(const p of Object.values(S.players)){const k=p.team===null?'fa':p.team;(RT.SQ[k]||(RT.SQ[k]=[])).push(p);}}return (RT.SQ[tid]||[]).slice();}
export const setTeam=(p,t)=>{p.team=t;dirty();};
export const available=p=>p&&!p.inj&&!p.susp;
export const shortNm=id=>{const p=PL(id);if(!p)return '—';const [f,...l]=p.name.split(' ');return f[0]+'. '+l.join(' ');};
export const lastNm=id=>{const p=PL(id);return p?p.name.split(' ').slice(1).join(' '):'';};
export const seasonLabel=(n)=>{const y=2025+(n||S.seasonN);return y+'/'+String(y+1).slice(2);};
export const uLg=()=>T(S.user).lg;
export const lgName=(id,short)=>{const L=LG(id),c=COUNTRIES[L.c];return short?`${c.code} ${LV_SH[L.lv]}`:`${c.n} · ${LV_NAMES[L.lv]}`;};
export const lgTeams=id=>S.teams.filter(t=>t.lg===id);
export const findLg=(c,lv)=>S.leagues.find(L=>L.c===c&&L.lv===lv);
export const lowest=L=>L.lv===COUNTRIES[L.c].lv-1;
export function lum(hex){const n=parseInt(hex.slice(1),16);const r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255;return .2126*r+.7152*g+.0722*b;}
export function crestStyle(t){return `--c1:${t.c1};--c2:${t.c2};--ct:${lum(t.c1)>.55?'#111':'#fff'}`;}
export function crest(t,cls=''){return `<span class="crest ${cls}" style="${crestStyle(t)}" aria-hidden="true">${esc(t.short)}</span>`;}
export const qc=v=>v>=8?'q5':v>=7?'q4':v>=6?'q3':v>=5?'q2':'q1';
export const rt=p=>(p.ovr/10).toFixed(1);
export const qBadge=(v10,cls='')=>`<span class="q ${qc(v10)} ${cls}">${v10.toFixed(1)}</span>`;
export const pBadge=p=>qBadge(p.ovr/10);
export const atCell=v=>`<span class="at ${qc(v)}">${v}</span>`;
/* economy scales with league level */
export const unit=rep=>.4*Math.pow(2.5,(rep-74.5)/10);
export const econ=id=>{const L=LG(id),u=unit(L.rep);return{tv:r3(u*.5),tix:u*.875,prize:u,promo:L.lv>0?u*12.5:0,champ:L.lv===0?u*5:0,cap:L.lv===0?L.rep+20:L.rep+12};};
