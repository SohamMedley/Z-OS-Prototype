const inputField = document.getElementById('command-input');
const logsPanel = document.getElementById('logs-panel');
const inputContainer = document.getElementById('input-container');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

// Mobile Nav Toggle
mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});

// Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// Text-to-Speech Engine
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// Log Appender
function addLog(avatarText, message, type = 'system') {
    const row = document.createElement('div');
    row.className = `log-row ${type}`;
    const safeMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    row.innerHTML = `
        <div class="log-avatar">[${avatarText}]</div>
        <div class="log-msg">${safeMsg}</div>
    `;
    logsPanel.appendChild(row);
    logsPanel.scrollTop = logsPanel.scrollHeight;
}

// Command Execution
async function executeCommand(commandText) {
    if (!commandText || !commandText.trim()) return;
    
    addLog('USR', commandText, 'user');
    inputField.value = '';
    inputContainer.classList.add('processing');
    
    // NEW: "Thinking" UI State. Adds a temporary log while waiting for Groq.
    const thinkingId = 'thinking-' + Date.now();
    const thinkingRow = document.createElement('div');
    thinkingRow.className = `log-row system`;
    thinkingRow.id = thinkingId;
    thinkingRow.innerHTML = `
        <div class="log-avatar" style="color: var(--primary-blue);">[SYS]</div>
        <div class="log-msg" style="color: var(--text-grey);">Analyzing directive... <span style="display:inline-block; width:10px; height:10px; border: 1px solid var(--primary-blue); border-radius:50%; margin-left:8px; vertical-align:middle; animation: pulse 1.5s infinite;"></span></div>
    `;
    logsPanel.appendChild(thinkingRow);
    logsPanel.scrollTop = logsPanel.scrollHeight;
    
    try {
        // REVERTED: Using absolute URL so the local HTML file can find the backend!
        const response = await fetch('http://127.0.0.1:8000/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: commandText })
        });
        
        // Remove the "Thinking" log the exact millisecond we get a response
        const tRow = document.getElementById(thinkingId);
        if (tRow) tRow.remove();
        
        if (!response.ok) throw new Error("Connection failed");
        const data = await response.json();
        
        if (data.status === 'success') {
            data.logs.forEach((log, index) => {
                setTimeout(() => {
                    const actionName = log.step.action ? log.step.action.toUpperCase() : 'SYS';
                    
                    if (actionName === 'SYSTEM_REPLY') {
                        speak(log.detail);
                        addLog('SYS', log.detail, 'success');
                    } else if (actionName === 'REASONING') {
                        // Special formatting for Groq's thought process
                        addLog('THINK', log.detail, 'system'); 
                    } else {
                        const statusType = log.status === 'success' ? 'success' : 'error';
                        const avatarText = log.status === 'success' ? 'OK' : 'ERR';
                        addLog(avatarText, `[${actionName}] ${log.detail}`, statusType);
                    }
                }, index * 200); 
            });
        } else {
            addLog('ERR', data.detail, 'error');
        }
    } catch (err) {
        const tRow = document.getElementById(thinkingId);
        if (tRow) tRow.remove();
        addLog('ERR', 'Cannot reach local engine. Ensure PowerShell is running uvicorn.', 'error');
    } finally {
        setTimeout(() => {
            inputContainer.classList.remove('processing');
            inputField.focus();
        }, 500);
    }
}

// Inputs & Chips
inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); executeCommand(inputField.value); }
});
sendBtn.addEventListener('click', () => executeCommand(inputField.value));

document.querySelectorAll('.action-chip').forEach(chip => {
    chip.addEventListener('click', () => executeCommand(chip.getAttribute('data-cmd')));
});

// Voice Input Engine (Kept for fallback, but Win+H is highly recommended)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
            micBtn.classList.add('active');
            inputField.placeholder = "LISTENING... (Or press Win + H)";
        } catch (e) {
            console.error("Mic start error:", e);
        }
    });
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        executeCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        micBtn.classList.remove('active');
        inputField.placeholder = "AWAITING DIRECTIVE...";
        
        if (event.error === 'network') {
            addLog('ERR', 'Browser security block. Please use Win + H on your keyboard to speak.', 'error');
        } else {
            addLog('ERR', `Mic error: ${event.error}`, 'error');
        }
    };
    
    recognition.onend = () => {
        micBtn.classList.remove('active');
        inputField.placeholder = "AWAITING DIRECTIVE...";
    };
} else {
    micBtn.style.opacity = '0.3';
    micBtn.title = "Voice not supported in this browser";
}