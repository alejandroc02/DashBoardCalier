# Documento Maestro: Dashboard Calier Argentina

Este documento sirve como referencia técnica y funcional del proyecto **Dashboard Calier Argentina**, un panel de control diseñado para visualizar y analizar las interacciones gestionadas a través de un bot de WhatsApp.

---

## 🚀 Stack Tecnológico

La aplicación está construida con tecnologías modernas para garantizar rapidez, escalabilidad y facilidad de mantenimiento:

- **Frontend**: [React](https://reactjs.org/) (v18) con [TypeScript](https://www.typescriptlang.org/).
- **Bundler**: [Vite](https://vitejs.dev/) para un entorno de desarrollo ultrarrápido.
- **Backend/Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + API en tiempo real).
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo y moderno.
- **Visualización de Datos**: [Recharts](https://recharts.org/) para gráficos y `react-simple-maps` para el mapa interactivo de Argentina.
- **Iconografía**: [Lucide React](https://lucide.dev/).

---

## 📁 Estructura del Proyecto

```text
App/
├── src/ (implícito en la raíz para este proyecto)
│   ├── App.tsx             # Componente principal, orquestación de datos y rutas.
│   ├── types.ts            # Definiciones de interfaces y tipos de datos.
│   ├── services/
│   │   └── supabase.ts     # Configuración y cliente de conexión con Supabase.
│   ├── components/
│   │   ├── Login.tsx       # Módulo de autenticación simple.
│   │   ├── ArgentinaMap.tsx# Mapa interactivo de Argentina por provincias.
│   │   └── Components.tsx  # Componentes reutilizables (KPI Cards, Badges, Chart Cards).
│   └── index.tsx           # Punto de entrada de la aplicación.
└── package.json            # Dependencias y scripts del proyecto.
```

---

## 🗄️ Base de Datos (Supabase)

El proyecto utiliza 5 tablas principales en el esquema público de Supabase:

### 1. `calier_interacciones`
Almacena cada mensaje o interacción procesada por el bot.
- `id`: Identificador único (Auto-incremental).
- `client_codigo`: Código único del cliente.
- `vendedor_codigo`: Código del vendedor asignado.
- `resumen`: Extracto del texto de la interacción.
- `clasificación`: Categoría (COMPRA, INFO, BAJA).
- `estado`: Estado actual (respondido, enviado).
- `derivado`: Booleano que indica si fue pasado a un humano.
- `fecha_envio`: Timestamp de creación.

### 2. `calier_clientes`
Maestro de clientes.
- `codigo`: Código identificador usado en interacciones.
- `nombre`: Nombre de la veterinaria/cliente.
- `provincia`, `localidad`, `sector`: Datos demográficos y de segmentación.
- `cod_vendedor`: Clave foránea al vendedor.

### 3. `calier_vendedores`
Maestro de la fuerza de ventas.
- `codigo`: Identificador único (Unique key).
- `nombre`, `email`, `telefono`: Datos de contacto.
- `activo`: Estado del vendedor.

### 4. `calier_seguimientio`
Registro de seguimientos realizados a clientes.

### 5. `calier_users`
Credenciales para el acceso al dashboard.

---

## 📊 KPIs y Lógica de Negocio

El dashboard calcula métricas clave en tiempo real basadas en los datos filtrados:

| KPI | Descripción / Lógica |
| :--- | :--- |
| **Total Interacciones** | Conteo total de registros en `calier_interacciones` según filtros. |
| **Tasa de Respuesta** | (Respondido / Total) * 100. Mide la efectividad del bot/vendedor. |
| **Leads Compra** | Conteo de interacciones clasificadas como 'COMPRA'. |
| **Derivadas** | Conteo de interacciones donde `derivado = true`. |
| **Conversión Vendedor** | (Compras / Interacciones Asignadas) * 100. |
| **Clientes sin Interacción** | Clientes en el maestro que no aparecen en la tabla de interacciones (segmento a recuperar). |

---

## 🔍 Filtros Disponibles

La aplicación cuenta con un motor de filtrado global que afecta a todas las pestañas:
1. **Rango de Fechas**: Filtra interacciones por `fecha_envio`.
2. **Clasificación**: Permite aislar leads de Compra, Información o Bajas.
3. **Vendedor**: Filtra toda la data para ver el desempeño de una persona específica.
4. **Provincia**: Filtra clientes e interacciones por ubicación geográfica (vía mapa o tabla).

---

## 💡 Funcionalidades Principales

1. **Dashboard de Resumen**: Vista de alto nivel con gráficos de tendencia diaria y distribución de leads.
2. **Monitor de Interacciones**: Tabla detallada con búsqueda en tiempo real y tooltips de resumen.
3. **Gestión de Vendedores**: Ranking de efectividad y alertas de derivaciones pendientes/atrasadas.
4. **Mapa de Calor**: Visualización geográfica de clientes e interacciones por provincia.
5. **Directorio de Clientes**: Listado completo con segmentación por sector y conteo de actividad.

---

## 📝 Referencia para Prompts (AI Context)

Si trabajas con este proyecto usando IA, ten en cuenta:
- **Tildes**: La columna en la DB para clasificación se llama `clasificación` (con tilde).
- **Tipado**: Usa siempre las interfaces definidas en `types.ts` para evitar errores de consistencia.
- **Supabase**: Las queries usan el cliente `supabase` importado desde `@/services/supabase`.
- **Performance**: El dashboard carga toda la data al inicio (`loadData`) y usa `useMemo` para los cálculos de KPIs para optimizar el rendimiento sin re-peticiones excesivas.
