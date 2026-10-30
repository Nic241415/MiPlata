# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cualquier persona hispanohablante (principalmente en Colombia) que quiere llevar sus finanzas personales a mano: cuentas en varias divisas, gastos del día a día, cripto y metas de ahorro. Abren la app en el celular o el computador, a menudo para registrar un gasto rápido o revisar cuánto tienen. Cada persona crea su propia cuenta con correo y contraseña (Supabase) o usa la app solo en su navegador.

## Product Purpose

Mi Plata reúne en un solo lugar el dinero de una persona: saldos de bancos, billeteras (Nequi, Wise), efectivo y cripto, convertidos a una moneda base (COP, USD o EUR). Registra movimientos, inversiones en cripto, metas de ahorro con plan mensual, presupuesto por categoría, pagos recurrentes y alertas de precio. Éxito: la persona sabe en segundos cuánto tiene, cuánto gastó este mes y qué pagos vienen.

## Positioning

Todo se escribe a mano: la app nunca pide ni guarda claves de bancos. Maneja pesos, dólares, euros y cripto juntos con cotizaciones en vivo (y de respaldo sin internet), con formato colombiano de números.

## Operating Context

- Pantallas: Inicio, Cuentas, Movimientos, Inversiones, Mercado, Ahorro, Pagos, Ajustes; en móvil barra inferior + "Más"; en escritorio barra lateral.
- Al abrir la app aparece siempre una pantalla de bienvenida breve (recibir con calma: nombre, una frase, botón para entrar); después login o directo a la app si hay sesión.
- Formularios en hojas (sheets) que suben desde abajo en móvil.
- Datos de ejemplo cargables para conocer la app.

## Capabilities and Constraints

- HTML + CSS + JavaScript puro, sin frameworks ni build; publicada en GitHub Pages tal cual.
- Interfaz 100 % en español; números con formato colombiano (1.234.567,89) vía fmt() y parseNum().
- index.html carga CSS/JS con "?t=Date.now()" para evitar caché; se mantiene.
- Tema claro y oscuro (automático, claro, oscuro); el oscuro en grises carbón.
- Verde = ingresos/ganancias; rojo = gastos/pérdidas.
- Interfaz de storage.js fija: init, loadAll, put, del, clearAll, signIn, signUp, signOut.
- Pendiente: recuperar contraseña olvidada no existe en la app.

## Brand Commitments

- Nombre: Mi Plata.
- Diseño plano y minimalista: sin burbujas ni sombras.
- Paleta sobria por preferencia del dueño: grises, negros, blancos y azules oscuros (verde y rojo solo para ingresos/gastos).
- Tono cercano, claro y en tuteo ("Toca", "Revisa tu correo").

## Evidence on Hand

- Datos de ejemplo generados en js/app.js (demoData), marcados como "ejemplo".
- Sin testimonios, cifras de usuarios ni logos de prensa: no inventarlos.

## Product Principles

1. Saber cuánto tengo, en segundos.
2. Registrar un gasto debe costar un toque.
3. Privacidad primero: nada de claves de bancos, datos solo del usuario.
4. Claro para cualquiera: lenguaje sencillo, sin jerga financiera.

## Accessibility & Inclusion

Uso en celular con una mano; contraste suficiente en ambos temas; respeta prefers-reduced-motion.
