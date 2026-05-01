async function send() {
    const input = document.getElementById('userInput');
    const msg = input.value.trim();
    if(!msg) return;

    addMsg(msg, 'user-bubble');
    input.value = '';

    try {
        const res = await fetch('http://localhost:5001/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: msg})
        });
        const data = await res.json();
        addMsg(data.reply, 'bot-bubble');
    } catch(e) {
        addMsg("⚠️ خطأ في الاتصال بالسيرفر. تأكد أن app.py يعمل.", 'bot-bubble');
    }
}

// دالة المايك بدعم اللغة العربية
function startDictation() {
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
        var recognition = new webkitSpeechRecognition();
        recognition.lang = "ar-SA"; 
        recognition.start();
        document.getElementById('mic-btn').style.color = "red";

        recognition.onresult = function(e) {
            document.getElementById('userInput').value = e.results[0][0].transcript;
            document.getElementById('mic-btn').style.color = "#38bdf8";
            recognition.stop();
        };
        recognition.onerror = function() {
            document.getElementById('mic-btn').style.color = "#38bdf8";
            recognition.stop();
        };
    } else {
        alert("متصفحك لا يدعم التعرف على الصوت.");
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('theme-toggle');
    btn.innerHTML = document.body.classList.contains('light-mode') ? "☀️" : "🌙";
}

function addMsg(text, type) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = type;
    div.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function fastSend(text) {
    document.getElementById('userInput').value = text;
    send();
}

let attachedFile = null; // متغير لحفظ الملف مؤقتاً

function handleFile() {
    const fileInput = document.getElementById('file');
    attachedFile = fileInput.files[0];
    if(attachedFile) {
        addMsg(`📁 تم تجهيز ملف: <b>${attachedFile.name}</b> (سيتم إرساله مع سؤالك)`, 'user-bubble');
    }
}

// تعديل بسيط داخل دالة send() لإرسال الملف
async function send() {
    const input = document.getElementById('userInput');
    const msg = input.value.trim();
    if(!msg && !attachedFile) return;

    const formData = new FormData();
    formData.append('message', msg);
    if(attachedFile) {
        formData.append('file', attachedFile);
    }

    addMsg(msg || "إرسال ملف...", 'user-bubble');
    input.value = '';
    attachedFile = null; // تصفير الملف بعد الإرسال

    try {
        const res = await fetch('http://localhost:5001/chat', {
            method: 'POST',
            body: formData // نرسل FormData بدلاً من JSON لاستيعاب الملفات
        });
        const data = await res.json();
        addMsg(data.reply, 'bot-bubble');
    } catch(e) {
        addMsg("⚠️ خطأ في معالجة الملف أو الاتصال بالسيرفر.", 'bot-bubble');
    }
}