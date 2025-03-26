// Gestión de la interfaz de usuario
class UIManager {
    constructor(taskManager, tagManager, calendarManager) {
        this.taskManager = taskManager;
        this.tagManager = tagManager;
        this.calendarManager = calendarManager;
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
        this.prioritySelect = document.getElementById('prioritySelect');
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
        this.dueDateInput = document.getElementById('dueDateInput');
        this.listViewBtn = document.getElementById('listViewBtn');
        this.calendarViewBtn = document.getElementById('calendarViewBtn');
        this.listView = document.getElementById('listView');
        this.calendarView = document.getElementById('calendarView');
        this.sortSelect = document.getElementById('sortSelect');
        this.searchInput = document.getElementById('searchInput');
        this.advancedFilterBtn = document.getElementById('advancedFilterBtn');
        this.advancedFilters = document.getElementById('advancedFilters');
        this.statusFilter = document.getElementById('statusFilter');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.historyList = document.getElementById('historyList');
        this.historyViewBtn = document.getElementById('historyViewBtn');
        
        // Inicializar filtros
        this.activeFilters = {
            search: '',
            status: 'all',
            priority: 'all',
            date: 'all',
            tag: 'all'
        };
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

        // Eventos de vista
        this.listViewBtn.addEventListener('click', () => this.switchView('list'));
        this.calendarViewBtn.addEventListener('click', () => this.switchView('calendar'));

        // Evento de ordenamiento
        this.sortSelect.addEventListener('change', () => this.handleSort());

        // Solicitar permiso para notificaciones
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        // Búsqueda en tiempo real
        this.searchInput.addEventListener('input', () => {
            this.activeFilters.search = this.searchInput.value.toLowerCase();
            this.applyFilters();
        });

        // Mostrar/ocultar filtros avanzados
        this.advancedFilterBtn.addEventListener('click', () => {
            this.advancedFilters.classList.toggle('show');
            this.advancedFilterBtn.classList.toggle('active');
        });

        // Eventos de filtros
        this.statusFilter.addEventListener('change', () => {
            this.activeFilters.status = this.statusFilter.value;
            this.applyFilters();
        });

        this.priorityFilter.addEventListener('change', () => {
            this.activeFilters.priority = this.priorityFilter.value;
            this.applyFilters();
        });

        this.dateFilter.addEventListener('change', () => {
            this.activeFilters.date = this.dateFilter.value;
            this.applyFilters();
        });

        // Vista de historial
        this.historyViewBtn.addEventListener('click', () => {
            this.switchView('history');
        });
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        if (text) {
            const tagId = this.tagSelect.value;
            const dueDate = this.dueDateInput.value ? new Date(this.dueDateInput.value) : null;
            const priority = this.prioritySelect.value;
            
            this.taskManager.addTask(text, tagId, dueDate, priority);
            
            this.taskInput.value = '';
            this.tagSelect.value = '';
            this.dueDateInput.value = '';
            this.prioritySelect.value = 'media';
            this.taskInput.focus();
            this.renderTasks();
            this.renderTagFilters();
            this.calendarManager.render();
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
        if (!li) return;

        const taskContent = li.querySelector('.task-content');
        const taskMain = taskContent.querySelector('.task-main');
        const span = taskMain.querySelector('span');
        const text = span.textContent;

        // Crear contenedor de edición
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        editContainer.style.display = 'flex';
        editContainer.style.gap = '8px';
        editContainer.style.width = '100%';
        editContainer.style.marginBottom = '8px';

        // Input para el texto
        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;
        input.className = 'edit-input';
        input.style.flex = '1';
        input.style.padding = '8px';
        input.style.border = '1px solid var(--border-color)';
        input.style.borderRadius = '4px';
        input.style.backgroundColor = 'var(--secondary-bg)';
        input.style.color = 'var(--text-color)';

        // Select para la prioridad
        const prioritySelect = document.createElement('select');
        prioritySelect.className = 'priority-select';
        prioritySelect.innerHTML = `
            <option value="baja">🔵 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🔴 Alta</option>
        `;
        const task = this.taskManager.tasks.find(t => t.id === id);
        prioritySelect.value = task.priority || 'media';

        // Botones
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '4px';

        const saveButton = document.createElement('button');
        saveButton.textContent = '✓';
        saveButton.className = 'edit-btn save-btn';
        saveButton.style.backgroundColor = 'var(--success-color)';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '×';
        cancelButton.className = 'edit-btn cancel-btn';
        cancelButton.style.backgroundColor = 'var(--error-color)';

        buttonsContainer.appendChild(saveButton);
        buttonsContainer.appendChild(cancelButton);

        // Agregar elementos al contenedor
        editContainer.appendChild(input);
        editContainer.appendChild(prioritySelect);
        editContainer.appendChild(buttonsContainer);

        // Reemplazar el contenido original
        const originalContent = taskMain.innerHTML;
        taskMain.innerHTML = '';
        taskMain.appendChild(editContainer);

        // Focus en el input
        input.focus();
        input.select();

        const handleSave = () => {
            const newText = input.value.trim();
            if (newText) {
                this.taskManager.updateTask(id, {
                    text: newText,
                    priority: prioritySelect.value
                });
                this.showNotification('Tarea actualizada', 'success');
            } else {
                this.showNotification('El texto de la tarea no puede estar vacío', 'error');
            }
            this.renderTasks();
        };

        const handleCancel = () => {
            taskMain.innerHTML = originalContent;
        };

        // Event listeners
        saveButton.addEventListener('click', handleSave);
        cancelButton.addEventListener('click', handleCancel);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        });

