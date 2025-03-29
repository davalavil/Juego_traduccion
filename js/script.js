// --- Referencias a Elementos del DOM (Verificar que existen) ---
const btnModoIngEsp = document.getElementById('btn-modo-ing-esp');
const btnModoEspIng = document.getElementById('btn-modo-esp-ing');
const btnCopiar = document.getElementById('btn-copiar');
const btnBorrar = document.getElementById('btn-borrar');
const btnMostrarLista = document.getElementById('btn-mostrar-lista');
const modoActualDisplay = document.getElementById('modo-actual');
const areaJuego = document.getElementById('area-juego');
const listaPalabrasDiv = document.getElementById('lista-palabras');
const contenidoListaDiv = document.getElementById('contenido-lista');
const listaInfoP = document.getElementById('lista-info');
const estadoGeneracionDiv = document.getElementById('estado-generacion');
const unidadesBotonesContainer = document.getElementById('unidades-botones-container');
const btnSelectAll = document.getElementById('btn-select-all');
const btnDeselectAll = document.getElementById('btn-deselect-all');
const numPalabrasSlider = document.getElementById('num-palabras-slider');
const numPalabrasInput = document.getElementById('num-palabras-input');
const numPalabrasValorSpan = document.getElementById('num-palabras-valor');

// --- Estado del Juego ---
let modo = 'ing-esp';
let palabrasActuales = [];

// --- Texto Inicial (CORREGIDO) ---
const textoInicial = '<p>Selecciona configuración y haz clic en "Palabras a traducir" para empezar.</p>';

// --- Funciones ---

function obtenerListaFuente() {
    if (typeof listaIngEsp === 'undefined' || typeof listaEspIng === 'undefined') {
        console.error("Error: Las listas de palabras (listaIngEsp o listaEspIng) no están definidas.");
        return [];
    }
    return modo === 'ing-esp' ? listaIngEsp : listaEspIng;
}

function obtenerClaves() {
    return modo === 'ing-esp' ? { mostrar: 'eng', traducir: 'esp' } : { mostrar: 'esp', traducir: 'eng' };
}

// --- LÓGICA UNIDADES CON BOTONES ---
function obtenerUnidadesDisponibles() {
    const unidades = new Set();
    const lista1 = (typeof listaIngEsp !== 'undefined' ? listaIngEsp : []);
    const lista2 = (typeof listaEspIng !== 'undefined' ? listaEspIng : []);
    const listaCompleta = lista1.concat(lista2);
    listaCompleta.forEach(p => { if (p && p.unit) unidades.add(p.unit); });
    return Array.from(unidades).sort((a, b) => {
        const matchA = a.match(/File (\d+)/);
        const matchB = b.match(/File (\d+)/);
        if (matchA && matchB) return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
        return a.localeCompare(b);
    });
}

function renderizarBotonesUnidades() {
    if (!unidadesBotonesContainer) { console.error("Error: Contenedor de botones de unidad no encontrado."); return; }
    unidadesBotonesContainer.innerHTML = '';
    const unidades = obtenerUnidadesDisponibles();
    unidades.forEach(unidad => {
        const button = document.createElement('button');
        button.classList.add('unidad-btn', 'selected');
        button.textContent = unidad;
        button.dataset.unidad = unidad;
        button.addEventListener('click', () => { button.classList.toggle('selected'); });
        unidadesBotonesContainer.appendChild(button);
    });
}

