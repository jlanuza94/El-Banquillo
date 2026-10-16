/* El Banquillo · fans.ts — La grada opina: mensajes de aficionados y de la prensa local que reaccionan a tus
 * resultados, fichajes, ventas, alineaciones y canteranos. Así sabes si la grada está contigo. */
// @ts-nocheck — usa el estado heredado S.
import {pick,rnd} from './core';
import {PL,S,T,squad} from './state';

const H=()=>{const s=(T(S.user).short||'CLUB').toLowerCase();return ['@peña_'+s+'_1923','@grada_norte_'+s,'@abuelo_socio','@la_voz_del_'+s,'@futbol_de_barrio','@ultras_'+s,'@socia_desde_los_80','@el_de_la_bufanda','Diario de '+(T(S.user).city||T(S.user).name.split(' ').pop()),'Radio Local · Deportes'];};
/** Añade un mensaje al muro (mood: 1 contentos, -1 enfadados, 0 neutro). */
export function fanSay(txt,mood=0,who){S.fanwall=S.fanwall||[];S.fanwall.unshift([who||pick(H()),txt,mood,S.week,S.day??0]);if(S.fanwall.length>24)S.fanwall.length=24;}
/** Tras un partido oficial tuyo. */
export function fansMatch(m,derby){
 if(!m||!m.us||m.ref.k==='fr')return;const us=m.us,o=us==='h'?'a':'h',my=m.score[us],op=m.score[o],opp=T(m[o]).name,d=my-op;
 const mvp=m.mvp&&PL(m.mvp)&&PL(m.mvp).team===S.user?PL(m.mvp):null;
 if(derby&&d>0)fanSay(pick([`¡LA CIUDAD ES NUESTRA! ${my}-${op} al ${opp}. Esta noche no duerme nadie.`,`Ganar el derbi lo es todo. ${mvp?mvp.name+', te queremos.':'Gracias, chavales.'}`]),1);
 else if(derby&&d<0)fanSay(pick([`Perder el derbi duele más que cualquier descenso. Así no.`,`Mañana no hay quien vaya al trabajo con los del ${opp} riéndose. Vergüenza.`]),-1);
 else if(d>=3)fanSay(pick([`¡Qué baile! ${my}-${op} y pudieron ser más.`,`Así se juega en casa. ${mvp?mvp.name+' estuvo de dulce.':'Equipo enorme.'}`]),1);
 else if(d>0)fanSay(pick([`Tres puntos que valen oro. Sufriendo, pero sumando.`,`${mvp?mvp.name+' nos da la victoria. ':''}A seguir así.`,`Victoria ante el ${opp}. Este equipo tiene alma.`]),1);
 else if(d===0)fanSay(pick([`Empate ante el ${opp}. Ni fu ni fa.`,`Un punto es un punto, pero hoy se podía ganar.`,`Nos falta gol, el equipo compite pero no remata.`]),0);
 else if(d<=-3)fanSay(pick([`Humillante. ${op}-${my} y ni una reacción. Alguien tiene que dar explicaciones.`,`¿Esto es un equipo? Que el míster mueva el banquillo ya.`]),-1);
 else fanSay(pick([`Derrota ante el ${opp}. Hay que mejorar mucho.`,`Otra vez fallando arriba. Así es imposible.`,`No me gusta lo que veo. Mucho que trabajar.`]),-1);
 // canteranos en el once y debuts
 const xi=(m.xi0[us]||[]).map(PL).filter(Boolean),home=xi.filter(p=>p.home);
 if(home.length>=3&&rnd()<.6)fanSay(`${home.length} canteranos en el once. ¡Esto es lo que queremos ver! Que jueguen los de casa.`,1);
 const kid=xi.find(p=>p.age<=19&&p.car&&p.car[0]===1);if(kid)fanSay(`Debut de ${kid.name} con ${kid.age} años. ¡Ojo a este chaval!`,1);
}
/** Al fichar a un jugador. */
export function fansSign(p,fee){
 if(!p)return;const sq=squad(S.user).filter(x=>!x.loan&&x!==p),avg=sq.map(x=>x.ovr).sort((a,b)=>b-a).slice(0,11).reduce((a,b,_,A)=>a+b/A.length,0);
 if(p.ovr>=avg+4)fanSay(pick([`¡BOMBAZO! ${p.name} es nuestro. Este año vamos a por todas.`,`Fichajazo: ${p.name}. Por fin la directiva se moja.`]),1);
 else if(p.age>=32)fanSay(pick([`¿${p.name} con ${p.age} años? Espero que no venga a jubilarse aquí.`,`Otro veterano... ${p.name} tendrá experiencia, pero ¿y piernas?`]),-1);
 else if(p.age<=21)fanSay(pick([`${p.name}, ${p.age} años. Me gusta la apuesta por gente joven.`,`Buen fichaje de futuro: ${p.name}. A ver si le dan minutos.`]),1);
 else fanSay(pick([`Llega ${p.name}. Ni frío ni calor; que se lo gane en el campo.`,`${p.name} nuevo jugador${fee?' por '+fee:''}. Habrá que verle.`]),0);
}
/** Al vender a un jugador. */
export function fansSell(p,fee){
 if(!p)return;const fav=(S.shirts&&S.shirts[p.id]||0)>0&&Object.entries(S.shirts||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).some(([id])=>id===p.id);
 if(fav||p.home)fanSay(pick([`¡¿Vendéis a ${p.name}?! ${p.home?'Era de la casa.':'Era el que más camisetas vendía.'} No lo entiendo.`,`Se va ${p.name}. Se nos va un trozo del club.`]),-1);
 else fanSay(pick([`Buena venta la de ${p.name}${fee?' por '+fee:''}. Dinero para reforzar el equipo.`,`${p.name} se va. Suerte, y que el dinero se invierta bien.`]),0);
}
/** Ánimo de la grada según los últimos mensajes (−100 … 100). */
export const fanMood=()=>{const L=(S.fanwall||[]).slice(0,8);return L.length?Math.round(L.reduce((a,x)=>a+x[2],0)/L.length*100):0;};
export function fanWallHTML(esc,n=6){
 const L=(S.fanwall||[]).slice(0,n),md=fanMood(),C=S.club?Math.round(S.club.mood):60;
 return `<section class="panel fanw"><div class="panel-h"><h2>📣 La grada opina</h2><span class="eyebrow">Ánimo de la afición ${C}/100 ${md>25?'😀':md<-25?'😠':'😐'}</span></div>
 ${L.length?L.map(([w,t,m])=>`<div class="fanm ${m>0?'up':m<0?'dn':''}"><b>${esc(w)}</b><span>${esc(t)}</span></div>`).join(''):'<div class="empty small">La grada aún no ha dicho nada: juega tu primer partido.</div>'}</section>`;
}
