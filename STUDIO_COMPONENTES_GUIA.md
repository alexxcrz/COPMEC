# Guía Completa: Studio de Componentes

## Visión General
El Studio de Componentes es un diseñador asistido de 4 pasos que te guía para crear campos personalizados en tus tableros. Cada paso agrupa configuraciones lógicas para que sea fácil y sin confusiones.

---

## PASO 1: TIPO DE COMPONENTE
**Subtitle:** "Qué componente necesitas"

### Propósito
Aquí eliges **qué tipo de dato** capturará o calculará esta celda. Es el primer paso porque define todas las opciones que verás después.

### Opciones Disponibles

| Tipo | Descripción | Casos de Uso |
|------|-------------|-------------|
| **Texto** | Campo de entrada de texto libre | Comentarios, notas, descripciones |
| **Número** | Entrada numérica enteros o decimales | Cantidades, precios, conversiones |
| **Correo** | Email con validación | Contacto, notificadores |
| **Fecha** | Selector de calendario | Plazos, entregas, vencimientos |
| **Hora** | Reloj para capturar tiempo | Inicios, pausas, registros |
| **Teléfono** | Formato de número telefónico | Contactos de emergencia, clientes |
| **Booleano** | Sí/No o verdadero/falso | Confirmaciones, flags, switches |
| **Selección** | Menú desplegable de opciones | Categorías, estados, niveles |
| **Inventario** | Buscador conectado a tu catálogo | Productos, SKU, materiales |
| **Propiedad Inventario** | Trae datos del inventario automáticamente | Código, nombre, unidad de medida |
| **Fórmula** | Cálculo automático entre dos campos | Totales, conversiones, ratios |
| **Buscador con Empaque** | Inventario + 2 campos numéricos auto | Piezas/caja, cajas/tarima, bundles |

### Acción
- Click en la tarjeta del tipo que necesites
- Se resalta en azul cuando está seleccionado
- La sección "Para qué sirve" te muestra la descripción completa

---

## PASO 2: DATOS BASE
**Subtitle:** "Nombre y estructura"

### Propósito
Defines la **identidad visible** de tu componente: cómo se llama, dónde se agrupa, y qué ayuda visual le das al usuario.

### Campos

#### **Sección** *(obligatorio)*
- **Qué es:** Nombre del bloque visual en el tablero
- **Ejemplo:** "Identificación", "Validación", "Cierre", "Empaque"
- **Por qué importa:** Los campos con la misma sección se agrupan bajo un color compartido para mantener orden visual
- **Ayuda:** "Agrupa componentes relacionados para mantener el tablero ordenado"

#### **Color de Sección**
- **Qué es:** Color visual del bloque
- **Tipo:** Selector de color (palleta visual)
- **Por qué importa:** Ayuda a identificar rápidamente bloques de campos relacionados
- **Ejemplo:** Verde para identificación, Rojo para errores, Azul para datos críticos
- **Ayuda:** "Color visual rápido para identificar este bloque de columnas"

#### **Nombre Visible** *(obligatorio)*
- **Qué es:** Título que verá el equipo en la cabecera del tablero
- **Ejemplo:** "SKU", "Piezas surtidas", "Fecha de corte", "Aprobado por"
- **Por qué importa:** Es lo que ven en la pantalla; debe ser claro y breve
- **Límite:** ~25-30 caracteres para no quebrarse en la UI
- **Ayuda:** "Es el nombre que verá el equipo en la cabecera del tablero"

#### **Ayuda Corta**
- **Qué es:** Texto que aparece al pasar el mouse sobre el campo (tooltip)
- **Ejemplo:** "Selecciona el producto para autollenar datos", "Fecha límite de la gestión"
- **Por qué importa:** Guía rápida sin abandonar el tablero
- **Límite:** 1 línea legible (~50-60 caracteres)
- **Ayuda:** "Sirve para explicar rápido qué debe capturarse aquí"

#### **Placeholder**
- **Qué es:** Texto de ejemplo dentro de la celda vacía
- **Ejemplo:** "Ej: Escribe el folio", "1000", "2026-04-12", "Pendiente"
- **Por qué importa:** Muestra al usuario qué tipo de dato espera el campo
- **Aparece cuando:** La celda está vacía
- **Desaparece cuando:** El usuario escribe
- **Ayuda:** "Texto guía dentro de la celda antes de capturar algo"

#### **Valor Inicial**
- **Qué es:** Dato que se pre-rellena automáticamente en filas nuevas
- **Ejemplo:** "Pendiente", "0", "No", "2026-04-12"
- **Por qué importa:** Ahorra escritura repetitiva
- **Nota:** Si dejas vacío, la celda comienza vacía
- **Ayuda:** "Se coloca automáticamente cuando se crea una fila nueva"

