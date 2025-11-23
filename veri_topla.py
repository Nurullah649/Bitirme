#!/usr/bin/env python3
# -- coding: utf-8 --

"""
Veri.py — Türkiye için yorum bazlı LLM veri seti üretici (3rd-party API'larla)
Özellikler:
- WeatherAPI (current.json - KULLANICI İSTEĞİYLE GÜNCELLENDİ)
- OpenCage reverse geocoding (ülke filtresi + İL FİLTRESİ)

- NASA POWER (temporal daily; future için dünü proxy alır)
- SoilGrids (ph üst katman)
- Rate limit, retry, hataya dayanıklı
- Çıktı: JSONL (her satır {"input": "...", "output":..."})

!!! NOT: Bu sürüm, IDE'den doğrudan çalıştırma için ayarlanmıştır.
!!! Girdi/Çıktı dosyalarını main() fonksiyonu içinden manuel ayarlayın.
!!! YENİ: API Anahtarlarını .env dosyasından okur.
"""

import os
import csv
import json
import time
import datetime
# import argparse # IDE'den çalıştırmak için argparse kaldırıldı
from pathlib import Path

import requests

# --- YENİ EKLENEN BÖLÜM ---
# .env dosyasını yüklemek için dotenv kütüphanesini import et
try:
    from dotenv import load_dotenv

    load_dotenv()  # .env dosyasındaki değişkenleri sisteme yükler
    print("API anahtarları için .env dosyası başarıyla yüklendi.")
except ImportError:
    print("UYARI: 'python-dotenv' kütüphanesi bulunamadı.")
    print("API anahtarlarının çalışması için 'pip install python-dotenv' komutuyla kurun veya IDE'de manuel ayarlayın.")
# --- YENİ BÖLÜM SONU ---


# ---------------------------
# CONFIG / ENV
# ---------------------------
# Varsayılan dosya adları; komut satırı ile değiştirilebilir
DEFAULT_GRID = "grid_turkey_safe_dates.csv"
DEFAULT_OUT = "dataset_tr.jsonl"

# API env değişkenleri (PyCharm Run Configuration VEYA .env dosyasından setle)
WAPI_KEY = os.getenv("WEATHER_API_KEY")
WAPI_URL = os.getenv("WEATHER_API_URL", "https://api.weatherapi.com/v1")

GEO_KEY = os.getenv("GEOCODING_API_KEY")
GEO_URL = os.getenv("GEOCODING_API_URL", "https://api.opencagedata.com/geocode/v1")

NASA_URL = os.getenv("NASA_POWER_API_URL", "https://power.larc.nasa.gov/api")
SOIL_URL = os.getenv("SOILGRIDS_API_URL", "https://rest.isric.org")

# Bitki rehberi (yorum üretimi için)
CROPS = {
    "Buğday": {"ph": (6.0, 7.5), "soil_moist": (20, 35), "temp": (12, 25)},
    "Mısır": {"ph": (5.8, 7.0), "soil_moist": (25, 40), "temp": (20, 32)},
    "Pamuk": {"ph": (5.8, 7.2), "soil_moist": (25, 35), "temp": (22, 36)},
    "Domates": {"ph": (6.0, 6.8), "soil_moist": (30, 45), "temp": (18, 30)},
    "Biber": {"ph": (5.5, 7.0), "soil_moist": (30, 45), "temp": (20, 30)},
    "Antep Fıstığı": {"ph": (7.0, 8.0), "soil_moist": (10, 25), "temp": (18, 38)},
}


# ---------------------------
# Yardımcılar
# ---------------------------
def _num(x, cast=float):
    if x is None:
        return None
    try:
        return cast(x)
    except Exception:
        try:
            return float(x) if cast is float else int(float(x))
        except Exception:
            return None


# ---------------------------
# Geocoding (OpenCage)
# ---------------------------
def reverse_geocode_country(lat, lon):
    """OpenCage reverse geocoding -> (country_code, admin_name) veya (None, None)"""
    if not GEO_KEY:
        return None, None
    try:
        r = requests.get(
            f"{GEO_URL}/json",
            params={"q": f"{lat}+{lon}", "key": GEO_KEY, "language": "tr", "no_annotations": 1, "pretty": 0},
            timeout=20,
        )
        r.raise_for_status()
        js = r.json()
        if js.get("results"):
            comp = js["results"][0].get("components", {})
            code = (comp.get("country_code") or "").upper()
            # İl (state), ilçe (province/county) veya şehir (city) bilgilerini al
            admin = comp.get("state") or comp.get("province") or comp.get("county") or comp.get("city")
            return code, admin
    except Exception:
        # gagal (quota, ağ, vs.) -> geri None
        pass
    return None, None


