/* El Banquillo · replay.ts — Repeticiones de los goles en la vista 2D y efectos de sonido y vibración del partido. */
// @ts-nocheck — usa el estado heredado S.
import {PL,RT,S} from './state';

/* ---------- Repeticiones ---------- */
/** Jugada de un gol como fotogramas clave {t (ms), x, y, who}: x hacia la portería rival (99). */
export function goalPlay(m,i){
 const e=m.ev[i];if(!e||e.t!=='goal')return null;const tx=String(e.tx||'').toLowerCase(),s=e.s,lu=m.lu[s].filter(Boolean);
 const sc=e.pid,as=e.ast||lu.filter(id=>id!==sc)[Math.floor(Math.random()*Math.max(1,lu.length-1))+1]||lu[1],mid=lu[Math.min(lu.length-1,5)]||as;
 const wy=Math.random()<.5?16:84,fy=46+Math.random()*8,gy=46+Math.random()*8;let K;
 if(/penalti/.test(tx))K=[{t:0,x:88,y:50,who:sc},{t:900,x:88,y:50,who:sc},{t:1300,x:99.5,y:Math.random()<.5?45:55,who:null}];
 else if(/córner|corner/.test(tx))K=[{t:0,x:98.5,y:wy<50?4:96,who:as},{t:1100,x:91,y:fy,who:sc},{t:1500,x:99.5,y:gy,who:null}];
 else if(/cuelga|centro/.test(tx)&&/falta/.test(tx))K=[{t:0,x:76,y:wy<50?28:72,who:as},{t:1000,x:90,y:fy,who:sc},{t:1400,x:99.5,y:gy,who:null}];
 else if(/falta/.test(tx))K=[{t:0,x:77,y:52,who:sc},{t:700,x:77,y:52,who:sc},{t:1500,x:99.5,y:Math.random()<.5?43:57,who:null}];
 else K=[{t:0,x:50,y:40+Math.random()*20,who:mid},{t:1000,x:73,y:wy,who:as},{t:2000,x:87,y:fy,who:sc},{t:2600,x:99.5,y:gy,who:null}];
 if(s==='a')K=K.map(k=>({...k,x:100-k.x,y:100-k.y}));
 return{s,e,K,end:K[K.length-1].t+1600};
}
/** Estado de la repetición en el instante ms: posición del balón, quién la lleva y si ya es gol. */
export function playAt(P,ms){
 const K=P.K;if(ms>=K[K.length-1].t){const k=K[K.length-1];return{x:k.x,y:k.y,who:null,goal:true};}
 let i=0;while(i<K.length-1&&K[i+1].t<=ms)i++;const a=K[i],b=K[i+1],f=(ms-a.t)/Math.max(1,b.t-a.t),ease=f*f*(3-2*f);
 return{x:a.x+(b.x-a.x)*ease,y:a.y+(b.y-a.y)*ease,who:a.who,goal:false};
}
/** Empieza a repetir el gol i del partido actual (pausa el partido si estaba en marcha). */
export function startReplay(i){const m=S.match;if(!m)return;RT.replay={i,t0:null,P:goalPlay(m,i)};if(!RT.replay.P)RT.replay=null;}
export const stopReplay=()=>{RT.replay=null;};
/** Goles del partido con su índice de evento (para el resumen). */
export const goalsOf=m=>m.ev.map((e,i)=>({e,i})).filter(x=>x.e.t==='goal');

/* ---------- Sonido y vibración ---------- */
const KEY='eb-sound';
export function soundOn(){try{return localStorage.getItem(KEY)!=='0';}catch(e){return true;}}
export function toggleSound(){const v=!soundOn();try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}if(v)whistle(1);return v;}
let AC=null;
function ctx(){if(!soundOn()||typeof window==='undefined')return null;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!AC)try{AC=new C();}catch(e){return null;}if(AC.state==='suspended')AC.resume().catch(()=>{});return AC;}
/** Silbato: n pitidos (1 inicio, 2 descanso, 3 final). */
export function whistle(n=1){const c=ctx();if(!c)return;let t=c.currentTime+.02;
 for(let k=0;k<n;k++){const len=k===n-1?.55:.22,o=c.createOscillator(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();
  o.type='sine';o.frequency.value=2900;lfo.frequency.value=38;lg.gain.value=90;lfo.connect(lg);lg.connect(o.frequency);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.02);g.gain.setValueAtTime(.16,t+len-.05);g.gain.linearRampToValueAtTime(0,t+len);
  o.connect(g);g.connect(c.destination);o.start(t);lfo.start(t);o.stop(t+len+.02);lfo.stop(t+len+.02);t+=len+.12;}}
/** Grito de la grada: ruido filtrado que crece y se apaga. Más fuerte si el gol es tuyo. */
export function roar(mine){const c=ctx();if(!c)return;const dur=mine?2.6:1.3,n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const src=c.createBufferSource();src.buffer=buf;
 const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=mine?900:500;f.Q.value=.7;const g=c.createGain(),t=c.currentTime+.02,peak=mine?.5:.18;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.35);g.gain.setValueAtTime(peak,t+dur*.45);g.gain.exponentialRampToValueAtTime(.001,t+dur);
 src.connect(f);f.connect(g);g.connect(c.destination);src.start(t);src.stop(t+dur);}
const vib=p=>{try{if(soundOn()&&navigator.vibrate)navigator.vibrate(p);}catch(e){}};
/** Tras cada minuto del partido en directo: suena lo que haya pasado desde la última vez. */
export function matchFx(m){
 const key=JSON.stringify(m.ref)+m.h+m.a;if(RT.fx&&RT.fx.key!==key)RT.fx=null;
 if(!RT.fx){RT.fx={key,n:m.ev.length,min:m.min,half:false,done:m.done};return;}
 const F=RT.fx;
 for(let i=F.n;i<m.ev.length;i++){const e=m.ev[i];if(e.t==='goal'){const mine=e.s===m.us;roar(mine);if(mine)vib([120,60,120,60,300]);}else if(e.t==='red')whistle(1);}
 F.n=m.ev.length;
 if(F.min===0&&m.min>0)whistle(1);
 if(!F.half&&m.min===45&&m.paused){F.half=true;whistle(2);}
 if(!F.done&&m.done){whistle(3);vib(m.score[m.us]>m.score[m.us==='h'?'a':'h']?[80,50,80,50,80]:0);}
 F.min=m.min;F.done=m.done;
}
