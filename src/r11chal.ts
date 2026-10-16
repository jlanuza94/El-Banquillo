/* El Banquillo · r11chal.ts — Reto entre amigos (multijugador asíncrono): todos empiezáis con la misma semilla,
 * el mismo mundo y el mismo club; cada uno juega a su ritmo y luego comparáis el código de resultado. */
// @ts-nocheck — usa el estado heredado S.
import {LG,S,T,lgName,seasonLabel,uLg} from './state';

/** Al empezar una partida: se apunta de dónde sales (para medir lo que subes). */
export function chalInit(){if(S&&S.user!=null&&!S.chal)S.chal={seed:S.seed,t:S.user,lv:LG(uLg()).lv,sn:S.seasonN,w:S.fixedW?'F':'R',d:S.diff||'normal'};}
/** Código para que un amigo empiece exactamente igual que tú. */
export function chalCode(){chalInit();const C=S.chal;return `EB1-${C.seed}-${C.w}-${C.t}-${C.d[0].toUpperCase()}`;}
const DIFFS={F:'facil',N:'normal',D:'dificil'};
/** Lee un código de reto. */
export function parseChal(code){const m=String(code||'').trim().toUpperCase().match(/^EB1-(\d+)-([FR])-(\d+)-([A-Z])$/);if(!m)return null;return {seed:+m[1],w:m[2],t:+m[3],d:DIFFS[m[4]]||'normal'};}
/** Tus números en el reto. */
export function chalStats(){chalInit();const C=S.chal,M=S.mgr||{},E=(S.ency||[]).filter(e=>e.me),lv=LG(uLg()).lv;
 const titles=E.filter(e=>e.me.champ).length,ups=E.filter(e=>e.me.up).length,downs=E.filter(e=>e.me.down).length;
 const score=Math.max(0,(C.lv-lv)*150+titles*60+ups*40-downs*40+(M.wins||0)*3+(M.games||0));
 return {seed:C.seed,t:C.t,club:T(S.user).name,lg:lgName(uLg()),lv,seasons:S.seasonN-C.sn,games:M.games||0,wins:M.wins||0,titles,ups,score,when:seasonLabel()};}
/** Código de resultado para mandar a tus amigos. */
export function resultCode(){const s=chalStats();return 'EBR1.'+btoa(unescape(encodeURIComponent(JSON.stringify([s.seed,s.t,s.club,s.lg,s.lv,s.seasons,s.games,s.wins,s.titles,s.ups,s.score,s.when,(S.mgr&&S.mgr.name)||'Entrenador']))));}
export function parseResult(code){try{const c=String(code||'').trim();if(!c.startsWith('EBR1.'))return null;const a=JSON.parse(decodeURIComponent(escape(atob(c.slice(5)))));
 return {seed:a[0],t:a[1],club:a[2],lg:a[3],lv:a[4],seasons:a[5],games:a[6],wins:a[7],titles:a[8],ups:a[9],score:a[10],when:a[11],name:a[12]};}catch(e){return null;}}
/** Panel del reto (Carrera › Reto). */
export function chalHTML(esc,friend){const me=chalStats(),f=friend||null,same=f&&f.seed===me.seed&&f.t===me.t;
 const row=(l,a,b)=>`<tr><td>${l}</td><td class="n"><b>${a}</b></td>${f?`<td class="n"><b>${b}</b></td>`:''}</tr>`;
 return `<div class="grid"><section class="panel"><div class="panel-h"><h2>Reto entre amigos</h2><span class="eyebrow">Misma semilla, mismo club</span></div>
 <p class="small" style="margin:0 0 8px">Manda este código a un amigo. En la pantalla de inicio, en <b>Nueva partida › Unirse a un reto</b>, lo pega y empieza con <b>el mismo mundo, la misma semilla y tu mismo club</b>. Cada uno juega a su ritmo; luego os pasáis el código de resultado y veis quién lo ha hecho mejor.</p>
 <div class="kv" style="margin-top:0"><span>Código del reto</span><b><code id="chalC">${esc(chalCode())}</code></b></div>
 <div class="row" style="gap:6px;margin:8px 0 14px"><button class="btn sm" data-a="chal-copy" data-v="c">Copiar código del reto</button></div>
 <h3 style="margin:0 0 4px">Tu resultado</h3><div class="kv" style="margin-top:0"><span>Código de resultado</span><b><code style="word-break:break-all">${esc(resultCode())}</code></b></div>
 <div class="row" style="gap:6px;margin:8px 0 0"><button class="btn sm primary" data-a="chal-copy" data-v="r">Copiar mi resultado</button></div></section>
 <section class="panel"><div class="panel-h"><h2>Comparar</h2><span class="eyebrow">Pega el resultado de tu amigo</span></div>
 <div class="row" style="gap:6px"><input id="chalIn" placeholder="EBR1.…" style="flex:1;min-width:0"><button class="btn sm" data-a="chal-cmp">Comparar</button></div>
 ${friend===false?'<p class="small" style="color:var(--loss)">Ese código no es válido.</p>':''}
 <div class="tbl" style="margin-top:8px"><table><thead><tr><th></th><th class="r">Tú</th>${f?`<th class="r">${esc(f.name)}</th>`:''}</tr></thead><tbody>
 ${row('Club',esc(me.club),f?esc(f.club):'')}${row('Liga actual',esc(me.lg),f?esc(f.lg):'')}${row('Temporadas',me.seasons,f?f.seasons:'')}${row('Partidos',me.games,f?f.games:'')}${row('Victorias',me.wins,f?f.wins:'')}${row('Ascensos',me.ups,f?f.ups:'')}${row('Ligas ganadas',me.titles,f?f.titles:'')}${row('Puntuación',me.score,f?f.score:'')}</tbody></table></div>
 ${f?`<p style="margin:8px 0 0"><b>${me.score>f.score?'🏆 Vas ganando el reto.':me.score<f.score?`🏃 ${esc(f.name)} va por delante.`:'🤝 Empate.'}</b>${same?'':' <span class="small muted">(Ojo: no es el mismo reto, empezasteis con otra semilla u otro club.)</span>'}</p>`:''}
 <p class="small muted" style="margin:8px 0 0">Puntuación: divisiones subidas, ligas ganadas, ascensos, victorias y partidos dirigidos.</p></section></div>`;}
