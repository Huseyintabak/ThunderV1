-- Production ID 192'nin durumunu kontrol et
-- Nihai ürün stoğu neden güncellenmedi?

-- 1. Production ID 192'nin mevcut durumu
SELECT 
    id,
    product_id,
    product_type,
    quantity,
    status,
    start_time,
    end_time,
    created_by,
    notes,
    created_at,
    updated_at
FROM productions 
WHERE id = 192;

-- 2. Production ID 192'nin plan bilgileri
SELECT 
    pp.id as plan_id,
    pp.order_id,
    pp.product_id,
    pp.product_name,
    pp.status as plan_status
FROM production_plans pp
WHERE pp.id = 196;

-- 3. Order ID 201'in durumu
SELECT 
    om.id,
    om.order_number,
    om.status as order_status,
    om.product_details
FROM order_management om
WHERE om.id = 201;

-- 4. Nihai ürün stoğu kontrolü
SELECT 
    id,
    ad,
    kod,
    barkod,
    miktar,
    aktif
FROM nihai_urunler 
WHERE id IN (1240, 1241);

-- 5. Stok hareketleri kontrolü
SELECT 
    id,
    urun_id,
    urun_tipi,
    hareket_tipi,
    miktar,
    referans_no,
    aciklama,
    tarih
FROM stok_hareketleri 
WHERE urun_id IN (1240, 1241)
ORDER BY tarih DESC
LIMIT 10;
