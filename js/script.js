// --- Referencias a Elementos del DOM ---
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

// --- Nuevas Referencias para Configuración ---
const unidadesBotonesContainer = document.getElementById('unidades-botones-container');
const btnSelectAll = document.getElementById('btn-select-all');
const btnDeselectAll = document.getElementById('btn-deselect-all');
const numPalabrasSlider = document.getElementById('num-palabras-slider');
const numPalabrasInput = document.getElementById('num-palabras-input');
const numPalabrasValorSpan = document.getElementById('num-palabras-valor');

// --- Estado del Juego ---
let modo = 'ing-esp';
let palabrasActuales = [];
// El número de palabras ahora se lee directamente de los inputs

// --- Funciones ---

function obtenerListaFuente() {
    if (typeof listaIngEsp === 'undefined' || typeof listaEspIng === 'undefined') {
        console.error("Error: Las listas de palabras no están definidas.");
        return [];
    }
    return modo === 'ing-esp' ? listaIngEsp : listaEspIng;
}

function obtenerClaves() {
    return modo === 'ing-esp' ? { mostrar: 'eng', traducir: 'esp' } : { mostrar: 'esp', traducir: 'eng' };
}

// --- LÓGICA MEJORADA PARA UNIDADES CON BOTONES ---

function obtenerUnidadesDisponibles() {
    const unidades = new Set();
    if (typeof listaIngEsp !== 'undefined') {
        listaIngEsp.forEach(p => { if (p.unit) unidades.add(p.unit); });
    }
    if (typeof listaEspIng !== 'undefined') {
        listaEspIng.forEach(p => { if (p.unit) unidades.add(p.unit); });
    }
    return Array.from(unidades).sort((a, b) => {
         // Ordenar numéricamente si son del tipo "File X"
        const matchA = a.match(/File (\d+)/);
        const matchB = b.match(/File (\d+)/);
        if (matchA && matchB) {
            return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
        }
        return a.localeCompare(b); // Orden alfabético normal para otros casos
    });
}

// Crea los BOTONES para cada unidad
function renderizarBotonesUnidades() {
    if (!unidadesBotonesContainer) return;
    unidadesBotonesContainer.innerHTML = ''; // Limpiar
    const unidades = obtenerUnidadesDisponibles();

    unidades.forEach(unidad => {
        const button = document.createElement('button');
        button.classList.add('unidad-btn');
        button.textContent = unidad;
        button.dataset.unidad = unidad; // Guardar el valor en data attribute
        button.classList.add('selected'); // Empezar seleccionadas por defecto

        // Event listener para Togglar selección
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
        });

        unidadesBotonesContainer.appendChild(button);
    });
}

