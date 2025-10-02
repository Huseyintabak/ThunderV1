# 🔍 BOM (Ürün Ağacı) Veritabanı Analiz Rehberi

## 📋 Adım Adım Analiz

### 1. Supabase SQL Editor'a Git
- Supabase Dashboard'a gir: https://supabase.com
- Projeyi seç
- Sol menüden **SQL Editor** seçeneğine tıkla

### 2. Analiz SQL'ini Çalıştır
- `analyze_all_bom.sql` dosyasındaki SQL'i kopyala
- SQL Editor'a yapıştır
- **RUN** butonuna tıkla

---

## 📊 Beklenen Sonuçlar

### 1. GENEL BOM İSTATİSTİKLERİ
Bu bölüm şunları gösterecek:
- Toplam BOM kayıt sayısı
- Aktif/Pasif kayıt dağılımı
- Nihai ürünler için BOM sayısı

**Örnek Çıktı:**
```
ana_urun_tipi | toplam_kayit | farkli_urun_sayisi | aktif_kayit | pasif_kayit
--------------+--------------+--------------------+-------------+-------------
nihai         | 1500         | 250                | 150         | 1350
```

### 2. NİHAİ ÜRÜNLER İÇİN BOM DURUMU
Test edilen ürünlerin BOM durumu:
- Product ID 177: TRX-2-Gri-98-92
- Product ID 178: ?
- Product ID 179: TRX-2-Gri-98-98
- Product ID 1090: TRX-2-Siyah-86-94
- Product ID 1171: TRX-1-Gri-90-94
- Product ID 1240: TRX-2-Gri-98-92
- Product ID 1241: TRX-2-Gri-98-98

**Beklenen:**
```
nihai_urun_id | nihai_urun_adi    | bom_kayit_sayisi | aktif_bom | pasif_bom
--------------+-------------------+------------------+-----------+-----------
177           | TRX-2-Gri-98-92  | 6                | 6         | 0
178           | ?                 | 0                | 0         | 0
179           | TRX-2-Gri-98-98  | 0                | 0         | 0
```

### 3. PRODUCT ID 177 İÇİN DETAYLI BOM
Bu bölüm Product ID 177 için tüm BOM kayıtlarını gösterecek:

**Beklenen:**
```
bom_id | ana_urun_id | alt_urun_id | alt_urun_tipi | gerekli_miktar | aktif | malzeme_adi
-------+-------------+-------------+---------------+----------------+-------+-------------
...    | 177         | 67          | hammadde      | 2.0            | true  | Hammadde 1
...    | 177         | 103         | hammadde      | 1.5            | true  | Hammadde 2
...    | 177         | 84          | hammadde      | 3.0            | true  | Hammadde 3
...    | 177         | 21          | hammadde      | 1.0            | true  | Hammadde 4
...    | 177         | 1757664... | hammadde      | 0.5            | true  | Hammadde 5
...    | 177         | 509         | yarimamul     | 1.0            | true  | Yarı Mamul 1
```

### 4. TÜM AKTİF BOM KAYITLARI
Aktif BOM'a sahip nihai ürünlerin listesi

### 5. PASİF BOM KAYITLARI
Pasif BOM kayıtlarına sahip ürünler

### 6. EKSIK BOM TANIMLI NİHAİ ÜRÜNLER
BOM tanımlanmamış aktif nihai ürünler

### 7. SON EKLENEN BOM KAYITLARI
En son eklenen 30 BOM kaydı

---

## 🚨 Sorun Tespiti

### Eğer Product ID 177 için `aktif_bom = 0` ise:
**Sorun:** BOM kayıtları pasif durumda!

**Çözüm:**
```sql
UPDATE urun_agaci
SET aktif = true
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';
```

### Eğer Product ID 177 için `bom_kayit_sayisi = 0` ise:
**Sorun:** BOM kayıtları hiç eklenmemiş!

**Çözüm:** `add_bom_for_177.sql` dosyasını çalıştır.

### Eğer `ana_urun_id` farklı bir ID ise:
**Sorun:** Product ID eşleşmiyor!

**Çözüm:** Doğru product ID'yi bul ve BOM kayıtlarını düzelt.

---

## 🔍 Debug İçin SQL Sorguları

### Product ID 177'nin Nihai Ürünler Tablosunda Var Mı?
```sql
SELECT id, ad, kod, aktif 
FROM nihai_urunler 
WHERE id = 177;
```

### Product ID 177 için Tüm BOM Kayıtları (Aktif/Pasif)
```sql
SELECT * 
FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';
```

### Hangi Nihai Ürünlerin BOM'u Var?
```sql
SELECT DISTINCT ua.ana_urun_id, n.ad, n.kod
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai' AND ua.aktif = true
ORDER BY ua.ana_urun_id;
```

---

## 📝 Sonuçları Raporla

Analiz sonuçlarını şu formatta raporla:

1. **Genel İstatistikler:**
   - Toplam BOM kayıt sayısı: ?
   - Aktif BOM sayısı: ?
   - Pasif BOM sayısı: ?

2. **Product ID 177 Durumu:**
   - BOM kayıt sayısı: ?
   - Aktif BOM sayısı: ?
   - Pasif BOM sayısı: ?

3. **Sorun:**
   - BOM kayıtları var mı? (Evet/Hayır)
   - BOM kayıtları aktif mi? (Evet/Hayır)
   - Product ID doğru mu? (Evet/Hayır)

---

## 🎯 Sonraki Adımlar

Analiz sonuçlarına göre:

### Senaryo 1: BOM kayıtları YOK
→ `add_bom_for_177.sql` dosyasını çalıştır

### Senaryo 2: BOM kayıtları var ama PASİF
→ `activate_bom_records.sql` dosyasını çalıştır

### Senaryo 3: BOM kayıtları var ve AKTİF ama sorgu bulamıyor
→ Product ID eşleşmesini kontrol et
→ `ana_urun_tipi` değerini kontrol et (nihai, yarimamul, hammadde)

### Senaryo 4: BOM kayıtları var ve AKTİF ama farklı `ana_urun_id`
→ Doğru product ID'yi bul
→ BOM kayıtlarını güncelle veya yeni ekle


