---
name: MP
description: Finanzas personales en formas redondas, minimalistas y sobrias, con tema claro y oscuro.
colors:
  fondo-claro: "#F3F4F6"
  superficie-clara: "#FFFFFF"
  superficie-clara-2: "#ECEEF1"
  superficie-clara-3: "#E2E5EA"
  tinta: "#111318"
  tinta-suave: "#5F6672"
  linea-clara: "#E3E6EA"
  azul-noche: "#1F3A6B"
  azul-niebla: "#E2E9F5"
  fondo-oscuro: "#0D0E10"
  superficie-oscura: "#17181B"
  superficie-oscura-2: "#202226"
  superficie-oscura-3: "#2A2D32"
  tinta-clara: "#EDEEF0"
  tinta-clara-suave: "#9BA0A9"
  azul-cielo: "#8FB0EA"
  azul-cielo-texto: "#9DBAEE"
  ingreso-claro: "#0B7A4B"
  gasto-claro: "#C42A20"
  ingreso-oscuro: "#4CC38A"
  gasto-oscuro: "#F07167"
  aviso-claro: "#8A5300"
  aviso-oscuro: "#E0B04A"
typography:
  display:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 11vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  small:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  caption:
    fontFamily: "Manrope, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  sm: "12px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "22px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.azul-noche}"
    textColor: "{colors.superficie-clara}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.superficie-clara-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  input:
    backgroundColor: "{colors.fondo-claro}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.superficie-clara}"
    rounded: "{rounded.xl}"
    padding: "22px"
  nav-active:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.superficie-clara}"
    rounded: "{rounded.pill}"
  quick-action:
    backgroundColor: "{colors.superficie-clara-2}"
    rounded: "{rounded.pill}"
    size: "56px"
---

# Design System: MP

## Overview

**Creative North Star: "Todo en círculos"**

MP es tranquila, redonda y minimalista. Cada cosa que se toca es un círculo o una píldora: el logo "MP", los accesos rápidos, los íconos de cuentas y movimientos, el botón +, la navegación y los botones. Las tarjetas tienen esquinas muy suaves (28px) y la página respira, con mucho espacio y pocas líneas.

La paleta es sobria, en grises, negro, blanco y un azul oscuro, y tiene tema claro y oscuro (por defecto sigue al sistema). El color de estado aparece solo cuando significa algo: verde para ingresos, rojo para gastos y ámbar para avisos. No hay sombras; la profundidad viene de los escalones de gris entre el fondo y las superficies.

**Key Characteristics:**
- Logo "MP" en Bodoni Moda cursiva 800 (monograma de moda): sin fondo en la barra y en el login; dentro de un círculo de tinta en la bienvenida.
- Navegación: barra principal con solo Inicio, Movimientos y Cuentas. En computador, el resto (Análisis, Inversiones, Mercado, Ahorro, Pagos, Ajustes) va en una barra lateral; en celular, en "Más".
- Inicio mínimo: saldo grande y centrado, tres botones (Ingreso, Gasto, Transferencia) y la franja de cuentas. Los gráficos y resúmenes viven en Análisis.
- Botones de registrar (Inicio y Movimientos): ingreso con círculo azul, gasto con círculo blanco y transferencia con círculo gris (pedido del dueño).
- Al cambiar de tema, el nuevo se abre en un círculo que crece desde el botón (View Transitions; sin animación si se pide menos movimiento).
- Cuentas en una franja de tarjetas redondas que se desliza de lado.
- Metas con anillo de progreso circular.
- Una sola letra (Manrope) con números tabulares.

## Colors

Grises fríos y un solo azul. Verde, rojo y ámbar se usan solo para estados.

