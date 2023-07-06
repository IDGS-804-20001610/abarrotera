const { ipcRenderer } = require('electron');

// En la página de edición de productos
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const idProducto = urlParams.get('id');
console.log('Valor de productoId en la página de edición:', idProducto);

// Esperar a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', () => {

  const formulario = document.getElementById('editar-producto-form');
  const cancelarButton = document.getElementById('cancelar-button');
  const nombreInput = document.querySelector('#nombre');
  const precioCompraInput = document.querySelector('#precio_compra');
  const precioVentaInput = document.querySelector('#precio_venta');
  const unidadVentaSelect = document.querySelector('#unidad_venta');
  const cantidadInput = document.querySelector('#cantidad');
  const fechaCompraInput = document.querySelector('#fecha_compra');
  const codigoBarrasInput = document.querySelector('#codigo_barras');

  // Enviar mensaje al proceso principal para obtener los datos del producto correspondiente
  ipcRenderer.send('obtener-producto', idProducto);
  console.log('Valor de productoId en la página de edición:', idProducto);

  // Escuchar el evento de cancelar
cancelarButton.addEventListener('click', () => {
  window.location.href = 'productos.html';
});

  // Escuchar el evento de envío del formulario
  formulario.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtener los valores de los campos del formulario
    const producto = {
      id: idProducto,
      nombre: nombreInput.value,
      precio_compra: parseFloat(precioCompraInput.value),
      precio_venta: parseFloat(precioVentaInput.value),
      unidad_venta: unidadVentaSelect.value,
      cantidad: parseInt(cantidadInput.value),
      fecha_compra: fechaCompraInput.value,
      codigo_barras: codigoBarrasInput.value,
    };

    // Enviar mensaje al proceso principal para actualizar el producto
    ipcRenderer.send('editar-producto', producto);
  });

  // Escuchar el evento de respuesta del proceso principal con los datos del producto
  ipcRenderer.on('producto-encontrado', (event, productoJSON) => {
    console.log('Valor de productoJSON en el evento producto-encontrado:', productoJSON); // Agregar esta línea
    try {
      const producto = JSON.parse(productoJSON); // Analizar la cadena JSON para convertirla en un objeto
      console.log('Producto obtenido del proceso principal:', producto);
  
      // Asignar los valores del producto a los campos correspondientes del formulario
      nombreInput.value = producto.nombre;
      precioCompraInput.value = producto.precio_compra;
      precioVentaInput.value = producto.precio_venta;
      unidadVentaSelect.value = producto.unidad_venta;
      cantidadInput.value = producto.cantidad;
      fechaCompraInput.value = producto.fecha_compra;
      codigoBarrasInput.value = producto.codigo_barras;
    } catch (e) {
      console.error('Error al analizar la cadena JSON:', e.message);
    }
  });
  
});