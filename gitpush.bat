@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Git add + commit + push (COPMEC)
echo ========================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: git no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo No existe repositorio git en esta carpeta. Se inicializara uno nuevo...
  git init
  if errorlevel 1 (
    echo ERROR: No se pudo inicializar el repositorio git.
    pause
    exit /b 1
  )
)

for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set CURRENT_ORIGIN=%%i
if "%CURRENT_ORIGIN%"=="" (
  git remote add origin https://github.com/alexxcrz/COPMEC.git
) else (
  git remote set-url origin https://github.com/alexxcrz/COPMEC.git
)

set /p COMMIT_MSG=Escribe el mensaje del commit y presiona Enter: 
if "%COMMIT_MSG%"=="" set COMMIT_MSG=update: cambios COPMEC
echo.
echo Commit: %COMMIT_MSG%
echo.

echo Construyendo frontend...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
  echo ERROR: Fallo el build del frontend.
  pause
  exit /b 1
)
cd /d "%~dp0"
echo Build completado.
echo.

git add -A

for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=master

git diff --cached --quiet
if not errorlevel 1 goto push_only

git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo crear el commit.
  pause
  exit /b 1
)

:push_only
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
  echo.
  echo ERROR: Fallo el push. Verifica autenticacion/permisos.
  pause
  exit /b 1
)

echo.
echo Push completado correctamente.
endlocal
