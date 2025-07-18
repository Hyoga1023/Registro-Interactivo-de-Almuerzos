const form = document.getElementById('almuerzoForm');
const resumenDias = document.getElementById('resumenDias');
const borrarBtn = document.getElementById('borrarTodo');
const limpiarBtn = document.getElementById('limpiar');
const carneSelect = document.getElementById('carneSelect');
const carneOtroInput = document.getElementById('carneOtroInput');
const chartCanvas = document.getElementById('chartCarnes').getContext('2d');
let chart;

// Variable para controlar si estamos editando
let editandoFecha = null;

// Mostrar campo de texto si seleccionan "otro"
carneSelect.addEventListener('change', () => {
  carneOtroInput.style.display = carneSelect.value === 'otro' ? 'block' : 'none';
  carneOtroInput.required = carneSelect.value === 'otro';
});

// Obtener datos del localStorage
function getData() {
  return JSON.parse(localStorage.getItem('almuerzos')) || [];
}

// Guardar datos en el localStorage
function setData(data) {
  localStorage.setItem('almuerzos', JSON.stringify(data));
}

// Renderizar resumen de almuerzos
function renderData() {
  const data = getData().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  resumenDias.innerHTML = '';

  const ultimosCinco = data.slice(0, 5);
  ultimosCinco.forEach(renderTarjetaAlmuerzo);

  renderChart(data);
}

function renderTarjetaAlmuerzo({ fecha, plato, carne, ingredientes }) {
  // Contenedor principal
  const tarjeta = document.createElement('div');
  tarjeta.className = 'dia';

  // Contenedor de texto (contenido de la tarjeta)
  const contenido = document.createElement('div');
  contenido.className = 'contenido-tarjeta';

  const fechaElem = document.createElement('strong');
  fechaElem.textContent = fecha;

  const platoElem = document.createElement('em');
  platoElem.textContent = plato;

  const carneElem = document.createElement('small');
  carneElem.textContent = `Carne: ${carne}`;

  const ingredientesElem = document.createElement('small');
  ingredientesElem.textContent = `Ingredientes: ${ingredientes}`;

  // Añadir elementos de texto al contenido
  contenido.appendChild(fechaElem);
  contenido.appendChild(document.createElement('br'));
  contenido.appendChild(platoElem);
  contenido.appendChild(document.createElement('br'));
  contenido.appendChild(carneElem);
  contenido.appendChild(document.createElement('br'));
  contenido.appendChild(ingredientesElem);

  // Contenedor de botones de acción
  const acciones = document.createElement('div');
  acciones.className = 'acciones-tarjeta';

  const botonEditar = document.createElement('button');
  botonEditar.title = 'Editar';
  botonEditar.innerText = '✏️';
  botonEditar.onclick = () => editarAlmuerzo(fecha);

  const botonEliminar = document.createElement('button');
  botonEliminar.title = 'Eliminar';
  botonEliminar.innerText = '×';
  botonEliminar.onclick = () => eliminarAlmuerzo(fecha);

  acciones.appendChild(botonEditar);
  acciones.appendChild(botonEliminar);

  // Agregar contenido y acciones a la tarjeta
  tarjeta.appendChild(acciones);
  tarjeta.appendChild(contenido);

  // Agregar tarjeta al contenedor principal
  resumenDias.appendChild(tarjeta);
}



// Nueva función para editar almuerzo
function editarAlmuerzo(fecha) {
  const data = getData();
  const almuerzo = data.find(item => item.fecha === fecha);
  
  if (!almuerzo) {
    alert('No se encontró el almuerzo para editar');
    return;
  }

  // Llenar el formulario con los datos existentes
  document.getElementById('fecha').value = almuerzo.fecha;
  document.getElementById('plato').value = almuerzo.plato;
  document.getElementById('ingredientes').value = almuerzo.ingredientes;
  
  // Manejar la selección de carne
  const carneOptions = Array.from(carneSelect.options).map(option => option.value);
  if (carneOptions.includes(almuerzo.carne)) {
    carneSelect.value = almuerzo.carne;
  } else {
    carneSelect.value = 'otro';
    carneOtroInput.style.display = 'block';
    carneOtroInput.value = almuerzo.carne;
    carneOtroInput.required = true;
  }

  // Marcar que estamos editando
  editandoFecha = fecha;
  
  // Cambiar el texto del botón
  const saveButton = document.getElementById('saveButton');
  saveButton.innerHTML = `
    <img src="img/Melody.png" alt="Actualizar" class="btn-icon" />
    Actualizar
  `;
  
  // Scroll hacia el formulario
  form.scrollIntoView({ behavior: 'smooth' });
}

// Eliminar un almuerzo por fecha
function eliminarAlmuerzo(fecha) {
  let data = getData();
  data = data.filter(item => item.fecha !== fecha);
  setData(data);
  renderData();
}

