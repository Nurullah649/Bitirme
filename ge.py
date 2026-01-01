import csv
import random
from datetime import date, timedelta

# --- AYARLAR ---
# Veriyi büyütmek için satır sayısını ciddi oranda artırdık.
HEDEFLENEN_SATIR_SAYISI = 50000
CIKTI_DOSYASI = "grid_urfa_genis.csv"

# Şanlıurfa Genişletilmiş Koordinat Sınırları
# Batı: Birecik (37.80), Doğu: Ceylanpınar (40.25)
# Güney: Akçakale/Harran (36.65), Kuzey: Siverek (37.95)
LAT_MIN, LAT_MAX = 36.65, 37.95
LON_MIN, LON_MAX = 37.80, 40.25

# Tarih aralığını da genişlettik (Son 5 yılın verisi)
# Modelin mevsimsel döngüleri (kurak yıl, yağışlı yıl) iyi öğrenmesi için.
TARIH_BASLANGIC = date(2020, 1, 1)
TARIH_BITIS = date(2025, 12, 30)

# Ürün çeşitliliği
BITKILER = [
    "Buğday",
    "Mısır",
    "Pamuk",
    "Domates",
    "Biber",
    "Antep Fıstığı",
    "Mercimek",  # Kışlık ürün olarak eklendi
    "Arpa",  # Kıraç alanlar için
    "Nohut"  # Alternatif ürün
]


# --- AYARLAR SONU ---

def random_date(start, end):
    """Verilen iki tarih arasında rastgele bir tarih döndürür."""
    delta = end - start
    int_delta = (delta.days)
    random_day = random.randrange(int_delta)
    return start + timedelta(days=random_day)


def main():
    print(f"Büyük Veri Seti Oluşturuluyor: '{CIKTI_DOSYASI}'")
    print(f"Hedef: {HEDEFLENEN_SATIR_SAYISI} satır | Kapsam: Tüm Şanlıurfa İli")

    rows = []
    # İlerleme çubuğu benzeri bir çıktı için
    for i in range(HEDEFLENEN_SATIR_SAYISI):
        lat = round(random.uniform(LAT_MIN, LAT_MAX), 5)
        lon = round(random.uniform(LON_MIN, LON_MAX), 5)
        d = random_date(TARIH_BASLANGIC, TARIH_BITIS)
        plant = random.choice(BITKILER)

        rows.append({
            "lat": lat,
            "lon": lon,
            "date_iso": d.isoformat(),
            "plant": plant
        })

        if (i + 1) % 5000 == 0:
            print(f"-> {i + 1} satır üretildi...")

    # CSV dosyasına yaz
    try:
        with open(CIKTI_DOSYASI, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ["lat", "lon", "date_iso", "plant"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            writer.writerows(rows)

        print(f"\nİŞLEM BAŞARILI: '{CIKTI_DOSYASI}' dosyası {len(rows)} satır ile hazır.")
        print("İpucu: Bu dosyayı 'dataset_olusturucu.py' içinde GRID_DOSYASI_PATH olarak tanımlamayı unutmayın.")

    except IOError as e:
        print(f"Hata: Dosya yazılırken bir sorun oluştu: {e}")


if __name__ == "__main__":
    main()