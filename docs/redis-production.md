# Redis En Produccion

Esta aplicacion queda preparada para usar Redis separado por uso:

- `cache` en la base logica `1`
- `session` en la base logica `2`
- `queue` en la base logica `3`

La configuracion base ya esta reflejada en `.env.example`.

## 1. Requisitos del VPS

- Redis instalado y activo
- Extension PHP `redis` disponible para la version de PHP que use Laravel
- Un proceso permanente para `queue:work` con `Supervisor` o `systemd`

Ejemplo rapido en Ubuntu:

```bash
sudo apt update
sudo apt install redis-server php-redis supervisor
sudo systemctl enable --now redis-server
sudo systemctl enable --now supervisor
```

## 2. Variables de entorno

En tu `.env` de produccion usa como minimo:

```dotenv
SESSION_DRIVER=redis
SESSION_CONNECTION=session
SESSION_STORE=session

CACHE_STORE=redis

QUEUE_CONNECTION=redis
REDIS_QUEUE_CONNECTION=queue
REDIS_QUEUE=default
REDIS_QUEUE_RETRY_AFTER=120
REDIS_QUEUE_BLOCK_FOR=5

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_SESSION_DB=2
REDIS_QUEUE_DB=3
REDIS_CACHE_CONNECTION=cache
REDIS_CACHE_LOCK_CONNECTION=cache
REDIS_SESSION_CONNECTION=session
REDIS_SESSION_LOCK_CONNECTION=session
```

Si Redis esta en otro host o requiere password, ajusta `REDIS_HOST` y `REDIS_PASSWORD`.

## 3. Aplicar configuracion

Despues de cambiar el `.env`:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 4. Worker de colas

Aunque hoy la aplicacion no usa jobs pesados en segundo plano, deja el worker listo para cuando los añadas.

Comando recomendado:

```bash
php artisan queue:work redis --queue=default --sleep=1 --tries=3 --timeout=120 --max-time=3600
```

## 5. Supervisor

Ejemplo de fichero `/etc/supervisor/conf.d/tracknow-worker.conf`:

```ini
[program:tracknow-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/tracknow/artisan queue:work redis --queue=default --sleep=1 --tries=3 --timeout=120 --max-time=3600
directory=/var/www/tracknow
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/tracknow/storage/logs/worker.log
stopwaitsecs=3600
```

Recarga Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

## 6. Colas recomendadas

Hoy:

- `default`

Mas adelante, solo si realmente creas jobs especificos:

- `emails`
- `pdfs`
- `imports`

No metas el fichaje normal en cola. La entrada y salida debe confirmarse en la misma peticion.
