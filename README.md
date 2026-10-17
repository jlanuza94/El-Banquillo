# El Banquillo

Juego de mánager de fútbol para el navegador y el móvil: 10 países, 43 ligas de 20 equipos, copas, competiciones continentales, Mundial de Clubes, mercado vivo, tácticas, cantera, finanzas y carrera de entrenador.

- **App instalable (PWA):** se instala en el móvil o el ordenador como una app y funciona sin conexión.
- **Simulación en segundo plano:** al simular varias jornadas, el cálculo va en un Web Worker y la pantalla no se bloquea.
- **Hasta 5 partidas guardadas** en el navegador (IndexedDB), más copia de seguridad en texto.

Además: bandeja de entrada con mensajes de la directiva, el cuerpo técnico, los ojeadores y la prensa; cuerpo técnico con atributos; ojeo con conocimiento de jugadores (rangos de atributos e informes); roles por posición; instrucciones al rival, córners, xG y consejos del segundo en el partido; liga sub-19; mercado con plazos, % de futura venta, intercambios, rumores y gangas de cierre; estadísticas, once ideal, premios de temporada (Balón de Oro…) y comparador de jugadores.

## Hood Cleaners: The Night Shift

Otro juego del repositorio, en una sola página (`hoods/juego.html`, 3D con three.js): comedia laboral sobre limpiar campanas extractoras de noche. Empiezas como el nuevo de Grasa Brava y subes de rango hasta dueño. Cada noche eliges la orden y el compañero, haces la preparación de seguridad (lo que te saltes se convierte en desastre), limpias filtros, campana y ducto con la rueda de herramientas (rasqueta, espuma, hidrolavadora, pulidor) y sobrevives a tuberías rotas, llaves perdidas, mapaches y gerentes que preguntan «¿ya casi?». `npm run build` lo deja en `dist/hoods/index.html` (en GitHub Pages, `/hoods/`).

## Cómo jugar

- **En claude.ai:** el enlace del artifact (todo funciona salvo instalarlo como app).
- **Como app instalable:** publícalo en GitHub Pages (ver abajo) y abre la dirección en el móvil. En Android sale el botón *Instalar como app* (en *Club y finanzas*) o el aviso del navegador; en iPhone, *Compartir → Añadir a pantalla de inicio*.
- **En tu ordenador:** `npm run build` y abre `dist/index.html`.

La partida se guarda sola. Desde *Club y finanzas → Copiar copia de seguridad* obtienes un código para llevarla a otro sitio (por ejemplo, de claude.ai a la app instalada).

## Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub y sube este proyecto.
2. En el repositorio: *Settings → Pages → Source: GitHub Actions*.
3. Cada vez que subas cambios a `main`, `.github/workflows/pages.yml` comprueba el código, pasa la prueba y publica `dist/` en `https://<tu-usuario>.github.io/<repositorio>/`.

## Desarrollo

Necesitas Node.js 20 o superior.

```
npm install       # una vez
npm run build     # compila en dist/
npm run dev       # recompila al guardar
npm test          # juega una temporada entera sin navegador y comprueba guardado y partidas
npm run check     # comprueba los tipos (TypeScript)
npm run bench     # 10.000 partidos y varias carreras: goles, tarjetas, lesiones, despidos…
```

Todo el azar usa un generador con semilla (`seedRng` en `src/core.ts`) que se guarda con la partida: con la misma partida y las mismas decisiones, los resultados son los mismos. No uses `Math.random` en el código del juego.

`node dist-test/test.cjs 3` (después de `npm test`) juega tres temporadas.

## Estructura

