# Pruebas de Hood Cleaners

```
npm run test:hoods            # todas
npm run test:hoods -- jefe    # solo las que contienen «jefe» en el nombre
```

Necesitan Playwright con Chromium (`npm i -g playwright` o el que ya traiga el sistema). Construyen el juego con
`tools/build.mjs`, lo abren con una partida preparada y juegan noches por código. Cada prueba falla si el juego
lanza algún error de JavaScript.
