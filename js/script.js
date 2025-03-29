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

// --- Estado del Juego ---
let modo = 'ing-esp'; // 'ing-esp' o 'esp-ing'
let palabrasActuales = []; // Almacenará los objetos de palabras mostradas
const NUM_PALABRAS_MOSTRAR = 10; // Cuántas palabras mostrar a la vez

// --- Funciones ---

// Función para obtener la lista de palabras correcta según el modo
function obtenerListaFuente() {
    // Asegúrate que las variables listaIngEsp y listaEspIng existen (vienen de palabras.js)
    if (typeof listaIngEsp === 'undefined' || typeof listaEspIng === 'undefined') {
        console.error("Error: Las listas de palabras (listaIngEsp o listaEspIng) no están definidas. Asegúrate de que palabras.js se carga correctamente ANTES que script.js.");
        return []; // Devuelve un array vacío para evitar más errores
    }
    return modo === 'ing-esp' ? listaIngEsp : listaEspIng;
}

// Función para obtener la clave de la palabra a mostrar y la clave de la traducción
function obtenerClaves() {
    return modo === 'ing-esp' ? { mostrar: 'eng', traducir: 'esp' } : { mostrar: 'esp', traducir: 'eng' };
}

// Función para barajar un array (Algoritmo Fisher-Yates)
function barajarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
    }
    return array;
}

// Función para generar y mostrar nuevas palabras
function generarPalabras() {
    areaJuego.innerHTML = ''; // Limpiar área de juego anterior
    palabrasActuales = []; // Limpiar palabras actuales
    listaPalabrasDiv.classList.add('oculto'); // Ocultar lista al generar nuevas

    const listaFuente = obtenerListaFuente();
    if (!listaFuente || listaFuente.length === 0) {
        areaJuego.innerHTML = '<p>Error: No se pudo cargar la lista de palabras para este modo o está vacía.</p>';
        return;
    }

    // Barajar y seleccionar N palabras
    const palabrasSeleccionadas = barajarArray([...listaFuente]).slice(0, NUM_PALABRAS_MOSTRAR);
    palabrasActuales = palabrasSeleccionadas; // Guardar referencia

    const claves = obtenerClaves();

    palabrasSeleccionadas.forEach((palabra, index) => {
        const fila = document.createElement('div');
        fila.classList.add('fila-palabra');
        fila.id = `fila-${index}`; // ID único para la fila

        const palabraMostrada = document.createElement('div');
        palabraMostrada.classList.add('palabra-mostrada');
        // Verificar que la clave existe antes de acceder
        palabraMostrada.textContent = palabra && palabra[claves.mostrar] ? palabra[claves.mostrar] : 'Error Palabra';

        // --- DIV PARA LA UNIDAD ---
        const unidadDiv = document.createElement('div');
        unidadDiv.classList.add('unidad');
        // Verificar que la propiedad 'unit' existe
        unidadDiv.textContent = palabra && palabra.unit ? `(${palabra.unit})` : ''; // Mostrar la unidad si existe
        // --- FIN DIV UNIDAD ---

        const inputRespuesta = document.createElement('input');
        inputRespuesta.type = 'text';
        inputRespuesta.classList.add('respuesta-usuario');
        inputRespuesta.id = `respuesta-${index}`; // ID único para el input
        // Guardar la respuesta correcta en un atributo de datos
        // Verificar que la clave existe
        inputRespuesta.dataset.correcta = palabra && palabra[claves.traducir] ? palabra[claves.traducir] : '';
        inputRespuesta.addEventListener('input', comprobarRespuesta); // Comprobar al escribir

        const resultadoDiv = document.createElement('div');
        resultadoDiv.classList.add('resultado');
        resultadoDiv.id = `resultado-${index}`; // ID único para el resultado

        // Añadir elementos a la fila en el orden deseado
        fila.appendChild(palabraMostrada);
        fila.appendChild(unidadDiv); // Añadido el div de la unidad
        fila.appendChild(inputRespuesta);
        fila.appendChild(resultadoDiv);
        areaJuego.appendChild(fila);
    });
}

