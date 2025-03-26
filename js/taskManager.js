// Gestión de tareas
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.setupNotificationCheck();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
        
        // Convertir strings de fecha a objetos Date
        this.tasks.forEach(task => {
            if (task.dueDate) {
                task.dueDate = new Date(task.dueDate);
            }
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(text, tagId = null, dueDate = null) {
        const task = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date(),
            tagId,
            dueDate: dueDate ? new Date(dueDate) : null,
            notified: false
        };
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            return task.completed;
        }
        return null;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            Object.assign(task, updates);
            if (updates.dueDate) {
                task.dueDate = new Date(updates.dueDate);
                task.notified = false;
            }
            this.saveTasks();
            return task;
        }
        return null;
    }

    updateTaskTag(id, tagId) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.tagId = tagId;
            this.saveTasks();
            return true;
        }
        return false;
    }

    getProgress() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        
        return {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            percentage: progressPercentage
        };
    }

    getTasksByTag(tagId) {
        return tagId ? this.tasks.filter(task => task.tagId === tagId) : this.tasks;
    }

    getTasksSortedByDueDate() {
        return [...this.tasks].sort((a, b) => {
            // Tareas sin fecha al final
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate - b.dueDate;
        });
    }

    getUpcomingTasks(days = 7) {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        
        return this.tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            return task.dueDate >= now && task.dueDate <= future;
        });
    }

    setupNotificationCheck() {
        // Revisar notificaciones cada minuto
        setInterval(() => this.checkNotifications(), 60000);
        // Revisar inmediatamente al iniciar
        this.checkNotifications();
    }

    checkNotifications() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (task.dueDate && !task.completed && !task.notified) {
                const timeUntilDue = task.dueDate - now;
                // Notificar si faltan menos de 24 horas
                if (timeUntilDue > 0 && timeUntilDue <= 24 * 60 * 60 * 1000) {
                    this.showTaskNotification(task);
                    task.notified = true;
                    this.saveTasks();
                }
            }
        });
    }

    showTaskNotification(task) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Tarea próxima a vencer', {
                body: `La tarea "${task.text}" vence ${this.getRelativeTime(task.dueDate)}`,
                icon: '/icon.png'
            });
        }
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 24) {
            return hours <= 1 ? 'en 1 hora' : `en ${hours} horas`;
        } else {
            const days = Math.floor(hours / 24);
            return days === 1 ? 'mañana' : `en ${days} días`;
        }
    }

    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
    }
}
