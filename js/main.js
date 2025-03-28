// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar los manejadores
    const taskManager = new TaskManager();
    const tagManager = new TagManager();
    const calendarManager = new CalendarManager(taskManager);
    const uiManager = new UIManager(taskManager, tagManager, calendarManager);
    const themeManager = new ThemeManager();
    const pwaManager = new PWAManager();

    // Renderizar las tareas iniciales
    uiManager.renderTasks();

    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado exitosamente:', registration);
                })
                .catch(error => {
                    console.log('Error al registrar el ServiceWorker:', error);
                });
        });
    }
});
