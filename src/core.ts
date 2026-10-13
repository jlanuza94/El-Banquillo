/* El Banquillo · core.js — Constantes globales y utilidades (aleatorios, formato de dinero, escapes). */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
export const KEY='el-banquillo-v4';
export const $app=typeof document!=='undefined'?document.getElementById('app'):null;
/*
 * Generador de números aleatorios con semilla (sfc32). Toda la partida usa este generador y su estado se
 * guarda con la partida: con la misma partida y las mismas decisiones, los resultados son siempre los mismos.
 */
let RS=[0x9e3779b9,0x243f6a88,0xb7e15162,Date.now()>>>0];
function sfc32(){let [a,b,c,d]=RS;a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=c<<21|c>>>11;c=c+t|0;RS=[a,b,c,d];return (t>>>0)/4294967296;}
/** Fija la semilla (un número entero). */
export function seedRng(seed){seed=seed>>>0;RS=[0x9e3779b9,0x243f6a88,0xb7e15162,seed];for(let i=0;i<15;i++)sfc32();}
export const rngState=()=>RS.slice();
export function setRngState(s){if(Array.isArray(s)&&s.length===4)RS=s.map(x=>x>>>0);}
/** Semilla nueva a partir del reloj, para partidas nuevas. */
export const newSeed=()=>(Date.now()^Math.floor(performance.now()*1000))>>>0;
export const rnd=()=>sfc32();
export const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
export const pick=a=>a[Math.floor(rnd()*a.length)];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const r2=x=>Math.round(x*100)/100;
export const r3=x=>Math.round(x*1000)/1000;
export const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const money=v=>{const s=v<0?'−':'';v=Math.abs(v);if(v>=1)return s+'€'+v.toFixed(2)+'M';const k=v*1000;return s+'€'+(k<10&&Math.round(k*10)%10?(Math.round(k*10)/10).toFixed(1):Math.round(k))+'k';};
export const fill=(t,o)=>t.replace(/\{(\w+)\}/g,(_,k)=>o[k]);
export const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');

/** Minuto como se ve en el marcador: 90+3' en el descuento. */
export const fmtMin=n=>n>90?`90+${n-90}`:String(n);
