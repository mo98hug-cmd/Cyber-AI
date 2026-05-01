from flask import Flask, request, jsonify 
#: Flask هو اللي بيعمل السيرفر، وCORS 
# مهم جداً عشان يسمح للمتصفح (الفرونت إند)
#  إنه يبعت طلبات لبايثون بدون ما المتصفح يرفضها لأسباب أمنية
from flask_cors import CORS
import random
import json
import pickle
import numpy as np
import nltk
from nltk.stem import LancasterStemmer
#بنستخدمهم عشان نداون الموديل اللي اتدرب 
# (5) ونعالج النصوص (Tokenization & Stemming)
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app) # السماح بالاتصال من المتصفح

# عشان اعمل داون لود للميموري للبوت
stemmer = LancasterStemmer()
model = load_model('chatbot_model.h5') # ال اتدرب عليه 
intents = json.loads(open('cyber.json', encoding='utf-8').read()) #ملف الـ JSON اللي فيه الأسئلة والأجوبة
words = pickle.load(open('words.pkl', 'rb')) #قائمة الكلمات اللي الموديل عارفها
classes = pickle.load(open('classes.pkl', 'rb')) #التصنيفات (زي SQLi XSS)

# من هنا انا بعمل Text Processing
def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence) #تقطيع الجملة
    return [stemmer.stem(word.lower()) for word in sentence_words] 
# تحويل الحروف لـ Small
#بيشيل الزياده بيرجع الكلمه عادي يعني لو عندي مثلا hacking هيخليها hack و هكذا 
# بقسم و برجع الكلمه لاصلها

#BoW  اختصار ل Bag of Words
#الوظيفة دي هي اللي بتحول "اللغة" اللي إحنا بنفهمها لـ "لغة الأرقام" (0 و 1) اللي موديل الذكاء الاصطناعي بيقدر يعالجها 
def bow(sentence, words):
    sentence_words = clean_up_sentence(sentence) # هرجع الكله للاصل زي فوق و بقسمها 
    bag = [0]*len(words) #من غير السطر ده، مش هيبقى عندك مكان تخزني فيه الكلمات اللي لقيتيها في جملة المستخدم
    #إنت بتبني "الهيكل" بالأصفار الأول، 
    # وبعدين ب (تخليها 1) الأماكن اللي الكلمات بتاعتها ظهرت في الجملة
    for s in sentence_words: #بنمر على كل كلمة في جملة المستخدم s
        for i,w in enumerate(words):
            if w == s: bag[i] = 1 #وبنقارنها بكل الكلمات اللي البوت عارفها w
    return np.array(bag)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get("message") 
    #هنا السيرفر بيفتح ال"JSON اللي مبعوت من الفرونت إند
    #وبياخد منه النص اللي المستخدم كتبه في خانة الـ message
    
    p = bow(message, words) #p: بنحول جملة المستخدم لمصفوفة الأصفار والوحايد Bag of Words
    res = model.predict(np.array([p]))[0] #الموديل مش بيرد بكلمة واحدة هو بيرجع قائمة فيها نسبة احتمالية لكل تصنيف Tag هو عارفه
    
    ERROR_THRESHOLD = 0.70 # نسبة التأكد
    results = [[i,r] for i,r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True) #ده بيحمي البوت من إنه يجاوب إجابات غلط خالص لما المستخدم يكتب كلام عشوائي
    
    if results:
        tag = classes[results[0][0]] # صاحب أعلى نسبة تأكد هو ال بيطلع ريزلت
        for i in intents['intents']:
            if i['tag'] == tag:
                response = random.choice(i['responses']) # هو هنا بيلوب cyber.json
                #بيدور على ال Tag اللي بيطابق اللي الموديل لسه مطلعه
                break 
    else:
        response = "I'm sorry, I don't have enough information about this yet. Try asking about SQLi or XSS!"
         #اللي فوق يعني لو الموديل ملقاش أي حاجة ثقته فيها أعلى من 70% هيطلع الرسالة دي للمستخدم بدل ما يهبد إجابة ملهاش علاقة بالموضوع
    return jsonify({"reply": response})
#الموديل أنا متأكد بنسبة 95% إن ده سؤال عن الـ XSS
#الكود تمام هروح أدور في ملف الـ JSON على قسم الـ XSS
#الكود لقيت 5 ردود هختار واحد منهم عشوائي XSS is a vulnerability where
#الكود يا فرونت إند، خد الرد ده أهو اعرضه للمستخدم.

if __name__ == '__main__':
    #  بس التشغيل هنا على بورت 5001 عشان الماك
    app.run(port=5001, debug=True)