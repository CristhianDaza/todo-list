// Gestión de la interfaz de usuario
class UIManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.todoList = document.getElementById('todoList');
        this.taskInput = document.getElementById('taskInput');
        this.addTaskButton = document.getElementById('addTask');
        this.progressBar = document.getElementById('progress');
        this.progressText = document.getElementById('progressText');
        this.taskCount = document.getElementById('taskCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.deleteModal = document.getElementById('deleteModal');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.taskToDelete = null;
    }

    initializeEventListeners() {
        this.addTaskButton.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });
        this.confirmDelete.addEventListener('click', () => this.handleConfirmDelete());
        this.cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.hideDeleteModal();
        });
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        if (text) {
            this.taskManager.addTask(text);
            this.taskInput.value = '';
            this.renderTasks();
            this.showNotification('Tarea agregada exitosamente', 'success');
        } else {
            this.showNotification('Por favor ingresa una tarea válida', 'error');
        }
    }

    showDeleteModal(id) {
        this.taskToDelete = id;
        this.deleteModal.classList.add('show');
    }

    hideDeleteModal() {
        this.deleteModal.classList.remove('show');
        this.taskToDelete = null;
    }

    handleConfirmDelete() {
        if (this.taskToDelete) {
            this.taskManager.deleteTask(this.taskToDelete);
            this.renderTasks();
            this.hideDeleteModal();
            this.showNotification('Tarea eliminada', 'info');
        }
    }

    startEditing(id) {
        const li = this.todoList.querySelector(`li[data-id="${id}"]`);
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
            if (this.taskManager.updateTask(id, newText)) {
                this.renderTasks();
                this.showNotification('Tarea actualizada', 'success');
            } else if (!newText) {
                this.showNotification('El texto de la tarea no puede estar vacío', 'error');
                this.renderTasks();
            } else {
                this.renderTasks();
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });

        span.replaceWith(input);
        input.focus();
        input.select();
    }

    renderTasks() {
        this.todoList.innerHTML = '';
        this.taskManager.tasks.forEach((task, index) => {
            const li = this.createTaskElement(task, index);
            this.todoList.appendChild(li);
        });
        this.updateProgress();
    }

    createTaskElement(task, index) {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.dataset.index = index;
        li.className = task.completed ? 'completed' : '';
        li.draggable = true;

        // Eventos de arrastrar
        this.addDragListeners(li);
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.handleToggleTask(task.id));
        
        // Contenido de la tarea
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const span = document.createElement('span');
        span.textContent = task.text;
        span.addEventListener('dblclick', () => this.startEditing(task.id));

        const timeSpan = document.createElement('span');
        timeSpan.className = 'task-time';
        timeSpan.textContent = this.getRelativeTime(task.createdAt);

        taskContent.appendChild(span);
        taskContent.appendChild(timeSpan);
        
        // Botones de acción
        const actions = document.createElement('div');
        actions.className = 'actions';
        
        const editButton = document.createElement('button');
        editButton.innerHTML = '✎';
        editButton.className = 'edit-btn';
        editButton.addEventListener('click', () => this.startEditing(task.id));
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.className = 'delete-btn';
        deleteButton.addEventListener('click', () => this.showDeleteModal(task.id));
        
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        
        li.appendChild(checkbox);
        li.appendChild(taskContent);
        li.appendChild(actions);

        return li;
    }

    handleToggleTask(id) {
        const newStatus = this.taskManager.toggleTask(id);
        if (newStatus !== null) {
            this.renderTasks();
            this.showNotification(
                newStatus ? '✅ Tarea completada' : '↩️ Tarea marcada como pendiente',
                'success'
            );
        }
    }

    updateProgress() {
        const progress = this.taskManager.getProgress();
        
        this.progressBar.style.width = `${progress.percentage}%`;
        this.progressText.textContent = `${progress.percentage}% completado`;
        
        this.taskCount.textContent = `${progress.total} ${progress.total === 1 ? 'tarea total' : 'tareas totales'}`;
        this.pendingCount.textContent = `${progress.pending} ${progress.pending === 1 ? 'pendiente' : 'pendientes'}`;

        if (progress.percentage === 100 && progress.pending === 0 && progress.completed > 0 && 
            !this.updateProgress.wasComplete) {
            this.showNotification('¡Todas las tareas han sido completadas!', 'success');
        }
        this.updateProgress.wasComplete = (progress.percentage === 100 && progress.completed > 0);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        const notifications = document.getElementById('notifications');
        notifications.appendChild(notification);

        // Forzar un reflow para asegurar la animación
        notification.offsetHeight;

        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getRelativeTime(dateString) {
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

    addDragListeners(li) {
        li.addEventListener('dragstart', this.handleDragStart.bind(this));
        li.addEventListener('dragend', this.handleDragEnd.bind(this));
        li.addEventListener('dragover', this.handleDragOver.bind(this));
        li.addEventListener('dragenter', this.handleDragEnter.bind(this));
        li.addEventListener('dragleave', this.handleDragLeave.bind(this));
        li.addEventListener('drop', this.handleDrop.bind(this));
        
        // Touch events
        li.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        li.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        li.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    // Drag & Drop handlers
    handleDragStart(e) {
        this.draggedItem = e.target;
        this.draggedIndex = parseInt(this.draggedItem.dataset.index);
        setTimeout(() => this.draggedItem.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.draggedItem.innerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
        this.draggedIndex = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.target.closest('li')?.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.target.closest('li')?.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        const li = e.target.closest('li');
        if (!li || !this.draggedItem) return;
        
        li.classList.remove('drag-over');
        const targetIndex = parseInt(li.dataset.index);
        
        if (targetIndex !== this.draggedIndex) {
            const item = this.taskManager.tasks[this.draggedIndex];
            this.taskManager.tasks.splice(this.draggedIndex, 1);
            this.taskManager.tasks.splice(targetIndex, 0, item);
            this.taskManager.saveTasks();
            this.renderTasks();
        }
    }

    // Touch handlers
    handleTouchStart(e) {
        if (e.target.type === 'checkbox' || 
            e.target.classList.contains('delete-btn') || 
            e.target.classList.contains('edit-btn')) {
            return;
        }

        const touch = e.touches[0];
        this.touchStartY = touch.clientY;
        this.draggedTouchElement = e.currentTarget;
        this.draggedIndex = parseInt(this.draggedTouchElement.dataset.index);
        
        setTimeout(() => {
            if (this.touchStartY !== null) {
                this.draggedTouchElement.classList.add('dragging');
            }
        }, 200);
    }

    handleTouchMove(e) {
        if (!this.draggedTouchElement || !this.touchStartY) return;
        
        const touch = e.touches[0];
        this.currentTouchY = touch.clientY;
        
        const deltaY = this.currentTouchY - this.touchStartY;
        if (Math.abs(deltaY) < 10) return;
        
        e.preventDefault();
        this.draggedTouchElement.style.transform = `translateY(${deltaY}px)`;
        
        const elements = [...this.todoList.querySelectorAll('li:not(.dragging)')];
        const closest = elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = this.currentTouchY - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
        
        if (closest) {
            const targetIndex = parseInt(closest.dataset.index);
            if (targetIndex !== this.draggedIndex) {
                const item = this.taskManager.tasks[this.draggedIndex];
                this.taskManager.tasks.splice(this.draggedIndex, 1);
                this.taskManager.tasks.splice(targetIndex, 0, item);
                this.taskManager.saveTasks();
                this.renderTasks();
                this.draggedIndex = targetIndex;
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.draggedTouchElement || Math.abs(this.currentTouchY - this.touchStartY) < 10) {
            this.touchStartY = null;
            this.currentTouchY = null;
            if (this.draggedTouchElement) {
                this.draggedTouchElement.classList.remove('dragging');
                this.draggedTouchElement = null;
            }
            return;
        }
        
        if (this.draggedTouchElement) {
            this.draggedTouchElement.classList.remove('dragging');
            this.draggedTouchElement.style.transform = '';
            this.draggedTouchElement = null;
        }
        
        this.touchStartY = null;
        this.currentTouchY = null;
        e.preventDefault();
    }
}
