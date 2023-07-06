const { ipcRenderer } = require('electron');

// Manejar el evento 'login-success' en el proceso de renderizado
ipcRenderer.on('login-success', (event, usuarioId) => {
  // Aquí puedes realizar las acciones después de que el usuario haya iniciado sesión correctamente
  obtenerDetallesUsuario(usuarioId);
});

// Función para obtener los detalles del usuario
function obtenerDetallesUsuario(usuarioId) {
  ipcRenderer.send('obtener-detalles-usuario', usuarioId);
}
