/* El Banquillo · persist.js — Guardado (IndexedDB), carga, copia de seguridad y migraciones de formato. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {KEY,rngState} from './core';
import {ATTRS,COUNTRIES,NAMES,ST_K,newSt} from './data';
import {RT,S,rt,T,seasonLabel,lgName,uLg} from './state';
import LZString from 'lz-string';
import {deriveAttrs,rateA,setValue} from './players';
import {toast} from './views/common';
import {boot} from './boot';
export const PF_V4=['id','name','nat','pos','age','pot','team','num','energy','form','goals','apps','yc','inj','susp','pInj','pSusp','contract','wage','tf','sg'];
export const PF=PF_V4.concat(['sp','alt','foot','wf','h','per','tr','hap','role','cl','st','car','hist','req','prom','tw','injT','pInjT','prone','recov','agc','ph','adapt','home','paid','boomS','son','ag','lpj','lmt','loanOk','stag','edited','mt','caps','ig','vt','vh','lf']);
export const packName=p=>{const L=NAMES[COUNTRIES[p.nat].lang],i=p.name.indexOf(' '),a=L[0].indexOf(p.name.slice(0,i)),b=L[1].indexOf(p.name.slice(i+1));return a>=0&&b>=0?a+'.'+b:p.name;};
export function pack(){
 const o=Object.assign({},S);o.players=undefined;o.rng=rngState();
 o.pf=PF;o.pk=Object.values(S.players).map(p=>[...PF.map(k=>k==='name'?packName(p):k==='id'?+p.id.slice(1):k==='st'?(p.st&&p.st.pj?ST_K.map(x=>x==='rs'?Math.round(p.st.rs*10):p.st[x]):0):k==='alt'||k==='tr'?(p[k]||[]).join(','):p[k]===undefined?0:p[k]),ATTRS.map(k=>String.fromCharCode(96+p.at[k])).join(''),p.loan?(p.loan.opt||p.loan.obj?[p.loan.from,p.loan.opt||0,p.loan.obj||0]:p.loan.from):-1,p.playedWk?1:0]);
 o.fixtures=undefined;o.fk=S.fixtures.map(lg=>lg.map(rd=>rd.map(f=>f.played?(f.ev&&f.ev.length?[f.h,f.a,f.hg,f.ag,f.ev]:[f.h,f.a,f.hg,f.ag]):[f.h,f.a])));
 return JSON.stringify(o);
}
export function unpack(str){
 const o=JSON.parse(str);if(!o||o.v!==4||!o.pk)return null;const pf=o.pf||PF_V4;delete o.pf;
 o.fixtures=o.fk.map(lg=>lg.map(rd=>rd.map(a=>a.length>2?{h:a[0],a:a[1],hg:a[2],ag:a[3],played:true,ev:a[4]||[]}:{h:a[0],a:a[1],hg:null,ag:null,played:false,ev:[]})));delete o.fk;
 o.players={};o.pk.forEach(a=>{const p={};pf.forEach((k,i)=>p[k]=a[i]);if(pf.length>PF_V4.length){p.alt=p.alt?p.alt.split(','):[];p.tr=p.tr?p.tr.split(','):[];if(p.st){const v=p.st;p.st={};ST_K.forEach((x,j)=>p.st[x]=x==='rs'?v[j]/10:(v[j]??0));}else p.st=newSt();if(!p.prom)p.prom=null;}p.id='p'+p.id;if(/^\d+\.\d+$/.test(p.name)){const L=NAMES[COUNTRIES[p.nat].lang],[x,y]=p.name.split('.');p.name=L[0][+x]+' '+L[1][+y];}{const s=a[pf.length];p.at={};ATTRS.forEach((k,i)=>{if(i<s.length)p.at[k]=s.charCodeAt(i)-96;});if(s.length<ATTRS.length){if(!p.h)p.h=180;deriveAttrs(p);}}{const L=a[pf.length+1];p.loan=Array.isArray(L)?Object.assign({from:L[0]},L[1]?{opt:L[1]}:{},L[2]?{obj:L[2]}:{}):L>=0?{from:L}:null;}if(!p.ph)p.ph=null;p.playedWk=!!a[pf.length+2];p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);o.players[p.id]=p;});
 delete o.pk;return o;
}
export let saveWarned=false;
export function exportCode(){return 'EB1:'+LZString.compressToBase64(pack());}
export function importCode(txt,newSlot){
 txt=String(txt||'').trim();let str=null;
 try{if(txt.startsWith('EB1:'))str=LZString.decompressFromBase64(txt.slice(4));else if(txt.startsWith('EB0:'))str=txt.slice(4);else if(txt.startsWith('{'))str=txt;}catch(e){str=null;}
 if(!str)return false;let o=null;try{o=unpack(str);}catch(e){o=null;}if(!o||o.user==null)return false;
 o.slot=newSlot?freeSlot()||(S&&S.slot)||1:S&&S.slot||freeSlot()||1;
 clearInterval(RT.timer);RT.timer=null;boot(o);saveNow();return true;
}

/* ---------- IndexedDB: varias partidas guardadas (ranuras) ---------- */
export const MAX_SLOTS=5;
/** Resumen de cada partida guardada, para la pantalla de inicio. */
export let slots=[];
export let idbP=null;
export function idb(){return idbP||(idbP=new Promise((res,rej)=>{try{const r=indexedDB.open('el-banquillo',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}}));}
export function idbDo(mode,fn){return idb().then(db=>new Promise((res,rej)=>{const tx=db.transaction('kv',mode),q=fn(tx.objectStore('kv'));tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error);}));}
const slotKey=id=>'slot:'+id;
export function freeSlot(){for(let i=1;i<=MAX_SLOTS;i++)if(!slots.some(x=>x.id===i))return i;return null;}
function slotMeta(st){const t=st.teams[st.user];return{id:st.slot,club:t.name,short:t.short,c1:t.c1,c2:t.c2,season:seasonLabel(),lg:lgName(uLg()),week:st.week,updated:Date.now()};}
export function saveNow(){
 clearTimeout(RT.saveT);RT.saveT=null;if(!S||S.user==null)return;
 if(!S.slot)S.slot=freeSlot()||1;
 let str;try{str=pack();}catch(e){return;}
 const meta=slotMeta(S);slots=slots.filter(x=>x.id!==meta.id).concat([meta]).sort((a,b)=>a.id-b.id);
 idbDo('readwrite',st=>{st.put(str,slotKey(meta.id));st.put(slots,'slots');st.delete(KEY);return st.put(meta.id,'last');})
  .then(()=>{try{localStorage.removeItem(KEY);}catch(e){}})
  .catch(()=>{if(!saveWarned){saveWarned=true;toast('No se pudo guardar la partida en este navegador.');}});
}
export function save(){clearTimeout(RT.saveT);RT.saveT=setTimeout(saveNow,400);}
/** Carga la lista de partidas y la última jugada. Convierte el guardado antiguo (una sola partida) en la ranura 1. */
export async function loadAsync(){
 try{slots=(await idbDo('readonly',st=>st.get('slots')))||[];}catch(e){slots=[];}
 if(!slots.length){
  let r=null;try{r=await idbDo('readonly',st=>st.get(KEY));}catch(e){}
  if(!r){try{r=localStorage.getItem(KEY);}catch(e){}}
  if(r){try{const o=unpack(r);if(o&&o.user!=null){o.slot=1;return o;}}catch(e){}}
  return null;
 }
 let last=null;try{last=await idbDo('readonly',st=>st.get('last'));}catch(e){}
 const id=slots.some(x=>x.id===last)?last:slots[slots.length-1].id;
 return loadSlot(id);
}
export async function loadSlot(id){
 let r=null;try{r=await idbDo('readonly',st=>st.get(slotKey(id)));}catch(e){}
 if(!r)return null;try{const o=unpack(r);if(o){o.slot=id;}return o;}catch(e){return null;}
}
export async function deleteSlot(id){
 slots=slots.filter(x=>x.id!==id);
 try{await idbDo('readwrite',st=>{st.delete(slotKey(id));return st.put(slots,'slots');});}catch(e){}
}
export function installSaveGuards(){document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&RT.saveT)saveNow();});window.addEventListener('pagehide',()=>{if(RT.saveT)saveNow();});}
