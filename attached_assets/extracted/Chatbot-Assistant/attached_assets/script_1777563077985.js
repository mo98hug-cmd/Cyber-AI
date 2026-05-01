// --- الإعدادات (ضع مفتاحك هنا) ---
const GEMINI_API_KEY = "AIzaSyB9Wdwuapdn7ntCUGfDjYCvNqBE1DWxU9Y"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- التعليمات الأساسية للبوت ---
const systemInstruction = `
You are Cyber AI, an emotionally intelligent cybersecurity expert.
Rules:
1. Detect and adapt to user emotions.
2. Use [Memory Context] to provide personalized responses.
3. Be professional, secure, and helpful.
`;

// --- إدارة الذاكرة والتعلم الذاتي ---
function getStoredMemory() {
    const memory = localStorage.getItem('cyberAI_core_memory');
    return memory ? `\n[Memory Context: ${memory}]` : "";
}

function updateMemory(input) {
    let currentMemory = localStorage.getItem('cyberAI_core_memory') || "";
    // تعلم الكلمات الدلالية مثل الاسم
    if (input.toLowerCase().includes("اسمي") || input.toLowerCase().includes("my name")) {
        currentMemory += ` | Identity: ${input}`;
    }
    localStorage.setItem('cyberAI_core_memory', currentMemory.slice(-500)); 
}

// --- التعامل مع الواجهة ---
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const startChatBtn = document.getElementById('startChatBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatInterface = document.getElementById('chatInterface');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');

// تبديل الوضع الليلي
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
    const mode = body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
    localStorage.setItem('theme', mode);
    themeToggle.innerHTML = mode === 'dark-mode' ? '<span class="icon">☀️</span>' : '<span class="icon">🌙</span>';
});

if (localStorage.getItem('theme') === 'dark-mode') {
    body.className = 'dark-mode';
    themeToggle.innerHTML = '<span class="icon">☀️</span>';
}

// دخول الشات
startChatBtn.addEventListener('click', () => {
    welcomeScreen.style.opacity = '0';
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        chatInterface.style.display = 'flex';
    }, 500);
});

// مسح الذاكرة
document.getElementById('clearMemory').addEventListener('click', () => {
    if(confirm("Are you sure you want to clear Cyber AI's memory?")) {
        localStorage.removeItem('cyberAI_core_memory');
        location.reload();
    }
});

// إرسال البيانات لـ Gemini
async function getAIResponse(prompt) {
    const memory = getStoredMemory();
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemInstruction + memory + "\nUser: " + prompt }] }]
            })
        });
        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        updateMemory(prompt);
        return aiText;
    } catch (error) {
        return "Core Connection Error. Check your API Key.";
    }
}

function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type === 'user' ? 'user-msg' : 'bot-msg'}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (text) {
        appendMessage(text, 'user');
        userInput.value = "";
        appendMessage("Cyber AI is thinking...", 'bot');
        const lastMsg = chatBox.lastChild;
        const response = await getAIResponse(text);
        lastMsg.innerText = response;
    }
});

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });

// ميزة المايك
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('recording');
    });
    recognition.onresult = (event) => {
        userInput.value = event.results[0][0].transcript;
        micBtn.classList.remove('recording');
    };
    recognition.onend = () => micBtn.classList.remove('recording');
}