# Test de mitología — Demigods ARG (Next.js + Supabase)

Versión JavaScript/Next.js del test original de Streamlit. Conserva las 8 preguntas, las puntuaciones, el orden de desempate Griega → Romana → Nórdica → Egipcia, y permite que el campista elija entre las cuatro mitologías ordenadas sin mostrar puntajes.

## Requisitos
- Node.js LTS
- Proyecto de Supabase con tabla `campistas` y columnas `cirse` y `mitologia`

## Ejecutar en local
1. Copiá `.env.example` como `.env.local`.
2. En `.env.local`, completá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con los valores reales de Supabase.
3. En una terminal en esta carpeta ejecutá:

   ```bash
   npm install
   npm run dev
   ```

4. Abrí http://localhost:3000

**No subas `.env.local` a GitHub.** Está excluido por `.gitignore`. La clave `SUPABASE_SERVICE_ROLE_KEY` se utiliza solo en `app/api/campista/route.js`, del lado del servidor.

## Comportamiento conservado
- Tabla: `campistas`
- Identificador: `cirse`
- Campo que se consulta y actualiza: `mitologia`
- Si el Circe no existe, muestra error.
- Si `mitologia` ya tiene valor, el test no permite completarlo.
- Al confirmar, actualiza únicamente `mitologia`.
- La actualización vuelve a filtrar por `mitologia IS NULL` para reducir el riesgo de doble asignación.
- Los empates se ordenan Griega, Romana, Nórdica, Egipcia.
- No se muestran los puntajes al campista.

La aplicación no crea ni modifica el esquema de Supabase.

## Publicar en Vercel
1. Subí el proyecto a GitHub sin `.env.local`.
2. Importá el repositorio en Vercel.
3. En Environment Variables agregá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para Production (y Preview si lo necesitás).
4. Desplegá y probá con un Circe de prueba que tenga `mitologia` vacía.
