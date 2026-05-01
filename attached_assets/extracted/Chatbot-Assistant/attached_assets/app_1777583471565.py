import os
import nltk
import json
import pickle
import numpy as np
import random
from flask import Flask, render_template, request, jsonify, session
from flask_session import Session  # التحسين الجديد للذاكرة
from keras.models import load_model
from nltk.stem import WordNetLemmatizer
import google.generativeai as genai

# --- إعدادات أساسية ---
lemmatizer = WordNetLemmatizer()
app = Flask(__name__)

# --- التحسين 1: إعدادات الذاكرة (Session Configuration) ---
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./flask_session/"
Session(app)

# --- إعدادات Gemini API ---
genai.configure(api_key="YOUR_GEMINI_API_KEY") # استبدله بمفتاحك الحقيقي
model_gemini = genai.GenerativeModel('gemini-pro')

# --- تحميل ملفات النموذج المحلي ---
# تأكد أن الأسماء تطابق ملفاتك (cyber.json, chatbot_model.h5, words.pkl, classes.pkl)
intents = json.loads(open('cyber.json', encoding='utf-8').read())
words = pickle.load(open('words.pkl', 'rb'))
classes = pickle.load(open('classes.pkl', 'rb'))
model_local = load_model('chatbot_model.h5')

# --- وظائف المعالجة ---
def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words, show_details=True):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
    return np.array(bag)

def predict_class(sentence, model):
    p = bow(sentence, words, show_details=False)
    res = model.predict(np.array([p]))[0]
    ERROR_THRESHOLD = 0.85 # نسبة الثقة المطلوبة للرد المحلي
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def get_response(ints, intents_json):
    if not ints:
        return None
    tag = ints[0]['intent']
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if i['tag'] == tag:
            result = random.choice(i['responses'])
            break
    return result

def save_unanswered(question):
    with open("unanswered_questions.txt", "a", encoding="utf-8") as f:
        f.write(question + "\n")

# --- المسارات (Routes) ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    
    # تحسين 2: تفعيل ذاكرة المحادثة لكل مستخدم[cite: 9]
    if "chat_history" not in session:
        session["chat_history"] = []

    # محاولة الرد بالنموذج المحلي أولاً
    ints = predict_class(user_input, model_local)
    local_res = get_response(ints, intents)

    if local_res:
        response_text = local_res
        source = "local"
    else:
        # تحسين 3: بناء سياق المحادثة قبل الإرسال لـ Gemini[cite: 9]
        history_context = ""
        for turn in session["chat_history"][-5:]: # نأخذ آخر 5 حوارات فقط
            history_context += f"المستخدم: {turn['user']}\nالبوت: {turn['bot']}\n"
        
        prompt = (
            f"أنت خبير أمن سيبراني ودود. إليك سياق المحادثة السابقة:\n{history_context}\n"
            f"المستخدم يسأل الآن: {user_input}\n"
            f"أجب بدقة وتعاطف."
        )
        
        try:
            gemini_res = model_gemini.generate_content(prompt)
            response_text = gemini_res.text
            source = "gemini"
            save_unanswered(user_input) # حفظ السؤال الذي لم يعرفه الموديل المحلي[cite: 9]
        except Exception as e:
            response_text = "عذراً، واجهت مشكلة في الاتصال بالسحاب. هل يمكنك إعادة المحاولة؟"
            source = "error"

    # تحسين 4: تحديث الذاكرة[cite: 9]
    session["chat_history"].append({"user": user_input, "bot": response_text})
    if len(session["chat_history"]) > 10:
        session["chat_history"].pop(0)
    session.modified = True

    return jsonify({
        "response": response_text,
        "source": source
    })

if __name__ == "__main__":
    app.run(debug=True)