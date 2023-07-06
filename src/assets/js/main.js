// Obtenemos los elementos del formulario y la tabla
const buscarProductoForm = document.getElementById('buscar-producto-form');
const anadirProductoForm = document.getElementById('anadir-producto-form');
const detalleVentaTableBody = document.getElementById('detalle-venta-table-body');
const totalVentaElement = document.getElementById('total-venta');

// Variable para almacenar el detalle de la venta
let detalleVenta = [];

// Función para buscar un producto
function buscarProducto(event) {
  event.preventDefault();
  // Obtener el valor del input de búsqueda
  const buscarProductoInput = document.getElementById('buscar-producto');
  const valorBusqueda = buscarProductoInput.value.trim();

  // Realizar la lógica de búsqueda del producto
  // ...

  // Mostrar los resultados en la tabla
  // ...
}

// Función para añadir un producto a la venta
function anadirProducto(event) {
  event.preventDefault();
  // Obtener los valores del formulario de añadir producto
  const cantidadInput = document.getElementById('cantidad');
  const cantidad = parseInt(cantidadInput.value);
  // Validar que la cantidad sea un número válido
  if (isNaN(cantidad) || cantidad <= 0) {
    alert('La cantidad debe ser un número válido y mayor que cero.');
    return;
  }

  // Realizar la lógica de añadir el producto a la venta
  // ...

  // Actualizar la tabla de detalle de la venta
  actualizarTablaDetalleVenta();

  // Limpiar el formulario de añadir producto
  cantidadInput.value = '';
}

// Función para actualizar la tabla de detalle de la venta
function actualizarTablaDetalleVenta() {
  // Limpiar el contenido actual de la tabla
  detalleVentaTableBody.innerHTML = '';

  // Recorrer el detalle de la venta y agregar cada producto a la tabla
  detalleVenta.forEach((producto) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${producto.nombre}</td>
      <td>${producto.cantidad}</td>
      <td>${producto.precio}</td>
      <td>${producto.subtotal}</td>
      <td>
        <button onclick="eliminarProducto(${producto.id})">Eliminar</button>
      </td>
    `;
    detalleVentaTableBody.appendChild(row);
  });

  // Calcular y mostrar el total de la venta
  const totalVenta = detalleVenta.reduce((total, producto) => total + producto.subtotal, 0);
  totalVentaElement.textContent = totalVenta.toFixed(2);
}

// Función para eliminar un producto del detalle de la venta
function eliminarProducto(productoId) {
  // Realizar la lógica para eliminar el producto del detalle de la venta
  // ...

  // Actualizar la tabla de detalle de la venta
  actualizarTablaDetalleVenta();
}

// Agregar los listeners a los formularios
buscarProductoForm.addEventListener('submit', buscarProducto);
anadirProductoForm.addEventListener('submit', anadirProducto);
