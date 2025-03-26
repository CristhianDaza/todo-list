// Gestión de la interfaz de usuario
class UIManager {
    constructor(taskManager, tagManager) {
        this.taskManager = taskManager;
        this.tagManager = tagManager;
        this.currentFilter = 'all';
        this.initializeElements();
        this.initializeEventListeners();
        this.renderTagFilters();
        this.updateTagSelect();
        this.updateTaskStats();
    }

    initializeElements() {
        this.todoList = document.getElementById('todoList');
        this.taskInput = document.getElementById('taskInput');
        this.tagSelect = document.getElementById('tagSelect');
        this.addTaskButton = document.getElementById('addTask');
        this.progressBar = document.getElementById('progress');
        this.progressText = document.getElementById('progressText');
        this.taskCount = document.getElementById('taskCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.tagFilters = document.getElementById('tagFilters');
        this.addTagButton = document.getElementById('addTagButton');
        this.tagModal = document.getElementById('tagModal');
        this.tagNameInput = document.getElementById('tagNameInput');
        this.tagColorInput = document.getElementById('tagColorInput');
        this.randomColorButton = document.getElementById('randomColorButton');
        this.saveTagButton = document.getElementById('saveTag');
        this.cancelTagButton = document.getElementById('cancelTag');
        this.deleteModal = document.getElementById('deleteModal');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.clearAllButton = document.getElementById('clearAllButton');
        this.clearAllModal = document.getElementById('clearAllModal');
        this.confirmClearAll = document.getElementById('confirmClearAll');
        this.cancelClearAll = document.getElementById('cancelClearAll');
        this.taskToDelete = null;
    }

    initializeEventListeners() {
        this.addTaskButton.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });

