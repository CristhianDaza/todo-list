// Gestión de etiquetas
class TagManager {
    constructor() {
        this.tags = [];
        this.loadTags();
        this.initDefaultTags();
    }

    loadTags() {
        this.tags = JSON.parse(localStorage.getItem('tags')) || [];
    }

    saveTags() {
        localStorage.setItem('tags', JSON.stringify(this.tags));
    }

    initDefaultTags() {
        const defaultTags = [
            { id: 'personal', name: 'Personal', color: '#4a90e2' },
            { id: 'trabajo', name: 'Trabajo', color: '#50e3c2' },
            { id: 'compras', name: 'Compras', color: '#f5a623' },
            { id: 'urgente', name: 'Urgente', color: '#d0021b' },
            { id: 'proyecto', name: 'Proyecto', color: '#9013fe' }
        ];

        if (this.tags.length === 0) {
            this.tags = defaultTags;
            this.saveTags();
        }
    }

    addTag(name, color) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        if (!this.tags.some(tag => tag.id === id)) {
            const tag = { id, name, color };
            this.tags.push(tag);
            this.saveTags();
            return tag;
        }
        return null;
    }

    deleteTag(id) {
        this.tags = this.tags.filter(tag => tag.id !== id);
        this.saveTags();
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    getAllTags() {
        return this.tags;
    }

    getTag(id) {
        return this.tags.find(tag => tag.id === id);
    }
}
