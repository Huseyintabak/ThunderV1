INSERT INTO resource_management (resource_name, resource_type, capacity, cost_per_hour, skills_required, is_active, location, notes) VALUES
('Ahmet Yılmaz', 'operator', 8, 25.00, ARRAY['operatör', 'teknisyen'], true, 'Üretim Hattı 1', 'Thunder serisi ürünlerde uzman'),
('Mehmet Kaya', 'operator', 8, 30.00, ARRAY['operatör', 'kalite kontrol'], true, 'Üretim Hattı 2', 'ThunderPRO serisi ürünlerde uzman'),
('Ayşe Demir', 'operator', 6, 22.00, ARRAY['operatör'], true, 'Üretim Hattı 1', 'Yeni operatör, eğitim aşamasında'),
('Fatma Özkan', 'operator', 8, 28.00, ARRAY['operatör', 'teknisyen', 'kalite kontrol'], true, 'Üretim Hattı 2', 'Kıdemli operatör, tüm süreçlerde deneyimli'),
('Ali Çelik', 'operator', 8, 26.00, ARRAY['operatör'], true, 'Üretim Hattı 3', 'Montaj işlemlerinde uzman');
