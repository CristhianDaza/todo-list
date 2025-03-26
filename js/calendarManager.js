class CalendarManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentDate = new Date();
        this.initializeElements();
        this.initializeEventListeners();
        this.render();
    }

    initializeElements() {
        this.calendarView = document.getElementById('calendarView');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.calendarDays = document.getElementById('calendarDays');
    }

    initializeEventListeners() {
        this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Actualizar título del mes
        const monthName = new Date(year, month).toLocaleString('es', { month: 'long' });
        this.currentMonthElement.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        
        // Obtener el primer día del mes
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay();
        
        // Obtener el último día del mes
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Obtener días del mes anterior
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        
        // Limpiar calendario
        this.calendarDays.innerHTML = '';
        
        // Agregar días del mes anterior
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day);
            this.createDayElement(date, true);
        }
        
        // Agregar días del mes actual
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            this.createDayElement(date, false);
        }
        
        // Agregar días del mes siguiente
        const remainingDays = 42 - (startingDay + totalDays); // 42 = 6 semanas * 7 días
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            this.createDayElement(date, true);
        }
    }

    createDayElement(date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-date';
        if (isOtherMonth) dayElement.classList.add('other-month');
        if (this.isToday(date)) dayElement.classList.add('today');
        
        // Número del día
        const dateNumber = document.createElement('span');
        dateNumber.className = 'date-number';
        dateNumber.textContent = date.getDate();
        dayElement.appendChild(dateNumber);
        
        // Contenedor de tareas
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'calendar-tasks';
        
        // Obtener tareas para este día
        const tasks = this.getTasksForDate(date);
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'calendar-task';
            if (task.completed) taskElement.classList.add('completed');
            if (this.isOverdue(task)) taskElement.classList.add('overdue');
            
            taskElement.textContent = task.text;
            taskElement.title = task.text;
            
            taskElement.addEventListener('click', () => {
                // Aquí se podría abrir un modal para editar la tarea
                console.log('Editar tarea:', task);
            });
            
            tasksContainer.appendChild(taskElement);
        });
        
        dayElement.appendChild(tasksContainer);
        this.calendarDays.appendChild(dayElement);
    }

    getTasksForDate(date) {
        return this.taskManager.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.getFullYear() === date.getFullYear() &&
                   taskDate.getMonth() === date.getMonth() &&
                   taskDate.getDate() === date.getDate();
        });
    }

    isToday(date) {
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }

    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < new Date();
    }
}
