/* El Banquillo · business.ts — Negocios del club: tienda, tienda online, bares, palcos VIP, museo y campus de verano;
 * el precio de la camiseta y la nueva equipación, las camisetas más vendidas, el nombre del estadio y el informe mensual. */
// @ts-nocheck — usa el estado heredado S.
import {myKit,myKit2} from './kit';
import {clamp,money,pick,r3,rnd} from './core';
import {LG,S,T,squad,uLg,unit} from './state';
import {shopWeekly} from './club';
import {ticket} from './squad';
import {news} from './world';

const U=()=>Math.max(.006,unit(LG(uLg()).rep));
/** Negocios: nombre, qué hace, coste por nivel (en «unidades» de la liga) y en qué mejora. */
export const BIZ={
 tienda:{n:'Tienda oficial',i:'🛍️',d:'Más espacio y más productos: +20% de ventas de la tienda por nivel.',c:6,shop:.2},
 online:{n:'Tienda online',i:'🌐',d:'Vende camisetas en todo el país: +15% de ventas por nivel (más con muchos aficionados).',c:5,shop:.15},
 bar:{n:'Bares y restauración',i:'🍔',d:'Cada partido en casa la gente come y bebe: +12% de taquilla por nivel.',c:5,tix:.12},
 vip:{n:'Palcos VIP',i:'🥂',d:'Empresas que pagan bien por ver el partido: +18% de taquilla por nivel. Necesita un estadio de 2.500 asientos.',c:9,tix:.18,cap:2500},
 museo:{n:'Museo y tour del estadio',i:'🏛️',d:'Ingresos fijos cada semana y +2% de aficionados cada verano por nivel.',c:7,wk:.012},
 campus:{n:'Campus de verano',i:'⚽',d:'Niños de toda la región entrenan en tus instalaciones: un ingreso cada verano.',c:4,sum:.5}};
export const BIZ_MAX=3;
export const bizLv=k=>(S.biz&&S.biz[k])||0;
/** Lo que deja por semana un nivel de cada negocio (para que se pague solo en algo más de una temporada). */
export function bizGain(k){const b=BIZ[k];if(b.shop)return shopWeekly()*b.shop*(k==='online'?Math.min(1.6,.6+(S.club?S.club.fans:0)/8000):1);if(b.tix)return ticket()*.5*b.tix;if(b.wk)return b.wk*U()*(S.club?Math.min(2,.5+S.club.fans/6000):1);if(b.sum)return b.sum*U()/38;return 0;}
export const bizCost=k=>r3(Math.max(U()*.6,bizGain(k)*(bizLv(k)+1)*(1+bizLv(k)*.35)*52));
export const bizUpkeep=()=>r3(Object.keys(BIZ).reduce((a,k)=>a+bizLv(k)*bizGain(k)*.12,0));
export function bizMult(type){return 1+Object.entries(BIZ).reduce((a,[k,b])=>a+(b[type]||0)*bizLv(k)*(type==='shop'&&k==='online'?Math.min(1.6,.6+(S.club?S.club.fans:0)/8000):1),0);}
export function buyBiz(k){
 const b=BIZ[k];if(!b)return '';const l=bizLv(k);if(l>=BIZ_MAX)return 'Ya está al máximo.';
 if(b.cap&&S.club&&S.club.cap<b.cap)return `Necesitas un estadio de al menos ${b.cap.toLocaleString('es')} asientos.`;
 const c=bizCost(k);if(S.budget<c)return `No tienes presupuesto: cuesta ${money(c)}.`;
 S.budget=r3(S.budget-c);S.biz=S.biz||{};S.biz[k]=l+1;news(`Inauguras ${l?'la mejora de ':''}${b.n.toLowerCase()} (nivel ${l+1}) por ${money(c)}.`,'good',{cat:'dir'});return `${b.n}: nivel ${l+1}.`;
}
/* ---------- La camiseta ---------- */
export const KIT_P={bar:{n:'Barata (35 €)',m:.9,mood:.5},nor:{n:'Normal (60 €)',m:1,mood:0},car:{n:'Cara (90 €)',m:1.2,mood:-.4}};
export const kitPrice=()=>S.kitP||'nor';
export const kitActive=()=>S.kitW!=null&&S.week<=S.kitW&&S.kitS===S.seasonN;
export const kitCost=()=>r3(Math.max(U()*.25,shopWeekly()*.35*8*.6));
export function launchKit(){if(S.kitS===S.seasonN)return 'Ya has presentado la equipación de esta temporada.';const c=kitCost();if(S.budget<c)return `No tienes presupuesto: cuesta ${money(c)}.`;
 S.budget=r3(S.budget-c);S.kitS=S.seasonN;S.kitW=S.week+8;S.kits=S.kits||{};if(!S.kits[S.seasonN])S.kits[S.seasonN]=myKit();S.kits2=S.kits2||{};if(!S.kits2[S.seasonN])S.kits2[S.seasonN]=myKit2();{const a=S.kits[S.seasonN],b=S.kits[S.seasonN-1];S.kitNew=!b||a.c1!==b.c1||a.c2!==b.c2||a.pat!==b.pat;}if(S.club)S.club.mood=clamp(S.club.mood+3,0,100);news(`Presentas la nueva equipación: la afición hace cola en la tienda. Ventas +35% durante 8 jornadas.`,'good',{cat:'dir',subj:'Nueva equipación'});return 'Equipación presentada.';}