        // Eventos de etiquetas
        this.addTagButton.addEventListener('click', () => this.showTagModal());
        this.randomColorButton.addEventListener('click', () => {
            this.tagColorInput.value = this.tagManager.getRandomColor();
        });
        this.saveTagButton.addEventListener('click', () => this.handleSaveTag());
        this.cancelTagButton.addEventListener('click', () => this.hideTagModal());
        this.tagModal.addEventListener('click', (e) => {
            if (e.target === this.tagModal) this.hideTagModal();
        });
        this.tagFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter')) {
                this.handleFilterChange(e.target.dataset.tagId);
            }
        });

        // Eventos de eliminación
        this.confirmDelete.addEventListener('click', () => this.handleConfirmDelete());
        this.cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.hideDeleteModal();
        });

        // Eventos de limpiar todo
        this.clearAllButton.addEventListener('click', () => this.showClearAllModal());
        this.confirmClearAll.addEventListener('click', () => this.handleClearAll());
        this.cancelClearAll.addEventListener('click', () => this.hideClearAllModal());
        this.clearAllModal.addEventListener('click', (e) => {
            if (e.target === this.clearAllModal) this.hideClearAllModal();
        });
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        if (text) {
            const tagId = this.tagSelect.value;
            this.taskManager.addTask(text, tagId);
            this.taskInput.value = '';
            this.renderTasks();
            this.renderTagFilters(); // Actualizar filtros al agregar tarea
            this.updateTaskStats();
            this.showNotification('Tarea agregada exitosamente', 'success');
        } else {
            this.showNotification('Por favor ingresa una tarea válida', 'error');
        }
    }

    showTagModal() {
        this.tagNameInput.value = '';
        this.tagColorInput.value = this.tagManager.getRandomColor();
        this.tagModal.classList.add('show');
    }

    hideTagModal() {
        this.tagModal.classList.remove('show');
    }

    handleSaveTag() {
        const name = this.tagNameInput.value.trim();
        const color = this.tagColorInput.value;

        if (name) {
            const tag = this.tagManager.addTag(name, color);
            if (tag) {
                this.renderTagFilters();
                this.updateTagSelect();
                this.hideTagModal();
                this.showNotification('Etiqueta creada exitosamente', 'success');
            } else {
                this.showNotification('Ya existe una etiqueta con ese nombre', 'error');
            }
        } else {
            this.showNotification('Por favor ingresa un nombre para la etiqueta', 'error');
        }
    }

    handleFilterChange(tagId) {
        this.currentFilter = tagId;
        this.updateActiveFilter();
        this.renderTasks();
    }

    updateActiveFilter() {
        const filters = this.tagFilters.querySelectorAll('.tag-filter');
        filters.forEach(filter => {
            filter.classList.toggle('active', filter.dataset.tagId === this.currentFilter);
        });
    }

    renderTagFilters() {
        const tags = this.tagManager.getAllTags();
        let html = '<button class="tag-filter active" data-tag-id="all">Todas</button>';
        
        // Obtener solo las etiquetas que están en uso
        const usedTagIds = new Set(this.taskManager.tasks.map(task => task.tagId).filter(Boolean));
        
        tags.forEach(tag => {
            if (usedTagIds.has(tag.id)) {
                html += `
                    <button class="tag-filter" 
                            data-tag-id="${tag.id}" 
                            style="background-color: ${tag.color}">
                        ${tag.name}
                    </button>`;
            }
        });
        
        this.tagFilters.innerHTML = html;
        this.updateActiveFilter();
    }

    updateTagSelect() {
        const tags = this.tagManager.getAllTags();
        let html = '<option value="">Sin etiqueta</option>';
        
        tags.forEach(tag => {
            html += `<option value="${tag.id}">${tag.name}</option>`;
        });
        
        this.tagSelect.innerHTML = html;
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
            this.renderTagFilters(); // Actualizar filtros
            this.updateTaskStats();
            this.hideDeleteModal();
            this.showNotification('Tarea eliminada', 'info');
        }
    }

    startEditing(id) {
        const li = this.todoList.querySelector(`li[data-id="${id}"]`);
        const taskContent = li.querySelector('.task-content');
        const span = taskContent.querySelector('span');
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
        const tasks = this.currentFilter === 'all' 
            ? this.taskManager.tasks 
            : this.taskManager.getTasksByTag(this.currentFilter);
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = this.currentFilter === 'all' 
                ? 'No hay tareas pendientes' 
                : 'No hay tareas con esta etiqueta';
            this.todoList.appendChild(emptyMessage);
        } else {
            tasks.forEach((task, index) => {
                this.todoList.appendChild(this.createTaskElement(task, index));
            });
        }

        this.updateTaskStats();
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

        // Contenedor principal de la tarea (texto y etiqueta)
        const taskMain = document.createElement('div');
        taskMain.className = 'task-main';

        const span = document.createElement('span');
        span.textContent = task.text;
        span.addEventListener('dblclick', () => this.startEditing(task.id));

        taskMain.appendChild(span);

        // Etiqueta de la tarea
        if (task.tagId) {
            const tag = this.tagManager.getTag(task.tagId);
            if (tag) {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'task-tag';
                tagSpan.textContent = tag.name;
                tagSpan.style.backgroundColor = tag.color;
                taskMain.appendChild(tagSpan);
            }
        }

        // Tiempo
        const timeSpan = document.createElement('span');
        timeSpan.className = 'task-time';
        timeSpan.textContent = this.getRelativeTime(task.createdAt);

        taskContent.appendChild(taskMain);
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
            this.renderTagFilters(); // Actualizar filtros
            this.updateTaskStats();
            this.showNotification(
                newStatus ? '✅ Tarea completada' : '↩️ Tarea marcada como pendiente',
                'success'
            );
        }
    }

    updateTaskStats() {
        const total = this.taskManager.tasks.length;
        const completed = this.taskManager.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        // Actualizar progress bar
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.style.transition = 'width 0.3s ease';

        // Actualizar textos
        this.progressText.textContent = `${progress}% completado`;
        this.taskCount.textContent = `${total} ${total === 1 ? 'tarea' : 'tareas'} totales`;
        this.pendingCount.textContent = `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`;

        // Mostrar/ocultar botón de limpiar todo
        this.clearAllButton.style.display = total >= 2 ? 'flex' : 'none';
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

    showClearAllModal() {
        this.clearAllModal.classList.add('show');
    }

    hideClearAllModal() {
        this.clearAllModal.classList.remove('show');
    }

    handleClearAll() {
        this.taskManager.clearAllTasks();
        this.renderTasks();
        this.renderTagFilters();
        this.updateTaskStats();
        this.hideClearAllModal();
        this.showNotification('Se han eliminado todas las tareas', 'info');
    }
}
