/* El Banquillo · core.js — Constantes globales y utilidades (aleatorios, formato de dinero, escapes). */
"use strict";
const KEY='el-banquillo-v4';
const $app=document.getElementById('app');
const rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const r2=x=>Math.round(x*100)/100;
const r3=x=>Math.round(x*1000)/1000;
const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const money=v=>{const s=v<0?'−':'';v=Math.abs(v);return s+(v>=1?'€'+v.toFixed(2)+'M':'€'+Math.round(v*1000)+'k');};
const fill=(t,o)=>t.replace(/\{(\w+)\}/g,(_,k)=>o[k]);
const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