export const kitMult=()=>KIT_P[kitPrice()].m*(kitActive()?1.35:1)*(S.kitS===S.seasonN&&S.kitNew?1.08:1);
/** Lo que tira de las ventas de un jugador: nivel, goles, ser internacional y ser joven y de moda. */
export function shirtPop(p){const s=p.st||{};return Math.max(1,p.ovr+(s.g||0)*3+(s.a||0)+(p.caps||0)*2+(p.u21?4:0)+(p.age<=22?5:0)+(p.home?4:0));}
/** Reparte las camisetas vendidas esta semana entre tus jugadores. */
export function shirtsWeekly(shop){
 if(!(shop>0))return;const price=kitPrice()==='bar'?35:kitPrice()==='car'?90:60,units=Math.round(shop*1e6*.6/price);
 const L=squad(S.user).filter(p=>!p.loan),w=L.map(p=>shirtPop(p)**3),tot=w.reduce((a,b)=>a+b,0)||1;
 if(S.shirtsS!==S.seasonN){S.shirts={};S.shirtsS=S.seasonN;}
 L.forEach((p,i)=>{const n=Math.round(units*w[i]/tot);if(n)S.shirts[p.id]=(S.shirts[p.id]||0)+n;});
}
export const topShirts=(n=5)=>Object.entries(S.shirts||{}).filter(([id])=>S.players[id]&&S.players[id].team===S.user).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([id,u])=>({p:S.players[id],u}));
/* ---------- Ingresos de cada semana fuera de taquilla y tienda ---------- */
export function bizWeekly(){
 const C=S.club;if(C){const m=KIT_P[kitPrice()].mood;if(m)C.mood=clamp(C.mood+m,0,100);}
 const museo=bizLv('museo')*BIZ.museo.wk*U()*(C?Math.min(2,.5+C.fans/6000):1),nm=S.naming&&S.naming.until>=S.seasonN?S.naming.weekly:0;
 return r3(museo+nm-bizUpkeep());
}
/** Cada verano: campus, aficionados del museo y, si no tienes, una oferta por el nombre del estadio. */
export function bizSeason(){
 const c=bizLv('campus');if(c){const v=r3(BIZ.campus.sum*U()*c*c);S.budget=r3(S.budget+v);news(`El campus de verano deja ${money(v)} en caja.`,'good',{cat:'dir'});}
 const m=bizLv('museo');if(m&&S.club)S.club.fans=Math.round(S.club.fans*(1+.02*m));
 if(S.naming&&S.naming.until<S.seasonN){news(`Termina el contrato de nombre del estadio con ${S.naming.name}. Vuelve el nombre de siempre.`,'',{cat:'dir'});S.naming=null;}
 if(!S.naming&&rnd()<.55)namingOffer();
}
const BRANDS=['Banco Ibérico','Seguros Atlántida','Energías del Sur','Cervezas Montaña','Telco Plus','Grupo Horizonte','Autos Levante','Café Real'];
export function namingOffer(){const name=pick(BRANDS),weekly=r3(U()*(.18+rnd()*.12));S.namingOffer={name,weekly,yrs:3};
 news(`${name} quiere ponerle su nombre a tu estadio: ${money(weekly)} por semana durante 3 temporadas (${money(weekly*nWeeks()*3)} en total). A parte de la afición no le gustará.`,'',{cat:'dir',subj:`Oferta: «Estadio ${name}»`,act:[{l:'Aceptar',a:'naming-ok'},{l:'Rechazar',a:'naming-no'}]});}
const nWeeks=()=>38;
export function namingAnswer(ok){const o=S.namingOffer;if(!o)return 'La oferta ya no está.';S.namingOffer=null;
 if(!ok){if(S.club)S.club.mood=clamp(S.club.mood+2,0,100);return 'Rechazas la oferta: la afición lo agradece.';}
 S.naming={name:o.name,weekly:o.weekly,until:S.seasonN+o.yrs-1};if(S.club)S.club.mood=clamp(S.club.mood-6,0,100);news(`El estadio pasa a llamarse «Estadio ${o.name}». Entran ${money(o.weekly)} por semana.`,'',{cat:'dir'});return 'Contrato firmado.';}
/* ---------- Informe económico del mes ---------- */
export function finMonthly(nRounds){
 if(S.user==null||S.week%4!==0||S.finW===S.week||!(S.fin||[]).length)return null;S.finW=S.week;
 const L=S.fin.slice(-4),inc=k=>L.reduce((a,f)=>a+(f[k]||0),0),src={'televisión':inc('tv'),'taquilla':inc('tix'),'patrocinio':inc('spo'),'tienda':inc('shop'),'negocios':inc('biz')};
 const tin=Object.values(src).reduce((a,b)=>a+Math.max(0,b),0),tout=inc('wages'),bal=r3(tin-tout),top=Object.entries(src).sort((a,b)=>b[1]-a[1])[0];
 const all=S.fin,avg=all.reduce((a,f)=>a+f.tv+f.tix+(f.spo||0)+(f.shop||0)+(f.biz||0)-f.wages,0)/all.length,left=Math.max(0,nRounds-S.week),proj=r3(S.budget+avg*left);
 const sh=topShirts(1)[0];
 news(`Informe económico del mes: ingresos ${money(tin)} y gastos ${money(tout)}, saldo ${bal>=0?'+':''}${money(bal)}. Lo que más da: ${top[0]} (${money(top[1])}).${sh?` Camiseta más vendida: ${sh.p.name} (${sh.u.toLocaleString('es')}).`:''} Si sigue así, acabarás la temporada con ${money(proj)}.`,bal>=0?'good':'bad',{cat:'dir',subj:`💶 Economía del mes: ${bal>=0?'+':''}${money(bal)}`,act:[{l:'Ver finanzas',a:'vtab',k:'club',v:'neg',go:'club'}]});
 return {tin,tout,bal,proj};
}
