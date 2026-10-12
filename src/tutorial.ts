/* El Banquillo · tutorial.ts — Tutorial de 5 pasos la primera vez que juegas: una tarjeta flotante que te lleva por las pantallas clave. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from './core';
import {S,T} from './state';

const KEY='eb-tut';
export const TUT=[
 {v:'inicio',t:'Bienvenido al banquillo',d:o=>`Eres el nuevo entrenador de ${esc(T(S.user).name)}. La directiva te pide: <b>${esc(o)}</b>. Arriba ves el presupuesto, la posición y su <b>confianza</b> en ti: si cae mucho, te despiden. Todo lo importante te llega a la <b>bandeja de entrada</b>.`},
 {v:'plantilla',t:'1 · Tu once',d:()=>'Toca un hueco del campo y luego un jugador para colocarlo. Si tienes prisa, pulsa <b>«Alinear mejores»</b>. Bajo cada jugador ves su nota en ese puesto: fuera de su posición rinde menos.'},
 {v:'tacticas',t:'2 · Cómo juegas',d:()=>'Elige formación, mentalidad e instrucciones. Cuanto más uses una táctica, mejor la juega el equipo. Puedes guardar hasta 3 planes (A, B y C) y cambiarlos en pleno partido.'},
 {v:'mercado',t:'3 · Fichajes',d:()=>'El mercado está abierto hasta la jornada 5. Filtra por posición y precio, ordena por calidad-precio y mira los contratos que acaban: son más baratos. Si no conoces bien a un jugador, verás sus notas en rangos: pulsa «Ojear».'},
 {v:'inicio',t:'4 · A jugar',d:()=>'Pulsa <b>«Jugar»</b> para ver el partido en directo (puedes hablar al equipo, hacer cambios y ver repeticiones) o <b>«Simular»</b> para avanzar rápido. Recibe a los jugadores que piden reunión y cumple lo que prometas. ¡Suerte!'},
];
export function tutDone(){try{return localStorage.getItem(KEY)==='done';}catch(e){return false;}}
/** Al empezar una partida nueva: si en este dispositivo no se ha hecho, arranca el tutorial. */
export function tutStart(force){if(force||!tutDone()){S.tut=0;S.view=TUT[0].v;}}
export function tutGo(d){if(S.tut==null)return;const i=S.tut+d;if(i<0)return;if(i>=TUT.length)return tutEnd();S.tut=i;S.view=TUT[i].v;S.modal=null;}
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
