# NextFiber — Vitrina de componentes React

Este es un **proyecto aparte**, independiente de tu sitio principal
(`nextfiber/frontend`) y de tu servidor (`nextfiber/backend`). No lo
reemplaza ni se conecta con él automáticamente — es un espacio separado con
**React + TypeScript + Tailwind CSS + shadcn**, pensado para probar
componentes animados "de verdad" (como el botón de metal líquido con shader
WebGL) antes de decidir si algún día quieres llevar parte del sitio a React.

## ¿Por qué está separado?

Tu sitio (`frontend/`) es HTML + CSS + JS puro sin paso de compilación —
así lo construimos para que sea liviano y fácil de editar. El componente
`LiquidMetalButton` que pediste está hecho en React con una librería de
shaders (`@paper-design/shaders`), lo cual requiere todo un entorno de
compilación (Vite, TypeScript, Tailwind). Mezclar ambos mundos en la misma
carpeta habría complicado innecesariamente tu sitio actual.

En tu sitio principal ya integré una **versión recreada en CSS puro** de
este mismo efecto (degradado animado morado/verde limón/plomo + brillo +
onda al hacer clic) en el botón "¡Contrata ya!" — sin necesitar nada de lo
que hay en esta carpeta.

Esta carpeta existe para que puedas **ver el efecto real con shader** y,
si más adelante quieres, uses estos mismos componentes en un proyecto React
nuevo.

## Estructura

```
react-components/
├── package.json
├── tailwind.config.ts       → colores de marca NextFiber ya configurados
├── components.json           → configuración de shadcn
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── lib/utils.ts           → helper cn() estándar de shadcn
    └── components/ui/
        ├── liquid-metal-button.tsx
        └── demo.tsx
```

## Requisitos

- Node.js 18 o superior (el mismo que ya instalaste para el backend)
- Conexión a internet (para `npm install`)

## Instalación y arranque

```bash
cd nextfiber/react-components
npm install
npm run dev
```

Vite te va a mostrar una URL, normalmente:
```
http://localhost:5173
```

Ábrela en el navegador — vas a ver el botón "¡Contrata ya!" con el shader
real de metal líquido, animándose con el mouse.

## Nota sobre `@paper-design/shaders`

Esta librería usa WebGL para renderizar el shader — necesita GPU/navegador
moderno. Si en tu máquina no carga (pantalla en negro donde debería estar
el botón), revisa la consola del navegador (F12) por errores, y confirma
que `npm install` haya terminado sin errores.

## Agregar más componentes shadcn

Como este proyecto ya tiene `components.json` configurado, en el futuro
puedes agregar componentes oficiales de shadcn con:

```bash
npx shadcn@latest add button
```

(o cualquier otro componente de la librería) y van a instalarse
automáticamente en `src/components/ui/`, siguiendo la misma estructura.

## Ver el botón real (con shader) en tu sitio principal

Tu sitio (`frontend/index.html`) ya está preparado para mostrar este botón
de verdad, animado con WebGL, en vez de la recreación en CSS. Solo falta un
paso, porque este entorno no tiene forma de compilarlo por ti:

```bash
cd nextfiber/react-components
npm install
npm run build:widget
```

Esto genera un archivo en `dist-widget/liquid-button.widget.js`. Cópialo a:

```
nextfiber/frontend/js/liquid-button.widget.js
```

Recarga `http://localhost:3000` (Ctrl+F5) — el botón "¡Contrata ya!" del
header ahora será el shader real, animado con el mouse.

**Si no haces este paso**, no pasa nada: el sitio sigue funcionando normal
con el botón en CSS puro que ya integramos antes. El script se carga de
forma silenciosa — si el archivo no existe, el navegador simplemente lo
ignora.

Para actualizar el botón después de cualquier cambio en
`liquid-metal-button.tsx`, vuelve a correr `npm run build:widget` y copia
el archivo de nuevo.
