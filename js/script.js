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
const listaInfoP = document.getElementById('lista-info'); // Para mensajes en la lista
const estadoGeneracionDiv = document.getElementById('estado-generacion'); // Para mensajes de estado

// --- Nuevas Referencias para Configuración ---
const checkTodasUnidades = document.getElementById('check-todas');
const unidadesEspecificasDiv = document.getElementById('unidad-checkboxes-especificas');
const numPalabrasInput = document.getElementById('num-palabras');


// --- Estado del Juego ---
let modo = 'ing-esp'; // 'ing-esp' o 'esp-ing'
let palabrasActuales = []; // Almacenará los objetos de palabras mostradas
// Quitamos NUM_PALABRAS_MOSTRAR constante, se leerá del input


// --- Funciones ---

// Función para obtener la lista de palabras correcta según el modo
function obtenerListaFuente() {
    if (typeof listaIngEsp === 'undefined' || typeof listaEspIng === 'undefined') {
        console.error("Error: Las listas de palabras no están definidas.");
        return [];
    }
    return modo === 'ing-esp' ? listaIngEsp : listaEspIng;
}

// Función para obtener las claves de idioma según el modo
function obtenerClaves() {
    return modo === 'ing-esp' ? { mostrar: 'eng', traducir: 'esp' } : { mostrar: 'esp', traducir: 'eng' };
}

// --- NUEVAS FUNCIONES PARA UNIDADES ---

// Obtiene todas las unidades únicas de ambas listas
function obtenerUnidadesDisponibles() {
    const unidades = new Set(); // Usamos Set para evitar duplicados automáticamente
    if (typeof listaIngEsp !== 'undefined') {
        listaIngEsp.forEach(p => { if (p.unit) unidades.add(p.unit); });
    }
    if (typeof listaEspIng !== 'undefined') {
        listaEspIng.forEach(p => { if (p.unit) unidades.add(p.unit); });
    }
    // Convertir Set a Array y ordenar (importante para consistencia)
    return Array.from(unidades).sort();
}

// Crea los checkboxes para cada unidad disponible
function renderizarCheckboxesUnidades() {
    if (!unidadesEspecificasDiv) return; // Salir si el contenedor no existe

    unidadesEspecificasDiv.innerHTML = ''; // Limpiar checkboxes anteriores
    const unidades = obtenerUnidadesDisponibles();

    unidades.forEach(unidad => {
        const div = document.createElement('div');
        div.classList.add('unidad-checkbox');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `check-${unidad.replace(/\s+/g, '-')}`; // Crear ID único (reemplaza espacios)
        checkbox.value = unidad;
        checkbox.classList.add('check-unidad'); // Clase para seleccionarlos luego
        // Por defecto, las unidades específicas están desmarcadas si "Todas" está marcada
        checkbox.checked = checkTodasUnidades ? checkTodasUnidades.checked : false;
        checkbox.disabled = checkTodasUnidades ? checkTodasUnidades.checked : false; // Deshabilitar si "Todas" está activo

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = unidad;

        // Event listener para desmarcar "Todas" si se marca una específica
        checkbox.addEventListener('change', () => {
            if (checkTodasUnidades && checkbox.checked) {
                 // No hacemos nada aquí ahora, el cambio se maneja en el listener de "checkTodasUnidades" al desmarcarlo
            }
             // Si desmarcamos una unidad, desmarcamos "Todas"
            else if (checkTodasUnidades && !checkbox.checked) {
                checkTodasUnidades.checked = false;
                habilitarCheckboxesUnidades(true); // Habilitar todas
            }
            actualizarEstadoCheckTodas(); // Asegura que 'Todas' se marque si todas las demás lo están
        });


        div.appendChild(checkbox);
        div.appendChild(label);
        unidadesEspecificasDiv.appendChild(div);
    });
}

// Habilita o deshabilita los checkboxes de unidades específicas
function habilitarCheckboxesUnidades(habilitar) {
    const checkboxesUnidades = unidadesEspecificasDiv.querySelectorAll('.check-unidad');
    checkboxesUnidades.forEach(cb => {
        cb.disabled = !habilitar;
        if (!habilitar) {
            cb.checked = true; // Si deshabilitamos (porque 'Todas' está marcado), las marcamos también
        }
    });
}

