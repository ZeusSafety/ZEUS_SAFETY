# Botón "Volver a Logística" para agregar en la página de Malvinas

## Código del botón (React/Next.js)

```jsx
import { useRouter } from 'next/navigation'; // o 'next/router' dependiendo de tu versión

// Dentro de tu componente:
const router = useRouter();

// Botón a agregar justo después del Header y antes del contenedor principal:
<button
  onClick={() => {
    window.location.href = 'http://localhost:3000/logistica';
  }}
  className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm group"
  style={{ fontFamily: 'var(--font-poppins)' }}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
  <span>Volver a Logística</span>
</button>
```

## Posición del botón

El botón debe ir:
- **Después del Header** (barra superior con menú hamburguesa, notificaciones, etc.)
- **Antes del contenedor principal** (antes de la card "Almacén Malvinas")
- En la misma posición que se muestra en la segunda imagen

## Estructura HTML sugerida

```jsx
<div>
  {/* Header aquí */}
  
  {/* Botón Volver - AGREGAR AQUÍ */}
  <div className="max-w-[95%] mx-auto px-4 py-4">
    <button
      onClick={() => {
        window.location.href = 'http://localhost:3000/logistica';
      }}
      className="mb-4 flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium hover:shadow-md hover:scale-105 transition-all duration-200 shadow-sm text-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Volver a Logística</span>
    </button>
    
    {/* Contenedor principal aquí */}
  </div>
</div>
```

## Si usas React Router o navegación diferente

Si tu aplicación usa React Router u otro sistema de navegación, ajusta el `onClick`:

```jsx
// Para React Router
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

onClick={() => navigate('/logistica')}

// O simplemente redirigir con window.location
onClick={() => window.location.href = 'http://localhost:3000/logistica'}
```
