# 🎭 Configuración del Sistema de Datos Dummy

Para usar el sistema de datos dummy, sigue estos pasos:

## 1. Obtener tu Service Role Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **tienda-angus**
3. Ve a **Project Settings** (⚙️ en la barra lateral)
4. Haz clic en **API**
5. En la sección "Project API keys", busca **service_role**
6. Haz clic en el ícono del ojo 👁️ para revelar la key
7. Copia la key completa

## 2. Agregar la Key a tu .env.local

Abre el archivo `.env.local` y reemplaza esta línea:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Con tu key real:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: 
- Esta key tiene permisos completos sobre tu base de datos
- NO la compartas públicamente
- NO la uses en el código del frontend
- Solo se usa en scripts de servidor (seed/clean)

## 3. Ejecutar los Scripts

Una vez configurada la key, puedes usar:

```bash
# Poblar la base de datos con datos de prueba
npm run seed:dummy

# Limpiar todos los datos dummy
npm run clean:dummy
```

## ¿Por qué necesito la Service Role Key?

Los datos dummy se insertan directamente en la base de datos, pero las tablas tienen políticas de seguridad (RLS) que solo permiten inserciones autenticadas. La Service Role Key bypasea estas políticas de forma segura en scripts de servidor.

La Anon Key (que usas en el frontend) no tiene estos permisos por seguridad.

## Documentación Completa

Para más información, consulta: `docs/SISTEMA-DATOS-DUMMY.md`
