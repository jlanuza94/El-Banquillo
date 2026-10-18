/* El Banquillo · mods.ts — Editor y mods: cambiar nombres, colores y jugadores, y exportar o importar en JSON o CSV. */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {ATTRS,AT_SH,COUNTRIES,GRP,SPN} from './data';
import {LG,PL,S,T,dirty,squad} from './state';
import {refresh,setValue} from './players';

export const CREST_SHAPES={'':'Clásico',s:'Escudo',c:'Círculo',q:'Cuadrado'};
const clean=(v,n=60)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,n);
const color=v=>/^#[0-9a-f]{6}$/i.test(String(v||'').trim())?String(v).trim().toLowerCase():null;

/* ---------- Editar ---------- */
export function editClub(id,o){
 const t=T(id);if(!t)return 'Ese club no existe.';
 const name=clean(o.name);if(name.length<2)return 'El nombre es demasiado corto.';
 t.name=name;if(o.short)t.short=clean(o.short,3).toUpperCase()||t.short;
 const c1=color(o.c1),c2=color(o.c2);if(c1)t.c1=c1;if(c2)t.c2=c2;
 if(o.cs!=null&&o.cs in CREST_SHAPES)t.cs=o.cs||undefined;
 return '';
}
export function editPlayer(id,o){
 const p=PL(id)||(S.academy||[]).find(x=>x.id===id);if(!p)return 'Ese jugador no existe.';
 const name=clean(o.name);if(name.split(' ').length<1||name.length<3)return 'El nombre es demasiado corto.';
 p.name=name;
 if(o.nat!=null&&COUNTRIES[+o.nat])p.nat=+o.nat;
 if(o.sp&&SPN[o.sp]){p.sp=o.sp;p.pos=GRP[o.sp];p.alt=(p.alt||[]).filter(x=>x!==o.sp);}
 if(o.age)p.age=clamp(Math.round(+o.age),15,45);
 if(o.foot&&'DIA'.includes(o.foot))p.foot=o.foot;
 ATTRS.forEach(k=>{if(o[k]!=null&&o[k]!=='')p.at[k]=clamp(Math.round(+o[k]),1,10);});
 if(o.pot)p.pot=clamp(+o.pot,1,10);
 refresh(p);if(p.pot*10<p.ovr)p.pot=p.ovr/10;dirty();
 return '';
}
export function editNames(cNames,lgNames){
 S.cNames=S.cNames||{};S.lgNames=S.lgNames||{};
 Object.entries(cNames||{}).forEach(([c,v])=>{v=clean(v,40);if(v)S.cNames[c]=v;else delete S.cNames[c];});
 Object.entries(lgNames||{}).forEach(([l,v])=>{v=clean(v,50);if(v)S.lgNames[l]=v;else delete S.lgNames[l];});
}

