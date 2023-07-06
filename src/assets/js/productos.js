const { ipcRenderer } = require('electron');
const url = require('url');
const path = require('path');

document.addEventListener('DOMContentLoaded', () => {
  // Cargar la lista de productos al cargar la página
  ipcRenderer.send('load-productos');
});

// Mostrar la tabla de productos
ipcRenderer.on('productos-loaded', (event, productos) => {
  const productosTableContainer = document.getElementById('productos-table-container');
  if (!productosTableContainer) {
    console.error("Element with ID 'productos-table-container' not found.");
    return;
  }

  productosTableContainer.innerHTML = '';

  const productosTable = document.createElement('table');
  productosTable.id = 'productos-table';
  productosTable.innerHTML = `
    <thead>
      <tr>
        <th>Código de Barras</th>
        <th>Nombre</th>
        <th>Precio de Compra</th>
        <th>Precio de Venta</th>
        <th>Unidad de Venta</th>
        <th>Cantidad</th>
        <th>Fecha de Compra</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <!-- Aquí se agregan las filas de productos -->
    </tbody>
  `;

  productos.forEach((producto) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${producto.codigo_barras}</td>
      <td>${producto.nombre}</td>
      <td>${producto.precio_compra}</td>
      <td>${producto.precio_venta}</td>
      <td>${producto.unidad_venta}</td>
      <td>${producto.cantidad}</td>
      <td>${producto.fecha_compra}</td>
      <td>
        <button class="editar-button" data-id="${producto.id}">Editar</button>
        <button class="eliminar-button" data-id="${producto.id}">Eliminar</button>
      </td>
    `;

    productosTable.querySelector('tbody').appendChild(row);
  });

  productosTableContainer.appendChild(productosTable);
});

// Manejar el evento de agregar producto
document.getElementById('agregar-button').addEventListener('click', () => {
  const productosFormURL = url.format({
    pathname: path.join(__dirname, 'agregar-producto.html'),
    protocol: 'file:',
    slashes: true,
  });

  ipcRenderer.send('open-productos-form', productosFormURL, null);
});

// Manejar el evento de editar producto
document.getElementById('productos-table-container').addEventListener('click', (event) => {
  if (event.target.classList.contains('editar-button')) {
    const productoId = event.target.getAttribute('data-id');
    console.log('productoId:', productoId);

    const productosFormURL = url.format({
      pathname: path.join(__dirname, 'editar-producto.html'),
      protocol: 'file:',
      slashes: true,
    });

    ipcRenderer.send('open-productos-form', productosFormURL, productoId);
    console.log('Valor de productoId en la página de edición:', productoId); // Agregar esta línea
  }
});

// Manejar el evento de eliminar producto
document.getElementById('productos-table-container').addEventListener('click', (event) => {
  if (event.target.classList.contains('eliminar-button')) {
    const productoId = event.target.getAttribute('data-id');
    ipcRenderer.send('eliminar-producto', productoId);
  }
});

// Manejar el evento de búsqueda
const buscarInput = document.getElementById('buscar-input');
const mensajeNoResultado = document.getElementById('mensaje-no-resultado');

buscarInput.addEventListener('input', (event) => {
  const searchText = event.target.value.toLowerCase();
  const productosRows = document.querySelectorAll('#productos-table tbody tr');

  let hasResult = false;

  productosRows.forEach((row) => {
    const codigoBarrasColumn = row.querySelector('td:nth-child(1)');
    const nombreColumn = row.querySelector('td:nth-child(2)');
    const codigoBarras = codigoBarrasColumn.textContent.toLowerCase();
    const nombre = nombreColumn.textContent.toLowerCase();

    if (codigoBarras.includes(searchText) || nombre.includes(searchText)) {
      row.style.display = ''; // Mostrar fila si coincide con el texto de búsqueda
      hasResult = true;
    } else {
      row.style.display = 'none'; // Ocultar fila si no coincide con el texto de búsqueda
    }
  });

  if (hasResult) {
    mensajeNoResultado.style.display = 'none'; // Ocultar mensaje de no resultado si hay coincidencias
  } else {
    mensajeNoResultado.style.display = ''; // Mostrar mensaje de no resultado si no hay coincidencias
  }
});

// Manejar el evento de restablecer el mensaje cuando se ingrese texto
buscarInput.addEventListener('keydown', () => {
  mensajeNoResultado.style.display = 'none';
});