function toggleAllUnidades(seleccionar) {
    if (!unidadesBotonesContainer) return;
    const botones = unidadesBotonesContainer.querySelectorAll('.unidad-btn');
    botones.forEach(btn => {
        if (seleccionar) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function obtenerUnidadesSeleccionadas() {
    const unidades = [];
    if (!unidadesBotonesContainer) return unidades;
    const botonesSeleccionados = unidadesBotonesContainer.querySelectorAll('.unidad-btn.selected');
    botonesSeleccionados.forEach(btn => { unidades.push(btn.dataset.unidad); });
    return unidades;
}
// --- FIN LÓGICA UNIDADES ---

// --- LÓGICA SLIDER/INPUT ---
function sincronizarNumPalabras(sourceElement) {
    if (!numPalabrasSlider || !numPalabrasInput || !numPalabrasValorSpan) { console.error("Error: Elementos del slider/input no encontrados."); return; }
    let valor = parseInt(sourceElement.value, 10);
    const min = parseInt(numPalabrasSlider.min, 10);
    const max = parseInt(numPalabrasSlider.max, 10);
    if (isNaN(valor)) valor = parseInt(numPalabrasSlider.value, 10) || min;
    valor = Math.max(min, Math.min(valor, max));
    numPalabrasSlider.value = valor;
    numPalabrasInput.value = valor;
    numPalabrasValorSpan.textContent = valor;
    if (sourceElement.type === 'number' && sourceElement.value !== valor.toString()) {
        requestAnimationFrame(() => { if (parseInt(numPalabrasInput.value, 10) !== valor) numPalabrasInput.value = valor; });
    }
}
// --- FIN LÓGICA NÚMERO PALABRAS ---

function barajarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- GENERAR PALABRAS ---
function generarPalabras() {
    if (!areaJuego || !estadoGeneracionDiv) { console.error("Error fatal: área de juego o div de estado no encontrado."); return; }
    areaJuego.innerHTML = '';
    palabrasActuales = [];
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = '';

    const unidadesSeleccionadas = obtenerUnidadesSeleccionadas();
    if (unidadesSeleccionadas.length === 0) {
        areaJuego.innerHTML = '<p style="color: red; text-align: center;">⚠️ Debes seleccionar al menos una unidad.</p>';
        return;
    }

    let numPalabrasSolicitadas = 10;
    if (numPalabrasInput) {
        numPalabrasSolicitadas = parseInt(numPalabrasInput.value, 10);
        const min = parseInt(numPalabrasInput.min, 10);
        const max = parseInt(numPalabrasInput.max, 10);
         if(isNaN(numPalabrasSolicitadas) || numPalabrasSolicitadas < min || numPalabrasSolicitadas > max) {
            console.warn("Valor inválido en numPalabrasInput al generar, usando 10.");
            numPalabrasSolicitadas = 10;
            sincronizarNumPalabras(numPalabrasInput);
         }
    } else {
        console.warn("Input de número de palabras no encontrado, usando 10.");
    }

    let listaFiltrada = obtenerListaFuente();
    if (!listaFiltrada || listaFiltrada.length === 0) { areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo.</p>'; return; }
    listaFiltrada = listaFiltrada.filter(palabra => palabra && palabra.unit && unidadesSeleccionadas.includes(palabra.unit));

    let numPalabrasASeleccionar = numPalabrasSolicitadas;
    let todasLasUnidadesDisponibles = obtenerUnidadesDisponibles();
    let unidadesTexto = unidadesSeleccionadas.length === todasLasUnidadesDisponibles.length ? 'Todas' : unidadesSeleccionadas.join(', ');
    let mensajeEstado = `Solicitadas: ${numPalabrasSolicitadas}. Unidades: ${unidadesTexto}. `;

    if (listaFiltrada.length === 0) {
        areaJuego.innerHTML = `<p style="color: orange; text-align: center;">ℹ️ No se encontraron palabras para las unidades seleccionadas (${unidadesTexto}) en el modo actual.</p>`;
        estadoGeneracionDiv.textContent = '';
        return;
    } else if (listaFiltrada.length < numPalabrasSolicitadas) {
        numPalabrasASeleccionar = listaFiltrada.length;
        mensajeEstado += `Mostrando ${numPalabrasASeleccionar} (todas las disponibles).`;
    } else {
         mensajeEstado += `Mostrando ${numPalabrasASeleccionar}.`;
    }
    estadoGeneracionDiv.textContent = mensajeEstado;

    const palabrasSeleccionadas = barajarArray([...listaFiltrada]).slice(0, numPalabrasASeleccionar);
    palabrasActuales = palabrasSeleccionadas;

    const claves = obtenerClaves();
    palabrasSeleccionadas.forEach((palabra, index) => {
        const fila = document.createElement('div');
        fila.classList.add('fila-palabra');
        fila.id = `fila-${index}`;
        const palabraMostrada = document.createElement('div');
        palabraMostrada.classList.add('palabra-mostrada');
        palabraMostrada.textContent = palabra && palabra[claves.mostrar] ? palabra[claves.mostrar] : 'Error';
        const unidadDiv = document.createElement('div');
        unidadDiv.classList.add('unidad');
        unidadDiv.textContent = palabra && palabra.unit ? `(${palabra.unit})` : '';
        const inputRespuesta = document.createElement('input');
        inputRespuesta.type = 'text';
        inputRespuesta.classList.add('respuesta-usuario');
        inputRespuesta.id = `respuesta-${index}`;
        inputRespuesta.dataset.correcta = palabra && palabra[claves.traducir] ? palabra[claves.traducir] : '';
        inputRespuesta.addEventListener('input', comprobarRespuesta);
        const resultadoDiv = document.createElement('div');
        resultadoDiv.classList.add('resultado');
        resultadoDiv.id = `resultado-${index}`;
        fila.appendChild(palabraMostrada);
        fila.appendChild(unidadDiv);
        fila.appendChild(inputRespuesta);
        fila.appendChild(resultadoDiv);
        areaJuego.appendChild(fila);
    });
}

// Comprobar respuesta
function comprobarRespuesta(evento) {
    const input = evento.target;
    const respuestaUsuario = input.value.trim();
    const respuestaCorrecta = input.dataset.correcta ? input.dataset.correcta.trim() : '';
    const index = input.id.split('-')[1];
    const resultadoDiv = document.getElementById(`resultado-${index}`);
    if (!resultadoDiv) return;

    if (respuestaCorrecta === '' && respuestaUsuario !== '') { resultadoDiv.textContent = '?'; resultadoDiv.className = 'resultado'; return; }
    if (respuestaUsuario === '') { resultadoDiv.textContent = ''; resultadoDiv.className = 'resultado'; return; }
    if (respuestaUsuario.toLowerCase() === respuestaCorrecta.toLowerCase()) { resultadoDiv.textContent = 'SÍ'; resultadoDiv.className = 'resultado resultado-correcto'; }
    else { resultadoDiv.textContent = 'NO'; resultadoDiv.className = 'resultado resultado-incorrecto'; }
}

// Borrar respuestas
function borrarRespuestas() {
    if (!areaJuego || !estadoGeneracionDiv) return;
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');
    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => { if(resultado) { resultado.textContent = ''; resultado.className = 'resultado'; } });
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = '';
}

// Mostrar/Ocultar Lista
function toggleLista() {
    if (!listaPalabrasDiv || !listaInfoP || !contenidoListaDiv) return;
    listaPalabrasDiv.classList.toggle('oculto');
    listaInfoP.textContent = '';

    if (!listaPalabrasDiv.classList.contains('oculto')) {
        contenidoListaDiv.innerHTML = '';
        let listaFuente = obtenerListaFuente();
        const claves = obtenerClaves();
        const unidadesSeleccionadasLista = obtenerUnidadesSeleccionadas();
        let infoUnidades = "Ninguna unidad seleccionada";
        let todasLasUnidadesDisponibles = obtenerUnidadesDisponibles();

         if (unidadesSeleccionadasLista.length > 0) {
            listaFuente = listaFuente.filter(palabra => palabra && palabra.unit && unidadesSeleccionadasLista.includes(palabra.unit));
             if (unidadesSeleccionadasLista.length === todasLasUnidadesDisponibles.length) infoUnidades = "Todas las unidades";
             else infoUnidades = `Unidades: ${unidadesSeleccionadasLista.join(', ')}`;
         } else {
             listaFuente = [];
         }
         listaInfoP.textContent = `Mostrando lista para: ${infoUnidades}.`;

        if (listaFuente && listaFuente.length > 0) {
            const listaOrdenada = [...listaFuente].sort((a, b) => { const valA = a && a[claves.mostrar] ? a[claves.mostrar] : ''; const valB = b && b[claves.mostrar] ? b[claves.mostrar] : ''; return valA.localeCompare(valB); });
            listaOrdenada.forEach(palabra => {
                const p = document.createElement('p');
                const pMostrada = palabra && palabra[claves.mostrar] ? palabra[claves.mostrar] : '?';
                const pUnit = palabra && palabra.unit ? palabra.unit : '?';
                const pTraducida = palabra && palabra[claves.traducir] ? palabra[claves.traducir] : '?';
                p.textContent = `${pMostrada} (${pUnit}) = ${pTraducida}`;
                contenidoListaDiv.appendChild(p);
            });
        } else if (unidadesSeleccionadasLista.length > 0) { contenidoListaDiv.innerHTML = '<p>No hay palabras para mostrar con la selección actual.</p>'; }
        else { contenidoListaDiv.innerHTML = '<p>Selecciona unidades para ver la lista.</p>'; }
    }
}

// Cambiar modo
function cambiarModo(nuevoModo) {
    if (modo === nuevoModo) return;
    modo = nuevoModo;
    if(modoActualDisplay) modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    // Usar la constante con el texto corregido
    if(areaJuego) areaJuego.innerHTML = textoInicial;
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    if(estadoGeneracionDiv) estadoGeneracionDiv.textContent = '';
}


// --- Asignación de Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    const checkElements = [ btnModoIngEsp, btnModoEspIng, btnCopiar, btnBorrar, btnMostrarLista, modoActualDisplay, areaJuego, listaPalabrasDiv, contenidoListaDiv, listaInfoP, estadoGeneracionDiv, unidadesBotonesContainer, btnSelectAll, btnDeselectAll, numPalabrasSlider, numPalabrasInput, numPalabrasValorSpan ];
    if (checkElements.some(el => el === null)) { console.error("Error Crítico: Faltan elementos HTML."); if (areaJuego) areaJuego.innerHTML = "<p style='color:red; font-weight:bold;'>Error: La página no se cargó correctamente.</p>"; return; }

    btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
    btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
    btnCopiar.addEventListener('click', generarPalabras);
    btnBorrar.addEventListener('click', borrarRespuestas);
    btnMostrarLista.addEventListener('click', toggleLista);
    btnSelectAll.addEventListener('click', () => toggleAllUnidades(true));
    btnDeselectAll.addEventListener('click', () => toggleAllUnidades(false));
    numPalabrasSlider.addEventListener('input', () => sincronizarNumPalabras(numPalabrasSlider));
    numPalabrasInput.addEventListener('input', () => sincronizarNumPalabras(numPalabrasInput));
    numPalabrasInput.addEventListener('change', () => sincronizarNumPalabras(numPalabrasInput));

    // --- Inicialización Final ---
    renderizarBotonesUnidades();
    sincronizarNumPalabras(numPalabrasSlider); // Establecer valor inicial del span/input
    // Usar la constante con el texto corregido
    areaJuego.innerHTML = textoInicial;
});
