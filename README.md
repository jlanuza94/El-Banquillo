# El Banquillo

Juego de mánager de fútbol para el navegador: 10 países, 43 ligas de 20 equipos, copas, competiciones continentales, Mundial de Clubes, mercado vivo, tácticas, cantera, finanzas y carrera de entrenador.

No necesita instalar nada ni compilar: es HTML, CSS y JavaScript normales.

## Cómo jugar

- **Publicado:** el enlace del artifact en claude.ai.
- **En tu ordenador:** abre `index.html` en el navegador.
- **En un solo archivo:** ejecuta `python3 tools/build.py` y abre `dist/el-banquillo.html`. Es útil como respaldo o para pasarlo a otro dispositivo.

La partida se guarda sola en el navegador (IndexedDB). Desde *Club y finanzas → Copiar copia de seguridad* obtienes un código para recuperarla en otro sitio.

## Estructura

```
index.html            página principal: carga los estilos y los scripts en orden
css/
  base.css            colores (modo claro y oscuro), tipografía y componentes básicos
  game.css            notas 1-10, fichas de jugador, mercado y ventanas emergentes
  layout.css          menú lateral, barra inferior del móvil, simulación y vista 2D
js/
  core.js             constantes y utilidades (aleatorios, dinero, escapes)
  data.js             datos fijos: nombres, países, formaciones, posiciones, tácticas, rasgos
  state.js            estado global de la partida (S) y accesos rápidos
  players.js          generación de jugadores, atributos, valor y desarrollo
  world.js            creación del mundo, objetivos, calendario y elección de club
  tactics.js          valoración por puesto, alineaciones, fuerza del equipo, clasificación
  engine.js           motor de partido (minuto a minuto y rápido), charlas, penaltis, notas
  competitions.js     calendario, copas, Mundial de Clubes, competiciones continentales
  season.js           jornadas, simulación múltiple, pretemporada, cambio de temporada
  market.js           ventanas, fichajes entre clubes, ofertas, negociación, ventas
  contracts.js        contratos, renovaciones, cesiones y opciones de compra
  club.js             estadio, entradas, patrocinio, directiva, prensa, logros
  squad.js            felicidad, vestuario, agentes, cláusulas, entrenamiento
  career.js           carrera del entrenador: contrato, confianza, despidos, ofertas
  academy.js          cantera y ojeadores
  persist.js          guardado, carga, copia de seguridad y migraciones
  views/              pantallas (una por zona del juego)
  events.js           clics, formularios y teclado
  match2d.js          animación del partido en 2D
  boot.js             arranque
tools/
  load-order.json     orden de carga de los scripts (el mismo que en index.html)
  test.js             prueba automática: juega una temporada entera sin navegador
  build.py            junta todo en dist/el-banquillo.html
```

Los scripts no son módulos: comparten el ámbito global y se cargan en el orden de `tools/load-order.json`. El estado de la partida vive en la variable `S`.

## Cómo añadir algo nuevo

1. Pon la lógica en el archivo de su zona (por ejemplo, algo del mercado en `js/market.js`) y la pantalla en `js/views/`.
2. Si creas un archivo nuevo, añádelo **en los dos sitios**: una etiqueta `<script>` en `index.html` y su nombre en `tools/load-order.json`, en el mismo orden.
3. Si guardas datos nuevos en los jugadores, añade el campo a `PF` en `js/persist.js`. Si cambias el formato de partidas ya guardadas, añade la migración en `boot()` (`js/boot.js`) para no romper las partidas existentes.
4. Ejecuta la prueba: `node tools/test.js` (o `node tools/test.js 3` para tres temporadas). Debe terminar sin ningún `FALLO`.

## Comprobaciones

```
node tools/test.js        # una temporada completa, todas las pantallas, guardado y copia de seguridad
python3 tools/build.py    # genera dist/el-banquillo.html
```