// Función para comprobar la respuesta del usuario
function comprobarRespuesta(evento) {
    const input = evento.target;
    const respuestaUsuario = input.value.trim(); // Quitar espacios
    const respuestaCorrecta = input.dataset.correcta.trim(); // Obtener respuesta correcta del dataset
    const index = input.id.split('-')[1]; // Obtener el índice de la fila
    const resultadoDiv = document.getElementById(`resultado-${index}`);

    // Si no hay respuesta correcta guardada (error en datos?), no hacer nada
    if (respuestaCorrecta === '' && respuestaUsuario !== '') {
         resultadoDiv.textContent = '?'; // Indicar dato faltante
         resultadoDiv.className = 'resultado';
         return
    }

    if (respuestaUsuario === '') {
        resultadoDiv.textContent = '';
        resultadoDiv.className = 'resultado'; // Quitar clases de color
        return;
    }

    // Comparación insensible a mayúsculas/minúsculas
    if (respuestaUsuario.toLowerCase() === respuestaCorrecta.toLowerCase()) {
        resultadoDiv.textContent = 'SÍ';
        resultadoDiv.className = 'resultado resultado-correcto'; // Añadir clase correcta
    } else {
        resultadoDiv.textContent = 'NO';
        resultadoDiv.className = 'resultado resultado-incorrecto'; // Añadir clase incorrecta
    }
}

// Función para borrar las respuestas y resultados
function borrarRespuestas() {
    const inputs = areaJuego.querySelectorAll('.respuesta-usuario');
    const resultados = areaJuego.querySelectorAll('.resultado');

    inputs.forEach(input => input.value = '');
    resultados.forEach(resultado => {
        resultado.textContent = '';
        resultado.className = 'resultado'; // Resetear clases
    });
     listaPalabrasDiv.classList.add('oculto'); // Ocultar lista al borrar
}

// Función para mostrar u ocultar la lista de referencia
function toggleLista() {
    listaPalabrasDiv.classList.toggle('oculto');

    // Si se va a mostrar, llenar el contenido
    if (!listaPalabrasDiv.classList.contains('oculto')) {
        contenidoListaDiv.innerHTML = ''; // Limpiar antes de llenar
        const listaFuente = obtenerListaFuente();
        const claves = obtenerClaves();
        if (listaFuente && listaFuente.length > 0) {
            // Ordenar alfabéticamente por la palabra mostrada antes de mostrar
            const listaOrdenada = [...listaFuente].sort((a, b) => {
                const palabraA = a[claves.mostrar] || '';
                const palabraB = b[claves.mostrar] || '';
                return palabraA.localeCompare(palabraB);
            });

            listaOrdenada.forEach(palabra => {
                const p = document.createElement('p');
                // Incluir la unidad al mostrar la lista completa
                p.textContent = `${palabra[claves.mostrar]} (${palabra.unit || ''}) = ${palabra[claves.traducir]}`;
                contenidoListaDiv.appendChild(p);
            });
        } else {
             contenidoListaDiv.innerHTML = '<p>Lista no disponible.</p>';
        }
    }
}

// Función para cambiar el modo de juego
function cambiarModo(nuevoModo) {
    if (modo === nuevoModo) return; // No hacer nada si ya está en ese modo

    modo = nuevoModo;
    modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    areaJuego.innerHTML = '<p>Haz clic en "Nuevas Palabras" para empezar.</p>'; // Limpiar área
    listaPalabrasDiv.classList.add('oculto'); // Ocultar lista al cambiar modo
}

// --- Asignación de Eventos a Botones ---
// Asegurarse que los botones existen antes de añadir listeners
if (btnModoIngEsp) btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
if (btnModoEspIng) btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
if (btnCopiar) btnCopiar.addEventListener('click', generarPalabras);
if (btnBorrar) btnBorrar.addEventListener('click', borrarRespuestas);
if (btnMostrarLista) btnMostrarLista.addEventListener('click', toggleLista);

// --- Inicialización ---
// Mostrar un mensaje inicial
if (areaJuego) {
    areaJuego.innerHTML = '<p>Selecciona un modo y haz clic en "Nuevas Palabras" para empezar.</p>';
} else {
    console.error("Error: No se encontró el elemento 'area-juego'.");
}