// Actualiza el estado del checkbox "Todas" si todos los demás están marcados/desmarcados
function actualizarEstadoCheckTodas() {
    if (!checkTodasUnidades) return;
    const checkboxesUnidades = unidadesEspecificasDiv.querySelectorAll('.check-unidad');
    const todasMarcadas = checkboxesUnidades.length > 0 && Array.from(checkboxesUnidades).every(cb => cb.checked);

    if (todasMarcadas) {
        checkTodasUnidades.checked = true;
        habilitarCheckboxesUnidades(false); // Deshabilitar individuales si 'Todas' se marca automáticamente
    }
}


// --- FIN NUEVAS FUNCIONES PARA UNIDADES ---


// Función para barajar un array (Algoritmo Fisher-Yates)
function barajarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- MODIFICADA: Función para generar y mostrar nuevas palabras ---
function generarPalabras() {
    areaJuego.innerHTML = ''; // Limpiar área de juego
    palabrasActuales = [];
    listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = ''; // Limpiar mensaje de estado anterior

    // 1. Obtener Unidades Seleccionadas
    let unidadesSeleccionadas = [];
    const todasChecked = checkTodasUnidades ? checkTodasUnidades.checked : true; // Asumir todas si el checkbox no existe
    if (!todasChecked) {
        const checkboxesMarcados = unidadesEspecificasDiv.querySelectorAll('.check-unidad:checked');
        checkboxesMarcados.forEach(cb => unidadesSeleccionadas.push(cb.value));
    }
     // Si no se seleccionó "Todas" ni ninguna específica, mostrar error y salir
    if (!todasChecked && unidadesSeleccionadas.length === 0) {
        areaJuego.innerHTML = '<p style="color: red;">Error: Debes seleccionar al menos una unidad o "Todas las Unidades".</p>';
        return;
    }


    // 2. Obtener Número de Palabras Solicitado
    let numPalabrasSolicitadas = 10; // Valor por defecto
    const minPalabras = 1;
    const maxPalabras = 50; // O el límite que prefieras
    if (numPalabrasInput) {
        numPalabrasSolicitadas = parseInt(numPalabrasInput.value, 10);
        // Validar entrada
        if (isNaN(numPalabrasSolicitadas) || numPalabrasSolicitadas < minPalabras) {
            numPalabrasSolicitadas = minPalabras;
            numPalabrasInput.value = minPalabras; // Corregir input
        } else if (numPalabrasSolicitadas > maxPalabras) {
            numPalabrasSolicitadas = maxPalabras;
            numPalabrasInput.value = maxPalabras; // Corregir input
        }
    }

    // 3. Obtener y Filtrar Lista Fuente
    let listaFiltrada = obtenerListaFuente();
    if (!listaFiltrada || listaFiltrada.length === 0) {
        areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo.</p>';
        return;
    }

    // Filtrar por unidades si no se seleccionaron todas
    if (!todasChecked && unidadesSeleccionadas.length > 0) {
        listaFiltrada = listaFiltrada.filter(palabra => palabra.unit && unidadesSeleccionadas.includes(palabra.unit));
    }

    // 4. Verificar si hay suficientes palabras y ajustar
    let numPalabrasASeleccionar = numPalabrasSolicitadas;
    let mensajeEstado = `Solicitadas: ${numPalabrasSolicitadas}. `;
    if (listaFiltrada.length === 0) {
        areaJuego.innerHTML = `<p style="color: orange;">No se encontraron palabras para las unidades seleccionadas en el modo ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}.</p>`;
        estadoGeneracionDiv.textContent = '';
        return;
    } else if (listaFiltrada.length < numPalabrasSolicitadas) {
        numPalabrasASeleccionar = listaFiltrada.length; // Seleccionar todas las disponibles
        mensajeEstado += `Mostrando ${numPalabrasASeleccionar} (todas las disponibles para la selección).`;
    } else {
         mensajeEstado += `Mostrando ${numPalabrasASeleccionar}.`;
    }
    estadoGeneracionDiv.textContent = mensajeEstado; // Mostrar estado

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
        palabraMostrada.textContent = palabra && palabra[claves.mostrar] ? palabra[claves.mostrar] : 'Error Palabra';

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
// --- FIN FUNCIÓN generarPalabras MODIFICADA ---


// Función para comprobar la respuesta del usuario (sin cambios)
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

// Función para borrar las respuestas y resultados (sin cambios)
function borrarRespuestas() {
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');
    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => {
        resultado.textContent = '';
        resultado.className = 'resultado';
    });
     listaPalabrasDiv.classList.add('oculto');
     estadoGeneracionDiv.textContent = ''; // Limpiar mensaje de estado
}

