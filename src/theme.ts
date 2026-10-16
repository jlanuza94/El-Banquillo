/* El Banquillo · theme.ts — Tema de colores: automático (según el móvil), claro u oscuro. Se recuerda en este dispositivo. */
export type Theme='auto'|'light'|'dark';
const KEY='eb-theme';
export const THEMES:Record<Theme,string>={auto:'Automático',light:'Claro',dark:'Oscuro'};
export function getTheme():Theme{try{const v=localStorage.getItem(KEY);if(v==='light'||v==='dark')return v;}catch(e){}return 'auto';}
export function applyTheme(t:Theme=getTheme()){const r=document.documentElement;if(t==='auto')delete r.dataset.theme;else r.dataset.theme=t;}
/** Pasa al siguiente tema: automático → oscuro → claro → automático. */
export function cycleTheme():Theme{const order:Theme[]=['auto','dark','light'],t=order[(order.indexOf(getTheme())+1)%3];try{localStorage.setItem(KEY,t);}catch(e){}applyTheme(t);return t;}
const ICONS:Record<Theme,string>={
 auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
 dark:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
 light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'};
/** Botón redondo para cambiar el tema. */
export const themeBtn=(cls='')=>{const t=getTheme();return `<button class="thbtn ${cls}" data-a="theme" aria-label="Tema: ${THEMES[t]} (cambiar)" title="Tema: ${THEMES[t]}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t]}</svg></button>`;};

/* Accesibilidad: tamaño del texto y colores para daltónicos (se guarda en este dispositivo). */
const AKEY='eb-a11y';
export function getA11y():{fs:number,cb:number}{try{const v=JSON.parse(localStorage.getItem(AKEY)||'{}');return {fs:+v.fs||0,cb:+v.cb||0};}catch(e){return {fs:0,cb:0};}}
export function applyA11y(a=getA11y()){const r=document.documentElement;if(a.fs)r.dataset.fs=String(a.fs);else delete r.dataset.fs;if(a.cb)r.dataset.cb='1';else delete r.dataset.cb;}
export function setA11y(k:'fs'|'cb',v:number){const a=getA11y();a[k]=v;try{localStorage.setItem(AKEY,JSON.stringify(a));}catch(e){}applyA11y(a);}
