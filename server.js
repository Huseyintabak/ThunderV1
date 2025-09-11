const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Supabase client
let supabase = null;
if (config.SUPABASE_URL !== 'https://your-project.supabase.co' && config.SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    console.log('Supabase client created');
  } catch (error) {
    console.log('Supabase client creation failed, using mock data:', error.message);
    supabase = null;
  }
} else {
  console.log('Supabase credentials not configured, using mock data');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Geçici veri depolama
let hammaddeler = [
  {
    id: 1,
    ad: "TRPRO_BRAKET",
    kod: "TRPRO_BRAKET",
    miktar: 100,
    birim: "adet",
    birim_fiyat: 15.50,
    aciklama: "TRPRO Braket hammaddesi",
    kategori: "Metal",
    aktif: true,
    barkod: "8690000001001"
  },
  {
    id: 2,
    ad: "FLANŞLI SOMUN M6",
    kod: "FLANŞLI_SOMUN_M6",
    miktar: 1000,
    birim: "adet",
    birim_fiyat: 0.39,
    aciklama: "M6 Flanşlı Somun",
    kategori: "Bağlantı Elemanları",
    aktif: true,
    barkod: "8690000001002"
  },
  {
    id: 3,
    ad: "CIVATA 6X15",
    kod: "CIVATA_6X15",
    miktar: 500,
    birim: "adet",
    birim_fiyat: 0.36,
    aciklama: "M6X15 6KÖŞE Cıvata",
    kategori: "Bağlantı Elemanları",
    aktif: true,
    barkod: "8690000001003"
  }
];

let yarimamuller = [
  {
    id: 1,
    ad: "BR01_Braket_Kit18+",
    kod: "BR01_Braket_Kit18+",
    miktar: 50,
    birim: "adet",
    birim_fiyat: 25.00,
    aciklama: "BR01 Braket Kit 18+",
    kategori: "Yarı Mamul",
    aktif: true,
    barkod: "8690000002001"
  }
];

let nihaiUrunler = [
  {
    id: 1,
    ad: "Nihai Ürün 1",
    kod: "NIH_URUN_001",
    miktar: 10,
    birim: "adet",
    birim_fiyat: 100.00,
    aciklama: "Nihai ürün açıklaması",
    kategori: "Nihai Ürün",
    aktif: true,
    barkod: "8690000003001"
  }
];

let urunAgaci = [
  {
    id: 1,
    parent_id: null,
    child_id: 1,
    parent_type: "nihai",
    child_type: "yarimamul",
    quantity: 1,
    parent_code: "NIH_URUN_001",
    child_code: "BR01_Braket_Kit18+"
  }
];

// Hammadde API endpoints
app.get('/api/hammaddeler', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('hammaddeler')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase hammaddeler error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data || []);
    } else {
      res.json(hammaddeler);
    }
  } catch (error) {
    console.error('Hammaddeler API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hammaddeler', async (req, res) => {
  try {
    // Sadece hammadde tablosunda olan sütunları al
    const { alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...hammaddeData } = req.body;
    
    const hammadde = {
      id: Date.now(),
      ...hammaddeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('hammaddeler')
        .insert([hammadde])
        .select();

      if (error) {
        console.error('Supabase hammadde insert error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      hammaddeler.push(hammadde);
      res.json(hammadde);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/hammaddeler/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // CSV'den gelen boş timestamp alanlarını ve ürün ağacı sütunlarını filtrele
    const { created_at, updated_at, alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...cleanBody } = req.body;
    
    const updatedHammadde = {
      ...cleanBody,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('hammaddeler')
        .update(updatedHammadde)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase hammadde update error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      const index = hammaddeler.findIndex(h => h.id === id);
      if (index !== -1) {
        hammaddeler[index] = { ...hammaddeler[index], ...updatedHammadde };
        res.json(hammaddeler[index]);
      } else {
        res.status(404).json({ error: 'Hammadde bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hammaddeler/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      const { error } = await supabase
        .from('hammaddeler')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase hammadde delete error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ message: 'Hammadde silindi' });
    } else {
      const index = hammaddeler.findIndex(h => h.id === id);
      if (index !== -1) {
        hammaddeler.splice(index, 1);
        res.json({ message: 'Hammadde silindi' });
      } else {
        res.status(404).json({ error: 'Hammadde bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yarı Mamul API endpoints
app.get('/api/yarimamuller', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('yarimamuller')
        .select('*')
        .eq('aktif', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase yarimamuller error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data || []);
    } else {
      res.json(yarimamuller);
    }
  } catch (error) {
    console.error('Yarimamuller API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/yarimamuller', async (req, res) => {
  try {
    // Sadece yarı mamul tablosunda olan sütunları al
    const { alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...yarimamulData } = req.body;
    
    const yarimamul = {
      id: Date.now(),
      ...yarimamulData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('yarimamuller')
        .insert([yarimamul])
        .select();

      if (error) {
        console.error('Supabase yarimamul insert error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      yarimamuller.push(yarimamul);
      res.json(yarimamul);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/yarimamuller/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // CSV'den gelen boş timestamp alanlarını ve ürün ağacı sütunlarını filtrele
    const { created_at, updated_at, alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...cleanBody } = req.body;
    
    const updatedYarimamul = {
      ...cleanBody,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('yarimamuller')
        .update(updatedYarimamul)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase yarimamul update error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      const index = yarimamuller.findIndex(y => y.id === id);
      if (index !== -1) {
        yarimamuller[index] = { ...yarimamuller[index], ...updatedYarimamul };
        res.json(yarimamuller[index]);
      } else {
        res.status(404).json({ error: 'Yarı mamul bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/yarimamuller/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      const { error } = await supabase
        .from('yarimamuller')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase yarimamul delete error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ message: 'Yarı mamul silindi' });
    } else {
      const index = yarimamuller.findIndex(y => y.id === id);
      if (index !== -1) {
        yarimamuller.splice(index, 1);
        res.json({ message: 'Yarı mamul silindi' });
      } else {
        res.status(404).json({ error: 'Yarı mamul bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nihai Ürün API endpoints
app.get('/api/nihai_urunler', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .select('*')
        .eq('aktif', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase nihai_urunler error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data || []);
    } else {
      res.json(nihaiUrunler);
    }
  } catch (error) {
    console.error('Nihai urunler API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nihai_urunler', async (req, res) => {
  try {
    // Sadece nihai ürün tablosunda olan sütunları al
    const { alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...nihaiData } = req.body;
    
    const nihaiUrun = {
      id: Date.now(),
      ...nihaiData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .insert([nihaiUrun])
        .select();

      if (error) {
        console.error('Supabase nihai_urun insert error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      nihaiUrunler.push(nihaiUrun);
      res.json(nihaiUrun);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/nihai_urunler/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // CSV'den gelen boş timestamp alanlarını ve ürün ağacı sütunlarını filtrele
    const { created_at, updated_at, alt_urun_id, ana_urun_id, ana_urun_tipi, alt_urun_tipi, gerekli_miktar, ...cleanBody } = req.body;
    
    const updatedNihaiUrun = {
      ...cleanBody,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .update(updatedNihaiUrun)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase nihai_urun update error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      const index = nihaiUrunler.findIndex(n => n.id === id);
      if (index !== -1) {
        nihaiUrunler[index] = { ...nihaiUrunler[index], ...updatedNihaiUrun };
        res.json(nihaiUrunler[index]);
      } else {
        res.status(404).json({ error: 'Nihai ürün bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/nihai_urunler/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      const { error } = await supabase
        .from('nihai_urunler')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase nihai_urun delete error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ message: 'Nihai ürün silindi' });
    } else {
      const index = nihaiUrunler.findIndex(n => n.id === id);
      if (index !== -1) {
        nihaiUrunler.splice(index, 1);
        res.json({ message: 'Nihai ürün silindi' });
      } else {
        res.status(404).json({ error: 'Nihai ürün bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ürün Ağacı API endpoints
app.get('/api/urun_agaci', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('urun_agaci')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase urun_agaci error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data || []);
    } else {
      res.json(urunAgaci);
    }
  } catch (error) {
    console.error('Urun agaci API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/urun_agaci', async (req, res) => {
  try {
    // Eğer ID verilmişse, önce mevcut kaydı kontrol et
    if (req.body.id) {
      const { data: existingData, error: checkError } = await supabase
        .from('urun_agaci')
        .select('id')
        .eq('id', req.body.id)
        .single();
      
      if (existingData) {
        // Kayıt varsa, güncelleme yap
        const updatedUrunAgaciItem = {
          ana_urun_id: Number(req.body.ana_urun_id) || 0,
          alt_urun_id: Number(req.body.alt_urun_id) || 0,
          ana_urun_tipi: req.body.ana_urun_tipi,
          alt_urun_tipi: req.body.alt_urun_tipi,
          gerekli_miktar: Number(req.body.gerekli_miktar) || 0,
          birim: req.body.birim,
          maliyet_orani: Number(req.body.maliyet_orani) || 0,
          sira_no: Number(req.body.sira_no) || 0,
          aktif: req.body.aktif === 'TRUE' || req.body.aktif === true,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('urun_agaci')
          .update(updatedUrunAgaciItem)
          .eq('id', req.body.id)
          .select();

        if (error) {
          console.error('Supabase urun_agaci update error:', error);
          res.status(500).json({ error: error.message });
          return;
        }

        res.json(data[0]);
        return;
      }
    }

    // Yeni kayıt oluştur
    const urunAgaciItem = {
      id: req.body.id || Date.now(), // CSV'den gelen ID'yi kullan, yoksa yeni üret
      ana_urun_id: Number(req.body.ana_urun_id) || 0,
      alt_urun_id: Number(req.body.alt_urun_id) || 0,
      ana_urun_tipi: req.body.ana_urun_tipi,
      alt_urun_tipi: req.body.alt_urun_tipi,
      gerekli_miktar: Number(req.body.gerekli_miktar) || 0,
      birim: req.body.birim,
      maliyet_orani: Number(req.body.maliyet_orani) || 0,
      sira_no: Number(req.body.sira_no) || 0,
      aktif: req.body.aktif === 'TRUE' || req.body.aktif === true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('urun_agaci')
        .insert([urunAgaciItem])
        .select();

      if (error) {
        console.error('Supabase urun_agaci insert error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data[0]);
    } else {
      urunAgaci.push(urunAgaciItem);
      res.json(urunAgaciItem);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/urun_agaci/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // CSV'den gelen boş timestamp alanlarını filtrele
    const { created_at, updated_at, ...cleanBody } = req.body;
    
    // ID alanlarını integer'a çevir
    const updatedUrunAgaciItem = {
      ...cleanBody,
      ana_urun_id: Number(cleanBody.ana_urun_id) || 0,
      alt_urun_id: Number(cleanBody.alt_urun_id) || 0,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('urun_agaci')
        .update(updatedUrunAgaciItem)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase urun_agaci update error:', error);
        if (error.code === '23505') {
          res.status(409).json({ error: 'Bu ürün ağacı kombinasyonu zaten mevcut' });
        } else {
          res.status(500).json({ error: error.message });
        }
        return;
      }

      res.json(data[0]);
    } else {
      const index = urunAgaci.findIndex(u => u.id === id);
      if (index !== -1) {
        urunAgaci[index] = { ...urunAgaci[index], ...updatedUrunAgaciItem };
        res.json(urunAgaci[index]);
      } else {
        res.status(404).json({ error: 'Ürün ağacı öğesi bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/urun_agaci/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      const { error } = await supabase
        .from('urun_agaci')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase urun_agaci delete error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ message: 'Ürün ağacı öğesi silindi' });
    } else {
      const index = urunAgaci.findIndex(u => u.id === id);
      if (index !== -1) {
        urunAgaci.splice(index, 1);
        res.json({ message: 'Ürün ağacı öğesi silindi' });
      } else {
        res.status(404).json({ error: 'Ürün ağacı öğesi bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BOM Maliyet Hesaplama
app.post('/api/calculate-bom-cost', async (req, res) => {
  try {
    const { productType, productId, quantity } = req.body;
    
    // Basit maliyet hesaplama
    let totalCost = 0;
    
    if (productType === 'yarimamul') {
      const product = yarimamuller.find(p => p.id === productId);
      if (product) {
        totalCost = product.birim_fiyat * quantity;
      }
    } else if (productType === 'nihai') {
      const product = nihaiUrunler.find(p => p.id === productId);
      if (product) {
        totalCost = product.birim_fiyat * quantity;
      }
    }
    
    res.json({ totalCost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock data reset
app.post('/api/reset-mock-data', async (req, res) => {
  try {
    // Reset mock data to initial state
    hammaddeler = [
      {
        id: 1,
        ad: "TRPRO_BRAKET",
        kod: "TRPRO_BRAKET",
        miktar: 100,
        birim: "adet",
        birim_fiyat: 15.50,
        aciklama: "TRPRO Braket hammaddesi",
        kategori: "Metal",
        aktif: true,
        barkod: "8690000001001"
      }
    ];
    
    yarimamuller = [
      {
        id: 1,
        ad: "BR01_Braket_Kit18+",
        kod: "BR01_Braket_Kit18+",
        miktar: 50,
        birim: "adet",
        birim_fiyat: 25.00,
        aciklama: "BR01 Braket Kit 18+",
        kategori: "Yarı Mamul",
        aktif: true,
        barkod: "8690000002001"
      }
    ];
    
    nihaiUrunler = [
      {
        id: 1,
        ad: "Nihai Ürün 1",
        kod: "NIH_URUN_001",
        miktar: 10,
        birim: "adet",
        birim_fiyat: 100.00,
        aciklama: "Nihai ürün açıklaması",
        kategori: "Nihai Ürün",
        aktif: true,
        barkod: "8690000003001"
      }
    ];
    
    res.json({ message: 'Mock data reset edildi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PERFORMANS OPTİMİZASYONU - FAZ 5
// ========================================

// Basit cache sistemi
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

function getCached(key) {
    const item = cache.get(key);
    if (item && Date.now() - item.timestamp < CACHE_TTL) {
        return item.data;
    }
    cache.delete(key);
    return null;
}

function setCached(key, data) {
    cache.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

// Rate limiting (basit)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 100; // dakikada maksimum 100 istek

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || [];
    
    // Eski istekleri temizle
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    return true;
}

// ========================================
// YENİ API ENDPOINT'LERİ - FAZ 1
// ========================================

// Üretim Yönetimi API'leri
app.post('/api/productions', async (req, res) => {
    try {
        const { product_id, product_type, quantity, target_quantity, created_by, notes } = req.body;
        
        // Önce tabloların var olup olmadığını kontrol et
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .insert([{
                product_id,
                product_type,
                quantity,
                target_quantity,
                created_by: created_by || 'system',
                notes
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/productions/active', async (req, res) => {
    try {
        // Rate limiting kontrolü
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({ error: 'Çok fazla istek. Lütfen bekleyin.' });
        }
        
        // Cache kontrolü
        const cacheKey = 'active_productions';
        const cachedData = getCached(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .select('*')
            .eq('status', 'active')
            .order('start_time', { ascending: false });
            
        if (error) throw error;
        
        // Cache'e kaydet
        setCached(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error('Active productions fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/productions/history', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .select('*')
            .order('start_time', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Production history fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/productions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production update error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productions/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .update({
                status: 'completed',
                end_time: new Date().toISOString(),
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production completion error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// BARKOD YÖNETİMİ API'LERİ - FAZ 2
// ========================================

// Barkod Yönetimi API'leri
app.post('/api/barcodes/scan', async (req, res) => {
    try {
        const { production_id, barcode, operator } = req.body;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Barkod doğrulama (basit)
        const isValid = barcode && barcode.length >= 8;
        
        const { data, error } = await supabase
            .from('barcode_scans')
            .insert([{
                production_id,
                barcode,
                success: isValid,
                operator: operator || 'system'
            }])
            .select();
            
        if (error) throw error;
        res.json({
            ...data[0],
            message: isValid ? 'Barkod başarıyla okutuldu' : 'Geçersiz barkod'
        });
    } catch (error) {
        console.error('Barcode scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/barcodes/history/:productionId', async (req, res) => {
    try {
        const { productionId } = req.params;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('barcode_scans')
            .select('*')
            .eq('production_id', productionId)
            .order('scan_time', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Barcode history fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/barcodes/validate', async (req, res) => {
    try {
        const { barcode, product_id, product_type } = req.body;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Ürün barkodunu kontrol et
        let product;
        if (product_type === 'yarimamul') {
            const { data } = await supabase
                .from('yarimamuller')
                .select('barkod')
                .eq('id', product_id)
                .single();
            product = data;
        } else if (product_type === 'nihai') {
            const { data } = await supabase
                .from('nihai_urunler')
                .select('barkod')
                .eq('id', product_id)
                .single();
            product = data;
        }
        
        const isValid = product && product.barkod === barcode;
        
        res.json({
            valid: isValid,
            message: isValid ? 'Barkod doğru' : 'Barkod eşleşmiyor'
        });
    } catch (error) {
        console.error('Barcode validation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// RAPORLAMA API'LERİ - FAZ 3
// ========================================

// Raporlama API'leri
app.get('/api/reports/production-summary', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        let query = supabase
            .from('productions')
            .select('*');
            
        if (start_date) {
            query = query.gte('start_time', start_date);
        }
        if (end_date) {
            query = query.lte('start_time', end_date);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // İstatistikleri hesapla
        const summary = {
            total_productions: data.length,
            completed: data.filter(p => p.status === 'completed').length,
            active: data.filter(p => p.status === 'active').length,
            cancelled: data.filter(p => p.status === 'cancelled').length,
            total_quantity: data.reduce((sum, p) => sum + p.quantity, 0),
            total_target: data.reduce((sum, p) => sum + p.target_quantity, 0),
            efficiency: data.length > 0 ? 
                (data.filter(p => p.status === 'completed').length / data.length * 100).toFixed(2) : 0,
            completion_rate: data.length > 0 ? 
                (data.filter(p => p.status === 'completed').length / data.length * 100).toFixed(2) : 0,
            average_quantity: data.length > 0 ? 
                (data.reduce((sum, p) => sum + p.quantity, 0) / data.length).toFixed(2) : 0
        };
        
        res.json(summary);
    } catch (error) {
        console.error('Production summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/material-usage', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Son 30 günlük veri
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const { data: productions, error: prodError } = await supabase
            .from('productions')
            .select('*')
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString());
            
        if (prodError) throw prodError;
        
        // Malzeme kullanımını hesapla
        const materialUsage = {};
        let totalMaterialCost = 0;
        
        productions.forEach(production => {
            // Basit malzeme kullanım hesaplama
            if (production.product_type === 'yarimamul') {
                materialUsage[`yarimamul_${production.product_id}`] = 
                    (materialUsage[`yarimamul_${production.product_id}`] || 0) + production.quantity;
            } else if (production.product_type === 'nihai') {
                materialUsage[`nihai_${production.product_id}`] = 
                    (materialUsage[`nihai_${production.product_id}`] || 0) + production.quantity;
            }
            
            // Basit maliyet hesaplama (örnek)
            totalMaterialCost += production.quantity * 10; // Her ürün için 10 TL maliyet varsayımı
        });
        
        res.json({
            period,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            total_productions: productions.length,
            material_usage: materialUsage,
            total_material_cost: totalMaterialCost,
            average_daily_production: (productions.length / 30).toFixed(2)
        });
    } catch (error) {
        console.error('Material usage report error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/efficiency', async (req, res) => {
    try {
        const { production_id } = req.query;
        
        if (!production_id) {
            return res.status(400).json({ error: 'Production ID gerekli' });
        }
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Üretim detaylarını al
        const { data: production, error: prodError } = await supabase
            .from('productions')
            .select('*')
            .eq('id', production_id)
            .single();
            
        if (prodError) throw prodError;
        
        // Barkod taramalarını al
        const { data: scans, error: scanError } = await supabase
            .from('barcode_scans')
            .select('*')
            .eq('production_id', production_id);
            
        if (scanError) throw scanError;
        
        // Verimlilik hesapla
        const totalScans = scans.length;
        const successfulScans = scans.filter(s => s.success).length;
        const efficiency = totalScans > 0 ? (successfulScans / totalScans * 100).toFixed(2) : 0;
        
        // Zaman hesaplamaları
        const startTime = new Date(production.start_time);
        const endTime = production.end_time ? new Date(production.end_time) : new Date();
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
        
        // Üretim hızı (dakikada üretilen ürün sayısı)
        const productionRate = durationMinutes > 0 ? (production.quantity / durationMinutes).toFixed(2) : 0;
        
        res.json({
            production_id: parseInt(production_id),
            total_scans: totalScans,
            successful_scans: successfulScans,
            failed_scans: totalScans - successfulScans,
            efficiency: parseFloat(efficiency),
            production_status: production.status,
            target_quantity: production.target_quantity,
            actual_quantity: production.quantity,
            completion_percentage: production.target_quantity > 0 ? 
                ((production.quantity / production.target_quantity) * 100).toFixed(2) : 0,
            duration_minutes: durationMinutes,
            production_rate: parseFloat(productionRate),
            start_time: production.start_time,
            end_time: production.end_time,
            created_by: production.created_by
        });
    } catch (error) {
        console.error('Efficiency report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Server başlatma
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
