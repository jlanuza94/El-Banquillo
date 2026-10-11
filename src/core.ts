/* El Banquillo · core.js — Constantes globales y utilidades (aleatorios, formato de dinero, escapes). */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
export const KEY='el-banquillo-v4';
export const $app=typeof document!=='undefined'?document.getElementById('app'):null;
export const rnd=Math.random;
export const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
export const pick=a=>a[Math.floor(rnd()*a.length)];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const r2=x=>Math.round(x*100)/100;
export const r3=x=>Math.round(x*1000)/1000;
export const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const money=v=>{const s=v<0?'−':'';v=Math.abs(v);return s+(v>=1?'€'+v.toFixed(2)+'M':'€'+Math.round(v*1000)+'k');};
export const fill=(t,o)=>t.replace(/\{(\w+)\}/g,(_,k)=>o[k]);
export const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