// Renderizar gráfica
function renderChart(data) {
  const carnesPorDia = {};
  const now = new Date();
  const diaSemana = now.getDay();
  const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(now);
  lunes.setDate(now.getDate() - diferencia);
  lunes.setHours(0, 0, 0, 0);

  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  viernes.setHours(23, 59, 59, 999);

  data.forEach(({ fecha, carne }) => {
    const d = new Date(fecha + 'T00:00:00');
    if (d >= lunes && d <= viernes) {
      const key = carne.trim().toLowerCase();
      carnesPorDia[key] = (carnesPorDia[key] || 0) + 1;
    }
  });

  const sorted = Object.entries(carnesPorDia).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([carne]) => carne);
  const values = sorted.map(([_, count]) => count);

  if (chart) chart.destroy();

  if (typeof Chart === 'undefined') {
    console.error('Chart.js no está cargado');
    return;
  }

  chart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Uso de carne esta semana',
        data: values,
        backgroundColor: '#b244e6ff',
        borderRadius: 5,
        hoverBackgroundColor: '#ea76eeff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#222',
          titleColor: '#fff',
          bodyColor: '#fff'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#fff'
          }
        },
        x: {
          ticks: {
            autoSkip: false,
            color: '#fff'
          }
        }
      }
    }
  });
}

// Manejo del formulario (modificado para soportar edición)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const carneFinal = carneSelect.value === 'otro' ? carneOtroInput.value.trim() : carneSelect.value;
  const nuevo = {
    fecha: document.getElementById('fecha').value,
    plato: document.getElementById('plato').value,
    carne: carneFinal,
    ingredientes: document.getElementById('ingredientes').value
  };

  const data = getData();

  if (editandoFecha) {
    // Estamos editando
    const index = data.findIndex(item => item.fecha === editandoFecha);
    if (index !== -1) {
      // Si la fecha cambió, verificar que no exista ya
      if (nuevo.fecha !== editandoFecha && data.some(item => item.fecha === nuevo.fecha)) {
        alert('Ya existe un almuerzo registrado para esa fecha.');
        return;
      }
      data[index] = nuevo;
      setData(data);
      alert('Almuerzo actualizado correctamente!');
    }
    
    // Resetear el modo de edición
    editandoFecha = null;
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = `
      <img src="img/Melody.png" alt="Guardar" class="btn-icon" />
      Guardar
    `;
  } else {
    // Estamos creando un nuevo registro
    if (data.some(item => item.fecha === nuevo.fecha)) {
      alert('Ya existe un almuerzo registrado para ese día.');
      return;
    }
    data.push(nuevo);
    setData(data);
    alert('Almuerzo guardado correctamente!');
  }

  form.reset();
  carneOtroInput.style.display = 'none';
  renderData();
});

// Limpiar formulario (modificado para cancelar edición)
limpiarBtn.addEventListener('click', () => {
  form.reset();
  carneOtroInput.style.display = 'none';
  carneOtroInput.required = false;
  
  // Si estábamos editando, cancelar la edición
  if (editandoFecha) {
    editandoFecha = null;
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = `
      <img src="img/Melody.png" alt="Guardar" class="btn-icon" />
      Guardar
    `;
  }
});

// Borrar todos los registros del localStorage
borrarBtn.addEventListener('click', () => {
  if (confirm("¿Estás seguro de que quieres borrar todos los almuerzos registrados?")) {
    localStorage.removeItem('almuerzos');
    renderData();
    alert('Todos los registros han sido eliminados');
  }
});

// Inicializar la aplicación al cargar
document.addEventListener('DOMContentLoaded', () => {
  renderData();
});

function buscarPorFecha() {
  const fecha = document.getElementById('buscarFecha').value;
  const data = getData();
  const resultado = data.find(item => item.fecha === fecha);

  const resultadosDiv = document.getElementById('resultadosBusqueda');
  resultadosDiv.innerHTML = '';

  if (resultado) {
    resultadosDiv.innerHTML = `
      <div class="dia">
        <strong>${resultado.fecha}</strong><br>
        <em>${resultado.plato}</em><br>
        <small>Carne: ${resultado.carne}</small><br>
        <small>Ingredientes: ${resultado.ingredientes}</small>
      </div>
    `;
  } else {
    resultadosDiv.innerHTML = `<p>No se encontró almuerzo registrado para esa fecha.</p>`;
  }
}

function buscarPorCarne() {
  const carne = document.getElementById('buscarCarne').value.trim().toLowerCase();
  const data = getData();
  const resultados = data.filter(item => item.carne.trim().toLowerCase() === carne);

  const resultadosDiv = document.getElementById('resultadosBusqueda');
  resultadosDiv.innerHTML = '';

  if (resultados.length > 0) {
    resultados.forEach(({ fecha, plato, carne, ingredientes }) => {
      const div = document.createElement('div');
      div.className = 'dia';
      div.innerHTML = `
        <strong>${fecha}</strong><br>
        <em>${plato}</em><br>
        <small>Carne: ${carne}</small><br>
        <small>Ingredientes: ${ingredientes}</small>
      `;
      resultadosDiv.appendChild(div);
    });
  } else {
    resultadosDiv.innerHTML = `<p>No se encontraron almuerzos con esa carne.</p>`;
  }
}