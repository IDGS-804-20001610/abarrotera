const { ipcRenderer } = require('electron');

const formulario = document.getElementById('agregar-producto-form');
const cancelarButton = document.getElementById('cancelar-button');

// Escuchar el evento de cancelar
cancelarButton.addEventListener('click', () => {
  window.location.href = 'productos.html';
});

// Escuchar el evento de envío del formulario
formulario.addEventListener('submit', (event) => {
  event.preventDefault();

  const nombreInput = document.getElementById('nombre');
  const precioCompraInput = document.getElementById('precioCompra');
  const precioVentaInput = document.getElementById('precioVenta');
  const unidadVentaSelect = document.getElementById('unidadVenta');
  const cantidadInput = document.getElementById('cantidad');
  const fechaCompraInput = document.getElementById('fechaCompra');
  const codigoBarrasInput = document.getElementById('codigoBarras');

  const producto = {
    nombre: nombreInput.value,
    precio_compra: parseFloat(precioCompraInput.value),
    precio_venta: parseFloat(precioVentaInput.value),
    unidad_venta: unidadVentaSelect.value,
    cantidad: parseInt(cantidadInput.value),
    fecha_compra: fechaCompraInput.value,
    codigo_barras: codigoBarrasInput.value,
  };
  ipcRenderer.send('agregar-producto', producto); // Enviar mensaje al proceso principal para guardar el producto
});

// Escuchar el evento de producto agregado
ipcRenderer.on('producto-agregado', () => {
  window.location.href = 'productos.html';
});
