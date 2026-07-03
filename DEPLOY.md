# Deploy — AMR Producción de Seguros

Stack: **SQL Server + API (.NET 10) + Frontend (nginx)** en Docker, detrás del
**Traefik existente** del VPS (host-mode, HTTPS automático con Let's Encrypt).
Dominio: **amrprodseg.com**.

## Requisitos previos
- El registro **A** de `amrprodseg.com` debe apuntar a la **IP del VPS** (ya propagado).
- Traefik corriendo en el VPS con el resolver `letsencrypt` y entrypoints `web`/`websecure`.

## Pasos (en el VPS, por SSH)

1. **Clonar el repo**
   ```bash
   cd /docker
   git clone https://github.com/TU_USUARIO/amr-produccion-seguros.git amr
   cd amr
   ```

2. **Crear el `.env`** (a partir de la plantilla) y completarlo
   ```bash
   cp .env.example .env
   # Generar una clave JWT fuerte:
   openssl rand -base64 48
   nano .env   # pegar Jwt__Key, poner MSSQL_SA_PASSWORD y la misma password en la connection string
   ```
   > La password de `MSSQL_SA_PASSWORD` y la del `ConnectionStrings__AmrProdSeg` **deben ser la misma**.
   > SQL Server exige password fuerte (mayús + minús + número + símbolo, 8+).

3. **Levantar los contenedores**
   ```bash
   docker compose up -d --build
   ```

4. **Cargar la base** (esperar ~30 s a que SQL Server arranque la primera vez)
   ```bash
   source .env
   docker exec -i amr-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C < AmrProdSeg_Schema.sql
   docker exec -i amr-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C < AmrProdSeg_Seed.sql
   ```

5. **Probar**: abrir `https://amrprodseg.com` → debería cargar con candado (HTTPS).
   Entrar, cambiar la contraseña del admin, y configurar SMTP/Evolution.

## Actualizar más adelante
```bash
cd /docker/amr && ./actualizar.sh
```
(Trae los cambios y reconstruye. Si tocaste tablas/SP, correr de nuevo el paso 4 del schema.)

## Comandos útiles
```bash
docker compose ps           # estado de los contenedores
docker compose logs -f api  # logs del backend
docker compose down         # apagar (los datos de la base persisten en el volumen)
```