# ---------------------------
# WeatherAPI (current.json OLARAK GÜNCELLENDİ)
# ---------------------------
def fetch_weather(lat, lon, date_iso):
    """
    WeatherAPI:
    - KULLANICI İSTEĞİ ÜZERİNE 'current.json' KULLANILACAK ŞEKİLDE GÜNCELLENDİ.
    - 'date_iso' parametresi WeatherAPI çağrısı için ARTIK KULLANILMIYOR.
    - Her zaman o anki güncel hava durumunu çeker.
    Döndürür: {"temperature": float, "humidity": int, "rain_mm": float}
    """
    if not WAPI_KEY:
        raise RuntimeError("WEATHER_API_KEY tanımlı değil (.env dosyasını kontrol edin).")

    # --- 'date_iso' ve 'delta' logic'i kaldırıldı ---
    # 'date_iso' artık kullanılmıyor, çünkü current.json tarih almaz.
    # today = datetime.date.today()
    # target = datetime.date.fromisoformat(date_iso)
    # delta = (target - today).days
    # if delta <= 0: ...
    # --- Değişiklik sonu ---

    ep = "current.json"
    params = {"key": WAPI_KEY, "q": f"{lat},{lon}"}

    url = f"{WAPI_URL}/{ep}"
    r = requests.get(url, params=params, timeout=25)
    r.raise_for_status()
    js = r.json()

    # 'current.json' yanıtı 'history'/'forecast'tan farklıdır.
    # 'day' objesi yerine 'current' objesini okumamız gerekir.
    current = js.get("current", {})

    # 'current' objesindeki alan adları da farklı.
    # avgtemp_c -> temp_c
    # avghumidity -> humidity
    # totalprecip_mm -> precip_mm
    avgtemp = current.get("temp_c") or 25.0
    avghum = current.get("humidity") if current.get("humidity") is not None else 60
    rain = current.get("precip_mm") if current.get("precip_mm") is not None else 0.0

    try:
        avgtemp = round(float(avgtemp), 1)
    except Exception:
        avgtemp = 25.0
    try:
        avghum = int(round(float(avghum)))
    except Exception:
        avghum = 60
    try:
        rain = round(float(rain), 1)
    except Exception:
        rain = 0.0

    return {"temperature": avgtemp, "humidity": avghum, "rain_mm": rain}


# ---------------------------
# NASA POWER (safe proxy for future)
# ---------------------------
def fetch_nasa(lat, lon, date_iso):
    """
    NASA POWER: temporal/daily/point
    - Eğer target > today, proxy = yesterday
    - Retry/backoff, 500 hatalarında tekrar dener
    Döndürür: {"solar_irr": float or None}
    """
    today = datetime.date.today()
    target = datetime.date.fromisoformat(date_iso)

    if target > today:
        target = today - datetime.timedelta(days=1)

    ymd = target.strftime("%Y%m%d")
    params = {
        "latitude": lat,
        "longitude": lon,
        "community": "ag",
        "parameters": "ALLSKY_SFC_SW_DWN",
        "start": ymd,
        "end": ymd,
        "format": "JSON",
    }
    url = f"{NASA_URL}/temporal/daily/point"
    backoff = 0.8
    for _ in range(3):
        try:
            r = requests.get(url, params=params, timeout=25)
            r.raise_for_status()
            js = r.json()
            series = js.get("properties", {}).get("parameter", {}).get("ALLSKY_SFC_SW_DWN", {})
            val = None
            if isinstance(series, dict) and series:
                val = next(iter(series.values()))
            try:
                return {"solar_irr": round(float(val), 2) if val is not None else None}
            except Exception:
                return {"solar_irr": None}
        except Exception:
            time.sleep(backoff)
            backoff *= 1.8
    return {"solar_irr": None}


