class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentLocation = null;
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.requestLocationPermission();
        this.bindEvents();
    }
    
    initializeElements() {
        this.startButton = document.getElementById('start-voice');
        this.stopButton = document.getElementById('stop-voice');
        this.statusText = document.getElementById('status-text');
        this.commandText = document.getElementById('command-text');
        this.responseArea = document.getElementById('response-area');
        this.pulseCircle = document.getElementById('pulse-circle');
        this.quickCheckinBtn = document.getElementById('quick-checkin');
        this.quickCheckoutBtn = document.getElementById('quick-checkout');
    }
    
    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            this.startButton.disabled = true;
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => {
            this.onRecognitionStart();
        };
        
        this.recognition.onresult = (event) => {
            this.onRecognitionResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.onRecognitionError(event);
        };
        
        this.recognition.onend = () => {
            this.onRecognitionEnd();
        };
    }
    
    bindEvents() {
        this.startButton.addEventListener('click', () => this.startListening());
        this.stopButton.addEventListener('click', () => this.stopListening());
        this.pulseCircle.addEventListener('click', () => this.toggleListening());
        
        if (this.quickCheckinBtn) {
            this.quickCheckinBtn.addEventListener('click', () => this.quickCheckIn());
        }
        
        if (this.quickCheckoutBtn) {
            this.quickCheckoutBtn.addEventListener('click', () => this.quickCheckOut());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && event.ctrlKey) {
                event.preventDefault();
                this.toggleListening();
            }
        });
    }
    
    async requestLocationPermission() {
        if ('geolocation' in navigator) {
            try {
                const position = await this.getCurrentPosition();
                this.currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                console.log('Location permission granted');
            } catch (error) {
                console.warn('Location permission denied or failed:', error);
                this.showWarning('Location access is required for attendance marking. Please enable location permissions.');
            }
        } else {
            this.showError('Geolocation is not supported by this browser.');
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            });
        });
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    async startListening() {
        if (!this.recognition) {
            this.showError('Speech recognition is not available.');
            return;
        }
        
        if (this.isListening) {
            return;
        }
        
        // Update location before starting
        try {
            const position = await this.getCurrentPosition();
            this.currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (error) {
            console.warn('Could not update location:', error);
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            this.showError('Could not start speech recognition: ' + error.message);
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    onRecognitionStart() {
        this.isListening = true;
        this.updateUI('listening', 'Listening... Speak now');
        this.startButton.disabled = true;
        this.stopButton.disabled = false;
        this.pulseCircle.classList.add('listening');
        this.statusText.classList.add('listening');
    }
    
    onRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        const displayText = finalTranscript || interimTranscript;
        if (displayText) {
            this.commandText.textContent = `"${displayText}"`;
        }
        
        if (finalTranscript) {
            this.processCommand(finalTranscript.trim());
        }
    }
    
    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition error occurred.';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech was detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone access denied. Please check your permissions.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied. Please enable microphone access.';
                break;
            case 'network':
                errorMessage = 'Network error occurred. Please check your connection.';
                break;
        }
        
        this.showError(errorMessage);
        this.resetUI();
    }
    
    onRecognitionEnd() {
        this.isListening = false;
        this.resetUI();
    }
    
    async processCommand(command) {
        this.updateUI('processing', 'Processing command...');
        this.pulseCircle.classList.remove('listening');
        this.pulseCircle.classList.add('processing');
        
        try {
            const response = await fetch('/api/voice-command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: command,
                    latitude: this.currentLocation?.latitude,
                    longitude: this.currentLocation?.longitude
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(data.message);
            } else {
                this.showError(data.message);
            }
            
        } catch (error) {
            this.showError('Failed to process command: ' + error.message);
        }
        
        this.resetUI();
    }
    
    async quickCheckIn() {
        if (!this.currentLocation) {
            this.showError('Location access is required for check-in.');
            return;
        }
        
        this.processCommand('check in');
    }
    
    async quickCheckOut() {
        this.processCommand('check out');
    }
    
    updateUI(state, message) {
        this.statusText.textContent = message;
        this.statusText.className = '';
        this.statusText.classList.add(state);
    }
    
    resetUI() {
        this.isListening = false;
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        this.pulseCircle.className = 'pulse-circle';
        this.statusText.className = '';
        this.statusText.textContent = 'Click the microphone to start';
        this.commandText.textContent = 'Say commands like "check in", "add task", or "show my tasks"';
    }
    
    showSuccess(message) {
        this.addResponseMessage(message, 'success');
    }
    
    showError(message) {
        this.addResponseMessage(message, 'error');
        this.pulseCircle.classList.add('error');
        setTimeout(() => {
            this.pulseCircle.classList.remove('error');
        }, 500);
    }
    
    showWarning(message) {
        this.addResponseMessage(message, 'warning');
    }
    
    addResponseMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `response-message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
        `;
        
        this.responseArea.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
        
        // Scroll to bottom
        this.responseArea.scrollTop = this.responseArea.scrollHeight;
    }
    
    // Utility method to speak text (optional feature)
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }
}

// Initialize the voice assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAssistant = new VoiceAssistant();
    
    // Add keyboard shortcuts info
    const helpText = document.createElement('small');
    helpText.className = 'text-muted d-block mt-2';
    helpText.innerHTML = '<i class="fas fa-keyboard me-1"></i>Press Ctrl+Space to toggle voice recognition';
    
    const voiceCard = document.querySelector('.card-body');
    if (voiceCard) {
        voiceCard.appendChild(helpText);
    }
});

// Add task modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const saveTaskBtn = document.getElementById('saveTask');
    const addTaskForm = document.getElementById('addTaskForm');
    
    if (saveTaskBtn && addTaskForm) {
        saveTaskBtn.addEventListener('click', async () => {
            const formData = new FormData(addTaskForm);
            const taskData = {
                title: formData.get('taskTitle') || document.getElementById('taskTitle').value,
                description: formData.get('taskDescription') || document.getElementById('taskDescription').value,
                priority: formData.get('taskPriority') || document.getElementById('taskPriority').value
            };
            
            if (!taskData.title) {
                alert('Please enter a task title');
                return;
            }
            
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Close modal and refresh page
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                    modal.hide();
                    location.reload();
                } else {
                    alert('Failed to create task');
                }
            } catch (error) {
                alert('Error creating task: ' + error.message);
            }
        });
    }
});
