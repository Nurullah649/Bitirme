# 🌱 CiftciApp - Akıllı Tarım Asistanı

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB)
![Python](https://img.shields.io/badge/Backend-Python%20Flask-yellow)
![AI](https://img.shields.io/badge/AI-LLM%20%26%20RAG-ff69b4)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)

## 📖 Proje Hakkında

**CiftciApp**, modern tarım tekniklerini yapay zeka ile birleştirerek çiftçilere dijital danışmanlık hizmeti sunan kapsamlı bir mobil uygulamadır. **Konya Teknik Üniversitesi Bilgisayar Mühendisliği Bitirme Projesi** kapsamında geliştirilmiştir.

Uygulama, çiftçilerin tarımsal verimliliğini artırmayı, hastalık teşhisini kolaylaştırmayı ve anlık hava durumu/saha analizleri ile karar verme süreçlerini desteklemeyi amaçlar. Geleneksel tarım yöntemlerini, **Fine-tuned (Özel Eğitilmiş) Büyük Dil Modelleri (LLM)** ve **Coğrafi Bilgi Sistemleri** ile güçlendirir.

---

## 🚀 Temel Özellikler

* **🤖 AI Ziraat Danışmanı:** Tarımsal soruları yanıtlamak, hastalık teşhisi koymak ve gübreleme tavsiyeleri vermek için özelleştirilmiş ve ince ayar (fine-tune) yapılmış LLM tabanlı sohbet botu.
* **🌦️ Akıllı Hava Durumu:** Konuma özel anlık hava durumu verileri ve tarımsal faaliyetler için (ilaçlama zamanı, don riski vb.) uyarılar.
* **🗺️ Dinamik Tarla Haritalama:** Kullanıcıların tarlalarını harita üzerinde işaretleyip kayıt altına alabileceği ve alan analizi yapabileceği interaktif harita modülü.
* **🔐 Güvenli Kullanıcı Yönetimi:** JWT tabanlı kimlik doğrulama sistemi ile güvenli giriş ve veri saklama.
* **📱 Çapraz Platform:** React Native sayesinde hem iOS hem de Android cihazlarda sorunsuz deneyim.

---

## 🛠️ Teknolojiler ve Mimari

Proje, modern yazılım mimarisi prensiplerine uygun olarak **Client-Server** yapısında geliştirilmiştir.

### Mobile (Client)
* **Framework:** React Native (Expo/CLI)
* **State Management:** Redux & Context API
* **Harita:** React Native Maps
* **Depolama:** AsyncStorage

### Backend (Server)
* **Dil:** Python
* **Framework:** Flask (RESTful API)
* **Veritabanı:** PostgreSQL
* **ORM:** SQLAlchemy
* **Authentication:** JWT (JSON Web Tokens)

### Yapay Zeka (AI Core)
* **Model:** Özel veri setleri ile eğitilmiş (Fine-Tuned) LLM (Örn: Llama/Mistral tabanlı)
* **Kütüphaneler:** PyTorch, Hugging Face Transformers
* **Yöntem:** RAG (Retrieval-Augmented Generation) desteği ile güncel tarım verilerine erişim.

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler
* Node.js & npm/yarn
* Python 3.8+
* PostgreSQL
