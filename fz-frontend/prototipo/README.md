# Prototipo Frontend de FitZone Sports

## 📌 Propósito y Alcance

Este directorio contiene una versión interactiva y navegable creada a partir de los diseños originales de Figma.

- **¿Qué es?** Un **prototipo funcional/mockup de alta fidelidad** desarrollado con React 18, Tailwind CSS y Vite para validar la experiencia de usuario (UX), flujos de navegación, pantallas y componentes visuales.
- **¿Qué NO es?** **No es el frontend principal** de producción de FitZone Sports (`fz-frontend`).
- **Estado de datos:** Utiliza estado simulado en memoria (`AppContext.jsx`) y datos locales o mocks, sin conexión directa ni dependencia del backend de producción (`fz-backend`).

---

## 🚀 Cómo Ejecutar el Prototipo

Para levantar y explorar el prototipo en tu navegador localmente:

1. **Navega al directorio del prototipo:**

   ```bash
   cd fz-frontend/prototipo/PrototipoFront
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

4. **Accede en tu navegador:**
   Por defecto estará disponible en: [http://localhost:5173](http://localhost:5173) (o el puerto que asigne Vite).

---

## 🛠️ Stack Tecnológico del Prototipo

- **Framework:** React 18
- **Bundler / Dev Server:** Vite
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **Utilidades adicionales:** `canvas-confetti`, `qrcode.react`, `clsx`, `tailwind-merge`

---

## 📂 Estructura Principal

- `src/components/`: Componentes modulares de interfaz y pantallas prototipadas.
- `src/context/AppContext.jsx`: Contexto global simulado para interactuar y navegar entre los diferentes flujos (clientes, turnos, pagos, administración).
- `to_fix.md`: Notas de auditoría técnica, pendientes de diseño y diferencias identificadas con respecto a Figma.
- `screens_summary.json`: Mapeo y resumen de pantallas importadas.
