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
        console.error("Error: Las listas de palabras no están definidas.");
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
    const listaCompleta = (typeof listaIngEsp !== 'undefined' ? listaIngEsp : []).concat(typeof listaEspIng !== 'undefined' ? listaEspIng : []);
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

// Crea los BOTONES para cada unidad
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

        // Listener CORREGIDO: Simplemente alterna la clase al hacer clic.
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            console.log(`Botón ${unidad} clickeado, estado selected: ${button.classList.contains('selected')}`); // Log para depurar
        });

        unidadesBotonesContainer.appendChild(button);
    });
}

// Selecciona o deselecciona todos los botones de unidad
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
    console.log(`Toggle All: ${seleccionar}`); // Log para depurar
}

// Obtiene las unidades actualmente seleccionadas
function obtenerUnidadesSeleccionadas() {
    const unidades = [];
    if (!unidadesBotonesContainer) return unidades; // Devolver array vacío si no existe
    const botonesSeleccionados = unidadesBotonesContainer.querySelectorAll('.unidad-btn.selected');
    botonesSeleccionados.forEach(btn => {
        unidades.push(btn.dataset.unidad);
    });
    console.log("Unidades Seleccionadas:", unidades); // Log para depurar
    return unidades;
}
// --- FIN LÓGICA UNIDADES ---

// --- LÓGICA SLIDER/INPUT (REVISADA Y ASEGURADA) ---
function sincronizarNumPalabras(sourceElement) {
    // Verificar que todos los elementos existen antes de operar
    if (!numPalabrasSlider || !numPalabrasInput || !numPalabrasValorSpan) {
        console.error("Error: Elementos del slider/input no encontrados.");
        return;
    }

    let valor = parseInt(sourceElement.value, 10);
    const min = parseInt(numPalabrasSlider.min, 10);
    const max = parseInt(numPalabrasSlider.max, 10);

    // Validar (importante para evitar NaN o valores fuera de rango)
    if (isNaN(valor)) {
        // Si no es un número (ej. input vacío), usar el valor del slider o min
        valor = parseInt(numPalabrasSlider.value, 10) || min;
    }
    if (valor < min) valor = min;
    if (valor > max) valor = max;

    console.log(`Sincronizando: source=${sourceElement.id}, rawValue=${sourceElement.value}, parsedValue=${valor}`); // Log

    // Actualizar todos los elementos relacionados
    numPalabrasSlider.value = valor;
    numPalabrasInput.value = valor;
    numPalabrasValorSpan.textContent = valor;

    // Si la fuente era el input y el valor tuvo que ser corregido (p.ej. estaba vacío o fuera de rango)
    // lo reescribimos en el input para que el usuario vea la corrección.
    // Hacemos esto en un setTimeout pequeño para evitar posibles conflictos si el navegador
    // aún está procesando el evento 'input'.
    if (sourceElement.type === 'number' && sourceElement.value !== valor.toString()) {
        // console.log(`Corrigiendo input value de ${sourceElement.value} a ${valor}`);
        // sourceElement.value = valor; // Puede causar problemas si se hace inmediatamente
         setTimeout(() => {
             // Re-verificar por si el usuario cambió algo más rápido
             if (parseInt(numPalabrasInput.value, 10) !== valor) {
                numPalabrasInput.value = valor;
             }
        }, 10);
    }
}
// --- FIN LÓGICA NÚMERO PALABRAS ---


