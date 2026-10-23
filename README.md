# NextFiber

Sitio web de NextFiber (internet de fibra óptica y TV) con servidor propio para
registrar clientes interesados, recibir reclamos en el Libro de Reclamaciones
virtual y enviar notificaciones automáticas por WhatsApp, Gmail, Telegram y
Facebook Messenger.

- **Frontend:** HTML, CSS y JavaScript puro (sin paso de compilación).
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`).
- **Widgets animados:** React + TypeScript + Tailwind, compilados a un solo `.js` (carpeta `react-components/`).

## Vista previa

### Inicio
![Inicio](docs/inicio.jpg)

### Planes
![Planes](docs/planes.jpg)

### Verificación de cobertura
![Cobertura](docs/cobertura.jpg)

### Preguntas frecuentes
![Preguntas frecuentes](docs/Preguntas.jpg)

### Libro de Reclamaciones
![Libro de Reclamaciones](docs/reclamos.jpg)

## Qué hice y qué aprendí

- Diseñé y programé el sitio completo: frontend en HTML, CSS y JavaScript puro, y backend en Node.js con Express y SQLite.
- Validación de todos los formularios en el servidor, límite de envíos por conexión y campo trampa contra robots.
- Protección contra XSS en el panel de administración y consultas SQL parametrizadas.
- Panel de administración con clave comparada de forma segura y bloqueo tras intentos fallidos.
- Integraciones con WhatsApp (Meta Cloud API), Gmail, Telegram y Facebook Messenger, con webhook verificado por firma.
- Libro de Reclamaciones virtual con copia al consumidor por correo.
- Widgets animados en React y TypeScript, compilados a un solo archivo JS.

## Estructura

```
nextfiber/
├── frontend/                  → Sitio web público
│   ├── index.html
│   ├── css/styles.css
│   ├── js/                    → script.js, mapa de cobertura, FAQ, widgets compilados
│   ├── legal/                 → Términos, Política de privacidad y Libro de Reclamaciones
│   ├── images/, video/, pdf/  → recursos (parrillas de canales en pdf/)
│
├── backend/                   → Servidor, base de datos y API
│   ├── server.js              → arranca el servidor
│   ├── .env.example           → plantilla de credenciales (cópiala a .env)
│   ├── db/database.js         → conexión y tablas (leads y reclamos)
│   ├── routes/                → leads.js y reclamos.js (API)
│   ├── lib/                   → validación de formularios y comparación segura de claves
│   ├── middleware/            → cabeceras de seguridad, límite de envíos, auth admin, errores
│   ├── integrations/          → WhatsApp, Gmail, Telegram y Facebook Messenger
│   └── admin/                 → paneles de administración (registros y reclamos)
│
└── react-components/          → Código fuente de los widgets animados (proyecto aparte)
```

## ¿Cómo funciona?

1. Una persona completa un formulario del sitio (verificar cobertura, registro, "llámenme", etc.).
2. El navegador envía los datos a `POST /api/leads`.
3. El servidor valida y guarda el registro en SQLite (`backend/db/nextfiber.sqlite`, se crea sola).
4. Se avisa al equipo por WhatsApp, Gmail y Telegram. Cada integración es independiente: si una no está configurada, se omite sin afectar el registro.
5. El equipo revisa los registros en `/admin/leads.html`.

**Libro de Reclamaciones:** el formulario de `/legal/libro-reclamaciones.html` envía a `POST /api/reclamos`. Se guarda el reclamo, se notifica al equipo y se envía una copia al consumidor por correo. Se atiende en `/admin/reclamos.html`.

**Facebook Messenger:** Meta no permite escribir primero a un usuario, así que funciona como webhook (`/webhook/facebook`): cuando alguien escribe a la Página, Meta reenvía el mensaje al servidor, se guarda como registro y se responde automáticamente.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior.
- Conexión a internet para instalar dependencias y para las integraciones.

## Instalación y arranque

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Edita `.env` y completa solo las credenciales que quieras activar. Todas pueden quedar vacías al principio: el sitio funciona y los registros se guardan igual.

| URL | Qué es |
|---|---|
| `http://localhost:3000` | Sitio web |
| `http://localhost:3000/admin/leads.html` | Panel de registros (pide `ADMIN_TOKEN`) |
| `http://localhost:3000/admin/reclamos.html` | Panel del Libro de Reclamaciones |
| `http://localhost:3000/legal/terminos.html` | Términos y condiciones |
| `http://localhost:3000/legal/privacidad.html` | Política de privacidad |

## Variables de entorno

Todas están documentadas en `backend/.env.example`. Las principales:

| Variable | Uso |
|---|---|
| `ADMIN_TOKEN` | Clave de los paneles. Mínimo 24 caracteres aleatorios. |
| `NODE_ENV` | `production` en el servidor publicado. |
| `TRUST_PROXY` | Cómo obtener la IP real del visitante (para el límite de envíos). |
| `ALLOWED_ORIGINS` | Solo si el frontend vive en otro dominio que el backend. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TO` | Notificación por WhatsApp (Meta Cloud API). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SALES_EMAIL` | Correo vía Gmail con contraseña de aplicación. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Notificación por Telegram. |
| `VERIFY_TOKEN`, `FB_APP_SECRET`, `FB_PAGE_TOKEN` | Webhook de Facebook Messenger. |

Generar un `ADMIN_TOKEN` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## Widgets React (opcional)

El sitio ya incluye los widgets compilados en `frontend/js/`. Solo necesitas esto si quieres modificarlos:

```bash
cd react-components
npm install
npm run build:widgets
```

Luego copia los archivos de `dist-widget/` a `frontend/js/`.

## Publicar en internet

Sirve cualquier servicio con Node.js (Render, Railway, un VPS, etc.):

1. Conecta este repositorio.
2. Configura las variables del `.env` en el panel del servicio, con `NODE_ENV=production`.
3. Comando de instalación `npm install` y de inicio `npm start`, ambos dentro de `backend/`.
4. **Usa un disco persistente** para `backend/db/`. Si no, la base de datos se borra en cada despliegue.
5. Sirve el sitio por HTTPS.

Si agregas un servicio externo nuevo (Analytics, píxel de Facebook, chat, etc.), añade su dominio en `backend/middleware/security-headers.js`; si no, el navegador lo bloqueará.

## Seguridad

- **Nunca subas `.env` ni la base de datos** (`backend/db/*.sqlite*`) al repositorio. El `.gitignore` ya los excluye.
- La base de datos contiene datos personales de clientes (Ley 29733): haz respaldos y no la compartas fuera del equipo.
- Los formularios validan cada dato en el servidor, limitan los envíos por conexión y descartan robots con un campo trampa.
- El panel de administración compara la clave de forma segura y bloquea la conexión 15 minutos tras 10 intentos fallidos.
- El webhook de Facebook solo acepta mensajes firmados por Meta (`FB_APP_SECRET`).
- La respuesta automática por correo tiene límites diarios y por hora para que no se use tu Gmail para enviar spam.
- Si una credencial llegó a publicarse, **revócala y genera una nueva**; borrarla del repositorio no basta.

## Licencia

Software propietario. Todos los derechos reservados. Ver [LICENSE](LICENSE).
