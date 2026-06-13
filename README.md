# 🏆 MUNDIAL 2026 TRACKER

Tu tracker personal para llevar el control completo del Mundial 2026.

## ✨ Características

- 📋 **104 partidos** (72 de grupos + 32 de eliminatorias)
- 👤 **Registro con apodo** — sin email requerido
- ⚽ **Goleadores** — quién metió cada gol
- 📊 **Tabla automática** — posiciones en tiempo real
- 🏅 **Ranking de goleadores** con 🥇🥈🥉
- 📱 **Responsive** — funciona en móvil
- 🔒 **Datos privados** — cada usuario solo ve los suyos

## 🚀 Quick Start

### 1️⃣ Crea Supabase
- Ve a https://supabase.com
- Nuevo proyecto: "mundial-2026"
- Settings > API: copia Project URL + anon key

### 2️⃣ Edita credenciales
Abre `index.html` y reemplaza:
```javascript
const SUPABASE_URL = 'tu_project_url';
const SUPABASE_KEY = 'tu_anon_key';
```

### 3️⃣ Ejecuta SQL
En Supabase SQL Editor, copia y ejecuta todo el contenido de `supabase_setup.sql`

### 4️⃣ Prueba localmente
- Abre `index.html` en tu navegador
- Registrate con tu apodo
- ¡Funciona!

### 5️⃣ Sube a GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [tu_repo_url]
git branch -M main
git push -u origin main
```

En GitHub: Settings > Pages > Branch: main > Save

## 📚 Documentación

- **COMIENZA_AQUI.txt** — Plan de 3 pasos (15 minutos)
- **PRUEBA_CON_APODO.txt** — Guía visual para probar
- **SETUP_GUIDE.md** — Instrucciones detalladas
- **AUTENTICACION_USUARIOS.md** — Sistema de apodos

## 🎮 Uso

1. Registrate con tu apodo (sin email)
2. Entra directamente
3. Registra resultados y goleadores
4. Ve tabla de posiciones y ranking automático

## 🔐 Privacidad

Cada usuario ve SOLO sus datos. Row Level Security implementado en Supabase.

## 📞 Soporte

- Supabase Docs: https://supabase.com/docs
- GitHub Pages: https://pages.github.com

---

**¡Que disfrutes el Mundial 2026! 🏆⚽**
