// Gestión de la PWA
class PWAManager {
    constructor() {
        this.installButton = document.getElementById('installButton');
        this.deferredPrompt = null;
        this.initInstallButton();
        this.initEventListeners();
    }

    initInstallButton() {
        this.installButton.style.display = 'none';
        
        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('La aplicación ya está instalada');
            this.installButton.style.display = 'none';
        }
    }

    initEventListeners() {
        // Detectar si la PWA es instalable
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA es instalable');
            e.preventDefault();
            this.deferredPrompt = e;
            this.installButton.style.display = 'block';
        });

        // Manejar el clic en el botón de instalación
        this.installButton.addEventListener('click', async () => {
            console.log('Clic en instalar');
            if (!this.deferredPrompt) {
                console.log('No hay prompt de instalación disponible');
                return;
            }
            
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`Usuario eligió: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('Usuario aceptó instalar la PWA');
            }
            
            this.deferredPrompt = null;
            this.installButton.style.display = 'none';
        });

        // Detectar cuando la PWA ha sido instalada
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA instalada exitosamente');
            this.installButton.style.display = 'none';
        });
    }
}
