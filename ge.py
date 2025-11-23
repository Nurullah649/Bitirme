import csv
import random
from datetime import date, timedelta

# --- AYARLAR ---
HEDEFLENEN_SATIR_SAYISI = 500
CIKTI_DOSYASI = "grid_urfa.csv"

# Şanlıurfa için yaklaşık koordinat sınırları (dışarı taşsa bile
# veri_topla.py içindeki filtre bunu yakalayacaktır)
LAT_MIN, LAT_MAX = 36.80, 37.80
LON_MIN, LON_MAX = 37.90, 39.40

# Tarih aralığı (NASA POWER'ın geçmiş veriye ihtiyacı var,
# WeatherAPI zaten 'current' kullanıyor)
TARIH_BASLANGIC = date(2024, 5, 1)
TARIH_BITIS = date(2025, 11, 30)

# veri_topla.py içindeki CROPS sözlüğünden alınan bitkiler
# Domates ve Biber'i de ekledim ki veri çeşitliliği artsın.
BITKILER = [
    "Buğday",
    "Mısır",
    "Pamuk",
    "Domates",
    "Biber",
    "Antep Fıstığı"
]


# --- AYARLAR SONU ---

def random_date(start, end):
    """Verilen iki tarih arasında rastgele bir tarih döndürür."""
    delta = end - start
    int_delta = (delta.days)
    random_day = random.randrange(int_delta)
    return start + timedelta(days=random_day)


def main():
    print(f"'{CIKTI_DOSYASI}' dosyası {HEDEFLENEN_SATIR_SAYISI} satır ile oluşturuluyor...")

    rows = []
    for _ in range(HEDEFLENEN_SATIR_SAYISI):
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

    # CSV dosyasına yaz
    try:
        with open(CIKTI_DOSYASI, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ["lat", "lon", "date_iso", "plant"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            writer.writerows(rows)

        print(f"Başarılı: '{CIKTI_DOSYASI}' dosyası {len(rows)} satır ile güncellendi.")
        print("Şimdi 'veri_topla.py' betiğini çalıştırabilirsiniz.")

    except IOError as e:
        print(f"Hata: Dosya yazılırken bir sorun oluştu: {e}")


if __name__ == "__main__":
    main()