// --- MODIFICADA: Función para mostrar u ocultar la lista de referencia ---
function toggleLista() {
    listaPalabrasDiv.classList.toggle('oculto');
    listaInfoP.textContent = ''; // Limpiar info anterior

    if (!listaPalabrasDiv.classList.contains('oculto')) {
        contenidoListaDiv.innerHTML = ''; // Limpiar
        let listaFuente = obtenerListaFuente();
        const claves = obtenerClaves();

        // Filtrar la lista mostrada según las unidades seleccionadas
        let unidadesSeleccionadasLista = [];
        const todasChecked = checkTodasUnidades ? checkTodasUnidades.checked : true;
        let infoUnidades = "Todas las unidades";
        if (!todasChecked) {
            const checkboxesMarcados = unidadesEspecificasDiv.querySelectorAll('.check-unidad:checked');
            checkboxesMarcados.forEach(cb => unidadesSeleccionadasLista.push(cb.value));
             if (unidadesSeleccionadasLista.length > 0) {
                listaFuente = listaFuente.filter(palabra => palabra.unit && unidadesSeleccionadasLista.includes(palabra.unit));
                infoUnidades = `Unidades: ${unidadesSeleccionadasLista.join(', ')}`;
             } else {
                 // Si no hay unidades seleccionadas, mostrar mensaje y lista vacía
                 listaFuente = [];
                 infoUnidades = "Ninguna unidad seleccionada";
             }
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
        } else if (unidadesSeleccionadasLista.length > 0 || todasChecked) {
             contenidoListaDiv.innerHTML = '<p>No hay palabras para mostrar con la selección actual.</p>';
        } else {
            contenidoListaDiv.innerHTML = '<p>Selecciona unidades para ver la lista.</p>';
        }
    }
}

// --- MODIFICADA: Función para cambiar el modo de juego ---
function cambiarModo(nuevoModo) {
    if (modo === nuevoModo) return;
    modo = nuevoModo;
    modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras".</p>'; // Mensaje actualizado
    listaPalabrasDiv.classList.add('oculto');
    estadoGeneracionDiv.textContent = ''; // Limpiar mensaje de estado
    // NOTA: No re-renderizamos los checkboxes aquí, asumimos que las unidades son las mismas para ambos modos.
}


// --- Asignación de Eventos ---
if (btnModoIngEsp) btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
if (btnModoEspIng) btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
if (btnCopiar) btnCopiar.addEventListener('click', generarPalabras);
if (btnBorrar) btnBorrar.addEventListener('click', borrarRespuestas);
if (btnMostrarLista) btnMostrarLista.addEventListener('click', toggleLista);

// --- NUEVOS Event Listeners para Checkboxes ---
if (checkTodasUnidades) {
    checkTodasUnidades.addEventListener('change', () => {
        // Habilitar/deshabilitar y marcar/desmarcar checkboxes específicos
        habilitarCheckboxesUnidades(!checkTodasUnidades.checked);
    });
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar checkboxes al cargar la página
    renderizarCheckboxesUnidades();
    // Establecer estado inicial de checkboxes específicos basado en "Todas"
     if (checkTodasUnidades) {
         habilitarCheckboxesUnidades(!checkTodasUnidades.checked);
     }

    // Mostrar mensaje inicial
    if (areaJuego) {
        areaJuego.innerHTML = '<p>Selecciona configuración y haz clic en "Nuevas Palabras" para empezar.</p>';
    } else {
        console.error("Error: No se encontró el elemento 'area-juego'.");
    }
});
