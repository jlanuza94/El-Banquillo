/* El Banquillo · help.ts — Ayuda rápida de cada pantalla (botón «?»): qué es, lo más útil y el capítulo de la guía. */
export const HELP:Record<string,{c:number,t:string,l:string[]}>={
 inicio:{c:4,t:'Tu escritorio.',l:['Arriba, de un vistazo: próximo partido, liga, forma, enfermería, mercado y bandeja.','«Pendiente» te avisa de lo que espera una decisión: patrocinador, contratos que acaban, reuniones.','El botón amarillo «Continuar» avanza un día; ⏩ simula hasta el próximo partido o más.']},
 buzon:{c:4,t:'Todo lo que pasa te llega aquí.',l:['Toca un mensaje para abrirlo al lado; muchos traen botones para actuar ya.','Filtra por secciones: directiva, plantilla, mercado, prensa…','Tras cada partido, tu segundo te deja el informe táctico.']},
 plantilla:{c:5,t:'Tus jugadores.',l:['Toca un jugador para ver su ficha; toca una cabecera para ordenar.','Profundidad te dice dónde te falta calidad; Planificación, cómo queda la plantilla el año que viene.','La alineación se hace en Tácticas.']},
 tacticas:{c:6,t:'La táctica es el corazón del juego.',l:['Alineación: arrastra jugadores al campo o toca un hueco y luego un jugador.','Táctica y Posiciones: instrucciones de equipo, roles, cometidos e instrucciones por puesto.','Tácticas guardadas: A, B y C, sistemas famosos y planes previstos según el marcador.','Rival: sus puntos débiles con un botón para aplicar cada consejo.']},
 entreno:{c:9,t:'La semana de entrenamiento.',l:['Cada día tiene su sesión; usa una semana tipo o ajústala a mano.','Mucha carga con partidos seguidos cansa y lesiona.','Si no quieres llevarlo, «Que lo decida mi segundo».']},
 cantera:{c:10,t:'Cantera, ojeo y joyas.',l:['Cada verano llegan juveniles: súbelos o déjalos crecer.','Los ojeadores te dan a conocer jugadores de su región y encuentran joyas 💎.','La liga sub-19 da minutos a tus mejores canteranos.']},
 staff:{c:9,t:'Tu cuerpo técnico.',l:['Segundo (1), entrenadores (3), fisioterapeutas (2), director de cantera (1) y director deportivo (1).','Cuanto mejores, más rápido mejoran los jugadores y menos se lesionan.','Arriba puedes delegar entrenamiento, ojeo y el once de cada partido.']},
 calendario:{c:3,t:'El calendario real de tu país.',l:['Partidos con rival y resultado, el día de hoy marcado y las fechas de mercado sombreadas.','La liga se juega en fin de semana; copa y competiciones continentales, entre semana.']},
 liga:{c:15,t:'Clasificaciones de cualquier liga del mundo.',l:['Cambia de país y división arriba.','Las zonas de color marcan título, ascenso y descenso. Un −10 junto a los puntos es una sanción por quiebra.']},
 copas:{c:15,t:'Copas y competiciones internacionales.',l:['Copa nacional a partido único (con su nombre real), competición continental y Mundial de Clubes.']},
 selecciones:{c:14,t:'Selecciones nacionales.',l:['Ranking mundial, torneos de verano y tus internacionales.','Con reputación, una federación puede ofrecerte ser seleccionador.']},
 analisis:{c:8,t:'Los números de tu equipo.',l:['Temporada: puesto, puntos, goles esperados y cómo marcas y cómo encajas.','Partidos: el informe de cada uno, con mapa de tiros e informe táctico.','Jugadores: quién rinde y quién no.']},
 premios:{c:15,t:'Estadísticas y premios.',l:['Balón de Oro, goleadores, once ideal y palmarés de todas las ligas.']},
 mercado:{c:11,t:'Fichajes y ventas.',l:['Las ofertas tardan 1-2 días en responderse; otro club puede pujar por el mismo jugador.','Marca a tus jugadores como transferibles, cedibles o intocables.','«Más filtros» abre la búsqueda avanzada; la ☆ sigue a un jugador.','El último día de mercado se vive por horas.']},
 club:{c:13,t:'El club y sus cuentas.',l:['Ingresos, gastos, presupuestos, estadio, afición e instalaciones.','Peticiones a la directiva y el proyecto a varios años.','Ojo con la deuda: una muy grande lleva al concurso de acreedores (−10 puntos).']},
 historia:{c:16,t:'Tu carrera y la historia del mundo.',l:['Palmarés, récords, campeones, goleadores históricos, retos con medallas y logros.']},
 editor:{c:17,t:'Editor y mods.',l:['Cambia nombres, colores, escudos y jugadores; exporta e importa mods en JSON o CSV.']},
};
export function helpHTML(v:string){
 const H=HELP[v];if(!H)return '';
 return `<div class="eyebrow">Ayuda</div><h2 style="margin:4px 0 8px">${H.t}</h2><ul class="ttips">${H.l.map((x:string)=>`<li>${x}</li>`).join('')}</ul><p class="small muted" style="margin:10px 0 0">Más en la guía del juego, capítulo ${H.c}.</p>`;
}
