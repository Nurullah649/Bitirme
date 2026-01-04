from qdrant_client import QdrantClient
import ollama

# Ayarlar
# Docker'daki Qdrant'a bağlan
client = QdrantClient(url="http://localhost:6333")
MODEL = "embeddinggemma" 

def test_et(soru):
    print(f"\n🔎 SORU: {soru}")
    print("-" * 40)
    
    # 1. Soruyu vektöre çevir
    try:
        vec = ollama.embeddings(model=MODEL, prompt=soru)["embedding"]
    except Exception as e:
        print(f"Ollama Hatası: {e}")
        return

    # 2. Qdrant'ta Ara (YENİ METOT: query_points)
    try:
        results = client.query_points(
            collection_name="tarim_bilgi_bankasi",
            query=vec,  # 'query_vector' yerine 'query' kullanılıyor
            limit=3
        )
        
        # Dönen sonuç bir obje olduğu için .points ile listeyi alıyoruz
        hits = results.points 
        
        for hit in hits:
            # Payload içindeki verileri çek
            kaynak = hit.payload.get('kaynak', 'Bilinmiyor')
            metin = hit.payload.get('tam_metin', '')
            score = hit.score
            
            print(f"📄 [{kaynak}] (Skor: {score:.2f}): {metin}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Qdrant Arama Hatası: {e}")

# Test Soruları
if __name__ == "__main__":
    test_et("Biber ekimi için sıcaklık kaç derece olmalı?")
    test_et("Şanlıurfa pamuk verimi 2020 yılında nasıldı?")
