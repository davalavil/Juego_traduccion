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

// --- LÓGICA UNIDADES CON BOTONES (CORREGIDA) ---

function obtenerUnidadesDisponibles() {
    const unidades = new Set();
    // Asegurarse que las listas existen antes de concatenar
    const lista1 = (typeof listaIngEsp !== 'undefined' ? listaIngEsp : []);
    const lista2 = (typeof listaEspIng !== 'undefined' ? listaEspIng : []);
    const listaCompleta = lista1.concat(lista2);

    listaCompleta.forEach(p => { if (p && p.unit) unidades.add(p.unit); });

    return Array.from(unidades).sort((a, b) => {
        const matchA = a.match(/File (\d+)/);
        const matchB = b.match(/File (\d+)/);
        if (matchA && matchB) {
            return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
        }
        return a.localeCompare(b);
    });
}

function renderizarBotonesUnidades() {
    if (!unidadesBotonesContainer) {
        console.error("Error: Contenedor de botones de unidad no encontrado.");
        return;
    }
    unidadesBotonesContainer.innerHTML = '';
    const unidades = obtenerUnidadesDisponibles();

    unidades.forEach(unidad => {
        const button = document.createElement('button');
        button.classList.add('unidad-btn', 'selected'); // Empezar seleccionadas
        button.textContent = unidad;
        button.dataset.unidad = unidad;

        button.addEventListener('click', () => {
            button.classList.toggle('selected');
        });

        unidadesBotonesContainer.appendChild(button);
    });
}

