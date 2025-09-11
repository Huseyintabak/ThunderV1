-- Ürün Ağacı Kurulumu
-- Bu SQL komutlarını Supabase'de çalıştırın

-- Elektronik Kutu için ürün ağacı
INSERT INTO urun_agaci (ana_urun_id, ana_urun_tipi, alt_urun_id, alt_urun_tipi, gerekli_miktar, birim) VALUES
-- Elektronik Kutu -> Yarı Mamuller
(1, 'nihai', 1, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Çelik Kasa
(1, 'nihai', 2, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Alüminyum Çerçeve
(1, 'nihai', 3, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Plastik Kapak
-- Elektronik Kutu -> Hammaddeler
(1, 'nihai', 4, 'hammadde', 20, 'adet'), -- Elektronik Kutu -> Vida M6x20
(1, 'nihai', 5, 'hammadde', 4, 'adet'),  -- Elektronik Kutu -> Conta Kauçuk

-- Çelik Kasa için ürün ağacı
(1, 'yarimamul', 1, 'hammadde', 5, 'kg'), -- Çelik Kasa -> Çelik Levha
(1, 'yarimamul', 4, 'hammadde', 10, 'adet'), -- Çelik Kasa -> Vida M6x20

-- Alüminyum Çerçeve için ürün ağacı
(2, 'yarimamul', 2, 'hammadde', 2, 'metre'), -- Alüminyum Çerçeve -> Alüminyum Profil

-- Plastik Kapak için ürün ağacı
(3, 'yarimamul', 3, 'hammadde', 0.5, 'kg'); -- Plastik Kapak -> Plastik Granül

-- Endüstriyel Panel için ürün ağacı
INSERT INTO urun_agaci (ana_urun_id, ana_urun_tipi, alt_urun_id, alt_urun_tipi, gerekli_miktar, birim) VALUES
(2, 'nihai', 1, 'yarimamul', 2, 'adet'), -- Endüstriyel Panel -> Çelik Kasa (2 adet)
(2, 'nihai', 2, 'yarimamul', 1, 'adet'), -- Endüstriyel Panel -> Alüminyum Çerçeve
(2, 'nihai', 4, 'hammadde', 50, 'adet'), -- Endüstriyel Panel -> Vida M6x20
(2, 'nihai', 5, 'hammadde', 8, 'adet');  -- Endüstriyel Panel -> Conta Kauçuk

SELECT 'Ürün ağacı başarıyla oluşturuldu!' as mesaj;
