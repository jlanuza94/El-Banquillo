/* El Banquillo · tacreport.ts — Informe táctico tras cada partido: qué aportó o costó cada decisión
 * (en goles esperados), cómo llegaron los goles, por dónde te atacaron, el efecto de tus cambios en directo
 * y qué cambiar para el próximo partido. Funciona igual si lo juegas en directo o lo simulas. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from './core';
import {MENT,OIS,TACS} from './data';
import {PL,S,T,lastNm} from './state';
import {slotsOf} from './tactics';
import {GOALT} from './engine';

const r2=x=>Math.round(x*100)/100;
const dec=x=>x.toFixed(2).replace('.',',');
const fx=x=>(x>=0?'+':'−')+Math.abs(x).toFixed(2).replace('.',',');
const tacLbl=(k,v)=>TACS[k]&&TACS[k].o[v]?TACS[k].o[v].toLowerCase():v;
const NAMES={pre:'Presión',lin:'Línea defensiva',rit:'Ritmo',anc:'Anchura',est:'Estilo',fase:'Al perder / al recuperar',rol:'Roles de tus jugadores',pos:'Cometidos e instrucciones por puesto',ord:'Órdenes especiales',oi:'Tus instrucciones al rival',oiR:'Las instrucciones del rival',clima:'Clima y campo',mom:'Tus decisiones en momentos clave',cap:'El capitán',ment:'Mentalidad'};
const sideOf=sp=>/^(LD|CAD|MD|ED)$/.test(sp)?'r':/^(LI|CAI|MI|EI)$/.test(sp)?'l':null;

/** Datos del informe (compactos: se guardan con el partido). */
export function tacReport(m){
 const us=m.us,o=us==='h'?'a':'h',tl=m.tl;if(!us||!tl||!tl.n)return null;
 const n=tl.n,live=!!(tl.x&&tl.x.length);
 const sum=i=>tl.x.reduce((a,x)=>a+x[i],0)/1e4;
 const bF=live?sum(0):(m.st[us].xg||0)*.85,bA=live?sum(1):(m.st[o].xg||0)*.85;
 const t0=(tl.ch&&tl.ch[0]&&tl.ch[0].a)||{me:m.ment[us],t:m.tac[us]},tE=m.tac[us]||{};
 const lbl=k=>{const a=t0.t[k],b=tE[k];if(!TACS[k])return NAMES[k];return a!==b?`${NAMES[k]}: ${tacLbl(k,a)} → ${tacLbl(k,b)}`:`${NAMES[k]} ${tacLbl(k,b)}`;};
 const F=[];
 const add=(k,lo,lp,ld,name)=>{const fo=Math.exp(lo/n),fp=Math.exp(lp/n),fd=Math.exp((ld||0)/n);const dF=bF*(1-1/fo),dA=bA*(1-1/fp);if(Math.abs(dF)<.015&&Math.abs(dA)<.015&&(Math.abs(fd-1)<.02||!['pre','rit','fase','pos'].includes(k)))return;F.push([k,name,r2(dF),r2(dA),Math.round((fd-1)*100)]);};
 Object.entries(tl.u).forEach(([k,e])=>{if(k==='oiR')add('oiR',e[0],0,0,NAMES.oiR);else if(k==='fase'){const a=tE.per||'nor',b=tE.rec||'nor';add(k,e[0],e[1],e[2],`Al perder: ${tacLbl('per',a)} · al recuperar: ${tacLbl('rec',b)}`);}else if(k!=='oi')add(k,e[0],e[1],e[2],lbl(k));});
 {const a=tl.u.oi||[0,0,0],b=tl.r.oiR||[0,0,0];const ois=Object.keys((m.oi&&m.oi[us])||{}).filter(k=>m.oi[us][k]).map(k=>OIS[k]?OIS[k].n.toLowerCase():k);if(ois.length||a[0]||b[0])add('oi',a[0],b[0],a[2],`Instrucciones al rival: ${ois.join(', ')||'—'}`);}
 {// la táctica del rival: su ataque (en contra tuya) y su defensa (lo que te quitó)
  let lo=0,lp=0;['est','fase','pre','lin','rit','anc'].forEach(k=>{const e=tl.r[k];if(e){lo+=e[0];lp+=e[1];}});
  const fo=Math.exp(lp/n),fa=Math.exp(lo/n),dF=bF*(1-1/fo),dA=bA*(1-1/fa),rt=m.tac[o]||{};
  if(Math.abs(dF)>=.03||Math.abs(dA)>=.03)F.push(['riv',`Cómo jugó el rival: ${tacLbl('est',rt.est)}, presión ${tacLbl('pre',rt.pre)}, línea ${tacLbl('lin',rt.lin)}`,r2(dF),r2(dA),0]);}
 add('ment',tl.m[0],tl.m[1],0,t0.me!==m.ment[us]?`Mentalidad: ${MENT[t0.me].label.toLowerCase()} → ${MENT[m.ment[us]].label.toLowerCase()}`:`Mentalidad ${MENT[m.ment[us]].label.toLowerCase()}`);
 F.sort((x,y)=>Math.abs(y[2]-y[3])-Math.abs(x[2]-x[3]));
 const gt={f:{},a:{}};m.ev.forEach(e=>{if(e.t!=='goal')return;const k=e.gt||'otro',G=e.s===us?gt.f:gt.a;G[k]=(G[k]||0)+1;});
 // por dónde nos atacaron (en directo): su banda izquierda es nuestra derecha
 let ln=null;if(m.lz&&m.lz[o]){const z=m.lz[o],t=z.l+z.c+z.r;if(t>=8)ln={r:Math.round(z.l/t*100),c:Math.round(z.c/t*100),l:Math.round(z.r/t*100)};}
 let fb=null;if(ln){const side=ln.r>=45?'r':ln.l>=45?'l':null;if(side){const sl=slotsOf(m.f[us]);sl.forEach((sp,i)=>{if(fb||sideOf(sp)!==side||!/^(LD|LI|CAD|CAI)$/.test(sp))return;const pi=(m.pi&&m.pi[us]&&m.pi[us][i])||[],du=m.du&&m.du[us]&&m.du[us][i];const id=m.lu[us][i];if(pi.includes('sub')||du==='ata')fb={side,n:id&&PL(id)?lastNm(id):sp,why:pi.includes('sub')?'se incorporaba al ataque':'tenía el cometido de atacar'};});if(!fb)fb={side};}}
 // tus cambios en directo y su efecto (ocasiones esperadas cada 10 minutos)
 const ch=[];if(live)(tl.ch||[]).forEach((c,i)=>{const nx=(tl.ch[i+1]||{}).min||tl.x.length+1,pv=i?tl.ch[i-1].min:1;
  const win=(a,b)=>{const L=tl.x.slice(Math.max(0,a-1),Math.max(0,b-1));return L.length?[r2(L.reduce((s,x)=>s+x[0],0)/1e4/L.length*10),r2(L.reduce((s,x)=>s+x[1],0)/1e4/L.length*10)]:null;};
  const be=win(Math.max(pv,c.min-15),c.min),af=win(c.min,Math.min(nx,c.min+15));const d=diffTxt(c.a,c.b);if(d&&be&&af&&nx-c.min>=4)ch.push({min:c.min,d,be,af});});
 const tired=m.lu[us].filter(Boolean).filter(id=>m.en&&m.en[id]<45&&PL(id)).map(id=>lastNm(id));
 const my=m.score[us],op=m.score[o],xf=r2(m.st[us].xg||bF),xa=r2(m.st[o].xg||bA);
 return {r:[my,op],xg:[xf,xa],f:F.slice(0,8),gt,ln,fb,ch:ch.slice(0,5),tired,live,opp:m[o],rt:Object.assign({},m.tac[o]),rm:m.ment[o],um:m.ment[us],ut:Object.assign({},tE),dr:Math.round((Math.exp(((tl.u.pre||[0,0,0])[2]+(tl.u.rit||[0,0,0])[2]+(tl.u.fase||[0,0,0])[2])/n)-1)*100)};
}
function diffTxt(a,b){
 if(!a||!b)return '';const P=[];
 if(a.me!==b.me)P.push(`mentalidad ${MENT[b.me].label.toLowerCase()}`);
 Object.keys(TACS).forEach(k=>{if(a.t[k]!==b.t[k])P.push(`${TACS[k].n.toLowerCase()} ${tacLbl(k,b.t[k])}`);});
 if(a.pl!==b.pl&&b.pl)P.push(`táctica ${b.pl}`);
 const out=a.lu.filter(id=>id&&!b.lu.includes(id)),inn=b.lu.filter(id=>id&&!a.lu.includes(id));
 if(inn.length)P.push(inn.map((id,i)=>`entra ${lastNm(id)}${out[i]?' por '+lastNm(out[i]):''}`).join(', '));
 else if(out.length)P.push(`sale ${out.map(lastNm).join(', ')}`);
 Object.keys(OIS).forEach(k=>{if(!!a.oi[k]!==!!b.oi[k])P.push(`${b.oi[k]?'':'quitas '}${OIS[k].n.toLowerCase()}`);});
 return P.join(' · ');
}
/** Por qué funcionó o no cada factor, según el rival. */
function why(R,k){
 const u=R.ut||{},r=R.rt||{};
 if(k==='pre'&&u.pre==='alt')return r.est==='con'?'Presionar arriba a un equipo de contragolpe te expone: en cuanto superan la presión, corren.':'Robas arriba y el rival crea menos, a cambio de más cansancio.';
 if(k==='pre'&&u.pre==='baj')return 'Esperar atrás le regala el balón al rival.';
 if(k==='lin'&&u.lin==='alt')return r.est==='con'||r.rec==='cont'?'Tu línea alta les dejó correr a la espalda: es lo que busca un equipo que contraataca.':'La línea alta te ayuda a atacar, pero deja espacio a tu espalda.';
 if(k==='lin'&&u.lin==='baj')return 'Bloque bajo: muy sólido, pero creas menos.';
 if(k==='est'&&u.est==='pos')return r.pre==='baj'?'La posesión castiga su presión baja: tocaste con calma.':r.pre==='alt'?'Su presión alta te ahogó la salida de balón: la posesión sufre contra eso.':'';
 if(k==='est'&&u.est==='con')return r.lin==='alt'||R.rm==='att'?'El contragolpe es mortal contra su línea alta y su ataque volcado.':'Contragolpear a un rival que se encierra no rinde: no deja espacios.';
 if(k==='est'&&u.est==='dir')return 'El juego directo depende de que tus delanteros ganen los balones aéreos.';
 if(k==='rit'&&u.rit==='rap')return 'Ritmo rápido: más ocasiones para los dos y más cansancio.';
 if(k==='rit'&&u.rit==='len')return 'Ritmo lento: partido cerrado, pocas ocasiones para los dos.';
 if(k==='anc')return u.anc==='anc'?'Jugar ancho rinde lo que rinden tus laterales y extremos.':'Jugar estrecho tapa el centro pero renuncia a las bandas.';
 if(k==='fase')return u.per==='cpr'&&r.rec==='cont'?'Tu contrapresión sufre contra un rival que sale rápido al contraataque.':u.rec==='cont'?'Salir rápido al recuperar castiga a rivales abiertos.':'';
 if(k==='pos')return 'Muchos cometidos de «Atacar» crean más pero dejan huecos; «Defender» lo contrario.';
 if(k==='riv'){const t=[];if(r.est==='con'&&u.lin==='alt')t.push('se pusieron al contragolpe para aprovechar tu línea alta');if(r.pre==='alt'&&u.est==='pos')t.push('te presionaron arriba para cortar tu posesión');if(r.rec==='cont'&&u.per==='cpr')t.push('salían rápido para castigar tu contrapresión');return t.length?'El rival se adaptó: '+t.join('; ')+'.':'Lo que el rival ganó o perdió con su propia táctica (en verde si te favoreció).';}
 if(k==='ment')return '';
 return '';
}
const TIPF={pre:u=>u.pre==='alt'?'Prueba con presión media contra este tipo de rival.':'Prueba a presionar más arriba.',lin:u=>u.lin==='alt'?'Baja la línea defensiva a media.':'Adelanta la línea: con el bloque tan bajo no creas.',
 est:(u,r)=>u.est==='pos'&&r.pre==='alt'?'Contra presión alta, prueba estilo directo para saltarte su presión.':u.est==='con'?'Contra rivales encerrados, prueba la posesión.':'Prueba otro estilo de juego.',
 rit:u=>u.rit==='rap'?'Baja el ritmo a normal.':'Sube el ritmo: necesitas más ocasiones.',anc:u=>u.anc==='anc'?'Juega con anchura normal: tus bandas no marcan diferencias.':'Abre el campo con anchura normal.',
 fase:u=>u.per==='cpr'?'Al perder el balón, prueba «Normal» o «Replegar».':'Revisa qué haces al perder y al recuperar el balón.',pos:()=>'Revisa los cometidos por puesto: menos jugadores en «Atacar».',ord:()=>'Quita alguna orden de «Sube al ataque».',
 ment:(u,r,R)=>R.um==='att'?'La mentalidad ofensiva te abrió atrás: úsala solo cuando vayas perdiendo.':R.um==='def'?'La mentalidad defensiva te quitó demasiado ataque: prueba equilibrada.':'Prueba otra mentalidad según el rival.',oi:()=>'Quita alguna instrucción al rival: te restaban más de lo que aportaban.'};
