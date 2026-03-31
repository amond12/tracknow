# Horario Digital

## App movil con Capacitor

Este proyecto usa Laravel + Inertia, asi que la app iOS no se empaqueta como una web estatica pura. La integracion con Capacitor se configura para cargar la aplicacion desde la URL definida en `APP_URL` dentro de tu `.env`.

### 1. Instalar dependencias del proyecto

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm install
```

### 2. Configurar la URL que vera tu iPhone

No uses `localhost` si vas a probar desde el iPhone. Usa la IP local de tu Mac o un dominio accesible desde el telefono.

Ejemplo en `.env`:

```dotenv
APP_URL=http://192.168.1.50:8000
```

Despues, arranca Laravel escuchando en toda tu red local:

```bash
php artisan serve --host=0.0.0.0 --port=8000
npm run dev -- --host
```

### 3. Crear y sincronizar iOS

```bash
npm run cap:add:ios
npm run cap:sync
```

### 4. Abrir en Xcode

```bash
npm run cap:open:ios
```

En Xcode:

1. Selecciona un Team en Signing & Capabilities.
2. Conecta tu iPhone por cable o elige tu dispositivo en la lista.
3. Pulsa Run para instalar la app.

### Notas

- Si cambias `APP_URL`, vuelve a ejecutar `npm run cap:sync`.
- Si el iPhone no carga la app, confirma que ambos dispositivos estan en la misma red.
- La configuracion actual permite `http://` para facilitar pruebas locales en desarrollo.
- Si ya tienes el backend desplegado, puedes poner `APP_URL=https://tu-backend.example.com` y usar la app iOS directamente contra produccion.
