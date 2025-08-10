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
    const storedConfig = localStorage.getItem(CONFIG_KEY);
    const storedFilaments = localStorage.getItem(FILAMENTS_KEY);

    if (storedConfig && storedFilaments) {
        config = JSON.parse(storedConfig);
        filaments = JSON.parse(storedFilaments);
    } else {
        const response = await fetch('config.json');
        const data = await response.json();
        config = data.config;
        filaments = data.filaments;
        saveData();
    }

    populateConfigForm();
    populateFilamentList();
    populateFilamentSelects();

    const autoCheck = document.getElementById('autoUsdCheck');
    autoCheck.checked = !!config.useAutoUSD;

    toggleUsdInput();

    await fetchUSD();
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
    Object.entries(config).forEach(([key, value]) => {
        const input = form.elements[key];
        if (input) input.value = value;
    });
}

// =======================
// FUNCION PARA ACTIVAR/DESACTIVAR INPUT USD SEGÚN CHECKBOX
// =======================
function toggleUsdInput() {
    const usdInput = document.querySelector('[name="usdToUy"]');
    const autoCheck = document.getElementById('autoUsdCheck');
    usdInput.disabled = autoCheck.checked;
}

// =======================
// GUARDAR CONFIGURACIÓN DESDE EL FORMULARIO
// =======================
document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    config = Object.fromEntries(new FormData(form));
    Object.keys(config).forEach(k => config[k] = parseFloat(config[k]));
    config.useAutoUSD = document.getElementById('autoUsdCheck').checked;
    saveData();
    toggleUsdInput();
    alert('Configuración guardada');
});

// =======================
// LISTA DE FILAMENTOS DISPONIBLES
// =======================
function populateFilamentList() {
    const container = document.getElementById('filament-list');
    container.innerHTML = '';

    filaments.forEach((f, i) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div>
            <span style="background-color:${f.color}; color:${f.color}; border:1px solid black">-------</span> 
            <strong>-${f.name}</strong> (${f.type}) - 
            $${f.price}/kg
            </div>
            <button data-index="${i}">❌</button>
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            filaments.splice(parseInt(btn.dataset.index), 1);
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
    filaments.push(filament);
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
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        filaments.forEach((f, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = `
            (${f.type}) <strong>${f.name}</strong>
            `;
            select.appendChild(opt);
        });
    });
}

// =======================
// OBTENER PRECIO DEL DÓLAR DESDE dolarapi.com
// =======================
async function fetchUSD() {
    try {
        const res = await fetch('https://uy.dolarapi.com/v1/cotizaciones/usd');
        const data = await res.json();

        if (data && data.compra && data.venta) {
            const usdValue = (parseFloat(data.compra) + parseFloat(data.venta)) / 2;
            config.usdToUy = usdValue;
            document.querySelector('[name="usdToUy"]').value = usdValue.toFixed(2);
            saveData();
            calculateBudget(); // recalcular con nuevo dólar
        } else {
            alert('No se pudo obtener el valor del dólar.');
        }
    } catch (err) {
        alert('Error al obtener valor del dólar');
        console.error(err);
    }
}

// =======================
// EVENTO PARA EL CHECKBOX DE VALOR AUTOMÁTICO
// =======================
document.getElementById('autoUsdCheck').addEventListener('change', async (e) => {
    config.useAutoUSD = e.target.checked;
    saveData();
    toggleUsdInput();

    if (e.target.checked) {
        await fetchUSD();
    }
});

// =======================
// EVENTO PARA CALCULAR PRESUPUESTO EN TIEMPO REAL
// =======================
document.getElementById('print-form').addEventListener('input', calculateBudget);

// =======================
// CONFIG TOGGLE
// =======================
document.getElementById('configToggle').addEventListener('click', () => {
    document.getElementById('costos').classList.toggle('hidden');
    document.getElementById('filament').classList.toggle('hidden');
});


// =======================
// CALCULAR PRESUPUESTO
// =======================
function calculateBudget() {
    const form = document.getElementById('print-form');
    const breakdown = document.getElementById('breakdown');
    console.log(config)
    const usdToUyu = config.usdToUy;

    let design = parseFloat(form.elements['design'].value || 0);
    let labor = parseFloat(form.elements['labor'].value || 0);
    let printing = parseFloat(form.elements['printing'].value || 0);
    let packaging = parseFloat(form.elements['packaging'].value || 0);
    let extra = parseFloat(form.elements['extra'].value || 0);
    let profit = parseFloat(form.elements['profit'].value || 0);
    let errorMargin = parseFloat(config.errorMargin || 0);

    const filamentCosts = Array.from({ length: 5 }).map((_, i) => {
        const sel = form.elements[`filament_${i}`];
        const weight = parseFloat(form.elements[`weight_${i}`].value || 0);
        if (!sel || sel.value === '') return 0;
        const filament = filaments[sel.value];
        return (filament.price / 1000) * weight;
    });

    const electricity = config.kwhPrice * config.printerConsumption * printing;
    const designCost = design * config.designCostPerHour;
    const laborCost = labor * config.laborCostPerHour;
    const printCost = printing * config.printCostPerHour;
    const amortizationCost = printing * config.amortizationCostPerHour;
    const maintenance = printing * (config.maintenanceMonthly / 30 / 24);
    const parallelExpenses = printing * (config.parallelExpenses / 30 / 24);

    const varCostUSD =
        filamentCosts.reduce((a, b) => a + b, 0) +
        electricity +
        maintenance +
        parallelExpenses;

    const fixCostUSD =
        designCost +
        laborCost +
        printCost +
        amortizationCost +
        packaging +
        extra;

    const varCostAdjusted = varCostUSD * (1 + errorMargin / 100);
    const finalPriceUSD = (varCostAdjusted + fixCostUSD) * (1 + profit / 100);
    const finalPriceUYU = finalPriceUSD * usdToUyu;

    breakdown.innerHTML = `
        <p>Filamentos: $${filamentCosts.reduce((a, b) => a + b, 0).toFixed(2)}</p>
        <p>Electricidad: $${electricity.toFixed(2)}</p>
        <p>Mantenimiento: $${maintenance.toFixed(2)}</p>
        <p>Gastos paralelos: $${parallelExpenses.toFixed(2)}</p>
        <p>Diseño: $${designCost.toFixed(2)}</p>
        <p>Mano de obra: $${laborCost.toFixed(2)}</p>
        <p>Impresión: $${printCost.toFixed(2)}</p>
        <p>Packaging: $${packaging.toFixed(2)}</p>
        <p>Extras: $${extra.toFixed(2)}</p>
        <p>Total: $${(varCostUSD + fixCostUSD).toFixed(2)}</p>
        <p><strong>Total (con margen de error): $${(varCostAdjusted + fixCostUSD).toFixed(2)}</strong></p>
        <p><strong>Precio final (con ganancia): $${finalPriceUSD.toFixed(2)} / $${finalPriceUYU.toFixed(2)} UYU</strong></p>
    `;
}

// =======================
// INICIAR LA APP
// =======================
loadInitialData();
