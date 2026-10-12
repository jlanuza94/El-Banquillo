/* El Banquillo · difficulty.ts — Niveles de dificultad y paciencia de la directiva. */
// @ts-nocheck — usa el estado heredado S.
import {S} from './state';

/**
 * win/draw/loss: cambio de confianza por resultado. pos: castigo máximo por ir por debajo del objetivo.
 * fire: confianza por debajo de la que te despiden. ai: fuerza de los rivales. price: precio de los fichajes.
 * budget: presupuesto inicial. grace: jornadas de margen al llegar a un club o tras un ascenso.
 */
export const DIFF={
 facil:{n:'Fácil',d:'Directiva paciente, rivales algo más flojos, fichajes más baratos y más presupuesto.',win:3,draw:.8,loss:-1.8,pos:1,fire:4,ai:.96,price:.9,budget:1.3,grace:14},
 normal:{n:'Normal',d:'La experiencia equilibrada.',win:3,draw:.5,loss:-2.4,pos:1.5,fire:8,ai:1,price:1,budget:1,grace:10},
 dificil:{n:'Difícil',d:'Directiva exigente, rivales más fuertes, fichajes más caros y menos presupuesto.',win:2.6,draw:.3,loss:-3,pos:2,fire:12,ai:1.04,price:1.1,budget:.8,grace:6},
};
export const diff=()=>DIFF[(S&&S.diff)||'normal'];
/** Al llegar a un club o tras ascender, la directiva te da unas jornadas de margen. */
export const inGrace=()=>S.mgr&&S.mgr.grace!=null&&S.week<S.mgr.grace;
