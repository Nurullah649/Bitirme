import requests
import sys
import getpass  # Şifreyi gizli girmek için

# --- AYARLAR ---
# VDS IP Adresini buraya yaz
VDS_URL = "http://78.135.85.128"


def giris_yap():
    """Kullanıcıdan bilgi alır ve Token döner."""
    print(f"--- RAG API GÜVENLİ GİRİŞ ({VDS_URL}) ---")
    email = input("E-posta: ")
    # Şifreyi ekranda göstermeden alır (IDE'de çalışmazsa input() kullan)
    password = input("Şifre: ")

    auth_url = f"{VDS_URL}/auth/login"
    payload = {
        "email": email,
        "password": password
    }

    try:
        response = requests.post(auth_url, json=payload, timeout=10)

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Giriş Başarılı! Jeton (Token) alındı.\n")
            return token
        elif response.status_code == 401:
            print("❌ HATA: E-posta veya şifre yanlış.")
            return None
        else:
            print(f"❌ HATA: Sunucu {response.status_code} kodu döndürdü.")
            print("Detay:", response.text)
            return None

    except requests.exceptions.ConnectionError:
        print("\n⛔ BAĞLANTI HATASI: Sunucuya ulaşılamıyor.")
        return None


def soru_sor():
    # 1. Önce Giriş Yap
    token = giris_yap()

    if not token:
        print("Giriş yapılamadığı için program kapatılıyor.")
        return

    # 2. Token ile Soru Sorma Döngüsü
    print("Çıkmak için 'q' veya 'exit' yazabilirsin.\n")

    # Token'ı başlığa (Header) ekliyoruz
    headers = {
        "Authorization": f"Bearer {token}"
    }

    while True:
        soru = input("Sorunu yaz: ")

        if soru.lower() in ['q', 'exit', 'çık']:
            print("Görüşürüz kral!")
            break

        if not soru.strip():
            continue

        try:
            api_endpoint = f"{VDS_URL}/ask"
            payload = {"question": soru}

            print("⏳ Sunucuya soruluyor...")

            # Header ile birlikte isteği atıyoruz
            response = requests.post(api_endpoint, json=payload, headers=headers, timeout=30)

            if response.status_code == 200:
                print("\n--- 🤖 SUNUCUDAN GELEN CEVAP ---")
                print(response.text)
                print("-" * 30 + "\n")

            elif response.status_code == 401:
                print("\n❌ HATA: Oturum süresi dolmuş olabilir (Unauthorized).")
                print("Lütfen programı yeniden başlatıp giriş yap.")
                break
            else:
                print(f"\n❌ HATA: Sunucu {response.status_code} kodu döndürdü.")
                print("Detay:", response.text)

        except Exception as e:
            print(f"\nBeklenmeyen bir hata oluştu: {e}")


if __name__ == "__main__":
    soru_sor()