/** Consejos para el próximo partido. */
export function reportTips(R){
 const T2=[],u=R.ut||{},r=R.rt||{};
 const worst=R.f.filter(x=>x[2]-x[3]<-.04).sort((a,b)=>(a[2]-a[3])-(b[2]-b[3]))[0];
 if(worst&&TIPF[worst[0]])T2.push(TIPF[worst[0]](u,r,R));
 const ga=R.gt.a||{};
 if((ga.con||0)>=2)T2.push('Te marcaron a la contra: baja la línea o pon «Replegar» al perder el balón.');
 if((ga.cab||0)>=2)T2.push('Te marcaron de cabeza: busca centrales con buen cabezazo o ensaya la defensa del balón parado.');
 if((ga.lej||0)>=2)T2.push('Te marcaron desde lejos: presiona más arriba para no dejarles chutar.');
 if(R.fb&&R.fb.n)T2.push(`Te atacaron por tu banda ${R.fb.side==='r'?'derecha':'izquierda'} y ${R.fb.n} ${R.fb.why}: pídele «Quedarse cerrado».`);
 else if(R.fb)T2.push(`Te atacaron sobre todo por tu banda ${R.fb.side==='r'?'derecha':'izquierda'}: refuerza ese lado o usa «Cerrar las bandas».`);
 if(R.tired.length>=3)T2.push(`${R.tired.slice(0,3).join(', ')}${R.tired.length>3?' y otros':''} acabaron fundidos${R.dr>=6?': tu presión y tu ritmo cansan mucho':''}. Rota o baja la intensidad.`);
 const best=R.f.filter(x=>x[2]-x[3]>.04).sort((a,b)=>(b[2]-b[3])-(a[2]-a[3]))[0];
 if(best)T2.push(/→/.test(best[1])?`${best[1].replace(/:.*→\s*/,': ').replace(/^./,c=>c.toUpperCase())}, el cambio que hiciste, fue lo que mejor te funcionó: tenlo en cuenta en partidos parecidos.`:`Mantén «${best[1].toLowerCase()}»: fue lo que mejor te funcionó.`);
 if(!T2.length)T2.push('Tu táctica apenas pesó: el partido lo decidieron los jugadores. Mira «Cómo ganarle» antes del próximo para buscar una ventaja.');
 return [...new Set(T2)].slice(0,4);
}
/** Resumen de una línea (para la bandeja). */
export function reportHeadline(R){
 const [my,op]=R.r,[xf,xa]=R.xg,res=my>op?'Ganamos':my<op?'Perdimos':'Empatamos';
 const best=R.f.filter(x=>x[2]-x[3]>.05).sort((a,b)=>(b[2]-b[3])-(a[2]-a[3]))[0],worst=R.f.filter(x=>x[2]-x[3]<-.05).sort((a,b)=>(a[2]-a[3])-(b[2]-b[3]))[0];
 const luck=my>op&&xf<xa-.5?' con algo de suerte':my<op&&xf>xa+.5?' mereciendo más':'';
 return `${res} ${my}-${op}${luck} (goles esperados ${dec(xf)} a ${dec(xa)}).${best?` Lo mejor: ${best[1].toLowerCase()}.`:''}${worst?` Lo peor: ${worst[1].toLowerCase()}.`:''}`;
}
/** El informe en pantalla. */
export function reportHTML(R){
 if(!R)return '<div class="empty">No hay informe táctico de este partido.</div>';
 const [my,op]=R.r,[xf,xa]=R.xg;
 const verdict=my>op?(xf>=xa?'Victoria merecida.':xf<xa-.5?'Victoria con suerte: el rival generó más.':'Victoria ajustada.'):my<op?(xf>xa+.5?'Derrota injusta: generaste más que el rival.':xf<xa-.5?'Derrota merecida: el rival fue mejor.':'Derrota ajustada.'):(Math.abs(xf-xa)<.4?'Empate justo.':xf>xa?'Empate que sabe a poco: generaste más.':'Empate que vale oro: el rival generó más.');
 const net=x=>x[2]-x[3];
 const row=x=>{const w=why(R,x[0]);return `<div class="trow ${net(x)>.03?'tpos':net(x)<-.03?'tneg':''}"><div class="tn"><b>${esc(x[1])}</b>${w?`<span class="small muted">${esc(w)}</span>`:''}</div><div class="tv"><span title="Goles esperados a favor">${fx(x[2])} a favor</span><span title="Goles esperados en contra">${fx(x[3])} en contra</span>${Math.abs(x[4])>=3?`<span class="small muted">${x[4]>0?'+':''}${x[4]}% cansancio</span>`:''}</div><div class="tb"><i style="width:${Math.min(100,Math.abs(net(x))*160)}%"></i></div></div>`;};
 const gl=(G)=>Object.entries(G).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${v} ${(GOALT[k]?GOALT[k].n:k).toLowerCase()}`).join(', ')||'ninguno';
 const tips=reportTips(R);
 return `<div class="trep">
 <p class="tverd"><b>${esc(verdict)}</b> <span class="muted">Goles esperados: ${xf.toFixed(2).replace('.',',')} – ${xa.toFixed(2).replace('.',',')}.</span></p>
 <h3>Qué aportó cada decisión</h3><p class="small muted" style="margin:0 0 6px">En goles esperados: cuánto te sumó en ataque y cuánto le dio al rival. ${R.live?'':'(Partido simulado: tu táctica durante todo el partido.)'}</p>
 ${R.f.length?R.f.map(row).join(''):'<p class="small muted">Táctica neutra: ningún factor pesó de verdad.</p>'}
 <h3>Los goles</h3><div class="kv"><span>Marcaste</span><b>${gl(R.gt.f)}</b><span>Encajaste</span><b>${gl(R.gt.a)}</b></div>
 ${R.ln?`<h3>Por dónde te atacaron</h3><div class="lanes trl"><span class="ln-t">Rival</span><span class="ln-c" style="--v:${R.ln.l}"><i></i><b>${R.ln.l}%</b><small>Tu izquierda</small></span><span class="ln-c" style="--v:${R.ln.c}"><i></i><b>${R.ln.c}%</b><small>Centro</small></span><span class="ln-c" style="--v:${R.ln.r}"><i></i><b>${R.ln.r}%</b><small>Tu derecha</small></span></div>`:''}
 ${R.ch.length?`<h3>Tus cambios en directo</h3>${R.ch.map(c=>{const g=(c.af[0]-c.be[0])-(c.af[1]-c.be[1]);return `<div class="trow ${g>.03?'tpos':g<-.03?'tneg':''}"><div class="tn"><b>${c.min}' · ${esc(c.d)}</b><span class="small muted">Ocasiones cada 10 min, antes → después: a favor ${dec(c.be[0])} → ${dec(c.af[0])}, en contra ${dec(c.be[1])} → ${dec(c.af[1])}</span></div><div class="tv"><span>${g>.03?'Funcionó':g<-.03?'Empeoró':'Sin efecto claro'}</span></div></div>`;}).join('')}`:''}
 ${tips.length?`<h3>Para el próximo partido</h3><ul class="ttips">${tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
 </div>`;
}
