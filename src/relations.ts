/* El Banquillo · relations.ts — Relaciones en el vestuario (como «Player Relationships» del FMM): influencia,
 * jerarquía, grupo social y con quién se lleva bien o mal, y por qué. Se calcula al vuelo con lo que ya sabe el juego. */
// @ts-nocheck — usa el estado heredado S.
import {COUNTRIES,ROLES} from './data';
import {S,squad} from './state';
import {influence,langOf} from './tactics';
import {mentorOf} from './mentor';

const RL=r=>(ROLES[r||'ro']||ROLES.ro).l;
/** Datos del vestuario de un jugador de tu plantilla. */
export function relations(p){
 const sq=squad(S.user).filter(x=>!x.loan),inf=influence(p,sq),rank=sq.map(x=>[x,influence(x,sq)]).sort((a,b)=>b[1]-a[1]).findIndex(x=>x[0]===p);
 const hier=rank<3?'Líder del vestuario':rank<8?'Muy influyente':rank<14?'Influyente':'Otros';
 const byLang={};sq.forEach(x=>{const l=langOf(x);(byLang[l]=byLang[l]||[]).push(x);});
 const mine=byLang[langOf(p)]||[],big=Object.values(byLang).sort((a,b)=>b.length-a.length)[0];
 const group=mine.length<=1?'Aislado':mine===big?'Grupo principal':'Grupo secundario';
 const pos=[],neg=[],seen=new Set();const add=(L,x,why)=>{if(!x||x===p||seen.has(x.id))return;seen.add(x.id);L.push({p:x,why});};
 const m=mentorOf(p.id);if(m)add(pos,S.players[m],'Su mentor');
 sq.forEach(x=>{if(mentorOf(x.id)===p.id)add(pos,x,'Es su mentor');});
 sq.filter(x=>x.nat===p.nat).sort((a,b)=>influence(b,sq)-influence(a,sq)).slice(0,2).forEach(x=>add(pos,x,'Compatriotas'));
 if(p.home)sq.filter(x=>x.home&&Math.abs(x.age-p.age)<=3).slice(0,2).forEach(x=>add(pos,x,'Crecieron juntos en la cantera'));
 mine.filter(x=>x.nat!==p.nat).sort((a,b)=>influence(b,sq)-influence(a,sq)).slice(0,2).forEach(x=>add(pos,x,'Hablan el mismo idioma'));
 if(p.per==='pro')sq.filter(x=>x.per==='pro').slice(0,1).forEach(x=>add(pos,x,'Los dos son muy profesionales'));
 sq.filter(x=>x!==p&&x.sp===p.sp&&RL(x.role)>RL(p.role)&&p.ovr>=x.ovr-3).sort((a,b)=>b.ovr-a.ovr).slice(0,2).forEach(x=>add(neg,x,`Cree que merece el puesto de ${x.name.split(' ').slice(-1)[0]}`));
 if(p.per==='tem')sq.filter(x=>x.per==='lid'&&x!==p).slice(0,1).forEach(x=>add(neg,x,'Choque de caracteres'));
 if(p.per==='amb')sq.filter(x=>x.ovr<p.ovr-10&&RL(x.role)>=RL(p.role)).slice(0,1).forEach(x=>add(neg,x,'No entiende que juegue por delante de él'));
 return {inf,infL:inf>=70?'Muy alta':inf>=50?'Alta':inf>=30?'Media':'Baja',hier,group,lang:COUNTRIES[p.nat].lang,pos:pos.slice(0,4),neg:neg.slice(0,3)};
}
