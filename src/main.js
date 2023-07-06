const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const mysql = require('mysql');

let mainWindow;
let dbConnection;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views/login.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Abre las DevTools (opcional)
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    app.quit();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Conectarse a la base de datos
dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'db_tienda',
});

dbConnection.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexion exitosa a la base de datos');
  }
});

// Manejar el evento de inicio de sesión
ipcMain.on('login', (event, { username, password }) => {
  const query = 'SELECT * FROM usuarios WHERE user = ? AND contrasena = ?';

  dbConnection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err.message);
      event.sender.send('login-error', 'Error en el servidor');
    } else {
      if (results.length > 0) {
        ipcMain.on('login-success', (event, usuarioId) => {
          console.log('Evento login-success disparado');
          console.log('ID de usuario recibido:', usuarioId);
          mainWindow.webContents.send('usuario-id', usuarioId); // Enviar el ID de usuario al proceso de renderizado
        });

        mainWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, './views/productos.html'),
            protocol: 'file:',
            slashes: true,
          })
        );
      } else {
        event.sender.send('login-error', 'Credenciales inválidas');
      }
    }
  });
});




// ...

ipcMain.on('open-productos-form', (event, productosFormURL, productoId) => {
  console.log('productoId:', productoId); // Agregar esta línea
  if (productoId !== null && productoId !== undefined) {
    // Editar producto existente
    const query = 'SELECT * FROM productos WHERE id = ?';
    console.log('query:', query, productoId); // Agregar esta línea
    dbConnection.query(query, [productoId], (err, results) => {
      if (err) {
        console.error('Error al obtener el producto:', err.message);
        event.reply('producto-error', 'Error al obtener el producto');
      } else {
        if (results.length > 0) {
          const producto = results[0];
          console.log('Producto obtenido de la base de datos:', producto);
          const productoJSON = JSON.stringify(producto);

          event.sender.send('producto-encontrado', productoJSON);

          mainWindow.loadURL(productosFormURL);
        } else {
          console.log('No se encontró el producto con ID', productoId);
          event.reply('producto-error', 'No se encontró el producto');
        }
      }
    });
  } else {
    // Agregar nuevo producto
    event.reply('producto-agregar');

    mainWindow.loadURL(productosFormURL);
  }
});

// Manejar el evento de agregar producto
ipcMain.on('agregar-producto', (event, producto) => {
  console.log('Evento de agregar producto recibido:', producto);

  const query = 'INSERT INTO productos SET ?';

  dbConnection.query(query, producto, (err, result) => {
    if (err) {
      console.error('Error al guardar el producto:', err.message);
      event.sender.send('producto-error', 'Error al guardar el producto');
    } else {
      console.log('Producto guardado exitosamente');
      event.sender.send('producto-agregado');
    }
  });
});

// Manejar el evento de editar producto
ipcMain.on('editar-producto', (event, producto) => {
  console.log('Producto recibido desde el servidor:', producto);
  const query = 'CALL modificar_producto(?, ?, ?, ?, ?, ?, ?, ?)';
  const { id, nombre, precio_compra, precio_venta, unidad_venta, cantidad, fecha_compra, codigo_barras } = producto;

  dbConnection.query(
    query,
    [id, nombre, precio_compra, precio_venta, unidad_venta, cantidad, fecha_compra, codigo_barras],
    (err, results) => {
      if (err) {
        console.error('Error al editar el producto:', err.message);
        event.sender.send('producto-error', 'Error al editar el producto');
      } else {
        dbConnection.commit((commitErr) => {
          if (commitErr) {
            console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
            event.sender.send('producto-error', 'Error al guardar los cambios en la base de datos');
          } else {
            console.log('Producto editado exitosamente');
            const productoActualizado = { // Definir el objeto productoActualizado antes de enviar el evento producto-editado
              id: id,
              nombre: nombre,
              precio_compra: precio_compra,
              precio_venta: precio_venta,
              unidad_venta: unidad_venta,
              cantidad: cantidad,
              fecha_compra: fecha_compra,
              codigo_barras: codigo_barras
            };
            event.sender.send('producto-editado', productoActualizado); // Enviar el evento producto-editado con el objeto productoActualizado
          }
        });
      }
    }
  );
});

// Manejar el evento de obtener producto
/*ipcMain.on('obtener-producto', (event, productoId) => {
  console.log('Valor de productoId en el evento obtener-producto:', productoId); // Agregar esta línea
  const query = 'SELECT * FROM productos WHERE id = ?';

  dbConnection.query(query, [productoId], (err, results) => {
    if (err) {
      console.error('Error al obtener el producto:', err.message);
      event.reply('producto-error', 'Error al obtener el producto');
    } else {
      const producto = results[0]; // Acceder al primer elemento del arreglo de resultados
      console.log('Producto obtenido de la base de datos:', producto);

      if (producto) {
        const productoJSON = JSON.stringify(producto); // Convertir el objeto producto en una cadena JSON antes de enviarlo al renderizador
        event.reply('producto-encontrado', productoJSON);
      } else {
        console.error('No se encontro el producto con ID', productoId);
        event.reply('producto-error', 'No se encontró el producto');
      }
    }
  });
});*/


