// Lógica de instalación de PWA
document.addEventListener("DOMContentLoaded", () => {
    let deferredPrompt;
    const installContainer = document.getElementById('install-container');
    const installButton = document.getElementById('installButton');

    // Comprobamos si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');

    // Si ya está instalada, no mostramos el botón
    if (isStandalone) {
        console.log('La aplicación ya está instalada');
        return;
    }

    // Escuchamos el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('Evento beforeinstallprompt detectado!');
        // Prevenimos el diálogo estándar de instalación
        e.preventDefault();
        // Guardamos el evento para usarlo más tarde
        deferredPrompt = e;
        // Mostramos el botón de instalación
        if (installContainer) {
            installContainer.style.display = 'block';
        }
    });

    // Manejador de clic en el botón de instalación
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                // Si no tenemos el evento, mostramos instrucciones manuales
                if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                    // Instrucciones para iOS
                    alert('Para instalar esta aplicación en iOS:\n1. Toca el icono de compartir\n2. Desplázate hacia abajo y selecciona "Añadir a pantalla de inicio"');
                } else {
                    // Instrucciones para Android/Desktop
                    alert('Para instalar esta aplicación:\n1. Abre el menú de opciones de tu navegador (tres puntos)\n2. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"');
                }
                return;
            }

            // Mostramos el diálogo de instalación
            deferredPrompt.prompt();
            // Esperamos la respuesta del usuario
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
            // Limpiamos el evento guardado
            deferredPrompt = null;
            // Ocultamos el botón
            if (installContainer) {
                installContainer.style.display = 'none';
            }
        });
    }

    // Escuchamos el evento de instalación exitosa
    window.addEventListener('appinstalled', (evt) => {
        console.log('¡La aplicación se instaló correctamente!');
        if (installContainer) {
            installContainer.style.display = 'none';
        }
    });

    // Si después de 5 segundos no se ha detectado el evento beforeinstallprompt,
    // mostramos el botón de todas formas para permitir la instalación manual
    setTimeout(() => {
        if (!deferredPrompt && installContainer && !isStandalone) {
            console.log('Mostrando botón de instalación manual después de timeout');
            installContainer.style.display = 'block';
        }
    }, 5000);
});