/* ---------- Exportar ---------- */
/** Mod en JSON: nombres, colores y escudos de clubes, nombres de ligas y países, y jugadores editados (o todos). */
export function exportMod(allPlayers){
 const ps=Object.values(S.players).filter(p=>allPlayers||p.edited);
 return JSON.stringify({type:'el-banquillo-mod',v:1,seed:S.seed,
  countries:S.cNames||{},leagues:S.lgNames||{},
  clubs:S.teams.map(t=>({id:t.id,pais:LG(t.lg).c,division:LG(t.lg).lv+1,name:t.name,short:t.short,c1:t.c1,c2:t.c2,cs:t.cs||''})),
  players:ps.map(p=>({id:p.id,club:p.team,name:p.name,nat:p.nat,sp:p.sp,age:p.age,foot:p.foot,pot:p.pot,at:p.at}))},null,1);
}
const CSV_SEP=';';
const csvCell=v=>{v=String(v??'');return /[;"\n,]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
export function exportClubsCSV(){
 const head=['id','pais','division','nombre','abreviatura','color1','color2','escudo'];
 return [head.join(CSV_SEP),...S.teams.map(t=>[t.id,COUNTRIES[LG(t.lg).c].n,LG(t.lg).lv+1,t.name,t.short,t.c1,t.c2,t.cs||''].map(csvCell).join(CSV_SEP))].join('\n');
}
export function exportPlayersCSV(clubId){
 const head=['id','club_id','club','nombre','nacionalidad','posicion','edad','pie',...ATTRS.map(k=>AT_SH[k]),'potencial'];
 const ps=clubId!=null?squad(clubId):Object.values(S.players).filter(p=>p.team!==null);
 return [head.join(CSV_SEP),...ps.map(p=>[p.id,p.team,p.team!==null?T(p.team).name:'',p.name,COUNTRIES[p.nat].code,p.sp,p.age,p.foot,...ATTRS.map(k=>p.at[k]),p.pot].map(csvCell).join(CSV_SEP))].join('\n');
}

/* ---------- Importar ---------- */
export function parseCSV(txt){
 const sep=(txt.split('\n')[0].match(/;/g)||[]).length>=(txt.split('\n')[0].match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<txt.length;i++){const ch=txt[i];
  if(q){if(ch==='"'){if(txt[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=ch;}
  else if(ch==='"')q=true;else if(ch===sep){row.push(cell);cell='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=ch;}
 if(cell||row.length){row.push(cell);rows.push(row);}
 const head=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
 return rows.filter(r=>r.some(c=>c.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]??'').trim()])));
}
const natOf=v=>{v=String(v||'').trim().toLowerCase();if(v==='')return null;const i=COUNTRIES.findIndex(c=>c.code.toLowerCase()===v||c.n.toLowerCase()===v);return i>=0?i:/^\d+$/.test(v)?+v:null;};
const clubByName=n=>{n=String(n||'').trim().toLowerCase();return S.teams.find(t=>t.name.toLowerCase()===n);};
/** Importa un mod (JSON) o un CSV de clubes o de jugadores. Devuelve un resumen. */
export function importData(txt){
 const V=validateData(txt),rep={errors:V.errors.slice(0,12),warns:V.warns.slice(0,8),nE:V.errors.length,nW:V.warns.length};
 const r=importRaw(txt);return Object.assign(r,rep);
}
function importRaw(txt){
 txt=String(txt||'').replace(/^\uFEFF/,'').trim();if(!txt)return{ok:false,msg:'El archivo está vacío.'};
 let nc=0,np=0,nn=0,err=0;
 if(txt[0]==='{'){
  let o;try{o=JSON.parse(txt);}catch(e){return{ok:false,msg:'El JSON no es válido.'};}
  if(o.type!=='el-banquillo-mod')return{ok:false,msg:'Este archivo no es un mod de El Banquillo.'};
  editNames(o.countries,o.leagues);nn=Object.keys(o.countries||{}).length+Object.keys(o.leagues||{}).length;
  (o.clubs||[]).forEach(c=>{const t=T(c.id)&&(o.seed==null||o.seed===S.seed||T(c.id).lg!=null)?T(c.id):clubByName(c.name);if(t&&!editClub(t.id,c))nc++;else err++;});
  (o.players||[]).forEach(x=>{const p=PL(x.id);if(p&&!editPlayer(p.id,Object.assign({},x,x.at||{}))){p.edited=1;np++;}else err++;});
 }else{
  const rows=parseCSV(txt);if(!rows.length)return{ok:false,msg:'El CSV no tiene filas.'};
  const isPlayers='posicion' in rows[0]||'nombre' in rows[0]&&('edad' in rows[0]||'club' in rows[0]);
  if(!isPlayers){
   rows.forEach(r=>{const t=T(+r.id)||clubByName(r.nombre_actual||r.nombre);if(!t){err++;return;}if(!editClub(t.id,{name:r.nombre,short:r.abreviatura,c1:r.color1,c2:r.color2,cs:r.escudo}))nc++;else err++;});
  }else{
   // por id; si no hay id, por club y en orden dentro de la misma posición
   const used=new Set();
   rows.forEach(r=>{let p=r.id?PL(r.id):null;
    if(!p){const t=T(+r.club_id)||clubByName(r.club);if(!t){err++;return;}const sp=String(r.posicion||'').toUpperCase(),g=GRP[sp];p=squad(t.id).filter(x=>!used.has(x.id)&&(!g||GRP[x.sp]===g)).sort((a,b)=>b.ovr-a.ovr)[0];}
    if(!p){err++;return;}used.add(p.id);
    const o={name:r.nombre,nat:natOf(r.nacionalidad),sp:String(r.posicion||'').toUpperCase()||undefined,age:r.edad,foot:String(r.pie||'').toUpperCase()||undefined,pot:r.potencial};
    ATTRS.forEach(k=>{const v=r[AT_SH[k].toLowerCase()];if(v!=null&&v!=='')o[k]=v;});
    if(!editPlayer(p.id,o)){p.edited=1;np++;}else err++;});
  }
 }
 dirty();
 return{ok:true,msg:`Importado: ${nc} club${nc===1?'':'es'}, ${np} jugador${np===1?'':'es'}${nn?`, ${nn} nombre${nn===1?'':'s'} de ligas o países`:''}${err?` (${err} fila${err===1?'':'s'} sin aplicar)`:''}.`};
}

/* ---------- Validar ---------- */
const ATR_N=()=>ATTRS.map(k=>AT_SH[k].toLowerCase());
const lineOfPos=(txt,pos)=>txt.slice(0,pos).split('\n').length;
/** Comprueba un mod (JSON) o un CSV sin aplicar nada. Devuelve los errores (filas que no se aplicarán) y avisos, con su línea. */
export function validateData(txt){
 txt=String(txt||'').replace(/^﻿/,'').trim();
 const errors=[],warns=[],E=(l,m)=>errors.push({l,m}),W=(l,m)=>warns.push({l,m});
 if(!txt){E(0,'El archivo está vacío.');return{kind:'?',rows:0,errors,warns};}
 const badAttr=(v,k,l,who)=>{if(v==null||v==='')return;const n=+v;if(!isFinite(n))E(l,`${who}: «${k}» no es un número (${v}).`);else if(n<1||n>10)E(l,`${who}: «${k}» tiene que ir del 1 al 10 (pone ${v}).`);};
 if(txt[0]==='{'){
  let o;try{o=JSON.parse(txt);}catch(e){const m=/position (\d+)/.exec(e.message||'');E(m?lineOfPos(txt,+m[1]):0,'El JSON no es válido: '+String(e.message||'').replace(/^.*?:\s*/,'').slice(0,90));return{kind:'json',rows:0,errors,warns};}
  if(o.type!=='el-banquillo-mod'){E(1,'Falta "type": "el-banquillo-mod": este archivo no es un mod de El Banquillo.');return{kind:'json',rows:0,errors,warns};}
  if(o.v!=null&&o.v>1)W(1,`El mod es de una versión más nueva (v${o.v}); puede que algo no se aplique.`);
  if(S&&o.seed!=null&&o.seed!==S.seed)W(1,`El mod se hizo para otro mundo (semilla ${o.seed}, la tuya es ${S.seed}): los clubes se buscarán por nombre y los jugadores por id.`);
  const lines=txt.split('\n'),findLine=(needle)=>{const i=lines.findIndex(x=>x.includes(needle));return i<0?0:i+1;};
  (o.clubs||[]).forEach((c,i)=>{const l=findLine(`"id": ${c.id},`)||findLine(`"name": ${JSON.stringify(c.name)}`),who=`Club ${c.name||'#'+i}`;
   const t=(c.id!=null&&T(c.id)&&(o.seed==null||!S||o.seed===S.seed))?T(c.id):clubByName(c.name);
   if(!t)E(l,`${who}: no existe en esta partida (ni por id ni por nombre).`);
   if(clean(c.name).length<2)E(l,`${who}: el nombre es demasiado corto.`);
   ['c1','c2'].forEach(k=>{if(c[k]&&!color(c[k]))W(l,`${who}: el color ${k} «${c[k]}» no es #rrggbb; se deja el actual.`);});});
  (o.players||[]).forEach((x,i)=>{const l=findLine(`"id": ${JSON.stringify(x.id)}`),who=`Jugador ${x.name||x.id||'#'+i}`;
   if(!PL(x.id))E(l,`${who}: no existe ningún jugador con id ${x.id} en esta partida.`);
   if(clean(x.name).length<3)E(l,`${who}: el nombre es demasiado corto.`);
   if(x.sp&&!SPN[x.sp])E(l,`${who}: la posición «${x.sp}» no existe (usa POR, DFC, LD, LI, MCD, MC, MD, MI, MCO, ED, EI, DC).`);
   if(x.age!=null&&(+x.age<15||+x.age>45))W(l,`${who}: edad ${x.age} fuera de 15–45; se ajustará.`);
   if(x.nat!=null&&!COUNTRIES[+x.nat])E(l,`${who}: la nacionalidad ${x.nat} no existe.`);
   Object.entries(x.at||{}).forEach(([k,v])=>{if(!ATTRS.includes(k))W(l,`${who}: el atributo «${k}» no existe y se ignora.`);else badAttr(v,AT_SH[k],l,who);});});
  return{kind:'json',rows:(o.clubs||[]).length+(o.players||[]).length,errors,warns};
 }
 const rows=parseCSV(txt);if(!rows.length){E(1,'El CSV no tiene filas.');return{kind:'csv',rows:0,errors,warns};}
 const head=Object.keys(rows[0]),isPlayers='posicion' in rows[0]||'nombre' in rows[0]&&('edad' in rows[0]||'club' in rows[0]);
 const known=isPlayers?['id','club_id','club','nombre','nacionalidad','posicion','edad','pie','potencial',...ATR_N()]:['id','pais','division','nombre','nombre_actual','abreviatura','color1','color2','escudo'];
 head.filter(h=>!known.includes(h)).forEach(h=>W(1,`La columna «${h}» no se reconoce y se ignora.`));
 if(!head.includes('nombre'))E(1,'Falta la columna «nombre».');
 rows.forEach((r,i)=>{const l=i+2,who=`Fila ${l}`;
  if(!isPlayers){if(!T(+r.id)&&!clubByName(r.nombre_actual||r.nombre))E(l,`${who}: el club «${r.nombre||r.id}» no existe en esta partida.`);
   if(clean(r.nombre).length<2)E(l,`${who}: el nombre es demasiado corto.`);
   ['color1','color2'].forEach(k=>{if(r[k]&&!color(r[k]))W(l,`${who}: ${k} «${r[k]}» no es #rrggbb.`);});return;}
  if(!(r.id&&PL(r.id))&&!T(+r.club_id)&&!clubByName(r.club))E(l,`${who}: no encuentro al jugador (id ${r.id||'—'}) ni a su club «${r.club||r.club_id||'—'}».`);
  if(clean(r.nombre).length<3)E(l,`${who}: el nombre es demasiado corto.`);
  const sp=String(r.posicion||'').toUpperCase();if(sp&&!SPN[sp])E(l,`${who}: la posición «${r.posicion}» no existe.`);
  if(r.edad&&(!isFinite(+r.edad)||+r.edad<15||+r.edad>45))W(l,`${who}: edad «${r.edad}» fuera de 15–45; se ajustará.`);
  if(r.pie&&!'DIA'.includes(String(r.pie).toUpperCase()))W(l,`${who}: pie «${r.pie}» no es D, I ni A.`);
  if(r.nacionalidad&&natOf(r.nacionalidad)==null)E(l,`${who}: nacionalidad «${r.nacionalidad}» desconocida.`);
  ATTRS.forEach(k=>badAttr(r[AT_SH[k].toLowerCase()],AT_SH[k],l,who));
  if(r.potencial)badAttr(r.potencial,'potencial',l,who);});
 return{kind:isPlayers?'csv-jugadores':'csv-clubes',rows:rows.length,errors,warns};
}