#### **Ancho** *(obligatorio)*
- **Qué es:** Cuánto espacio horizontal ocupa la columna
- **Opciones disponibles:**
  - **Compacto:** ~ 80px (números, fechas)
  - **Medio:** ~150px (textos cortos)
  - **Ancho:** ~300px (descripciones, comentarios)
  - **Completo:** ~100% del ancho (solo cuando es el único campo)
- **Por qué importa:** Optimiza la legibilidad; campos numéricos no necesitan mucho espacio
- **Ayuda:** "Controla cuánto espacio visual ocupará la columna"

#### **Campo Obligatorio**
- **Qué es:** Si el usuario **debe** llenar este campo antes de guardar
- **Opciones:** Sí / No
- **Por qué importa:** Asegura datos críticos
- **Comportamiento:** Si está vacío y es obligatorio, muestra error al guardar
- **Ayuda:** "Marca la columna como clave para la operación"

---

## PASO 3: REGLAS
**Subtitle:** "Automatización y color"

### Propósito
Aquí configuras **comportamientos automáticos** y **reglas visuales**: qué hace el campo y cómo se ve según los datos.

### Secciones Dinámicas (cambian según el Tipo elegido)

#### Si elegiste "Selección" (Dropdown)

**Fuente de Menú:**
- **Qué es:** De dónde salen las opciones que ve el usuario
- **Opciones:**
  - **Manual:** Escribes las opciones a mano (separadas por coma)
  - **Catálogo:** Trae opciones del inventario
  - **Usuarios activos:** Lista de players disponibles
- **Ayuda:** "Define de dónde saldrán las opciones que verá el usuario"

**Opciones Manuales:**
- **Qué es:** Texto con opciones separadas por coma
- **Formato:** `Alta, Media, Baja` o `Rechazado, En espera, Aprobado`
- **Nota:** Se ignora si elegiste fuente "Catálogo" o "Usuarios"
- **Ayuda:** "Escribe opciones separadas por coma si no vienen de otro catálogo"

---

#### Si elegiste "Propiedad de Inventario"

**Campo Origen:**
- **Qué es:** El campo buscador de inventario del cual se extraerá la información
- **Necesita:** Que haya un campo de tipo "Inventario" antes en la tabla
- **Ejemplo:** Si creaste "Producto" (buscador), este campo pulleará código/nombre/unidad del producto
- **Ayuda:** "Elige el buscador de inventario del que se tomará la información"

**Dato de Inventario:**
- **Qué es:** Qué información exacta traes del producto
- **Opciones:** Código, Nombre, Presentación, Conversión estándar
- **Comportamiento:** Se rellena automáticamente cuando el usuario selecciona en el buscador
- **Ayuda:** "Trae automáticamente código, nombre, presentación o conversiones"

---

#### Si elegiste "Fórmula"

**Operando Izquierdo:**
- **Qué es:** El primer número/campo que participa en la fórmula
- **Tipo:** Selecciona otro campo numérico de la tabla
- **Ejemplo:** Si tienes "Cantidad", lo seleccionas aquí
- **Ayuda:** "Primer valor que participa en la operación"

**Operación:**
- **Qué es:** La operación matemática a realizar
- **Opciones:** Suma (+), Resta (-), Multiplicación (×), División (÷)
- **Ejemplo:** Cantidad × Precio = Total
- **Ayuda:** "Define cómo se calculará el resultado final"

**Operando Derecho:**
- **Qué es:** El segundo número/campo
- **Tipo:** Selecciona otro campo numérico
- **Ejemplo:** Si tienes "Precio unitario", lo seleccionas aquí
- **Ayuda:** "Segundo valor que completa la fórmula"

---

#### Reglas de Color (en casi todos los tipos)

**Condición de Color:**
- **Qué es:** La regla que dispara un color en la celda
- **Tipos de condiciones:**
  - **Comparación:** `igual a`, `no igual a`, `>`, `<`, `>=`, `<=`
  - **Texto:** `contiene`, `no contiene`, `empieza con`, `termina con`
  - **Listas:** `está en lista`, `no está en lista`
  - **Estados:** `está vacío`, `no está vacío`, `es verdadero`, `es falso`
- **Ejemplo:** "Si Estatus = Crítico → color rojo"
- **Ayuda:** "Se usa para pintar la celda cuando cumpla una regla"

**Valor de Comparación** (si aplica):
- **Qué es:** El valor contra el que se compara
- **Ejemplos:**
  - Texto: "Crítico" o "LIB" o "Urgente"
  - Número: "20" o "3.5"
  - Fecha: "2026-04-12"
  - Lista: "Alta, Media, Crítica" (separadas por coma)
- **No aparece si:** Usas "está vacío", "es verdadero", etc. (no necesitan comparación)
- **Placeholders dinámicos:** Cambian según el tipo de condición

