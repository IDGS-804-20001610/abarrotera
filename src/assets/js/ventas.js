const { ipcRenderer } = require('electron');

const productoIds = {}; // Objeto para mantener el seguimiento de los IDs de productos en las filas de venta

// Obtener referencias a los elementos del formulario
const inputBuscar = document.getElementById('input-buscar');
const selectProducto = document.getElementById('select-producto');
const inputCantidad = document.getElementById('input-cantidad');
const inputUnidadMedida = document.getElementById('unidad-medida');
const btnAgregar = document.getElementById('btn-agregar');

const ventasTableBody = document.getElementById('ventas-table-body');
const totalVentaLabel = document.getElementById('total-venta');

const btnTerminar = document.getElementById('btn-terminar');
const inputPago = document.getElementById('input-pago');
const cambioLabel = document.getElementById('cambio');
const btnCobrar = document.getElementById('btn-cobrar');

// Agregar evento de entrada de texto para buscar productos
inputBuscar.addEventListener('input', (event) => {
  const valor = event.target.value;
  if (valor.trim() !== '') {
    ipcRenderer.send('buscar-productos', valor);
    selectProducto.disabled = false;
  } else {
    // Limpiar opciones del select
    selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
    // Limpiar unidad de medida
    inputUnidadMedida.value = '';
  }
});

// Manejar la respuesta de la búsqueda de productos
ipcRenderer.on('productos-encontrados', (event, productos) => {
  // Limpiar opciones del select
  selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
  // Limpiar unidad de medida
  inputUnidadMedida.value = '';

  // Agregar las opciones al select
  productos.forEach((producto) => {
    const option = document.createElement('option');
    option.value = producto.id;
    option.textContent = `${producto.codigo_barras} - ${producto.nombre}`;
    selectProducto.appendChild(option);
  });
});

// Agregar evento de cambio de opción en el select
selectProducto.addEventListener('change', (event) => {
  const productoId = event.target.value;
  if (productoId.trim() !== '') {
    ipcRenderer.send('obtener-producto', productoId);
  } else {
    // Limpiar unidad de medida
    inputUnidadMedida.value = '';
  }
});

// Manejar la respuesta de la obtención de un producto
ipcRenderer.on('producto-encontrado', (event, producto) => {
  const productoData = JSON.parse(producto);
  inputUnidadMedida.value = productoData.unidad_venta;

  // Agregar información adicional del producto al botón de agregar
  btnAgregar.dataset.nombre = productoData.nombre;
  btnAgregar.dataset.precioUnitario = productoData.precio_venta;
});

// Agregar evento de clic al botón de agregar
btnAgregar.addEventListener('click', () => {
  const productoId = selectProducto.value; // Obtener el ID del producto del select
  const cantidad = inputCantidad.value;

  if (!productoId || isNaN(productoId) || !cantidad || cantidad.trim() === '' || isNaN(cantidad)) {
    alert('Debe seleccionar un producto válido y especificar una cantidad válida');
    return;
  }

  const producto = {
    productoId: parseInt(productoId),
    cantidad: parseInt(cantidad),
    nombre: btnAgregar.dataset.nombre, // Obtener el nombre del producto del dataset del botón
    precioUnitario: parseFloat(btnAgregar.dataset.precioUnitario), // Obtener el precio unitario del dataset del botón
  };

  ipcRenderer.send('agregar-producto-venta', producto);
});

// Obtener la fecha actual en el formato deseado
const now = new Date();
const fechaVenta = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