```
src/
  main.ts             arranque de la pantalla
  worker.ts           Web Worker: simula jornadas sin bloquear la pantalla
  pwa.ts              app instalable (service worker y botón de instalar)
  types.ts            modelo de datos (jugador, club, liga, partido, mensajes del worker)
  core.ts             constantes y utilidades (aleatorios, dinero, escapes)
  data.ts             datos fijos: nombres, países, formaciones, posiciones, tácticas, rasgos
  state.ts            estado de la partida (S, setS) y accesos rápidos
  players.ts          generación de jugadores, atributos, valor y desarrollo
  world.ts            creación del mundo, objetivos, calendario y elección de club
  tactics.ts          valoración por puesto, alineaciones, fuerza del equipo, clasificación
  engine.ts           motor de partido (minuto a minuto y rápido), charlas, penaltis, notas
  competitions.ts     copas, Mundial de Clubes, competiciones continentales
  season.ts           jornadas, simulación (simLoop/simRun), pretemporada, cambio de temporada
  market.ts           ventanas, fichajes, ofertas, negociación, ventas
  contracts.ts        contratos, renovaciones, cesiones y opciones de compra
  club.ts             estadio, entradas, patrocinio, directiva, prensa, logros
  squad.ts            felicidad, vestuario, agentes, cláusulas, entrenamiento
  career.ts           carrera del entrenador
  academy.ts          cantera y ojeadores
  persist.ts          guardado en IndexedDB (5 partidas), copia de seguridad y migraciones
  inbox.ts            bandeja de entrada (mensajes, categorías, botones de acción)
  staff.ts            cuerpo técnico: segundo, entrenadores, fisios, director deportivo
  scouting.ts         conocimiento de jugadores, rangos de atributos, informes de ojeo
  roles.ts            roles por posición (lateral ofensivo, falso nueve…)
  youth.ts            liga sub-19
  market2.ts          plazos, % de futura venta, intercambios, rumores, gangas de cierre
  awards.ts           premios de temporada, once ideal, Balón de Oro
  difficulty.ts       niveles de dificultad y paciencia de la directiva
  analysis.ts         estadísticas por jugador, informes de partido, forma de los equipos
  plans.ts            tácticas guardadas A/B/C, aprendizaje táctico, jugadas ensayadas
  mentor.ts           tutelaje entre veteranos y jóvenes
  connected.ts        agentes, contactos del director deportivo, cesiones con objetivo, vestuario
  living.ts           entrenadores rivales, despidos, fichajes bomba, historia de clubes
  clubplus.ts         filial, afiliados, límite salarial, préstamos bancarios
  mods.ts             editor e importación/exportación JSON y CSV
  quick.ts            modo rápido y búsqueda global
  events.ts           clics, formularios y teclado
  match2d.ts          animación del partido en 2D
  boot.ts             carga de una partida (y migración de partidas antiguas)
  views/              pantallas (una por zona del juego); se pintan con morphdom
  css/                estilos (base, juego, menús y vista 2D)
public/               index.html, manifest, service worker e iconos
tests/                prueba automática (jsdom + IndexedDB en memoria)
tools/build.mjs       compilación con esbuild
tools/icons.mjs       genera los iconos PNG desde public/icons/icon.svg
```

Los módulos que vienen de la versión anterior llevan `// @ts-nocheck`: funcionan igual, pero TypeScript aún no los comprueba. El código nuevo debe usar los tipos de `src/types.ts`, y los módulos viejos se irán tipando poco a poco (quitando esa línea y corrigiendo lo que marque `npm run check`).

## Cómo añadir algo nuevo

1. Pon la lógica en el módulo de su zona (algo del mercado en `src/market.ts`) y la pantalla en `src/views/`. Importa lo que uses: cada archivo es un módulo.
2. El estado de la partida es `S` (importado de `./state`). Para sustituirlo entero usa `setS()`.
3. Lo que se ejecuta durante una simulación corre también dentro del Web Worker: ahí no hay `document` ni `window`. No toques la pantalla desde la lógica; deja eso para `views/` y `events.ts`.
4. Si guardas datos nuevos en los jugadores, añade el campo a `PF` en `src/persist.ts`. Si cambias el formato de partidas ya guardadas, añade la migración en `boot()` (`src/boot.ts`) y compruébala en la prueba «una partida antigua se actualiza al cargarla».
5. Para avisar al jugador de algo, usa `news(texto, tipo, {cat, subj, act})`: sale en Inicio y en la bandeja de entrada, con botones si pasas `act`.
6. Ejecuta `npm test` y `npm run check`. No debe salir ningún `FALLO`.
