import pandas as pd
import numpy as np
import re


class TarimBilgiBankasi:
    def __init__(self, veri_csv_path, verim_csv_path):
        self.veri_df = pd.read_csv(veri_csv_path)
        self.verim_df = pd.read_csv(verim_csv_path)
        self.bitki_bilgileri = {}
        self.verim_istatistikleri = {}

        self._verileri_islee()
        self._verimleri_isle()

    def _temizle_sayisal_aralik(self, deger):
        """
        '18-20', '20', '>5' gibi değerleri min, max olarak ayırır.
        """
        if pd.isna(deger) or deger == "":
            return None

        deger = str(deger).strip().replace(" mm", "").replace(" C", "")

        # 18-20 formatı
        aralik_match = re.match(r"(\d+)-(\d+)", deger)
        if aralik_match:
            return {"min": float(aralik_match.group(1)), "max": float(aralik_match.group(2))}

        # Tek sayı
        sayi_match = re.match(r"(\d+)", deger)
        if sayi_match:
            val = float(sayi_match.group(1))
            return {"min": val, "max": val}

        return deger  # Metin ise direkt döndür (örn: "Nisan")

    def _verileri_islee(self):
        """
        Veri.xlsx (csv formatındaki) dosyasını işleyip bitki bazlı sözlüğe çevirir.
        """
        # İlk sütun parametre isimleri (Satırlar), diğer sütunlar bitkiler
        parametreler = self.veri_df.iloc[:, 0].fillna("Bilinmiyor").tolist()

        # Sütun başlıklarından bitki isimlerini al (İlk sütun hariç)
        bitki_isimleri = self.veri_df.columns[1:]

        for bitki in bitki_isimleri:
            bilgiler = {}
            col_data = self.veri_df[bitki].tolist()

            for i, param in enumerate(parametreler):
                raw_val = col_data[i]
                clean_val = self._temizle_sayisal_aralik(raw_val)

                # Parametre ismini standartlaştır
                key = param.strip()
                if "ideal sıcaklık" in key.lower():
                    key = "ideal_sicaklik"
                elif "en düşük sıcaklık" in key.lower():
                    key = "min_sicaklik"
                elif "en yüksek sıcaklık" in key.lower():
                    key = "max_sicaklik"
                elif "ekim yapılan gün" in key.lower():
                    key = "ekim_zamani"
                elif "hasat yapılan gün" in key.lower():
                    key = "hasat_zamani"
                elif "yağış miktarı" in key.lower():
                    key = "yagis_ihtiyaci"
                elif "gübre" in key.lower():
                    key = "gubre_bilgisi"
                elif "ilaç" in key.lower():
                    key = "ilac_bilgisi"
                elif "ürün miktarı" in key.lower():
                    key = "tohum_miktari"
                elif "konum" in key.lower():
                    key = "bolge"
                else:
                    key = key.lower().replace(" ", "_")

                if clean_val:
                    bilgiler[key] = clean_val

            # Bitki adını temizle (Örn: "Arpa - Tarm-92" -> "Arpa")
            ana_isim = bitki.split("-")[0].strip()
            bilgiler["tam_isim"] = bitki
            bilgiler["tur"] = ana_isim

            self.bitki_bilgileri[bitki] = bilgiler

    def _verimleri_isle(self):
        """
        verimler.xls dosyasından Şanlıurfa ortalamalarını çeker.
        """
        # CSV yapısı biraz karmaşık, basitçe satırları tarayıp "Kg/Dekar" olanları alacağız
        for index, row in self.verim_df.iterrows():
            urun_tanimi = str(row[1])  # Genelde 2. sütunda ürün adı var
            if "Kg/Dekar" in urun_tanimi:
                # Ürün ismini ayıkla (Örn: "Verim ve ... (Mısır) - Kg/Dekar")
                match = re.search(r"\((.*?)\)", urun_tanimi)
                if match:
                    urun_adi = match.group(1).split("(")[0].strip()  # "Mısır"

                    # Yıllara göre verimler (sonraki sütunlarda)
                    # Sadece sayısal değerleri alıp ortalama hesaplayalım
                    degerler = []
                    for val in row[2:]:
                        try:
                            v = float(str(val).replace(",", "."))
                            if v > 0: degerler.append(v)
                        except:
                            pass

                    if degerler:
                        ortalama = sum(degerler) / len(degerler)
                        self.verim_istatistikleri[urun_adi] = int(ortalama)

    def bitki_getir(self, bitki_adi=None):
        """Rastgele veya spesifik bir bitki bilgisi döner."""
        if bitki_adi and bitki_adi in self.bitki_bilgileri:
            return self.bitki_bilgileri[bitki_adi]
        import random
        return self.bitki_bilgileri[random.choice(list(self.bitki_bilgileri.keys()))]

    def tum_bitki_isimleri(self):
        return list(self.bitki_bilgileri.keys())