/**
 * Modelo de datos de El Banquillo.
 *
 * Los módulos heredados todavía no usan estos tipos (llevan `// @ts-nocheck`), pero describen
 * la forma real de los datos y son la referencia para el código nuevo. A medida que se pase cada
 * módulo a TypeScript estricto, se irán usando aquí.
 */

/** Grupo de posición: portero, defensa, centrocampista o delantero. */
export type Group = 'POR' | 'DEF' | 'MED' | 'DEL';
/** Posición exacta en el campo. */
export type Position = 'POR' | 'DFC' | 'LD' | 'LI' | 'MCD' | 'MC' | 'MCO' | 'MD' | 'MI' | 'ED' | 'EI' | 'DC';
export type AttributeKey = 'tir' | 'pas' | 'reg' | 'def' | 'fis' | 'por';
export type Attributes = Record<AttributeKey, number>;
export type Personality = 'nor' | 'pro' | 'lid' | 'tem' | 'amb' | 'lea' | 'tra';
export type Role = 'cl' | 'ti' | 'ro' | 'jo' | 'su';

/** Estadísticas de un jugador en la temporada (todas las competiciones). */
export interface SeasonStats {
  pj: number; mi: number; g: number; a: number;
  /** Suma de notas: la media es rs / pj. */
  rs: number;
  mv: number; yc: number; rc: number; cs: number;
}

export interface Player {
  id: string;
  name: string;
  /** Índice del país en COUNTRIES. */
  nat: number;
  pos: Group;
  sp: Position;
  alt: Position[];
  age: number;
  /** Atributos del 1 al 10. */
  at: Attributes;
  /** Media en escala 0-100 (se muestra dividida entre 10). */
  ovr: number;
  /** Potencial en escala 1-10. */
  pot: number;
  /** Id del club o null si es agente libre. */
  team: number | null;
  num: number;
  energy: number;
  form: number;
  hap: number;
  role?: Role;
  per: Personality;
  tr: string[];
  foot: 'D' | 'I' | 'A';
  wf: number;
  h: number;
  /** Temporadas de contrato que quedan, contando la actual. */
  contract: number;
  /** Sueldo semanal en millones de euros. */
  wage: number;
  /** Valor de mercado en millones de euros. */
  value: number;
  /** Cláusula de rescisión en millones de euros. */
  cl: number;
  loan: { from: number; opt?: number } | null;
  inj: number;
  injT?: string | 0;
  susp: number;
  st: SeasonStats;
  /** Carrera: [partidos, goles, asistencias]. */
  car: [number, number, number];
  /** Historial por temporada: [temporada, club, PJ, G, A, nota]. */
  hist: [string, string, number, number, number, number][];
  /** Evolución de la media: [temporada, media]. */
  ph?: [string, number][] | null;
}

export interface Team {
  id: number;
  name: string;
  short: string;
  c1: string;
  c2: string;
  rep: number;
  /** Id de la liga en la que juega. */
  lg: number;
  formation: string;
  ment: 'def' | 'bal' | 'att';
  lineup: (string | null)[];
  tac?: Record<string, string>;
}

export interface League { id: number; c: number; lv: number; rep: number }

export interface Fixture {
  h: number; a: number;
  hg: number | null; ag: number | null;
  played: boolean;
  pen?: [number, number] | null;
  w?: number | null;
  ev: { min: number; s: 'h' | 'a'; t: string; n: string }[];
}

/** Resumen de una partida guardada (pantalla «Tus partidas»). */
export interface SlotMeta {
  id: number; club: string; short: string; c1: string; c2: string;
  season: string; lg: string; week: number; updated: number;
}

/** Mensajes entre la pantalla y el Web Worker de simulación. */
export type WorkerRequest =
  | { cmd: 'sim'; state: string; mode: 'next' | '5' | 'win' | 'season'; stopOnNews: boolean }
  | { cmd: 'stop' };
export type WorkerResponse =
  | { type: 'progress'; n: number; txt: string }
  | { type: 'done'; state: string; res: unknown[]; stopReason: string }
  | { type: 'error'; msg: string };
