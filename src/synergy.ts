/* El Banquillo · synergy.ts — Sinergias del once: qué parejas de puestos se complementan (o se estorban)
 * según su rol, su cometido y sus instrucciones. Se ven en la pantalla de táctica y cuentan en el partido. */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {PL} from './state';

const side=s=>/^(LD|MD|ED|CAD)$/.test(s)?'r':/^(LI|MI|EI|CAI)$/.test(s)?'l':null;
const LAT=/^(LD|LI|CAD|CAI)$/,WING=/^(MD|MI|ED|EI)$/,MID=/^(MC|MCD)$/,CB=/^DFC$/,ST=/^DC$/,AM=/^MCO$/;
const CREA=['org','ore','eng','mp'],DEST=['piv','mcc'],WIDEW=['ext','eba'],INW=['epc'],DEFW=['ede','cdb'],TARGET=['dob','dar'];
/** Lo que hace cada puesto: ataca (1), equilibra (0) o defiende (-1) según rol, cometido e instrucciones. */
function lean(s,role,duty,pi){let v=duty==='ata'?1:duty==='def'?-1:0;
 if(['lof','car','lle','box','epc','eng'].includes(role))v+=.5;if(['lde','piv','mcc','ede','cdb','sto'].includes(role))v-=.5;
 if(pi.includes('sub')||pi.includes('lle'))v+=.5;if(pi.includes('cer')||pi.includes('pos')||pi.includes('ayu'))v-=.5;return v;}
/**
 * Parejas con sinergia del once: [i, j, +1 buena / -1 mala, explicación].
 * slots: puestos; roles, duties, pis: por puesto; ids: jugadores (para mirar si encajan en el rol).
 */
export function synergies(slots,roles,duties,pis,ids){
 const out=[],n=slots.length,R=i=>(roles&&roles[i])||'',D=i=>(duties&&duties[i])||'apo',P=i=>(pis&&pis[i])||[],L=i=>lean(slots[i],R(i),D(i),P(i));
 const add=(i,j,v,t)=>{if(!out.some(x=>x[0]===i&&x[1]===j||x[0]===j&&x[1]===i))out.push([i,j,v,t]);};
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=slots[i],b=slots[j];
  // lateral y extremo/medio de la misma banda
  const lat=LAT.test(a)?i:LAT.test(b)?j:-1,w=WING.test(a)?i:WING.test(b)?j:-1;
  if(lat>=0&&w>=0&&lat!==w&&side(slots[lat])&&side(slots[lat])===side(slots[w])){
   const la=L(lat),wr=R(w),wIn=INW.includes(wr)||P(w).includes('den'),wDef=DEFW.includes(wr)||D(w)==='def';
   if(la>=.5&&wIn)add(lat,w,1,'El lateral dobla por fuera mientras el extremo se mete: superioridad en la banda.');
   else if(la>=.5&&!wIn&&!wDef&&L(w)>=0)add(lat,w,-1,'Lateral y extremo pisan la misma zona y la banda queda vacía atrás.');
   else if(la<0&&(WIDEW.includes(wr)||L(w)>=.5))add(lat,w,1,'Uno ataca y el otro cubre: banda equilibrada.');
   else if(la>=.5&&wDef)add(lat,w,1,'El extremo cubre la subida del lateral.');
   continue;}
  // pareja del medio campo
  if(MID.test(a)&&MID.test(b)){const ra=R(i),rb=R(j);
   if((CREA.includes(ra)&&(DEST.includes(rb)||L(j)<0))||(CREA.includes(rb)&&(DEST.includes(ra)||L(i)<0)))add(i,j,1,'Uno destruye y el otro crea: el medio tiene equilibrio.');
   else if(L(i)>=1&&L(j)>=1)add(i,j,-1,'Los dos se van arriba: el medio queda sin nadie que proteja a la defensa.');
   else if(CREA.includes(ra)&&CREA.includes(rb))add(i,j,-1,'Dos organizadores piden el mismo balón.');
   else if(L(i)<=-1&&L(j)<=-1)add(i,j,-1,'Los dos se quedan atrás: al medio le falta llegada.');
   continue;}
  // pareja de centrales
  if(CB.test(a)&&CB.test(b)){const ra=R(i),rb=R(j);
   if(ra==='sto'&&rb==='sto')add(i,j,-1,'Los dos centrales salen al corte: queda espacio a su espalda.');
   else if((ra==='sto')!==(rb==='sto'))add(i,j,1,'Uno sale al corte y el otro cubre.');
   else if(ra==='csa'&&rb!=='csa'||rb==='csa'&&ra!=='csa')add(i,j,1,'Un central saca el balón jugado y el otro se queda: salida segura.');
   continue;}
  // pareja de delanteros
  if(ST.test(a)&&ST.test(b)){const ra=R(i),rb=R(j);
   if((ra==='dob'&&rb!=='dob')||(rb==='dob'&&ra!=='dob')||(ra==='f9'&&rb==='dar')||(rb==='f9'&&ra==='dar'))add(i,j,1,'Uno baja a descargar y el otro remata.');
   else if(ra===rb&&ra==='dar')add(i,j,-1,'Dos rematadores y nadie que baje a combinar.');
   else if(ra===rb&&ra==='f9')add(i,j,-1,'Los dos bajan a recibir: nadie ataca el área.');
   continue;}
  // extremo que centra + rematador
  const ex=WING.test(a)?i:WING.test(b)?j:-1,dc=ST.test(a)?i:ST.test(b)?j:-1;
  if(ex>=0&&dc>=0){if((WIDEW.includes(R(ex))||P(ex).includes('cen'))&&TARGET.includes(R(dc)))add(ex,dc,1,'Centros desde la banda para un rematador.');
   else if(INW.includes(R(ex))&&R(dc)==='f9')add(ex,dc,1,'El falso nueve baja y abre el espacio para que el extremo entre por dentro.');continue;}
  // mediapunta o enganche con el delantero
  const am=AM.test(a)?i:AM.test(b)?j:-1;
  if(am>=0&&dc>=0){if(['eng','mp'].includes(R(am))&&['dar','dpr','dob'].includes(R(dc)))add(am,dc,1,'El mediapunta asiste a un delantero que ataca el área.');
   else if(R(am)==='lle'&&R(dc)==='f9')add(am,dc,1,'El falso nueve deja el área libre para que llegue el mediapunta.');
   else if(R(am)==='eng'&&R(dc)==='f9')add(am,dc,-1,'Enganche y falso nueve buscan el mismo espacio entre líneas.');}
 }
 // si el jugador no encaja en su rol, la pareja rinde menos
 return out.map(x=>{const pa=ids&&PL(ids[x[0]]),pb=ids&&PL(ids[x[1]]);return x.concat([!!(pa&&pb)]);});
}
/** Efecto en el partido: cada pareja buena suma un poco y cada mala resta; con techo. */
export function synergyMods(S_){const g=S_.filter(x=>x[2]>0).length,b=S_.filter(x=>x[2]<0).length;
 return {own:clamp(1+.006*g-.007*b,.96,1.035),opp:clamp(1-.004*g+.006*b,.97,1.04),g,b};}
