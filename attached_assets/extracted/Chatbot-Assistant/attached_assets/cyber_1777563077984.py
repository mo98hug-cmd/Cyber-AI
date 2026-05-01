import nltk
from nltk.stem import LancasterStemmer
import numpy as np
import json
import pickle
import random

# تحميل الأدوات اللازمة من nltk
nltk.download('punkt')
stemmer = LancasterStemmer()

# 1. تحميل ملف البيانات
with open('cyber.json', encoding='utf-8') as file:
    data = json.load(file)

words = []
classes = []
documents = []
ignore_words = ['?', '!', '.', ',']

# 2. مرحلة الـ Tokenization والـ Stemming
for intent in data['intents']:
    for pattern in intent['patterns']:
        # تقطيع كل جملة لكلمات
        w = nltk.word_tokenize(pattern)
        words.extend(w)
        # إضافة الجملة مع الـ Tag بتاعها في لستة الـ documents
        documents.append((w, intent['tag']))
        # إضافة الـ Tags الفريدة للستة الكلاسات
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

# تنظيف الكلمات وترتيبها
words = [stemmer.stem(w.lower()) for w in words if w not in ignore_words]
words = sorted(list(set(words)))
classes = sorted(list(set(classes)))

print(f"{len(documents)} documents (Patterns)")
print(f"{len(classes)} classes (Tags)")
print(f"{len(words)} unique stemmed words")

# 3. مرحلة الـ Bag of Words (تحويل النص لأرقام)
training = []
output_empty = [0] * len(classes)

for doc in documents:
    bag = []
    pattern_words = doc[0]
    pattern_words = [stemmer.stem(word.lower()) for word in pattern_words]
    
    # تحويل الجملة لمصفوفة 0 و 1
    for w in words:
        bag.append(1) if w in pattern_words else bag.append(0)
    
    # تحديد الـ Tag الصحيح بوضع 1 في مكانه
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    
    training.append([bag, output_row])

# خلط البيانات وتحويلها لـ Numpy Array
random.shuffle(training)
training = np.array(training, dtype=object)

train_x = list(training[:,0]) # الأسئلة (Inputs)
train_y = list(training[:,1]) # الأجوبة (Outputs)

# حفظ الكلمات والكلاسات عشان هنحتاجهم في ملف الـ Chat
pickle.dump(words, open('words.pkl', 'wb'))
pickle.dump(classes, open('classes.pkl', 'wb'))

# 4. بناء الـ Neural Network باستخدام TensorFlow
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import SGD

model = Sequential()
# Input Layer: حجمها بيساوي عدد الكلمات في القاموس
model.add(Dense(128, input_shape=(len(train_x[0]),), activation='relu'))
model.add(Dropout(0.5)) # عشان الموديل ميحفظش بس (Overfitting)

# Hidden Layer
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.5))

# Output Layer: حجمها بيساوي عدد الـ Tags
model.add(Dense(len(train_y[0]), activation='softmax'))

# ضبط الـ Optimizer
sgd = SGD(learning_rate=0.01, decay=1e-6, momentum=0.9, nesterov=True)
model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])

# 5. بـدء الـ Training (الفرن)
hist = model.fit(np.array(train_x), np.array(train_y), epochs=200, batch_size=5, verbose=1)

# حفظ الموديل النهائي
model.save('chatbot_model.h5', hist)
print("Model Created and Saved!")