// Selecciona o deselecciona todos los botones de unidad
function toggleAllUnidades(seleccionar) {
    const botones = unidadesBotonesContainer.querySelectorAll('.unidad-btn');
    botones.forEach(btn => {
        if (seleccionar) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Obtiene las unidades actualmente seleccionadas (leyendo los botones)
function obtenerUnidadesSeleccionadas() {
    const unidades = [];
    const botonesSeleccionados = unidadesBotonesContainer.querySelectorAll('.unidad-btn.selected');
    botonesSeleccionados.forEach(btn => {
        unidades.push(btn.dataset.unidad);
    });
    return unidades;
}

// --- FIN LÓGICA UNIDADES CON BOTONES ---

// --- LÓGICA PARA SLIDER/INPUT NÚMERO DE PALABRAS ---
function sincronizarNumPalabras(sourceElement) {
    if (!numPalabrasSlider || !numPalabrasInput || !numPalabrasValorSpan) return;
    let valor = parseInt(sourceElement.value, 10);
    const min = parseInt(numPalabrasSlider.min, 10);
    const max = parseInt(numPalabrasSlider.max, 10);

    // Validar y corregir valor
    if (isNaN(valor)) valor = min;
    if (valor < min) valor = min;
    if (valor > max) valor = max;

    // Actualizar ambos inputs y el span
    numPalabrasSlider.value = valor;
    numPalabrasInput.value = valor;
    numPalabrasValorSpan.textContent = valor;

     // Si la fuente era el input y el valor era inválido, corregirlo
    if (sourceElement.type === 'number' && sourceElement.value !== valor.toString()) {
         sourceElement.value = valor;
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

// --- GENERAR PALABRAS (Adaptado a botones y slider) ---
function generarPalabras() {
    areaJuego.innerHTML = '';
    palabrasActuales = [];
    listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = '';

    // 1. Obtener Unidades Seleccionadas (de los botones)
    const unidadesSeleccionadas = obtenerUnidadesSeleccionadas();
    if (unidadesSeleccionadas.length === 0) {
        areaJuego.innerHTML = '<p style="color: red;">Error: Debes seleccionar al menos una unidad.</p>';
        return;
    }

    // 2. Obtener Número de Palabras (del input numérico sincronizado)
    let numPalabrasSolicitadas = 10; // Default
     if (numPalabrasInput) {
        numPalabrasSolicitadas = parseInt(numPalabrasInput.value, 10);
        // La validación ya se hace en sincronizarNumPalabras, pero aseguramos
        const min = parseInt(numPalabrasInput.min, 10);
        const max = parseInt(numPalabrasInput.max, 10);
         if (isNaN(numPalabrasSolicitadas) || numPalabrasSolicitadas < min || numPalabrasSolicitadas > max) {
             numPalabrasSolicitadas = 10; // Reset a default si algo falla
             numPalabrasInput.value = 10;
             numPalabrasSlider.value = 10;
             numPalabrasValorSpan.textContent = 10;
         }
    }


    // 3. Obtener y Filtrar Lista Fuente
    let listaFiltrada = obtenerListaFuente();
    if (!listaFiltrada || listaFiltrada.length === 0) {
        areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo.</p>';
        return;
    }
    listaFiltrada = listaFiltrada.filter(palabra => palabra.unit && unidadesSeleccionadas.includes(palabra.unit));


    // 4. Verificar si hay suficientes palabras y ajustar
    let numPalabrasASeleccionar = numPalabrasSolicitadas;
    let mensajeEstado = `Solicitadas: ${numPalabrasSolicitadas}. Unidades: ${unidadesSeleccionadas.join(', ')}. `;
    if (listaFiltrada.length === 0) {
        areaJuego.innerHTML = `<p style="color: orange;">No se encontraron palabras para las unidades seleccionadas (${unidadesSeleccionadas.join(', ')}) en el modo actual.</p>`;
        estadoGeneracionDiv.textContent = '';
        return;
    } else if (listaFiltrada.length < numPalabrasSolicitadas) {
        numPalabrasASeleccionar = listaFiltrada.length;
        mensajeEstado += `Mostrando ${numPalabrasASeleccionar} (todas las disponibles).`;
    } else {
         mensajeEstado += `Mostrando ${numPalabrasASeleccionar}.`;
    }
    estadoGeneracionDiv.textContent = mensajeEstado;

    // 5. Barajar y Seleccionar
    const palabrasSeleccionadas = barajarArray([...listaFiltrada]).slice(0, numPalabrasASeleccionar);
    palabrasActuales = palabrasSeleccionadas;

    // 6. Renderizar las palabras (igual que antes)
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


// Comprobar respuesta (sin cambios)
function comprobarRespuesta(evento) {
    const input = evento.target;
    const respuestaUsuario = input.value.trim();
    const respuestaCorrecta = input.dataset.correcta.trim();
    const index = input.id.split('-')[1];
    const resultadoDiv = document.getElementById(`resultado-${index}`);
    if (respuestaCorrecta === '' && respuestaUsuario !== '') {
         resultadoDiv.textContent = '?';
         resultadoDiv.className = 'resultado';
         return
    }
    if (respuestaUsuario === '') {
        resultadoDiv.textContent = '';
        resultadoDiv.className = 'resultado';
        return;
    }
    if (respuestaUsuario.toLowerCase() === respuestaCorrecta.toLowerCase()) {
        resultadoDiv.textContent = 'SÍ';
        resultadoDiv.className = 'resultado resultado-correcto';
    } else {
        resultadoDiv.textContent = 'NO';
        resultadoDiv.className = 'resultado resultado-incorrecto';
    }
}

// Borrar respuestas (sin cambios)
function borrarRespuestas() {
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');
    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => {
        resultado.textContent = '';
        resultado.className = 'resultado';
    });
     listaPalabrasDiv.classList.add('oculto');
     estadoGeneracionDiv.textContent = '';
}

// --- MOSTRAR LISTA (Adaptado a botones) ---
function toggleLista() {
    listaPalabrasDiv.classList.toggle('oculto');
    listaInfoP.textContent = '';

    if (!listaPalabrasDiv.classList.contains('oculto')) {
        contenidoListaDiv.innerHTML = '';
        let listaFuente = obtenerListaFuente();
        const claves = obtenerClaves();

        // Filtrar la lista mostrada según las unidades seleccionadas (botones)
        const unidadesSeleccionadasLista = obtenerUnidadesSeleccionadas();
        let infoUnidades = "Ninguna unidad seleccionada";

         if (unidadesSeleccionadasLista.length > 0) {
            listaFuente = listaFuente.filter(palabra => palabra.unit && unidadesSeleccionadasLista.includes(palabra.unit));
            // Comprobar si todas las disponibles están seleccionadas
             const todasDisponibles = obtenerUnidadesDisponibles();
             if (unidadesSeleccionadasLista.length === todasDisponibles.length) {
                 infoUnidades = "Todas las unidades";
             } else {
                infoUnidades = `Unidades: ${unidadesSeleccionadasLista.join(', ')}`;
             }
         } else {
             listaFuente = []; // Vaciar lista si no hay unidades
         }
         listaInfoP.textContent = `Mostrando lista para: ${infoUnidades}.`;


        if (listaFuente && listaFuente.length > 0) {
            const listaOrdenada = [...listaFuente].sort((a, b) => {
                const palabraA = a[claves.mostrar] || '';
                const palabraB = b[claves.mostrar] || '';
                return palabraA.localeCompare(palabraB);
            });
            listaOrdenada.forEach(palabra => {
                const p = document.createElement('p');
                p.textContent = `${palabra[claves.mostrar]} (${palabra.unit || ''}) = ${palabra[claves.traducir]}`;
                contenidoListaDiv.appendChild(p);
            });
        } else if (unidadesSeleccionadasLista.length > 0) {
             contenidoListaDiv.innerHTML = '<p>No hay palabras para mostrar con la selección actual.</p>';
        } else {
            contenidoListaDiv.innerHTML = '<p>Selecciona unidades para ver la lista.</p>';
        }
    }
}


// Cambiar modo (sin cambios relevantes, limpia estado)
function cambiarModo(nuevoModo) {
    if (modo === nuevoModo) return;
    modo = nuevoModo;
    modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras".</p>';
    listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = '';
}


// --- Asignación de Eventos ---
if (btnModoIngEsp) btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
if (btnModoEspIng) btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
if (btnCopiar) btnCopiar.addEventListener('click', generarPalabras);
if (btnBorrar) btnBorrar.addEventListener('click', borrarRespuestas);
if (btnMostrarLista) btnMostrarLista.addEventListener('click', toggleLista);

// --- NUEVOS Event Listeners para Configuración ---
if (btnSelectAll) btnSelectAll.addEventListener('click', () => toggleAllUnidades(true));
if (btnDeselectAll) btnDeselectAll.addEventListener('click', () => toggleAllUnidades(false));

// Sincronizar Slider y Input numérico
if (numPalabrasSlider) {
    numPalabrasSlider.addEventListener('input', () => sincronizarNumPalabras(numPalabrasSlider));
}
if (numPalabrasInput) {
    numPalabrasInput.addEventListener('input', () => sincronizarNumPalabras(numPalabrasInput));
     // Asegurar que el valor inicial se muestre correctamente
    numPalabrasInput.addEventListener('change', () => sincronizarNumPalabras(numPalabrasInput)); // Para cambios al perder foco
}


// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar botones de unidades al cargar
    renderizarBotonesUnidades();

     // Sincronizar y mostrar valor inicial del número de palabras
     if (numPalabrasSlider) sincronizarNumPalabras(numPalabrasSlider);

    // Mensaje inicial
    if (areaJuego) {
        areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras" para empezar.</p>';
    } else {
        console.error("Error: No se encontró el elemento 'area-juego'.");
    }
});
