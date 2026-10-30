---
name: Mi Plata
description: Finanzas personales como una libreta de ahorros, en carbón y azul de libreta.
colors:
  carbon: "#121418"
  grafito: "#1A1D23"
  grafito-claro: "#23272F"
  tinta-clara: "#E8EBEF"
  gris-nota: "#99A2AF"
  linea-carbon: "#2B3039"
  azul-libreta: "#2F4A7A"
  azul-papel: "#9DB8E8"
  azul-marino: "#1E3560"
  barra-marino: "#15233F"
  papel-gris: "#EEF0F3"
  papel: "#FFFFFF"
  tinta-marina: "#121A28"
  gris-tinta: "#586273"
  linea-papel: "#D8DCE3"
  ingreso-oscuro: "#4CC38A"
  gasto-oscuro: "#F07167"
  ingreso-claro: "#0B7A4B"
  gasto-claro: "#C42A20"
  aviso-oscuro: "#E0B04A"
  aviso-claro: "#8A5300"
typography:
  display:
    fontFamily: "Red Hat Display, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 10vw, 3.7rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Red Hat Display, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Red Hat Display, Segoe UI, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Red Hat Text, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Red Hat Text, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Red Hat Text, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  figure:
    fontFamily: "Red Hat Mono, ui-monospace, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Red Hat Mono, ui-monospace, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "18px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.azul-libreta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.grafito}"
    textColor: "{colors.tinta-clara}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
    height: "40px"
  input:
    backgroundColor: "#15181D"
    textColor: "{colors.tinta-clara}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
    height: "42px"
  nav-rail:
    backgroundColor: "#0D0F12"
    textColor: "#8D96A3"
    width: "232px"
  nav-item-active:
    backgroundColor: "#1E2738"
    textColor: "{colors.tinta-clara}"
    rounded: "{rounded.sm}"
  ledger:
    backgroundColor: "{colors.grafito}"
    textColor: "{colors.tinta-clara}"
    rounded: "{rounded.none}"
---

# Design System: Mi Plata

## Overview

**Creative North Star: "La libreta de ahorros"**

Mi Plata se ve como la libreta que el banco imprimía línea por línea: fecha, concepto, valor y saldo, en columnas exactas. La interfaz es sobria (carbón, grafito, blanco y azules oscuros) y deja que las cifras hablen: grandes cuando importan (el patrimonio) y alineadas en columnas cuando se comparan (movimientos, tablas, metas).

Es plana: no hay sombras ni burbujas. La profundidad se logra con escalones de gris y con una regla azul de 3px que marca cada "página" de libreta. El tema oscuro (carbón) es el predeterminado; el claro es papel gris-blanco con tinta azul marino y una barra lateral azul marino.

El color no decora: verde y rojo solo significan ingreso y gasto, ámbar solo significa "cerca del límite" o "aviso", y el azul marca dónde estás y lo que puedes tocar.

**Key Characteristics:**
- Cifras en Red Hat Mono, alineadas a la derecha, en columnas.
- Patrimonio en Red Hat Display 800, enorme y apretado.
- Páginas de libreta con regla superior azul de 3px y esquinas rectas.
- Barra de navegación con color propio (carbón profundo o azul marino).
- Esquinas casi rectas (3–4px), líneas de 1px, sin sombras.

## Colors

Grises carbón y papel con una sola familia azul; los colores de estado aparecen solo cuando significan algo.

