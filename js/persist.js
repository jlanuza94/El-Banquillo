/* El Banquillo · persist.js — Guardado (IndexedDB), carga, copia de seguridad y migraciones de formato. */
"use strict";
const PF_V4=['id','name','nat','pos','age','pot','team','num','energy','form','goals','apps','yc','inj','susp','pInj','pSusp','contract','wage','tf','sg'];
const PF=PF_V4.concat(['sp','alt','foot','wf','h','per','tr','hap','role','cl','st','car','hist','req','prom','tw','injT','pInjT','prone','recov','agc','ph','adapt','home','paid','boomS']);
const packName=p=>{const L=NAMES[COUNTRIES[p.nat].lang],i=p.name.indexOf(' '),a=L[0].indexOf(p.name.slice(0,i)),b=L[1].indexOf(p.name.slice(i+1));return a>=0&&b>=0?a+'.'+b:p.name;};
function pack(){
 const o=Object.assign({},S);o.players=undefined;
 o.pf=PF;o.pk=Object.values(S.players).map(p=>[...PF.map(k=>k==='name'?packName(p):k==='id'?+p.id.slice(1):k==='st'?(p.st&&p.st.pj?ST_K.map(x=>x==='rs'?Math.round(p.st.rs*10):p.st[x]):0):k==='alt'||k==='tr'?(p[k]||[]).join(','):p[k]===undefined?0:p[k]),ATTRS.map(k=>String.fromCharCode(96+p.at[k])).join(''),p.loan?(p.loan.opt?[p.loan.from,p.loan.opt]:p.loan.from):-1,p.playedWk?1:0]);
 o.fixtures=undefined;o.fk=S.fixtures.map(lg=>lg.map(rd=>rd.map(f=>f.played?(f.ev&&f.ev.length?[f.h,f.a,f.hg,f.ag,f.ev]:[f.h,f.a,f.hg,f.ag]):[f.h,f.a])));
 return JSON.stringify(o);
}
function unpack(str){
 const o=JSON.parse(str);if(!o||o.v!==4||!o.pk)return null;const pf=o.pf||PF_V4;delete o.pf;
 o.fixtures=o.fk.map(lg=>lg.map(rd=>rd.map(a=>a.length>2?{h:a[0],a:a[1],hg:a[2],ag:a[3],played:true,ev:a[4]||[]}:{h:a[0],a:a[1],hg:null,ag:null,played:false,ev:[]})));delete o.fk;
 o.players={};o.pk.forEach(a=>{const p={};pf.forEach((k,i)=>p[k]=a[i]);if(pf.length>PF_V4.length){p.alt=p.alt?p.alt.split(','):[];p.tr=p.tr?p.tr.split(','):[];if(p.st){const v=p.st;p.st={};ST_K.forEach((x,j)=>p.st[x]=x==='rs'?v[j]/10:v[j]);}else p.st=newSt();if(!p.prom)p.prom=null;}p.id='p'+p.id;if(/^\d+\.\d+$/.test(p.name)){const L=NAMES[COUNTRIES[p.nat].lang],[x,y]=p.name.split('.');p.name=L[0][+x]+' '+L[1][+y];}p.at={};ATTRS.forEach((k,i)=>p.at[k]=a[pf.length].charCodeAt(i)-96);{const L=a[pf.length+1];p.loan=Array.isArray(L)?{from:L[0],opt:L[1]}:L>=0?{from:L}:null;}if(!p.ph)p.ph=null;p.playedWk=!!a[pf.length+2];p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);o.players[p.id]=p;});
 delete o.pk;return o;
}
let saveWarned=false;
function exportCode(){return typeof LZString!=='undefined'?'EB1:'+LZString.compressToBase64(pack()):'EB0:'+pack();}
function importCode(txt){
 txt=String(txt||'').trim();let str=null;
 try{if(txt.startsWith('EB1:'))str=LZString.decompressFromBase64(txt.slice(4));else if(txt.startsWith('EB0:'))str=txt.slice(4);else if(txt.startsWith('{'))str=txt;}catch(e){str=null;}
 if(!str)return false;let o=null;try{o=unpack(str);}catch(e){o=null;}if(!o||o.user==null)return false;
 clearInterval(timer);timer=null;boot(o);saveNow();return true;
}
let idbP=null;
function idb(){return idbP||(idbP=new Promise((res,rej)=>{try{const r=indexedDB.open('el-banquillo',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}}));}
function idbDo(mode,fn){return idb().then(db=>new Promise((res,rej)=>{const tx=db.transaction('kv',mode),q=fn(tx.objectStore('kv'));tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error);}));}
function saveNow(){clearTimeout(saveT);saveT=null;if(!S||S.user==null)return;let str;try{str=pack();}catch(e){return;}
 idbDo('readwrite',st=>st.put(str,KEY)).then(()=>{try{localStorage.removeItem(KEY);}catch(e){}}).catch(()=>{try{localStorage.setItem(KEY,str);}catch(e){if(!saveWarned){saveWarned=true;toast('No se pudo guardar la partida en este navegador.');}}});}
function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,400);}
async function loadAsync(){let r=null;try{r=await idbDo('readonly',st=>st.get(KEY));}catch(e){}if(!r){try{r=localStorage.getItem(KEY);}catch(e){}}try{return r?unpack(r):null;}catch(e){return null;}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&saveT)saveNow();});
window.addEventListener('pagehide',()=>{if(saveT)saveNow();});