        input.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        });
    }

    renderTasks(tasks = this.taskManager.tasks) {
        this.todoList.innerHTML = '';
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
        li.draggable = true;
        if (task.completed) li.classList.add('completed');

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.handleToggleTask(task.id));

        // Contenido de la tarea
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskMain = document.createElement('div');
        taskMain.className = 'task-main';

        const span = document.createElement('span');
        span.textContent = task.text;
        span.addEventListener('dblclick', () => this.startEditing(task.id));

        const metadata = document.createElement('div');
        metadata.className = 'task-metadata';

        // Prioridad
        const prioritySpan = document.createElement('span');
        prioritySpan.className = `task-priority ${task.priority || 'media'}`;
        const priorityIcons = {
            'alta': '🔴',
            'media': '🟡',
            'baja': '🔵'
        };
        prioritySpan.textContent = priorityIcons[task.priority || 'media'];
        metadata.appendChild(prioritySpan);

        // Etiqueta de la tarea
        if (task.tagId) {
            const tag = this.tagManager.getTag(task.tagId);
            if (tag) {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'task-tag';
                tagSpan.textContent = tag.name;
                tagSpan.style.backgroundColor = tag.color;
                metadata.appendChild(tagSpan);
            }
        }

        // Fecha límite
        if (task.dueDate) {
            const dueSpan = document.createElement('span');
            dueSpan.className = 'task-due-date';
            const dueDate = new Date(task.dueDate);
            const isOverdue = !task.completed && dueDate < new Date();

            dueSpan.textContent = `📅 ${this.formatDate(dueDate)}`;
            if (isOverdue) dueSpan.classList.add('overdue');

            metadata.appendChild(dueSpan);
        }

        // Tiempo
        const timeSpan = document.createElement('span');
        timeSpan.className = 'task-time';
        timeSpan.textContent = this.getRelativeTime(task.createdAt);
        metadata.appendChild(timeSpan);

        taskMain.appendChild(span);
        taskMain.appendChild(metadata);
        taskContent.appendChild(taskMain);

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
        const wasCompleted = this.taskManager.toggleTask(id);
        if (wasCompleted) {
            this.showNotification('Tarea completada', 'success');
            // Actualizar historial si está visible
            if (document.getElementById('historyView').classList.contains('active')) {
                this.updateHistory();
            }
        }
        this.applyFilters();
        this.updateTaskStats();
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

    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.view-button').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`${view}View`).classList.add('active');
        document.getElementById(`${view}ViewBtn`).classList.add('active');
        
        if (view === 'history') {
            this.updateHistory();
        }
    }

    handleSort() {
        const sortBy = this.sortSelect.value;
        let tasks;

        if (sortBy === 'dueDate') {
            tasks = this.taskManager.getTasksSortedByDueDate();
        } else {
            tasks = [...this.taskManager.tasks].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        this.renderTasks(tasks);
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

    formatDate(date) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (this.isSameDay(date, now)) {
            return 'Hoy ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        } else if (this.isSameDay(date, tomorrow)) {
            return 'Mañana ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('es', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    applyFilters() {
        const filteredTasks = this.taskManager.tasks.filter(task => {
            // Búsqueda por texto
            if (this.activeFilters.search && 
                !task.text.toLowerCase().includes(this.activeFilters.search)) {
                return false;
            }

            // Filtro por estado
            if (this.activeFilters.status === 'pending' && task.completed) return false;
            if (this.activeFilters.status === 'completed' && !task.completed) return false;

            // Filtro por prioridad
            if (this.activeFilters.priority !== 'all' && 
                task.priority !== this.activeFilters.priority) {
                return false;
            }

            // Filtro por fecha
            if (this.activeFilters.date !== 'all' && task.dueDate) {
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                
                switch (this.activeFilters.date) {
                    case 'today':
                        if (!this.isSameDay(dueDate, today)) return false;
                        break;
                    case 'week':
                        const weekEnd = new Date(today);
                        weekEnd.setDate(today.getDate() + 7);
                        if (dueDate < today || dueDate > weekEnd) return false;
                        break;
                    case 'month':
                        if (dueDate.getMonth() !== today.getMonth() ||
                            dueDate.getFullYear() !== today.getFullYear()) return false;
                        break;
                    case 'overdue':
                        if (dueDate >= today || task.completed) return false;
                        break;
                }
            }

            // Filtro por etiqueta
            if (this.activeFilters.tag !== 'all' && task.tagId !== this.activeFilters.tag) {
                return false;
            }

            return true;
        });

        this.renderTasks(filteredTasks);
    }

    updateHistory() {
        const completedTasks = this.taskManager.tasks
            .filter(task => task.completed)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        this.historyList.innerHTML = '';
        
        completedTasks.forEach(task => {
            const li = document.createElement('li');
            const taskEl = this.createTaskElement(task);
            const completionDate = document.createElement('span');
            completionDate.className = 'completion-date';
            completionDate.textContent = this.formatDate(task.completedAt);
            
            li.appendChild(taskEl);
            li.appendChild(completionDate);
            this.historyList.appendChild(li);
        });
    }
}