**Color Fondo:**
- **Qué es:** Color de fondo de la celda cuando la regla es verdadera
- **Tipo:** Selector de color
- **Ejemplo:** Rojo (#ff0000) para crítico, Verde (#00ff00) para ok
- **Ayuda:** "Color del fondo cuando la regla se active"

**Color Texto:**
- **Qué es:** Color del texto (contraste) para mantener legibilidad
- **Por qué importa:** Si el fondo es rojo oscuro, el texto blanco es legible; el negro no
- **Sugerencias:** Blanco/Gris claro sobre fondos oscuros; Negro/Gris oscuro sobre fondos claros
- **Ayuda:** "Color del texto para mantener la lectura clara"

---

## PASO 4: RESUMEN
**Subtitle:** "Revisión final"

### Propósito
Es una vista previa de todo lo que acabas de configurar. **Aquí no se edita**, solo se revisa antes de confirmar.

### Información Mostrada

**Encabezado:**
- Nombre del componente
- Descripción de su propósito

**Chips informativos:**
- Tipo del componente (ej: "Tipo: Selección")
- Sección a la que pertenece (ej: "Sección: Validación")
- Ancho (ej: "Ancho: Medio")
- **[ROJO]** "Obligatorio" si está marcado
- **[VERDE]** "Valor inicial" si tiene default

**Si es Bundle (Buscador con Empaque):**
- Muestra los 3 campos que se crearán automáticamente

### Acción
- Click **"Agregar componente"** para confirmar y cerrar
- Click **"Anterior"** para volver a editar
- Click **"Cerrar"** para descartar cambios

---

## TIPS Y BUENAS PRÁCTICAS

### Organisación Visual
- Usa secciones lógicas: "Identificación", "Validación", "Cierre"
- Cada sección con un color diferente
- Agrupa campos relacionados bajo la misma sección

### Nombres Claros
- Evita abreviaturas confusas
- Usa nombres que el equipo entienda
- Ej (MAL): "FC", "PZA", "XVP" → (BIEN): "Fecha de corte", "Piezas", "Validado por"

### Campos Obligatorios
- Solo marca como obligatorio lo verdaderamente crítico
- Si todo es obligatorio, nada destaca
- Ejemplo: CódigoProducto=SÍ, Comentario=NO

### Valores Iniciales
- "Pendiente", "No", "Abierto" son buenos defaults
- Ahorran clicks repetitivos
- USA cuando el estado más común es coherente

### Ancho de Columnas
- Numéricos: Compacto (números caben en poco espacio)
- Fechas: Compacto
- Textos cortos: Medio
- Descripciones: Ancho
- Si un campo es muy importante y largo: Completo (pero cuidado, reduce espacio para otros)

### Reglas de Color
- Usa colores intuitivos: 🔴 Rojo = Crítico/Alto, 🟡 Amarillo = Atención, 🟢 Verde = Ok
- Incluye tooltip explicativo ("Sección > Ayuda corta") para que entiendan la regla
- No abuses: 1-2 reglas por campo es suficiente

### Buscadores de Inventario
- Siempre van primero (antes de "Propiedad de Inventario")
- Luego crea "Propiedad de Inventario" que trae código/nombre
- Incluye "Buscador con Empaque" si necesitas piezas/caja y cajas/tarima
- NO mezcles con fórmulas en el mismo grupo

---

## ERRORES COMUNES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| "Escribe una etiqueta para el campo" | Nombre Visible está vacío | Completa el campo "Nombre visible" (Paso 2) |
| Valor inicial no aparece | Campo diferente al que creaste | El valor inicial solo aparece en filas NUEVAS |
| Regla de color nunca se activa | Valor de comparación mal escrito | Verifica mayúsculas/minúsculas exactas |
| Buscador de inventario no carga opciones | Catálogo vacío o sin sincronizar | Suma productos al catálogo primero |
| Fórmula da error | Campos seleccionados son texto, no números | Elige solo campos numéricos (Número, fecha) |

---

## FLUJO TÍPICO: Crear un Tablero de Validación

### Paso 1 - Elige tipos:
1. Selección → "Estatus"
2. Texto → "Comentario"
3. Booleano → "Validado"
4. Inventario → "Producto"

### Paso 2 - Configura datos:
1. Estatus: Sección="Validación", Opciones={"Pendiente","Rechazado","Aprobado"}
2. Comentario: Sección="Validación", Ancho="Ancho"
3. Validado: Sección="Validación", Obligatorio="Sí"
4. Producto: Sección="Identificación", Obligatorio="Sí"

### Paso 3 - Agrega reglas:
1. Estatus: Si = "Rechazado" → Fondo rojo
2. Estatus: Si = "Aprobado" → Fondo verde
3. Validado: Si is verdadero → Fondo verde claro

### Paso 4 - Revisa y confirma

---

## ¿Necesitas Más Ayuda?
- **Para campos específicos:** Lee el tooltip de cada campo (aparece al pasar mouse)
- **Para tipos inusuales:** Ve a Paso 1 > "Para qué sirve" (describe cada tipo)
- **Para validar antes de guardar:** Usa Paso 4 como checklist final