function toggleAllUnidades(seleccionar) {
    if (!unidadesBotonesContainer) return;
    const botones = unidadesBotonesContainer.querySelectorAll('.unidad-btn');
    botones.forEach(btn => {
        if (seleccionar) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function obtenerUnidadesSeleccionadas() {
    const unidades = [];
    if (!unidadesBotonesContainer) return unidades;
    const botonesSeleccionados = unidadesBotonesContainer.querySelectorAll('.unidad-btn.selected');
    botonesSeleccionados.forEach(btn => {
        unidades.push(btn.dataset.unidad);
    });
    return unidades;
}
// --- FIN LÓGICA UNIDADES ---

// --- LÓGICA SLIDER/INPUT (REVISADA Y ASEGURADA) ---
function sincronizarNumPalabras(sourceElement) {
    if (!numPalabrasSlider || !numPalabrasInput || !numPalabrasValorSpan) {
        console.error("Error: Elementos del slider/input no encontrados.");
        return; // Salir si falta algún elemento
    }

    let valor = parseInt(sourceElement.value, 10);
    const min = parseInt(numPalabrasSlider.min, 10);
    const max = parseInt(numPalabrasSlider.max, 10);

    if (isNaN(valor)) {
        valor = parseInt(numPalabrasSlider.value, 10) || min; // Usar valor del otro o min si NaN
    }
    // Asegurar que está dentro de los límites
    valor = Math.max(min, Math.min(valor, max));

    // Actualizar todos
    numPalabrasSlider.value = valor;
    numPalabrasInput.value = valor;
    numPalabrasValorSpan.textContent = valor;

    // Corregir input si era la fuente y el valor cambió por validación
    if (sourceElement.type === 'number' && sourceElement.value !== valor.toString()) {
        // Usar requestAnimationFrame para asegurar que se actualice después del evento actual
        requestAnimationFrame(() => {
             if (parseInt(numPalabrasInput.value, 10) !== valor) {
                numPalabrasInput.value = valor;
             }
        });
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

// --- GENERAR PALABRAS (Usa las funciones corregidas) ---
function generarPalabras() {
    if (!areaJuego || !estadoGeneracionDiv) {
         console.error("Error fatal: área de juego o div de estado no encontrado.");
         return;
    }
    areaJuego.innerHTML = ''; // Limpiar siempre primero
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
            // Sincronizar de vuelta por si acaso
             sincronizarNumPalabras(numPalabrasInput);
         }
    } else {
        console.warn("Input de número de palabras no encontrado, usando 10.");
    }

    let listaFiltrada = obtenerListaFuente();
    if (!listaFiltrada || listaFiltrada.length === 0) {
        areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo.</p>';
        return;
    }
    // Asegurarse que el filtro funciona aunque palabra.unit no exista en algún elemento
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
        // Crear elementos HTML... (sin cambios respecto a la versión anterior)
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
    const respuestaCorrecta = input.dataset.correcta ? input.dataset.correcta.trim() : ''; // Asegurar que dataset.correcta existe
    const index = input.id.split('-')[1];
    const resultadoDiv = document.getElementById(`resultado-${index}`);

    if (!resultadoDiv) return; // Salir si no se encuentra el div de resultado

    if (respuestaCorrecta === '' && respuestaUsuario !== '') {
         resultadoDiv.textContent = '?';
         resultadoDiv.className = 'resultado';
         return;
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
    if (!areaJuego || !estadoGeneracionDiv) return;
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');
    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => {
        if(resultado) { // Verificar que existe
            resultado.textContent = '';
            resultado.className = 'resultado';
        }
    });
     if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
     estadoGeneracionDiv.textContent = '';
}

// Mostrar/Ocultar Lista (sin cambios relevantes en la lógica)
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
        let todasLasUnidadesDisponibles = obtenerUnidadesDisponibles(); // Obtener para comparación

         if (unidadesSeleccionadasLista.length > 0) {
            // Filtrar asegurando que palabra y palabra.unit existan
            listaFuente = listaFuente.filter(palabra => palabra && palabra.unit && unidadesSeleccionadasLista.includes(palabra.unit));

            // Determinar texto informativo
             if (unidadesSeleccionadasLista.length === todasLasUnidadesDisponibles.length) {
                 infoUnidades = "Todas las unidades";
             } else {
                infoUnidades = `Unidades: ${unidadesSeleccionadasLista.join(', ')}`;
             }
         } else {
             listaFuente = []; // Vaciar si no hay unidades seleccionadas
         }
         listaInfoP.textContent = `Mostrando lista para: ${infoUnidades}.`;

        if (listaFuente && listaFuente.length > 0) {
            const listaOrdenada = [...listaFuente].sort((a, b) => {
                const valA = a && a[claves.mostrar] ? a[claves.mostrar] : '';
                const valB = b && b[claves.mostrar] ? b[claves.mostrar] : '';
                return valA.localeCompare(valB);
            });
            listaOrdenada.forEach(palabra => {
                const p = document.createElement('p');
                // Asegurar que las propiedades existen antes de usarlas
                const pMostrada = palabra && palabra[claves.mostrar] ? palabra[claves.mostrar] : '?';
                const pUnit = palabra && palabra.unit ? palabra.unit : '?';
                const pTraducida = palabra && palabra[claves.traducir] ? palabra[claves.traducir] : '?';
                p.textContent = `${pMostrada} (${pUnit}) = ${pTraducida}`;
                contenidoListaDiv.appendChild(p);
            });
        } else if (unidadesSeleccionadasLista.length > 0) { // Si se seleccionaron unidades pero no hay palabras
             contenidoListaDiv.innerHTML = '<p>No hay palabras para mostrar con la selección actual.</p>';
        } else { // Si no se seleccionó ninguna unidad
            contenidoListaDiv.innerHTML = '<p>Selecciona unidades para ver la lista.</p>';
        }
    }
}

// Cambiar modo (sin cambios)
function cambiarModo(nuevoModo) {
    if (modo === nuevoModo) return;
    modo = nuevoModo;
    if(modoActualDisplay) modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    if(areaJuego) areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras".</p>';
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    if(estadoGeneracionDiv) estadoGeneracionDiv.textContent = '';
}


// --- Asignación de Eventos (Al final, tras definir funciones) ---
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que todos los elementos necesarios existen
    const checkElements = [
        btnModoIngEsp, btnModoEspIng, btnCopiar, btnBorrar, btnMostrarLista, modoActualDisplay,
        areaJuego, listaPalabrasDiv, contenidoListaDiv, listaInfoP, estadoGeneracionDiv,
        unidadesBotonesContainer, btnSelectAll, btnDeselectAll, numPalabrasSlider,
        numPalabrasInput, numPalabrasValorSpan
    ];

    if (checkElements.some(el => el === null)) {
        console.error("Error Crítico: Faltan uno o más elementos HTML necesarios. Revisa los IDs en index.html.");
        if (areaJuego) areaJuego.innerHTML = "<p style='color:red; font-weight:bold;'>Error: La página no se cargó correctamente. Faltan elementos.</p>";
        return;
    }

    // Añadir listeners a elementos que sabemos que existen
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
    renderizarBotonesUnidades();          // Crear botones de unidad
    sincronizarNumPalabras(numPalabrasSlider); // Establecer valor inicial del span y input
    areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras" para empezar.</p>'; // Mensaje inicial

});