// Manejar la respuesta del evento agregar-producto-venta
ipcRenderer.on('producto-venta-agregado', (event, detalleVenta) => {
  // Limpiar campos
  inputBuscar.value = '';
  selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
  inputCantidad.value = '1';
  inputUnidadMedida.value = '';

  // Crear una nueva fila en la tabla
  const newRow = document.createElement('tr');
  newRow.classList.add('venta-row'); // Agregar la clase "venta-row" a la fila
  productoIds[newRow] = detalleVenta.productoId;

  // Verificar si las propiedades esperadas existen en detalleVenta
  if (detalleVenta.producto && detalleVenta.subtotal) {
    // Crear las celdas para los datos del producto
    const nombreCell = document.createElement('td');
    nombreCell.textContent = detalleVenta.producto.nombre;

    const cantidadCell = document.createElement('td');
    const cantidadInput = document.createElement('input');
    cantidadInput.type = 'number';
    cantidadInput.value = detalleVenta.cantidad;
    cantidadInput.min = '1';
    cantidadInput.addEventListener('input', () => {
      const newCantidad = parseInt(cantidadInput.value);
      const newSubtotal = newCantidad * detalleVenta.producto.precio_venta;
      subtotalCell.textContent = newSubtotal.toFixed(2);
      detalleVenta.cantidad = newCantidad;
      detalleVenta.subtotal = newSubtotal;
      ipcRenderer.send('actualizar-ventas');
      actualizarTotalVenta();
    });
    cantidadCell.appendChild(cantidadInput);

    const precioCell = document.createElement('td');
    precioCell.textContent = detalleVenta.producto.precio_venta;

    const subtotalCell = document.createElement('td');
    subtotalCell.textContent = detalleVenta.subtotal.toFixed(2);

    const accionesCell = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
    btnEliminar.addEventListener('click', () => {
      newRow.remove();
      ipcRenderer.send('eliminar-producto-venta', detalleVenta);
      ipcRenderer.send('actualizar-ventas'); // Actualizar la tabla de ventas
      actualizarTotalVenta();
    });
    accionesCell.appendChild(btnEliminar);

    // Agregar las celdas a la fila
    newRow.appendChild(nombreCell);
    newRow.appendChild(cantidadCell);
    newRow.appendChild(precioCell);
    newRow.appendChild(subtotalCell);
    newRow.appendChild(accionesCell);

    // Agregar la fila a la tabla
    ventasTableBody.appendChild(newRow);

    console.log('Producto agregado a la venta');

    // Actualizar la tabla de ventas
    ipcRenderer.send('actualizar-ventas');
    actualizarTotalVenta();

    // Obtener el total de la venta
    const totalVenta = parseFloat(totalVentaLabel.textContent);

    // Verificar si el total de la venta es válido
    if (isNaN(totalVenta)) {
      console.error('Error: el valor del total de la venta no es válido');
      return;
    }

    const producto = {
      productoId: parseInt(productoId),
      // Resto de las propiedades del producto
    };

// Asignar el valor del total de la venta a detalleVenta.total
detalleVenta.total = totalVenta;

// Verificar si el ID del producto es válido
if (isNaN(detalleVenta.productoId)) {
  console.error('Error: el valor del ID del producto no es válido');
  return;
}

// Asignar el valor del ID del producto a detalleVenta.productoId
detalleVenta.productoId = parseInt(productoId);


// Enviar detalleVentaJSON al proceso principal
try {
  const detalleVentaJSON = JSON.stringify(detalleVenta);
  JSON.parse(detalleVentaJSON); // Verificar si es un JSON válido
  ipcRenderer.send('agregar-venta', {
    fechaVenta: fechaVenta,
    detalleVenta: detalleVentaJSON,
  });
} catch (error) {
  console.error('Error al convertir detalleVenta a JSON:', error);
}

  }
});

function actualizarTotalVenta() {
  const rows = Array.from(ventasTableBody.querySelectorAll('.venta-row'));
  const ventas = rows.map((row) => {
    const cantidad = parseInt(row.querySelector('input[type="number"]').value);
    const precioUnitario = parseFloat(row.querySelectorAll('td')[2].textContent);
    const subtotal = cantidad * precioUnitario;
    row.querySelectorAll('td')[3].textContent = subtotal.toFixed(2);
    return subtotal;
  });

  const totalVenta = ventas.reduce((total, subtotal) => total + subtotal, 0);
  totalVentaLabel.textContent = totalVenta.toFixed(2);
}

