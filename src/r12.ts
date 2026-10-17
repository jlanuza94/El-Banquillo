/* El Banquillo · r12.ts — Ronda de claridad y calidad de vida: avisos antes de errores caros, decisiones con prioridad,
 * acciones en bloque, carga y riesgo de lesión, coste y beneficio de cada instrucción, las 3 claves del partido,
 * rivales que se adaptan y clubes de la IA que planifican su plantilla. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,esc,money,r3} from './core';
import {GRP,ROLES,SPN,TACS} from './data';
import {LG,PL,S,T,available,squad,uLg} from './state';
import {leaders,lineupIssues} from './tactics';
import {injRisk} from './medical';
import {activeProms} from './talks';
import {wageBill,wageRoom} from './clubplus';
import {maxExtra,renState,makeRenew} from './contracts';
import {setDev,learnablePos,learnableTr} from './devplus';
import {tcPreset,pLoad,setPLoad} from './tcenter';
import {dayOfEvent,syncDay} from './calendar';
import {userRefFor} from './competitions';
import {news} from './world';
import {inPre} from './preseason';
import {preList} from './presched';

/* ---------- 1. Avisos antes de errores caros ---------- */
const gkOk=p=>p&&p.pos==='POR'&&!p.loan&&available(p);
/** Avisos al vender o ceder a un jugador. */
export function sellWarns(p){
 const W=[],sq=squad(S.user).filter(x=>!x.loan&&x.id!==p.id);
 const L=leaders(3).map(x=>x[0].id);if(L.includes(p.id))W.push(`Es uno de los líderes del vestuario: ${L.length>1?'el resto':'el grupo'} lo notará y bajará el ánimo de su grupo.`);
 if(p.pos==='POR'&&sq.filter(gkOk).length<2)W.push(`Te quedarías con ${sq.filter(gkOk).length} portero${sq.filter(gkOk).length===1?'':'s'} disponible${sq.filter(gkOk).length===1?'':'s'}: necesitas al menos dos.`);
 const g=GRP[p.sp]||p.pos,same=sq.filter(x=>(GRP[x.sp]||x.pos)===g).sort((a,b)=>b.ovr-a.ovr);
 if(!same.length||p.ovr>=same[0].ovr+4)W.push(`Es tu mejor ${g==='DEF'?'defensa':g==='MED'?'centrocampista':g==='DEL'?'delantero':'portero'} con diferencia (el siguiente: ${same[0]?same[0].ovr:'nadie'}).`);
 if(T(S.user).lineup.includes(p.id)&&(p.role==='cl'))W.push('Le prometiste ser jugador clave: los demás verán que vendes a tus pilares.');
 if(sq.length<18)W.push(`Te quedarías con ${sq.length} jugadores: con menos de 16 no podrás completar convocatorias.`);
 return W;
}
export const warnBox=W=>W.length?`<div class="warnbox r12w"><b>⚠️ Antes de decidir</b><ul>${W.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:'';
/** Avisos del día de partido: titulares cansados o con riesgo alto y banquillo sin portero. */
export function preMatchWarns(){
 const t=T(S.user),W=[],xi=t.lineup.map(PL).filter(Boolean);
 const tired=xi.filter(p=>(p.energy??100)<62),risky=xi.filter(p=>injRisk(p).lv==='alto');
 if(tired.length)W.push(`${tired.length} titular${tired.length>1?'es':''} muy cansado${tired.length>1?'s':''}: ${tired.slice(0,3).map(p=>`${p.name} (${Math.round(p.energy)}%)`).join(', ')}.`);
 if(risky.length)W.push(`Riesgo alto de lesión: ${risky.slice(0,3).map(p=>p.name).join(', ')}.`);
 const benchGK=squad(S.user).filter(p=>gkOk(p)&&!t.lineup.includes(p.id)).length;if(!benchGK)W.push('No tienes portero suplente disponible: si se lesiona el tuyo, jugará uno de campo.');
 return W;
}

/* ---------- 3. Decisiones con prioridad ---------- */
const PRI={3:{n:'Urgente',c:'p3'},2:{n:'Importante',c:'p2'},1:{n:'Cuando puedas',c:'p1'}};
/** Todo lo que pide una decisión tuya, ordenado por prioridad. */
export function decisions(){
 const D=[],add=(p,ico,t,a,v,extra)=>D.push(Object.assign({p,ico,t,a,v:v||''},extra||{})),sq=squad(S.user).filter(p=>!p.loan),t=T(S.user);
 if(lineupIssues().length)add(3,'⚠️','Completa tu once: hay huecos o jugadores no disponibles','view','tacticas');
 const gks=sq.filter(gkOk).length;if(gks<2)add(gks?2:3,'🧤',gks?'Solo tienes un portero disponible: ficha o sube uno de la cantera':'¡No tienes portero disponible!','view','mercado');
 const inc=Object.values(S.offers||{}).filter(o=>o.incoming).length;if(inc)add(3,'💰',`${inc} oferta${inc>1?'s':''} por tus jugadores (caducan al jugar)`,'view','mercado');
 if(S.meet)add(3,'🗣️','Un jugador quiere hablar contigo','meet');
 if(S.wageCap!=null&&wageBill()>S.wageCap+1e-9)add(3,'💸',`Te pasas del límite salarial en ${money(wageBill()-S.wageCap)}/sem`,'view','club');
 const L=leaders(3).map(x=>x[0]).filter(p=>(p.hap??70)<45);if(L.length)add(3,'👑',`${L.map(p=>p.name).join(', ')} (líder${L.length>1?'es':''}) está${L.length>1?'n':''} descontento${L.length>1?'s':''}: contagia al vestuario`,'view','tacticas');
 const exp=sq.filter(p=>p.contract<=1);if(exp.length){const late=S.week>=Math.round((S.cal?S.cal.filter(e=>e.t==='lg').length:38)*.6);add(late?3:2,'📝',`${exp.length} contrato${exp.length>1?'s':''} acaba${exp.length>1?'n':''} en junio${late?': se irán libres':''}`,'pl-f','end',{bulk:'bulk-renew'});}
 const pr=activeProms().filter(x=>x.left<=3);if(pr.length)add(2,'🤝',`Promesas a punto de vencer: ${pr.map(x=>x.p.name).slice(0,3).join(', ')}`,'view','plantilla');
 const xi=t.lineup.map(PL).filter(Boolean),tired=xi.filter(p=>(p.energy??100)<65).length,risky=sq.filter(p=>!p.inj&&injRisk(p).lv==='alto').length;
 if(tired>=2||risky)add(2,'🔋',`${tired?`${tired} titulares cansados`:''}${tired&&risky?' · ':''}${risky?`${risky} con riesgo alto de lesión`:''}`,'view','entreno',{bulk:'fit-adjust'});
 const sad=sq.filter(p=>(p.hap??70)<40&&!L.includes(p)).length;if(sad)add(2,'😠',`${sad} jugador${sad>1?'es':''} descontento${sad>1?'s':''}`,'pl-f','all');
 if(S.spOffers&&S.spOffers.length&&!S.sponsor)add(2,'🤝','Elige patrocinador','view','club');
 if(!S.proj&&S.projOpts)add(1,'🎯','Pacta un proyecto con la directiva','view','club');
 const noPlan=sq.filter(p=>p.age<=23&&!(p.dev&&(p.dev.pos||p.dev.tr))).length;if(noPlan>=2)add(1,'📈',`${noPlan} jóvenes sin plan individual de desarrollo`,'view','entreno',{bulk:'auto-dev'});
 const extra=sq.length-26;if(extra>0)add(1,'🧹',`Sobran ${extra} jugador${extra>1?'es':''}: pon a la venta a quien no juega`,'pl-f','ro',{bulk:'bulk-list'});
 return D.sort((a,b)=>b.p-a.p);
}
const BULK={'bulk-renew':'Renovar a todos','fit-adjust':'Ajustar la semana','auto-dev':'Plan automático','bulk-list':'Poner en venta'};
/** Panel de decisiones (Inicio). */
export function decisionsHTML(){
 const D=decisions();if(!D.length)return '';
 return `<section class="panel decp"><div class="panel-h"><h2>Decisiones</h2><span class="eyebrow">${D.filter(x=>x.p===3).length} urgente${D.filter(x=>x.p===3).length===1?'':'s'} · ordenadas por prioridad</span></div>
 ${D.map(d=>`<div class="dec ${PRI[d.p].c}"><i title="${PRI[d.p].n}"></i><span class="dico">${d.ico}</span><button class="dect" data-a="${d.a==='pl-f'?'dec-pl':d.a}" data-v="${d.v}">${esc(d.t)}</button>${d.bulk?`<button class="btn sm" data-a="${d.bulk}">${BULK[d.bulk]}</button>`:''}</div>`).join('')}</section>`;
}
export const decisionChips=()=>decisions().slice(0,6).map(d=>`<button class="task ${PRI[d.p].c}" data-a="${d.a==='pl-f'?'dec-pl':d.a}" data-v="${d.v}">${d.ico} ${esc(d.t.length>46?d.t.slice(0,44)+'…':d.t)}</button>`);

/* ---------- 3b. Acciones en bloque ---------- */
/** Renueva a todos los que acaban contrato pagando lo que piden (dos temporadas más si su edad lo permite). */
export function bulkRenew(){
 const ok=[],ko=[];
 squad(S.user).filter(p=>!p.loan&&p.contract<=1).forEach(p=>{
  if(p.req||(p.hap??70)<35){ko.push(`${p.name} (descontento)`);return;}
  const st=renState(p.id);if(st.closed){ko.push(`${p.name} (no quiere renovar)`);return;}
  const n=Math.min(p.contract+2,maxExtra(p)+1);if(!(n>p.contract)){ko.push(`${p.name} (por edad no firma más)`);return;}
  const w=r3(st.demand*1.01);if(S.wageCap!=null&&w>wageRoom()+p.wage+1e-9){ko.push(`${p.name} (no cabe en el límite salarial: pide ${money(w)}/sem)`);return;}
  makeRenew(p.id,w,n);if(!S.ren[p.id]&&p.contract===n)ok.push(`${p.name} ${money(w)}/sem`);else ko.push(`${p.name} (${(S.ren[p.id]&&S.ren[p.id].msg)||'no acepta'})`);});
 S.modal=null;
 const msg=`${ok.length?`Renuevan ${ok.length}: ${ok.join(' · ')}.`:'Nadie renueva.'}${ko.length?` Sin renovar: ${ko.join(' · ')}.`:''}`;
 news(msg,ok.length?'good':'',{cat:'pla',subj:`Renovaciones en bloque: ${ok.length} de ${ok.length+ko.length}`});return {ok,ko,msg};
}
/** Pone en venta a los que sobran: no juegan, no son jóvenes con futuro y hay tres mejores en su línea. */
export function bulkList(){
 const t=T(S.user),sq=squad(S.user).filter(p=>!p.loan),used=new Set([...t.lineup,...(t.subs||[])]),out=[];
 sq.filter(p=>!used.has(p.id)&&p.ts!=='no'&&!(p.age<=21&&p.pot*10-p.ovr>=8)).forEach(p=>{const g=GRP[p.sp]||p.pos,better=sq.filter(x=>x!==p&&(GRP[x.sp]||x.pos)===g&&x.ovr>p.ovr).length;if(better>=(g==='POR'?2:3)&&p.ts!=='list'){p.ts='list';out.push(p.name);}});
 return out;
}
const ADJ={LD:'MD',LI:'MI',DFC:'MCD',MCD:'DFC',MC:'MCO',MCO:'MC',MD:'ED',MI:'EI',ED:'DC',EI:'DC',DC:'MCO'};
const TRP={POR:['par'],DFC:['mur','cab'],LD:['vel','pas'],LI:['vel','pas'],MCD:['mur','pas'],MC:['pas','lej'],MCO:['pas','lej'],MD:['reg','vel'],MI:['reg','vel'],ED:['reg','vel'],EI:['reg','vel'],DC:['gol','cab']};
/** Plan individual automático: los jóvenes aprenden un puesto cercano; el resto, un rasgo de su puesto. Y carga según riesgo. */
export function autoDev(){
 const n={pos:0,tr:0,load:0};
 squad(S.user).filter(p=>!p.loan).forEach(p=>{
  if(!(p.dev&&(p.dev.pos||p.dev.tr))&&p.age<=27){const ap=ADJ[p.sp];
   if(p.age<=21&&ap&&learnablePos(p).includes(ap)){setDev(p.id,'pos',ap);n.pos++;}
   else{const tr=(TRP[p.sp]||[]).find(k=>learnableTr(p).includes(k));if(tr){setDev(p.id,'tr',tr);n.tr++;}}}
  const r=injRisk(p).lv;if(!p.inj&&r==='alto'&&pLoad(p)!=='low'&&pLoad(p)!=='rest'){setPLoad(p.id,'low');n.load++;}});
 return n;
}

/* ---------- 4. Carga y lesiones ---------- */
/** Partidos tuyos en los próximos 7 días. */
export function matchesNext7(){syncDay();let n=0;if(inPre())n+=preList().filter(x=>!x.st&&x.d>=S.day&&x.d<=S.day+7).length;for(let i=S.ci;i<(S.cal||[]).length;i++){const d=dayOfEvent(i);if(d>S.day+7)break;if(userRefFor(S.cal[i]))n++;}return n;}
/** Ajusta la semana al calendario y a la plantilla: suave si hay dos partidos o el equipo está fundido, intensa si no hay partido. */
export function fitAdjust(){
 const n=matchesNext7(),xi=T(S.user).lineup.map(PL).filter(Boolean),en=xi.reduce((a,p)=>a+(p.energy??100),0)/Math.max(1,xi.length);
 const k=n>=2||en<70?'suave':n===0&&en>=85?'intensa':'normal';tcPreset(k);
 let low=0,rest=0;squad(S.user).filter(p=>!p.loan&&!p.inj).forEach(p=>{const r=injRisk(p);if(r.r>=60&&pLoad(p)!=='rest'){setPLoad(p.id,'rest');rest++;}else if(r.lv==='alto'&&pLoad(p)==='nor'){setPLoad(p.id,'low');low++;}else if(r.lv==='bajo'&&(pLoad(p)==='low'||pLoad(p)==='rest')&&(p.energy??100)>=90){setPLoad(p.id,'nor');}});
 return `${n} partido${n===1?'':'s'} en 7 días y energía media del once ${Math.round(en)}%: semana ${k==='suave'?'suave':k==='intensa'?'intensa':'normal'}${low||rest?` · ${low?`${low} con carga baja`:''}${low&&rest?' y ':''}${rest?`${rest} en descanso`:''}`:''}.`;
}
/** Semáforo de carga: cada jugador con su energía, su riesgo y su carga, para cambiarla sin salir de la pantalla. */
export function loadLightsHTML(){
 const sq=squad(S.user).filter(p=>!p.loan&&!p.inj).map(p=>[p,injRisk(p)]).sort((a,b)=>b[1].r-a[1].r),n=matchesNext7();
 const col=r=>r.lv==='alto'?'red':r.lv==='medio'?'amb':'grn',cnt=k=>sq.filter(x=>col(x[1])===k).length;
 return `<section class="panel"><div class="panel-h"><h2>Semáforo de carga</h2><span class="eyebrow">${n} partido${n===1?'':'s'} en los próximos 7 días</span></div>
 <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:8px"><span class="lgt red">● ${cnt('red')} riesgo alto</span><span class="lgt amb">● ${cnt('amb')} medio</span><span class="lgt grn">● ${cnt('grn')} bien</span><button class="btn sm primary" data-a="fit-adjust" style="margin-left:auto">Ajustar la semana al calendario</button></div>
 <div class="lights">${sq.slice(0,14).map(([p,r])=>`<div class="lrow"><i class="ld ${col(r)}" title="Riesgo ${r.r}/100${r.why.length?': '+esc(r.why.join(', ')):''}"></i><button class="linkname" data-a="ficha" data-id="${p.id}">${esc(p.name)}</button><span class="small muted">${p.sp} · ${Math.round(p.energy??100)}%</span><span class="seg lseg">${[['rest','Desc.'],['low','Baja'],['nor','Normal'],['alta','Alta']].map(([k,l])=>`<button data-a="tc-load" data-id="${p.id}" data-v="${k}" aria-pressed="${pLoad(p)===k}">${l}</button>`).join('')}</span></div>`).join('')}</div>
 <p class="small muted" style="margin:6px 0 0">Rojo: lesión probable si sigue con carga normal (motivos al pasar el dedo). Con dos partidos en la semana, la semana suave y la carga baja de los cansados evitan casi todas las lesiones.</p></section>`;
}

/* ---------- 2. Coste y beneficio de cada instrucción ---------- */
export const TRADE={
 pre:{baj:[['menos cansancio','bloque compacto'],['el rival juega cómodo','robas lejos']],alt:[['robas arriba','el rival crea menos'],['más cansancio','espacio a la espalda']]},
 lin:{baj:[['sólido atrás','te cuesta menos la contra'],['creas menos','el rival se instala cerca']],alt:[['equipo junto y arriba','más ocasiones'],['contragolpes a la espalda','sufre con defensas lentos']]},
 rit:{len:[['controlas el partido','menos cansancio'],['menos ocasiones']],rap:[['más ocasiones'],['más cansancio','más ocasiones del rival']]},
 anc:{est:[['juego por dentro','mejor si tus medios son buenos'],['laterales y extremos menos útiles']],anc:[['aprovecha bandas y centros'],['huecos por dentro']]},
 est:{pos:[['castiga la presión baja','menos pérdidas'],['sufre contra presión alta']],dir:[['ideal con delanteros fuertes','salta la presión'],['pierdes más balones']],con:[['mortal contra líneas altas'],['poca posesión','necesita delanteros rápidos']]},
 per:{cpr:[['robas cerca del área rival'],['cansa','te expone a la contra']],rep:[['muy sólido'],['atacas con menos gente']]},
 rec:{cont:[['goles a la contra','castiga a rivales volcados'],['pierdes el balón antes']],pau:[['te ordenas','menos pérdidas'],['menos contras']]},
 ent:{pru:[['casi sin tarjetas'],['el rival progresa fácil']],dur:[['más robos','el rival crea menos'],['más tarjetas y penaltis']]},
 off:{si:[['deja al rival en fuera de juego'],['con defensas lentos, mano a mano']]},
 tie:{si:[['enfría el partido (si ganas)'],['atacas menos','tarjetas por perder tiempo']]},
 mar:{hom:[['apaga a rivales lentos y a su estrella'],['los rápidos te ganan la espalda','cansa más']]},
 cru:{imp:[['menos centros del rival'],['algo más de hueco por dentro']],dej:[['proteges el centro'],['muchos centros: necesitas centrales altos']]},
 dir:{den:[['cierras las bandas'],['tráfico en el centro']],fue:[['lleva al rival a la banda'],['más centros en contra']]}};
export function tradeHTML(k,v){const x=(TRADE[k]||{})[v];if(!x){const alt=Object.entries(TRADE[k]||{});return alt.length?`<div class="tcost alt">${alt.map(([o,y])=>`<span><b>${esc(TACS[k].o[o])}:</b> <span class="pro">+ ${esc(y[0][0])}</span> <span class="con">− ${esc(y[1][0])}</span></span>`).join('')}</div>`:'';}return `<div class="tcost">${x[0].map(s=>`<span class="pro">+ ${esc(s)}</span>`).join('')}${x[1].map(s=>`<span class="con">− ${esc(s)}</span>`).join('')}</div>`;}

/* ---------- 2b. Las 3 claves del partido ---------- */
const dec=x=>x.toFixed(2).replace('.',',');
/** Tres frases: si mereciste el resultado, lo que más te ayudó y lo que más te costó (con qué cambiar). */
export function keys3(R,tips){
 if(!R)return [];const K=[],[my,op]=R.r,[xf,xa]=R.xg;
 if(my>op)K.push(xf>=xa?`Victoria merecida: generaste ${dec(xf)} goles esperados por ${dec(xa)} del rival.`:`Ganaste sufriendo: el rival generó más (${dec(xa)} a ${dec(xf)}). La pegada o tu portero lo salvaron.`);
 else if(my<op)K.push(xf>xa+.3?`Mereciste más: ${dec(xf)} goles esperados por ${dec(xa)}. Faltó puntería, no idea.`:`El rival fue mejor: ${dec(xa)} goles esperados por ${dec(xf)} tuyos.`);
 else K.push(Math.abs(xf-xa)<.4?`Empate justo: ${dec(xf)} a ${dec(xa)} en goles esperados.`:`Empate ${xf>xa?'que sabe a poco':'que vale oro'}: ${dec(xf)} a ${dec(xa)} en goles esperados.`);
 const net=x=>x[2]-x[3],best=R.f.filter(x=>net(x)>.04).sort((a,b)=>net(b)-net(a))[0],worst=R.f.filter(x=>net(x)<-.04).sort((a,b)=>net(a)-net(b))[0];
 if(best)K.push(`Lo que más te ayudó: ${best[1].toLowerCase()} (${net(best)>0?'+':''}${dec(net(best))} de diferencia en goles esperados).`);
 if(worst)K.push(`Lo que más te costó: ${worst[1].toLowerCase()} (${dec(net(worst))}).${tips&&tips[0]?' '+tips[0]:''}`);
 else if(tips&&tips[0])K.push(tips[0]);
 return K.slice(0,3);
}
export const keysHTML=K=>K.length?`<div class="keys3"><div class="eyebrow">Las 3 claves del partido</div>${K.map((k,i)=>`<div class="k3"><b>${i+1}</b><span>${esc(k)}</span></div>`).join('')}</div>`:'';

/* ---------- 6. El rival se adapta ---------- */
/** Estilo que más usas (últimos 8 partidos): si es muy repetido, los rivales lo conocen. */
export function noteStyle(tac){if(!tac)return;S.uSty=(S.uSty||[]).concat([tac.est||'equ']).slice(-8);}
export function knownStyle(){const a=S.uSty||[];if(a.length<6)return null;const c={};a.forEach(k=>c[k]=(c[k]||0)+1);const [k,n]=Object.entries(c).sort((x,y)=>y[1]-x[1])[0];return n>=6&&k!=='equ'?k:null;}
/** Descanso y expulsiones: el entrenador rival revisa el partido; y hace cambios tácticos (no solo por cansancio). */
export function aiAdapt(m,s,addEv,live,doSub,bench){
 if(!m.us||s===m.us)return;const o=s==='h'?'a':'h',d=m.score[s]-m.score[o];m.aia=m.aia||{};
 const say=t=>{if(live)addEv(m,'sys',null,t);};
 // descanso: si le estás pasando por encima, se protege; si él domina sin marcar, arriesga
 if(m.min>=46&&!m.aia.ht){m.aia.ht=1;const xs=(m.st[s].xg||0),xo=(m.st[o].xg||0);
  if(xo>xs+.7&&d<=0){m.ment[s]=d<0?'bal':'def';m.tac[s]=Object.assign({},m.tac[s],{lin:'baj',pre:'baj',ent:'dur'});say(`Descanso: el rival se ha visto superado y sale más cerrado: línea baja y entradas duras.`);}
  else if(xs>xo+.5&&d<=0){m.ment[s]='att';m.tac[s]=Object.assign({},m.tac[s],{pre:'alt',rit:'rap'});say(`Descanso: el rival cree que lo merece y sale a presionar arriba y a ritmo alto.`);}}
 // expulsiones
 const reds=x=>(m.off||[]).filter(id=>PL(id)&&PL(id).team===m[x]).length,rd=reds(s)-reds(o);
 if(rd!==(m.aia.rd||0)){m.aia.rd=rd;if(rd>0){m.ment[s]='def';m.tac[s]=Object.assign({},m.tac[s],{lin:'baj',rit:'len'});say('Con uno menos, el rival se encierra: línea baja y a perder tiempo.');}else if(rd<0){m.ment[s]='att';m.tac[s]=Object.assign({},m.tac[s],{anc:'anc',rit:'rap'});say('Con uno más, el rival abre el campo y acelera.');}}
 // cambio táctico: si pierde desde el 60, mete un delantero por un defensa o medio; si gana desde el 78, al revés
 if(m.subs[s]>=4||m.aia.sub)return;
 const swap=(gOut,gIn,txt)=>{const sl=m.lu[s].map((id,i)=>({id,i})).filter(x=>x.id&&x.i>0&&(GRP[PL(x.id).sp]||PL(x.id).pos)===gOut).sort((a,b)=>(m.en[a.id]??100)-(m.en[b.id]??100))[0];
  const b=bench(m,s).filter(p=>(GRP[p.sp]||p.pos)===gIn).sort((x,y)=>y.ovr-x.ovr)[0];if(!sl||!b)return;const out=PL(sl.id);doSub(m,s,sl.id,b.id);m.aia.sub=1;say(txt(b,out));};
 if(d<0&&m.min>=60)swap(rnd2(m)?'DEF':'MED','DEL',(b,out)=>`El rival va a por el partido: entra ${b.name} (delantero) por ${out.name}.`);
 else if(d>0&&m.min>=78)swap('DEL','DEF',(b,out)=>`El rival amarra el resultado: entra ${b.name} (defensa) por ${out.name}.`);
}
const rnd2=m=>(m.min+m.score.h*7+m.score.a*3)%2===0;

/* ---------- 7. La IA planifica su plantilla ---------- */
/** ¿Qué línea necesita relevo? La que tiene a sus titulares por encima de 30 años y nadie joven detrás. */
export function successionNeed(tid,TARGET,grp){
 const sq=squad(tid);let best=null,bs=0;
 Object.keys(TARGET).forEach(g=>{const v=sq.filter(p=>grp(p)===g).sort((a,b)=>b.ovr-a.ovr),k=g==='POR'?1:g==='DEL'?2:3,top=v.slice(0,k);if(top.length<k)return;
  const old=top.filter(p=>p.age>=31).length,young=v.filter(p=>p.age<=23&&p.ovr>=top[top.length-1].ovr-6).length;const sc=old/k-young*.5;if(sc>=.5&&sc>bs){bs=sc;best=g;}});
 return best;
}

/* ---------- 5. Contratos: masa salarial a 1-2 temporadas y qué le falta a la oferta ---------- */
/** wK: sueldo propuesto en miles €/sem; bK: prima en miles €; roleOk: el estado ofrecido es el que espera. */
export function wageProjHTML(p,mode,wK,bK,roleOk,D){
 const w=(wK||0)/1000,old=mode==='renew'?p.wage:0,sq=squad(S.user).filter(x=>!x.loan&&x.id!==p.id),bill=wageBill(),cap=S.wageCap;
 const now=bill-old+w,end1=sq.filter(x=>x.contract<=1).reduce((a,x)=>a+x.wage,0),end2=sq.filter(x=>x.contract===2).reduce((a,x)=>a+x.wage,0);
 const y1=now-end1,y2=y1-end2,cls=v=>cap!=null&&v>cap+1e-9?'bad':'';
 const need=D-(w+(bK||0)/1000/40),miss=need>1e-6?need:0;
 const tip=miss?`Le faltan unos <b>${money(miss)}/sem</b> de sueldo${(bK||0)<miss*1000*40?` (o una prima de unos ${money(miss*40)})`:''}${roleOk?'':', y espera un estado mejor en la plantilla'}.`:roleOk?'Lo que ofreces cubre lo que pide: debería aceptar.':'El sueldo llega, pero espera un estado mejor en la plantilla: puede pedir más.';
 return `<div class="ctproj"><span><span class="eyebrow">Masa salarial con esta oferta</span> <b class="${cls(now)}">${money(now)}/sem</b>${cap!=null?` <small>de ${money(cap)}</small>`:''}</span><span><span class="eyebrow">Próxima temporada</span> <b class="${cls(y1)}">${money(y1)}</b> <small>si no renuevas a los ${sq.filter(x=>x.contract<=1).length} que acaban</small></span><span><span class="eyebrow">Dentro de 2</span> <b class="${cls(y2)}">${money(y2)}</b></span></div><p class="small ctmiss">${tip}</p>`;
}
