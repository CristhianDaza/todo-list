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
    const themeToggle = document.getElementById('themeToggle');
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    // Manejar cambio de tema
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTask');
    const todoList = document.getElementById('todoList');

    // Cargar tareas guardadas
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks();

    // Agregar tarea con el botón
    addTaskButton.addEventListener('click', addTask);

    // Agregar tarea con Enter
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

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

    function renderTasks() {
        todoList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.className = task.completed ? 'completed' : '';
            
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
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            
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
            }
            renderTasks();
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
        tasks = tasks.map(task => 
            task.id === id ? {...task, completed: !task.completed} : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
});