### Primary
- **Azul noche** (#1F3A6B): botón primario, botón + y gráficos en tema claro.
- **Azul cielo** (#8FB0EA / texto #9DBAEE): lo mismo en tema oscuro, con tinta oscura encima.
- **Azul niebla** (#E2E9F5): fondo de los íconos de transferencias y del menú "Más" en claro.

### Neutral
- **Tinta** (#111318) y **tinta suave** (#5F6672): texto en claro. La tinta también rellena el logo y la sección activa.
- **Fondo claro** (#F3F4F6), **superficies** (#FFFFFF, #ECEEF1, #E2E5EA): tres escalones para tarjetas, controles y estados hover.
- **Fondo oscuro** (#0D0E10), **superficies oscuras** (#17181B, #202226, #2A2D32), **tinta clara** (#EDEEF0 / #9BA0A9): el tema oscuro.

### Named Rules
**The Color-Con-Significado Rule.** Verde solo para ingresos y ganancias, rojo solo para gastos y pérdidas, ámbar solo para avisos. Siempre llevan un fondo suave del mismo tono cuando son círculos o píldoras.

**The Paleta-Sobria Rule.** Fuera de los estados, solo grises, negro, blanco y azul oscuro. Los colores de cuenta se eligen entre azules y grises y se mezclan con la tinta del tema para que se lean en claro y en oscuro.

## Typography

**Display Font:** Manrope (con Segoe UI, system-ui)
**Body Font:** Manrope

**Character:** Una sola familia geométrica y amable. La jerarquía sale del peso (800 para cifras y títulos) y del tamaño, no de cambiar de letra. Todos los números son tabulares.

### Hierarchy
- **Display** (800, clamp(2.5rem, 11vw, 4rem), 1.02, -0.04em): el patrimonio en Inicio.
- **Headline** (800, 1.9rem): título de cada sección.
- **Title** (800, 1.1rem): títulos de tarjetas y hojas.
- **Body** (400, 15px, 1.5): texto general; las cifras de las filas van en 800.
- **Small / Caption** (600, 13px / 12px): etiquetas, detalles grises y la barra inferior.

## Layout

Móvil primero: una columna con márgenes de 16px, la barra de navegación flotando en píldora a 12px del borde inferior y el botón + circular de 60px encima, a la derecha. Desde 900px, una barra superior fija con el logo, la navegación en píldora centrada y, a la derecha, la moneda y el tema; el contenido llega hasta 1120px. Los bloques se separan 18px y las tarjetas tienen 22px de relleno. Los totales del mes son una lista en móvil y tres columnas desde 700px.

## Elevation & Depth

Sin sombras. La profundidad se logra con tres escalones de superficie sobre el fondo; las hojas se abren sobre un velo oscuro (rgb(8 9 12 / .55)).

### Named Rules
**The Plano-Y-Redondo Rule.** Nada proyecta sombra. Si algo necesita destacar, cambia de tono o se rellena de tinta.

## Shapes

Todo lo que se toca es redondo: botones, navegación, selectores, chips y la moneda base son píldoras (999px), y los íconos, accesos rápidos, logo, colores y el botón + son círculos. Las tarjetas tienen 28px de radio (32px el saldo), las tarjetas de cuenta y metas 22px y los campos de formulario 16px. Las hojas de formulario suben desde abajo con esquinas de 28px y una manija en píldora.

## Components

### Buttons
- **Shape:** píldora (999px); alto de 44px (34px en pequeño, 56px en grande).
- **Primary:** azul noche con texto blanco (en oscuro, azul cielo con tinta oscura).
- **Secondary:** superficie 2 sin borde; hover pasa a superficie 3. **Ghost:** transparente. **Danger:** texto rojo sobre fondo rojo suave.
- **Press:** se encoge a 97%.

### Navigation
- **Escritorio:** píldora blanca o grafito con las secciones en texto; la activa va rellena de tinta.
- **Móvil:** barra flotante en píldora con ícono y texto; la pestaña activa es una píldora de tinta.

### Cards / Containers
- **Corner Style:** 28px (tarjetas), 22px (cuentas, metas y avisos).
- **Background:** superficie sobre el fondo; dentro de una tarjeta, superficie 2.
- **Internal Padding:** 22px.

### Inputs / Fields
- **Style:** fondo gris (superficie 2 dentro de hojas), sin borde, radio de 16px, 48px de alto.
- **Focus:** borde de 1,5px en azul.

### Accesos rápidos y filas
Los botones de Inicio son los mismos de Movimientos (píldora con ícono en círculo), en el orden Ingreso, Gasto, Transferencia: círculo azul, blanco y gris. Sin cuentas, el saldo es 0 y los botones llevan a crear una.

### Análisis
Cuatro cifras clave (patrimonio y su cambio en el mes, ahorro y tasa de ahorro, gasto promedio por día, meses que alcanza el dinero), el resumen del mes, la evolución del patrimonio, ingresos y gastos de 6 meses, gastos por categoría en barras, una lista de "Lo que te conviene saber" y los gráficos por divisa y por tipo de cuenta. Las filas de movimientos llevan un ícono en círculo de 44px (verde para ingreso, rojo para gasto, azul para transferencia) y se agrupan por día ("Hoy", "Ayer", fecha).

### Movimientos
Sigue el boceto del dueño, sin cambiar el orden: arriba, tres botones en píldora (+ Ingreso, − Gasto, ⇄ Transferencia) con el total del mes debajo de cada uno (ingresos, gastos y número de movimientos). En celular cada botón es un bloque redondo con el ícono encima. Después, el buscador en píldora con lupa y, debajo, el botón "Filtros" (muestra cuántos hay puestos) que despliega Desde, Hasta, Cuenta, Categoría, Tipo, Monto (desde–hasta, en la moneda base) y "Limpiar filtros". La lista muestra 15 movimientos y "Cargar más" suma 25.

### Subgrupos
Cuelgan debajo de su cuenta en Cuentas, con una línea gris a la izquierda y una fila final "Libre" en gris. En Ahorro van primero (luego Presupuesto y Metas), con el ícono de alcancía en el color de la cuenta.

### Inversiones y Mercado
Precios en dólares. Cada activo trae su gráfico con periodos en píldora; la ganancia ya realizada va al final como una fila de movimiento dentro de una píldora gris. Mercado tiene "Elegir qué ver" y "Actualizar precios", y una sección de Futuros (S&P 500 y Nasdaq 100).

### Anillo de meta
Un círculo SVG de 64px con trazo de 6px y extremos redondeados, el porcentaje en el centro, y verde al completarse.

### Bienvenida
Logo "MP" en Bodoni cursiva dentro de un círculo de 140px que aparece creciendo suavemente, la frase "Tu dinero, simple." y el botón "Entrar" en píldora, que suben uno tras otro. Sin cotizaciones. Aparece cada vez que se abre la app.

## Do's and Don'ts

### Do:
- **Do** usar círculos o píldoras para todo lo que se toca.
- **Do** mantener verde/rojo solo para ingreso/gasto, con su fondo suave cuando son círculos.
- **Do** cambiar los dos bloques del tema oscuro en styles.css a la vez.

### Don't:
- **Don't** usar sombras.
- **Don't** agregar colores fuera de grises, negro, blanco y azul oscuro (pedido del dueño).
- **Don't** poner etiquetas pequeñas en mayúsculas encima de los títulos.
