const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a los elementos del formulario
  const selectTemporalidad = document.getElementById('select-temporalidad');
  const inputFechaInicio = document.getElementById('input-fecha-inicio');
  const inputFechaFin = document.getElementById('input-fecha-fin');
  const btnGenerar = document.getElementById('btn-generar');
  const cardIngresos = document.getElementById('card-ingresos');
  const cardEgresos = document.getElementById('card-egresos');
  const cardGananciaPerdida = document.getElementById('card-ganancia-perdida');
  const tablaProductosVendidos = document.getElementById('tabla-productos-vendidos');
  const tablaLogs = document.getElementById('tabla-logs');
  

  // Mostrar información por defecto para 'hoy'
  mostrarInformacionTemporalidad('hoy');

  // Agregar evento de cambio en el select de temporalidad
  selectTemporalidad.addEventListener('change', () => {
    const temporalidad = selectTemporalidad.value;
    habilitarFechasPersonalizadas(temporalidad === 'personalizado');
  });

  // Agregar evento de clic al botón "Generar"
  btnGenerar.addEventListener('click', () => {
    const temporalidad = selectTemporalidad.value;
    const fechaInicio = inputFechaInicio.value;
    const fechaFin = inputFechaFin.value;

    generarDatos(temporalidad, fechaInicio, fechaFin);
  });

  // Función para habilitar o deshabilitar los inputs de fechas
  function habilitarFechasPersonalizadas(habilitar) {
    inputFechaInicio.disabled = !habilitar;
    inputFechaFin.disabled = !habilitar;
  }

  // Función para mostrar la información según la temporalidad seleccionada
  function mostrarInformacionTemporalidad(temporalidad) {
    // Restablecer los campos y elementos
    selectTemporalidad.value = temporalidad;
    habilitarFechasPersonalizadas(false);
    inputFechaInicio.value = '';
    inputFechaFin.value = '';
    cardIngresos.innerHTML = '<h2>Ingresos</h2>';
    cardEgresos.innerHTML = '<h2>Egresos</h2>';
    cardGananciaPerdida.innerHTML = '<h2>Ganancia o pérdida</h2>';
    tablaProductosVendidos.querySelector('tbody').innerHTML = '';
    tablaLogs.querySelector('tbody').innerHTML = '';

    // Generar datos según la temporalidad seleccionada
    generarDatos(temporalidad);
  }

  // Función para generar los datos según la temporalidad seleccionada
  function generarDatos(temporalidad, fechaInicio, fechaFin) {
    // Realizar la solicitud al proceso principal para obtener los datos según la temporalidad seleccionada
    ipcRenderer.send('generar-datos-dashboard', { temporalidad, fechaInicio, fechaFin });
  }

  // Manejar la respuesta del evento 'datos-dashboard-generados'
  ipcRenderer.on('datos-dashboard-generados', (event, datos) => {
    const { ingresos, egresos, gananciaPerdida, productosVendidos, logs } = datos;

    // Mostrar los datos en las secciones correspondientes del Dashboard
    mostrarIngresos(ingresos);
    mostrarEgresos(egresos);
    mostrarGananciaPerdida(gananciaPerdida);
    mostrarProductosVendidos(productosVendidos);
    mostrarLogs(logs);
  });

  // Función para mostrar los datos de ingresos en la sección correspondiente
  function mostrarIngresos(ingresos) {
    const html = `<h2>Ingresos</h2>
                  <p>Total: ${ingresos.total}</p>
                  <p>Cantidad de ventas: ${ingresos.cantidadVentas}</p>`;
    cardIngresos.innerHTML = html;
  }

  // Función para mostrar los datos de egresos en la sección correspondiente
  function mostrarEgresos(egresos) {
    const html = `<h2>Egresos</h2>
                  <p>Total: ${egresos.total}</p>
                  <p>Cantidad de compras: ${egresos.cantidadCompras}</p>`;
    cardEgresos.innerHTML = html;
  }

  // Función para mostrar los datos de ganancia o pérdida en la sección correspondiente
  function mostrarGananciaPerdida(gananciaPerdida) {
    const html = `<h2>Ganancia o pérdida</h2>
                  <p>${gananciaPerdida}</p>`;
    cardGananciaPerdida.innerHTML = html;
  }

  // Función para mostrar los datos de los productos más vendidos en la tabla correspondiente
  function mostrarProductosVendidos(productosVendidos) {
    const tbody = tablaProductosVendidos.querySelector('tbody');
    tbody.innerHTML = '';

    productosVendidos.forEach((producto) => {
      const row = document.createElement('tr');
      const nombreCell = document.createElement('td');
      const cantidadCell = document.createElement('td');

      nombreCell.textContent = producto.nombre;
      cantidadCell.textContent = producto.cantidad;

      row.appendChild(nombreCell);
      row.appendChild(cantidadCell);
      tbody.appendChild(row);
    });
  }

  // Función para mostrar los datos de los logs en la tabla correspondiente
  function mostrarLogs(logs) {
    const tbody = tablaLogs.querySelector('tbody');
    tbody.innerHTML = '';

    logs.forEach((log) => {
      const row = document.createElement('tr');
      const fechaCell = document.createElement('td');
      const tipoCell = document.createElement('td');
      const descripcionCell = document.createElement('td');

      fechaCell.textContent = log.fecha;
      tipoCell.textContent = log.tipo;
      descripcionCell.textContent = log.descripcion;

      row.appendChild(fechaCell);
      row.appendChild(tipoCell);
      row.appendChild(descripcionCell);
      tbody.appendChild(row);
    });
  }
});
