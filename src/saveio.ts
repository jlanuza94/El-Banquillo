/* El Banquillo · saveio.ts — Nombre del archivo de partida para pasarla a otro dispositivo. */
// @ts-nocheck — usa el estado heredado S.
import {S,T,seasonLabel} from './state';
import {plain} from './core';
export const saveName=()=>`El-Banquillo-${plain(T(S.user).name).replace(/[^A-Za-z0-9]+/g,'-')}-${seasonLabel().replace('/','-')}-J${S.week+1}.ebsave`;