# ---------------------------
# SoilGrids (pH)
# ---------------------------
def fetch_soil(lat, lon):
    """
    SoilGrids v2.0 properties/query -> üst katman ph (phh2o)
    Döndürür: {"ph": float or None, "moisture": None}
    """
    params = [("lat", lat), ("lon", lon), ("depth", "0-5cm"), ("property", "phh2o")]
    url = f"{SOIL_URL}/soilgrids/v2.0/properties/query"
    try:
        r = requests.get(url, params=params, timeout=25)
        r.raise_for_status()
        js = r.json()
        ph = None
        layers = js.get("properties", {}).get("layers", [])
        for L in layers:
            if L.get("name") == "phh2o":
                depths = L.get("depths", [])
                if depths:
                    vals = depths[0].get("values", {}) or {}
                    ph = vals.get("mean")
                break
        try:
            # SoilGrids pH değerini 10'a bölmek gerekir (kendi dokümantasyonuna göre)
            ph = round(float(ph) / 10.0, 1) if ph is not None else None
        except Exception:
            ph = None
        return {"ph": ph, "moisture": None}
    except Exception:
        return {"ph": None, "moisture": None}


# ---------------------------
# Yorum üretimi (input -> output)
# ---------------------------
def _status(val, lo, hi, name, unit=""):
    if val is None:
        return None
    if val < lo:
        return f"{name} düşük ({val}{unit})."
    if val > hi:
        return f"{name} yüksek ({val}{unit})."
    return f"{name} uygun ({val}{unit})."


def build_comment(sample):
    plant = sample.get("plant")
    guide = CROPS.get(plant)
    comments = []

    if guide:
        ph_lo, ph_hi = guide["ph"]
        sm_lo, sm_hi = guide["soil_moist"]
        t_lo, t_hi = guide["temp"]
        for s in (
                _status(sample.get("soil_ph"), ph_lo, ph_hi, "Toprak pH"),
                _status(sample.get("soil_moisture"), sm_lo, sm_hi, "Toprak nemi", "%"),
                _status(sample.get("temperature"), t_lo, t_hi, "Sıcaklık", "°C"),
        ):
            if s:
                comments.append(s)

    T, H, R, S = sample.get("temperature"), sample.get("humidity"), sample.get("rain_mm"), sample.get("solar_irr")
    if guide and T is not None and H is not None:
        if H < 25 and T > guide["temp"][1]:
            comments.append("Düşük bağıl nem ve yüksek sıcaklık; buharlaşma artar, sulamayı/sıklığı artırın.")
        if H > 85 and T < sum(guide["temp"]) / 2:
            comments.append("Yüksek bağıl nem hastalık riskini artırır, yaprak ıslaklığını azaltın.")
    if R is not None and R > 10:
        comments.append("Son yağış yüksek; ek sulamayı azaltın ve drenajı kontrol edin.")
    if S is not None and S < 3.5:
        comments.append("Düşük güneşlenme; gelişme yavaşlayabilir, azot uygulamasını abartmayın.")

    # pH düzeltme önerileri
    if guide and sample.get("soil_ph") is not None:
        ph = sample["soil_ph"]
        if ph < guide["ph"][0]:
            comments.append("pH düşük: kireç veya organik madde ekleyin.")
        elif ph > guide["ph"][1]:
            comments.append("pH yüksek: kükürt ile dengeleyin.")

    # Hastalık bilgisi: 3rd-party disease yoksa varsayılan
    if sample.get("disease"):
        dis = sample.get("disease", {})
        if dis.get("detected"):
            dn = dis.get("name", "Hastalık")
            sy = dis.get("symptoms") or []
            comments.append(
                f"{dn} şüphesi var{(': ' + ', '.join(sy)) if sy else ''}. Uygun ilaç ve hijyen önlemleri alın.")
        else:
            comments.append("Şu an belirgin bir hastalık bulgusu yok.")
    else:
        comments.append("Şu an belirgin bir hastalık bulgusu yok.")

    if sample.get("admin_area"):
        comments.append(f"Konum: {sample['admin_area']} civarı için öneriler.")

    if not comments:
        comments.append("Koşullar normal görünüyor.")
    return " ".join(comments)


