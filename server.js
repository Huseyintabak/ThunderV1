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

// Server başlatma
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
