/* El Banquillo · views/economy.ts — Dinero de los clubes: tabla de la liga y bloque de la ficha de cada club. */
// @ts-nocheck — usa el estado heredado S.
import {CWEALTH,LG as LGx,clubWF} from '../state';
import {esc,money} from '../core';
import {S,T,crest,lgTeams} from '../state';
import {initCash,squadValue,wageBillOf} from '../economy';
import {wageBill} from '../clubplus';

const cashOf=t=>t.id===S.user?S.budget:(t.cash||0);
const delta=t=>{if(t.id===S.user||t.cash0==null)return '';const d=t.cash-t.cash0;if(Math.abs(d)<.005)return '';return `<span class="vtr ${d>0?'up':'dn'}">${d>0?'▲':'▼'}${money(Math.abs(d))}</span>`;};
/** Liga → Líderes → Dinero: caja, valor de plantilla y sueldos de cada club. */
export function ecoTable(lg){
 initCash();const ts=lgTeams(lg).slice().sort((a,b)=>cashOf(b)-cashOf(a));
 return `<p class="small muted" style="margin:0 0 8px">Cada club gana o pierde dinero según dónde termina (premios por puesto, ascensos, descensos), su afición y los traspasos. Con más caja fichan mejor; en números rojos tienen que vender.</p>
 <div class="tbl"><table><thead><tr><th>Club</th><th class="r">Caja</th><th class="r">Valor plantilla</th><th class="r">Sueldos/sem</th></tr></thead><tbody>
 ${ts.map(t=>`<tr class="${t.id===S.user?'me':''}"><td><button class="linkname teamcell" data-a="club-open" data-id="${t.id}">${crest(t,'sm')}${esc(t.short)}</button></td><td class="n" style="${cashOf(t)<0?'color:var(--loss)':''}">${money(cashOf(t))}${delta(t)}</td><td class="n">${money(squadValue(t.id))}</td><td class="n">${money(t.id===S.user?wageBill():wageBillOf(t.id))}</td></tr>`).join('')}</tbody></table></div>
 <p class="small muted" style="margin:8px 0 0">Tu caja es tu presupuesto de fichajes. La flecha indica cuánto ha ganado o gastado cada club desde el inicio de la temporada.</p>`;
}
/** Bloque «Economía» en la ficha de un club. */
/** Cómo de rico es un club: gigante, grande o normal, y lo rica que es la liga de su país. */
export function wealthLabel(t){const w=clubWF(t),L=LGx(t.lg),c=CWEALTH[L.c]??.5;return `${w>=2.5?'💰💰💰 Gigante':w>=1.5?'💰💰 Grande':w<1?'Modesto':'Normal'} · liga ${c>=2?'muy rica':c>=1.2?'rica':c>=.9?'media':c>=.55?'modesta':'pobre'}`;}
export function clubEco(t){
 initCash();const me=t.id===S.user,L=t.last;
 return `<h3 style="margin:14px 0 4px">Economía</h3><div class="kv" style="margin-top:0"><span>Poder económico</span><b>${wealthLabel(t)}</b><span>${me?'Presupuesto de fichajes':'Caja'}</span><b>${money(cashOf(t))} ${delta(t)}</b><span>Valor de la plantilla</span><b>${money(squadValue(t.id))}</b><span>Sueldos</span><b>${money(me?wageBill():wageBillOf(t.id))}/sem</b>
 ${L&&!me?`<span>Temporada ${esc(L.season)}</span><b>${L.pos}º · premio ${money(L.prize)} · explotación ${money(L.op)} · traspasos ${L.fees>=0?'+':''}${money(L.fees)}</b>`:''}</div>`;
}
