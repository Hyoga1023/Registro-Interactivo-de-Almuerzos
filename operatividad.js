const form = document.getElementById('almuerzoForm');
const resumenDias = document.getElementById('resumenDias');
const borrarBtn = document.getElementById('borrarTodo');
const limpiarBtn = document.getElementById('limpiar');
const carneSelect = document.getElementById('carneSelect');
const carneOtroInput = document.getElementById('carneOtroInput');
const chartCanvas = document.getElementById('chartCarnes').getContext('2d');
let chart;

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

  data.slice(0, 5).forEach(({ fecha, plato, carne, ingredientes }) => {
    const div = document.createElement('div');
    div.className = 'dia';
    div.innerHTML = `
      <strong>${fecha}</strong><br>
      <em>${plato}</em><br>
      <small>Carne: ${carne}</small><br>
      <small>Ingredientes: ${ingredientes}</small>
      <button onclick="eliminarAlmuerzo('${fecha}')">×</button>`;
    resumenDias.appendChild(div);
  });

  renderChart(data);
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
        backgroundColor: '#3498db',
        borderRadius: 5,
        hoverBackgroundColor: '#2980b9'
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

// Manejo del formulario
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

  if (data.some(item => item.fecha === nuevo.fecha)) {
    alert('Ya existe un almuerzo registrado para ese día.');
    return;
  }

  data.push(nuevo);
  setData(data);
  form.reset();
  carneOtroInput.style.display = 'none';
  renderData();

  alert('Almuerzo guardado correctamente!');
});

// Limpiar formulario
limpiarBtn.addEventListener('click', () => {
  form.reset();
  carneOtroInput.style.display = 'none';
  carneOtroInput.required = false;
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
