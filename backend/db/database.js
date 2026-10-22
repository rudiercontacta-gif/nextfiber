// =========================================================
// Base de datos de NextFiber (SQLite)
// Se crea automáticamente un archivo "nextfiber.sqlite" en esta
// misma carpeta la primera vez que se ejecuta el servidor.
// =========================================================
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'nextfiber.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT    NOT NULL,
    telefono       TEXT,
    correo         TEXT,
    direccion      TEXT,
    dpto           TEXT,
    plan_interes   TEXT,
    mensaje        TEXT,
    origen         TEXT    DEFAULT 'desconocido',
    estado         TEXT    DEFAULT 'nuevo',
    creado_en      TEXT    DEFAULT (datetime('now','localtime'))
  );
`);

// ---------------------------------------------------------
// Migraciones: agregan columnas nuevas a una base de datos que ya
// existe, SIN borrar los registros que tengas guardados.
// ---------------------------------------------------------
const columnas = db
  .prepare('PRAGMA table_info(leads)')
  .all()
  .map((c) => c.name);

// fb_psid: identificador de la persona en Facebook Messenger, para no
// crear un registro nuevo (ni responderle otra vez) por cada mensaje.
if (!columnas.includes('fb_psid')) {
  db.exec('ALTER TABLE leads ADD COLUMN fb_psid TEXT');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_fb_psid ON leads (fb_psid)');

db.exec(`
  CREATE TABLE IF NOT EXISTS reclamos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo             TEXT    NOT NULL,
    consumidor       TEXT    NOT NULL,
    tipo_documento   TEXT,
    numero_documento TEXT,
    domicilio        TEXT,
    telefono         TEXT,
    correo           TEXT,
    es_menor_edad    INTEGER DEFAULT 0,
    apoderado        TEXT,
    bien_contratado  TEXT    NOT NULL,
    fecha_contrato   TEXT,
    monto_reclamado  TEXT,
    detalle          TEXT    NOT NULL,
    pedido           TEXT    NOT NULL,
    respuesta        TEXT,
    estado           TEXT    DEFAULT 'pendiente',
    creado_en        TEXT    DEFAULT (datetime('now','localtime')),
    respondido_en    TEXT
  );
`);

module.exports = db;
