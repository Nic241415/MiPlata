---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["css/styles.css","js/app.js"]
---

## Scope

Toda la app Mi Plata (index.html, css/styles.css, js/app.js): shell, ocho vistas, hojas de formulario, login, migración y una nueva pantalla de bienvenida que aparece cada vez que se abre la app. Modo: Operate (la bienvenida es una puerta tranquila, no una landing).

## Audience and task

Cualquier persona que lleva sus finanzas a mano en celular o computador. Tarea: saber cuánto tiene, registrar un gasto en un toque, revisar movimientos, metas y pagos. Restricciones: HTML/CSS/JS puro, español, formato colombiano, tema claro y oscuro (oscuro en grises carbón), verde = ingresos, rojo = gastos, sin sombras ni burbujas. El usuario pidió una paleta sobria: grises, negros, blancos y azules oscuros.

## Direction contract

THESIS: La app es una libreta de ahorros: cada movimiento es una línea impresa con fecha, concepto, valor y el saldo que quedó. Rechaza el tablero de tarjetas redondeadas con acento brillante de la categoría.

OWN-WORLD: Fondo carbón (#121418) con superficies grafito, azul de libreta (#2F4A7A / #9DB8E8) para la barra lateral, selección y gráficos; en claro, papel gris-blanco con tinta azul marino. Red Hat Display para cifras grandes y títulos, Red Hat Text para lectura, Red Hat Mono para fechas y valores en columnas. Esquinas casi rectas, líneas de 1px, sin sombras.

STORY: La persona entra por una bienvenida tranquila con el dólar de hoy impreso como una línea de libreta, toca Entrar, ve su patrimonio y sus últimos movimientos como libreta, y registra un gasto con el botón +.

FIRST VIEWPORT: Barra (inferior en móvil, lateral azul en escritorio) con la sección actual marcada en azul; arriba la marca y la moneda base; patrimonio neto en Display grande con el cambio del mes; debajo la página de libreta "Últimos movimientos" con cabecera FECHA · CONCEPTO · VALOR y borde superior azul de 3px; botón + fijo abajo a la derecha.

FORM: Libreta de ahorros, tercera de mis candidatas conservadoras (ronda safer, elegida por el usuario). seed:cd10e0ad5e1eb5d4. Gesto propio: columnas de libreta con saldo corrido al filtrar por cuenta.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

En la bienvenida las tres cotizaciones se imprimen línea por línea, como cuando la libreta pasa por la impresora del banco.
