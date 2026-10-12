/* El Banquillo · inbox.ts — Bandeja de entrada: mensajes de la directiva, el cuerpo técnico, los ojeadores, la prensa… */
// @ts-nocheck — usa el estado heredado S.
import {S,seasonLabel} from './state';

/** Categorías de mensajes, con el remitente por defecto. */
export const CATS={
 dir:{n:'Directiva',from:'La directiva'},
 pla:{n:'Plantilla',from:'Tu segundo entrenador'},
 med:{n:'Cuerpo médico',from:'Servicios médicos'},
 mer:{n:'Mercado',from:'Secretaría técnica'},
 oje:{n:'Ojeo y cantera',from:'Departamento de ojeo'},
 com:{n:'Competición',from:'Federación'},
 pre:{n:'Prensa',from:'Jefe de prensa'},
 sta:{n:'Cuerpo técnico',from:'Tu segundo entrenador'},
 not:{n:'Noticias',from:'Agencias'},
};
const RULES=[
 ['med',/lesi|recaída|baja\b|sanción|sancion/i],
 ['oje',/ojeador|cantera|juvenil|informe|sub-19/i],
 ['pre',/prensa|periodist|rueda/i],
 ['dir',/directiva|confianza|despedid|presupuesto|patrocin|obras|estadio|instalaciones|números rojos|reputación|renueva [0-9]+ temporadas|dimites|nuevo reto|quiere ficharte|logro/i],
 ['not',/^Mercado:|gana la|\(.*\) gana/],
 ['mer',/oferta|fichaje|venta|cláusula|cesión|cedido|traspaso|mercado|puja|opción de compra|contrato|renueva/i],
 ['com',/jornada|copa|mundial|campeon|eliminad|ronda|liga|temporada|ascenso|descenso|premio|amistoso|clasificados/i],
 ['pla',/./],
];
export const autoCat=txt=>RULES.find(([,re])=>re.test(txt))[0];
/** Asunto corto a partir del texto: hasta los primeros dos puntos o el primer punto. */
export function autoSubj(txt){
 const t=txt.replace(/^¡/,'');let s=t.split(/\.\s|\.$/)[0];
 const c=s.indexOf(':');if(c>=16)s=s.slice(0,c); // «Asunto largo: detalle» → «Asunto largo»; si es corto («Jornada 3: …») se deja entero
 return s.length>72?s.slice(0,70).replace(/\s\S*$/,'')+'…':s.replace(/!$/,'');
}

/**
 * Añade un mensaje a la bandeja.
 * o: {cat, from, subj, kind:'good'|'bad'|'', act:[{l, a, id?, v?, i?}]} — act son botones que reutilizan las acciones del juego.
 */
export function mail(txt,o={}){
 if(!S)return;S.inbox=S.inbox||[];
 const cat=o.cat||autoCat(txt);
 // las noticias del mundo y los resultados de cada jornada llegan ya leídos: así el contador solo avisa de lo importante
 const quiet=o.quiet||cat==='not'||/^Jornada \d+:/.test(txt);
 S.inbox.unshift({id:'m'+(S.nextId++),wk:S.week+1,sn:seasonLabel(),cat,from:o.from||CATS[cat].from,subj:o.subj||autoSubj(txt),txt,kind:o.kind||'',act:o.act||null,read:quiet?1:0});
 if(S.inbox.length>150){const keep=S.inbox.filter((m,i)=>i<120||(!m.read&&i<150));S.inbox=keep.slice(0,150);}
}
export const unread=()=>(S.inbox||[]).filter(m=>!m.read).length;
export function markRead(id){const m=(S.inbox||[]).find(x=>x.id===id);if(m)m.read=1;}
export function markAll(cat){(S.inbox||[]).forEach(m=>{if(!cat||cat==='all'||m.cat===cat)m.read=1;});}
/** Partidas anteriores a la bandeja: convierte las noticias guardadas en mensajes leídos. */
export function migrateInbox(){
 if(S.inbox)return;
 S.inbox=(S.news||[]).map(n=>{const cat=autoCat(n.txt);return{id:'m'+(S.nextId++),wk:n.wk,sn:seasonLabel(),cat,from:CATS[cat].from,subj:autoSubj(n.txt),txt:n.txt,kind:n.kind||'',act:null,read:1};});
}
