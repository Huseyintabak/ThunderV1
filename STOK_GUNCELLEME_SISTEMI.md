# 🔧 Stok Güncelleme Sistemi - Tasarım Dokümanı

## 📋 Sorun Analizi

**Durum**: Personel üretim yaptığında stoklar otomatik güncellenmiyor.

**Gereksinimler**:
1. Üretim tamamlandığında hammadde/yarı mamul stokları düşmeli
2. Üretilen ürün stokları artmalı
3. Stok hareketleri kaydedilmeli
4. Gerçek zamanlı güncelleme olmalı

## 🎯 Çözüm Tasarımı

### **1. Üretim Tamamlama Akışı:**

```
Üretim Tamamlandı
    ↓
Ürün Ağacını (BOM) Oku
    ↓
Gerekli Malzemeleri Belirle
    ↓
Hammadde/Yarı Mamul Stoklarını Düş
    ↓
Üretilen Ürün Stoğunu Artır
    ↓
Stok Hareketlerini Kaydet
    ↓
Gerçek Zamanlı Bildirim Gönder
```

### **2. API Endpoint'i:**

`POST /api/productions/:id/complete`

**Yapılacaklar**:
1. Production kaydını güncelle (status: 'completed')
2. Ürün ağacını oku (urun_agaci tablosu)
3. Gerekli malzemeleri bul
4. Hammadde/yarı mamul stoklarını düş
5. Üretilen ürün stoğunu artır
6. Stok hareketlerini kaydet (stok_hareketleri tablosu)
7. Real-time event gönder

### **3. Kod Yapısı:**

```javascript
app.post('/api/productions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { produced_quantity } = req.body;
    
    // 1. Production kaydını getir
    const production = await getProduction(id);
    
    // 2. Ürün ağacını oku
    const bom = await getBOM(production.product_id, production.product_type);
    
    // 3. Malzeme stoklarını düş
    for (const material of bom) {
      await updateMaterialStock(material, -required_quantity);
      await createStockMovement('cikis', material, required_quantity);
    }
    
    // 4. Üretilen ürün stoğunu artır
    await updateProductStock(production.product_id, production.product_type, produced_quantity);
    await createStockMovement('giris', production, produced_quantity);
    
    // 5. Production kaydını güncelle
    await updateProductionStatus(id, 'completed');
    
    // 6. Real-time event gönder
    broadcastStockUpdate();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 Veritabanı Tabloları

### **1. urun_agaci (BOM):**
```sql
SELECT alt_urun_id, alt_urun_tipi, gerekli_miktar
FROM urun_agaci
WHERE ana_urun_id = ? AND ana_urun_tipi = ?
```

### **2. hammaddeler / yarimamuller / nihai_urunler:**
```sql
UPDATE hammaddeler
SET miktar = miktar - ?
WHERE id = ?
```

### **3. stok_hareketleri:**
```sql
INSERT INTO stok_hareketleri (
  urun_id, urun_tipi, hareket_tipi, miktar, birim, 
  referans_no, aciklama
) VALUES (?, ?, ?, ?, ?, ?, ?)
```

## 🚀 İmplementasyon Adımları

### **1. Stock Update Fonksiyonu:**

```javascript
async function updateMaterialStock(materialId, materialType, quantity) {
  const tableName = materialType === 'hammadde' ? 'hammaddeler' : 'yarimamuller';
  
  const { error } = await supabase
    .from(tableName)
    .update({ miktar: supabase.raw(`miktar + ${quantity}`) })
    .eq('id', materialId);
    
  if (error) throw error;
}
```

### **2. Stock Movement Fonksiyonu:**

```javascript
async function createStockMovement(type, material, quantity, referenceNo) {
  const { error } = await supabase
    .from('stok_hareketleri')
    .insert({
      urun_id: material.id,
      urun_tipi: material.type,
      hareket_tipi: type,
      miktar: Math.abs(quantity),
      birim: material.birim,
      referans_no: referenceNo,
      aciklama: `Üretim ${type === 'cikis' ? 'tüketimi' : 'sonucu'}`
    });
    
  if (error) throw error;
}
```

### **3. BOM Reader Fonksiyonu:**

```javascript
async function getBOM(productId, productType) {
  const { data, error } = await supabase
    .from('urun_agaci')
    .select('alt_urun_id, alt_urun_tipi, gerekli_miktar')
    .eq('ana_urun_id', productId)
    .eq('ana_urun_tipi', productType);
    
  if (error) throw error;
  return data || [];
}
```

## 🔍 Test Senaryosu

### **Senaryo: 10 adet Nihai Ürün Üretimi**

**Başlangıç:**
- Hammadde A: 100 kg
- Yarı Mamul B: 50 adet
- Nihai Ürün C: 0 adet

**BOM (Ürün Ağacı):**
- 1 Nihai Ürün C = 2 kg Hammadde A + 1 adet Yarı Mamul B

**Üretim Tamamlandıktan Sonra:**
- Hammadde A: 100 - (10 × 2) = 80 kg ✅
- Yarı Mamul B: 50 - (10 × 1) = 40 adet ✅
- Nihai Ürün C: 0 + 10 = 10 adet ✅

**Stok Hareketleri:**
- Çıkış: 20 kg Hammadde A
- Çıkış: 10 adet Yarı Mamul B
- Giriş: 10 adet Nihai Ürün C

## 🎯 Beklenen Sonuç

- ✅ **Otomatik Stok Güncellemesi**: Üretim tamamlandığında
- ✅ **BOM Bazlı Hesaplama**: Ürün ağacına göre
- ✅ **Stok Hareketi Kaydı**: Her değişiklik kaydedilir
- ✅ **Gerçek Zamanlı Bildirim**: Stok değişimlerinde

---

**🎯 Durum**: Stok güncelleme sistemi tasarlandı, implementasyon başlayabilir!
