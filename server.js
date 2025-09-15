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
// ÜRETİM AŞAMALARI YÖNETİMİ API'LERİ - FAZ 1
// ========================================

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

// Aşama şablonu sil
app.delete('/api/production-stages/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('production_stage_templates')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        res.json({ message: 'Aşama şablonu başarıyla silindi' });
    } catch (error) {
        console.error('Delete stage template error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
        
        const { data, error } = await supabase
            .from('quality_checks')
            .insert([{
                production_id: parseInt(production_id),
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
            }])
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Quality check creation error:', error);
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
        
        // Barkod taramaları - KALDIRILDI (barcode_scans tablosu kullanılmıyor)
        const scans = []; // Boş array olarak ayarlandı
        
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

// ==================== FAZ 3: ÜRETİM PLANLAMA VE ZAMANLAMA API'LERİ ====================

// Üretim planları API'leri
app.get('/api/production-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('production_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
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
    const { data, error } = await supabase
      .from('production_plans')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Üretim planı güncelleme error:', error);
    res.status(500).json({ error: 'Üretim planı güncellenemedi' });
  }
});

app.delete('/api/production-plans/:id', async (req, res) => {
  try {
    console.log('Üretim planı siliniyor:', req.params.id);
    
    // Üretim planını sil
    const { error: deleteError } = await supabase
      .from('production_plans')
      .delete()
      .eq('id', req.params.id);
    
    if (deleteError) {
      console.error('Plan silme hatası:', deleteError);
      throw deleteError;
    }
    
    console.log('Plan başarıyla silindi');
    
    // Not: related_orders sütunu olmadığı için sipariş durumu güncelleme işlemi kaldırıldı
    // Bu özellik gelecekte plan-sipariş ilişkisi kurulduğunda eklenebilir
    
    res.json({ message: 'Üretim planı başarıyla silindi' });
  } catch (error) {
    console.error('Üretim planı silme error:', error);
    res.status(500).json({ error: 'Üretim planı silinemedi' });
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

// Operatör listesi API'si - Thunder Serisi ve ThunderPRO Serisi operatörleri
app.get('/api/operators', async (req, res) => {
  try {
    // Thunder serisi operatörleri
    const operators = [
      {
        id: 4,
        name: 'Thunder Serisi Operatör',
        resource_type: 'operator',
        department: 'Üretim',
        skill_level: 'Uzman',
        is_active: true,
        notes: 'Thunder serisi ürünler için özel operatör'
      },
      {
        id: 5,
        name: 'ThunderPRO Serisi Operatör',
        resource_type: 'operator',
        department: 'Üretim',
        skill_level: 'Uzman',
        is_active: true,
        notes: 'ThunderPRO serisi ürünler için özel operatör'
      }
    ];
    
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
    const { data, error } = await supabase
      .from('active_productions')
      .select('*')
      .order('created_at', { ascending: false });
    
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
      
      // Önce order_details tablosundan kontrol et
      const { data: details, error: detailsError } = await supabase
        .from('order_details')
        .select('quantity')
        .eq('order_id', order.id);
      
      if (!detailsError && details && details.length > 0) {
        // order_details tablosunda veri varsa
        totalQuantity = details.reduce((sum, detail) => sum + (detail.quantity || 0), 0);
        productDetails = details;
      } else {
        // order_details tablosunda veri yoksa, notes alanından parse et
        if (order.notes && order.notes.includes('[ÜRÜN DETAYLARI:')) {
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
        
        // Hala miktar bulunamadıysa varsayılan değer
        if (totalQuantity === 0) {
          totalQuantity = 1;
        }
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
      order_date: req.body.order_date,
      delivery_date: deliveryDate,
      priority: parseInt(req.body.priority) || 1,
      status: req.body.status || 'pending',
      notes: req.body.notes || '',
      quantity: parseInt(req.body.quantity) || 0,
      product_details: req.body.product_details || null,
      assigned_operator: req.body.assigned_operator || null,
      operator_notes: req.body.operator_notes || null,
      total_amount: parseFloat(req.body.total_amount) || 0
    };
    
    console.log('Sipariş verisi:', orderData);
    
    const { data, error } = await supabase
      .from('order_management')
      .insert([orderData])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Sipariş oluşturma error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı' });
  }
});

// Tekil sipariş getirme
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_management')
      .select('*')
      .eq('id', req.params.id)
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
    const allowedFields = ['customer_name', 'customer_contact', 'order_date', 'delivery_date', 'priority', 'status', 'total_amount', 'notes', 'quantity', 'product_details', 'assigned_operator', 'operator_notes'];
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
    res.json(data[0]);
  } catch (error) {
    console.error('Sipariş güncelleme error:', error);
    res.status(500).json({ error: 'Sipariş güncellenemedi' });
  }
});

// Sipariş silme
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_management')
      .delete()
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json({ message: 'Sipariş başarıyla silindi', data: data[0] });
  } catch (error) {
    console.error('Sipariş silme error:', error);
    res.status(500).json({ error: 'Sipariş silinemedi' });
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
      supabase.from('order_management').select('id, status, total_amount'),
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
      total_value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
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

// Rapor şablonlarını listele
app.get('/api/reports/templates', async (req, res) => {
  try {
    const { report_type, is_public } = req.query;
    
    let query = supabase
      .from('report_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    if (report_type) {
      query = query.eq('report_type', report_type);
    }
    if (is_public !== undefined) {
      query = query.eq('is_public', is_public === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Rapor şablonları error:', error);
    res.status(500).json({ error: 'Rapor şablonları yüklenemedi' });
  }
});

// Rapor şablonu oluştur
app.post('/api/reports/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Rapor şablonu oluşturma error:', error);
    res.status(500).json({ error: 'Rapor şablonu oluşturulamadı' });
  }
});

// Rapor oluştur
app.post('/api/reports/generate', async (req, res) => {
  try {
    const { template_id, parameters, report_name } = req.body;

    // Şablon bilgilerini al
    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return res.status(400).json({ error: 'Rapor şablonu bulunamadı' });
    }

    // Rapor geçmişine kaydet
    const { data: reportHistory, error: historyError } = await supabase
      .from('report_history')
      .insert([{
        template_id,
        report_name: report_name || template.template_name,
        parameters_used: parameters,
        generated_by: 'system',
        status: 'generating'
      }])
      .select()
      .single();

    if (historyError) throw historyError;

    // Rapor oluşturma işlemi (şimdilik mock)
    const reportData = {
      id: reportHistory.id,
      template_name: template.template_name,
      report_name: report_name || template.template_name,
      status: 'completed',
      generated_at: new Date().toISOString(),
      download_url: `/api/reports/download/${reportHistory.id}`
    };

    // Geçmişi güncelle
    await supabase
      .from('report_history')
      .update({
        status: 'completed',
        file_path: `/reports/${reportHistory.id}.${template.output_format}`
      })
      .eq('id', reportHistory.id);

    res.json(reportData);
  } catch (error) {
    console.error('Rapor oluşturma error:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
});

// Rapor geçmişini listele
app.get('/api/reports/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('report_history')
      .select(`
        *,
        report_templates(template_name, report_type)
      `)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Rapor geçmişi error:', error);
    res.status(500).json({ error: 'Rapor geçmişi yüklenemedi' });
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

// Server başlatma
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Barkod sütununu ekle
  addBarcodeColumnToHammadde();
  
  // Stok hareketleri tablosunu oluştur
  createStokHareketleriTable();
});