def build_input(sample):
    # --- DÜZELTME (1/1) ---
    # `sample.get("disease")` `None` döndürdüğünde `d` değişkeni de `None` oluyordu.
    # Bu durum `d.get('detected')` çağrıldığında 'NoneType' hatasına neden oluyordu.
    # `or {}` ekleyerek `d`'nin `None` olması durumunda boş bir sözlük (`{}`) olmasını sağlıyoruz.
    d = sample.get("disease") or {}
    # --- DÜZELTME SONU ---

    return (
        f"Konum: ({sample['lat']:.5f}, {sample['lon']:.5f}). Bitki: {sample['plant']}. Tarih: {sample['date_iso']}. "
        f"Sıcaklık: {sample.get('temperature', '?')}°C, Nem: %{sample.get('humidity', '?')}, Yağış: {sample.get('rain_mm', '?')} mm, "
        f"Güneş: {sample.get('solar_irr', '?')} kWh/m²/gün. Toprak pH: {sample.get('soil_ph', '?')}, "
        f"Toprak nemi: %{sample.get('soil_moisture', '?')}. Hastalık: {'Var' if d.get('detected') else 'Yok'}."
    )


# ---------------------------
# Ana toplayıcı
# ---------------------------
def harvest_point(lat, lon, date_iso, plant, country_filter="TR", province_filter=None):
    """
    Veri toplama iş akışı.
    YENİ: province_filter parametresi eklendi.
    """

    # 1) reverse geocode (optional filter)
    code, admin = reverse_geocode_country(lat, lon)

    # Ülke filtresi
    if country_filter and (code is None or code != country_filter.upper()):
        # Eğer OpenCage başarısız olursa code None döner; bu durumda atılmasını istiyorsan continue edilir.
        # Burada code None ise atlıyoruz (daha hassas kontrol). İstersen bunu değiştir.
        return None

    # --- YENİ EKLENEN BÖLÜM ---
    # İl filtresi (örn: "Şanlıurfa")
    if province_filter:
        if not admin:
            # Eğer OpenCage il/ilçe/şehir adı döndürmediyse atla
            return None

        # 'admin' içinde 'province_filter' (örn: "Şanlıurfa") geçiyor mu?
        # OpenCage "Şanlıurfa" veya "Şanlıurfa İli" döndürebilir, 'in' ile kontrol güvenlidir.
        if province_filter.lower() not in admin.lower():
            # Eşleşmezse bu noktayı atla
            return None
    # --- YENİ BÖLÜM SONU ---

    # 2) weather (current.json kullanacak şekilde güncellendi)
    # 'date_iso' parametresi artık fetch_weather tarafından yok sayılacak.
    wx = fetch_weather(lat, lon, date_iso)

    # 3) nasa
    ns = fetch_nasa(lat, lon, date_iso)

    # 4) soil
    soil = fetch_soil(lat, lon)

    sample = {
        "lat": lat,
        "lon": lon,
        "date_iso": date_iso,
        "plant": plant,
        "temperature": wx.get("temperature"),
        "humidity": wx.get("humidity"),
        "rain_mm": wx.get("rain_mm"),
        "solar_irr": ns.get("solar_irr"),
        "soil_ph": soil.get("ph"),
        "soil_moisture": None,  # SoilGrids nem verisi (örn: 'smed') eklenmedi
        "admin_area": admin,
        "disease": None,  # eğer disease detection servisin varsa ekleyebilirsin
    }
    return sample


