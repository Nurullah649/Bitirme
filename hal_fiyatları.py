import requests
from bs4 import BeautifulSoup
import uuid
import random
import re
import time


def get_hidden_payload(soup):
    """
    ASP.NET sayfaları için gerekli hidden field'ları (ViewState vb.) toplar.
    """
    payload = {}
    for item in ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION']:
        element = soup.find('input', {'id': item})
        if element:
            payload[item] = element.get('value')
    return payload


def parse_products_from_soup(soup):
    """
    Verilen HTML içeriğindeki (soup) tabloyu bulur ve ürünleri listeye çevirir.
    """
    # GridView tablosunu bul (class='gridView' genellikle sabittir)
    table = soup.find("table", {"class": "gridView"})

    if not table:
        return []

    products = []
    rows = table.find_all("tr")

    # İlk satır başlık olduğu için atlıyoruz
    for row in rows[1:]:
        cols = row.find_all("td")
        # Paginasyon satırını veya boş satırları atla
        if len(cols) < 6:
            continue

        name = cols[0].get_text(strip=True)
        variety = cols[1].get_text(strip=True)
        price_str = cols[3].get_text(strip=True)
        unit = cols[5].get_text(strip=True)

        try:
            price = float(price_str.replace(",", "."))
        except:
            price = 0.0

        # Trend ve Değişim Oranı (Simülasyon - Sitede olmadığı için)
        trend_options = ["up", "down", "stable"]
        trend = random.choice(trend_options)
        change_rate = round(random.uniform(0.1, 5.0), 1) if trend != "stable" else 0.0

        item = {
            "id": str(uuid.uuid4()),
            "name": f"{name} ({variety})",
            "price": price,
            "unit": unit,
            "trend": trend,
            "changeRate": change_rate
        }
        products.append(item)
    return products


def fetch_hal_prices():
    url = "https://www.hal.gov.tr/Sayfalar/FiyatDetaylari.aspx"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    session = requests.Session()
    session.headers.update(headers)
    all_products = []

    print("Sayfa 1 çekiliyor...")

    try:
        # 1. İlk Sayfayı Çek (GET)
        response = session.get(url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # İlk sayfa verilerini al
        page_products = parse_products_from_soup(soup)
        all_products.extend(page_products)
        print(f"Sayfa 1 tamamlandı. ({len(page_products)} ürün)")

        # 2. Paginasyon ID'sini bul (Event Target)
        # Genellikle javascript:__doPostBack('...$gvFiyatlar','Page$2') şeklindedir
        # HTML içinde __doPostBack içeren bir link arıyoruz.
        event_target = None
        pagination_links = soup.find_all('a', href=re.compile(r"__doPostBack"))

        for link in pagination_links:
            href = link.get('href')
            if "Page$" in href:
                # Regex ile hedef ID'yi çıkar: __doPostBack('HEDEF_ID','ARGUMAN')
                match = re.search(r"__doPostBack\('([^']*)','Page\$\d+'\)", href)
                if match:
                    event_target = match.group(1)
                    break

        if not event_target:
            print("Paginasyon hedefi bulunamadı veya tek sayfa var.")
            return all_products

        # 3. Diğer Sayfaları Gez (POST)
        # Örnek olarak 5 sayfa gezilecek şekilde sınır koyuyorum.
        # İsterseniz range(2, 20) yapabilirsiniz.
        for page_num in range(2,6000):
            print(f"Sayfa {page_num} çekiliyor...")

            # Önceki sayfadan alınan ViewState verilerini hazırla
            payload = get_hidden_payload(soup)
            payload['__EVENTTARGET'] = event_target
            payload['__EVENTARGUMENT'] = f'Page${page_num}'

            # ASP.NET formlarında genellikle bu buton değerleri boş gönderilir veya gönderilmez
            # payload['ctl00$ctl37$g_...$btnGet'] = 'Fiyat Bul' # Gerekirse eklenebilir

            # POST isteği at
            response = session.post(url, data=payload, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')

            new_products = parse_products_from_soup(soup)

            # Eğer boş geldiyse veya önceki sayfayla aynıysa (son sayfaya geldik demektir) döngüyü kır
            if not new_products:
                print("Veri gelmedi, döngü sonlandırılıyor.")
                break

            # Basit bir tekrar kontrolü (sonsuz döngüden kaçınmak için)
            if new_products[0]['name'] == all_products[-len(new_products)]['name']:
                print("Son sayfaya ulaşıldı.")
                break

            all_products.extend(new_products)
            print(f"Sayfa {page_num} tamamlandı. (+{len(new_products)} ürün)")

            # Sunucuyu yormamak için kısa bekleme
            time.sleep(1)

        print(f"Bitti! Toplam {len(all_products)} ürün toplandı.")
        return all_products

    except Exception as e:
        print(f"Bir hata oluştu: {e}")
        return all_products


if __name__ == "__main__":
    data = fetch_hal_prices()

    # Konsola yazdır
    print("-" * 60)
    print(f"{'ÜRÜN':<40} | {'FİYAT':<10}")
    print("-" * 60)
    # Hepsini değil, örnek olması için ilk 10 ve son 5 tanesini yazdıralım
    for p in data[:10]:
        print(f"{p['name']:<40} | {p['price']} TL")

    if len(data) > 15:
        print(f"... ve {len(data) - 15} ürün daha ...")

    for p in data[-5:]:
        print(f"{p['name']:<40} | {p['price']} TL")
    print("-" * 60)