# MP

(Antes se llamaba "Mi Plata".)

App personal para manejar tu dinero: cuentas en varias divisas (COP, USD, EUR y cripto), movimientos, inversiones, cotizaciones, metas de ahorro, presupuesto y pagos recurrentes.

Es una página web normal (HTML, CSS y JavaScript). No necesita instalar nada más.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página. Carga el estilo y el código. |
| `css/styles.css` | Colores, letras y diseño (tema claro y oscuro). |
| `js/app.js` | Toda la lógica: cálculos, pantallas y formularios. |
| `js/config.js` | Tus datos de conexión a Supabase (vacío = guardar en el navegador). |
| `js/storage.js` | **Dónde se guardan tus datos:** en la nube (Supabase) o en el navegador. |
| `supabase/schema.sql` | La tabla segura que se crea una vez en Supabase. |
| `data/market-*.json` | Cotizaciones incluidas, para cuando no hay internet. |
| `iniciar.bat` / `iniciar.ps1` | Abren la app en `http://localhost:5500`. |

## Cómo abrirla en tu computador

**Opción A, la más fácil:** haz doble clic en `iniciar.bat`. Se abre una ventana negra (no la cierres) y el navegador en `http://localhost:5500`.

**Opción B, desde Visual Studio Code:**
1. En VS Code: *Archivo → Abrir carpeta…* y elige `mi-plata`.
2. Abajo a la derecha te sugerirá instalar la extensión **Live Server**. Acepta. (O búscala en Extensiones: "Live Server", de Ritwick Dey.)
3. Abre `index.html` y toca **Go Live** en la barra de abajo. Se abre en `http://127.0.0.1:5500`.
4. Cada vez que guardes un cambio en el código, la página se recarga sola.

> No abras `index.html` con doble clic directamente (`file://`): algunas funciones, como las cotizaciones incluidas, no cargan así.

## Dónde quedan tus datos (hoy)

En el **almacenamiento del navegador** (localStorage) de ese computador:
- Si abres la app en otro navegador o en el celular, no verás los mismos datos.
- `localhost:5500` (iniciar.bat) y `127.0.0.1:5500` (Live Server) cuentan como sitios **distintos**: usa siempre el mismo.
- Si borras el historial y los datos de navegación, se borran también. **Exporta un respaldo** de vez en cuando (Ajustes → Exportar mis datos).

## Cotizaciones

Cuando hay internet, la app consulta APIs gratis y sin clave:
- **CoinGecko**: precios de cripto e historial.
- **open.er-api.com**: tasas de cambio de hoy.
- **currency-api** (jsDelivr): tasas de días anteriores para completar los gráficos.

Cada consulta se guarda, así que el historial crece solo. Si no hay internet, puedes escribir las tasas a mano en *Mercado → Ingresar tasas a mano*.

---

## Más adelante: publicarla en internet

Hay sitios gratis que publican páginas como esta:

1. **Netlify Drop** (lo más simple): entra a https://app.netlify.com/drop, crea una cuenta gratis y arrastra la carpeta `mi-plata`. Te da un enlace tipo `https://algo.netlify.app`.
2. **GitHub Pages / Vercel**: primero subes el código a GitHub (instala Git y crea una cuenta). Cada vez que subas cambios, la página se actualiza sola.

**Importante:** publicar solo la página no comparte tus datos. Cada navegador guarda los suyos. Para ver los mismos datos en el celular y en el computador, necesitas lo siguiente.

## Datos en la nube con usuario y contraseña (Supabase)

La app ya sabe guardar en Supabase. Mientras `js/config.js` esté vacío, guarda en el navegador. Al llenarlo, pide **usuario** y contraseña (sin correo) y guarda en la nube. Las cuentas viejas creadas con correo siguen entrando con su correo.

Por dentro, Supabase necesita un correo, así que el usuario `samuel` se guarda como `samuel@mp.local`, una dirección que no existe y a la que nunca se envía nada. Por eso hay que **apagar la confirmación por correo** (paso 2).

**Una sola vez:**
1. **Crea la tabla.** En supabase.com abre tu proyecto → **SQL Editor** → **New query**. Pega todo el archivo `supabase/schema.sql` y toca **Run**. Debe decir *Success*.
2. **Configura el inicio de sesión.** Ve a **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:5500` (cuando la publiques, cámbiala por la dirección pública).
   - *Redirect URLs*: agrega `http://localhost:5500` y, después, tu dirección pública (por ejemplo `https://TU-USUARIO.github.io/mi-plata/`).
   Además, en **Authentication → Sign In / Providers → Email**, apaga **Confirm email** y guarda. Sin esto, los usuarios nuevos no pueden entrar.
3. **Copia tus datos de conexión.** Toca el botón **Connect** arriba (o **Project Settings → API Keys**) y copia:
   - la **Project URL** (`https://xxxx.supabase.co`)
   - la clave **pública**: *anon public* o *publishable* (`sb_publishable_…` o `eyJ…`)
   Pégalas en `js/config.js`. **Nunca** uses la clave *service_role* ni la *secret*; la app las rechaza.
4. Abre la app, escribe un usuario y una contraseña y toca **Crear cuenta**.
5. La primera vez te pregunta cómo empezar. Elige **Subir lo que tengo en este navegador** para pasar tus datos a la nube.

**Seguridad:** la tabla tiene *Row Level Security*: cada cuenta solo puede leer y cambiar sus propias filas. La clave pública sola no da acceso a nada sin iniciar sesión.

### Panel de administración

Quien sea administrador ve una sección más, **Administración**, con todas las personas registradas: cuándo se registraron, su último ingreso, sus cuentas con saldo, sus últimos movimientos y sus metas. **Solo puede ver**: la base de datos no le deja cambiar ni borrar datos ajenos.

Para volverte administrador (una sola vez):
1. Corre otra vez el archivo `supabase/schema.sql` completo (crea la tabla `admins` y los permisos).
2. Crea tu usuario en la app.
3. En **SQL Editor**, corre esta línea cambiando `TU_USUARIO` por tu usuario:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = lower('TU_USUARIO') || '@mp.local' on conflict do nothing;
   ```
   Si tu cuenta es de las viejas con correo, usa `where email = 'tu@correo.com'`.
4. Cierra sesión y vuelve a entrar.

Nadie puede volverse administrador desde la app: solo con ese paso en Supabase.

**Privacidad:** la app les dice a las personas, en la pantalla de inicio de sesión y en Ajustes, que el administrador de MP puede ver sus datos. Si la usa gente fuera de tu familia, en Colombia la Ley 1581 de 2012 pide su autorización para tratar datos personales.

**Costos:**
- **Plan gratis:** 500 MB de base de datos. Para una persona sobra. Ojo: si el proyecto pasa una semana sin uso, Supabase lo pausa. Lo reactivas con un clic en el panel y tus datos no se pierden.
- **Plan Pro:** unos 25 USD al mes. No se pausa e incluye respaldos diarios. Revisa los precios actuales en supabase.com/pricing.

**Pendiente:** recuperar la contraseña olvidada todavía no está en la app (y con usuario sin correo no hay a dónde enviar un enlace). Mientras tanto, el administrador la puede cambiar desde el panel de Supabase (*Authentication → Users*, buscando `usuario@mp.local`).

---

Nunca pongas en esta app claves de tus bancos. Todo se escribe a mano.
