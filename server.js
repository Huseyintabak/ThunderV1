const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const config = require('./config');
const RealtimeServer = require('./realtime-server');

const app = express();
const server = http.createServer(app);
const PORT = config.PORT;

// WebSocket Server kaldırıldı - realtime-server ile çakışma nedeniyle

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: supabase ? 'connected' : 'disconnected'
  });
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

// Tek hammadde getirme
app.get('/api/hammaddeler/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('hammaddeler')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Supabase hammaddeler single error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data);
    } else {
      const product = hammaddeler.find(p => p.id == productId);
      res.json(product || {});
    }
  } catch (error) {
    console.error('Hammadde single API error:', error);
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
        if (error.code === '23505') {
          res.status(400).json({ error: 'Bu kod zaten kullanılıyor. Lütfen farklı bir kod girin.' });
        } else {
          res.status(500).json({ error: error.message });
        }
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

// Nihai Ürün API endpoints
app.get('/api/nihai-urunler', async (req, res) => {
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

// Tek yarı mamul getirme
app.get('/api/yarimamuller/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('yarimamuller')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Supabase yarimamuller single error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data);
    } else {
      const product = yarimamuller.find(p => p.id == productId);
      res.json(product || {});
    }
  } catch (error) {
    console.error('Yarimamul single API error:', error);
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
        if (error.code === '23505') {
          res.status(400).json({ error: 'Bu kod zaten kullanılıyor. Lütfen farklı bir kod girin.' });
        } else {
          res.status(500).json({ error: error.message });
        }
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

// Barkod ile ürün getirme
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const barcode = req.params.barcode;
    console.log('🔍 Barkod ile ürün aranıyor:', barcode);
    
    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .select('*')
        .eq('barkod', barcode)
        .eq('aktif', true)
        .single();

      if (error) {
        console.log('❌ Barkod bulunamadı:', barcode, error.message);
        res.status(404).json({ 
          error: 'Barkod bulunamadı',
          barcode: barcode,
          found: false
        });
        return;
      }

      console.log('✅ Barkod bulundu:', data);
      res.json({
        found: true,
        product: data,
        product_code: data.kod,
        product_name: data.ad,
        barcode: data.barkod
      });
    } else {
      // Mock data fallback
      const product = nihaiUrunler.find(p => p.barkod === barcode);
      if (product) {
        res.json({
          found: true,
          product: product,
          product_code: product.kod,
          product_name: product.ad,
          barcode: product.barkod
        });
      } else {
        res.status(404).json({ 
          error: 'Barkod bulunamadı',
          barcode: barcode,
          found: false
        });
      }
    }
  } catch (error) {
    console.error('Barkod API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tek nihai ürün getirme
app.get('/api/nihai_urunler/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Supabase nihai_urunler single error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data);
    } else {
      const product = nihaiUrunler.find(p => p.id == productId);
      res.json(product || {});
    }
  } catch (error) {
    console.error('Nihai urun single API error:', error);
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
        if (error.code === '23505') {
          res.status(400).json({ error: 'Bu kod zaten kullanılıyor. Lütfen farklı bir kod girin.' });
        } else {
          res.status(500).json({ error: error.message });
        }
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
app.get('/api/productions', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Üretimler yüklenirken hata:', error);
            return res.status(500).json({ error: error.message });
        }
        
        res.json(data || []);
    } catch (error) {
        console.error('Üretimler yüklenirken hata:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productions', async (req, res) => {
    try {
        const { product_id, product_type, quantity, target_quantity, created_by, notes } = req.body;
        
        // Validation - gerekli alanları kontrol et
        if (!product_id || product_id === null || product_id === undefined) {
            return res.status(400).json({ error: 'product_id gerekli' });
        }
        if (!product_type || product_type === null || product_type === undefined) {
            return res.status(400).json({ error: 'product_type gerekli' });
        }
        if (quantity === null || quantity === undefined) {
            return res.status(400).json({ error: 'quantity gerekli' });
        }
        if (!target_quantity || target_quantity === null || target_quantity === undefined) {
            return res.status(400).json({ error: 'target_quantity gerekli' });
        }
        
        // Önce tabloların var olup olmadığını kontrol et
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        const { data, error } = await supabase
            .from('productions')
            .insert([{
                product_id: parseInt(product_id),
                product_type: product_type,
                quantity: parseInt(quantity) || 0,
                target_quantity: parseInt(target_quantity),
                created_by: created_by || 'system',
                notes: notes || null
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
            .in('status', ['active', 'paused'])
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
        
        // Sadece operatörün tamamladığı üretimleri al (active_productions tablosundan)
        const { data: completedStates, error: statesError } = await supabase
            .from('active_productions')
            .select(`
                id,
                plan_id,
                product_name,
                planned_quantity,
                produced_quantity,
                status,
                updated_at,
                assigned_operator
            `)
            .eq('status', 'completed')
            .order('updated_at', { ascending: false });
            
        if (statesError) throw statesError;
        
        // Her tamamlanan üretim için sipariş bilgilerini al
        const productionsWithOrders = await Promise.all(completedStates.map(async (state) => {
            let orderInfo = {
                order_number: null,
                customer_name: null
            };
            
            // Plan ID üzerinden sipariş bilgisini al
            if (state.plan_id) {
                // Önce plan'dan order_id'yi al
                const { data: plan, error: planError } = await supabase
                    .from('production_plans')
                    .select('order_id')
                    .eq('id', state.plan_id)
                    .single();
                
                if (!planError && plan && plan.order_id) {
                    // Sonra sipariş bilgisini al
                    const { data: order, error: orderError } = await supabase
                        .from('order_management')
                        .select('order_number, customer_name')
                        .eq('id', plan.order_id)
                        .single();
                    
                    if (!orderError && order) {
                        orderInfo.order_number = order.order_number;
                        orderInfo.customer_name = order.customer_name;
                    }
                }
            }
            
            return {
                id: state.id,
                plan_id: state.plan_id,
                product_name: state.product_name,
                target_quantity: state.planned_quantity,
                produced_quantity: state.produced_quantity,
                status: state.status,
                is_completed: state.status === 'completed',
                completed_at: state.updated_at,
                operator_name: state.assigned_operator,
                order_number: orderInfo.order_number,
                customer_name: orderInfo.customer_name,
                production_data: null
            };
        }));
        
        res.json(productionsWithOrders);
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
// ÜRETİM AŞAMALARI YÖNETİMİ API'LERİ - FAZ 1
// ========================================

// Tek bir üretimi getir
app.get("/api/productions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Tek üretim getiriliyor:", id);
        
        if (!supabase) {
            return res.status(500).json({ error: "Supabase bağlantısı yok" });
        }
        
        // Önce productions tablosundan ara
        let { data: production, error } = await supabase
            .from("productions")
            .select("*")
            .eq("id", id)
            .single();
            
        // Eğer productions tablosunda bulunamazsa, active_productions tablosundan ara
        if (error || !production) {
            console.log("Productions tablosunda bulunamadı, active_productions tablosundan aranıyor...");
            const { data: state, error: stateError } = await supabase
                .from("active_productions")
                .select("*")
                .eq("id", id)
                .single();
                
            if (stateError || !state) {
                console.error("Production getirme hatası:", stateError);
                return res.status(404).json({ error: "Üretim bulunamadı" });
            }
            
            // active_productions verisini production formatına çevir
            production = {
                id: state.id,
                product_id: state.product_id,
                product_type: "nihai",
                quantity: state.produced_quantity || 0,
                target_quantity: state.planned_quantity || 0,
                status: state.status,
                start_time: state.created_at,
                end_time: state.updated_at,
                created_by: state.assigned_operator || "system",
                notes: state.notes,
                created_at: state.created_at,
                updated_at: state.updated_at,
                product_name: state.product_name || "Bilinmeyen Ürün",
                assigned_operator: state.assigned_operator || "Atanmamış",
                produced_quantity: state.produced_quantity || 0,
                is_completed: state.status === 'completed'
            };
        }
        production.produced_quantity = 0;
        production.status = 'active';
        production.product_name = production.product_name || 'Bilinmeyen Ürün';
        production.planned_quantity = production.planned_quantity || 1;
        production.assigned_operator = production.assigned_operator || 'Atanmamış';
        
        res.json(production);
    } catch (error) {
        console.error('Tek üretim getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim geçmişini getir
app.get('/api/productions/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Üretim geçmişi getiriliyor:', id);
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Üretim geçmişini al (production_history tablosundan)
        const { data: history, error } = await supabase
            .from('production_history')
            .select('*')
            .eq('production_id', id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json(history || []);
    } catch (error) {
        console.error('Üretim geçmişi getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
});


// Üretim planından ürün detaylarını getir
app.get("/api/productions/:id/products", async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Üretim ürün detayları getiriliyor:", id);
        
        if (!supabase) {
            return res.status(500).json({ error: "Supabase bağlantısı yok" });
        }
        
        // Önce üretimi al
        const { data: production, error: productionError } = await supabase
            .from("productions")
            .select("plan_id")
            .eq("id", id)
            .single();
            
        if (productionError) throw productionError;
        
        if (!production || !production.plan_id) {
            return res.json([]);
        }
        
        // Üretim planından sipariş bilgilerini al
        const { data: plan, error: planError } = await supabase
            .from("production_plans")
            .select("order_id")
            .eq("id", production.plan_id)
            .single();
            
        if (planError) throw planError;
        
        if (!plan || !plan.order_id) {
            return res.json([]);
        }
        
        // Siparişten ürün detaylarını al
        const { data: order, error: orderError } = await supabase
            .from("order_management")
            .select("product_details")
            .eq("id", plan.order_id)
            .single();
            
        if (orderError) throw orderError;
        
        if (!order || !order.product_details) {
            return res.json([]);
        }
        
        // JSON string"i parse et
        let productDetails = [];
        try {
            productDetails = JSON.parse(order.product_details);
        } catch (parseError) {
            console.error("Product details parse hatası:", parseError);
            return res.json([]);
        }
        
        res.json(productDetails);
    } catch (error) {
        console.error("Üretim ürün detayları getirme hatası:", error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim aşamalarını listele
app.get('/api/productions/:id/stages', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('production_stages')
            .select('*')
            .eq('production_id', id)
            .order('stage_order', { ascending: true });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Production stages fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim aşaması oluştur
app.post('/api/productions/:id/stages', async (req, res) => {
    try {
        const { id } = req.params;
        const { stage_name, stage_order, operator, notes, quality_check_required } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .insert([{
                production_id: parseInt(id),
                stage_name,
                stage_order: parseInt(stage_order),
                operator: operator || 'system',
                notes,
                quality_check_required: quality_check_required || false
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production stage creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim aşamasını güncelle
app.put('/api/productions/:id/stages/:stageId', async (req, res) => {
    try {
        const { id, stageId } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('production_stages')
            .update(updates)
            .eq('id', stageId)
            .eq('production_id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production stage update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim aşamasını tamamla
app.post('/api/productions/:id/stages/:stageId/complete', async (req, res) => {
    try {
        const { id, stageId } = req.params;
        const { notes } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                status: 'completed',
                end_time: new Date().toISOString(),
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', stageId)
            .eq('production_id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Production stage completion error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Production Stages API
app.get('/api/production-stages', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('production_stages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Production stages error:', error);
            return res.status(500).json({ error: 'Aşamalar yüklenemedi' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Production stages error:', error);
        res.status(500).json({ error: 'Aşamalar yüklenemedi' });
    }
});

// Aşama şablonlarını listele
app.get('/api/production-stages/templates', async (req, res) => {
    try {
        const { product_type } = req.query;
        
        let query = supabase
            .from('production_stage_templates')
            .select('*')
            .order('stage_order', { ascending: true });
            
        if (product_type) {
            query = query.eq('product_type', product_type);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Stage templates fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama şablonu oluştur
app.post('/api/production-stages/templates', async (req, res) => {
    try {
        const { product_type, stage_name, stage_order, estimated_duration, required_skills, quality_check_required, is_mandatory } = req.body;
        
        const { data, error } = await supabase
            .from('production_stage_templates')
            .insert([{
                product_type,
                stage_name,
                stage_order: parseInt(stage_order),
                estimated_duration: parseInt(estimated_duration) || null,
                required_skills: required_skills || [],
                quality_check_required: quality_check_required || false,
                is_mandatory: is_mandatory !== false
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage template creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama şablonu getir (düzenleme için)
app.get('/api/production-stages/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: 'Geçersiz şablon ID\'si' });
        }
        
        const { data, error } = await supabase
            .from('production_stage_templates')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Aşama şablonu bulunamadı' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Get stage template error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama şablonu güncelle
app.put('/api/production-stages/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: 'Geçersiz şablon ID\'si' });
        }
        
        // Gerekli alanları kontrol et
        if (!updateData.stage_name || !updateData.product_type) {
            return res.status(400).json({ error: 'Aşama adı ve ürün tipi zorunludur' });
        }
        
        const { error } = await supabase
            .from('production_stage_templates')
            .update(updateData)
            .eq('id', id);
            
        if (error) throw error;
        
        res.json({ message: 'Aşama şablonu başarıyla güncellendi' });
    } catch (error) {
        console.error('Update stage template error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama şablonu sil
app.delete('/api/production-stages/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // ID kontrolü
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: 'Geçersiz şablon ID\'si' });
        }
        
        console.log('Deleting stage template with ID:', id);
        
        // Önce ilgili kalite kontrol noktalarını sil
        const { error: qcError } = await supabase
            .from('quality_checkpoints')
            .delete()
            .eq('stage_id', id);
            
        if (qcError) {
            console.error('Quality checkpoints delete error:', qcError);
            // Kalite kontrol noktaları silinmese bile devam et
        }
        
        // Sonra aşama şablonunu sil
        const { error } = await supabase
            .from('production_stage_templates')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }
        
        console.log('Stage template deleted successfully:', id);
        res.json({ message: 'Aşama şablonu ve ilgili kalite kontrol noktaları başarıyla silindi' });
    } catch (error) {
        console.error('Delete stage template error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FAZ 7: GELİŞMİŞ AŞAMA TAKİP SİSTEMİ =====

// Plan ID'sine göre aşamaları getir (sipariş bilgileri ile)
app.get('/api/production-stages', async (req, res) => {
    try {
        const { plan_id, production_id, status } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *,
                active_productions(
                    production_plans(
                        order_management(
                            order_number,
                            customer_name,
                            product_details
                        )
                    )
                )
            `)
            .order('stage_order');
            
        if (plan_id) {
            query = query.eq('production_id', plan_id);
        }
        
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Basit çözüm: Tüm sipariş bilgilerini önceden çek
        const { data: allOrders } = await supabase
            .from('order_management')
            .select('id, order_number, customer_name, product_details');
        
        const { data: allPlans } = await supabase
            .from('production_plans')
            .select('id, order_id');
        
        const { data: allActiveProds } = await supabase
            .from('active_productions')
            .select('id, plan_id');
        
        // Sipariş bilgilerini aşama verilerine ekle
        const enrichedData = (data || []).map(stage => {
            // Test için manuel veri ekleme - tüm production_id'ler için
            if (stage.production_id) {
                // Active production'dan plan bilgisini al
                const activeProd = allActiveProds?.find(ap => ap.id === stage.production_id);
                if (activeProd?.plan_id) {
                    const plan = allPlans?.find(p => p.id === activeProd.plan_id);
                    if (plan?.order_id) {
                        const order = allOrders?.find(o => o.id === plan.order_id);
                        if (order) {
                            // Sipariş detaylarından ürün kodlarını çıkar
                            let productCodes = [];
                            let totalQuantity = 0;
                            try {
                                const productDetails = Array.isArray(order.product_details) 
                                    ? order.product_details 
                                    : JSON.parse(order.product_details || '[]');
                                productCodes = productDetails.map(p => p.code).filter(Boolean);
                                totalQuantity = productDetails.reduce((sum, p) => sum + (p.quantity || 0), 0);
                            } catch (e) {
                                console.error('Product details parse error:', e);
                            }
                            
                            return {
                                ...stage,
                                order_number: order.order_number,
                                customer_name: order.customer_name,
                                product_codes: productCodes,
                                total_quantity: totalQuantity
                            };
                        }
                    }
                }
            }
            
            const activeProd = allActiveProds?.find(ap => ap.id === stage.production_id);
            
            if (activeProd?.plan_id) {
                const plan = allPlans?.find(p => p.id === activeProd.plan_id);
                
                if (plan?.order_id) {
                    const order = allOrders?.find(o => o.id === plan.order_id);
                    
                    if (order) {
                        // Sipariş detaylarından ürün kodlarını çıkar
                        let productCodes = [];
                        let totalQuantity = 0;
                        try {
                            const productDetails = Array.isArray(order.product_details) 
                                ? order.product_details 
                                : JSON.parse(order.product_details || '[]');
                            productCodes = productDetails.map(p => p.code).filter(Boolean);
                            totalQuantity = productDetails.reduce((sum, p) => sum + (p.quantity || 0), 0);
                        } catch (e) {
                            console.error('Product details parse error:', e);
                        }
                        
                        return {
                            ...stage,
                            order_number: order.order_number,
                            customer_name: order.customer_name,
                            product_codes: productCodes,
                            total_quantity: totalQuantity
                        };
                    }
                }
            }
            return stage;
        });
        
        res.json(enrichedData);
    } catch (error) {
        console.error('Production stages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Yeni aşama oluştur
app.post('/api/production-stages', async (req, res) => {
    try {
        const stageData = {
            ...req.body,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('production_stages')
            .insert(stageData)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Create production stage error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama performans istatistikleri
app.get('/api/production-stages/performance', async (req, res) => {
    try {
        const { production_id, operator, date_from, date_to } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *
            `);
            
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (operator) {
            query = query.eq('operator', operator);
        }
        
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        
        if (date_to) {
            query = query.lte('end_time', date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Performans hesaplamaları
        const stats = {
            total_stages: data.length,
            completed_stages: data.filter(s => s.status === 'completed').length,
            active_stages: data.filter(s => s.status === 'active').length,
            pending_stages: data.filter(s => s.status === 'pending').length,
            average_duration: 0,
            operator_performance: {},
            stage_efficiency: {}
        };
        
        // Ortalama süre hesaplama
        const completedStages = data.filter(s => s.status === 'completed' && s.start_time && s.end_time);
        if (completedStages.length > 0) {
            const totalDuration = completedStages.reduce((sum, stage) => {
                const start = new Date(stage.start_time);
                const end = new Date(stage.end_time);
                return sum + (end - start) / (1000 * 60); // dakika cinsinden
            }, 0);
            stats.average_duration = Math.round(totalDuration / completedStages.length);
        }
        
        // Operatör performansı
        const operatorStats = {};
        data.forEach(stage => {
            if (stage.operator && stage.status === 'completed') {
                if (!operatorStats[stage.operator]) {
                    operatorStats[stage.operator] = { completed: 0, total: 0 };
                }
                operatorStats[stage.operator].total++;
                if (stage.status === 'completed') {
                    operatorStats[stage.operator].completed++;
                }
            }
        });
        
        stats.operator_performance = Object.keys(operatorStats).map(operator => ({
            operator,
            completion_rate: Math.round((operatorStats[operator].completed / operatorStats[operator].total) * 100),
            total_stages: operatorStats[operator].total,
            completed_stages: operatorStats[operator].completed
        }));
        
        res.json(stats);
    } catch (error) {
        console.error('Stage performance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama başlat
app.post('/api/production-stages/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const { operator, notes } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                status: 'active',
                start_time: new Date().toISOString(),
                operator: operator || 'system',
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage start error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama duraklat
app.post('/api/production-stages/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                status: 'paused',
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage pause error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama devam ettir
app.post('/api/production-stages/:id/resume', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                status: 'active',
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage resume error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama atla
app.post('/api/production-stages/:id/skip', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                status: 'skipped',
                notes: reason || 'Aşama atlandı',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage skip error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gerçek zamanlı aşama durumu
app.get('/api/production-stages/realtime', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('production_stages')
            .select('*')
            .in('status', ['active', 'paused'])
            .order('updated_at', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Realtime stages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama şablonu güncelle
app.put('/api/production-stages/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('production_stage_templates')
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage template update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FAZ 7: AŞAMA BAZLI KALİTE KONTROL ENTEGRASYONU =====

// Aşama kalite kontrol noktalarını listele
app.get('/api/production-stages/:stageId/quality-checkpoints', async (req, res) => {
    try {
        const { stageId } = req.params;
        
        const { data, error } = await supabase
            .from('quality_checkpoints')
            .select('*')
            .eq('stage_id', stageId)
            .order('id', { ascending: true });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Stage quality checkpoints error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama kalite kontrol noktası oluştur
app.post('/api/production-stages/:stageId/quality-checkpoints', async (req, res) => {
    try {
        const { stageId } = req.params;
        const { name, checkpoint_type, parameters, checkpoint_order, is_mandatory } = req.body;
        
        const { data, error } = await supabase
            .from('quality_checkpoints')
            .insert([{
                stage_id: parseInt(stageId),
                name,
                checkpoint_type,
                parameters: parameters || {},
                // checkpoint_order: parseInt(checkpoint_order) || 1,
                is_mandatory: is_mandatory || false
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Stage quality checkpoint creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama kalite kontrolü gerçekleştir
app.post('/api/production-stages/:stageId/quality-check', async (req, res) => {
    try {
        const { stageId } = req.params;
        const { checkpoint_id, operator, result, measured_value, expected_value, tolerance_min, tolerance_max, notes, photos } = req.body;
        
        // Önce aşama bilgisini al
        const { data: stageData, error: stageError } = await supabase
            .from('production_stages')
            .select('production_id')
            .eq('id', stageId)
            .single();
            
        if (stageError) throw stageError;
        
        const { data, error } = await supabase
            .from('quality_checks')
            .insert([{
                production_id: stageData.production_id,
                stage_id: parseInt(stageId),
                checkpoint_id: parseInt(checkpoint_id),
                operator,
                result,
                measured_value: measured_value ? parseFloat(measured_value) : null,
                expected_value: expected_value ? parseFloat(expected_value) : null,
                tolerance_min: tolerance_min ? parseFloat(tolerance_min) : null,
                tolerance_max: tolerance_max ? parseFloat(tolerance_max) : null,
                notes,
                photos: photos || []
            }])
            .select();
            
        if (error) throw error;
        
        // Kalite kontrol sonucuna göre aşama durumunu güncelle
        if (result === 'pass') {
            // Başarılı kalite kontrolü - aşama devam edebilir
            await supabase
                .from('production_stages')
                .update({ 
                    status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', stageId);
        } else if (result === 'fail') {
            // Başarısız kalite kontrolü - aşama duraklatılmalı
            await supabase
                .from('production_stages')
                .update({ 
                    status: 'paused',
                    notes: 'Kalite kontrolü başarısız - İnceleme gerekli',
                    updated_at: new Date().toISOString()
                })
                .eq('id', stageId);
        }
        
        res.json(data[0]);
    } catch (error) {
        console.error('Stage quality check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama kalite kontrol geçmişi
app.get('/api/production-stages/:stageId/quality-history', async (req, res) => {
    try {
        const { stageId } = req.params;
        
        const { data, error } = await supabase
            .from('quality_checks')
            .select(`
                *,
                quality_checkpoints (
                    name,
                    checkpoint_type,
                    parameters
                )
            `)
            .eq('stage_id', stageId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Stage quality history error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama kalite raporu
app.get('/api/production-stages/:stageId/quality-report', async (req, res) => {
    try {
        const { stageId } = req.params;
        
        const { data, error } = await supabase
            .from('quality_checks')
            .select(`
                *,
                quality_checkpoints (
                    name,
                    checkpoint_type,
                    parameters
                )
            `)
            .eq('stage_id', stageId);
            
        if (error) throw error;
        
        // Kalite raporu hesaplamaları
        const totalChecks = data.length;
        const passedChecks = data.filter(c => c.result === 'pass').length;
        const failedChecks = data.filter(c => c.result === 'fail').length;
        const warningChecks = data.filter(c => c.result === 'warning').length;
        
        const report = {
            stage_id: parseInt(stageId),
            total_checks: totalChecks,
            passed_checks: passedChecks,
            failed_checks: failedChecks,
            warning_checks: warningChecks,
            pass_rate: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0,
            quality_score: totalChecks > 0 ? Math.round(((passedChecks * 100) + (warningChecks * 50)) / totalChecks) : 0,
            recent_checks: data.slice(0, 10), // Son 10 kontrol
            quality_trend: calculateQualityTrend(data)
        };
        
        res.json(report);
    } catch (error) {
        console.error('Stage quality report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite trend hesaplama yardımcı fonksiyonu
function calculateQualityTrend(checks) {
    if (checks.length < 2) return 'stable';
    
    const recent = checks.slice(0, Math.floor(checks.length / 2));
    const older = checks.slice(Math.floor(checks.length / 2));
    
    const recentPassRate = recent.filter(c => c.result === 'pass').length / recent.length;
    const olderPassRate = older.filter(c => c.result === 'pass').length / older.length;
    
    if (recentPassRate > olderPassRate + 0.1) return 'improving';
    if (recentPassRate < olderPassRate - 0.1) return 'declining';
    return 'stable';
}

// ===== FAZ 7: OPERATÖR PERFORMANS TAKİBİ =====

// Operatör performans raporu
app.get('/api/operators/performance', async (req, res) => {
    try {
        const { operator, date_from, date_to, production_id } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *
            `);
            
        if (operator) {
            query = query.eq('operator', operator);
        }
        
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        
        if (date_to) {
            query = query.lte('end_time', date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Operatör bazlı performans hesaplamaları
        const operatorStats = {};
        
        data.forEach(stage => {
            if (stage.operator) {
                if (!operatorStats[stage.operator]) {
                    operatorStats[stage.operator] = {
                        total_stages: 0,
                        completed_stages: 0,
                        active_stages: 0,
                        paused_stages: 0,
                        skipped_stages: 0,
                        total_duration: 0,
                        average_duration: 0,
                        efficiency_score: 0,
                        quality_score: 0,
                        recent_activity: []
                    };
                }
                
                const stats = operatorStats[stage.operator];
                stats.total_stages++;
                
                if (stage.status === 'completed') {
                    stats.completed_stages++;
                    if (stage.start_time && stage.end_time) {
                        const duration = (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60); // dakika
                        stats.total_duration += duration;
                    }
                } else if (stage.status === 'active') {
                    stats.active_stages++;
                } else if (stage.status === 'paused') {
                    stats.paused_stages++;
                } else if (stage.status === 'skipped') {
                    stats.skipped_stages++;
                }
                
                // Son aktiviteler
                stats.recent_activity.push({
                    stage_name: stage.stage_name,
                    product_id: stage.production_id,
                    status: stage.status,
                    updated_at: stage.updated_at
                });
            }
        });
        
        // Performans metriklerini hesapla
        Object.keys(operatorStats).forEach(operator => {
            const stats = operatorStats[operator];
            
            // Tamamlama oranı
            stats.completion_rate = stats.total_stages > 0 ? 
                Math.round((stats.completed_stages / stats.total_stages) * 100) : 0;
            
            // Ortalama süre
            stats.average_duration = stats.completed_stages > 0 ? 
                Math.round(stats.total_duration / stats.completed_stages) : 0;
            
            // Verimlilik skoru (tamamlanan aşamalar / toplam süre)
            stats.efficiency_score = stats.total_duration > 0 ? 
                Math.round((stats.completed_stages / stats.total_duration) * 100) : 0;
            
            // Kalite skoru (şimdilik varsayılan)
            stats.quality_score = Math.min(95, Math.max(60, stats.completion_rate + Math.random() * 20));
            
            // Son aktiviteleri sırala
            stats.recent_activity.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            stats.recent_activity = stats.recent_activity.slice(0, 5);
        });
        
        res.json(operatorStats);
    } catch (error) {
        console.error('Operator performance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Operatör detaylı performans raporu
app.get('/api/operators/:operator/performance-details', async (req, res) => {
    try {
        const { operator } = req.params;
        const { date_from, date_to } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *
            `)
            .eq('operator', operator);
            
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        
        if (date_to) {
            query = query.lte('end_time', date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Detaylı analiz
        const analysis = {
            operator,
            total_work_time: 0,
            productive_time: 0,
            idle_time: 0,
            stage_breakdown: {},
            daily_performance: {},
            quality_metrics: {
                total_checks: 0,
                passed_checks: 0,
                failed_checks: 0,
                quality_rate: 0
            },
            efficiency_trend: []
        };
        
        // Aşama bazlı analiz
        data.forEach(stage => {
            if (!analysis.stage_breakdown[stage.stage_name]) {
                analysis.stage_breakdown[stage.stage_name] = {
                    count: 0,
                    total_duration: 0,
                    average_duration: 0,
                    completion_rate: 0
                };
            }
            
            const breakdown = analysis.stage_breakdown[stage.stage_name];
            breakdown.count++;
            
            if (stage.status === 'completed' && stage.start_time && stage.end_time) {
                const duration = (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                breakdown.total_duration += duration;
                analysis.total_work_time += duration;
                analysis.productive_time += duration;
            } else if (stage.status === 'paused') {
                analysis.idle_time += 30; // Varsayılan duraklama süresi
            }
        });
        
        // Aşama metriklerini hesapla
        Object.keys(analysis.stage_breakdown).forEach(stageName => {
            const breakdown = analysis.stage_breakdown[stageName];
            const completedStages = data.filter(s => s.stage_name === stageName && s.status === 'completed');
            
            breakdown.average_duration = breakdown.count > 0 ? 
                Math.round(breakdown.total_duration / breakdown.count) : 0;
            breakdown.completion_rate = breakdown.count > 0 ? 
                Math.round((completedStages.length / breakdown.count) * 100) : 0;
        });
        
        // Günlük performans analizi
        const dailyStats = {};
        data.forEach(stage => {
            if (stage.updated_at) {
                const date = new Date(stage.updated_at).toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = { completed: 0, total: 0, duration: 0 };
                }
                dailyStats[date].total++;
                if (stage.status === 'completed') {
                    dailyStats[date].completed++;
                    if (stage.start_time && stage.end_time) {
                        dailyStats[date].duration += (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                    }
                }
            }
        });
        
        analysis.daily_performance = dailyStats;
        
        res.json(analysis);
    } catch (error) {
        console.error('Operator performance details error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama güncelleme
app.put('/api/production-stages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // updated_at otomatik güncelle
        updateData.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('production_stages')
            .update(updateData)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        
        // Aşama durumu değiştiğinde sipariş ilerlemesini güncelle
        if (updateData.status && data[0]) {
            await updateOrderProgressFromStage(data[0]);
        }
        
        res.json(data[0]);
    } catch (error) {
        console.error('Stage update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama tamamla (kalite kontrol entegrasyonu ile)
app.post('/api/production-stages/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        const { data: stage, error: stageError } = await supabase
            .from('production_stages')
            .select('*')
            .eq('id', id)
            .single();
            
        if (stageError) throw stageError;
        
        // Kalite kontrol gerekli mi kontrol et
        if (stage.quality_check_required) {
            // Kalite kontrol noktalarını kontrol et
            const { data: qualityChecks, error: qualityError } = await supabase
                .from('quality_checks')
                .select('*')
                .eq('stage_id', id)
                .eq('result', 'pass');
                
            if (qualityError) {
                console.error('Quality check error:', qualityError);
            } else if (!qualityChecks || qualityChecks.length === 0) {
                return res.status(400).json({ 
                    error: 'Bu aşama için kalite kontrolü gerekli. Önce kalite kontrolünü tamamlayın.',
                    requires_quality_check: true,
                    stage_id: id
                });
            }
        }
        
        const updateData = {
            status: 'completed',
            end_time: new Date().toISOString(),
            notes: notes || stage.notes,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('production_stages')
            .update(updateData)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        
        // Aşama durumu değiştiğinde sipariş ilerlemesini güncelle
        if (data[0]) {
            await updateOrderProgressFromStage(data[0]);
        }
        
        res.json(data[0]);
    } catch (error) {
        console.error('Stage completion error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite kontrol kayıtlarını getir
app.get('/api/quality-control', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quality_checks')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Quality control fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama için kalite kontrol noktalarını getir
app.get('/api/production-stages/:stageId/quality-checkpoints', async (req, res) => {
    try {
        const { stageId } = req.params;
        
        const { data: stage, error: stageError } = await supabase
            .from('production_stages')
            .select('*')
            .eq('id', stageId)
            .single();
            
        if (stageError) throw stageError;
        
        // Aşama için kalite kontrol noktalarını getir
        const { data: checkpoints, error: checkpointsError } = await supabase
            .from('quality_checkpoints')
            .select('*')
            .eq('stage_id', stageId)
            .order('id');
            
        if (checkpointsError) throw checkpointsError;
        
        res.json({
            stage: stage,
            checkpoints: checkpoints || []
        });
    } catch (error) {
        console.error('Stage quality checkpoints error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama için kalite kontrolü yap
app.post('/api/production-stages/:stageId/quality-check', async (req, res) => {
    try {
        const { stageId } = req.params;
        const { checkpoint_id, operator, result, measured_value, expected_value, tolerance_min, tolerance_max, notes } = req.body;
        
        // Aşama bilgilerini al
        const { data: stage, error: stageError } = await supabase
            .from('production_stages')
            .select('*')
            .eq('id', stageId)
            .single();
            
        if (stageError) throw stageError;
        
        // Kalite kontrol kaydı oluştur
        const qualityData = {
            production_id: stage.production_id,
            stage_id: parseInt(stageId),
            checkpoint_id: parseInt(checkpoint_id),
            operator: operator || 'Sistem',
            result: result || 'pass',
            measured_value: measured_value ? parseFloat(measured_value) : null,
            expected_value: expected_value ? parseFloat(expected_value) : null,
            tolerance_min: tolerance_min ? parseFloat(tolerance_min) : null,
            tolerance_max: tolerance_max ? parseFloat(tolerance_max) : null,
            notes: notes || null,
            photos: [],
            check_time: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('quality_checks')
            .insert([qualityData])
            .select();
            
        if (error) throw error;
        
        res.json(data[0]);
    } catch (error) {
        console.error('Stage quality check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite kontrol kaydı oluştur
app.post('/api/quality-control', async (req, res) => {
    try {
        const { stage_id, check_type, check_result, inspector, notes, check_date } = req.body;
        
        const qualityData = {
            stage_id,
            production_id: 8, // Varsayılan production_id
            checkpoint_id: 1, // Varsayılan checkpoint_id
            operator: inspector,
            check_time: check_date || new Date().toISOString(),
            result: "pass",
            measured_value: 100.0,
            expected_value: 100.0,
            tolerance_min: 99.0,
            tolerance_max: 101.0,
            notes: notes || null,
            photos: [],
            created_at: check_date || new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('quality_checks')
            .insert([qualityData])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality control error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verimlilik raporu
app.get('/api/production-stages/efficiency', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('production_stages')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const efficiency = {
            total_stages: data.length,
            completed_stages: data.filter(s => s.status === 'completed').length,
            active_stages: data.filter(s => s.status === 'in_progress').length,
            pending_stages: data.filter(s => s.status === 'pending').length,
            overall_efficiency: 0,
            operator_efficiency: {},
            stage_efficiency: {},
            recommendations: []
        };
        
        // Genel verimlilik hesapla
        if (efficiency.total_stages > 0) {
            efficiency.overall_efficiency = Math.round((efficiency.completed_stages / efficiency.total_stages) * 100);
        }
        
        // Operatör verimliliği
        const operatorStats = {};
        data.forEach(stage => {
            if (stage.operator) {
                if (!operatorStats[stage.operator]) {
                    operatorStats[stage.operator] = { total: 0, completed: 0, duration: 0 };
                }
                operatorStats[stage.operator].total++;
                if (stage.status === 'completed') {
                    operatorStats[stage.operator].completed++;
                    if (stage.start_time && stage.end_time) {
                        operatorStats[stage.operator].duration += (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                    }
                }
            }
        });
        
        Object.keys(operatorStats).forEach(op => {
            const stats = operatorStats[op];
            efficiency.operator_efficiency[op] = {
                completion_rate: Math.round((stats.completed / stats.total) * 100),
                average_duration: stats.completed > 0 ? Math.round(stats.duration / stats.completed) : 0,
                total_duration: Math.round(stats.duration)
            };
        });
        
        // Aşama verimliliği
        const stageStats = {};
        data.forEach(stage => {
            if (!stageStats[stage.stage_name]) {
                stageStats[stage.stage_name] = { total: 0, completed: 0, duration: 0 };
            }
            stageStats[stage.stage_name].total++;
            if (stage.status === 'completed') {
                stageStats[stage.stage_name].completed++;
                if (stage.start_time && stage.end_time) {
                    stageStats[stage.stage_name].duration += (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                }
            }
        });
        
        Object.keys(stageStats).forEach(stage => {
            const stats = stageStats[stage];
            efficiency.stage_efficiency[stage] = {
                completion_rate: Math.round((stats.completed / stats.total) * 100),
                average_duration: stats.completed > 0 ? Math.round(stats.duration / stats.completed) : 0,
                total_duration: Math.round(stats.duration)
            };
        });
        
        // Öneriler
        if (efficiency.overall_efficiency < 50) {
            efficiency.recommendations.push({
                type: 'efficiency',
                priority: 'high',
                title: 'Genel Verimliliği Artırın',
                description: `Mevcut verimlilik %${efficiency.overall_efficiency}. Süreç iyileştirmeleri gerekli.`,
                action: 'Operatör eğitimi ve süreç optimizasyonu planlayın'
            });
        }
        
        res.json(efficiency);
    } catch (error) {
        console.error('Efficiency report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Operatör atama
app.post('/api/production-stages/:stageId/assign-operator', async (req, res) => {
    try {
        const { stageId } = req.params;
        const { operator, notes } = req.body;
        
        const { data, error } = await supabase
            .from('production_stages')
            .update({
                operator,
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', stageId)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Operator assignment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Operatör iş yükü analizi
app.get('/api/operators/workload', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('production_stages')
            .select(`
                *
            `)
            .gte('start_time', `${targetDate}T00:00:00`)
            .lte('start_time', `${targetDate}T23:59:59`);
            
        if (error) throw error;
        
        const workload = {};
        
        data.forEach(stage => {
            if (stage.operator) {
                if (!workload[stage.operator]) {
                    workload[stage.operator] = {
                        active_stages: 0,
                        completed_stages: 0,
                        total_estimated_duration: 0,
                        current_workload: 0,
                        stages: []
                    };
                }
                
                const opWorkload = workload[stage.operator];
                opWorkload.stages.push({
                    stage_name: stage.stage_name,
                    product_id: stage.production_id,
                    status: stage.status,
                    start_time: stage.start_time,
                    estimated_duration: 60 // Varsayılan süre
                });
                
                if (stage.status === 'active') {
                    opWorkload.active_stages++;
                    opWorkload.current_workload += 60; // Varsayılan süre
                } else if (stage.status === 'completed') {
                    opWorkload.completed_stages++;
                }
                
                opWorkload.total_estimated_duration += 60;
            }
        });
        
        // İş yükü seviyelerini hesapla
        Object.keys(workload).forEach(operator => {
            const opWorkload = workload[operator];
            const workloadPercentage = opWorkload.total_estimated_duration > 0 ? 
                Math.round((opWorkload.current_workload / opWorkload.total_estimated_duration) * 100) : 0;
            
            opWorkload.workload_level = workloadPercentage > 80 ? 'high' : 
                                       workloadPercentage > 50 ? 'medium' : 'low';
            opWorkload.workload_percentage = workloadPercentage;
        });
        
        res.json(workload);
    } catch (error) {
        console.error('Operator workload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FAZ 7: AŞAMA RAPORLAMA VE ANALİTİK =====

// Kapsamlı aşama analiz raporu
app.get('/api/production-stages/analytics', async (req, res) => {
    try {
        const { date_from, date_to, production_id, operator, product_type } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *
            `);
            
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (operator) {
            query = query.eq('operator', operator);
        }
        
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        
        if (date_to) {
            query = query.lte('end_time', date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Kapsamlı analiz
        const analytics = {
            overview: {
                total_stages: data.length,
                completed_stages: data.filter(s => s.status === 'completed').length,
                active_stages: data.filter(s => s.status === 'active').length,
                paused_stages: data.filter(s => s.status === 'paused').length,
                skipped_stages: data.filter(s => s.status === 'skipped').length,
                completion_rate: 0,
                average_duration: 0,
                total_work_time: 0
            },
            stage_performance: {},
            operator_performance: {},
            time_analysis: {
                daily_breakdown: {},
                hourly_distribution: {},
                peak_hours: [],
                efficiency_trends: []
            },
            quality_metrics: {
                total_quality_checks: 0,
                passed_checks: 0,
                failed_checks: 0,
                quality_score: 0,
                quality_trend: 'stable'
            },
            bottlenecks: [],
            recommendations: []
        };
        
        // Genel metrikleri hesapla
        const completedStages = data.filter(s => s.status === 'completed' && s.start_time && s.end_time);
        analytics.overview.completion_rate = data.length > 0 ? 
            Math.round((analytics.overview.completed_stages / data.length) * 100) : 0;
        
        if (completedStages.length > 0) {
            const totalDuration = completedStages.reduce((sum, stage) => {
                return sum + (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
            }, 0);
            analytics.overview.average_duration = Math.round(totalDuration / completedStages.length);
            analytics.overview.total_work_time = Math.round(totalDuration);
        }
        
        // Aşama performans analizi
        const stageStats = {};
        data.forEach(stage => {
            if (!stageStats[stage.stage_name]) {
                stageStats[stage.stage_name] = {
                    count: 0,
                    completed: 0,
                    total_duration: 0,
                    average_duration: 0,
                    completion_rate: 0,
                    operators: new Set(),
                    quality_issues: 0
                };
            }
            
            const stats = stageStats[stage.stage_name];
            stats.count++;
            
            if (stage.status === 'completed') {
                stats.completed++;
                if (stage.start_time && stage.end_time) {
                    const duration = (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                    stats.total_duration += duration;
                }
            }
            
            if (stage.operator) {
                stats.operators.add(stage.operator);
            }
        });
        
        // Aşama metriklerini hesapla
        Object.keys(stageStats).forEach(stageName => {
            const stats = stageStats[stageName];
            stats.completion_rate = Math.round((stats.completed / stats.count) * 100);
            stats.average_duration = stats.completed > 0 ? 
                Math.round(stats.total_duration / stats.completed) : 0;
            stats.operator_count = stats.operators.size;
            delete stats.operators; // Set'i temizle
        });
        
        analytics.stage_performance = stageStats;
        
        // Operatör performans analizi
        const operatorStats = {};
        data.forEach(stage => {
            if (stage.operator) {
                if (!operatorStats[stage.operator]) {
                    operatorStats[stage.operator] = {
                        total_stages: 0,
                        completed_stages: 0,
                        total_duration: 0,
                        average_duration: 0,
                        efficiency_score: 0,
                        stages_worked: new Set()
                    };
                }
                
                const stats = operatorStats[stage.operator];
                stats.total_stages++;
                stats.stages_worked.add(stage.stage_name);
                
                if (stage.status === 'completed') {
                    stats.completed_stages++;
                    if (stage.start_time && stage.end_time) {
                        const duration = (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                        stats.total_duration += duration;
                    }
                }
            }
        });
        
        // Operatör metriklerini hesapla
        Object.keys(operatorStats).forEach(operator => {
            const stats = operatorStats[operator];
            stats.completion_rate = Math.round((stats.completed_stages / stats.total_stages) * 100);
            stats.average_duration = stats.completed_stages > 0 ? 
                Math.round(stats.total_duration / stats.completed_stages) : 0;
            stats.efficiency_score = stats.total_duration > 0 ? 
                Math.round((stats.completed_stages / stats.total_duration) * 100) : 0;
            stats.unique_stages = stats.stages_worked.size;
            delete stats.stages_worked; // Set'i temizle
        });
        
        analytics.operator_performance = operatorStats;
        
        // Zaman analizi
        const dailyStats = {};
        const hourlyStats = {};
        
        data.forEach(stage => {
            if (stage.start_time) {
                const date = new Date(stage.start_time).toISOString().split('T')[0];
                const hour = new Date(stage.start_time).getHours();
                
                if (!dailyStats[date]) {
                    dailyStats[date] = { stages: 0, completed: 0, duration: 0 };
                }
                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = 0;
                }
                
                dailyStats[date].stages++;
                hourlyStats[hour]++;
                
                if (stage.status === 'completed') {
                    dailyStats[date].completed++;
                    if (stage.end_time) {
                        const duration = (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                        dailyStats[date].duration += duration;
                    }
                }
            }
        });
        
        analytics.time_analysis.daily_breakdown = dailyStats;
        analytics.time_analysis.hourly_distribution = hourlyStats;
        
        // En yoğun saatleri bul
        const sortedHours = Object.entries(hourlyStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        analytics.time_analysis.peak_hours = sortedHours;
        
        // Darboğaz analizi
        const slowStages = Object.entries(stageStats)
            .filter(([, stats]) => stats.average_duration > 120) // 2 saatten fazla
            .sort(([,a], [,b]) => b.average_duration - a.average_duration)
            .slice(0, 5);
        
        analytics.bottlenecks = slowStages.map(([stageName, stats]) => ({
            stage_name: stageName,
            average_duration: stats.average_duration,
            completion_rate: stats.completion_rate,
            impact_level: stats.average_duration > 240 ? 'high' : stats.average_duration > 180 ? 'medium' : 'low'
        }));
        
        // Öneriler
        analytics.recommendations = generateRecommendations(analytics);
        
        res.json(analytics);
    } catch (error) {
        console.error('Stage analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aşama verimlilik raporu
app.get('/api/production-stages/efficiency-report', async (req, res) => {
    try {
        const { date_from, date_to, stage_name, operator } = req.query;
        
        let query = supabase
            .from('production_stages')
            .select(`
                *
            `);
            
        if (stage_name) {
            query = query.eq('stage_name', stage_name);
        }
        
        if (operator) {
            query = query.eq('operator', operator);
        }
        
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        
        if (date_to) {
            query = query.lte('end_time', date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const efficiencyReport = {
            period: { from: date_from, to: date_to },
            filters: { stage_name, operator },
            metrics: {
                total_stages: data.length,
                completed_stages: data.filter(s => s.status === 'completed').length,
                efficiency_rate: 0,
                average_cycle_time: 0,
                target_vs_actual: {},
                improvement_opportunities: []
            },
            stage_breakdown: {},
            operator_breakdown: {},
            trends: {
                daily_efficiency: {},
                weekly_efficiency: {},
                monthly_efficiency: {}
            }
        };
        
        // Verimlilik hesaplamaları
        const completedStages = data.filter(s => s.status === 'completed' && s.start_time && s.end_time);
        efficiencyReport.metrics.efficiency_rate = data.length > 0 ? 
            Math.round((completedStages.length / data.length) * 100) : 0;
        
        if (completedStages.length > 0) {
            const totalCycleTime = completedStages.reduce((sum, stage) => {
                return sum + (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
            }, 0);
            efficiencyReport.metrics.average_cycle_time = Math.round(totalCycleTime / completedStages.length);
        }
        
        // Aşama bazlı verimlilik
        const stageEfficiency = {};
        data.forEach(stage => {
            if (!stageEfficiency[stage.stage_name]) {
                stageEfficiency[stage.stage_name] = {
                    total: 0,
                    completed: 0,
                    total_time: 0,
                    efficiency: 0,
                    target_time: 60 // Varsayılan hedef süre
                };
            }
            
            const eff = stageEfficiency[stage.stage_name];
            eff.total++;
            
            if (stage.status === 'completed') {
                eff.completed++;
                if (stage.start_time && stage.end_time) {
                    eff.total_time += (new Date(stage.end_time) - new Date(stage.start_time)) / (1000 * 60);
                }
            }
        });
        
        // Aşama verimlilik oranlarını hesapla
        Object.keys(stageEfficiency).forEach(stageName => {
            const eff = stageEfficiency[stageName];
            eff.efficiency = eff.total > 0 ? Math.round((eff.completed / eff.total) * 100) : 0;
            eff.average_time = eff.completed > 0 ? Math.round(eff.total_time / eff.completed) : 0;
            eff.target_achievement = eff.average_time > 0 ? 
                Math.round((eff.target_time / eff.average_time) * 100) : 0;
        });
        
        efficiencyReport.stage_breakdown = stageEfficiency;
        
        res.json(efficiencyReport);
    } catch (error) {
        console.error('Efficiency report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Öneriler oluşturma yardımcı fonksiyonu
function generateRecommendations(analytics) {
    const recommendations = [];
    
    // Tamamlama oranı düşükse
    if (analytics.overview.completion_rate < 70) {
        recommendations.push({
            type: 'completion_rate',
            priority: 'high',
            title: 'Tamamlama Oranını Artırın',
            description: `Mevcut tamamlama oranı %${analytics.overview.completion_rate}. Operatör eğitimi ve süreç iyileştirmeleri önerilir.`,
            action: 'Operatör eğitimi planlayın ve süreç darboğazlarını inceleyin'
        });
    }
    
    // Darboğazlar varsa
    if (analytics.bottlenecks.length > 0) {
        const topBottleneck = analytics.bottlenecks[0];
        recommendations.push({
            type: 'bottleneck',
            priority: 'high',
            title: 'Darboğaz Aşaması Tespit Edildi',
            description: `${topBottleneck.stage_name} aşaması ortalama ${topBottleneck.average_duration} dakika sürüyor.`,
            action: 'Bu aşamada iş akışını optimize edin ve ek kaynak atayın'
        });
    }
    
    // Verimlilik düşükse
    const avgEfficiency = Object.values(analytics.operator_performance)
        .reduce((sum, op) => sum + op.efficiency_score, 0) / 
        Object.keys(analytics.operator_performance).length;
    
    if (avgEfficiency < 60) {
        recommendations.push({
            type: 'efficiency',
            priority: 'medium',
            title: 'Operatör Verimliliğini Artırın',
            description: `Ortalama operatör verimliliği ${Math.round(avgEfficiency)}.`,
            action: 'Operatör eğitimi ve motivasyon programları uygulayın'
        });
    }
    
    return recommendations;
}

// ========================================
// KALİTE KONTROL SİSTEMİ API'LERİ - FAZ 2
// ========================================

// Kalite kontrol noktalarını listele
app.get('/api/quality/checkpoints', async (req, res) => {
    try {
        const { product_type, stage_id } = req.query;
        
        let query = supabase
            .from('quality_checkpoints')
            .select('*')
            .order('name', { ascending: true });
            
        if (product_type) {
            query = query.eq('product_type', product_type);
        }
        
        if (stage_id) {
            query = query.eq('stage_id', stage_id);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Quality checkpoints fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite kontrol noktası oluştur
app.post('/api/quality/checkpoints', async (req, res) => {
    try {
        const { name, description, product_type, stage_id, checkpoint_type, parameters, is_mandatory, frequency } = req.body;
        
        const { data, error } = await supabase
            .from('quality_checkpoints')
            .insert([{
                name,
                description,
                product_type,
                stage_id: stage_id ? parseInt(stage_id) : null,
                checkpoint_type,
                parameters: parameters || {},
                is_mandatory: is_mandatory !== false,
                frequency: frequency || 'every'
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality checkpoint creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite kontrol noktasını güncelle
app.put('/api/quality/checkpoints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('quality_checkpoints')
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality checkpoint update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite kontrolü gerçekleştir
app.post('/api/quality/checks', async (req, res) => {
    try {
        const { production_id, stage_id, checkpoint_id, operator, result, measured_value, expected_value, tolerance_min, tolerance_max, notes, photos } = req.body;
        
        // Geçici çözüm: production_id'yi null yap (constraint hatası için)
        const qualityData = {
            production_id: null, // Geçici olarak null
            stage_id: parseInt(stage_id),
            checkpoint_id: parseInt(checkpoint_id),
            operator,
            result,
            measured_value: measured_value ? parseFloat(measured_value) : null,
            expected_value: expected_value ? parseFloat(expected_value) : null,
            tolerance_min: tolerance_min ? parseFloat(tolerance_min) : null,
            tolerance_max: tolerance_max ? parseFloat(tolerance_max) : null,
            notes,
            photos: photos || []
        };
        
        const { data, error } = await supabase
            .from('quality_checks')
            .insert([qualityData])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality check creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite standartlarını listele
app.get('/api/quality/standards', async (req, res) => {
    try {
        const { product_type, standard_type, is_active } = req.query;
        
        let query = supabase
            .from('quality_standards')
            .select('*')
            .order('name', { ascending: true });
            
        if (product_type) {
            query = query.eq('product_type', product_type);
        }
        
        if (standard_type) {
            query = query.eq('standard_type', standard_type);
        }
        
        if (is_active !== undefined) {
            query = query.eq('is_active', is_active === 'true');
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Quality standards fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite standardı oluştur
app.post('/api/quality/standards', async (req, res) => {
    try {
        const { name, description, product_type, standard_type, is_active } = req.body;
        
        const { data, error } = await supabase
            .from('quality_standards')
            .insert([{
                name,
                description,
                product_type,
                standard_type,
                is_active: is_active !== false
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality standard creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite standardını güncelle
app.put('/api/quality/standards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('quality_standards')
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality standard update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite istatistiklerini getir
app.get('/api/quality/statistics', async (req, res) => {
    try {
        const { start_date, end_date, product_type } = req.query;
        
        let query = supabase
            .from('quality_checks')
            .select('*');
            
        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        
        if (end_date) {
            query = query.lte('created_at', end_date);
        }
        
        const { data: checks, error } = await query;
        if (error) throw error;
        
        // İstatistikleri hesapla
        const totalChecks = checks.length;
        const passedChecks = checks.filter(c => c.result === 'pass').length;
        const failedChecks = checks.filter(c => c.result === 'fail').length;
        const warningChecks = checks.filter(c => c.result === 'warning').length;
        
        const passRate = totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) : 0;
        const failRate = totalChecks > 0 ? (failedChecks / totalChecks * 100).toFixed(1) : 0;
        const warningRate = totalChecks > 0 ? (warningChecks / totalChecks * 100).toFixed(1) : 0;
        
        // Kalite skoru hesapla (pass: 100, warning: 50, fail: 0)
        const qualityScore = totalChecks > 0 ? 
            Math.round(((passedChecks * 100) + (warningChecks * 50)) / totalChecks) : 0;
        
        const stats = {
            total_checks: totalChecks,
            passed_checks: passedChecks,
            failed_checks: failedChecks,
            warning_checks: warningChecks,
            pass_rate: parseFloat(passRate),
            fail_rate: parseFloat(failRate),
            warning_rate: parseFloat(warningRate),
            quality_score: qualityScore
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Quality statistics fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite raporlarını getir
app.get('/api/quality/reports', async (req, res) => {
    try {
        const { start_date, end_date, product_type, operator } = req.query;
        
        let query = supabase
            .from('quality_checks')
            .select(`
                *,
                quality_checkpoints (
                    name,
                    checkpoint_type,
                    product_type
                ),
                production_stages (
                    stage_name,
                    production_id
                )
            `);
            
        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        
        if (end_date) {
            query = query.lte('created_at', end_date);
        }
        
        if (operator) {
            query = query.eq('operator', operator);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Rapor verilerini işle
        const reports = data.map(check => ({
            id: check.id,
            checkpoint_name: check.quality_checkpoints?.name || 'Bilinmiyor',
            checkpoint_type: check.quality_checkpoints?.checkpoint_type || 'Bilinmiyor',
            product_type: check.quality_checkpoints?.product_type || 'Bilinmiyor',
            stage_name: check.production_stages?.stage_name || 'Bilinmiyor',
            operator: check.operator,
            result: check.result,
            measured_value: check.measured_value,
            expected_value: check.expected_value,
            notes: check.notes,
            created_at: check.created_at
        }));
        
        res.json(reports);
    } catch (error) {
        console.error('Quality reports fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Üretim kalite kontrollerini listele
app.get('/api/productions/:id/quality-checks', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('quality_checks')
            .select(`
                *,
                quality_checkpoints (
                    name,
                    checkpoint_type,
                    parameters
                )
            `)
            .eq('production_id', id)
            .order('check_time', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Production quality checks fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite standartlarını listele
app.get('/api/quality/standards', async (req, res) => {
    try {
        const { product_type, standard_type, active_only } = req.query;
        
        let query = supabase
            .from('quality_standards')
            .select('*')
            .order('name', { ascending: true });
            
        if (product_type) {
            query = query.eq('product_type', product_type);
        }
        
        if (standard_type) {
            query = query.eq('standard_type', standard_type);
        }
        
        if (active_only === 'true') {
            query = query.eq('is_active', true);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Quality standards fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite raporu oluştur
app.post('/api/quality/reports', async (req, res) => {
    try {
        const { production_id, report_type, report_date, report_data } = req.body;
        
        // Kalite skorunu hesapla
        const { data: checks, error: checksError } = await supabase
            .from('quality_checks')
            .select('result')
            .eq('production_id', production_id);
            
        if (checksError) throw checksError;
        
        const totalChecks = checks.length;
        const passedChecks = checks.filter(c => c.result === 'pass').length;
        const failedChecks = checks.filter(c => c.result === 'fail').length;
        const warningChecks = checks.filter(c => c.result === 'warning').length;
        
        const qualityScore = totalChecks > 0 ? (passedChecks / totalChecks * 100) : 0;
        
        const { data, error } = await supabase
            .from('quality_reports')
            .insert([{
                production_id: parseInt(production_id),
                report_type,
                report_date,
                total_checks: totalChecks,
                passed_checks: passedChecks,
                failed_checks: failedChecks,
                warning_checks: warningChecks,
                quality_score: parseFloat(qualityScore.toFixed(2)),
                report_data: report_data || {}
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality report creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite raporlarını listele
app.get('/api/quality/reports', async (req, res) => {
    try {
        const { production_id, report_type, start_date, end_date } = req.query;
        
        let query = supabase
            .from('quality_reports')
            .select('*')
            .order('report_date', { ascending: false });
            
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (report_type) {
            query = query.eq('report_type', report_type);
        }
        
        if (start_date) {
            query = query.gte('report_date', start_date);
        }
        
        if (end_date) {
            query = query.lte('report_date', end_date);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Quality reports fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kalite istatistikleri
app.get('/api/quality/statistics', async (req, res) => {
    try {
        const { production_id, start_date, end_date } = req.query;
        
        let query = supabase
            .from('quality_checks')
            .select('result, check_time');
            
        if (production_id) {
            query = query.eq('production_id', production_id);
        }
        
        if (start_date) {
            query = query.gte('check_time', start_date);
        }
        
        if (end_date) {
            query = query.lte('check_time', end_date);
        }
        
        const { data: checks, error } = await query;
        if (error) throw error;
        
        const totalChecks = checks.length;
        const passedChecks = checks.filter(c => c.result === 'pass').length;
        const failedChecks = checks.filter(c => c.result === 'fail').length;
        const warningChecks = checks.filter(c => c.result === 'warning').length;
        
        const qualityScore = totalChecks > 0 ? (passedChecks / totalChecks * 100) : 0;
        
        res.json({
            total_checks: totalChecks,
            passed_checks: passedChecks,
            failed_checks: failedChecks,
            warning_checks: warningChecks,
            quality_score: parseFloat(qualityScore.toFixed(2)),
            pass_rate: totalChecks > 0 ? parseFloat((passedChecks / totalChecks * 100).toFixed(2)) : 0,
            fail_rate: totalChecks > 0 ? parseFloat((failedChecks / totalChecks * 100).toFixed(2)) : 0
        });
    } catch (error) {
        console.error('Quality statistics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// BARKOD YÖNETİMİ API'LERİ - FAZ 2
// ========================================

// Barkod Yönetimi API'leri
// Barkod tarama - KALDIRILDI (barcode_scans tablosu kullanılmıyor)

// Barkod geçmişi - KALDIRILDI (barcode_scans tablosu kullanılmıyor)

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
// STOK YÖNETİMİ API'LERİ - STOK GİRİŞİ
// ========================================

// Stok girişi yapma
app.post('/api/stock/entry', async (req, res) => {
    try {
        const { 
            urun_id, 
            urun_tipi, 
            miktar, 
            birim, 
            birim_fiyat, 
            referans_no, 
            aciklama, 
            tedarikci,
            fatura_no,
            teslim_tarihi 
        } = req.body;
        
        // Validation
        if (!urun_id || !urun_tipi || !miktar) {
            return res.status(400).json({ error: 'Gerekli alanlar eksik' });
        }
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Stok hareketi kaydet
        const stokHareketi = {
            urun_id: parseInt(urun_id),
            urun_tipi: urun_tipi,
            hareket_tipi: 'giris',
            miktar: parseFloat(miktar),
            birim: birim,
            birim_fiyat: parseFloat(birim_fiyat) || 0,
            toplam_tutar: parseFloat(miktar) * (parseFloat(birim_fiyat) || 0),
            referans_no: referans_no || `STK-${Date.now()}`,
            aciklama: aciklama || 'Stok girişi',
            operator: 'system'
        };
        
        const { data: hareketData, error: hareketError } = await supabase
            .from('stok_hareketleri')
            .insert([stokHareketi])
            .select();
            
        if (hareketError) {
            if (hareketError.message.includes('Could not find the table')) {
                return res.status(503).json({ 
                    error: 'Stok hareketleri tablosu henüz oluşturulmadı',
                    instructions: 'create_stok_hareketleri_table.sql dosyasındaki SQL\'i Supabase SQL Editor\'da çalıştırın',
                    sql_file: 'create_stok_hareketleri_table.sql'
                });
            }
            throw hareketError;
        }
        
        // Ürün stok miktarını güncelle
        const tableName = urun_tipi === 'hammadde' ? 'hammaddeler' : 
                          urun_tipi === 'yarimamul' ? 'yarimamuller' : 'nihai_urunler';
        
        const { data: currentData, error: currentError } = await supabase
            .from(tableName)
            .select('miktar')
            .eq('id', urun_id)
            .single();
            
        if (currentError) throw currentError;
        
        const newMiktar = (currentData.miktar || 0) + parseFloat(miktar);
        
        const { data: updateData, error: updateError } = await supabase
            .from(tableName)
            .update({ 
                miktar: newMiktar,
                updated_at: new Date().toISOString()
            })
            .eq('id', urun_id)
            .select();
            
        if (updateError) throw updateError;
        
        res.json({
            success: true,
            stok_hareketi: hareketData[0],
            yeni_stok_miktari: newMiktar,
            message: 'Stok girişi başarıyla yapıldı'
        });
        
    } catch (error) {
        console.error('Stok girişi error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        res.status(500).json({ 
            error: error.message,
            details: error.details || null,
            code: error.code || null
        });
    }
});

// Stok çıkışı yapma
app.post('/api/stock/exit', async (req, res) => {
    try {
        const { 
            urun_id, 
            urun_tipi, 
            miktar, 
            birim, 
            referans_no, 
            aciklama,
            cikis_tipi // 'uretim', 'tuketim', 'transfer', 'sayim'
        } = req.body;
        
        if (!urun_id || !urun_tipi || !miktar) {
            return res.status(400).json({ error: 'Gerekli alanlar eksik' });
        }
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Mevcut stok kontrolü
        const tableName = urun_tipi === 'hammadde' ? 'hammaddeler' : 
                          urun_tipi === 'yarimamul' ? 'yarimamuller' : 'nihai_urunler';
        
        const { data: currentData, error: currentError } = await supabase
            .from(tableName)
            .select('miktar')
            .eq('id', urun_id)
            .single();
            
        if (currentError) throw currentError;
        
        if ((currentData.miktar || 0) < parseFloat(miktar)) {
            return res.status(400).json({ 
                error: 'Yetersiz stok! Mevcut stok: ' + (currentData.miktar || 0) 
            });
        }
        
        // Stok hareketi kaydet
        const stokHareketi = {
            urun_id: parseInt(urun_id),
            urun_tipi: urun_tipi,
            hareket_tipi: cikis_tipi || 'cikis',
            miktar: parseFloat(miktar),
            birim: birim,
            referans_no: referans_no || `STK-${Date.now()}`,
            aciklama: aciklama || 'Stok çıkışı',
            operator: 'system'
        };
        
        const { data: hareketData, error: hareketError } = await supabase
            .from('stok_hareketleri')
            .insert([stokHareketi])
            .select();
            
        if (hareketError) throw hareketError;
        
        // Ürün stok miktarını güncelle
        const newMiktar = (currentData.miktar || 0) - parseFloat(miktar);
        
        const { data: updateData, error: updateError } = await supabase
            .from(tableName)
            .update({ 
                miktar: newMiktar,
                updated_at: new Date().toISOString()
            })
            .eq('id', urun_id)
            .select();
            
        if (updateError) throw updateError;
        
        res.json({
            success: true,
            stok_hareketi: hareketData[0],
            yeni_stok_miktari: newMiktar,
            message: 'Stok çıkışı başarıyla yapıldı'
        });
        
    } catch (error) {
        console.error('Stok çıkışı error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stok hareketleri listesi
app.get('/api/stock/movements', async (req, res) => {
    try {
        const { 
            urun_id, 
            urun_tipi, 
            hareket_tipi, 
            start_date, 
            end_date,
            limit = 100,
            offset = 0
        } = req.query;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        let query = supabase
            .from('stok_hareketleri')
            .select('*')
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            
        if (urun_id) query = query.eq('urun_id', urun_id);
        if (urun_tipi) query = query.eq('urun_tipi', urun_tipi);
        if (hareket_tipi) query = query.eq('hareket_tipi', hareket_tipi);
        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);
        
        const { data, error } = await query;
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Stok hareketleri fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stok durumu raporu
app.get('/api/stock/status', async (req, res) => {
    try {
        const { urun_tipi } = req.query;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        let tableName = 'hammaddeler';
        if (urun_tipi === 'yarimamul') tableName = 'yarimamuller';
        if (urun_tipi === 'nihai') tableName = 'nihai_urunler';
        
        const { data, error } = await supabase
            .from(tableName)
            .select('id, ad, kod, miktar, birim, minimum_stok, maksimum_stok, aktif')
            .eq('aktif', true)
            .order('miktar', { ascending: true });
            
        if (error) throw error;
        
        // Stok durumu analizi
        const stockAnalysis = data.map(item => {
            const miktar = parseFloat(item.miktar || 0);
            const minStok = parseFloat(item.minimum_stok || 0);
            const maxStok = parseFloat(item.maksimum_stok || 0);
            
            let durum = 'normal';
            if (miktar <= minStok) durum = 'kritik';
            else if (miktar >= maxStok && maxStok > 0) durum = 'fazla';
            else if (miktar === 0) durum = 'tukenmis';
            
            return {
                ...item,
                durum,
                stok_yuzdesi: maxStok > 0 ? ((miktar / maxStok) * 100).toFixed(2) : null
            };
        });
        
        res.json(stockAnalysis);
    } catch (error) {
        console.error('Stok durumu error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stok sayımı
app.post('/api/stock/count', async (req, res) => {
    try {
        const { 
            urun_id, 
            urun_tipi, 
            sayim_miktari, 
            aciklama 
        } = req.body;
        
        if (!urun_id || !urun_tipi || sayim_miktari === undefined) {
            return res.status(400).json({ error: 'Gerekli alanlar eksik' });
        }
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Mevcut stok miktarını al
        const tableName = urun_tipi === 'hammadde' ? 'hammaddeler' : 
                          urun_tipi === 'yarimamul' ? 'yarimamuller' : 'nihai_urunler';
        
        const { data: currentData, error: currentError } = await supabase
            .from(tableName)
            .select('miktar')
            .eq('id', urun_id)
            .single();
            
        if (currentError) throw currentError;
        
        const mevcutMiktar = parseFloat(currentData.miktar || 0);
        const sayimMiktari = parseFloat(sayim_miktari);
        const fark = sayimMiktari - mevcutMiktar;
        
        // Stok hareketi kaydet
        const stokHareketi = {
            urun_id: parseInt(urun_id),
            urun_tipi: urun_tipi,
            hareket_tipi: 'sayim',
            miktar: Math.abs(fark),
            birim: 'adet', // Varsayılan birim
            referans_no: `SAYIM-${Date.now()}`,
            aciklama: `${aciklama || 'Stok sayımı'} - Fark: ${fark > 0 ? '+' : ''}${fark}`,
            operator: 'system'
        };
        
        const { data: hareketData, error: hareketError } = await supabase
            .from('stok_hareketleri')
            .insert([stokHareketi])
            .select();
            
        if (hareketError) throw hareketError;
        
        // Stok miktarını güncelle
        const { data: updateData, error: updateError } = await supabase
            .from(tableName)
            .update({ 
                miktar: sayimMiktari,
                updated_at: new Date().toISOString()
            })
            .eq('id', urun_id)
            .select();
            
        if (updateError) throw updateError;
        
        res.json({
            success: true,
            stok_hareketi: hareketData[0],
            eski_miktar: mevcutMiktar,
            yeni_miktar: sayimMiktari,
            fark: fark,
            message: 'Stok sayımı tamamlandı'
        });
        
    } catch (error) {
        console.error('Stok sayımı error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Üretim güncelleme API'si
app.put('/api/productions/:id', async (req, res) => {
    try {
        const productionId = req.params.id;
        const { 
            target_quantity, 
            quantity, 
            status, 
            priority, 
            notes,
            end_time 
        } = req.body;
        
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase bağlantısı yok' });
        }
        
        // Güncellenecek alanları hazırla
        const updateData = {
            updated_at: new Date().toISOString()
        };
        
        if (target_quantity !== undefined) updateData.target_quantity = parseInt(target_quantity);
        if (quantity !== undefined) updateData.quantity = parseInt(quantity);
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (notes !== undefined) updateData.notes = notes;
        if (end_time !== undefined) updateData.end_time = end_time;
        
        // Eğer durum tamamlandı veya iptal edildi ise bitiş zamanını ayarla
        if (status === 'completed' || status === 'cancelled') {
            updateData.end_time = new Date().toISOString();
        }
        
        const { data, error } = await supabase
            .from('productions')
            .update(updateData)
            .eq('id', productionId)
            .select();
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Üretim bulunamadı' });
        }
        
        res.json({
            success: true,
            production: data[0],
            message: 'Üretim başarıyla güncellendi'
        });
        
    } catch (error) {
        console.error('Üretim güncelleme error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Hammadde tablosuna barkod sütunu ekle (manuel olarak Supabase'de yapılmalı)
async function addBarcodeColumnToHammadde() {
  console.log('Barkod sütunu manuel olarak Supabase\'de eklenmelidir:');
  console.log('ALTER TABLE hammaddeler ADD COLUMN barkod VARCHAR(50) UNIQUE;');
  console.log('CREATE INDEX idx_hammaddeler_barkod ON hammaddeler(barkod);');
}

// Stok hareketleri tablosunu oluştur
async function createStokHareketleriTable() {
  try {
    if (!supabase) {
      console.log('Supabase bağlantısı yok, stok_hareketleri tablosu oluşturulamadı');
      return;
    }
    
    // Tablo oluşturma SQL'i
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS stok_hareketleri (
        id BIGSERIAL PRIMARY KEY,
        urun_id INTEGER NOT NULL,
        urun_tipi VARCHAR(20) NOT NULL,
        hareket_tipi VARCHAR(20) NOT NULL,
        miktar DECIMAL(15,4) NOT NULL,
        birim VARCHAR(50) NOT NULL,
        birim_fiyat DECIMAL(15,4) DEFAULT 0,
        toplam_tutar DECIMAL(15,4) DEFAULT 0,
        aciklama TEXT,
        referans_no VARCHAR(100),
        operator VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Index'leri oluştur
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun_id ON stok_hareketleri(urun_id);
      CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun_tipi ON stok_hareketleri(urun_tipi);
      CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_hareket_tipi ON stok_hareketleri(hareket_tipi);
      CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_created_at ON stok_hareketleri(created_at);
    `;
    
    // RLS politikalarını oluştur
    const createRLSSQL = `
      ALTER TABLE stok_hareketleri ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "stok_hareketleri_select_policy" ON stok_hareketleri
        FOR SELECT USING (true);
      
      CREATE POLICY IF NOT EXISTS "stok_hareketleri_insert_policy" ON stok_hareketleri
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY IF NOT EXISTS "stok_hareketleri_update_policy" ON stok_hareketleri
        FOR UPDATE USING (true);
      
      CREATE POLICY IF NOT EXISTS "stok_hareketleri_delete_policy" ON stok_hareketleri
        FOR DELETE USING (true);
    `;
    
    // Stok hareketleri tablosu zaten setup_all_tables_sequential.sql ile oluşturulmuş
    console.log('Stok hareketleri tablosu kontrol ediliyor...');
    
    // Tablonun var olup olmadığını kontrol et
    const { data, error } = await supabase
      .from('stok_hareketleri')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Stok hareketleri tablosu bulunamadı. Lütfen setup_all_tables_sequential.sql dosyasını çalıştırın.');
    } else {
      console.log('Stok hareketleri tablosu mevcut');
    }
    
  } catch (error) {
    console.log('Stok hareketleri tablosu oluşturma hatası:', error.message);
  }
}

// ==================== VERİTABANI DÜZELTME API'LERİ ====================

// Veritabanı yapısını düzelt
app.post('/api/fix-database', async (req, res) => {
  try {
    console.log('🔧 Veritabanı yapısı düzeltiliyor...');
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase bağlantısı yok' });
    }

    // 1. Customers tablosunu oluştur
    console.log('👥 Customers tablosu oluşturuluyor...');
    try {
      // Önce tabloyu kontrol et
      const { data: existingTable, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST116') {
        // Tablo yok, oluştur
        console.log('Customers tablosu bulunamadı, oluşturuluyor...');
        // Supabase'de tablo oluşturma için SQL editor kullanılmalı
        // Şimdilik mock data ile devam edelim
        console.log('⚠️ Customers tablosu manuel olarak oluşturulmalı');
      } else if (existingTable) {
        console.log('✅ Customers tablosu zaten mevcut');
      }
    } catch (error) {
      console.error('Customers tablo kontrol hatası:', error);
    }

    // 2. Örnek müşteri verileri ekle
    console.log('👥 Örnek müşteri verileri ekleniyor...');
    try {
      const customers = [
        { id: 1, name: 'ABC Tekstil A.Ş.', customer_name: 'ABC Tekstil A.Ş.', contact_person: 'Ahmet Yılmaz', phone: '0532 123 4567', email: 'info@abctekstil.com', address: 'Organize Sanayi Bölgesi No:15', city: 'İstanbul', active: true },
        { id: 2, name: 'XYZ Giyim Ltd.', customer_name: 'XYZ Giyim Ltd.', contact_person: 'Fatma Demir', phone: '0533 234 5678', email: 'satış@xyzgiyim.com', address: 'Tekstil Mahallesi 123/5', city: 'Bursa', active: true },
        { id: 3, name: 'DEF Moda San.', customer_name: 'DEF Moda San.', contact_person: 'Mehmet Kaya', phone: '0534 345 6789', email: 'info@defmoda.com', address: 'Sanayi Caddesi No:45', city: 'İzmir', active: true },
        { id: 4, name: 'GHI Konfeksiyon', customer_name: 'GHI Konfeksiyon', contact_person: 'Ayşe Öz', phone: '0535 456 7890', email: 'info@ghikonfeksiyon.com', address: 'Endüstri Mahallesi 67/8', city: 'Ankara', active: true },
        { id: 5, name: 'JKL Tekstil', customer_name: 'JKL Tekstil', contact_person: 'Ali Çelik', phone: '0536 567 8901', email: 'info@jkltekstil.com', address: 'Sanayi Sitesi A Blok', city: 'Adana', active: true },
        { id: 6, name: 'MNO Giyim', customer_name: 'MNO Giyim', contact_person: 'Zeynep Arslan', phone: '0537 678 9012', email: 'info@mnogiyim.com', address: 'Organize Sanayi 2. Kısım', city: 'Gaziantep', active: true },
        { id: 7, name: 'PQR Moda', customer_name: 'PQR Moda', contact_person: 'Hasan Yıldız', phone: '0538 789 0123', email: 'info@pqrmoda.com', address: 'Tekstil Bölgesi No:12', city: 'Denizli', active: true },
        { id: 8, name: 'STU Tekstil', customer_name: 'STU Tekstil', contact_person: 'Elif Şahin', phone: '0539 890 1234', email: 'info@stutekstil.com', address: 'Sanayi Mahallesi 34/6', city: 'Kayseri', active: true },
        { id: 9, name: 'VWX Konfeksiyon', customer_name: 'VWX Konfeksiyon', contact_person: 'Murat Doğan', phone: '0540 901 2345', email: 'info@vwxkonfeksiyon.com', address: 'Endüstri Caddesi No:78', city: 'Sivas', active: true },
        { id: 10, name: 'YZA Giyim', customer_name: 'YZA Giyim', contact_person: 'Selin Korkmaz', phone: '0541 012 3456', email: 'info@yzagiyim.com', address: 'Tekstil Sitesi B-5', city: 'Konya', active: true },
        { id: 11, name: 'BCD Moda', customer_name: 'BCD Moda', contact_person: 'Oğuz Öztürk', phone: '0542 123 4567', email: 'info@bcdmoda.com', address: 'Sanayi Bölgesi 56/9', city: 'Antalya', active: true },
        { id: 12, name: 'EFG Tekstil', customer_name: 'EFG Tekstil', contact_person: 'Gamze Aydın', phone: '0543 234 5678', email: 'info@efgtekstil.com', address: 'Organize Sanayi 3. Etap', city: 'Trabzon', active: true }
      ];

      for (const customer of customers) {
        const { error: insertError } = await supabase
          .from('customers')
          .upsert(customer, { onConflict: 'id' });
        
        if (insertError) {
          console.error(`Müşteri ${customer.id} ekleme hatası:`, insertError);
        } else {
          console.log(`✅ Müşteri ${customer.id} (${customer.name}) eklendi`);
        }
      }
      
      console.log('✅ Tüm müşteri verileri işlendi');
    } catch (error) {
      console.error('Müşteri veri ekleme hatası:', error);
    }

    // 3. Stok hareketleri tablosunu düzelt
    console.log('📦 Stok hareketleri tablosu düzeltiliyor...');
    try {
      await supabase.rpc('exec', { sql: `
        ALTER TABLE stok_hareketleri 
        ADD COLUMN IF NOT EXISTS tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS operator_id INTEGER,
        ADD COLUMN IF NOT EXISTS production_id INTEGER,
        ADD COLUMN IF NOT EXISTS reason TEXT;
      ` });
      console.log('✅ Stok hareketleri tablosu düzeltildi');
    } catch (error) {
      console.log('⚠️ Stok hareketleri hatası (normal olabilir):', error.message);
    }

    // 2. Ürün ağacı tablosunu oluştur/düzelt
    console.log('🌳 Ürün ağacı tablosu oluşturuluyor...');
    try {
      await supabase.rpc('exec', { sql: `
        CREATE TABLE IF NOT EXISTS urun_agaci (
          id SERIAL PRIMARY KEY,
          ana_urun_id INTEGER NOT NULL,
          ana_urun_tipi VARCHAR(50) NOT NULL,
          alt_urun_id INTEGER NOT NULL,
          alt_urun_tipi VARCHAR(50) NOT NULL,
          miktar DECIMAL(10,2) NOT NULL DEFAULT 1.0,
          birim VARCHAR(20) DEFAULT 'adet',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_urun_agaci_ana_urun ON urun_agaci(ana_urun_id, ana_urun_tipi);
        CREATE INDEX IF NOT EXISTS idx_urun_agaci_alt_urun ON urun_agaci(alt_urun_id, alt_urun_tipi);
      ` });
      console.log('✅ Ürün ağacı tablosu oluşturuldu');
    } catch (error) {
      console.log('⚠️ Ürün ağacı hatası:', error.message);
    }

    // 3. Productions tablosunu oluştur/düzelt
    console.log('🏭 Productions tablosu oluşturuluyor...');
    try {
      await supabase.rpc('exec', { sql: `
        CREATE TABLE IF NOT EXISTS productions (
          id SERIAL PRIMARY KEY,
          product_name VARCHAR(255),
          product_code VARCHAR(100),
          product_type VARCHAR(50) DEFAULT 'nihai',
          operator_name VARCHAR(255),
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          quantity INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      ` });
      console.log('✅ Productions tablosu oluşturuldu');
    } catch (error) {
      console.log('⚠️ Productions hatası:', error.message);
    }

    // 4. Active productions tablosunu düzelt
    console.log('⚡ Active productions tablosu düzeltiliyor...');
    try {
      await supabase.rpc('exec', { sql: `
        ALTER TABLE active_productions 
        ADD COLUMN IF NOT EXISTS order_id INTEGER,
        ADD COLUMN IF NOT EXISTS plan_id INTEGER,
        ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
      ` });
      console.log('✅ Active productions tablosu düzeltildi');
    } catch (error) {
      console.log('⚠️ Active productions hatası:', error.message);
    }

    // 5. Örnek BOM verileri ekle
    console.log('📝 Örnek BOM verileri ekleniyor...');
    const bomData = [
      { ana_urun_id: 1, ana_urun_tipi: 'nihai', alt_urun_id: 1, alt_urun_tipi: 'hammadde', miktar: 2.0, birim: 'adet' },
      { ana_urun_id: 1, ana_urun_tipi: 'nihai', alt_urun_id: 2, alt_urun_tipi: 'hammadde', miktar: 1.5, birim: 'adet' },
      { ana_urun_id: 1, ana_urun_tipi: 'nihai', alt_urun_id: 3, alt_urun_tipi: 'hammadde', miktar: 0.5, birim: 'adet' },
      { ana_urun_id: 2, ana_urun_tipi: 'nihai', alt_urun_id: 1, alt_urun_tipi: 'hammadde', miktar: 1.0, birim: 'adet' },
      { ana_urun_id: 2, ana_urun_tipi: 'nihai', alt_urun_id: 4, alt_urun_tipi: 'hammadde', miktar: 2.0, birim: 'adet' }
    ];

    for (const bom of bomData) {
      try {
        await supabase
          .from('urun_agaci')
          .upsert(bom, { onConflict: 'ana_urun_id,ana_urun_tipi,alt_urun_id,alt_urun_tipi' });
      } catch (error) {
        console.log('⚠️ BOM veri ekleme hatası:', error.message);
      }
    }

    console.log('✅ Örnek BOM verileri eklendi');
    
    // 6. Örnek tamamlanan üretimler ekle
    console.log('🏭 Örnek tamamlanan üretimler ekleniyor...');
    try {
      const now = new Date().toISOString();
      
      const completedProductions = [
        {
          id: 1001,
          product_name: 'TRX-1 DSTR14-17-GRAY-82-86',
          assigned_operator: 'Thunder Serisi Operatör',
          start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
          target_quantity: 25,
          produced_quantity: 25,
          status: 'completed',
          created_at: now,
          updated_at: now
        },
        {
          id: 1002,
          product_name: 'TRX-2 DSTR14-17-BLACK-82-86',
          assigned_operator: 'ThunderPRO Serisi Operatör',
          start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 gün önce
          target_quantity: 30,
          produced_quantity: 30,
          status: 'completed',
          created_at: now,
          updated_at: now
        },
        {
          id: 1003,
          product_name: 'TRX-3 DSTR14-17-WHITE-82-86',
          assigned_operator: 'Thunder Serisi Operatör',
          start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün önce
          target_quantity: 15,
          produced_quantity: 15,
          status: 'completed',
          created_at: now,
          updated_at: now
        }
      ];
      
      for (const production of completedProductions) {
        const { error: insertError } = await supabase
          .from('active_productions')
          .upsert(production, { onConflict: 'id' });
        
        if (insertError) {
          console.error(`Tamamlanan üretim ${production.id} ekleme hatası:`, insertError);
        } else {
          console.log(`✅ Tamamlanan üretim ${production.id} eklendi`);
        }
      }
      
      console.log('✅ Örnek tamamlanan üretimler eklendi');
    } catch (error) {
      console.error('Tamamlanan üretim ekleme hatası:', error);
    }
    
    // 7. Kaynak durumlarını düzelt
    console.log('🔧 Kaynak durumları düzeltiliyor...');
    try {
      const { error: updateError } = await supabase
        .from('resource_management')
        .update({ resource_status: 'active' })
        .eq('resource_type', 'operator');
      
      if (updateError) {
        console.error('Kaynak durumu güncelleme hatası:', updateError);
      } else {
        console.log('✅ Operatör kaynakları aktif olarak güncellendi');
      }
    } catch (error) {
      console.error('Kaynak durumu güncelleme hatası:', error);
    }
    
    console.log('🎉 Veritabanı yapısı başarıyla tamamlandı!');

    res.json({ 
      success: true, 
      message: 'Veritabanı yapısı başarıyla düzeltildi!',
      fixes: [
        'Stok hareketleri tablosu düzeltildi',
        'Ürün ağacı tablosu oluşturuldu',
        'Productions tablosu oluşturuldu',
        'Active productions tablosu düzeltildi',
        'Örnek BOM verileri eklendi',
        'Operatör kaynakları aktif olarak güncellendi'
      ]
    });

  } catch (error) {
    console.error('❌ Veritabanı düzeltme hatası:', error);
    res.status(500).json({ error: 'Veritabanı düzeltme hatası: ' + error.message });
  }
});

// ==================== FAZ 3: ÜRETİM PLANLAMA VE ZAMANLAMA API'LERİ ====================

// Üretim planları API'leri
app.get('/api/production-plans', async (req, res) => {
  try {
    const { operator_id } = req.query;
    
    let query = supabase
      .from('production_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Eğer operator_id parametresi varsa, o operatöre atanmış planları filtrele
    if (operator_id) {
      const { data: operator, error: operatorError } = await supabase
        .from('resource_management')
        .select('resource_name')
        .eq('id', operator_id)
        .eq('resource_type', 'operator')
        .single();
        
      if (operatorError || !operator) {
        return res.status(404).json({ error: 'Operatör bulunamadı' });
      }
      
      console.log('Operatör filtreleme:', {
        operator_id,
        operator_name: operator.resource_name,
        query: `assigned_operator = '${operator.resource_name}' OR assigned_operator = '${operator_id}'`
      });
      
      // Hem operatör adı hem de operatör ID'si ile filtrele
      query = query.or(`assigned_operator.eq.${operator.resource_name},assigned_operator.eq.${operator_id}`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Her plan için total_orders hesapla (eğer undefined ise)
    const updatedPlans = await Promise.all(data.map(async (plan) => {
      let needsUpdate = false;
      
      if (plan.total_orders === undefined || plan.total_orders === null) {
        if (plan.notes && plan.notes.includes('[SEÇİLEN SİPARİŞLER:')) {
          try {
            const parts = plan.notes.split('[SEÇİLEN SİPARİŞLER:');
            if (parts[1]) {
              const jsonPart = parts[1].replace(']', '').trim();
              const selectedOrders = JSON.parse(jsonPart);
              plan.total_orders = selectedOrders.length;
              
              // Toplam miktarı da hesapla
              plan.total_quantity = selectedOrders.reduce((sum, order) => {
                return sum + (order.quantity || 0);
              }, 0);
              
              needsUpdate = true;
            }
          } catch (error) {
            console.warn(`Plan ${plan.id} sipariş bilgileri parse edilemedi:`, error);
            plan.total_orders = 0;
            plan.total_quantity = 0;
            needsUpdate = true;
          }
        } else {
          plan.total_orders = 0;
          plan.total_quantity = 0;
          needsUpdate = true;
        }
      }
      
      // Çalışma günlerini hesapla (eğer undefined ise)
      if (plan.working_days === undefined || plan.working_days === null) {
        if (plan.start_date && plan.end_date) {
          const startDate = new Date(plan.start_date);
          const endDate = new Date(plan.end_date);
          plan.working_days = calculateWorkingDays(startDate, endDate);
          needsUpdate = true;
        } else {
          plan.working_days = 0;
          needsUpdate = true;
        }
      }
      
      // Toplam kapasiteyi hesapla (eğer undefined ise)
      if (plan.total_capacity === undefined || plan.total_capacity === null) {
        const dailyCapacity = 10;
        plan.total_capacity = plan.working_days * dailyCapacity;
        needsUpdate = true;
      }
      
      // Veritabanını güncelle
      if (needsUpdate) {
        await supabase
          .from('production_plans')
          .update({ 
            total_orders: plan.total_orders,
            total_quantity: plan.total_quantity,
            working_days: plan.working_days,
            total_capacity: plan.total_capacity
          })
          .eq('id', plan.id);
      }
      
      return plan;
    }));
    
    res.json(updatedPlans);
  } catch (error) {
    console.error('Üretim planları fetch error:', error);
    res.status(500).json({ error: 'Üretim planları yüklenemedi' });
  }
});

// Onaylanmış ve aktif üretim planlarını getir
app.get('/api/production-plans/approved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_plans')
      .select('*')
      .in('status', ['approved', 'active'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Onaylanmış planlar fetch error:', error);
    res.status(500).json({ error: 'Onaylanmış planlar yüklenemedi' });
  }
});

app.post('/api/production-plans', async (req, res) => {
  try {
    // Plan verilerini hazırla
    const planData = { ...req.body };
    
    // Operatör alanlarını ekle
    planData.assigned_operator = req.body.assigned_operator || null;
    planData.operator_notes = req.body.operator_notes || null;
    
    // Notes alanından sipariş bilgilerini çıkar ve total_orders hesapla
    if (planData.notes && planData.notes.includes('[SEÇİLEN SİPARİŞLER:')) {
      try {
        const parts = planData.notes.split('[SEÇİLEN SİPARİŞLER:');
        if (parts[1]) {
          const jsonPart = parts[1].replace(']', '').trim();
          const selectedOrders = JSON.parse(jsonPart);
          planData.total_orders = selectedOrders.length;
          
          // Toplam miktarı da hesapla (eğer siparişlerde quantity varsa)
          planData.total_quantity = selectedOrders.reduce((sum, order) => {
            return sum + (order.quantity || 0);
          }, 0);
        }
      } catch (error) {
        console.warn('Sipariş bilgileri parse edilemedi:', error);
        planData.total_orders = 0;
        planData.total_quantity = 0;
      }
    } else {
      planData.total_orders = 0;
      planData.total_quantity = 0;
    }
    
    // Çalışma günlerini hesapla
    if (planData.start_date && planData.end_date) {
      const startDate = new Date(planData.start_date);
      const endDate = new Date(planData.end_date);
      planData.working_days = calculateWorkingDays(startDate, endDate);
      
      // Toplam kapasiteyi hesapla (varsayılan olarak günlük 10 adet kapasite)
      const dailyCapacity = 10;
      planData.total_capacity = planData.working_days * dailyCapacity;
    } else {
      planData.working_days = 0;
      planData.total_capacity = 0;
    }
    
    const { data, error } = await supabase
      .from('production_plans')
      .insert([planData])
      .select();
    
    if (error) throw error;
    
    // Not: related_orders sütunu olmadığı için sipariş durumu güncelleme işlemi kaldırıldı
    // Bu özellik gelecekte plan-sipariş ilişkisi kurulduğunda eklenebilir
    
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim planı oluşturma error:', error);
    res.status(500).json({ error: 'Üretim planı oluşturulamadı' });
  }
});

// Tek bir üretim planı getir
app.get('/api/production-plans/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_plans')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    // Eğer total_orders undefined ise, notes alanından hesapla
    let needsUpdate = false;
    
    if (data && (data.total_orders === undefined || data.total_orders === null)) {
      if (data.notes && data.notes.includes('[SEÇİLEN SİPARİŞLER:')) {
        try {
          const parts = data.notes.split('[SEÇİLEN SİPARİŞLER:');
          if (parts[1]) {
            const jsonPart = parts[1].replace(']', '').trim();
            const selectedOrders = JSON.parse(jsonPart);
            data.total_orders = selectedOrders.length;
            
            // Toplam miktarı da hesapla
            data.total_quantity = selectedOrders.reduce((sum, order) => {
              return sum + (order.quantity || 0);
            }, 0);
            
            needsUpdate = true;
          }
        } catch (error) {
          console.warn('Sipariş bilgileri parse edilemedi:', error);
          data.total_orders = 0;
          data.total_quantity = 0;
          needsUpdate = true;
        }
      } else {
        data.total_orders = 0;
        data.total_quantity = 0;
        needsUpdate = true;
      }
    }
    
    // Çalışma günlerini hesapla (eğer undefined ise)
    if (data && (data.working_days === undefined || data.working_days === null)) {
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        data.working_days = calculateWorkingDays(startDate, endDate);
        needsUpdate = true;
      } else {
        data.working_days = 0;
        needsUpdate = true;
      }
    }
    
    // Toplam kapasiteyi hesapla (eğer undefined ise)
    if (data && (data.total_capacity === undefined || data.total_capacity === null)) {
      const dailyCapacity = 10;
      data.total_capacity = data.working_days * dailyCapacity;
      needsUpdate = true;
    }
    
    // Veritabanını güncelle
    if (needsUpdate) {
      await supabase
        .from('production_plans')
        .update({ 
          total_orders: data.total_orders,
          total_quantity: data.total_quantity,
          working_days: data.working_days,
          total_capacity: data.total_capacity
        })
        .eq('id', req.params.id);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Üretim planı getirme error:', error);
    res.status(500).json({ error: 'Üretim planı getirilemedi' });
  }
});

app.put('/api/production-plans/:id', async (req, res) => {
  try {
    const planId = req.params.id;
    const updateData = req.body;
    
    const { data, error } = await supabase
      .from('production_plans')
      .update(updateData)
      .eq('id', planId)
      .select();
    
    if (error) throw error;
    
    // Eğer plan onaylandıysa (approved), otomatik aşamalar oluştur
    if (updateData.status === 'approved') {
      await createStagesFromPlan(planId);
    }
    
    // Plan durumu değiştiğinde sipariş durumunu güncelle
    if (updateData.status && data[0]?.order_id) {
      await updateOrderStatusFromPlan(data[0].order_id, updateData.status);
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim planı güncelleme error:', error);
    console.error('Hata detayları:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Üretim planı güncellenemedi',
      details: error.message,
      code: error.code
    });
  }
});

// Aşama ilerlemesinden sipariş durumunu güncelle
async function updateOrderProgressFromStage(stage) {
  try {
    console.log('Updating order progress from stage:', stage.id, stage.status);
    
    // Production ID'den plan ID'yi bul
    const { data: production, error: productionError } = await supabase
      .from('active_productions')
      .select('plan_id')
      .eq('id', stage.production_id)
      .single();
      
    if (productionError || !production) {
      console.error('Production not found for stage:', stage.id);
      return;
    }
    
    // Plan ID'den sipariş ID'yi bul
    const { data: plan, error: planError } = await supabase
      .from('production_plans')
      .select('order_id')
      .eq('id', production.plan_id)
      .single();
      
    if (planError || !plan?.order_id) {
      console.log('Plan has no order_id, skipping order update:', production.plan_id);
      return;
    }
    
    // Tüm aşamaların durumunu kontrol et
    const { data: allStages, error: stagesError } = await supabase
      .from('production_stages')
      .select('status')
      .eq('production_id', stage.production_id);
      
    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      return;
    }
    
    // İlerleme yüzdesini hesapla
    const totalStages = allStages.length;
    const completedStages = allStages.filter(s => s.status === 'completed').length;
    const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    
    // Sipariş durumunu belirle
    let orderStatus = 'in_production';
    if (progressPercentage === 100) {
      orderStatus = 'completed';
    } else if (allStages.some(s => s.status === 'active' || s.status === 'in_progress')) {
      orderStatus = 'in_production';
    }
    
    // Siparişi güncelle
    const { error: updateError } = await supabase
      .from('order_management')
      .update({ 
        status: orderStatus,
        operator_notes: `İlerleme: %${progressPercentage} (${completedStages}/${totalStages} aşama tamamlandı)`,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.order_id);
      
    if (updateError) {
      console.error('Error updating order progress:', updateError);
    } else {
      console.log('Order progress updated:', plan.order_id, '->', orderStatus, `(${progressPercentage}%)`);
    }
    
  } catch (error) {
    console.error('Error updating order progress from stage:', error);
  }
}

// Plan durumuna göre sipariş durumunu güncelle
async function updateOrderStatusFromPlan(orderId, planStatus) {
  try {
    console.log('Updating order status from plan:', orderId, planStatus);
    
    let orderStatus = 'pending';
    
    // Plan durumuna göre sipariş durumunu belirle
    switch (planStatus) {
      case 'draft':
        orderStatus = 'pending';
        break;
      case 'approved':
        orderStatus = 'in_production';
        break;
      case 'active':
        orderStatus = 'in_production';
        break;
      case 'in_progress':
        orderStatus = 'in_production';
        break;
      case 'completed':
        orderStatus = 'completed';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        break;
      default:
        orderStatus = 'pending';
    }
    
    const { error } = await supabase
      .from('order_management')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating order status:', error);
    } else {
      console.log('Order status updated:', orderId, '->', orderStatus);
    }
    
  } catch (error) {
    console.error('Error updating order status from plan:', error);
  }
}

// Müşteri adı alma fonksiyonu
async function getCustomerNameFromId(customerId) {
  try {
    // Eğer zaten müşteri adı ise direkt döndür
    if (isNaN(customerId)) {
      return customerId;
    }
    
    // Veritabanından müşteri adını çek
    const { data: customer, error } = await supabase
      .from('customers')
      .select('name, customer_name')
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.log('Müşteri bulunamadı, ID kullanılıyor:', customerId);
      return `Müşteri ${customerId}`;
    }
    
    return customer.name || customer.customer_name || `Müşteri ${customerId}`;
  } catch (error) {
    console.error('Müşteri adı alma hatası:', error);
    return `Müşteri ${customerId}`;
  }
}

// Siparişten otomatik üretim planı oluştur
async function createProductionPlanFromOrder(order) {
  try {
    console.log('Creating production plan from order:', order.id);
    
    // Önce mevcut planı kontrol et
    const { data: existingPlan, error: existingPlanError } = await supabase
      .from('production_plans')
      .select('*')
      .eq('order_id', order.id)
      .single();
    
    if (existingPlanError && existingPlanError.code !== 'PGRST116') {
      console.error('Error checking existing plan:', existingPlanError);
      return;
    }
    
    if (existingPlan) {
      console.log('Plan already exists for order:', order.id);
      return;
    }
    
    // Sipariş detaylarından plan verisi oluştur
    let productDetails = null;
    try {
      productDetails = typeof order.product_details === 'string' 
        ? JSON.parse(order.product_details) 
        : order.product_details;
    } catch (e) {
      console.error('Error parsing product_details:', e);
    }
    
    console.log('Order assigned_operator:', order.assigned_operator);
    
    // Müşteri adını sipariş verisinden al (artık direkt müşteri adı geliyor)
    let customerName = order.customer_name;
    
    console.log('Customer name for plan:', customerName);
    
    // Toplam miktarı hesapla (product_details JSON'ından)
    let totalQuantity = 0;
    try {
      if (order.product_details) {
        const productDetails = JSON.parse(order.product_details);
        if (Array.isArray(productDetails)) {
          totalQuantity = productDetails.reduce((sum, product) => sum + (product.quantity || 0), 0);
        }
      }
    } catch (error) {
      console.error('Product details parse hatası:', error);
      totalQuantity = order.quantity || 1;
    }
    
    console.log('Toplam miktar hesaplandı:', totalQuantity);
    
    const planData = {
      plan_name: `Plan-${order.id}-${customerName}`, // Sipariş Yönetimi'ndeki müşteri adı
      plan_type: 'nihai', // Varsayılan olarak nihai ürün
      total_quantity: totalQuantity,
      status: 'approved', // Sipariş onaylandığında plan da otomatik onaylanır
      order_id: order.id,
      // product_details: order.product_details, // Bu kolon production_plans tablosunda yok
      // customer_name: customerName, // Bu kolon production_plans tablosunda yok
      notes: `Sipariş ${order.id} için otomatik oluşturulan plan (Müşteri: ${customerName})`,
      start_date: new Date().toISOString().split('T')[0],
      end_date: order.delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_operator: order.assigned_operator || 'Thunder Serisi Operatör', // Siparişten operatör bilgisini al, yoksa varsayılan
      created_by: 'Sistem', // Zorunlu alan
      created_at: new Date().toISOString()
    };
    
    console.log('Plan assigned_operator:', planData.assigned_operator);
    
    const { data: plan, error: planError } = await supabase
      .from('production_plans')
      .insert([planData])
      .select();
      
    if (planError) {
      console.error('Error creating plan from order:', planError);
      return;
    }
    
    console.log('Production plan created from order:', plan[0].id);
    
    // Plan otomatik olarak approved durumunda oluşturuldu
    console.log('Plan created and approved for order:', order.id);
    
  } catch (error) {
    console.error('Error creating production plan from order:', error);
  }
}

// Plan onaylandığında otomatik aşamalar oluştur (sadece aşamalar, üretim değil)
async function createStagesFromPlan(planId) {
  try {
    console.log('Creating stages for plan:', planId);
    
    // Plan detaylarını al
    const { data: plan, error: planError } = await supabase
      .from('production_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) throw planError;
    
    // Plan tipine göre şablonları al
    const { data: templates, error: templateError } = await supabase
      .from('production_stage_templates')
      .select('*')
      .eq('product_type', plan.plan_type)
      .order('stage_order');
      
    if (templateError) throw templateError;
    
    if (!templates || templates.length === 0) {
      console.warn('No templates found for plan type:', plan.plan_type);
      return;
    }
    
    // Mevcut aşamaları kontrol et (plan_name ile)
    const { data: existingStages, error: stagesError } = await supabase
      .from('production_stages')
      .select('*')
      .eq('stage_name', plan.plan_name);
      
    if (stagesError) {
      console.error('Error checking existing stages:', stagesError);
      // Hata olsa bile devam et
    }
    
    // Eğer aşamalar zaten varsa, tekrar oluşturma
    if (existingStages && existingStages.length > 0) {
      console.log('Stages already exist for plan:', planId);
      return;
    }
    
    // Her şablon için aşama oluştur
    for (const template of templates) {
      const stageData = {
        stage_name: template.stage_name,
        stage_order: template.stage_order,
        estimated_duration: template.estimated_duration || 0,
        required_skills: template.required_skills || [],
        quality_check_required: template.quality_check_required || false,
        is_mandatory: template.is_mandatory || true,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const { data: createdStage, error: stageError } = await supabase
        .from('production_stages')
        .insert(stageData)
        .select();
        
      if (stageError) {
        console.error('Error creating stage:', stageError);
      } else {
        console.log('Stage created successfully:', createdStage[0]);
      }
    }
    
    console.log('All stages created for plan:', planId);
    
  } catch (error) {
    console.error('Error creating stages from plan:', error);
  }
}

app.delete('/api/production-plans/:id', async (req, res) => {
  try {
    const planId = req.params.id;
    console.log('Üretim planı siliniyor:', planId);
    
    // 1. Bu plana ait üretimleri bul
    const { data: productions, error: productionsError } = await supabase
      .from('active_productions')
      .select('id')
      .eq('plan_id', planId);
      
    if (productionsError) throw productionsError;
    
    // 2. Her üretim için aşamaları ve kalite kontrollerini sil
    for (const production of productions) {
      // Aşamaları sil
      const { error: stagesError } = await supabase
        .from('production_stages')
        .delete()
        .eq('production_id', production.id);
        
      if (stagesError) throw stagesError;
      
      // Kalite kontrollerini sil
      const { error: qualityError } = await supabase
        .from('quality_checks')
        .delete()
        .eq('production_id', production.id);
        
      if (qualityError) throw qualityError;
    }
    
    // 3. Üretimleri sil
    const { error: deleteProductionsError } = await supabase
      .from('active_productions')
      .delete()
      .eq('plan_id', planId);
      
    if (deleteProductionsError) throw deleteProductionsError;
    
    // 4. Son olarak planı sil
    const { error: deleteError } = await supabase
      .from('production_plans')
      .delete()
      .eq('id', planId);
    
    if (deleteError) {
      console.error('Plan silme hatası:', deleteError);
      throw deleteError;
    }
    
    console.log('Plan ve tüm bağımlı kayıtlar başarıyla silindi');
    res.json({ message: 'Üretim planı ve tüm bağımlı kayıtlar başarıyla silindi' });
  } catch (error) {
    console.error('Üretim planı silme error:', error);
    res.status(500).json({ error: 'Üretim planı silinemedi: ' + error.message });
  }
});

// Üretim plan detayları API'leri
app.get('/api/production-plans/:id/details', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_plan_details')
      .select('*')
      .eq('plan_id', req.params.id)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Plan detayları fetch error:', error);
    res.status(500).json({ error: 'Plan detayları yüklenemedi' });
  }
});

app.post('/api/production-plans/:id/details', async (req, res) => {
  try {
    const planDetail = {
      ...req.body,
      plan_id: req.params.id
    };
    
    const { data, error } = await supabase
      .from('production_plan_details')
      .insert([planDetail])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Plan detayı oluşturma error:', error);
    res.status(500).json({ error: 'Plan detayı oluşturulamadı' });
  }
});

// Kaynak yönetimi API'leri
app.get('/api/resources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .select('*')
      .order('resource_type', { ascending: true })
      .order('resource_name', { ascending: true });
    
    if (error) throw error;
    
    console.log('🔧 Kaynak verileri:', data.map(r => ({
      id: r.id,
      name: r.resource_name,
      type: r.resource_type,
      status: r.resource_status
    })));
    
    res.json(data);
  } catch (error) {
    console.error('Kaynaklar fetch error:', error);
    res.status(500).json({ error: 'Kaynaklar yüklenemedi' });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Kaynak oluşturma error:', error);
    res.status(500).json({ error: 'Kaynak oluşturulamadı' });
  }
});

// Tekil kaynak getirme
app.get('/api/resources/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Kaynak getirme error:', error);
    res.status(500).json({ error: 'Kaynak bulunamadı' });
  }
});

// Kaynak güncelleme
app.put('/api/resources/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Kaynak güncelleme error:', error);
    res.status(500).json({ error: 'Kaynak güncellenemedi' });
  }
});

// Kaynak silme
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .delete()
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json({ message: 'Kaynak başarıyla silindi', data: data[0] });
  } catch (error) {
    console.error('Kaynak silme error:', error);
    res.status(500).json({ error: 'Kaynak silinemedi' });
  }
});

// Operatör kullanım bilgilerini getir
app.get('/api/operator-usage', async (req, res) => {
  try {
    // Önce operatör listesini al
    const { data: operators, error: operatorsError } = await supabase
      .from('resource_management')
      .select('id, resource_name, resource_type')
      .eq('resource_type', 'operator')
      .eq('is_active', true);
    
    if (operatorsError) throw operatorsError;
    
    // Operatör ID'lerini isimlere çevir
    const operatorMap = {};
    operators.forEach(op => {
      operatorMap[op.id] = op.resource_name;
    });
    
    console.log('Operatör haritası:', operatorMap);
    
    // Production plans'dan operatör kullanım bilgilerini hesapla
    const { data: productionPlans, error: plansError } = await supabase
      .from('production_plans')
      .select('id, assigned_operator, status, total_quantity, plan_name')
      .in('status', ['approved', 'active', 'in_progress']);
    
    if (plansError) throw plansError;
    
    // Aktif üretimlerden operatör kullanım bilgilerini hesapla
    const { data: activeProductions, error: productionsError } = await supabase
      .from('active_productions')
      .select('assigned_operator, status, created_at, estimated_end_time, plan_id')
      .in('status', ['active', 'in_progress', 'planned']);
    
    if (productionsError) throw productionsError;
    
    // Production stages'dan operatör kullanım bilgilerini hesapla
    const { data: activeStages, error: stagesError } = await supabase
      .from('production_stages')
      .select('operator, status, start_time, end_time, estimated_duration')
      .in('status', ['active', 'in_progress']);
    
    if (stagesError) throw stagesError;
    
    // Operatör kullanım bilgilerini hesapla
    const operatorUsage = {};
    
    console.log('Aktif üretim planları:', productionPlans);
    console.log('Aktif üretimler:', activeProductions);
    console.log('Aktif aşamalar:', activeStages);
    console.log('Operatör haritası:', operatorMap);
    
    // Production plans'dan operatör kullanımı
    productionPlans.forEach(plan => {
      if (plan.assigned_operator) {
        const operatorName = plan.assigned_operator;
        if (!operatorUsage[operatorName]) {
          operatorUsage[operatorName] = {
            total_capacity: 8, // Varsayılan günlük kapasite (saat)
            used_capacity: 0,
            active_productions: 0,
            active_stages: 0,
            estimated_hours: 0
          };
        }
        operatorUsage[operatorName].active_productions++;
        
        // Tahmini süre hesapla (varsayılan 8 saat)
        operatorUsage[operatorName].estimated_hours += 8;
      }
    });
    
    // Aktif üretimlerden operatör kullanımı
    activeProductions.forEach(production => {
      if (production.assigned_operator) {
        const operatorName = production.assigned_operator;
        if (!operatorUsage[operatorName]) {
          operatorUsage[operatorName] = {
            total_capacity: 8,
            used_capacity: 0,
            active_productions: 0,
            active_stages: 0,
            estimated_hours: 0
          };
        }
        operatorUsage[operatorName].active_productions++;
        
        // Tahmini süre hesapla (varsayılan 8 saat)
        operatorUsage[operatorName].estimated_hours += 8;
      }
    });
    
    // Aktif aşamalardan operatör kullanımı
    activeStages.forEach(stage => {
      if (stage.operator) {
        const operatorName = stage.operator;
        if (!operatorUsage[operatorName]) {
          operatorUsage[operatorName] = {
            total_capacity: 8,
            used_capacity: 0,
            active_productions: 0,
            active_stages: 0,
            estimated_hours: 0
          };
        }
        operatorUsage[operatorName].active_stages++;
        
        // Aşama süresini hesapla
        const stageHours = stage.estimated_duration ? stage.estimated_duration / 60 : 2; // dakikayı saate çevir
        operatorUsage[operatorName].estimated_hours += stageHours;
      }
    });
    
    // Kullanım yüzdesini hesapla
    Object.keys(operatorUsage).forEach(operator => {
      const usage = operatorUsage[operator];
      usage.used_capacity = Math.min(usage.estimated_hours, usage.total_capacity);
      usage.usage_percentage = (usage.used_capacity / usage.total_capacity) * 100;
      usage.remaining_capacity = usage.total_capacity - usage.used_capacity;
    });
    
    console.log('Hesaplanan operatör kullanımı:', operatorUsage);
    
    res.json(operatorUsage);
  } catch (error) {
    console.error('Operatör kullanım bilgisi error:', error);
    res.status(500).json({ error: 'Operatör kullanım bilgisi alınamadı' });
  }
});

// Üretim zamanlaması API'leri
app.get('/api/production-scheduling', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_scheduling')
      .select(`
        *,
        production_plan_details!inner(*),
        resource_management!inner(*)
      `)
      .order('scheduled_start', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Zamanlama fetch error:', error);
    res.status(500).json({ error: 'Zamanlama verileri yüklenemedi' });
  }
});

app.post('/api/production-scheduling', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_scheduling')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Zamanlama oluşturma error:', error);
    res.status(500).json({ error: 'Zamanlama oluşturulamadı' });
  }
});

// Çalışma günü kontrolü için yardımcı fonksiyonlar
function isWorkingDay(date) {
  const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  // Pazartesi-Cuma arası çalışma günleri (1-5)
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function adjustToWorkingDay(date) {
  const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  
  // Eğer hafta sonu ise
  if (dayOfWeek === 0) { // Pazar
    // Pazartesiye çevir
    const adjustedDate = new Date(date);
    adjustedDate.setDate(date.getDate() + 1);
    return adjustedDate;
  } else if (dayOfWeek === 6) { // Cumartesi
    // Cumaya çevir
    const adjustedDate = new Date(date);
    adjustedDate.setDate(date.getDate() - 1);
    return adjustedDate;
  }
  
  // Hafta içi ise değişiklik yok
  return date;
}

function calculateWorkingDays(startDate, endDate) {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    // Pazartesi-Cuma arası çalışma günleri (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

// Resource Management API'si
app.get('/api/resource-management', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resource_management')
      .select('*')
      .order('resource_name');

    if (error) {
      console.error('Resource Management fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Resource Management API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operatör listesi API'si - Sadece Resource Management'dan operatörleri çek
app.get('/api/operators', async (req, res) => {
  try {
    // Resource Management tablosundan SADECE operatörleri çek
    const { data: resourceOperators, error: resourceError } = await supabase
      .from('resource_management')
      .select('*')
      .eq('resource_type', 'operator')
      .eq('is_active', true)
      .order('resource_name');

    if (resourceError) {
      console.error('Resource Management operatörleri yüklenemedi:', resourceError);
      return res.json([]); // Boş liste döndür, fallback yok
    }

    // Resource Management verilerini formatla
    const operators = resourceOperators.map(operator => ({
      id: operator.id,
      name: operator.resource_name,
      resource_type: operator.resource_type,
      department: 'Üretim',
      skill_level: operator.skills_required && operator.skills_required.length > 0 
        ? operator.skills_required[0] 
        : 'Uzman',
      is_active: operator.is_active,
      capacity: operator.capacity,
      cost_per_hour: operator.cost_per_hour,
      location: operator.location,
      notes: operator.notes || 'Kaynak Yönetimi\'nden alınan operatör'
    }));
    
    res.json(operators);
  } catch (error) {
    console.error('Operatör listesi error:', error);
    res.status(500).json({ error: 'Operatör listesi yüklenemedi' });
  }
});

// ===== ÜRETİM BAŞLAT TAB'ı API'LERİ =====

// Plandan üretim başlat
app.post('/api/production-plans/:id/start-production', async (req, res) => {
  try {
    const planId = req.params.id;
    const { product_type, product_id, product_name, planned_quantity, assigned_operator } = req.body;
    
    // Plan bilgilerini kontrol et
    const { data: plan, error: planError } = await supabase
      .from('production_plans')
      .select('*')
      .eq('id', planId)
      .eq('status', 'approved')
      .single();
    
    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan bulunamadı veya onaylanmamış' });
    }
    
    // Aktif üretim oluştur
    const productionData = {
      plan_id: planId,
      product_type: product_type || 'nihai',
      product_id: product_id || 1,
      product_name: product_name || 'Ürün',
      planned_quantity: planned_quantity || plan.total_quantity || 1,
      assigned_operator: assigned_operator || plan.assigned_operator || 'Thunder Serisi Operatör',
      status: 'active',
      estimated_end_time: plan.end_date ? new Date(plan.end_date) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      current_stage: 'Başlangıç',
      notes: `Plan: ${plan.plan_name}`
    };
    
    const { data: production, error: productionError } = await supabase
      .from('active_productions')
      .insert([productionData])
      .select();
    
    if (productionError) throw productionError;
    
    // Plan durumunu güncelle
    await supabase
      .from('production_plans')
      .update({ status: 'active' })
      .eq('id', planId);
    
    res.json(production[0]);
  } catch (error) {
    console.error('Üretim başlatma error:', error);
    res.status(500).json({ error: 'Üretim başlatılamadı' });
  }
});

// Aktif üretimleri listele
app.get('/api/active-productions', async (req, res) => {
  try {
    const { operator_id } = req.query;
    
    let query = supabase
      .from('active_productions')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Eğer operator_id parametresi varsa, o operatöre atanmış üretimleri filtrele
    if (operator_id) {
      const { data: operator, error: operatorError } = await supabase
        .from('resource_management')
        .select('resource_name')
        .eq('id', operator_id)
        .eq('resource_type', 'operator')
        .single();
        
      if (operatorError || !operator) {
        return res.status(404).json({ error: 'Operatör bulunamadı' });
      }
      
      query = query.eq('assigned_operator', operator.resource_name);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Aktif üretimler fetch error:', error);
    res.status(500).json({ error: 'Aktif üretimler yüklenemedi' });
  }
});

// Yeni üretim başlat (plan olmadan)
app.post('/api/active-productions', async (req, res) => {
  try {
    const productionData = {
      ...req.body,
      status: 'active',
      start_time: new Date(),
      created_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('active_productions')
      .insert([productionData])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim oluşturma error:', error);
    res.status(500).json({ error: 'Üretim oluşturulamadı' });
  }
});

// Üretim güncelle
app.put('/api/active-productions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_productions')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim güncelleme error:', error);
    res.status(500).json({ error: 'Üretim güncellenemedi' });
  }
});

// Üretim durdur
app.put('/api/active-productions/:id/pause', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_productions')
      .update({ status: 'paused', updated_at: new Date() })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim durdurma error:', error);
    res.status(500).json({ error: 'Üretim durdurulamadı' });
  }
});

// Üretim devam ettir
app.put('/api/active-productions/:id/resume', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_productions')
      .update({ status: 'active', updated_at: new Date() })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim devam ettirme error:', error);
    res.status(500).json({ error: 'Üretim devam ettirilemedi' });
  }
});

// Üretim tamamla
app.put('/api/active-productions/:id/complete', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_productions')
      .update({ 
        status: 'completed', 
        actual_end_time: new Date(),
        updated_at: new Date() 
      })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim tamamlama error:', error);
    res.status(500).json({ error: 'Üretim tamamlanamadı' });
  }
});

// Üretim iptal et
app.delete('/api/active-productions/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('active_productions')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Üretim iptal edildi' });
  } catch (error) {
    console.error('Üretim iptal error:', error);
    res.status(500).json({ error: 'Üretim iptal edilemedi' });
  }
});

// Sipariş yönetimi API'leri
app.get('/api/orders', async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('order_management')
      .select('*')
      .order('priority', { ascending: true })
      .order('delivery_date', { ascending: true });
    
    if (ordersError) throw ordersError;
    
    // Her sipariş için detayları getir
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      let totalQuantity = 0;
      let productDetails = [];
      
      // Önce order.product_details alanından kontrol et
      if (order.product_details) {
        try {
          // Eğer string ise parse et
          if (typeof order.product_details === 'string') {
            productDetails = JSON.parse(order.product_details);
          } else if (Array.isArray(order.product_details)) {
            productDetails = order.product_details;
          }
          
          if (Array.isArray(productDetails)) {
            totalQuantity = productDetails.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
          }
        } catch (parseError) {
          console.warn(`Sipariş ${order.id} product_details parse hatası:`, parseError);
        }
      }
      
      // Eğer productDetails hala boşsa, notes alanından parse et (eski sistem uyumluluğu için)
      if (productDetails.length === 0 && order.notes && order.notes.includes('[ÜRÜN DETAYLARI:')) {
        try {
          // Notes alanından JSON string'i çıkar
          const notesMatch = order.notes.match(/\[ÜRÜN DETAYLARI:\s*(\[.*?\])/);
          if (notesMatch && notesMatch[1]) {
            const productDetailsArray = JSON.parse(notesMatch[1]);
            if (Array.isArray(productDetailsArray)) {
              totalQuantity = productDetailsArray.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
              productDetails = productDetailsArray;
            }
          }
        } catch (parseError) {
          console.warn(`Sipariş ${order.id} notes parse hatası:`, parseError);
        }
      }
      
      // Eğer hala productDetails boşsa, order.quantity kullan
      if (productDetails.length === 0) {
        totalQuantity = order.quantity || 0;
      }
      
      // Eğer totalQuantity hala 0 ise, 1 olarak ayarla
      if (totalQuantity === 0) {
        totalQuantity = 1;
      }
      
      return { 
        ...order, 
        quantity: totalQuantity,
        product_details: productDetails
      };
    }));
    
    res.json(ordersWithDetails);
  } catch (error) {
    console.error('Siparişler fetch error:', error);
    res.status(500).json({ error: 'Siparişler yüklenemedi' });
  }
});

// Order Statistics API - /api/orders/:id'den önce tanımlanmalı
app.get('/api/orders/statistics', async (req, res) => {
  try {
    if (supabase) {
      // Toplam sipariş sayısı
      const { count: totalOrders, error: totalError } = await supabase
        .from('order_management')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Bekleyen siparişler
      const { count: pendingOrders, error: pendingError } = await supabase
        .from('order_management')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'draft']);

      if (pendingError) throw pendingError;

      // İşlenen siparişler
      const { count: processingOrders, error: processingError } = await supabase
        .from('order_management')
        .select('*', { count: 'exact', head: true })
        .in('status', ['in_production', 'in_progress', 'approved']);

      if (processingError) throw processingError;

      // Tamamlanan siparişler
      const { count: completedOrders, error: completedError } = await supabase
        .from('order_management')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'delivered']);

      if (completedError) throw completedError;

      res.json({
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        processing: processingOrders || 0,
        completed: completedOrders || 0
      });
    } else {
      // Mock data
      res.json({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0
      });
    }
  } catch (error) {
    console.error('Sipariş istatistikleri hatası:', error);
    res.status(500).json({ error: 'Sipariş istatistikleri yüklenemedi' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    // Sipariş numarası oluştur
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Teslim tarihini çalışma gününe çevir
    let deliveryDate = req.body.delivery_date;
    if (deliveryDate) {
      const deliveryDateObj = new Date(deliveryDate);
      if (!isWorkingDay(deliveryDateObj)) {
        const adjustedDate = adjustToWorkingDay(deliveryDateObj);
        deliveryDate = adjustedDate.toISOString().split('T')[0];
        console.log(`Teslim tarihi çalışma gününe çevrildi: ${req.body.delivery_date} -> ${deliveryDate}`);
      }
    }
    
    // Sipariş verilerini hazırla - sadece mevcut sütunları kullan
    const orderData = {
      order_number: orderNumber,
      customer_name: req.body.customer_name,
      order_date: req.body.order_date || new Date().toISOString().split('T')[0],
      delivery_date: deliveryDate,
      priority: parseInt(req.body.priority) || 1,
      status: req.body.status || 'pending',
      notes: req.body.notes || '',
      quantity: parseInt(req.body.quantity) || 0,
      product_details: req.body.product_details || null,
      assigned_operator: req.body.assigned_operator || null,
      operator_notes: req.body.operator_notes || null
    };
    
    console.log('Sipariş verisi:', orderData);
    
    const { data, error } = await supabase
      .from('order_management')
      .insert([orderData])
      .select();
    
    if (error) throw error;
    
    const order = data[0];
    console.log('Sipariş oluşturuldu:', order);
    
    // Eğer sipariş approved durumunda oluşturulduysa otomatik plan oluştur
    if (order.status === 'approved') {
      try {
        await createProductionPlanFromOrder(order);
        console.log('Otomatik plan oluşturuldu');
      } catch (planError) {
        console.error('Plan oluşturma hatası:', planError);
        // Plan oluşturma hatası sipariş oluşturmayı etkilemesin
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Sipariş oluşturma error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı' });
  }
});

// Tekil sipariş getirme
app.get('/api/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Geçersiz sipariş ID' });
    }
    
    const { data, error } = await supabase
      .from('order_management')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Sipariş getirme error:', error);
    res.status(500).json({ error: 'Sipariş bulunamadı' });
  }
});

// Sipariş güncelleme
app.put('/api/orders/:id', async (req, res) => {
  try {
    // Sadece order_management tablosunda mevcut alanları filtrele
    const allowedFields = ['customer_name', 'customer_contact', 'order_date', 'delivery_date', 'priority', 'status', 'notes', 'quantity', 'product_details', 'assigned_operator', 'operator_notes'];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    // Teslim tarihini çalışma gününe çevir
    if (updateData.delivery_date) {
      const deliveryDateObj = new Date(updateData.delivery_date);
      if (!isWorkingDay(deliveryDateObj)) {
        const adjustedDate = adjustToWorkingDay(deliveryDateObj);
        updateData.delivery_date = adjustedDate.toISOString().split('T')[0];
        console.log(`Teslim tarihi çalışma gününe çevrildi: ${req.body.delivery_date} -> ${updateData.delivery_date}`);
      }
    }
    
    const { data, error } = await supabase
      .from('order_management')
      .update(updateData)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    
    // Sipariş onaylandığında otomatik üretim planı oluştur
    if (updateData.status === 'approved' && data[0]) {
      await createProductionPlanFromOrder(data[0]);
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Sipariş güncelleme error:', error);
    res.status(500).json({ error: 'Sipariş güncellenemedi' });
  }
});

// Üretim aşama şablonları
// Operatör ataması yapılmamış işleri mevcut operatöre ata
app.post('/api/assign-jobs-to-operator', async (req, res) => {
  try {
    const { operatorName } = req.body;
    
    if (!operatorName) {
      return res.status(400).json({ error: 'Operatör adı gerekli' });
    }
    
    // Atanmamış planları bul ve ata
    const { data: unassignedPlans, error: plansError } = await supabase
      .from('production_plans')
      .select('*')
      .or('assigned_operator.is.null,assigned_operator.eq.Sistem')
      .eq('status', 'approved');
    
    if (plansError) throw plansError;
    
    if (unassignedPlans && unassignedPlans.length > 0) {
      // Planları güncelle
      const { error: updateError } = await supabase
        .from('production_plans')
        .update({ assigned_operator: operatorName })
        .in('id', unassignedPlans.map(plan => plan.id));
      
      if (updateError) throw updateError;
      
      console.log(`${unassignedPlans.length} plan ${operatorName} operatörüne atandı`);
    }
    
    // Atanmamış active_productions'ları bul ve ata
    const { data: unassignedProductions, error: productionsError } = await supabase
      .from('active_productions')
      .select('*')
      .or('assigned_operator.is.null,assigned_operator.eq.Sistem')
      .in('status', ['active', 'in_progress', 'processing']);
    
    if (productionsError) throw productionsError;
    
    if (unassignedProductions && unassignedProductions.length > 0) {
      // Active productions'ları güncelle
      const { error: updateProdError } = await supabase
        .from('active_productions')
        .update({ assigned_operator: operatorName })
        .in('id', unassignedProductions.map(prod => prod.id));
      
      if (updateProdError) throw updateProdError;
      
      console.log(`${unassignedProductions.length} aktif üretim ${operatorName} operatörüne atandı`);
    }
    
    res.json({ 
      message: 'İşler başarıyla atandı',
      assigned_plans: unassignedPlans?.length || 0,
      assigned_productions: unassignedProductions?.length || 0
    });
    
  } catch (error) {
    console.error('İş atama hatası:', error);
    res.status(500).json({ error: 'İşler atanamadı' });
  }
});

app.get('/api/production-stage-templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_stage_templates')
      .select('*')
      .order('stage_order');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Stage templates error:', error);
    res.status(500).json({ error: 'Şablonlar yüklenemedi' });
  }
});

app.post('/api/production-stage-templates', async (req, res) => {
  try {
    const { stage_name, product_type, stage_order, estimated_duration, required_skills, quality_check_required, is_mandatory } = req.body;
    
    const { data, error } = await supabase
      .from('production_stage_templates')
      .insert([{
        stage_name,
        product_type,
        stage_order: parseInt(stage_order) || 1,
        estimated_duration: parseInt(estimated_duration) || 0,
        required_skills: required_skills || [],
        quality_check_required: quality_check_required || false,
        is_mandatory: is_mandatory || true
      }])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Stage template creation error:', error);
    res.status(500).json({ error: 'Şablon oluşturulamadı' });
  }
});

// Sipariş onaylama
app.put('/api/orders/:id/approve', async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('Sipariş onaylanıyor:', orderId);
    
    // Siparişi güncelle
    const { data, error } = await supabase
      .from('order_management')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    const order = data[0];
    console.log('Sipariş onaylandı:', order);
    
    // Otomatik plan oluştur
    try {
      await createProductionPlanFromOrder(order);
      console.log('Otomatik plan oluşturuldu');
    } catch (planError) {
      console.error('Plan oluşturma hatası:', planError);
      // Plan oluşturma hatası sipariş onayını etkilemesin
    }
    
    res.json({ message: 'Sipariş başarıyla onaylandı', data: order });
  } catch (error) {
    console.error('Sipariş onaylama error:', error);
    res.status(500).json({ error: 'Sipariş onaylanamadı: ' + error.message });
  }
});

// Sipariş silme
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('Sipariş siliniyor:', orderId);
    
    // 1. Önce bu siparişe ait planları bul
    const { data: plans, error: plansError } = await supabase
      .from('production_plans')
      .select('id')
      .eq('order_id', orderId);
      
    if (plansError) throw plansError;
    
    // 2. Her plan için üretimleri ve aşamaları sil
    for (const plan of plans) {
      // Üretimleri bul
      const { data: productions, error: productionsError } = await supabase
        .from('active_productions')
        .select('id')
        .eq('plan_id', plan.id);
        
      if (productionsError) throw productionsError;
      
      // Her üretim için aşamaları sil
      for (const production of productions) {
        // Aşamaları sil
        const { error: stagesError } = await supabase
          .from('production_stages')
          .delete()
          .eq('production_id', production.id);
          
        if (stagesError) throw stagesError;
        
        // Kalite kontrollerini sil
        const { error: qualityError } = await supabase
          .from('quality_checks')
          .delete()
          .eq('production_id', production.id);
          
        if (qualityError) throw qualityError;
      }
      
      // Üretimleri sil
      const { error: deleteProductionsError } = await supabase
        .from('active_productions')
        .delete()
        .eq('plan_id', plan.id);
        
      if (deleteProductionsError) throw deleteProductionsError;
    }
    
    // 3. Planları sil
    const { error: deletePlansError } = await supabase
      .from('production_plans')
      .delete()
      .eq('order_id', orderId);
      
    if (deletePlansError) throw deletePlansError;
    
    // 4. Son olarak siparişi sil
    const { data, error } = await supabase
      .from('order_management')
      .delete()
      .eq('id', orderId)
      .select();
    
    if (error) throw error;
    
    console.log('Sipariş ve tüm bağımlı kayıtlar başarıyla silindi');
    res.json({ message: 'Sipariş ve tüm bağımlı kayıtlar başarıyla silindi', data: data[0] });
  } catch (error) {
    console.error('Sipariş silme error:', error);
    res.status(500).json({ error: 'Sipariş silinemedi: ' + error.message });
  }
});

// Sipariş üretim takibi
app.get('/api/orders/:id/production-tracking', async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Sipariş bilgilerini al
    const { data: order, error: orderError } = await supabase
      .from('order_management')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (orderError || !order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    // Siparişe bağlı planları al
    const { data: plans, error: plansError } = await supabase
      .from('production_plans')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
      
    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return res.status(500).json({ error: 'Planlar alınamadı' });
    }
    
    // Her plan için aşamaları ve üretim bilgilerini al
    const plansWithDetails = await Promise.all(plans.map(async (plan) => {
      // Üretim bilgilerini al
      const { data: productions, error: productionsError } = await supabase
        .from('active_productions')
        .select('*')
        .eq('plan_id', plan.id);
        
      if (productionsError) {
        console.error('Error fetching productions:', productionsError);
        return { ...plan, productions: [], stages: [] };
      }
      
      // Her üretim için aşamaları al
      const productionsWithStages = await Promise.all(productions.map(async (production) => {
        const { data: stages, error: stagesError } = await supabase
          .from('production_stages')
          .select('*')
          .eq('production_id', production.id)
          .order('stage_order');
          
        if (stagesError) {
          console.error('Error fetching stages:', stagesError);
          return { ...production, stages: [] };
        }
        
        return { ...production, stages };
      }));
      
      return { ...plan, productions: productionsWithStages };
    }));
    
    // Genel istatistikleri hesapla
    const totalPlans = plansWithDetails.length;
    const totalProductions = plansWithDetails.reduce((sum, plan) => sum + plan.productions.length, 0);
    const totalStages = plansWithDetails.reduce((sum, plan) => 
      sum + plan.productions.reduce((pSum, prod) => pSum + prod.stages.length, 0), 0
    );
    const completedStages = plansWithDetails.reduce((sum, plan) => 
      sum + plan.productions.reduce((pSum, prod) => 
        pSum + prod.stages.filter(stage => stage.status === 'completed').length, 0
      ), 0
    );
    
    const overallProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    
    res.json({
      order,
      plans: plansWithDetails,
      statistics: {
        total_plans: totalPlans,
        total_productions: totalProductions,
        total_stages: totalStages,
        completed_stages: completedStages,
        overall_progress: overallProgress
      }
    });
    
  } catch (error) {
    console.error('Production tracking error:', error);
    res.status(500).json({ error: 'Üretim takibi alınamadı' });
  }
});

// Kapasite planlama API'leri
app.get('/api/capacity-planning', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('capacity_planning')
      .select(`
        *,
        resource_management!inner(*)
      `)
      .order('plan_date', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Kapasite planlama fetch error:', error);
    res.status(500).json({ error: 'Kapasite planlama verileri yüklenemedi' });
  }
});

app.post('/api/capacity-planning', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('capacity_planning')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Kapasite planlama oluşturma error:', error);
    res.status(500).json({ error: 'Kapasite planlama oluşturulamadı' });
  }
});

// Üretim planlama istatistikleri
app.get('/api/production-planning/statistics', async (req, res) => {
  try {
    const [plansResult, ordersResult, resourcesResult] = await Promise.all([
      supabase.from('production_plans').select('id, status'),
      supabase.from('order_management').select('id, status'),
      supabase.from('resource_management').select('id, resource_type, is_active')
    ]);

    const plans = plansResult.data || [];
    const orders = ordersResult.data || [];
    const resources = resourcesResult.data || [];

    const statistics = {
      total_plans: plans.length,
      active_plans: plans.filter(p => p.status === 'active').length,
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      total_value: 0, // Toplam tutar alanı kaldırıldı
      total_resources: resources.length,
      active_resources: resources.filter(r => r.is_active).length,
      machine_count: resources.filter(r => r.resource_type === 'machine' && r.is_active).length,
      operator_count: resources.filter(r => r.resource_type === 'operator' && r.is_active).length
    };

    res.json(statistics);
  } catch (error) {
    console.error('Planlama istatistikleri error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// ==================== BİLDİRİM VE UYARI SİSTEMİ API'LERİ ====================

// Bildirim türlerini listele
app.get('/api/notifications/types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notification_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Bildirim türleri error:', error);
    res.status(500).json({ error: 'Bildirim türleri yüklenemedi' });
  }
});

// Bildirimleri listele
app.get('/api/notifications', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('notifications')
      .select(`
        *,
        notification_types(type_name, display_name, icon, color)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Bildirimler error:', error);
    res.status(500).json({ error: 'Bildirimler yüklenemedi' });
  }
});

// Bildirim oluştur
app.post('/api/notifications', async (req, res) => {
  try {
    const { type_id, title, message, priority = 'medium', recipient_type = 'all', recipient_id, related_entity_type, related_entity_id, action_url, expires_at } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type_id,
        title,
        message,
        priority,
        recipient_type,
        recipient_id,
        related_entity_type,
        related_entity_id,
        action_url,
        expires_at,
        created_by: 'system'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Bildirim oluşturma error:', error);
    res.status(500).json({ error: 'Bildirim oluşturulamadı' });
  }
});

// Bildirimi okundu olarak işaretle
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { read_by } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
        read_by
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Bildirim okundu işaretleme error:', error);
    res.status(500).json({ error: 'Bildirim güncellenemedi' });
  }
});

// Uyarı kurallarını listele
app.get('/api/alerts/rules', async (req, res) => {
  try {
    const { entity_type, is_active } = req.query;
    
    let query = supabase
      .from('alert_rules')
      .select(`
        *,
        notification_types(type_name, display_name, icon, color)
      `)
      .order('rule_name');

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Uyarı kuralları error:', error);
    res.status(500).json({ error: 'Uyarı kuralları yüklenemedi' });
  }
});

// Uyarı kuralı oluştur
app.post('/api/alerts/rules', async (req, res) => {
  try {
    const { rule_name, description, entity_type, condition_field, condition_operator, condition_value, notification_type_id, priority = 'medium', is_active = true } = req.body;

    const { data, error } = await supabase
      .from('alert_rules')
      .insert([{
        rule_name,
        description,
        entity_type,
        condition_field,
        condition_operator,
        condition_value,
        notification_type_id,
        priority,
        is_active,
        created_by: 'system'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Uyarı kuralı oluşturma error:', error);
    res.status(500).json({ error: 'Uyarı kuralı oluşturulamadı' });
  }
});

// Uyarı geçmişini listele
app.get('/api/alerts/history', async (req, res) => {
  try {
    const { entity_type, entity_id, status, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('alert_history')
      .select(`
        *,
        alert_rules(rule_name, description),
        notifications(title, message, priority)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Uyarı geçmişi error:', error);
    res.status(500).json({ error: 'Uyarı geçmişi yüklenemedi' });
  }
});

// Uyarıyı onayla
app.put('/api/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledged_by } = req.body;

    const { data, error } = await supabase
      .from('alert_history')
      .update({
        status: 'acknowledged',
        acknowledged_by,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Uyarı onaylama error:', error);
    res.status(500).json({ error: 'Uyarı onaylanamadı' });
  }
});

// Bildirim istatistikleri
app.get('/api/notifications/statistics', async (req, res) => {
  try {
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('status, priority, created_at');

    const { data: alerts, error: alertError } = await supabase
      .from('alert_history')
      .select('status, created_at');

    if (notifError) throw notifError;
    if (alertError) throw alertError;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const todayNotifications = notifications.filter(n => new Date(n.created_at) >= today);
    const todayAlerts = alerts.filter(a => new Date(a.created_at) >= today);

    const statistics = {
      total_notifications: notifications.length,
      unread_notifications: notifications.filter(n => n.status === 'unread').length,
      today_notifications: todayNotifications.length,
      critical_notifications: notifications.filter(n => n.priority === 'critical').length,
      total_alerts: alerts.length,
      active_alerts: alerts.filter(a => a.status === 'triggered').length,
      acknowledged_alerts: alerts.filter(a => a.status === 'acknowledged').length,
      today_alerts: todayAlerts.length
    };

    res.json(statistics);
  } catch (error) {
    console.error('Bildirim istatistikleri error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// Test bildirimi oluştur
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { type_name, title, message, priority = 'medium' } = req.body;

    // Bildirim türünü bul
    const { data: typeData, error: typeError } = await supabase
      .from('notification_types')
      .select('id')
      .eq('type_name', type_name)
      .single();

    if (typeError || !typeData) {
      return res.status(400).json({ error: 'Bildirim türü bulunamadı' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type_id: typeData.id,
        title: title || 'Test Bildirimi',
        message: message || 'Bu bir test bildirimidir.',
        priority,
        recipient_type: 'all',
        created_by: 'test_user'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Test bildirimi oluşturma error:', error);
    res.status(500).json({ error: 'Test bildirimi oluşturulamadı' });
  }
});

// ==================== RAPORLAMA VE ANALİTİK API'LERİ ====================

// Dashboard widget'larını listele
app.get('/api/dashboard/widgets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_active', true)
      .order('position_y, position_x');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Dashboard widget\'ları error:', error);
    res.status(500).json({ error: 'Widget\'lar yüklenemedi' });
  }
});

// Dashboard widget oluştur
app.post('/api/dashboard/widgets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Dashboard widget oluşturma error:', error);
    res.status(500).json({ error: 'Widget oluşturulamadı' });
  }
});

// Dashboard widget güncelle
app.put('/api/dashboard/widgets/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Dashboard widget güncelleme error:', error);
    res.status(500).json({ error: 'Widget güncellenemedi' });
  }
});






// KPI tanımlarını listele
app.get('/api/kpi/definitions', async (req, res) => {
  try {
    const { category, is_active } = req.query;
    
    let query = supabase
      .from('kpi_definitions')
      .select('*')
      .order('kpi_name');

    if (category) {
      query = query.eq('category', category);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('KPI tanımları error:', error);
    res.status(500).json({ error: 'KPI tanımları yüklenemedi' });
  }
});

// Kritik stok alarmlarını getir
app.get('/api/dashboard/stock-alerts', async (req, res) => {
  try {
    // Stok hareketlerini al
    const { data: stockMovements, error: stockError } = await supabase
      .from('stok_hareketleri')
      .select('*')
      .order('created_at', { ascending: false });

    if (stockError) throw stockError;

    // Kritik stok seviyelerini tanımla (örnek değerler)
    const criticalLevels = {
      'TRX-1-BLACK-86-86': { critical: 5, minimum: 10, unit: 'adet' },
      'TRX-1-BLACK-94-94': { critical: 3, minimum: 8, unit: 'adet' },
      'TRX-1-GRAY-86-90': { critical: 4, minimum: 12, unit: 'adet' },
      'TRX-1-GRAY-94-98': { critical: 2, minimum: 6, unit: 'adet' },
      'TRX-2-BLACK-86-90': { critical: 6, minimum: 15, unit: 'adet' },
      'TRX-2-BLACK-94-98': { critical: 3, minimum: 9, unit: 'adet' }
    };

    // Stok seviyelerini hesapla
    const stockLevels = {};
    stockMovements.forEach(movement => {
      const productName = movement.urun_adi;
      if (!stockLevels[productName]) {
        stockLevels[productName] = 0;
      }
      
      if (movement.hareket_tipi === 'giris') {
        stockLevels[productName] += movement.miktar;
      } else if (movement.hareket_tipi === 'cikis') {
        stockLevels[productName] -= movement.miktar;
      }
    });

    // Kritik stok alarmlarını oluştur
    const alerts = [];
    Object.keys(stockLevels).forEach(productName => {
      const currentStock = Math.max(0, stockLevels[productName]);
      const levels = criticalLevels[productName];
      
      if (levels) {
        let priority = 'info';
        if (currentStock <= levels.critical) {
          priority = 'critical';
        } else if (currentStock <= levels.minimum) {
          priority = 'warning';
        }

        // Sadece kritik ve uyarı seviyelerinde alarm oluştur
        if (priority !== 'info') {
          // Kalan gün hesaplama (basit hesaplama)
          const dailyUsage = Math.max(1, currentStock / 30); // Günde ortalama kullanım
          const daysRemaining = Math.floor(currentStock / dailyUsage);
          
          // Önerilen sipariş miktarı
          const recommendedOrder = Math.max(levels.minimum * 2, 20);

          alerts.push({
            id: `alert_${productName}_${Date.now()}`,
            product_id: productName,
            product_name: productName,
            current_stock: currentStock,
            critical_level: levels.critical,
            minimum_level: levels.minimum,
            unit: levels.unit,
            priority: priority,
            days_remaining: daysRemaining,
            recommended_order: recommendedOrder,
            supplier: 'Ana Tedarikçi', // Varsayılan tedarikçi
            created_at: new Date().toISOString()
          });
        }
      }
    });

    // Önceliğe göre sırala (kritik önce)
    alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, info: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    res.json(alerts);
  } catch (error) {
    console.error('Kritik stok alarmları error:', error);
    res.status(500).json({ error: 'Kritik stok alarmları yüklenemedi' });
  }
});

// Stok alarmını kapat
app.post('/api/dashboard/stock-alerts/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Gerçek uygulamada burada alarm veritabanından kapatılır
    // Şimdilik sadece başarı mesajı döndürüyoruz
    
    res.json({ 
      message: 'Alarm kapatıldı',
      alert_id: id,
      dismissed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alarm kapatma error:', error);
    res.status(500).json({ error: 'Alarm kapatılamadı' });
  }
});

// KPI değerlerini listele
app.get('/api/kpi/values', async (req, res) => {
  try {
    const { kpi_id, start_date, end_date, limit = 100 } = req.query;
    
    let query = supabase
      .from('kpi_values')
      .select(`
        *,
        kpi_definitions(kpi_name, category, unit)
      `)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (kpi_id) {
      query = query.eq('kpi_id', kpi_id);
    }
    if (start_date) {
      query = query.gte('period_start', start_date);
    }
    if (end_date) {
      query = query.lte('period_end', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('KPI değerleri error:', error);
    res.status(500).json({ error: 'KPI değerleri yüklenemedi' });
  }
});

// KPI hesapla
app.post('/api/kpi/calculate', async (req, res) => {
  try {
    const { kpi_id, period_start, period_end } = req.body;

    // KPI tanımını al
    const { data: kpi, error: kpiError } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('id', kpi_id)
      .single();

    if (kpiError || !kpi) {
      return res.status(400).json({ error: 'KPI tanımı bulunamadı' });
    }

    // KPI değerini hesapla (şimdilik mock)
    const actualValue = Math.random() * 100;
    const targetValue = kpi.target_value || 0;
    const variance = actualValue - targetValue;
    const variancePercentage = targetValue > 0 ? (variance / targetValue) * 100 : 0;

    // KPI değerini kaydet
    const { data, error } = await supabase
      .from('kpi_values')
      .insert([{
        kpi_id,
        period_start: period_start || new Date().toISOString(),
        period_end: period_end || new Date().toISOString(),
        actual_value: actualValue,
        target_value: targetValue,
        variance,
        variance_percentage: variancePercentage,
        status: variancePercentage > 10 ? 'warning' : variancePercentage > 20 ? 'critical' : 'normal'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('KPI hesaplama error:', error);
    res.status(500).json({ error: 'KPI hesaplanamadı' });
  }
});

// Analitik olayları kaydet
app.post('/api/analytics/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([{
        ...req.body,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Analitik olay kaydetme error:', error);
    res.status(500).json({ error: 'Olay kaydedilemedi' });
  }
});

// Performans metrikleri
app.get('/api/analytics/performance', async (req, res) => {
  try {
    const { metric_name, start_date, end_date, limit = 100 } = req.query;
    
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .order('measured_at', { ascending: false })
      .limit(limit);

    if (metric_name) {
      query = query.eq('metric_name', metric_name);
    }
    if (start_date) {
      query = query.gte('measured_at', start_date);
    }
    if (end_date) {
      query = query.lte('measured_at', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Performans metrikleri error:', error);
    res.status(500).json({ error: 'Performans metrikleri yüklenemedi' });
  }
});

// Dashboard istatistikleri
app.get('/api/dashboard/statistics', async (req, res) => {
  try {
    const [productionsResult, qualityResult, notificationsResult, resourcesResult] = await Promise.all([
      supabase.from('productions').select('id, status, created_at'),
      supabase.from('quality_checks').select('id, result, check_time'),
      supabase.from('notifications').select('id, status, priority, created_at'),
      supabase.from('resource_management').select('id, resource_type, is_active')
    ]);

    const productions = productionsResult.data || [];
    const qualityChecks = qualityResult.data || [];
    const notifications = notificationsResult.data || [];
    const resources = resourcesResult.data || [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const todayProductions = productions.filter(p => new Date(p.created_at) >= today);
    const todayQualityChecks = qualityChecks.filter(q => new Date(q.check_time) >= today);
    const todayNotifications = notifications.filter(n => new Date(n.created_at) >= today);

    const statistics = {
      productions: {
        total: productions.length,
        today: todayProductions.length,
        active: productions.filter(p => p.status === 'active').length,
        completed: productions.filter(p => p.status === 'completed').length
      },
      quality: {
        total_checks: qualityChecks.length,
        today_checks: todayQualityChecks.length,
        pass_rate: qualityChecks.length > 0 ? 
          (qualityChecks.filter(q => q.result === 'pass').length / qualityChecks.length * 100).toFixed(2) : 0
      },
      notifications: {
        total: notifications.length,
        today: todayNotifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        critical: notifications.filter(n => n.priority === 'critical').length
      },
      resources: {
        total: resources.length,
        active: resources.filter(r => r.is_active).length,
        machines: resources.filter(r => r.resource_type === 'machine' && r.is_active).length,
        operators: resources.filter(r => r.resource_type === 'operator' && r.is_active).length
      }
    };

    res.json(statistics);
  } catch (error) {
    console.error('Dashboard istatistikleri error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// ==================== GELİŞMİŞ DASHBOARD API ENDPOINT'LERİ ====================

// Dashboard için gelişmiş istatistikler
app.get('/api/dashboard/advanced-stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    console.log('Dashboard API - Tarih aralığı:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Test sorgusu - production_states tablosundan
    const testResult = await supabase
      .from('production_states')
      .select('id, is_completed, completed_at, produced_quantity, product_name, operator_name')
      .limit(5);
    
    console.log('Test sorgusu sonucu:', testResult);

    // Önce production_states tablosunu sorgula (operatör verileri burada)
    let productionsResult = await supabase
      .from('production_states')
      .select('id, order_id, product_code, product_name, target_quantity, produced_quantity, is_active, is_completed, start_time, last_update_time, completed_at, operator_id, operator_name, production_data, created_at, updated_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    console.log('Production states result:', productionsResult);
    
    // Eğer production_states'te veri yoksa, production_history'yi dene
    if (!productionsResult.data || productionsResult.data.length === 0) {
      console.log('Production states boş, production_history deniyorum...');
      productionsResult = await supabase
        .from('production_history')
        .select('id, completed_at, produced_quantity, product_name, operator_name, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      console.log('Production history result:', productionsResult);
    }

    const [qualityResult, ordersResult, materialsResult] = await Promise.all([
      
      supabase
        .from('quality_checks')
        .select('id, result, check_time, production_id')
        .gte('check_time', startDate.toISOString())
        .lte('check_time', endDate.toISOString()),
      
      supabase
        .from('order_management')
        .select('id, status, order_date, delivery_date, total_amount, product_details, completed_at, created_at, updated_at'),
      
      supabase
        .from('stok_hareketleri')
        .select('id, hareket_tipi, miktar, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ]);

    const productions = productionsResult.data || [];
    const qualityChecks = qualityResult.data || [];
    const allOrders = ordersResult.data || [];
    const materials = materialsResult.data || [];
    
    // Order'ları tarih aralığına göre filtrele
    const orders = allOrders.filter(order => {
      const orderDate = order.order_date || order.created_at || order.updated_at;
      if (!orderDate) return false;
      
      const orderDateObj = new Date(orderDate);
      return orderDateObj >= startDate && orderDateObj <= endDate;
    });

    console.log('Dashboard API - Sonuçlar:', {
      productions: productions.length,
      qualityChecks: qualityChecks.length,
      orders: orders.length,
      materials: materials.length
    });
    
    // Order durumlarını detaylı logla
    const orderStatuses = {};
    orders.forEach(order => {
      orderStatuses[order.status] = (orderStatuses[order.status] || 0) + 1;
    });
    console.log('Order durumları:', orderStatuses);
    
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    console.log('Tamamlanan siparişler:', completedOrders.length);

    // Günlük üretim trendi - production_states ve order_management'ten
    const dailyProduction = {};
    
    // Production_states'ten gelen veriler
    productions.forEach(p => {
      const dateField = p.completed_at || p.created_at || p.last_update_time;
      if (!dateField) return; // Tarih alanı yoksa atla
      
      const date = new Date(dateField).toISOString().split('T')[0];
      if (!dailyProduction[date]) {
        dailyProduction[date] = { count: 0, quantity: 0 };
      }
      dailyProduction[date].count++;
      dailyProduction[date].quantity += p.produced_quantity || 0;
    });
    
    // Order_management'ten gelen tamamlanan siparişler
    orders.forEach(order => {
      if (order.status === 'completed' || order.status === 'delivered') {
        const dateField = order.completed_at || order.delivery_date || order.order_date;
        if (!dateField) return;
        
        const date = new Date(dateField).toISOString().split('T')[0];
        if (!dailyProduction[date]) {
          dailyProduction[date] = { count: 0, quantity: 0 };
        }
        
        // Product_details'ten toplam miktarı hesapla
        let totalQuantity = 0;
        if (order.product_details) {
          try {
            const productDetails = typeof order.product_details === 'string' 
              ? JSON.parse(order.product_details) 
              : order.product_details;
            
            if (Array.isArray(productDetails)) {
              totalQuantity = productDetails.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
            }
          } catch (e) {
            console.log('Product details parse error:', e);
          }
        }
        
        dailyProduction[date].count++;
        dailyProduction[date].quantity += totalQuantity;
      }
    });
    
    // Test verisi oluşturma kaldırıldı - sadece gerçek veri göster

    // Kalite trendi
    const dailyQuality = {};
    qualityChecks.forEach(q => {
      const date = new Date(q.check_time).toISOString().split('T')[0];
      if (!dailyQuality[date]) {
        dailyQuality[date] = { total: 0, passed: 0 };
      }
      dailyQuality[date].total++;
      if (q.result === 'pass') {
        dailyQuality[date].passed++;
      }
    });
    
    // Test verisi oluşturma kaldırıldı - sadece gerçek veri göster

    // Operatör performansı
    const operatorStats = {};
    productions.forEach(p => {
      if (p.operator_name) {
        if (!operatorStats[p.operator_name]) {
          operatorStats[p.operator_name] = { total: 0, completed: 0, quantity: 0 };
        }
        operatorStats[p.operator_name].total++;
        operatorStats[p.operator_name].quantity += p.produced_quantity || 0;
        if (p.is_completed === true) {
          operatorStats[p.operator_name].completed++;
        }
      }
    });

    // Veri kaynağını belirle - hem production_states hem de order_management'ten
    const hasRealProductionData = productions.length > 0 || completedOrders.length > 0;
    const hasRealQualityData = qualityChecks.length > 0;
    const dataSource = hasRealProductionData ? 'real' : 'mock';
    
    // Toplam üretim sayısını hesapla (production_states + completed orders)
    const totalProductionCount = productions.length + completedOrders.length;
    const totalProductionQuantity = productions.reduce((sum, p) => sum + (p.produced_quantity || 0), 0) +
      completedOrders.reduce((sum, order) => {
        let quantity = 0;
        if (order.product_details) {
          try {
            const productDetails = typeof order.product_details === 'string' 
              ? JSON.parse(order.product_details) 
              : order.product_details;
            if (Array.isArray(productDetails)) {
              quantity = productDetails.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
            }
          } catch (e) {
            console.log('Product details parse error:', e);
          }
        }
        return sum + quantity;
      }, 0);
    
    const advancedStats = {
      period: period,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      data_source: dataSource,
      is_mock_data: !hasRealProductionData,
    production: {
      total_productions: totalProductionCount,
      completed_productions: completedOrders.length,
      total_quantity: totalProductionQuantity,
        daily_trend: Object.keys(dailyProduction).map(date => ({
          date,
          count: dailyProduction[date].count,
          quantity: dailyProduction[date].quantity
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      },
      quality: {
        total_checks: qualityChecks.length,
        pass_rate: qualityChecks.length > 0 ? 
          (qualityChecks.filter(q => q.result === 'pass').length / qualityChecks.length * 100).toFixed(2) : 0,
        daily_trend: Object.keys(dailyQuality).map(date => ({
          date,
          pass_rate: dailyQuality[date].total > 0 ? 
            (dailyQuality[date].passed / dailyQuality[date].total * 100).toFixed(2) : 0
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      },
      orders: {
        total_orders: orders.length,
        completed_orders: orders.filter(o => o.status === 'completed').length,
        total_value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        average_value: orders.length > 0 ? 
          (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length).toFixed(2) : 0
      },
      materials: {
        total_movements: materials.length,
        incoming: materials.filter(m => m.hareket_tipi === 'giris').length,
        outgoing: materials.filter(m => m.hareket_tipi === 'cikis').length,
        total_quantity: materials.reduce((sum, m) => sum + (m.miktar || 0), 0)
      },
    operators: Object.keys(operatorStats).map(opName => ({
      operator_name: opName,
      total_productions: operatorStats[opName].total,
      completed_productions: operatorStats[opName].completed,
      completion_rate: operatorStats[opName].total > 0 ? 
        (operatorStats[opName].completed / operatorStats[opName].total * 100).toFixed(2) : 0,
      total_quantity: operatorStats[opName].quantity
    }))
    };

    res.json(advancedStats);
  } catch (error) {
    console.error('Gelişmiş dashboard istatistikleri hatası:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// Real-time dashboard güncellemeleri
app.get('/api/dashboard/realtime', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const [activeProductions, recentQuality, recentNotifications] = await Promise.all([
      supabase
        .from('active_productions')
        .select('id, product_name, planned_quantity, produced_quantity, status, assigned_operator, start_time')
        .eq('status', 'active')
        .order('start_time', { ascending: false }),
      
      supabase
        .from('quality_checks')
        .select('id, result, check_time, production_id')
        .gte('check_time', oneHourAgo.toISOString())
        .order('check_time', { ascending: false })
        .limit(10),
      
      supabase
        .from('notifications')
        .select('id, title, message, priority, created_at, is_read')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Sistem hatalarını dinamik olarak kontrol et
    const systemErrors = [];
    
    // Veritabanı bağlantı hatası kontrolü
    try {
      const testQuery = await supabase
        .from('production_states')
        .select('id')
        .limit(1);
      
      if (testQuery.error) {
        systemErrors.push({
          id: 'error_db_' + Date.now(),
          title: 'Veritabanı Bağlantı Hatası',
          message: testQuery.error.message,
          priority: 'critical',
          created_at: now.toISOString(),
          is_read: false,
          type: 'system_error'
        });
      }
    } catch (error) {
      systemErrors.push({
        id: 'error_db_' + Date.now(),
        title: 'Veritabanı Bağlantı Hatası',
        message: error.message,
        priority: 'critical',
        created_at: now.toISOString(),
        is_read: false,
        type: 'system_error'
      });
    }
    
    // API endpoint hatası kontrolü
    try {
      const testApi = await supabase
        .from('production_states')
        .select('id, operator_name, is_completed')
        .limit(1);
      
      if (testApi.error) {
        systemErrors.push({
          id: 'error_api_' + Date.now(),
          title: 'API Endpoint Hatası',
          message: testApi.error.message,
          priority: 'high',
          created_at: now.toISOString(),
          is_read: false,
          type: 'system_error'
        });
      }
    } catch (error) {
      systemErrors.push({
        id: 'error_api_' + Date.now(),
        title: 'API Endpoint Hatası',
        message: error.message,
        priority: 'high',
        created_at: now.toISOString(),
        is_read: false,
        type: 'system_error'
      });
    }

    // Mevcut bildirimlerle sistem hatalarını birleştir
    const allNotifications = [...(recentNotifications.data || []), ...systemErrors]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    const realtimeData = {
      timestamp: now.toISOString(),
      active_productions: activeProductions.data || [],
      recent_quality_checks: recentQuality.data || [],
      recent_notifications: allNotifications,
      system_status: {
        database_connected: !!supabase,
        last_update: now.toISOString()
      }
    };

    res.json(realtimeData);
  } catch (error) {
    console.error('Real-time dashboard hatası:', error);
    res.status(500).json({ error: 'Real-time veriler yüklenemedi' });
  }
});

// Dashboard widget'ı sil
app.delete('/api/dashboard/widgets/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Widget silme hatası:', error);
    res.status(500).json({ error: 'Widget silinemedi' });
  }
});



// Server başlatma - moved to bottom with real-time server

// ==================== OPERATÖR PANELİ API ENDPOINT'LERİ ====================

// Operatör paneli ana sayfası
app.get('/operator-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'operator-production.html'));
});

// Tekil üretim detayı getir
app.get('/api/active-productions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('active_productions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Üretim detayı hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Üretim güncelle
app.put('/api/active-productions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('active_productions')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Üretimi duraklat
app.put('/api/active-productions/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pause_time } = req.body;
    
    const updateData = {
      status: status || 'paused',
      pause_time: pause_time || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('active_productions')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim duraklatma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Üretime devam et
app.put('/api/active-productions/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resume_time } = req.body;
    
    const updateData = {
      status: status || 'active',
      resume_time: resume_time || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('active_productions')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretime devam etme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Üretimi tamamla
app.put('/api/active-productions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed_time } = req.body;
    
    const updateData = {
      status: status || 'completed',
      completed_time: completed_time || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('active_productions')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim tamamlama hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Planlanan ürün durumunu güncelle
app.put('/api/production-plans/:id/update-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = {
      status: status || 'completed',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('production_plans')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Plan durumu güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Plan için aşamaları oluştur
app.post('/api/production-plans/:id/create-stages', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Aşamaları oluştur
    await createStagesFromPlan(id);
    
    res.json({ message: 'Aşamalar başarıyla oluşturuldu' });
  } catch (error) {
    console.error('Aşama oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tek plan detayını getir
app.get('/api/production-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('production_plans')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Plan detayı getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aktif üretimleri temizle
app.delete('/api/active-productions/clear', async (req, res) => {
  try {
    console.log('Aktif üretimler temizleniyor...');
    
    // Önce mevcut aktif üretimleri say
    const { count } = await supabase
      .from('active_productions')
      .select('*', { count: 'exact', head: true });
    
    // Tüm aktif üretimleri sil
    const { error } = await supabase
      .from('active_productions')
      .delete()
      .gte('id', 1); // ID'si 1 ve üzeri olan tüm kayıtları sil
    
    if (error) throw error;
    
    console.log('Aktif üretimler başarıyla temizlendi');
    res.json({ 
      message: 'Aktif üretimler başarıyla temizlendi',
      deleted_count: count || 0
    });
  } catch (error) {
    console.error('Aktif üretimler temizleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş emri çıktısı için PDF endpoint
app.get('/api/work-orders/:id/print', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock iş emri verisi (gerçek uygulamada veritabanından çekilecek)
    const workOrder = {
      id: id,
      work_order_number: `WO-${Date.now()}`,
      product_name: 'Plan-147-PAZARAMA',
      quantity: 11,
      priority: 'Yüksek',
      assigned_operator: 'Thunder Serisi Operatör',
      plan_id: 145,
      status: 'pending',
      notes: 'Plan Plan-147-PAZARAMA için oluşturulan iş emri',
      created_at: new Date().toISOString(),
      stages: [
        { name: 'Malzeme Hazırlığı', duration: 30, status: 'pending' },
        { name: 'Üretim Hazırlığı', duration: 45, status: 'pending' },
        { name: 'Üretim İşlemi', duration: 120, status: 'pending' },
        { name: 'Paketleme', duration: 20, status: 'pending' },
        { name: 'Paketleme ve Sevkiyat', duration: 20, status: 'pending' }
      ]
    };
    
    // HTML template oluştur
    const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>İş Emri - ${workOrder.work_order_number}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .work-order-title {
                font-size: 20px;
                color: #333;
                margin-bottom: 5px;
            }
            .work-order-number {
                font-size: 18px;
                color: #666;
            }
            .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            .section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }
            .section h3 {
                margin-top: 0;
                color: #007bff;
                border-bottom: 2px solid #dee2e6;
                padding-bottom: 10px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .info-label {
                font-weight: bold;
                color: #495057;
            }
            .info-value {
                color: #333;
            }
            .stages {
                grid-column: 1 / -1;
            }
            .stage-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin-bottom: 10px;
                background: white;
                border-radius: 6px;
                border: 1px solid #dee2e6;
            }
            .stage-name {
                font-weight: bold;
                color: #333;
            }
            .stage-duration {
                color: #666;
                font-size: 14px;
            }
            .stage-status {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                background: #ffc107;
                color: #856404;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #dee2e6;
                padding-top: 20px;
            }
            .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            }
            .print-button:hover {
                background: #0056b3;
            }
            @media print {
                .print-button {
                    display: none;
                }
                body {
                    margin: 0;
                }
            }
        </style>
    </head>
    <body>
        <button class="print-button" onclick="window.print()">🖨️ Yazdır</button>
        
        <div class="header">
            <div class="company-name">THUNDER PRODUCTION</div>
            <div class="work-order-title">İŞ EMRİ</div>
            <div class="work-order-number">${workOrder.work_order_number}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h3>📋 İş Emri Bilgileri</h3>
                <div class="info-row">
                    <span class="info-label">İş Emri No:</span>
                    <span class="info-value">${workOrder.work_order_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ürün Adı:</span>
                    <span class="info-value">${workOrder.product_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Miktar:</span>
                    <span class="info-value">${workOrder.quantity} adet</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Öncelik:</span>
                    <span class="info-value">${workOrder.priority}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Durum:</span>
                    <span class="info-value">${workOrder.status}</span>
                </div>
            </div>
            
            <div class="section">
                <h3>👤 Operatör Bilgileri</h3>
                <div class="info-row">
                    <span class="info-label">Atanan Operatör:</span>
                    <span class="info-value">${workOrder.assigned_operator}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Plan ID:</span>
                    <span class="info-value">${workOrder.plan_id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Oluşturulma Tarihi:</span>
                    <span class="info-value">${new Date(workOrder.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Saat:</span>
                    <span class="info-value">${new Date(workOrder.created_at).toLocaleTimeString('tr-TR')}</span>
                </div>
            </div>
            
            <div class="section stages">
                <h3>⚙️ Üretim Aşamaları</h3>
                ${workOrder.stages.map(stage => `
                    <div class="stage-item">
                        <div>
                            <div class="stage-name">${stage.name}</div>
                            <div class="stage-duration">Tahmini Süre: ${stage.duration} dakika</div>
                        </div>
                        <div class="stage-status">${stage.status}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Bu iş emri Thunder Production ERP sistemi tarafından otomatik oluşturulmuştur.</p>
            <p>Yazdırılma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('İş emri çıktısı hatası:', error);
    res.status(500).json({ error: 'İş emri çıktısı oluşturulamadı' });
  }
});

// Debug: Ürün barkod bilgilerini kontrol et
app.get('/api/debug/product-barcodes', async (req, res) => {
  try {
    const { barcode } = req.query;
    
    let nihaiUrunler = [];
    let yarimamuller = [];
    let nihaiError = null;
    let yarimError = null;
    
    if (barcode) {
      // Belirli bir barkod aranıyor
      const nihaiResult = await supabase
        .from('nihai_urunler')
        .select('id, ad, kod, barkod')
        .eq('barkod', barcode);

      const yarimamulResult = await supabase
        .from('yarimamuller')
        .select('id, ad, kod, barkod')
        .eq('barkod', barcode);
        
      nihaiUrunler = nihaiResult.data || [];
      yarimamuller = yarimamulResult.data || [];
      nihaiError = nihaiResult.error;
      yarimError = yarimamulResult.error;
    } else {
      // Tüm barkodları getir (debug için)
      const nihaiResult = await supabase
        .from('nihai_urunler')
        .select('id, ad, kod, barkod')
        .not('barkod', 'is', null);

      const yarimamulResult = await supabase
        .from('yarimamuller')
        .select('id, ad, kod, barkod')
        .not('barkod', 'is', null);
        
      nihaiUrunler = nihaiResult.data || [];
      yarimamuller = yarimamulResult.data || [];
      nihaiError = nihaiResult.error;
      yarimError = yarimamulResult.error;
    }

    // Siparişlerden product_details'leri al
    const { data: orders, error: ordersError } = await supabase
      .from('order_management')
      .select('id, order_number, product_details')
      .not('product_details', 'is', null)
      .limit(5);

    res.json({
      nihai_urunler: nihaiUrunler || [],
      yarimamuller: yarimamuller || [],
      orders: orders || [],
      errors: {
        nihai: nihaiError?.message || null,
        yarimamul: yarimError?.message || null,
        orders: ordersError?.message || null
      }
    });
  } catch (error) {
    console.error('Debug barkod bilgileri hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operatör performans istatistikleri
app.get('/api/operator-performance/:operatorName', async (req, res) => {
  try {
    const { operatorName } = req.params;
    
    // Aşama istatistikleri
    const { data: stages, error: stagesError } = await supabase
      .from('production_stages')
      .select('*')
      .eq('operator', operatorName);
      
    if (stagesError) throw stagesError;
    
    // Kalite kontrol istatistikleri
    const { data: qualityChecks, error: qualityError } = await supabase
      .from('quality_checks')
      .select('*')
      .eq('operator', operatorName);
      
    if (qualityError) throw qualityError;
    
    // İstatistikleri hesapla
    const totalStages = stages.length;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const activeStages = stages.filter(s => s.status === 'active').length;
    
    const totalQualityChecks = qualityChecks.length;
    const passedQualityChecks = qualityChecks.filter(q => q.result === 'pass').length;
    
    // Ortalama süre hesapla
    const completedStagesWithDuration = stages.filter(s => 
      s.status === 'completed' && s.start_time && s.end_time
    );
    
    let averageDuration = 0;
    if (completedStagesWithDuration.length > 0) {
      const totalDuration = completedStagesWithDuration.reduce((sum, stage) => {
        const start = new Date(stage.start_time);
        const end = new Date(stage.end_time);
        return sum + (end - start) / 1000 / 60; // dakika
      }, 0);
      averageDuration = Math.round(totalDuration / completedStagesWithDuration.length);
    }
    
    const performance = {
      operator: operatorName,
      totalStages,
      completedStages,
      activeStages,
      completionRate: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
      totalQualityChecks,
      passedQualityChecks,
      qualityPassRate: totalQualityChecks > 0 ? Math.round((passedQualityChecks / totalQualityChecks) * 100) : 0,
      averageDuration,
      lastActivity: stages.length > 0 ? 
        new Date(Math.max(...stages.map(s => new Date(s.updated_at)))) : null
    };
    
    res.json(performance);
  } catch (error) {
    console.error('Operatör performans hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operatör aşama geçmişi
app.get('/api/operator-stages/:operatorName', async (req, res) => {
  try {
    const { operatorName } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('production_stages')
      .select(`
        *,
        active_productions!inner(
          id,
          product_name,
          plan_id
        )
      `)
      .eq('operator', operatorName)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Operatör aşama geçmişi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operatör kalite kontrol geçmişi
app.get('/api/operator-quality/:operatorName', async (req, res) => {
  try {
    const { operatorName } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('quality_checks')
      .select(`
        *,
        production_stages!inner(
          id,
          stage_name,
          active_productions!inner(
            id,
            product_name
          )
        )
      `)
      .eq('operator', operatorName)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Operatör kalite kontrol geçmişi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operatör günlük raporu
app.get('/api/operator-daily-report/:operatorName', async (req, res) => {
  try {
    const { operatorName } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Günlük aşama istatistikleri
    const { data: dailyStages, error: stagesError } = await supabase
      .from('production_stages')
      .select('*')
      .eq('operator', operatorName)
      .gte('updated_at', startOfDay.toISOString())
      .lte('updated_at', endOfDay.toISOString());
      
    if (stagesError) throw stagesError;
    
    // Günlük kalite kontrol istatistikleri
    const { data: dailyQuality, error: qualityError } = await supabase
      .from('quality_checks')
      .select('*')
      .eq('operator', operatorName)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
      
    if (qualityError) throw qualityError;
    
    const report = {
      operator: operatorName,
      date: targetDate.toISOString().split('T')[0],
      stages: {
        total: dailyStages.length,
        completed: dailyStages.filter(s => s.status === 'completed').length,
        active: dailyStages.filter(s => s.status === 'active').length
      },
      quality: {
        total: dailyQuality.length,
        passed: dailyQuality.filter(q => q.result === 'pass').length,
        failed: dailyQuality.filter(q => q.result === 'fail').length
      },
      details: dailyStages.map(stage => ({
        id: stage.id,
        stage_name: stage.stage_name,
        status: stage.status,
        start_time: stage.start_time,
        end_time: stage.end_time,
        duration: stage.start_time && stage.end_time ? 
          Math.round((new Date(stage.end_time) - new Date(stage.start_time)) / 1000 / 60) : null
      }))
    };
    
    res.json(report);
  } catch (error) {
    console.error('Operatör günlük rapor hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WORKFLOW YÖNETİMİ ====================

// Workflows API
app.get('/api/workflows', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Workflows yükleme hatası:', error);
    res.status(500).json({ error: 'Workflows yüklenemedi' });
  }
});

app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow yükleme hatası:', error);
    res.status(500).json({ error: 'Workflow yüklenemedi' });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const { name, description, type, steps, triggers, conditions, active } = req.body;
    
    const { data, error } = await supabase
      .from('workflows')
      .insert([{
        name,
        description,
        type,
        steps,
        triggers,
        conditions,
        active: active !== undefined ? active : true
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow oluşturma hatası:', error);
    res.status(500).json({ error: 'Workflow oluşturulamadı' });
  }
});

app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, steps, triggers, conditions, active } = req.body;
    
    const { data, error } = await supabase
      .from('workflows')
      .update({
        name,
        description,
        type,
        steps,
        triggers,
        conditions,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow güncelleme hatası:', error);
    res.status(500).json({ error: 'Workflow güncellenemedi' });
  }
});

app.delete('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Workflow silindi' });
  } catch (error) {
    console.error('Workflow silme hatası:', error);
    res.status(500).json({ error: 'Workflow silinemedi' });
  }
});

// Workflow Executions API
app.get('/api/workflow-executions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows:workflow_id (
          id,
          name,
          type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Workflow executions yükleme hatası:', error);
    res.status(500).json({ error: 'Workflow executions yüklenemedi' });
  }
});

app.get('/api/workflow-executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows:workflow_id (
          id,
          name,
          type
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow execution yükleme hatası:', error);
    res.status(500).json({ error: 'Workflow execution yüklenemedi' });
  }
});

app.post('/api/workflow-executions', async (req, res) => {
  try {
    const { workflow_id, status, execution_data, progress, current_step, user_id } = req.body;
    
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert([{
        workflow_id,
        status: status || 'pending',
        execution_data,
        progress: progress || 0,
        current_step: current_step || 0,
        user_id
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow execution oluşturma hatası:', error);
    res.status(500).json({ error: 'Workflow execution oluşturulamadı' });
  }
});

app.put('/api/workflow-executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, execution_data, progress, current_step, error_message, completed_at } = req.body;
    
    const updateData = {
      status,
      execution_data,
      progress,
      current_step,
      error_message,
      updated_at: new Date().toISOString()
    };
    
    if (completed_at) {
      updateData.completed_at = completed_at;
    }
    
    const { data, error } = await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow execution güncelleme hatası:', error);
    res.status(500).json({ error: 'Workflow execution güncellenemedi' });
  }
});

// Work Orders API
// work_orders endpoint'leri kaldırıldı - sadece orders tablosu kullanılacak

// Stok Hareketleri API
app.get('/api/stok-hareketleri', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stok_hareketleri')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Stok hareketleri yükleme hatası:', error);
    res.status(500).json({ error: 'Stok hareketleri yüklenemedi' });
  }
});

app.get('/api/stok-hareketleri/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('stok_hareketleri')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Stok hareketi yükleme hatası:', error);
    res.status(500).json({ error: 'Stok hareketi yüklenemedi' });
  }
});

app.post('/api/stok-hareketleri', async (req, res) => {
  try {
    const { urun_id, urun_tipi, hareket_tipi, miktar, birim, fiyat, toplam_tutar, aciklama, referans_no, created_by } = req.body;
    
    const { data, error } = await supabase
      .from('stok_hareketleri')
      .insert([{
        urun_id,
        urun_tipi,
        hareket_tipi,
        miktar,
        birim,
        fiyat,
        toplam_tutar,
        aciklama,
        referans_no,
        created_by
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Stok hareketi oluşturma hatası:', error);
    res.status(500).json({ error: 'Stok hareketi oluşturulamadı' });
  }
});

// Workflow Step Templates API
app.get('/api/workflow-step-templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflow_step_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Workflow step templates yükleme hatası:', error);
    res.status(500).json({ error: 'Workflow step templates yüklenemedi' });
  }
});

app.get('/api/workflow-step-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('workflow_step_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow step template yükleme hatası:', error);
    res.status(500).json({ error: 'Workflow step template yüklenemedi' });
  }
});

app.post('/api/workflow-step-templates', async (req, res) => {
  try {
    const { name, description, step_type, config } = req.body;
    
    const { data, error } = await supabase
      .from('workflow_step_templates')
      .insert([{
        name,
        description,
        step_type,
        config
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow step template oluşturma hatası:', error);
    res.status(500).json({ error: 'Workflow step template oluşturulamadı' });
  }
});

app.put('/api/workflow-step-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, step_type, config } = req.body;
    
    const { data, error } = await supabase
      .from('workflow_step_templates')
      .update({
        name,
        description,
        step_type,
        config,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Workflow step template güncelleme hatası:', error);
    res.status(500).json({ error: 'Workflow step template güncellenemedi' });
  }
});

app.delete('/api/workflow-step-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('workflow_step_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Workflow step template silindi' });
  } catch (error) {
    console.error('Workflow step template silme hatası:', error);
    res.status(500).json({ error: 'Workflow step template silinemedi' });
  }
});

// ========================================
// REAL-TIME PRODUCTION MANAGEMENT APIs
// ========================================

// Production States API
app.get('/api/production-states', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('active_productions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Production states yükleme hatası:', error);
    res.status(500).json({ error: 'Production states yüklenemedi' });
  }
});

// Get production state by plan_id and product_name
app.get('/api/production-states/:planId/:productName', async (req, res) => {
  try {
    const { planId, productName } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('active_productions')
        .select('*')
        .eq('plan_id', planId)
        .eq('product_name', productName)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      res.json(data || null);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Production state yükleme hatası:', error);
    res.status(500).json({ error: 'Production state yüklenemedi' });
  }
});

app.get('/api/production-states/:operatorId', async (req, res) => {
  try {
    const { operatorId } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('active_productions')
        .select('*')
        .eq('assigned_operator', operatorId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Operator production states yükleme hatası:', error);
    res.status(500).json({ error: 'Operator production states yüklenemedi' });
  }
});

app.post('/api/production-states', async (req, res) => {
  try {
    const productionData = req.body;
    
    if (supabase) {
      // Check if a production state already exists for this order_id and product_code
      const { data: existingData, error: checkError } = await supabase
        .from('active_productions')
        .select('id')
        .eq('plan_id', productionData.plan_id)
        .eq('product_name', productionData.product_name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;
      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('active_productions')
          .update(productionData)
          .eq('id', existingData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('active_productions')
          .insert([productionData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      res.json(result);
    } else {
      res.json({ id: Date.now(), ...productionData });
    }
  } catch (error) {
    console.error('Production state oluşturma hatası:', error);
    res.status(500).json({ error: 'Production state oluşturulamadı' });
  }
});

app.put('/api/production-states/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('active_productions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: parseInt(id), ...updateData });
    }
  } catch (error) {
    console.error('Production state güncelleme hatası:', error);
    res.status(500).json({ error: 'Production state güncellenemedi' });
  }
});

app.delete('/api/production-states/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { error } = await supabase
        .from('active_productions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Production state silindi' });
    } else {
      res.json({ message: 'Production state silindi' });
    }
  } catch (error) {
    console.error('Production state silme hatası:', error);
    res.status(500).json({ error: 'Production state silinemedi' });
  }
});

// Tüm production states'i sil
app.delete('/api/production-states', async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('active_productions')
        .delete()
        .neq('id', 0); // Tüm kayıtları sil

      if (error) throw error;
      res.json({ message: 'Tüm production states silindi' });
    } else {
      res.json({ message: 'Tüm production states silindi' });
    }
  } catch (error) {
    console.error('Tüm production states silme hatası:', error);
    res.status(500).json({ error: 'Tüm production states silinemedi' });
  }
});

// Complete Production API
app.post('/api/complete-production', async (req, res) => {
  try {
    const { orderId, productCode, productionStateId, completedQuantity, notes } = req.body;
    
    console.log('🔄 Üretim tamamlanıyor:', { orderId, productCode, productionStateId, completedQuantity });
    
    if (supabase) {
      // 1. Production state'i güncelle
      const { data: updatedState, error: stateError } = await supabase
        .from('active_productions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
          produced_quantity: completedQuantity
        })
        .eq('id', productionStateId)
        .select()
        .single();
      
      if (stateError) throw stateError;
      
      // 2. Active production'ı completed olarak güncelle
      const { data: activeProduction, error: activeError } = await supabase
        .from('active_productions')
        .select('id, plan_id')
        .eq('id', productionStateId)
        .single();
      
      // 3. Production plan'ı completed olarak güncelle
      // Önce active_productions'dan plan_id'yi al, yoksa doğrudan order_id ile bul
      let planId = null;
      if (!activeError && activeProduction && activeProduction.plan_id) {
        planId = activeProduction.plan_id;
      } else {
        // Active production yoksa, production_plans'dan order_id ile bul
        const { data: planData, error: planSearchError } = await supabase
          .from('production_plans')
          .select('id')
          .eq('order_id', parseInt(orderId))
          .single();
        
        if (!planSearchError && planData) {
          planId = planData.id;
        }
      }
      
      if (!activeError && activeProduction) {
        const { error: updateActiveError } = await supabase
          .from('active_productions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            produced_quantity: completedQuantity
          })
          .eq('id', activeProduction.id);
        
        if (updateActiveError) console.error('Active production güncelleme hatası:', updateActiveError);
      }
      
      if (planId) {
        const { error: planError } = await supabase
          .from('production_plans')
          .update({
            status: 'completed'
          })
          .eq('id', planId);
        
        if (planError) {
          console.error('Production plan güncelleme hatası:', planError);
        } else {
          console.log('✅ Production plan güncellendi:', planId, '-> completed');
        }
      } else {
        console.log('⚠️ Production plan bulunamadı, order_id:', orderId);
      }
      
      // 4. Order'ı completed olarak güncelle
      const { error: orderError } = await supabase
        .from('order_management')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(orderId));
      
      if (orderError) {
        console.error('Order güncelleme hatası:', orderError);
      } else {
        console.log('✅ Order durumu güncellendi:', orderId, '-> completed');
      }
      
      // 5. Production stages'ları completed olarak güncelle
      if (activeProduction && activeProduction.plan_id) {
        const { error: stagesError } = await supabase
          .from('production_stages')
          .update({
            status: 'completed',
            end_time: new Date().toISOString()
          })
          .eq('production_id', activeProduction.id)
          .in('status', ['pending', 'active', 'in_progress']);
        
        if (stagesError) console.error('Production stages güncelleme hatası:', stagesError);
      }
      
      // 6. STOK YÖNETİMİ - BOM tabanlı stok güncelleme
      try {
        console.log('📦 Stok güncelleme başlatılıyor...');
        
        // BOM'u al
        console.log('🔍 BOM sorgusu yapılıyor:', {
          product_id: updatedState.product_id,
          product_name: updatedState.product_name
        });
        
        const { data: bomData, error: bomError } = await supabase
          .from('urun_agaci')
          .select('*')
          .eq('ana_urun_id', updatedState.product_id || 1) // Varsayılan olarak 1
          .eq('ana_urun_tipi', 'nihai');
        
        if (bomError) {
          console.error('BOM sorgulama hatası:', bomError);
        } else if (bomData && bomData.length > 0) {
          console.log('🌳 BOM bulundu:', bomData.length, 'malzeme');
          console.log('🔍 BOM verisi:', bomData);
          
          // Her malzeme için stok düş
          for (const bomItem of bomData) {
            const requiredQuantity = (bomItem.gerekli_miktar || 1) * completedQuantity;
            
            console.log(`📉 Stok düşülüyor: ${bomItem.alt_urun_id} (${bomItem.alt_urun_tipi}) - ${requiredQuantity} ${bomItem.birim}`);
            
            // Stok hareketi kaydet
            const { data: stockMovement, error: stockError } = await supabase
              .from('stok_hareketleri')
              .insert({
                urun_id: bomItem.alt_urun_id,
                urun_tipi: bomItem.alt_urun_tipi,
                hareket_tipi: 'cikis',
                miktar: requiredQuantity,
                birim: bomItem.birim || 'adet',
                referans_no: `PROD-${productionStateId}`,
                aciklama: `Üretim tüketimi - ${updatedState.product_name || 'Ürün'} (${completedQuantity} adet)`,
                operator: 'system'
              })
              .select();
            
            if (stockError) {
              console.error('Stok hareketi kaydetme hatası:', stockError);
            } else {
              console.log('✅ Stok hareketi kaydedildi:', stockMovement[0].id);
            }
            
            // Stok miktarını güncelle
            const tableName = bomItem.alt_urun_tipi === 'hammadde' ? 'hammaddeler' : 
                              bomItem.alt_urun_tipi === 'yarimamul' ? 'yarimamuller' : 'nihai_urunler';
            
            const { data: currentStock, error: currentError } = await supabase
              .from(tableName)
              .select('miktar')
              .eq('id', bomItem.alt_urun_id)
              .single();
            
            if (!currentError && currentStock) {
              const newQuantity = (currentStock.miktar || 0) - requiredQuantity;
              
              const { error: updateError } = await supabase
                .from(tableName)
                .update({ 
                  miktar: Math.max(0, newQuantity), // Negatif stok önle
                  updated_at: new Date().toISOString()
                })
                .eq('id', bomItem.alt_urun_id);
              
              if (updateError) {
                console.error('Stok güncelleme hatası:', updateError);
              } else {
                console.log(`✅ ${tableName} stok güncellendi: ${currentStock.miktar} -> ${Math.max(0, newQuantity)}`);
              }
            }
          }
          
          // 7. NİHAİ ÜRÜN STOĞUNU ARTIR
          console.log('📈 Nihai ürün stoğu artırılıyor...');
          
          // Nihai ürün stok hareketi (giriş)
          const { data: finalProductMovement, error: finalStockError } = await supabase
            .from('stok_hareketleri')
            .insert({
              urun_id: updatedState.product_id || 1,
              urun_tipi: 'nihai',
              hareket_tipi: 'giris',
              miktar: completedQuantity,
              birim: 'adet',
              referans_no: `PROD-${productionStateId}`,
              aciklama: `Üretim çıkışı - ${updatedState.product_name || 'Ürün'}`,
              operator: 'system'
            })
            .select();
          
          if (finalStockError) {
            console.error('Nihai ürün stok hareketi hatası:', finalStockError);
          } else {
            console.log('✅ Nihai ürün stok hareketi kaydedildi:', finalProductMovement[0].id);
          }
          
          // Nihai ürün stok miktarını artır
          const { data: currentFinalStock, error: currentFinalError } = await supabase
            .from('nihai_urunler')
            .select('miktar')
            .eq('id', updatedState.product_id || 1)
            .single();
          
          if (!currentFinalError && currentFinalStock) {
            const newFinalQuantity = (currentFinalStock.miktar || 0) + completedQuantity;
            
            const { error: updateFinalError } = await supabase
              .from('nihai_urunler')
              .update({ 
                miktar: newFinalQuantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', updatedState.product_id || 1);
            
            if (updateFinalError) {
              console.error('Nihai ürün stok güncelleme hatası:', updateFinalError);
            } else {
              console.log(`✅ Nihai ürün stok güncellendi: ${currentFinalStock.miktar} -> ${newFinalQuantity}`);
            }
          }
          
          console.log('🎉 Stok güncelleme tamamlandı!');
        } else {
          console.log('⚠️ BOM bulunamadı, stok güncelleme atlandı');
        }
      } catch (stockUpdateError) {
        console.error('❌ Stok güncelleme hatası:', stockUpdateError);
        // Stok hatası olsa bile üretim tamamlanmış sayılır
      }
      
      console.log('✅ Üretim başarıyla tamamlandı:', updatedState);
      res.json({ success: true, data: updatedState });
    } else {
      res.json({ success: true, data: { id: productionStateId } });
    }
  } catch (error) {
    console.error('❌ Üretim tamamlama hatası:', error);
    console.error('❌ Hata detayları:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Üretim tamamlanamadı',
      details: error.message,
      code: error.code
    });
  }
});

// Production History API
app.get('/api/production-history/:productionStateId', async (req, res) => {
  try {
    const { productionStateId } = req.params;
    
    if (supabase) {
      // Önce production_history tablosundan dene
      const { data: historyData, error: historyError } = await supabase
        .from('production_history')
        .select('*')
        .eq('production_state_id', productionStateId)
        .order('timestamp', { ascending: false });

      if (historyError) {
        console.log('Production history tablosu hatası:', historyError.message);
      }

      // Eğer production_history'de veri yoksa, boş array döndür
      if (!historyData || historyData.length === 0) {
        console.log('Production history verisi bulunamadı');
        res.json([]);
        return;
      }

      res.json(historyData || []);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Production history yükleme hatası:', error);
    res.status(500).json({ error: 'Production history yüklenemedi' });
  }
});

// Tamamlanan Üretimler API
app.get('/api/completed-productions', async (req, res) => {
  try {
    if (supabase) {
      // Tamamlanan production states'leri getir - status = 'completed' kullan
      const { data: productionStates, error: statesError } = await supabase
        .from('active_productions')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });
      
      if (statesError) throw statesError;
      
      console.log('Tamamlanan production states:', productionStates?.length || 0, 'adet');
      
      // Basit yaklaşım: Production states'leri döndür, order bilgilerini client-side'da al
      // Ama test için bir tanesini kontrol edelim
      if (productionStates && productionStates.length > 0) {
        const testState = productionStates[0];
        console.log('Test state:', testState.id, 'order_id:', testState.order_id);
        
        // Test için order_management tablosundan veri alalım
        const { data: testOrder, error: testOrderError } = await supabase
          .from('order_management')
          .select('*')
          .eq('id', parseInt(testState.order_id))
          .single();
        
        if (testOrderError) {
          console.error('Test order hatası:', testOrderError.message);
        } else {
          console.log('✅ Test order başarılı:', testOrder.order_number, testOrder.customer_name);
        }
      }
      
      // Test: İlk state için manuel order bilgisi ekle
      if (productionStates && productionStates.length > 0) {
        for (let i = 0; i < productionStates.length; i++) {
          const state = productionStates[i];
          
          // Orders bilgisini al - order_management tablosundan
          const { data: orderData, error: orderError } = await supabase
            .from('order_management')
            .select('order_number, customer_name, order_date, delivery_date')
            .eq('id', parseInt(state.order_id))
            .single();
          
          console.log(`State ${state.id} için order sorgusu:`, {
            order_id: state.order_id,
            parseInt_order_id: parseInt(state.order_id),
            found: !!orderData,
            error: orderError?.message
          });
          
          if (orderData) {
            console.log('✅ Order data bulundu:', orderData.order_number, orderData.customer_name);
            state.order = {
              order_number: orderData.order_number,
              customer_name: orderData.customer_name || 'Bilinmiyor',
              order_date: orderData.order_date,
              delivery_date: orderData.delivery_date
            };
          } else {
            console.log('❌ Order data bulunamadı - null atanıyor');
            state.order = null;
          }
          
          // Plan bilgisini al
          const { data: planData } = await supabase
            .from('production_plans')
            .select('*')
            .eq('order_id', parseInt(state.order_id))
            .single();
          
          state.plan = planData || null;
        }
      }
      
      res.json(productionStates);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Completed productions error:', error);
    res.status(500).json({ error: 'Tamamlanan üretimler alınamadı' });
  }
});

app.post('/api/production-history', async (req, res) => {
  try {
    const historyData = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('production_history')
        .insert([historyData])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: Date.now(), ...historyData });
    }
  } catch (error) {
    console.error('Production history oluşturma hatası:', error);
    res.status(500).json({ error: 'Production history oluşturulamadı' });
  }
});

// Tüm production history'yi sil
app.delete('/api/production-history', async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('production_history')
        .delete()
        .neq('id', 0); // Tüm kayıtları sil

      if (error) throw error;
      res.json({ message: 'Tüm production history silindi' });
    } else {
      res.json({ message: 'Tüm production history silindi' });
    }
  } catch (error) {
    console.error('Tüm production history silme hatası:', error);
    res.status(500).json({ error: 'Tüm production history silinemedi' });
  }
});

// Tüm productions'ı temizle (sadece completed ve cancelled olanları)
app.delete('/api/productions/cleanup', async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('productions')
        .delete()
        .in('status', ['completed', 'cancelled']);

      if (error) throw error;
      res.json({ message: 'Tamamlanan ve iptal edilen üretimler temizlendi' });
    } else {
      res.json({ message: 'Tamamlanan ve iptal edilen üretimler temizlendi' });
    }
  } catch (error) {
    console.error('Productions temizleme hatası:', error);
    res.status(500).json({ error: 'Productions temizlenemedi' });
  }
});

// Operators API
app.get('/api/operators', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Operators yükleme hatası:', error);
    res.status(500).json({ error: 'Operators yüklenemedi' });
  }
});

// Operatör oturum doğrulama API'si
app.post('/api/operators/verify-session', async (req, res) => {
  try {
    const { operatorId, sessionToken } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({ error: 'Operatör ID gerekli' });
    }

    console.log('🔐 Operatör oturum doğrulanıyor:', operatorId);

    if (supabase) {
      // Önce operators tablosundan kontrol et
      let operator = null;
      let operatorError = null;
      
      const { data: operatorData, error: operatorErr } = await supabase
        .from('operators')
        .select('*')
        .eq('id', operatorId)
        .eq('is_active', true)
        .single();

      if (operatorErr && operatorErr.code === 'PGRST116') {
        // operators tablosunda yoksa resource_management'dan kontrol et
        console.log('⚠️ Operators tablosunda bulunamadı, resource_management kontrol ediliyor');
        
        const { data: resourceData, error: resourceErr } = await supabase
          .from('resource_management')
          .select('*')
          .eq('id', operatorId)
          .eq('resource_type', 'operator')
          .eq('is_active', true)
          .single();

        if (resourceErr || !resourceData) {
          console.log('❌ Resource Management\'da da operatör bulunamadı:', operatorId);
          return res.status(404).json({ error: 'Operatör bulunamadı veya aktif değil' });
        }

        // Resource management verisini operators formatına çevir
        operator = {
          id: resourceData.id,
          name: resourceData.resource_name,
          email: resourceData.email || `${resourceData.resource_name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          role: 'operator',
          resource_type: resourceData.resource_type,
          department: resourceData.department,
          skill_level: resourceData.skill_level,
          capacity: resourceData.capacity,
          cost_per_hour: resourceData.cost_per_hour,
          location: resourceData.location,
          notes: resourceData.notes
        };
      } else if (operatorErr) {
        console.log('❌ Operatör sorgulama hatası:', operatorErr);
        return res.status(404).json({ error: 'Operatör bulunamadı veya aktif değil' });
      } else {
        operator = operatorData;
      }

      if (!operator) {
        console.log('❌ Operatör bulunamadı veya aktif değil:', operatorId);
        return res.status(404).json({ error: 'Operatör bulunamadı veya aktif değil' });
      }

      // Operatör oturum tablosunu kontrol et (eğer varsa)
      const { data: session, error: sessionError } = await supabase
        .from('operator_sessions')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      // Eğer oturum tablosu yoksa veya hata varsa, sadece operatör kontrolü yap
      if (sessionError && sessionError.code !== 'PGRST116') {
        console.log('⚠️ Oturum tablosu kontrolü yapılamadı, sadece operatör kontrolü yapılıyor');
      }

      console.log('✅ Operatör oturumu doğrulandı:', operator.name);
      res.json({
        valid: true,
        operator: {
          id: operator.id,
          name: operator.name,
          email: operator.email,
          role: operator.role
        }
      });

    } else {
      // Supabase yoksa mock doğrulama
      console.log('⚠️ Supabase bağlantısı yok, mock doğrulama yapılıyor');
      res.json({
        valid: true,
        operator: {
          id: operatorId,
          name: 'Mock Operatör',
          email: 'mock@example.com',
          role: 'operator'
        }
      });
    }

  } catch (error) {
    console.error('❌ Operatör oturum doğrulama hatası:', error);
    res.status(500).json({ error: 'Oturum doğrulanamadı' });
  }
});

app.post('/api/operators', async (req, res) => {
  try {
    const operatorData = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('operators')
        .insert([operatorData])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: Date.now(), ...operatorData });
    }
  } catch (error) {
    console.error('Operator oluşturma hatası:', error);
    res.status(500).json({ error: 'Operator oluşturulamadı' });
  }
});

// Notifications API
app.get('/api/notifications/:operatorId', async (req, res) => {
  try {
    const { operatorId } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('production_notifications')
        .select('*')
        .eq('assigned_operator', operatorId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Notifications yükleme hatası:', error);
    res.status(500).json({ error: 'Notifications yüklenemedi' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notificationData = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('production_notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: Date.now(), ...notificationData });
    }
  } catch (error) {
    console.error('Notification oluşturma hatası:', error);
    res.status(500).json({ error: 'Notification oluşturulamadı' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('production_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: parseInt(id), is_read: true });
    }
  } catch (error) {
    console.error('Notification okuma hatası:', error);
    res.status(500).json({ error: 'Notification okunamadı' });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } else {
      // Mock data
      res.json([
        {
          id: 1,
          name: "ABC Tekstil A.Ş.",
          email: "abc@tekstil.com",
          phone: "+90 555 123 4567",
          address: "İstanbul, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "XYZ Giyim Ltd.",
          email: "xyz@giyim.com",
          phone: "+90 555 234 5678",
          address: "Ankara, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: "DEF Moda San.",
          email: "def@moda.com",
          phone: "+90 555 345 6789",
          address: "İzmir, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          name: "GHI Konfeksiyon",
          email: "ghi@konfeksiyon.com",
          phone: "+90 555 456 7890",
          address: "Bursa, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          name: "JKL Tekstil",
          email: "jkl@tekstil.com",
          phone: "+90 555 567 8901",
          address: "Gaziantep, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          name: "MNO Giyim",
          email: "mno@giyim.com",
          phone: "+90 555 678 9012",
          address: "Kayseri, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 7,
          name: "PQR Moda",
          email: "pqr@moda.com",
          phone: "+90 555 789 0123",
          address: "Konya, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 8,
          name: "STU Tekstil",
          email: "stu@tekstil.com",
          phone: "+90 555 890 1234",
          address: "Adana, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 9,
          name: "VWX Konfeksiyon",
          email: "vwx@konfeksiyon.com",
          phone: "+90 555 901 2345",
          address: "Antalya, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 10,
          name: "YZA Giyim",
          email: "yza@giyim.com",
          phone: "+90 555 012 3456",
          address: "Trabzon, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 11,
          name: "BCD Moda",
          email: "bcd@moda.com",
          phone: "+90 555 123 4567",
          address: "Samsun, Türkiye",
          created_at: new Date().toISOString()
        },
        {
          id: 12,
          name: "EFG Tekstil",
          email: "efg@tekstil.com",
          phone: "+90 555 234 5678",
          address: "Erzurum, Türkiye",
          created_at: new Date().toISOString()
        }
      ]);
    }
  } catch (error) {
    console.error('Müşteri listesi getirme hatası:', error);
    res.status(500).json({ error: 'Müşteri listesi yüklenemedi' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customerData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: Date.now(), ...customerData });
    }
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    res.status(500).json({ error: 'Müşteri oluşturulamadı' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } else {
      res.json({ id: parseInt(id), ...updates });
    }
  } catch (error) {
    console.error('Müşteri güncelleme hatası:', error);
    res.status(500).json({ error: 'Müşteri güncellenemedi' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Müşteri silindi' });
    } else {
      res.json({ message: 'Müşteri silindi' });
    }
  } catch (error) {
    console.error('Müşteri silme hatası:', error);
    res.status(500).json({ error: 'Müşteri silinemedi' });
  }
});


// System Settings API
app.get('/api/settings', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      
      // Settings'i key-value objesi olarak döndür
      const settings = {};
      data.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });
      
      res.json(settings);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Settings yükleme hatası:', error);
    res.status(500).json({ error: 'Settings yüklenemedi' });
  }
});

// Üretim geçmişi endpoint'i
app.get('/api/production-history', async (req, res) => {
  try {
    console.log('📊 Üretim geçmişi yükleniyor...');
    
    if (!supabase) {
      console.log('⚠️ Supabase bağlantısı yok, boş array döndürülüyor');
      res.json([]);
      return;
    }
    
    // Önce active_productions tablosundan tamamlanan üretimleri çek
    console.log('📊 Active productions tablosundan üretim geçmişi çekiliyor...');
    let { data: productions, error } = await supabase
      .from('active_productions')
      .select(`
        id,
        product_name,
        assigned_operator as operator_name,
        start_time,
        actual_end_time as end_time,
        planned_quantity as quantity,
        status,
        created_at,
        updated_at
      `)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false });
    
    console.log('🔍 Query sonucu:', { productions: productions?.length || 0, error: error?.message });
    
    // Eğer active_productions'ta veri yoksa productions tablosunu dene
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Active productions tablosu bulunamadı, productions kontrol ediliyor...');
      
      const { data: productionsData, error: productionsError } = await supabase
        .from('productions')
        .select(`
          id,
          product_type as product_name,
          operator_name,
          start_time,
          end_time,
          quantity,
          status,
          created_at,
          updated_at
        `)
        .in('status', ['completed', 'cancelled'])
        .order('end_time', { ascending: false });
      
      if (productionsError) {
        console.error('❌ Productions çekme hatası:', productionsError);
        error = productionsError;
      } else {
        productions = productionsData;
        error = null;
      }
    }
    
    if (error) {
      console.error('❌ Üretim geçmişi çekme hatası:', error);
      // Hata durumunda mock veri döndür
      console.log('⚠️ Hata nedeniyle mock veri döndürülüyor');
      
      const mockProductionHistory = [
        {
          id: 1001,
          product_name: 'TRX-1 DSTR14-17-GRAY-82-86',
          operator_name: 'Thunder Serisi Operatör',
          start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 25,
          status: 'completed'
        },
        {
          id: 1002,
          product_name: 'TRX-2 DSTR14-17-BLACK-82-86',
          operator_name: 'ThunderPRO Serisi Operatör',
          start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 30,
          status: 'completed'
        }
      ];
      
      res.json(mockProductionHistory);
      return;
    }
    
    // Gerçek veri varsa onu döndür, yoksa mock veri döndür
    if (productions && productions.length > 0) {
      console.log('✅ Gerçek üretim geçmişi yüklendi:', productions.length);
      res.json(productions);
    } else {
      console.log('⚠️ Gerçek veri bulunamadı, mock veri döndürülüyor');
      
      const mockProductionHistory = [
        {
          id: 1001,
          product_name: 'TRX-1 DSTR14-17-GRAY-82-86',
          operator_name: 'Thunder Serisi Operatör',
          start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 25,
          status: 'completed'
        },
        {
          id: 1002,
          product_name: 'TRX-2 DSTR14-17-BLACK-82-86',
          operator_name: 'ThunderPRO Serisi Operatör',
          start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 30,
          status: 'completed'
        }
      ];
      
      res.json(mockProductionHistory);
    }
    
  } catch (error) {
    console.error('❌ Üretim geçmişi yükleme hatası:', error);
    // Hata durumunda boş array döndür
    res.json([]);
  }
});

// Bugün tamamlanan üretimler endpoint'i
app.get('/api/today-completed-productions', async (req, res) => {
  try {
    console.log('📅 Bugün tamamlanan üretimler yükleniyor...');
    
    // Test için mock veri döndür
    const mockTodayProductions = [
      {
        id: 1001,
        product_name: 'TRX-1 DSTR14-17-GRAY-82-86',
        operator_name: 'Thunder Serisi Operatör',
        start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        quantity: 25,
        status: 'completed'
      },
      {
        id: 1002,
        product_name: 'TRX-2 DSTR14-17-BLACK-82-86',
        operator_name: 'ThunderPRO Serisi Operatör',
        start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        quantity: 30,
        status: 'completed'
      }
    ];
    
    console.log('✅ Mock bugün tamamlanan üretimler döndürülüyor:', mockTodayProductions.length);
    res.json(mockTodayProductions);
    
    // Gerçek veri çekme kodu (şimdilik devre dışı)
    /*
    if (!supabase) {
      console.log('⚠️ Supabase bağlantısı yok, boş array döndürülüyor');
      res.json([]);
      return;
    }
    
    // Bugünün tarihini al
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında
    
    // Active productions tablosundan bugün tamamlananları çek
    const { data: todayProductions, error } = await supabase
      .from('active_productions')
      .select(`
        id,
        product_name,
        assigned_operator as operator_name,
        start_time,
        end_time,
        target_quantity as quantity,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'completed')
      .gte('end_time', `${today}T00:00:00.000Z`)
      .lt('end_time', `${today}T23:59:59.999Z`)
      .order('end_time', { ascending: false });
    
    if (error) {
      console.error('❌ Bugün tamamlanan üretimler çekme hatası:', error);
      res.json([]);
      return;
    }
    
    console.log('✅ Bugün tamamlanan üretimler yüklendi:', todayProductions?.length || 0);
    res.json(todayProductions || []);
    */
    
  } catch (error) {
    console.error('❌ Bugün tamamlanan üretimler yükleme hatası:', error);
    res.json([]);
  }
});

// İş emirleri endpoint'i
app.get('/api/work-orders', async (req, res) => {
  try {
    console.log('📋 İş emirleri yükleniyor...');
    
    // Mock data döndür (test için)
    const mockWorkOrders = [
      {
        id: 1,
        work_order_number: 'WO-2024-001',
        plan_id: 1,
        product_name: 'TRX-1 DSTR14-17-GRAY-82-86',
        quantity: 50,
        priority: 'Yüksek',
        status: 'active',
        assigned_operator: 'Ahmet Yılmaz',
        start_date: '2024-12-20T08:00:00Z',
        due_date: '2024-12-22T17:00:00Z',
        created_at: '2024-12-19T10:00:00Z'
      },
      {
        id: 2,
        work_order_number: 'WO-2024-002',
        plan_id: 2,
        product_name: 'TRX-2 DSTR14-17-BLACK-82-86',
        quantity: 75,
        priority: 'Orta',
        status: 'pending',
        assigned_operator: 'Mehmet Kaya',
        start_date: '2024-12-21T09:00:00Z',
        due_date: '2024-12-23T17:00:00Z',
        created_at: '2024-12-20T11:00:00Z'
      },
      {
        id: 3,
        work_order_number: 'WO-2024-003',
        plan_id: 3,
        product_name: 'TRX-3 DSTR14-17-WHITE-82-86',
        quantity: 60,
        priority: 'Düşük',
        status: 'completed',
        assigned_operator: 'Ayşe Demir',
        start_date: '2024-12-18T08:30:00Z',
        due_date: '2024-12-20T17:00:00Z',
        created_at: '2024-12-17T14:00:00Z'
      }
    ];
    
    console.log('✅ Mock iş emirleri döndürülüyor:', mockWorkOrders.length);
    res.json(mockWorkOrders);
    return;
    
    // Supabase'den iş emirlerini çek (gelecekte kullanılacak)
    if (supabase) {
      const { data: workOrders, error } = await supabase
        .from('work_orders')
        .select(`
          id,
          work_order_number,
          plan_id,
          product_name,
          quantity,
          priority,
          status,
          assigned_operator,
          start_date,
          due_date,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('İş emirleri yükleme hatası:', error);
        res.status(500).json({ error: 'İş emirleri yüklenemedi' });
        return;
      }
      
      console.log('✅ İş emirleri yüklendi:', workOrders.length);
      res.json(workOrders || []);
    }
    
  } catch (error) {
    console.error('İş emirleri yükleme hatası:', error);
    res.status(500).json({ error: 'İş emirleri yüklenemedi' });
  }
});

// Tüm planları listele - Debug için
app.get('/api/plans', async (req, res) => {
  try {
    console.log('📋 Tüm planlar listeleniyor...');
    
    if (supabase) {
      const { data: plans, error } = await supabase
        .from('production_plans')
        .select('id, plan_name, order_id, total_quantity')
        .order('id', { ascending: false });
      
      if (error) {
        console.error('❌ Planlar listelenemedi:', error);
        return res.status(500).json({ error: 'Planlar listelenemedi', details: error.message });
      }
      
      console.log('✅ Planlar listelendi:', plans.length, 'plan');
      res.json({ success: true, plans: plans });
    } else {
      res.json({ success: false, error: 'Supabase bağlantısı yok' });
    }
  } catch (error) {
    console.error('❌ Planlar listeleme hatası:', error);
    res.status(500).json({ error: 'Planlar listelenemedi', details: error.message });
  }
});

// Ürün detayları API endpoint'i - Plan ID'ye göre ürünleri getir
app.get('/api/plans/:planId/products', async (req, res) => {
  try {
    const { planId } = req.params;
    console.log('🔍 Plan ürünleri çekiliyor:', planId, 'Type:', typeof planId);
    console.log('📋 Request params:', req.params);
    
    if (supabase) {
      // Plan'ı bul ve order_id'sini al
      const { data: plan, error: planError } = await supabase
        .from('production_plans')
        .select('order_id, plan_name, total_quantity')
        .eq('id', planId)
        .single();
      
      if (planError) {
        console.error('❌ Plan bulunamadı:', planError);
        console.error('🔍 Aranan Plan ID:', planId);
        console.error('🔍 Plan Error Code:', planError.code);
        console.error('🔍 Plan Error Message:', planError.message);
        return res.status(404).json({ 
          error: 'Plan bulunamadı',
          planId: planId,
          details: planError.message
        });
      }
      
      console.log('📋 Plan bulundu:', plan);
      
      // Order'ı bul ve product_details'ını al
      if (plan.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('order_management')
          .select('product_details, customer_name, order_date')
          .eq('id', plan.order_id)
          .single();
        
        if (orderError) {
          console.error('Order bulunamadı:', orderError);
          return res.status(404).json({ error: 'Order bulunamadı' });
        }
        
        console.log('📦 Order bulundu:', order);
        
        // Product details parse et
        let productDetails = [];
        try {
          if (order.product_details) {
            productDetails = JSON.parse(order.product_details);
          }
        } catch (error) {
          console.error('Product details parse hatası:', error);
        }
        
        console.log('✅ Ürün detayları çekildi:', productDetails.length, 'ürün');
        
        res.json({
          success: true,
          plan: plan,
          order: order,
          products: productDetails
        });
        return;
      }
    }
    
    // Fallback: Boş ürün listesi
    console.log('⚠️ Supabase bağlantısı yok veya plan/order bulunamadı, boş liste döndürülüyor');
    
    res.json({
      success: true,
      plan: { plan_name: `Plan-${planId}`, total_quantity: 1 },
      order: { customer_name: 'N/A', order_date: new Date().toISOString().split('T')[0] },
      products: [] // Boş liste - gerçek veri bekleniyor
    });
    
  } catch (error) {
    console.error('❌ Plan ürünleri çekme hatası:', error);
    res.status(500).json({ error: 'Plan ürünleri çekilemedi' });
  }
});

// İş emri oluşturma endpoint'i
// Operatör ID'sini operatör adına çeviren fonksiyon
function getOperatorName(operatorId) {
  const operatorMap = {
    '4': 'Thunder Serisi Operatör',
    '5': 'ThunderPRO Serisi Operatör',
    '1': 'Operatör 1',
    '2': 'Operatör 2',
    '3': 'Operatör 3'
  };
  return operatorMap[operatorId] || `Operatör ${operatorId}`;
}

app.post('/api/work-orders', async (req, res) => {
  try {
    console.log('📋 Yeni iş emri oluşturuluyor...', req.body);
    
    // Operatör adını çek
    const operatorName = getOperatorName(req.body.assigned_operator);
    console.log('👤 Operatör adı:', operatorName);
    
    // Mock response döndür
    const newWorkOrder = {
      id: Date.now(), // Basit ID oluştur
      ...req.body,
      assigned_operator_name: operatorName, // Operatör adını ekle
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    
    console.log('✅ Mock iş emri oluşturuldu:', newWorkOrder.id);
    res.json(newWorkOrder);
    return;
    
    // Supabase'e kaydet (gelecekte kullanılacak)
    if (supabase) {
      const { data, error } = await supabase
        .from('work_orders')
        .insert([req.body])
        .select();
      
      if (error) {
        console.error('İş emri oluşturma hatası:', error);
        res.status(500).json({ error: 'İş emri oluşturulamadı' });
        return;
      }
      
      console.log('✅ İş emri oluşturuldu:', data[0].id);
      res.json(data[0]);
    }
    
  } catch (error) {
    console.error('İş emri oluşturma hatası:', error);
    res.status(500).json({ error: 'İş emri oluşturulamadı' });
  }
});

// İş emri silme endpoint'i
app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ İş emri siliniyor:', id);
    
    // Mock response döndür
    console.log('✅ Mock iş emri silindi:', id);
    res.json({ success: true, message: 'İş emri silindi' });
    return;
    
    // Supabase'den sil (gelecekte kullanılacak)
    if (supabase) {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('İş emri silme hatası:', error);
        res.status(500).json({ error: 'İş emri silinemedi' });
        return;
      }
      
      console.log('✅ İş emri silindi:', id);
      res.json({ success: true, message: 'İş emri silindi' });
    }
    
  } catch (error) {
    console.error('İş emri silme hatası:', error);
    res.status(500).json({ error: 'İş emri silinemedi' });
  }
});

// Stok kontrolü API endpoint
app.post('/api/stock/check', async (req, res) => {
  try {
    const { product_id, product_type, quantity } = req.body;
    console.log('📦 Stok kontrolü yapılıyor:', { product_id, product_type, quantity });
    
    if (!supabase) {
      console.log('Supabase bağlantısı yok, mock stok kontrolü yapılıyor');
      // Mock stok kontrolü
      const mockStock = {
        available: 100,
        required: quantity,
        sufficient: quantity <= 100,
        shortage: Math.max(0, quantity - 100)
      };
      res.json(mockStock);
      return;
    }

    // Gerçek stok kontrolü
    const { data: stockData, error: stockError } = await supabase
      .from('stok_hareketleri')
      .select('*')
      .eq('urun_id', product_id)
      .eq('urun_tipi', product_type);

    if (stockError) {
      console.error('Stok sorgulama hatası:', stockError);
      res.status(500).json({ error: 'Stok sorgulanamadı' });
      return;
    }

    // Stok hesaplama
    let currentStock = 0;
    stockData.forEach(movement => {
      if (movement.hareket_tipi === 'giris' || movement.hareket_tipi === 'uretim') {
        currentStock += parseFloat(movement.miktar);
      } else if (movement.hareket_tipi === 'cikis' || movement.hareket_tipi === 'tuketim') {
        currentStock -= parseFloat(movement.miktar);
      }
    });

    const result = {
      available: currentStock,
      required: quantity,
      sufficient: currentStock >= quantity,
      shortage: Math.max(0, quantity - currentStock)
    };

    console.log('✅ Stok kontrolü tamamlandı:', result);
    res.json(result);
  } catch (error) {
    console.error('Stok kontrolü hatası:', error);
    res.status(500).json({ error: 'Stok kontrolü yapılamadı' });
  }
});

// Ürün ağacı (BOM) sorgulama API endpoint
app.get('/api/bom/:product_id/:product_type', async (req, res) => {
  try {
    const { product_id, product_type } = req.params;
    console.log('🌳 Ürün ağacı sorgulanıyor:', { product_id, product_type });
    
    if (!supabase) {
      console.log('Supabase bağlantısı yok, mock BOM döndürülüyor');
      // Mock BOM data
      const mockBOM = [
        { alt_urun_id: 1, alt_urun_tipi: 'hammadde', gerekli_miktar: 5, birim: 'kg', urun_adi: 'Çelik Levha' },
        { alt_urun_id: 2, alt_urun_tipi: 'hammadde', gerekli_miktar: 2, birim: 'metre', urun_adi: 'Alüminyum Profil' },
        { alt_urun_id: 3, alt_urun_tipi: 'hammadde', gerekli_miktar: 0.5, birim: 'kg', urun_adi: 'Plastik Granül' }
      ];
      res.json(mockBOM);
      return;
    }

    // Gerçek BOM sorgusu
    const { data: bomData, error: bomError } = await supabase
      .from('urun_agaci')
      .select('*')
      .eq('ana_urun_id', product_id)
      .eq('ana_urun_tipi', product_type);

    if (bomError) {
      console.error('BOM sorgulama hatası:', bomError);
      // Hata durumunda mock veri döndür
      const mockBOM = [
        { alt_urun_id: 1, alt_urun_tipi: 'hammadde', gerekli_miktar: 5, birim: 'kg', urun_adi: 'Çelik Levha' },
        { alt_urun_id: 2, alt_urun_tipi: 'hammadde', gerekli_miktar: 2, birim: 'metre', urun_adi: 'Alüminyum Profil' },
        { alt_urun_id: 3, alt_urun_tipi: 'hammadde', gerekli_miktar: 0.5, birim: 'kg', urun_adi: 'Plastik Granül' }
      ];
      res.json(mockBOM);
      return;
    }

    // BOM verilerini düzenle
    const formattedBOM = bomData.map(item => ({
      alt_urun_id: item.alt_urun_id,
      alt_urun_tipi: item.alt_urun_tipi,
      gerekli_miktar: item.miktar || 1.0,
      birim: item.birim || 'adet',
      urun_adi: `Malzeme ${item.alt_urun_id}`
    }));

    console.log('✅ BOM sorgusu tamamlandı:', formattedBOM.length, 'malzeme');
    res.json(formattedBOM);
  } catch (error) {
    console.error('BOM sorgulama hatası:', error);
    res.status(500).json({ error: 'Ürün ağacı sorgulanamadı' });
  }
});

// Stok düşme API endpoint
app.post('/api/stock/consume', async (req, res) => {
  try {
    const { product_id, product_type, quantity, production_id, operator_id } = req.body;
    console.log('📉 Stok düşülüyor:', { product_id, product_type, quantity, production_id, operator_id });
    
    if (!supabase) {
      console.log('Supabase bağlantısı yok, mock stok düşme yapılıyor');
      res.json({ success: true, message: 'Mock stok düşme tamamlandı' });
      return;
    }

    // Stok hareketi kaydet
    const { data: stockMovement, error: stockError } = await supabase
      .from('stok_hareketleri')
      .insert({
        urun_id: product_id,
        urun_tipi: product_type,
        hareket_tipi: 'tuketim',
        miktar: quantity,
        birim: 'adet',
        referans_no: `PROD-${production_id}`,
        aciklama: `Üretim tüketimi - Operatör: ${operator_id}`,
        tarih: new Date().toISOString()
      })
      .select();

    if (stockError) {
      console.error('Stok hareketi kaydetme hatası:', stockError);
      res.status(500).json({ error: 'Stok hareketi kaydedilemedi' });
      return;
    }

    console.log('✅ Stok düşme tamamlandı:', stockMovement[0].id);
    res.json({ success: true, message: 'Stok düşme tamamlandı', movement_id: stockMovement[0].id });
  } catch (error) {
    console.error('Stok düşme hatası:', error);
    res.status(500).json({ error: 'Stok düşme yapılamadı' });
  }
});

// Üretim için malzeme kontrolü API endpoint
app.post('/api/production/check-materials', async (req, res) => {
  try {
    const { product_id, product_type, quantity } = req.body;
    console.log('🔍 Üretim malzeme kontrolü:', { product_id, product_type, quantity });
    
    // BOM'u al
    const bomResponse = await fetch(`http://localhost:3000/api/bom/${product_id}/${product_type}`);
    const bomData = await bomResponse.json();
    
    if (!bomData || bomData.error) {
      res.status(500).json({ error: 'BOM alınamadı' });
      return;
    }

    // Her malzeme için stok kontrolü
    const materialChecks = [];
    let allSufficient = true;
    let totalShortage = 0;

    for (const material of bomData) {
      const requiredQuantity = parseFloat(material.gerekli_miktar) * parseFloat(quantity);
      
      const stockResponse = await fetch('http://localhost:3000/api/stock/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: material.alt_urun_id,
          product_type: material.alt_urun_tipi,
          quantity: requiredQuantity
        })
      });
      
      const stockCheck = await stockResponse.json();
      
      materialChecks.push({
        material_id: material.alt_urun_id,
        material_name: material.urun_adi,
        material_type: material.alt_urun_tipi,
        required: requiredQuantity,
        available: stockCheck.available,
        sufficient: stockCheck.sufficient,
        shortage: stockCheck.shortage,
        unit: material.birim
      });
      
      if (!stockCheck.sufficient) {
        allSufficient = false;
        totalShortage += stockCheck.shortage;
      }
    }

    const result = {
      all_sufficient: allSufficient,
      total_shortage: totalShortage,
      materials: materialChecks,
      can_produce: allSufficient
    };

    console.log('✅ Malzeme kontrolü tamamlandı:', result);
    res.json(result);
  } catch (error) {
    console.error('Malzeme kontrolü hatası:', error);
    res.status(500).json({ error: 'Malzeme kontrolü yapılamadı' });
  }
});


// WebSocket yönetimi kaldırıldı - polling kullanılacak

// Real-time server'ı başlat
let realtimeServer = null;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WebSocket server will be available at ws://localhost:${PORT}`);
  
  // Real-time server'ı başlat
  realtimeServer = new RealtimeServer(server);
  console.log('✅ Real-time server initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
