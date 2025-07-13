document.addEventListener('DOMContentLoaded', () => {
    // TODA la lógica de tu JavaScript que tienes ahora, incluyendo:
    const form = document.getElementById('almuerzoForm');
    const resumenDias = document.getElementById('resumenDias');
    const borrarBtn = document.getElementById('borrarTodo');
    const limpiarBtn = document.getElementById('limpiar');
    const carneSelect = document.getElementById('carneSelect');
    const carneOtroInput = document.getElementById('carneOtroInput');
    const chartCanvas = document.getElementById('chartCarnes').getContext('2d');
    let chart;

    // Y especialmente esta línea, para asegurar que se obtenga el elemento:
    const vectorRainContainer = document.getElementById('vectorRainContainer');

    // ... todo el resto de tu código JavaScript ...

    // Asegúrate de que la función createVectorRain también esté dentro de este bloque
    function createVectorRain(numberOfDrops = 15) {
        // ... tu código de createVectorRain ...
        const imageUrl = 'img/vectores.png'; // RUTA A TU IMAGEN DE VECTOR
        if (!vectorRainContainer) { // Una pequeña verificación extra para seguridad
             console.error("El contenedor de lluvia de vectores no se encontró.");
             return;
        }
        for (let i = 0; i < numberOfDrops; i++) {
            const drop = document.createElement('img');
            drop.src = imageUrl;
            drop.className = 'vector-drop';

            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDelay = `${Math.random() * 0.5}s`;

            vectorRainContainer.appendChild(drop);

            drop.addEventListener('animationend', () => {
                drop.remove();
            });
        }
    }

    // ... y el evento del formulario que llama a createVectorRain ...
    form.addEventListener('submit', (e) => {
        // ... tu lógica de guardar ...
        createVectorRain(20);
    });

    // ... y la inicialización al cargar la página si la tienes:
    renderData(); // Esto ya lo tenías dentro del DOMContentLoaded, lo cual está bien.
});