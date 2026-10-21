# Colección Bruno — FitZone Sports API

Colección oficial de pruebas de API para el backend de FitZone Sports, organizada por módulos de negocio para facilitar el escalado a lo largo de los sprints.

---

## 📁 Estructura Modular

```text
docs/bruno/
├── bruno.json                      # Configuración de la colección
├── environments/
│   ├── local.bru                   # http://localhost:8080/api (Docker / Local)
│   └── dev.bru                     # Backend desplegado en Render
├── 00-admin/                       # Administración y diagnóstico interno (no público)
│   ├── 01 - Consultar Base de Datos (SELECT).bru
│   ├── 02 - Consultar Tablas del Sistema.bru
│   ├── 03 - Error Root Key Invalida (401).bru
│   └── 04 - Error Sentencia Prohibida DDL-DML (422).bru
├── 01-usuarios/                    # Módulo 1: Usuarios, Sedes y Auth (SCRUM-65)
│   ├── 01 - Crear Socio.bru
│   ├── 02 - Crear Externo (Invitado).bru
│   ├── 03 - Crear Recepcionista.bru
│   ├── 04 - Obtener Perfil por ID.bru
│   ├── 05 - Buscar Usuarios con Filtros.bru
│   ├── 06 - Editar Usuario.bru
│   ├── 07 - Error DNI Duplicado (409).bru
│   └── 08 - Error Socio con Sede (422).bru
├── 02-canchas/                     # Módulo 2: Reservas y Canchas (a incorporar)
├── 03-clases/                      # Módulo 3: Clases Grupales y Cupos (a incorporar)
├── 04-gimnasio/                    # Módulo 4: Accesos y Aforo (a incorporar)
└── 05-pagos/                       # Módulo 5: Pagos y Membresías (a incorporar)
```

---

## 🚀 Cómo Usarla en Bruno

1. **Abrir Bruno:**
   - Descargá o abrí la aplicación [Bruno](https://www.usebruno.com/).
   - Seleccioná **Open Collection** (o `Ctrl + O`).
   - Navegá y seleccioná la carpeta `Integrador/docs/bruno`.

2. **Seleccionar el Entorno:**
   - En la esquina superior derecha de Bruno, desplegá el selector de entornos y elegí **`local`** (para apuntar a `http://localhost:8080/api`) o **`dev`** (para Render).

3. **Variables Disponibles:**
   - `baseUrl`: Prefijo de la API (`http://localhost:8080/api`).
   - `idOperador`: ID del usuario que realiza la acción (por defecto `1` para el Gerente inicial).
   - `rootKey`: Clave secreta administrativa para consultas de mantenimiento a la base de datos (por defecto `fitzone-local-root-key-2026` en local).