function barajarArray(array) { /* ... (sin cambios) ... */
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
    areaJuego.innerHTML = '';
    palabrasActuales = [];
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = '';

    // 1. Obtener Unidades Seleccionadas
    const unidadesSeleccionadas = obtenerUnidadesSeleccionadas(); // Usa la función corregida
    if (unidadesSeleccionadas.length === 0) {
        areaJuego.innerHTML = '<p style="color: red; text-align: center;">⚠️ Debes seleccionar al menos una unidad.</p>';
        return;
    }

    // 2. Obtener Número de Palabras
    let numPalabrasSolicitadas = 10; // Default robusto
    if (numPalabrasInput) {
        // Leer el valor validado directamente
        numPalabrasSolicitadas = parseInt(numPalabrasInput.value, 10);
         // Doble verificación por si acaso
         const min = parseInt(numPalabrasInput.min, 10);
         const max = parseInt(numPalabrasInput.max, 10);
         if(isNaN(numPalabrasSolicitadas) || numPalabrasSolicitadas < min || numPalabrasSolicitadas > max) {
            console.warn("Valor inválido en numPalabrasInput al generar, usando 10.");
            numPalabrasSolicitadas = 10;
         }
    } else {
        console.warn("Input de número de palabras no encontrado, usando 10.");
    }

    // 3. Obtener y Filtrar Lista Fuente
    let listaFiltrada = obtenerListaFuente();
    if (!listaFiltrada || listaFiltrada.length === 0) { /* ... (sin cambios) ... */
        areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo.</p>';
        return;
    }
    listaFiltrada = listaFiltrada.filter(palabra => palabra && palabra.unit && unidadesSeleccionadas.includes(palabra.unit));

    // 4. Verificar si hay suficientes palabras y ajustar
    let numPalabrasASeleccionar = numPalabrasSolicitadas;
    let unidadesTexto = unidadesSeleccionadas.length === obtenerUnidadesDisponibles().length ? 'Todas' : unidadesSeleccionadas.join(', ');
    let mensajeEstado = `Solicitadas: ${numPalabrasSolicitadas}. Unidades: ${unidadesTexto}. `;
    if (listaFiltrada.length === 0) { /* ... (sin cambios) ... */
        areaJuego.innerHTML = `<p style="color: orange; text-align: center;">ℹ️ No se encontraron palabras para las unidades seleccionadas (${unidadesTexto}) en el modo actual.</p>`;
        estadoGeneracionDiv.textContent = '';
        return;
    } else if (listaFiltrada.length < numPalabrasSolicitadas) { /* ... (sin cambios) ... */
        numPalabrasASeleccionar = listaFiltrada.length;
        mensajeEstado += `Mostrando ${numPalabrasASeleccionar} (todas las disponibles).`;
    } else { /* ... (sin cambios) ... */
         mensajeEstado += `Mostrando ${numPalabrasASeleccionar}.`;
    }
    estadoGeneracionDiv.textContent = mensajeEstado;

    // 5. Barajar y Seleccionar
    const palabrasSeleccionadas = barajarArray([...listaFiltrada]).slice(0, numPalabrasASeleccionar);
    palabrasActuales = palabrasSeleccionadas;

    // 6. Renderizar las palabras (sin cambios relevantes en la lógica interna)
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
function comprobarRespuesta(evento) { /* ... (sin cambios) ... */
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
function borrarRespuestas() { /* ... (sin cambios) ... */
    if (!areaJuego || !estadoGeneracionDiv) return;
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');
    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => {
        resultado.textContent = '';
        resultado.className = 'resultado';
    });
     if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
     estadoGeneracionDiv.textContent = '';
}


// Mostrar/Ocultar Lista (usa obtenerUnidadesSeleccionadas corregida)
function toggleLista() { /* ... (lógica interna mayormente sin cambios, pero usa la función corregida) ... */
    if (!listaPalabrasDiv || !listaInfoP || !contenidoListaDiv) return;
    listaPalabrasDiv.classList.toggle('oculto');
    listaInfoP.textContent = '';

    if (!listaPalabrasDiv.classList.contains('oculto')) {
        contenidoListaDiv.innerHTML = '';
        let listaFuente = obtenerListaFuente();
        const claves = obtenerClaves();
        const unidadesSeleccionadasLista = obtenerUnidadesSeleccionadas(); // <-- Usa función corregida
        let infoUnidades = "Ninguna unidad seleccionada";

         if (unidadesSeleccionadasLista.length > 0) {
            listaFuente = listaFuente.filter(palabra => palabra && palabra.unit && unidadesSeleccionadasLista.includes(palabra.unit));
             const todasDisponibles = obtenerUnidadesDisponibles();
             if (unidadesSeleccionadasLista.length === todasDisponibles.length) {
                 infoUnidades = "Todas las unidades";
             } else {
                infoUnidades = `Unidades: ${unidadesSeleccionadasLista.join(', ')}`;
             }
         } else {
             listaFuente = [];
         }
         listaInfoP.textContent = `Mostrando lista para: ${infoUnidades}.`;

        if (listaFuente && listaFuente.length > 0) {
            const listaOrdenada = [...listaFuente].sort((a, b) => { /* ... */ return (a[claves.mostrar] || '').localeCompare(b[claves.mostrar] || ''); });
            listaOrdenada.forEach(palabra => { /* ... */
                const p = document.createElement('p');
                p.textContent = `${palabra[claves.mostrar] || ''} (${palabra.unit || ''}) = ${palabra[claves.traducir] || ''}`;
                contenidoListaDiv.appendChild(p);
            });
        } else if (unidadesSeleccionadasLista.length > 0) {
             contenidoListaDiv.innerHTML = '<p>No hay palabras para mostrar con la selección actual.</p>';
        } else {
            contenidoListaDiv.innerHTML = '<p>Selecciona unidades para ver la lista.</p>';
        }
    }
}

// Cambiar modo (sin cambios)
function cambiarModo(nuevoModo) { /* ... (sin cambios) ... */
    if (modo === nuevoModo) return;
    modo = nuevoModo;
    if(modoActualDisplay) modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    if(areaJuego) areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras".</p>';
    if(listaPalabrasDiv) listaPalabrasDiv.classList.add('oculto');
    if(estadoGeneracionDiv) estadoGeneracionDiv.textContent = '';
}


// --- Asignación de Eventos (Asegurando que elementos existen) ---
document.addEventListener('DOMContentLoaded', () => {
    // Verificar existencia de todos los elementos ANTES de añadir listeners
    const elementosExisten = btnModoIngEsp && btnModoEspIng && btnCopiar && btnBorrar && btnMostrarLista && modoActualDisplay && areaJuego && listaPalabrasDiv && contenidoListaDiv && listaInfoP && estadoGeneracionDiv && unidadesBotonesContainer && btnSelectAll && btnDeselectAll && numPalabrasSlider && numPalabrasInput && numPalabrasValorSpan;

    if (!elementosExisten) {
        console.error("Error Crítico: Faltan uno o más elementos HTML necesarios. Revisa los IDs en index.html y script.js.");
        // Opcional: Mostrar mensaje al usuario
        if (areaJuego) areaJuego.innerHTML = "<p style='color:red; font-weight:bold;'>Error: La página no se cargó correctamente. Faltan elementos.</p>";
        return; // Detener la ejecución si falta algo esencial
    }

    console.log("Todos los elementos encontrados, añadiendo listeners...");

    // Listeners de controles principales
    btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
    btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
    btnCopiar.addEventListener('click', generarPalabras);
    btnBorrar.addEventListener('click', borrarRespuestas);
    btnMostrarLista.addEventListener('click', toggleLista);

    // Listeners para controles de unidades
    btnSelectAll.addEventListener('click', () => toggleAllUnidades(true));
    btnDeselectAll.addEventListener('click', () => toggleAllUnidades(false));

    // Listeners para Slider y Input numérico
    numPalabrasSlider.addEventListener('input', () => sincronizarNumPalabras(numPalabrasSlider));
    numPalabrasInput.addEventListener('input', () => sincronizarNumPalabras(numPalabrasInput));
    numPalabrasInput.addEventListener('change', () => sincronizarNumPalabras(numPalabrasInput)); // Para cambios al perder foco o pegar

    // --- Inicialización Final ---
    renderizarBotonesUnidades(); // Crear botones de unidad
    sincronizarNumPalabras(numPalabrasSlider); // Establecer valor inicial del span
    areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras" para empezar.</p>'; // Mensaje inicial

    console.log("Inicialización completada.");
});
