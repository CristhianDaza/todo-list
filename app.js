// Código de instalación PWA
let deferredPrompt;
const installButton = document.getElementById('installButton');

// Ocultar el botón de instalación por defecto
installButton.style.display = 'none';

// Detectar si la PWA es instalable
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA es instalable');
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
});

// Manejar el clic en el botón de instalación
installButton.addEventListener('click', async () => {
    console.log('Clic en instalar');
    if (!deferredPrompt) {
        console.log('No hay prompt de instalación disponible');
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario eligió: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
    }
    
    deferredPrompt = null;
    installButton.style.display = 'none';
});

// Detectar cuando la PWA ha sido instalada
window.addEventListener('appinstalled', (e) => {
    console.log('PWA instalada exitosamente');
    installButton.style.display = 'none';
});

// Verificar si ya está instalada
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('La aplicación ya está instalada');
    installButton.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const taskCount = document.getElementById('taskCount');
    const pendingCount = document.getElementById('pendingCount');
    
    // Cargar tareas guardadas
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks();

    // Agregar tarea con el botón
    const addTaskButton = document.getElementById('addTask');
    addTaskButton.addEventListener('click', addTask);

    // Agregar tarea con Enter
    const taskInput = document.getElementById('taskInput');
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Sistema de notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        const notifications = document.getElementById('notifications');
        notifications.appendChild(notification);

        // Forzar un reflow para asegurar la animación
        notification.offsetHeight;

        // Mostrar la notificación con animación
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';

        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Modal de confirmación
    const deleteModal = document.getElementById('deleteModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    let taskToDelete = null;

    function showDeleteModal(taskId) {
        taskToDelete = taskId;
        deleteModal.classList.add('show');
    }

    function hideDeleteModal() {
        deleteModal.classList.remove('show');
        taskToDelete = null;
    }

    confirmDelete.addEventListener('click', () => {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            hideDeleteModal();
        }
    });

    cancelDelete.addEventListener('click', hideDeleteModal);

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString()
            };
            tasks.push(task);
            saveTasks();
            renderTasks();
            taskInput.value = '';
            showNotification('Tarea agregada exitosamente', 'success');
        } else {
            showNotification('Por favor ingresa una tarea válida', 'error');
        }
    }

    function updateProgress() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}% completado`;
        
        taskCount.textContent = `${totalTasks} ${totalTasks === 1 ? 'tarea total' : 'tareas totales'}`;
        pendingCount.textContent = `${pendingTasks} ${pendingTasks === 1 ? 'pendiente' : 'pendientes'}`;

        // Solo mostrar la notificación si se acaba de completar la última tarea
        if (progressPercentage === 100 && pendingTasks === 0 && completedTasks > 0 && 
            !updateProgress.wasComplete) {
            showNotification('¡Todas las tareas han sido completadas!', 'success');
        }
        // Guardar el estado actual de completitud
        updateProgress.wasComplete = (progressPercentage === 100 && completedTasks > 0);
    }   

    function getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        const timeRules = [
            { limit: 60, divisor: 1, unit: ['un momento', 'un momento'], immediate: true },
            { limit: 3600, divisor: 60, unit: ['minuto', 'minutos'] },
            { limit: 86400, divisor: 3600, unit: ['hora', 'horas'] },
            { limit: 604800, divisor: 86400, unit: ['día', 'días'] },
            { limit: 2592000, divisor: 604800, unit: ['semana', 'semanas'] },
            { limit: 31536000, divisor: 2592000, unit: ['mes', 'meses'] },
            { limit: Infinity, divisor: 31536000, unit: ['año', 'años'] }
        ];

        const rule = timeRules.find(rule => diffInSeconds < rule.limit);
        if (rule.immediate) return 'hace ' + rule.unit[0];

        const value = Math.floor(diffInSeconds / rule.divisor);
        const unit = value === 1 ? rule.unit[0] : rule.unit[1];
        
        return `hace ${value} ${unit}`;
    }

    // Variables para el drag and drop
    let draggedItem = null;
    let draggedIndex = null;
    let touchStartY = null;
    let currentTouchY = null;
    let draggedTouchElement = null;

    function handleDragStart(e) {
        draggedItem = e.target;
        draggedIndex = parseInt(draggedItem.dataset.index);
        setTimeout(() => draggedItem.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', draggedItem.innerHTML);
    }

    function handleTouchStart(e) {
        // Si el toque es en el checkbox o en los botones, no iniciar el drag
        if (e.target.type === 'checkbox' || 
            e.target.classList.contains('delete-btn') || 
            e.target.classList.contains('edit-btn')) {
            return;
        }

        const touch = e.touches[0];
        touchStartY = touch.clientY;
        draggedTouchElement = e.currentTarget;
        draggedIndex = parseInt(draggedTouchElement.dataset.index);
        
        // Usar un timeout para distinguir entre tap y drag
        setTimeout(() => {
            if (touchStartY !== null) {
                draggedTouchElement.classList.add('dragging');
            }
        }, 200);
    }

    function handleTouchMove(e) {
        if (!draggedTouchElement || !touchStartY) return;
        
        const touch = e.touches[0];
        currentTouchY = touch.clientY;
        
        // Si el movimiento es muy pequeño, no hacer nada
        const deltaY = currentTouchY - touchStartY;
        if (Math.abs(deltaY) < 10) return;
        
        // Prevenir el scroll solo si estamos arrastrando
        e.preventDefault();
        
        // Calcular la diferencia de posición
        draggedTouchElement.style.transform = `translateY(${deltaY}px)`;
        
        // Encontrar el elemento más cercano
        const elements = [...todoList.querySelectorAll('li:not(.dragging)')];
        const closest = elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = currentTouchY - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
        
        if (closest) {
            const targetIndex = parseInt(closest.dataset.index);
            if (targetIndex !== draggedIndex) {
                // Reordenar la lista
                const item = tasks[draggedIndex];
                tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, item);
                saveTasks();
                renderTasks();
                draggedIndex = targetIndex;
            }
        }
    }

    function handleTouchEnd(e) {
        // Si no hubo movimiento significativo, permitir el evento click
        if (!draggedTouchElement || Math.abs(currentTouchY - touchStartY) < 10) {
            touchStartY = null;
            currentTouchY = null;
            if (draggedTouchElement) {
                draggedTouchElement.classList.remove('dragging');
                draggedTouchElement = null;
            }
            return;
        }
        
        if (draggedTouchElement) {
            draggedTouchElement.classList.remove('dragging');
            draggedTouchElement.style.transform = '';
            draggedTouchElement = null;
        }
        
        touchStartY = null;
        currentTouchY = null;
        e.preventDefault();
    }

    function handleDragEnd(e) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        draggedIndex = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        e.target.closest('li')?.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.target.closest('li')?.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        const li = e.target.closest('li');
        if (!li || !draggedItem) return;
        
        li.classList.remove('drag-over');
        const targetIndex = parseInt(li.dataset.index);
        
        if (targetIndex !== draggedIndex) {
            const item = tasks[draggedIndex];
            tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, item);
            saveTasks();
            renderTasks();
        }
    }

    function renderTasks() {
        todoList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.dataset.index = index;
            li.className = task.completed ? 'completed' : '';
            li.draggable = true;

            // Eventos de arrastrar para desktop
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragend', handleDragEnd);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('dragenter', handleDragEnter);
            li.addEventListener('dragleave', handleDragLeave);
            li.addEventListener('drop', handleDrop);

            // Eventos touch para mobile con opciones passive
            li.addEventListener('touchstart', handleTouchStart, { passive: true });
            li.addEventListener('touchmove', handleTouchMove, { passive: false });
            li.addEventListener('touchend', handleTouchEnd, { passive: false });
            
            // Checkbox para completar
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTask(task.id));
            
            // Texto de la tarea
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';

            const span = document.createElement('span');
            span.textContent = task.text;
            span.addEventListener('dblclick', () => startEditing(task.id));

            const timeSpan = document.createElement('span');
            timeSpan.className = 'task-time';
            timeSpan.textContent = getRelativeTime(task.createdAt);

            taskContent.appendChild(span);
            taskContent.appendChild(timeSpan);
            
            // Contenedor para botones
            const actions = document.createElement('div');
            actions.className = 'actions';
            
            // Botón editar
            const editButton = document.createElement('button');
            editButton.innerHTML = '✎';
            editButton.className = 'edit-btn';
            editButton.addEventListener('click', () => startEditing(task.id));
            
            // Botón eliminar
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'delete-btn';
            deleteButton.addEventListener('click', () => showDeleteModal(task.id));
            
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
            
            li.appendChild(checkbox);
            li.appendChild(taskContent);
            li.appendChild(actions);
            todoList.appendChild(li);
        });
        updateProgress();
    }

    function startEditing(id) {
        const task = tasks.find(t => t.id === id);
        const li = todoList.querySelector(`li[data-id="${id}"]`);
        const span = li.querySelector('span');
        const text = span.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;
        input.className = 'edit-input';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.border = '2px solid #4a2fbd';
        input.style.borderRadius = '4px';
        input.style.outline = 'none';

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== text) {
                tasks = tasks.map(t => 
                    t.id === id ? {...t, text: newText} : t
                );
                saveTasks();
                renderTasks();
                showNotification('Tarea actualizada', 'success');
            } else if (!newText) {
                showNotification('El texto de la tarea no puede estar vacío', 'error');
                renderTasks();
            } else {
                renderTasks();
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });

        span.replaceWith(input);
        input.focus();
        input.select();
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        const newStatus = !task.completed;
        
        tasks = tasks.map(t => 
            t.id === id ? {...t, completed: newStatus} : t
        );
        
        saveTasks();
        renderTasks();
        
        showNotification(
            newStatus ? '✅ Tarea completada' : '↩️ Tarea marcada como pendiente',
            'success'
        );
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        showNotification('Tarea eliminada', 'info');
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
});

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Notifications
if ('Notification' in window) {
    Notification.requestPermission();
}
