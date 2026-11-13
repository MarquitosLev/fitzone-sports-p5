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
│   ├── 08 - Error Socio con Sede (422).bru
│   ├── 09 - Alta de Socio con Pago.bru
│   └── 10 - Alta de Socio Pago Rechazado (422).bru
├── 02-canchas/                     # Módulo 2: Reservas y Canchas (a incorporar)
├── 03-clases/                      # Módulo 3: Clases Grupales y Cupos (a incorporar)
├── 04-gimnasio/                    # Módulo 4: Accesos y Aforo (a incorporar)
├── 05-pagos/                       # Módulo 5: Pagos y Membresías (a incorporar)
└── 06-invitado/                    # Reserva, pago y comprobante de cancha sin cuenta (SCRUM-134)
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
   - `tokenGerente`, `tokenRecepcion`, `tokenSocio` y `tokenOtroSocio`: JWT por rol que usa `03-clases`. `tokenOtroSocio` debe ser de un socio distinto a `tokenSocio`. No se commitean: cargalos en Bruno al probar, con el `token` que devuelve `POST /v1/auth/login` para cada usuario de `docs/DATOS_DE_PRUEBA.md`.

---

## 🔁 Colección de clases

`03-clases` es un recorrido encadenado: corré la carpeta entera y en orden, porque cada request guarda los ids que usan los siguientes. Crea su propia clase con fecha futura, valida cada respuesta con tests y al final borra lo que creó.