// Manejar el evento de eliminar producto
ipcMain.on('eliminar-producto', (event, productoId) => {
  const query = 'CALL eliminar_producto(?)';

  dbConnection.query(query, [productoId], (err, results) => {
    if (err) {
      console.error('Error al eliminar el producto:', err.message);
      event.sender.send('producto-error', 'Error al eliminar el producto');
    } else {
      console.log('Producto eliminado exitosamente');
      event.sender.send('producto-eliminado');
      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, './views/productos.html'),
          protocol: 'file:',
          slashes: true,
        })
      );
    }
  });
});

// Manejar la carga de productos
ipcMain.on('load-productos', (event) => {
  const query = 'CALL obtener_productos';

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err.message);
      event.sender.send('producto-error', 'Error al obtener los productos');
    } else {
      const productos = results[0];
      event.sender.send('productos-loaded', productos);
    }
  });
});

// Manejar el evento de regresar a la tabla de productos
ipcMain.on('regresar-tabla', (event) => {
  const query = 'CALL obtener_productos()';

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err.message);
      event.sender.send('producto-error', 'Error al obtener los productos');
    } else {
      const productos = results[0];
      event.sender.send('productos-loaded', productos); // Enviamos el evento con los productos al renderizador
    }
  });
});

// Evento para buscar productos en la base de datos
ipcMain.on('buscar-productos', (event, valor) => {
  const query = `SELECT * FROM productos WHERE codigo_barras LIKE '%${valor}%' OR nombre LIKE '%${valor}%'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al buscar productos:', err.message);
      event.reply('productos-encontrados', []);
    } else {
      event.reply('productos-encontrados', results);
    }
  });
});

// Evento para obtener la información de un producto
ipcMain.on('obtener-producto', (event, productoId) => {
  const query = `SELECT * FROM productos WHERE id = ${productoId}`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener producto:', err.message);
      event.reply('producto-obtenido', {});
    } else {
      event.reply('producto-obtenido', results[0]);
    }
  });
});

// Manejar el evento de agregar producto a la venta
ipcMain.on('agregar-producto-venta', (event, producto) => {
  const { productoId, cantidad } = producto;

  if (!productoId || !cantidad) {
    console.error('Error al agregar producto a la venta: faltan datos');
    event.reply('producto-venta-error', 'Faltan datos para agregar el producto a la venta');
    return;
  }

  const query = 'SELECT * FROM productos WHERE id = ?';

  dbConnection.query(query, [productoId], (err, results) => {
    if (err) {
      console.error('Error al obtener el producto:', err.message);
      event.reply('producto-venta-error', 'Error al obtener el producto');
    } else {
      if (results.length > 0) {
        const producto = results[0];
        const subtotal = producto.precio_venta * cantidad;

        const detalleVenta = {
          producto: {
            nombre: producto.nombre,
            precio_venta: producto.precio_venta
          },
          cantidad,
          subtotal
        };

        event.reply('producto-venta-agregado', detalleVenta);
      } else {
        console.error('No se encontró el producto con ID', productoId);
        event.reply('producto-venta-error', 'No se encontró el producto');
      }
    }
  });
});

// Manejar el evento de eliminar producto de la venta
ipcMain.on('eliminar-producto-venta', (event, detalleVenta) => {
  // Aquí puedes realizar las acciones necesarias para eliminar el producto de la venta
  console.log('Eliminar producto de la venta:', detalleVenta);
});

// Manejar el evento de actualizar ventas
ipcMain.on('actualizar-ventas', (event, ventas) => {
  const query = 'CALL obtener_ventas';

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las ventas:', err.message);
      event.sender.send('ventas-error', 'Error al obtener las ventas');
    } else {
      const filasVentas = results[0];
      const totalVenta = filasVentas.reduce((total, venta) => total + venta.subtotal, 0);
      event.sender.send('ventas-actualizadas', filasVentas, totalVenta);
    }
  });
});

// Manejar el evento 'agregar-venta' en el proceso principal
ipcMain.on('agregar-venta', (event, { fechaVenta, total, detalleVenta }) => {
  const query = 'CALL agregar_venta(?, ?, ?)';
  
  dbConnection.query(query, [fechaVenta, total, detalleVenta], (err, results) => {
    if (err) {
      console.error('Error al guardar la venta:', err.message);
      event.sender.send('venta-error', 'Error al guardar la venta');
    } else {
      // La venta se ha guardado exitosamente
      event.sender.send('venta-guardada');
    }
  });
});


