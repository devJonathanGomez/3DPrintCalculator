// Variables para almacenar la configuración y la lista de filamentos
let config = {};
let filaments = [];

// Claves para almacenar datos en localStorage
const CONFIG_KEY = '3d_config';
const FILAMENTS_KEY = '3d_filaments';

// =======================
// CARGA DE DATOS INICIALES
// =======================
async function loadInitialData() {
    // Verifica si ya hay datos guardados en localStorage
    const storedConfig = localStorage.getItem(CONFIG_KEY);
    const storedFilaments = localStorage.getItem(FILAMENTS_KEY);

    if (storedConfig && storedFilaments) {
        // Si hay datos, los parsea desde JSON
        config = JSON.parse(storedConfig);
        filaments = JSON.parse(storedFilaments);
    } else {
        // Si no hay datos, los carga desde el archivo config.json
        const response = await fetch('config.json');
        const data = await response.json();
        config = data.config;
        filaments = data.filaments;
        saveData(); // Guarda en localStorage
    }

    // Pinta la configuración y los filamentos en la interfaz
    populateConfigForm();
    populateFilamentList();
    populateFilamentSelects();
}

// =======================
// GUARDAR DATOS EN LOCALSTORAGE
// =======================
function saveData() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(FILAMENTS_KEY, JSON.stringify(filaments));
}

// =======================
// LLENAR FORMULARIO DE CONFIGURACIÓN
// =======================
function populateConfigForm() {
    const form = document.getElementById('config-form');
    // Recorre la configuración y pone cada valor en su input correspondiente
    Object.entries(config).forEach(([key, value]) => {
        const input = form.elements[key];
        if (input) input.value = value;
    });
}

// =======================
// GUARDAR CONFIGURACIÓN DESDE EL FORMULARIO
// =======================
document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    // Convierte el formulario en un objeto
    config = Object.fromEntries(new FormData(form));
    // Convierte todos los valores a números
    Object.keys(config).forEach(k => config[k] = parseFloat(config[k]));
    saveData();
    alert('Configuración guardada');
});

// =======================
// LISTA DE FILAMENTOS DISPONIBLES
// =======================
function populateFilamentList() {
    const container = document.getElementById('filament-list');
    container.innerHTML = '';

    // Crea un bloque por cada filamento
    filaments.forEach((f, i) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <strong>${f.name}</strong> (${f.type}) - 
            <span style="color:${f.color}">${f.color}</span> - 
            $${f.price}/kg
            <button data-index="${i}">Eliminar</button>
        `;
        container.appendChild(div);
    });

    // Asigna eventos para eliminar filamentos
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            filaments.splice(parseInt(btn.dataset.index), 1); // Elimina por índice
            saveData();
            populateFilamentList();
            populateFilamentSelects();
        });
    });
}

// =======================
// AGREGAR UN FILAMENTO NUEVO
// =======================
document.getElementById('add-filament-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const filament = Object.fromEntries(new FormData(form));
    filament.price = parseFloat(filament.price);
    filaments.push(filament); // Agrega a la lista
    form.reset();
    saveData();
    populateFilamentList();
    populateFilamentSelects();
});

// =======================
// LLENAR SELECTS DE FILAMENTOS
// =======================
function populateFilamentSelects() {
    const selects = document.querySelectorAll('#used-filaments select');
    selects.forEach(select => {
        // Opción por defecto
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        // Agrega todas las opciones de filamentos
        filaments.forEach((f, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${f.name} (${f.type})`;
            select.appendChild(opt);
        });
    });
}

// =======================
// EVENTO PARA CALCULAR PRESUPUESTO EN TIEMPO REAL
// =======================
document.getElementById('print-form').addEventListener('input', calculateBudget);

// =======================
// CALCULAR PRESUPUESTO
// =======================
function calculateBudget() {
    const form = document.getElementById('print-form');
    const breakdown = document.getElementById('breakdown');
    const usdToUyu = config.usdToUyi || 0;

    // Obtiene valores del formulario de impresión
    let design = parseFloat(form.elements['design'].value || 0);
    let labor = parseFloat(form.elements['labor'].value || 0);
    let printing = parseFloat(form.elements['printing'].value || 0);
    let packaging = parseFloat(form.elements['packaging'].value || 0);
    let extra = parseFloat(form.elements['extra'].value || 0);
    let profit = parseFloat(form.elements['profit'].value || 0);
    let errorMargin = parseFloat(config.errorMargin || 0);

    // Calcula costo de los filamentos usados
    const filamentCosts = Array.from({ length: 5 }).map((_, i) => {
        const sel = form.elements[`filament_${i}`];
        const weight = parseFloat(form.elements[`weight_${i}`].value || 0);
        if (!sel || sel.value === '') return 0; // Si no se seleccionó, no suma
        const filament = filaments[sel.value];
        return (filament.price / 1000) * weight; // Precio proporcional por gramos
    });

    // Costos base
    const electricity = config.kwhPrice * config.printerConsumption * printing;
    const designCost = design * config.designCostPerHour;
    const laborCost = labor * config.laborCostPerHour;
    const printCost = printing * config.printCostPerHour;
    const maintenance = printing * (config.maintenanceMonthly / 30 / 24); // Costo proporcional
    const extrasMonthly = (config.extrasMonthly / 30); // Costo diario

    // Suma de todos los costos
    const totalCostUSD =
        electricity +
        designCost +
        laborCost +
        printCost +
        maintenance +
        extrasMonthly +
        packaging +
        extra +
        filamentCosts.reduce((a, b) => a + b, 0);

    // Aplica margen de error y ganancia
    const errorAdjusted = totalCostUSD * (1 + errorMargin / 100);
    const finalPriceUSD = errorAdjusted * (1 + profit / 100);
    const finalPriceUYU = finalPriceUSD * usdToUyu;

    // Muestra desglose en pantalla
    breakdown.innerHTML = `
        <p>Electricidad: $${electricity.toFixed(2)}</p>
        <p>Diseño: $${designCost.toFixed(2)}</p>
        <p>Mano de obra: $${laborCost.toFixed(2)}</p>
        <p>Impresión: $${printCost.toFixed(2)}</p>
        <p>Filamentos: $${filamentCosts.reduce((a, b) => a + b, 0).toFixed(2)}</p>
        <p>Mantenimiento: $${maintenance.toFixed(2)}</p>
        <p>Extras mensuales: $${extrasMonthly.toFixed(2)}</p>
        <p>Packaging: $${packaging.toFixed(2)}</p>
        <p>Extras: $${extra.toFixed(2)}</p>
        <p>Total: $${totalCostUSD.toFixed(2)}</p>
        <p><strong>Total (con margen de error): $${errorAdjusted.toFixed(2)}</strong></p>
        <p><strong>Precio final (con ganancia): $${finalPriceUSD.toFixed(2)} / $${finalPriceUYU.toFixed(2)} UYU</strong></p>
    `;
}

// =======================
// INICIAR LA APP
// =======================
loadInitialData();