### Primary
- **Azul de libreta** (#2F4A7A): relleno de botones primarios y del botón + en oscuro; regla superior de las páginas de libreta y de las hojas; serie del gráfico en claro.
- **Azul papel** (#9DB8E8): en oscuro, texto activo, enlaces, foco, línea del gráfico de patrimonio; marca de la sección actual en la barra (ambos temas).
- **Azul marino** (#1E3560): botones primarios y texto activo en el tema claro.
- **Barra marino** (#15233F): fondo de la barra lateral e inferior en el tema claro.

### Neutral
- **Carbón** (#121418): fondo de la app en oscuro.
- **Grafito** (#1A1D23) y **grafito claro** (#23272F): superficies y hover en oscuro.
- **Tinta clara** (#E8EBEF) y **gris nota** (#99A2AF): texto principal y secundario en oscuro.
- **Línea carbón** (#2B3039): divisores de 1px en oscuro.
- **Papel gris** (#EEF0F3), **papel** (#FFFFFF), **tinta marina** (#121A28), **gris tinta** (#586273), **línea papel** (#D8DCE3): equivalentes del tema claro.

### Named Rules
**The Verde-Es-Ingreso Rule.** Verde (#4CC38A / #0B7A4B) y rojo (#F07167 / #C42A20) solo marcan ingresos, ganancias, gastos y pérdidas. Nunca como decoración, nunca como color de marca.

**The Azul-Es-Dónde-Estás Rule.** El azul claro de libreta (#9DB8E8) señala la sección actual, el foco y lo seleccionado. Si todo es azul, nada lo es.

**The Paleta-Sobria Rule.** Las cuentas solo eligen entre azules y grises (8 muestras). Colores del diseño anterior se traducen a su equivalente sobrio al mostrarse.

## Typography

**Display Font:** Red Hat Display (con Segoe UI, system-ui)
**Body Font:** Red Hat Text (con Segoe UI, system-ui)
**Label/Mono Font:** Red Hat Mono (con ui-monospace, Consolas)

**Character:** Una sola familia en tres voces: Display para la cifra que importa, Text para leer, Mono para todo lo que se compara en columna. La mono es por los datos, no por estética técnica.

### Hierarchy
- **Display** (800, clamp(2.4rem, 10vw, 3.7rem), 1): patrimonio neto y valores principales. En la bienvenida, la marca sube a clamp(3.4rem, 17vw, 5.6rem).
- **Headline** (800, 1.75rem, 1.15): título de cada sección (Movimientos, Plan de ahorro…).
- **Title** (700, 1.12rem): títulos de bloques y hojas.
- **Body** (400, 15px, 1.45): texto general; secundarios a 13px en gris.
- **Figure** (Mono 500, 14px, -0.02em): montos en filas, tablas, saldos, valores de metas.
- **Label** (Mono 600, 11px, 0.08em, mayúsculas): solo cabeceras de columna de libreta y tablas (FECHA · CONCEPTO · VALOR · SALDO).

### Named Rules
**The Cifra-En-Columna Rule.** Todo monto que se compara con otro va en Red Hat Mono y alineado a la derecha.

## Layout

Móvil primero: una columna con márgenes de 16px, barra inferior fija de 5 pestañas y botón + cuadrado (56px) abajo a la derecha. Desde 900px, barra lateral fija de 232px a toda altura y contenido de hasta 1120px con márgenes de 40px. Los bloques se separan 16px; dentro de un bloque el relleno es 18px. Las páginas de libreta pasan de 3 columnas (fecha, concepto, valor con saldo debajo) en móvil a 4 columnas desde 700px.

## Elevation & Depth

Sin sombras. La profundidad se hace con tres escalones tonales (fondo, superficie, superficie 2) y con la regla azul de 3px que corona páginas de libreta, hojas de formulario y la caja de inicio de sesión. Las hojas se abren sobre un velo oscuro (rgb(6 8 12 / .62)).

### Named Rules
**The Plano-Siempre Rule.** Ningún elemento proyecta sombra; si algo necesita destacarse, cambia de tono o lleva la regla azul.

## Shapes

Esquinas casi rectas: 3px en botones, campos y elementos de navegación; 4px en listas agrupadas (Más) y avisos sueltos. Todo bloque con la regla azul superior (bloques de contenido, libreta, hojas, caja de login) tiene esquinas rectas (0px). Líneas de 1px para dividir filas. El botón + es cuadrado con esquinas de 4px.

## Components

### Buttons
- **Shape:** casi recto (3px), alto mínimo 40px (32px en pequeño, 52px en grande).
- **Primary:** azul de libreta (#2F4A7A en oscuro, #1E3560 en claro) con texto blanco; hover mezcla 14% de tinta.
- **Secondary:** superficie con borde de 1px de línea; hover pasa a superficie 2.
- **Ghost:** sin borde ni fondo; hover con superficie 2. **Danger:** texto rojo, borde rojo en hover.
- **Focus:** contorno de 2px azul papel con 2px de separación.

### Cards / Containers
- **Corner Style:** recto (0px), coronado por la regla azul de libreta de 3px; los estados vacíos sueltos usan la regla en color línea.
- **Background:** superficie (grafito / blanco) sobre el fondo.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Internal Padding:** 18px.

### Inputs / Fields
- **Style:** fondo de campo (#15181D oscuro / #F7F8FA claro), borde de 1px, 3px de radio, 42px de alto; montos en Mono.
- **Focus:** borde y anillo de 1px en azul papel/marino, sin brillo.

### Navigation
- **Escritorio:** barra lateral de color propio (carbón profundo #0D0F12 / azul marino #15233F) con la marca "Mi Plata" (Plata en azul papel). Ítem activo con fondo un tono más claro, texto blanco e ícono azul papel.
- **Móvil:** barra inferior del mismo color; la pestaña activa lleva una barra azul papel de 3px arriba.

### Libreta (componente propio)
Bloque con regla superior azul de 3px, cabecera en etiqueta mono (FECHA · CONCEPTO · VALOR · SALDO), filas con fecha mono corta ("24 oct"; si se repite queda invisible pero se lee con lector de pantalla), concepto en negrita con detalle gris, valor mono a la derecha en verde/rojo, y saldo corrido cuando se ve una sola cuenta. Separadores de mes en mono azul. Se usa en Inicio (últimos movimientos), Movimientos y la bienvenida (cotizaciones del día).

### Bienvenida
Pantalla completa sobre el fondo: marca enorme, una frase en gris, una libreta con el dólar, el euro y el bitcoin del día y el botón "Entrar". Las filas se "imprimen" de izquierda a derecha una tras otra (clip-path, 0,7s, curva cubic-bezier(.16, 1, .3, 1)); con movimiento reducido aparecen quietas.

## Do's and Don'ts

### Do:
- **Do** poner cada monto comparable en Red Hat Mono alineado a la derecha.
- **Do** coronar cada bloque de contenido, libreta, hoja y caja de acceso con la regla azul de 3px, con esquinas rectas.
- **Do** marcar los datos de ejemplo con texto ("Ejemplo · …" o la etiqueta EJEMPLO), nunca solo con color.
- **Do** mantener verde/rojo solo para ingreso/gasto y ámbar solo para avisos.
- **Do** cambiar los dos bloques del tema oscuro en styles.css a la vez.

### Don't:
- **Don't** usar sombras, burbujas ni esquinas de más de 4px (pedido del dueño: plano y minimalista).
- **Don't** agregar colores fuera de grises, negros, blancos y azules oscuros (pedido del dueño: paleta sobria).
- **Don't** poner etiquetas pequeñas en mayúsculas encima de títulos; las mayúsculas mono son solo para cabeceras de columna.
- **Don't** usar la mono para texto corrido; es solo para cifras, fechas y cabeceras.
