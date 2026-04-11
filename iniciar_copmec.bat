@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Iniciando COPMEC (frontend + backend)
echo ========================================

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: No se encontro package.json en la raiz del proyecto.
  pause
  exit /b 1
)

echo Ejecutando: npm run dev
call npm run dev

if errorlevel 1 (
  echo.
  echo El comando fallo. Revisa el log de la terminal.
  pause
  exit /b 1
)

endlocal
