/**
 * IA ASSISTANT MODULE - HELLO KITTY LUNCH APP
 * Módulo independiente para funcionalidad de IA con GroqCloud
 * Desarrollado por Cesar Martinez
 */

class IAAssistant {
    constructor() {
        this.apiKey = ''; // Se carga desde localStorage
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama3-8b-8192';
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
        
        this.initializeEventListeners();
        this.loadApiKey();
    }

    /**
     * Inicializa los event listeners
     */
    initializeEventListeners() {
        const consultarBtn = document.getElementById('consultarIA');
        const preguntaTextarea = document.getElementById('preguntaIA');
        
        if (consultarBtn) {
            consultarBtn.addEventListener('click', () => this.handleConsulta());
        }
        
        if (preguntaTextarea) {
            preguntaTextarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleConsulta();
                }
            });
        }
    }

    /**
     * Carga la API key desde localStorage
     */
    loadApiKey() {
        const savedApiKey = localStorage.getItem('groq_api_key');
        if (savedApiKey) {
            this.apiKey = savedApiKey;
            console.log('✅ API Key cargada desde localStorage');
        } else {
            console.log('🔑 No hay API Key guardada');
        }
    }

    /**
     * Solicita y guarda la API key en localStorage
     */
    async promptForApiKey() {
        if (!this.apiKey) {
            const apiKey = prompt(
                '🔑 CONFIGURACIÓN INICIAL\n\n' +
                'Para usar la IA necesitas tu API Key de GroqCloud (solo una vez):\n\n' +
                '1️⃣ Ve a: console.groq.com/keys\n' +
                '2️⃣ Crea cuenta gratis\n' +
                '3️⃣ Genera API Key\n' +
                '4️⃣ Pégala aquí:\n\n' +
                '(Se guardará en tu celular para siempre)'
            );
            
            if (apiKey && apiKey.trim()) {
                this.apiKey = apiKey.trim();
                localStorage.setItem('groq_api_key', this.apiKey);
                alert('✅ API Key guardada! Ya puedes usar la IA 🤖');
                return true;
            } else {
                this.showError('❌ Necesitas la API Key para usar la IA');
                return false;
            }
        }
        return true;
    }

    /**
     * Obtiene los datos de almuerzos del localStorage
     */
    getAlmuerzosData() {
        try {
            const data = localStorage.getItem('almuerzos');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al obtener datos de almuerzos:', error);
            return [];
        }
    }

    /**
     * Prepara el contexto para la IA con los datos de almuerzos
     */
    prepareContext() {
        const almuerzos = this.getAlmuerzosData();
        const fechaActual = new Date().toLocaleDateString('es-ES');
        
        let contexto = `Eres un asistente inteligente especializado en análisis de almuerzos y nutrición. `;
        contexto += `El usuario es Andrea Vasquez y tiene registrados ${almuerzos.length} almuerzos. `;
        contexto += `Fecha actual: ${fechaActual}. `;
        
        if (almuerzos.length > 0) {
            contexto += `\n\nDatos de almuerzos registrados:\n`;
            almuerzos.slice(-20).forEach((almuerzo, index) => {
                contexto += `${index + 1}. Fecha: ${almuerzo.fecha}, `;
                contexto += `Plato: ${almuerzo.plato}, `;
                contexto += `Proteína: ${almuerzo.proteina}, `;
                contexto += `Ingredientes: ${almuerzo.ingredientes}\n`;
            });
        }
        
        contexto += `\n\nResponde de manera amigable, útil y con emojis. `;
        contexto += `Puedes hacer análisis nutricionales, sugerencias de mejora, `;
        contexto += `detectar patrones alimenticios, recomendar recetas similares, `;
        contexto += `y responder cualquier pregunta sobre los almuerzos registrados.`;
        
        return contexto;
    }

    /**
     * Maneja la consulta del usuario
     */
    async handleConsulta() {
        const pregunta = document.getElementById('preguntaIA').value.trim();
        
        if (!pregunta) {
            this.showError('❌ Por favor, escribe una pregunta');
            return;
        }
        
        if (!(await this.promptForApiKey())) {
            return;
        }
        
        this.showLoading(true);
        this.addMessageToChat('user', pregunta);
        
        try {
            const respuesta = await this.consultarGroqIA(pregunta);
            this.addMessageToChat('assistant', respuesta);
            this.updateConversationHistory(pregunta, respuesta);
        } catch (error) {
            console.error('Error en consulta IA:', error);
            this.showError(`❌ Error: ${error.message}`);
        } finally {
            this.showLoading(false);
            document.getElementById('preguntaIA').value = '';
        }
    }

    /**
     * Realiza la consulta a la API de GroqCloud
     */
    async consultarGroqIA(pregunta) {
        const contexto = this.prepareContext();
        
        const messages = [
            {
                role: "system",
                content: contexto
            },
            ...this.conversationHistory,
            {
                role: "user",
                content: pregunta
            }
        ];

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                localStorage.removeItem('groq_api_key');
                this.apiKey = '';
                throw new Error('API Key inválida. Por favor, configura una nueva.');
            }
            
            throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Respuesta inesperada de la API');
        }

        return data.choices[0].message.content;
    }

    /**
     * Actualiza el historial de conversación
     */
    updateConversationHistory(pregunta, respuesta) {
        this.conversationHistory.push(
            { role: "user", content: pregunta },
            { role: "assistant", content: respuesta }
        );
        
        // Mantener solo las últimas interacciones
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
    }

    /**
     * Añade un mensaje al chat visual
     */
    addMessageToChat(role, message) {
        const respuestaContainer = document.getElementById('respuestaIA');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ia-message ${role}-message`;
        
        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <strong>🧑‍💻 Tú:</strong>
                </div>
                <div class="message-content">${this.escapeHtml(message)}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <strong>🤖 IA Assistant:</strong>
                </div>
                <div class="message-content">${this.formatMarkdown(message)}</div>
            `;
        }
        
        // Remover mensaje de bienvenida si existe
        const welcomeMsg = respuestaContainer.querySelector('.ia-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        respuestaContainer.appendChild(messageDiv);
        respuestaContainer.scrollTop = respuestaContainer.scrollHeight;
    }

    /**
     * Formatea markdown básico en HTML
     */
    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, '<br>');
    }

    /**
     * Muestra/oculta el indicador de carga
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loadingIA');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Muestra un mensaje de error
     */
    showError(mensaje) {
        const respuestaContainer = document.getElementById('respuestaIA');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ia-message error-message';
        errorDiv.innerHTML = `
            <div class="message-content">${mensaje}</div>
        `;
        respuestaContainer.appendChild(errorDiv);
        respuestaContainer.scrollTop = respuestaContainer.scrollHeight;
    }

    /**
     * Limpia el historial de conversación
     */
    clearHistory() {
        this.conversationHistory = [];
        const respuestaContainer = document.getElementById('respuestaIA');
        respuestaContainer.innerHTML = `
            <div class="ia-welcome">
                ¡Hola! Soy tu asistente inteligente de almuerzos 🍽️<br>
                Puedes preguntarme sobre tus comidas, pedir recomendaciones, análisis nutricionales, o cualquier cosa relacionada con tus almuerzos registrados.
            </div>
        `;
    }

    /**
     * Configura una nueva API key (borra la actual y pide una nueva)
     */
    configureApiKey() {
        const confirmChange = confirm(
            '🔄 ¿Quieres cambiar tu API Key actual?\n\n' +
            'Esto borrará la clave guardada y te pedirá una nueva.'
        );
        
        if (confirmChange) {
            localStorage.removeItem('groq_api_key');
            this.apiKey = '';
            this.promptForApiKey();
        }
    }

    /**
     * Borra la API Key guardada
     */
    clearApiKey() {
        const confirmDelete = confirm(
            '🗑️ ¿Estás seguro de borrar tu API Key?\n\n' +
            'Tendrás que configurarla de nuevo para usar la IA.'
        );
        
        if (confirmDelete) {
            localStorage.removeItem('groq_api_key');
            this.apiKey = '';
            alert('✅ API Key borrada. Configura una nueva cuando quieras usar la IA.');
        }
    }
}

// Inicializar el asistente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.iaAssistant = new IAAssistant();
    
    // Exponer métodos útiles globalmente si es necesario
    window.clearIAHistory = () => window.iaAssistant.clearHistory();
    window.configureIAKey = () => window.iaAssistant.configureApiKey();
    window.clearIAKey = () => window.iaAssistant.clearApiKey();
});