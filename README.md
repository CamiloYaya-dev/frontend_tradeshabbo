# 🛒 TradesHabbo - Frontend

Interfaz web para la plataforma **TradesHabbo**, donde los usuarios pueden explorar, comparar y buscar precios de furnis de Habbo Hotel a través de una experiencia moderna, rápida y responsive.

---

## 🚀 Tecnologías Utilizadas

- **React.js** — Librería principal
- **Vite** — Bundler ultrarrápido para desarrollo
- **Tailwind CSS** — Utilidades para estilos rápidos y responsivos
- **Lucide React** — Iconos modernos
- **ShadCN/UI** — Componentes accesibles y bellos
- **React Router** — Navegación por rutas
- **Axios** — Peticiones HTTP al backend

---

## 🗂️ Estructura del Proyecto

```bash
frontend_tradeshabbo/
├── public/               # Archivos públicos
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Vistas principales (Inicio, Resultados, etc.)
│   ├── hooks/            # Hooks personalizados
│   ├── services/         # Módulos para peticiones HTTP
│   ├── utils/            # Funciones auxiliares
│   ├── App.jsx           # Componente raíz
│   └── main.jsx          # Punto de entrada
├── .env                  # Variables de entorno
├── tailwind.config.js    # Configuración Tailwind
├── index.html            # HTML base
└── package.json          # Dependencias y scripts
```

---

## ⚙️ Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/CamiloYaya-dev/frontend_tradeshabbo.git
cd frontend_tradeshabbo
```

2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` y configura:

```env
VITE_API_URL=http://localhost:5000
```

4. Ejecuta en modo desarrollo:

```bash
npm run dev
```

---

## 📦 Scripts Disponibles

| Script        | Comando         | Descripción                    |
|---------------|-----------------|--------------------------------|
| Dev           | `npm run dev`   | Ejecuta servidor local con Vite |
| Build         | `npm run build` | Construye la versión optimizada |
| Preview       | `npm run preview` | Previsualiza build local     |

---

## 🧠 Arquitectura (Mermaid)

```mermaid
flowchart TD
  subgraph Cliente
    A[UI React]
    A -->|Consulta precios, búsqueda| B[API Flask]
  end

  subgraph Backend
    B -->|Validar clave| C[(MySQL)]
    B -->|Descargar imagen| D[Nginx privado]
    B -->|Verificar update| E[actualizacion.json]
  end

  subgraph Seguridad
    F[API_KEY]
    G[Validación IP & Headers]
    H[Control licencias activas]
    B --> F
    B --> G
    B --> H
  end

  subgraph Infraestructura
    I[ngrok túnel TCP]
    J[Puerto remoto DB]
    K[Nginx X-Accel-Redirect]
    D --> K
    B --> I
    I --> J
  end


```

---

## 📌 Características

- 🔍 Búsqueda por nombre o palabra clave
- 🖼️ Renderizado de furnis con imágenes
- 📊 Precios mínimos y máximos
- 🌙 Modo oscuro y diseño responsivo
- 📡 Comunicación con API propia

---

## 👨‍💻 Autor

Desarrollado por [CamiloYaya-dev](https://github.com/CamiloYaya-dev) con ❤️ y código limpio.

