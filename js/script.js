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
const NUM_PALABRAS_MOSTRAR = 10; // Cuántas palabras mostrar a la vez (similar a C3:C28)

// --- Funciones ---

// Función para obtener la lista de palabras correcta según el modo
function obtenerListaFuente() {
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
        areaJuego.innerHTML = '<p>Error: No se encontró la lista de palabras para este modo.</p>';
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
        palabraMostrada.textContent = palabra[claves.mostrar];

        const inputRespuesta = document.createElement('input');
        inputRespuesta.type = 'text';
        inputRespuesta.classList.add('respuesta-usuario');
        inputRespuesta.id = `respuesta-${index}`; // ID único para el input
        // Guardar la respuesta correcta en un atributo de datos (¡no visible para el usuario fácilmente!)
        inputRespuesta.dataset.correcta = palabra[claves.traducir];
        inputRespuesta.addEventListener('input', comprobarRespuesta); // Comprobar al escribir

        const resultadoDiv = document.createElement('div');
        resultadoDiv.classList.add('resultado');
        resultadoDiv.id = `resultado-${index}`; // ID único para el resultado

        fila.appendChild(palabraMostrada);
        fila.appendChild(inputRespuesta);
        fila.appendChild(resultadoDiv);
        areaJuego.appendChild(fila);
    });
}

// Función para comprobar la respuesta del usuario
function comprobarRespuesta(evento) {
    const input = evento.target;
    const respuestaUsuario = input.value.trim(); // Quitar espacios
    const respuestaCorrecta = input.dataset.correcta.trim();
    const index = input.id.split('-')[1]; // Obtener el índice de la fila
    const resultadoDiv = document.getElementById(`resultado-${index}`);

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
            listaFuente.forEach(palabra => {
                const p = document.createElement('p');
                p.textContent = `${palabra[claves.mostrar]} = ${palabra[claves.traducir]}`;
                contenidoListaDiv.appendChild(p);
            });
        } else {
             contenidoListaDiv.innerHTML = '<p>Lista no disponible.</p>';
        }
    }
}

// Función para cambiar el modo de juego
function cambiarModo(nuevoModo) {
    modo = nuevoModo;
    modoActualDisplay.textContent = `Modo: ${modo === 'ing-esp' ? 'Inglés -> Español' : 'Español -> Inglés'}`;
    areaJuego.innerHTML = '<p>Haz clic en "Nuevas Palabras" para empezar.</p>'; // Limpiar área
    listaPalabrasDiv.classList.add('oculto'); // Ocultar lista al cambiar modo
}

// --- Asignación de Eventos a Botones ---
btnModoIngEsp.addEventListener('click', () => cambiarModo('ing-esp'));
btnModoEspIng.addEventListener('click', () => cambiarModo('esp-ing'));
btnCopiar.addEventListener('click', generarPalabras);
btnBorrar.addEventListener('click', borrarRespuestas);
btnMostrarLista.addEventListener('click', toggleLista);

// --- Inicialización ---
// Mostrar un mensaje inicial o generar palabras por defecto (opcional)
areaJuego.innerHTML = '<p>Selecciona un modo y haz clic en "Nuevas Palabras" para empezar.</p>';
