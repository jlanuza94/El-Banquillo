/* El Banquillo · tutorial.ts — Tutorial de 8 pasos la primera vez que juegas: una tarjeta flotante que te lleva por las pantallas clave. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from './core';
import {S,T} from './state';

const KEY='eb-tut';
export const TUT=[
 {v:'inicio',t:'Bienvenido al banquillo',d:o=>`Eres el nuevo entrenador de ${esc(T(S.user).name)}. La directiva te pide: <b>${esc(o)}</b>. Arriba ves el presupuesto, tu puesto y la <b>confianza</b> de la directiva: si cae mucho, te despiden. Esta pantalla de Inicio te resume todo lo pendiente.`},
 {v:'inicio',t:'1 · El botón Continuar',d:()=>'El juego avanza día a día con el botón amarillo <b>«Continuar»</b> de arriba a la derecha. Se para solo cuando hay algo que decidir: un partido, una oferta, un mensaje importante. El de al lado (⏩) avanza más rápido hasta tu siguiente partido.'},
 {v:'buzon',t:'2 · La bandeja de entrada',d:()=>'Aquí te llega todo: la directiva, tus jugadores, ofertas, lesiones, informes de ojeo. Muchos mensajes traen botones para responder al momento. Al tocar un mensaje se abre al lado, sin cambiar de pantalla.'},
 {v:'tacticas',vt:['tac','ali'],t:'3 · Tu once y cómo juegas',d:()=>'En Tácticas haces la alineación: arrastra jugadores al campo o toca un hueco y luego un jugador. Si tienes prisa, pulsa <b>«Alinear mejores»</b>. En las otras pestañas eliges formación, estilo, presión, roles por posición y jugadas ensayadas. Cuanto más uses una táctica, mejor la juega el equipo.'},
 {v:'entreno',vt:['ent','plan'],t:'4 · La semana de entrenamiento',d:()=>'Cada día de la semana tiene su sesión: física, técnica, táctica, descanso o preparar el partido. Usa una semana tipo (normal, intensa, suave…) o ajústala a mano. Cuidado: entrenar fuerte con partidos seguidos cansa y lesiona.'},
 {v:'mercado',t:'5 · Fichajes',d:()=>'Las ventanas de fichajes tienen fecha real según el país (verano e invierno) y el último día hay un <b>día de cierre</b> en directo. Haz ofertas: los clubes responden en 1-2 días. Usa «Más filtros» para buscar joyas, y ojea antes de pagar: si no conoces a un jugador, ves sus notas en rangos.'},
 {v:'club',t:'6 · Las cuentas',d:()=>'Vigila sueldos y presupuesto. Si gastas lo que no tienes, la directiva se enfada y, con una deuda muy grande, el club puede entrar en <b>concurso de acreedores</b>: 10 puntos menos y venta de tus estrellas. A los clubes de la IA también les pasa.'},
 {v:'inicio',t:'7 · ¡A jugar!',d:()=>'El día de partido elige <b>«Jugar el partido»</b> para verlo en directo: das la charla, cambias la táctica, haces cambios y decides penaltis y momentos clave. O <b>«Simular»</b> si tienes prisa. Recibe a los jugadores que piden reunión y cumple lo que prometas. ¡Suerte, míster!'},
];
export function tutDone(){try{return localStorage.getItem(KEY)==='done';}catch(e){return false;}}
/** Al empezar una partida nueva: si en este dispositivo no se ha hecho, arranca el tutorial. */
export function tutStart(force){if(force||!tutDone()){S.tut=0;S.view=TUT[0].v;}}
export function tutGo(d){if(S.tut==null)return;const i=S.tut+d;if(i<0)return;if(i>=TUT.length)return tutEnd();S.tut=i;S.view=TUT[i].v;S.modal=null;if(TUT[i].vt){S.vt=S.vt||{};S.vt[TUT[i].vt[0]]=TUT[i].vt[1];}}
export function tutEnd(){S.tut=null;try{localStorage.setItem(KEY,'done');}catch(e){}}
/** Tarjeta flotante del paso actual. */
export function tutCard(){
 if(S.tut==null||!TUT[S.tut])return '';const st=TUT[S.tut],n=TUT.length;
 return `<aside class="tutcard" role="dialog" aria-label="Tutorial"><div class="eyebrow">Tutorial · paso ${S.tut+1} de ${n}</div><h3>${esc(st.t)}</h3><p>${st.d(S.obj?S.obj.txt:'')}</p>
 <div class="tutdots">${TUT.map((_,i)=>`<i class="${i===S.tut?'on':''}"></i>`).join('')}</div>
 <div class="row"><button class="btn sm" data-a="tut-skip">Saltar</button><span class="spacer"></span>${S.tut>0?'<button class="btn sm" data-a="tut-prev">Anterior</button>':''}<button class="btn sm primary" data-a="tut-next">${S.tut===n-1?'¡Empezar!':'Siguiente'}</button></div></aside>`;
}
/** Sección del menú que el tutorial resalta. */
export const tutView=()=>S.tut!=null&&TUT[S.tut]?TUT[S.tut].v:null;