btnTerminar.addEventListener('click', () => {
  // Obtener el total de la venta
  const totalVenta = parseFloat(totalVentaLabel.textContent);

  // Mostrar una alerta con el total de la venta
  alert(`Total de la venta: $${totalVenta.toFixed(2)}`);

  // Habilitar el contenedor de cobro
  document.getElementById('cobro-container').style.display = 'block';

  // Habilitar el botón de cobrar si el total es mayor a cero
  if (totalVenta > 0) {
    btnCobrar.disabled = false;
  } else {
    btnCobrar.disabled = true;
  }
});

// Agregar evento de cambio en el campo de pago
inputPago.addEventListener('input', () => {
  const pago = parseFloat(inputPago.value);
  const totalVenta = parseFloat(totalVentaLabel.textContent);
  const cambio = pago - totalVenta;

  // Mostrar el cambio
  if (!isNaN(cambio) && cambio >= 0) {
    cambioLabel.textContent = cambio.toFixed(2);
    btnCobrar.disabled = false;
  } else {
    cambioLabel.textContent = '0.00';
    btnCobrar.disabled = true;
  }
});

// Agregar evento de clic al botón "Terminar"
btnTerminar.addEventListener('click', () => {
  // Obtener el total de la venta
  const totalVenta = parseFloat(totalVentaLabel.textContent);

  // Mostrar una alerta con el total de la venta
  alert(`Total de la venta: $${totalVenta.toFixed(2)}`);

  // Habilitar el contenedor de cobro
  document.getElementById('cobro-container').style.display = 'block';

  // Habilitar el botón de cobrar si el total es mayor a cero
  if (totalVenta > 0) {
    btnCobrar.disabled = false;
  } else {
    btnCobrar.disabled = true;
  }
});

// Agregar evento de cambio en el campo de pago
inputPago.addEventListener('input', () => {
  const pago = parseFloat(inputPago.value);
  const totalVenta = parseFloat(totalVentaLabel.textContent);
  const cambio = pago - totalVenta;

  // Mostrar el cambio
  if (!isNaN(cambio) && cambio >= 0) {
    cambioLabel.textContent = cambio.toFixed(2);
    btnCobrar.disabled = false;
  } else {
    cambioLabel.textContent = '0.00';
    btnCobrar.disabled = true;
  }
});

// Agregar evento de clic al botón de cobrar
btnCobrar.addEventListener('click', () => {
  const pago = parseFloat(inputPago.value);
  const totalVenta = parseFloat(totalVentaLabel.textContent);
  const cambio = parseFloat(cambioLabel.textContent);

  // Crear un objeto con la información de la venta
  const venta = {
    totalVenta: totalVenta,
    pago: pago,
    cambio: cambio,
    detalleVenta: obtenerDetalleVenta(),
  };

  // Obtener la fecha actual
  const fechaVenta = new Date().toISOString().split('T')[0];

  console.log(obtenerDetalleVenta())
  // Enviar la venta a la base de datos (puedes modificar esta parte según tus necesidades)
  ipcRenderer.send('agregar-venta', {
    fechaVenta: fechaVenta,
    total: totalVenta,
    //usuarioId: usuarioId,
    detalleVenta: obtenerDetalleVenta(),
  });
});

// Función para obtener el detalle de la venta en formato JSON
function obtenerDetalleVenta() {
  const rows = Array.from(ventasTableBody.querySelectorAll('.venta-row'));
  const detalleVenta = rows.map((row) => {
    const cantidad = parseInt(row.querySelector('input[type="number"]').value);
    const precioUnitario = parseFloat(row.querySelectorAll('td')[2].textContent);
    const subtotal = cantidad * precioUnitario;
    const productoId = productoIds[row]; // Obtener el ID del producto utilizando productoIds
    return {
      productoId: productoId,
      cantidad: cantidad,
      subtotal: subtotal,
    };
  });

  return detalleVenta;
}
