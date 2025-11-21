# Guía de Migración a React + Vite

Este documento detalla el plan de migración, la nueva estructura propuesta y las mejores prácticas para transformar el proyecto actual (HTML/JS/CSS nativo) a una aplicación moderna con React y Vite.

## 1. Análisis del Proyecto Actual
El proyecto actual es una aplicación web estática basada en múltiples archivos HTML (`index.html`, `ventas.html`, etc.), con lógica dispersa en archivos JS y estilos CSS separados por página.

- **Tecnologías actuales**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5 (CDN), FontAwesome (CDN).
- **Estado**: Manejo de sesión con `localStorage`, navegación por enlaces directos (`<a>`), sin sistema de módulos moderno.
- **Desafíos**:
    - Dificultad para reutilizar componentes (ej. menús, tarjetas).
    - Carga de página completa en cada navegación.
    - Gestión de estado fragmentada.

## 2. Nueva Arquitectura Propuesta (React + Vite)

### Stack Tecnológico
- **Core**: React 18+
- **Build Tool**: Vite (Rápido, ligero y moderno).
- **Routing**: React Router DOM v6 (Para navegación SPA sin recargas).
- **Estilos**: CSS Modules (para estilos locales) o mantener CSS global temporalmente + Bootstrap (npm).
- **Iconos**: `react-icons` (Reemplazo eficiente para FontAwesome CDN).

### Estructura de Carpetas
Esta estructura promueve la escalabilidad y el orden:

```text
src/
├── assets/              # Imágenes, fuentes y archivos estáticos globales
│   ├── images/
│   └── styles/          # CSS globales (variables, reset)
├── components/          # Componentes reutilizables
│   ├── common/          # Botones, Inputs, Loaders
│   ├── layout/          # Header, Sidebar, Footer
│   └── ui/              # Componentes de UI específicos (Cards, Modals)
├── context/             # Estados globales (AuthContext, ThemeContext)
├── hooks/               # Custom Hooks (useAuth, useFetch)
├── pages/               # Vistas principales (coinciden con los HTML actuales)
│   ├── Login/
│   ├── Menu/
│   ├── Ventas/
│   ├── Administracion/
│   └── ...
├── services/            # Lógica de API y servicios externos
├── utils/               # Funciones auxiliares y constantes
├── App.jsx              # Componente raíz y configuración de rutas
└── main.jsx             # Punto de entrada
```

## 3. Plan de Migración (Paso a Paso)

### Fase 1: Configuración Inicial
1.  Inicializar proyecto Vite: `npm create vite@latest mi-sistema -- --template react`
2.  Instalar dependencias clave:
    ```bash
    npm install react-router-dom bootstrap react-icons
    ```
3.  Configurar Bootstrap en `main.jsx` (`import 'bootstrap/dist/css/bootstrap.min.css'`).

### Fase 2: Migración de Base
1.  **Assets**: Mover imágenes de `img/` a `src/assets/images/`.
2.  **Estilos Globales**: Migrar variables CSS de `index.html` a `src/index.css`.
3.  **Componentes Base**: Crear componentes para elementos repetitivos (ej. `Notification`, `MenuCard`).

### Fase 3: Rutas y Páginas
1.  Configurar `BrowserRouter` en `main.jsx`.
2.  Crear las páginas en `src/pages/` copiando el HTML del `body` de cada archivo original y adaptándolo a JSX (cambiar `class` por `className`, cerrar etiquetas, etc.).
3.  Definir las rutas en `App.jsx`:
    ```jsx
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/ventas" element={<Ventas />} />
      {/* ... otras rutas */}
    </Routes>
    ```

### Fase 4: Lógica y Estado
1.  Migrar `script.js` (login) a un hook o contexto (`AuthContext`).
2.  Reemplazar `localStorage` directo por un manejo de estado más robusto.
3.  Sustituir `<a>` por `<Link>` de `react-router-dom` para navegación instantánea.

## 4. Buenas Prácticas

1.  **Componentización**: Si copias y pegas código más de dos veces, conviértelo en un componente.
2.  **Nombres Claros**: Usa PascalCase para componentes (`LoginCard.jsx`) y camelCase para funciones (`handleLogin`).
3.  **Separación de Responsabilidades**: La lógica compleja no debe estar dentro del JSX. Usa Custom Hooks.
4.  **Evitar jQuery/DOM Directo**: No uses `document.getElementById`. Usa `useRef` o estado de React (`useState`).
5.  **Variables de Entorno**: Usa archivos `.env` para URLs de API o claves, no las quemes en el código.

## 5. Ejemplo de Componente Migrado (Login)

**Antes (HTML/JS):**
```html
<form id="loginForm">
    <input type="text" id="usuario" />
    <button type="submit">Ingresar</button>
</form>
<script>
    document.getElementById('loginForm').addEventListener('submit', ...)
</script>
```

**Después (React):**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [user, setUser] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de validación
    navigate('/menu');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={user} 
        onChange={(e) => setUser(e.target.value)} 
        placeholder="Usuario" 
      />
      <button type="submit">Ingresar</button>
    </form>
  );
};
```
