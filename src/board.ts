/* El Banquillo · board.ts — La directiva: qué espera del equipo este año, el estilo de juego que quiere
 * ver y cómo te evalúa (como en el FM: liga, copa, finanzas, estilo, afición, vestuario y cantera). */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {LG,S,T,squad} from './state';
import {table} from './tactics';
import {userCup} from './competitions';
import {wageBill} from './clubplus';

/** Estilos que puede pedir una directiva. */
export const BSTYLE={
 pos:{n:'Fútbol de posesión',d:'Tener el balón y llevar la iniciativa.',how:'Estilo de posesión en Instrucciones y más del 52% de posesión.'},
 ata:{n:'Fútbol ofensivo',d:'Que el equipo ataque y meta goles.',how:'Mentalidad ofensiva o más de 1,6 goles por partido.'},
 pre:{n:'Presión alta',d:'Un equipo intenso que robe arriba.',how:'Presión alta en Instrucciones.'},
 sol:{n:'Solidez defensiva',d:'Ser un equipo difícil de batir.',how:'Encajar menos de 1,1 goles por partido.'},
 con:{n:'Contraataque',d:'Esperar y salir rápido.',how:'Estilo de contraataque en Instrucciones.'},
 can:{n:'Apostar por la cantera',d:'Que jueguen los de casa y los jóvenes.',how:'Que canteranos o menores de 22 jueguen al menos un 25% de los minutos.'},
};
/** El estilo que quiere la directiva de tu club (se elige al llegar y se mantiene). */
export function boardStyle(){
 const t=T(S.user);if(S.bstyle&&S.bstyle.c===S.user)return S.bstyle.k;
 const big=(S.exp&&S.exp[S.user]||10)<=4,small=(S.exp&&S.exp[S.user]||10)>=13,h=[...String(t.id)+t.name].reduce((a,c)=>a+c.charCodeAt(0),0);
 const opts=big?['pos','ata','pre']:small?['sol','con','can']:['ata','pre','can','con','sol'];
 const k=opts[h%opts.length];S.bstyle={c:S.user,k};return k;
}
const mine=r=>r.h===S.user?[r.hg,r.ag,r.poss]:[r.ag,r.hg,100-r.poss];
/** Partidos oficiales de esta temporada (del registro de partidos). */
const seasonLog=()=>(S.mlog||[]).filter(r=>r.sn===S.seasonN&&!/amistoso/i.test(r.label||''));
/** Minutos para canteranos y jóvenes: parte de las apariciones de tus jugadores. */
export function youthShare(){
 let a=0,y=0;seasonLog().forEach(r=>(r.pl||[]).forEach(x=>{const p=S.players[x[0]];if(!p||p.team!==S.user)return;a++;if(p.home||p.age<=21)y++;}));
 if(!a){const xi=(T(S.user).lineup||[]).map(id=>S.players[id]).filter(Boolean);return xi.length?xi.filter(p=>p.home||p.age<=21).length/xi.length:0;}
 return y/a;
}
/** Cumplimiento del estilo (0-100) y una frase que lo explica. */
export function styleScore(){
 const k=boardStyle(),t=T(S.user),tac=t.tac||{},L=seasonLog(),n=L.length;
 const gf=n?L.reduce((a,r)=>a+mine(r)[0],0)/n:null,gc=n?L.reduce((a,r)=>a+mine(r)[1],0)/n:null,po=n?L.reduce((a,r)=>a+mine(r)[2],0)/n:null;
 let s=50,why='';
 if(k==='pos'){s=(tac.est==='pos'?60:25)+(po!=null?clamp((po-45)*3,0,40):15);why=po!=null?`Posesión media: ${Math.round(po)}%.`:tac.est==='pos'?'Tu táctica busca la posesión.':'Tu táctica no busca la posesión.';}
 else if(k==='ata'){s=(t.ment==='att'?55:t.ment==='def'?15:35)+(gf!=null?clamp(gf*25,0,45):15);why=gf!=null?`Goles a favor por partido: ${gf.toFixed(1)}.`:`Mentalidad ${t.ment==='att'?'ofensiva':t.ment==='def'?'defensiva':'equilibrada'}.`;}
 else if(k==='pre'){s=tac.pre==='alt'?90:tac.pre==='med'?50:15;why=`Presión ${tac.pre==='alt'?'alta':tac.pre==='baj'?'baja':'media'}.`;}
 else if(k==='sol'){s=gc!=null?clamp(110-gc*45,0,100):(t.ment==='def'?75:55);why=gc!=null?`Goles en contra por partido: ${gc.toFixed(1)}.`:'Aún sin partidos oficiales.';}
 else if(k==='con'){s=(tac.est==='con'?75:25)+(gf!=null?clamp(gf*12,0,25):10);why=tac.est==='con'?'Tu táctica sale a la contra.':'Tu táctica no busca el contraataque.';}
 else if(k==='can'){const y=youthShare();s=clamp(20+y*260,0,100);why=`Canteranos y jóvenes: ${Math.round(y*100)}% de las apariciones.`;}
 return {k,s:Math.round(clamp(s,0,100)),why};
}
/** Hasta dónde se espera llegar en la copa según lo grande que es el club. */
export function cupTarget(){const e=S.exp&&S.exp[S.user]||10,lv=LG(T(S.user).lg).lv;return lv===0&&e<=3?'Semifinales':lv===0&&e<=8?'Cuartos de final':lv<=1?'Octavos de final':'Pasar una ronda';}
function cupState(){
 const C=userCup();if(!C)return {txt:'Sin copa',s:60,played:0};
 const n=(C.rounds||[]).filter(rd=>(rd.matches||[]).some(m=>m.h===S.user||m.a===S.user)).length,alive=(C.alive||[]).includes(S.user);
 if(C.winner===S.user)return {txt:'¡Campeón!',s:100,played:n};
 const need={'Semifinales':C.R-1,'Cuartos de final':C.R-2,'Octavos de final':C.R-3,'Pasar una ronda':2}[cupTarget()]||2;
 if(!n)return {txt:'Aún no ha empezado',s:65,played:0};
 if(alive)return {txt:`Sigue viva (${n} ronda${n>1?'s':''} jugada${n>1?'s':''})`,s:clamp(65+n*6,0,95),played:n};
 return {txt:`Eliminado en la ronda ${n}`,s:Math.round(clamp(30+(n/need)*45,10,85)),played:n};
}
/** Posición en liga ahora mismo. */
function lgState(){const tb=table(T(S.user).lg),i=tb.findIndex(r=>r.id===S.user),pj=tb[i]?tb[i].pj:0;return {pos:i+1,pj,n:tb.length};}
const GR=s=>s>=85?['A','Excelente','good']:s>=70?['B','Bien','good']:s>=55?['C','Correcto','']:s>=40?['D','Flojo','bad']:['E','Muy mal','bad'];
/** La evaluación del entrenador por áreas, con nota global. */
export function evaluation(){
 const M=S.mgr,O=S.obj||{txt:'Mitad de tabla',max:12},Lg=lgState(),cup=cupState(),st=styleScore(),sq=squad(S.user);
 const lg=Lg.pj?Math.round(clamp(72+(O.max-Lg.pos)*(Lg.pos<=O.max?4:7)*Math.min(1,.4+Lg.pj/20),5,100)):60;
 const cap=S.wageCap??wageBill(),wb=wageBill(),bal=(S.fin||[]).reduce((a,f)=>a+f.tv+f.tix+(f.spo||0)+(f.shop||0)+(f.biz||0)-f.wages,0);
 const fin=Math.round(clamp(72+(wb<=cap?8:-25)+(S.budget<0?-30:0)-(S.bank||[]).length*8+(bal>0?10:bal<0?-8:0),0,100));
 const fans=Math.round(clamp(S.club?S.club.mood:60,0,100)),hap=sq.length?Math.round(sq.reduce((a,p)=>a+(p.hap??70),0)/sq.length):70;
 const ys=youthShare(),yo=Math.round(clamp(35+ys*200,0,100));
 const A=[
  {k:'lg',n:'Liga',w:35,s:lg,d:Lg.pj?`${Lg.pos}º de ${Lg.n} · objetivo: ${O.txt.toLowerCase()} (top ${O.max})`:`Objetivo: ${O.txt.toLowerCase()} (top ${O.max}). Aún no ha empezado.`},
  {k:'cup',n:'Copa',w:10,s:cup.s,d:`${cup.txt} · se espera: ${cupTarget().toLowerCase()}`},
  {k:'fin',n:'Finanzas',w:15,s:fin,d:wb>cap?'Pagas más sueldos de lo permitido.':S.budget<0?'El presupuesto está en negativo.':'Cuentas en orden y sueldos dentro del límite.'},
  {k:'est',n:'Estilo de juego',w:15,s:st.s,d:`${BSTYLE[st.k].n}. ${st.why}`},
  {k:'afi',n:'Afición',w:10,s:fans,d:fans>=70?'La grada está contigo.':fans>=45?'La afición espera más.':'La grada está enfadada.'},
  {k:'ves',n:'Vestuario',w:10,s:hap,d:hap>=70?'Los jugadores están contentos.':hap>=50?'Hay alguna queja en el vestuario.':'El vestuario está roto.'},
  {k:'can',n:'Cantera y jóvenes',w:5,s:yo,d:`${Math.round(ys*100)}% de las apariciones para canteranos y menores de 22.`},
 ];
 if(st.k==='can'){A[6].w=10;A[0].w=30;}
 const tot=Math.round(A.reduce((a,x)=>a+x.s*x.w,0)/A.reduce((a,x)=>a+x.w,0));
 const g=GR(tot),conf=M?Math.round(M.conf):60;
 const verdict=conf<25?'Tu puesto corre peligro: la directiva está perdiendo la paciencia.':tot>=80?'La directiva está encantada con tu trabajo.':tot>=65?'La directiva está satisfecha.':tot>=50?'La directiva espera una mejora.':'La directiva está muy preocupada.';
 return {areas:A.map(x=>Object.assign(x,{g:GR(x.s)})),tot,g,verdict,conf};
}
