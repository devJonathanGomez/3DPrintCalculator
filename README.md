# 3DPrintCalculator

****3DPrintCalculator**** es una herramienta web para calcular de manera rápida y precisa el costo de una impresión 3D, considerando materiales, tiempo de trabajo, electricidad, gastos adicionales, margen de error y ganancia.
Permite manejar múltiples tipos de filamento, configurar tarifas personalizadas y obtener precios en USD y en UYU con actualización automática del tipo de cambio.

---

## ✨ Funcionalidades

- ****Gestión de configuración personalizada****
  - Costo por kWh.
  - Consumo energético de la impresora (kWh/h).
  - Costo por hora de diseño, impresión y mano de obra.
  - Amortización por horas de la impresión.
  - Gastos de mantenimiento y gastos paralelos.
  - Margen de error (%) y porcentaje de ganancia (%).
  - Valor del USD configurable u obtención automática desde `dolarapi.com`.
  - Persistencia de configuración en `localStorage`.

- ****Gestión de filamentos****
  - Agregar filamentos con: nombre, tipo, color y precio por kg.
  - Listar y eliminar filamentos guardados.
  - Selección rápida de filamentos en el formulario de cálculo.

- ****Cálculo del presupuesto****
  - Hasta 5 tipos de filamentos por impresión (con peso en gramos).
  - Cálculo de costos.
  - Aplicación de margen de error y ganancia.
  - Resultado en USD y conversión a UYU.
  - Actualización en tiempo real al modificar entradas.

- ****Interfaz dinámica****
  - Paneles configurables (mostrar/ocultar configuración y filamentos).
  - Guardado automático en navegador para sesiones futuras.

---

## 📂 Estructura del proyecto

3DPrintCalculator/  
├── index.html # Interfaz principal  
├── script.js # Lógica y cálculos  
├── styles.css # Estilos  
├── config.json # Configuración y filamentos iniciales  
└── README.md  # Documentación  

---

## 🚀 Instrucciones de uso

1.  ****Abrir la aplicación****

    *   Abre https://devjonathangomez.github.io/3DPrintCalculator/ en tu navegador.

2.  ****Configurar parámetros (opcional)****

    *   Haz clic en ****Configuración**** y completa:

        *   Precio kWh

        *   Consumo impresora (kWh/h)

        *   Diseño (USD/h), Mano de obra (USD/h), Impresión (USD/h)

        *   Amortización (USD/h), Mantenimiento (USD/mes), Gastos paralelos (USD/mes)

        *   Margen de error (%)

        *   Conversión USD → UYU (o activar la opción automática)

    *   Guarda la configuración.

3.  ****Agregar filamentos****

    *   En ****Filamentos disponibles****, añade: nombre, tipo, color y precio por kg.

    *   Los filamentos se guardarán en el navegador para futuros usos.

4.  ****Calcular presupuesto****

    *   En ****Detalles de la impresión****:

        *   Selecciona hasta 5 filamentos y especifica el peso (g) usado de cada uno.

        *   Indica horas de Diseño, Mano de obra y Impresión.

        *   Añade Packaging y Extras.

        *   Define el Porcentaje de ganancia.

    *   El desglose y el precio final (USD y UYU) se calculan automáticamente y se muestran en ****Desglose de presupuesto****.

5.  ****Persistencia****

    *   La configuración y filamentos se guardan en localStorage.

    *   Para reiniciar, borra los datos del sitio desde las herramientas del navegador.

---

## 🔧Tecnologías utilizadas

*   HTML5

*   CSS3

*   JavaScript (Vanilla)

*   localStorage para persistencia

*   API externa: dolarapi.com (opcional) para obtener la cotización USD → UYU