def main():
    # --- IDE'den çalıştırmak için ayarlar ---
    # Lütfen bu dosya yollarını kendi sisteminize göre güncelleyin.
    GRID_FILE = "grid_urfa.csv"  # Girdi CSV dosyanızın adı
    OUT_FILE = "dataset_urfa.jsonl"  # Çıktı JSONL dosyanızın adı
    # MAX_RECORDS = 10000          # Maksimum kaç kayıt çekilecek (LİMİT KALDIRILDI)
    RATE_LIMIT_PER_SEC = 8.0  # Saniyedeki istek limiti
    COUNTRY_FILTER = "TR"  # Ülke filtresi
    PROVINCE_TO_FILTER = "Şanlıurfa"  # İl filtresi
    # --- Ayarlar sonu ---

    # ap = argparse.ArgumentParser()
    # ap.add_argument("--grid", required=True, help="CSV (lat,lon,date_iso,plant)")
    # ap.add_argument("--out", required=True, help="Çıktı JSONL dosyası")
    # ap.add_argument("--max", type=int, default=10000, help="Maksimum kayıt")
    # ap.add_argument("--rate", type=float, default=8.0, help="İstek/sn (rate limit)")
    # ap.add_argument("--country", default="TR", help="Ülke filtresi (örn TR)")
    # args = ap.parse_args()

    if not WAPI_KEY:
        raise SystemExit(
            "WEATHER_API_KEY ortam değişkeni eksik. .env dosyasını veya PyCharm Run Configs/Env vars ekleyin.")
    if not GEO_KEY:
        raise SystemExit(
            "GEOCODING_API_KEY ortam değişkeni eksik. .env dosyasını veya PyCharm Run Configs/Env vars ekleyin.")

    grid_path = Path(GRID_FILE)
    out_path = Path(OUT_FILE)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    delay = 1.0 / max(RATE_LIMIT_PER_SEC, 0.1)
    written = 0
    # skipped_future = 0 # 'current.json' kullanıldığı için bu kontrole gerek kalmadı
    skipped_filter = 0
    total = 0

    print(f"Başlatılıyor. BASE APIs: WeatherAPI (current.json), OpenCage, NASA POWER, SoilGrids")
    print(f"!!! ÖNEMLİ: Sadece '{PROVINCE_TO_FILTER}' ili için veri çekilecek.")
    print(f"!!! UYARI: WeatherAPI her zaman GÜNCEL (current) veriyi çekecek, CSV'deki tarih yok sayılacak.")
    print(f"Girdi: {grid_path.resolve()}")
    print(f"Çıktı: {out_path.resolve()}")

    with grid_path.open("r", encoding="utf-8") as f, out_path.open("w", encoding="utf-8") as w:
        rdr = csv.DictReader(f)
        for row in rdr:
            # if written >= MAX_RECORDS: # LİMİT KALDIRILDI
            #     print(f"Maksimum kayıt sayısına ulaşıldı ({MAX_RECORDS}). Durduruluyor.")
            #     break
            total += 1

            try:
                lat = float(row["lat"])
                lon = float(row["lon"])
                date_iso = row["date_iso"]
                plant = row.get("plant", "Buğday")
            except (ValueError, TypeError):
                print(f"Geçersiz satır atlandı (lat/lon/date): {row}")
                continue

            # Tarih kontrol: Weather için future>14 atla (current.json'a geçildiği için kaldırıldı)
            try:
                # NASA ve SoilGrids için tarih formatı hala gerekli
                tgt = datetime.date.fromisoformat(date_iso)
            except Exception:
                print(f"Geçersiz tarih formatı atlandı: {date_iso}")
                continue

            # delta = (tgt - datetime.date.today()).days
            # if delta > 14:
            #     skipped_future += 1
            #     # log, bekleme, devam
            #     # print(f"Atlandı (future>14): {date_iso} {lat:.3f},{lon:.3f}")
            #     time.sleep(delay) # Rate limit'i korumak için yine de bekle
            #     continue

            try:
                # --- 'province_filter' parametresi eklendi ---
                sample = harvest_point(
                    lat, lon, date_iso, plant,
                    country_filter=COUNTRY_FILTER,
                    province_filter=PROVINCE_TO_FILTER
                )

                if not sample:
                    # Bu atlama artık hem ülke (TR) hem de il (Şanlıurfa) filtresini içerir
                    # print(f"Atlandı (geocoding filtresi veya hata): {lat:.3f},{lon:.3f}")
                    skipped_filter += 1
                    time.sleep(delay)
                    continue

                ex = {"input": build_input(sample), "output": build_comment(sample)}
                w.write(json.dumps(ex, ensure_ascii=False) + "\n")
                written += 1
                print(f"[{written}] {lat:.3f},{lon:.3f}  ✔ ({sample.get('admin_area')})")
            except ValueError as ve:
                # fetch_weather çekince future>14 raise edilirse buraa düşer (önceden engellendi ama güvenlik)
                print(f"Atlandı (ValueError): {ve}")
            except requests.HTTPError as he:
                print(f"Hata: HTTP error: {he}")
            except Exception as e:
                print(f"Hata: {e}")

            time.sleep(delay)

    print(f"\nTamamlandı. Toplam yazılan: {written}. Atlanan (filtre): {skipped_filter}. İşlenen satır: {total}")
    print(f"Çıktı: {out_path.resolve()}")


if __name__ == "__main__":
    main()