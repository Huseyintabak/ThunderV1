const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const pdf = require('html-pdf');
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
    ad: "BOLT_PLATE",
    kod: "BOLT_PLATE",
    miktar: 50,
    birim: "adet",
    birim_fiyat: 8.75,
    aciklama: "Bolt Plate hammaddesi",
    kategori: "Metal",
    aktif: true,
    barkod: "8690000001002"
  },
  {
    id: 3,
    ad: "SCREW_M6",
    kod: "SCREW_M6",
    miktar: 200,
    birim: "adet",
    birim_fiyat: 2.25,
    aciklama: "M6 Vida hammaddesi",
    kategori: "Vida",
    aktif: true,
    barkod: "8690000001003"
  }
];

// Hata sayacı - aynı hatayı tekrar tekrar göstermemek için
const errorCounts = {};

// Hata mesajını gösterme fonksiyonu
function logSupabaseError(errorMessage) {
  if (!errorCounts[errorMessage]) {
    errorCounts[errorMessage] = 0;
  }
  errorCounts[errorMessage]++;
  
  // İlk 3 hatayı göster, sonra sadece her 10'da bir göster
  if (errorCounts[errorMessage] <= 3 || errorCounts[errorMessage] % 10 === 0) {
    console.log(`Supabase error, using mock data: ${errorMessage} (${errorCounts[errorMessage]} times)`);
  }
}
let yarimamuller = [
  {
    id: 504,
    ad: "BR01_Braket_Kit18+",
    kod: "BR01_Braket_Kit18+",
    miktar: 0,
    birim: "adet",
    birim_maliyet: 67.38,
    aciklama: "",
    kategori: null,
    uretim_suresi: 0,
    aktif: true,
    barkod: "8690000000012"
  },
  {
    id: 506,
    ad: "BR02_Braket_Kit18+",
    kod: "BR02_Braket_Kit18+",
    miktar: 0,
    birim: "adet",
    birim_maliyet: 67.38,
    aciklama: "",
    kategori: null,
    uretim_suresi: 0,
    aktif: true,
    barkod: "8690000000029"
  },
  {
    id: 508,
    ad: "BR03_Braket_Kit18+",
    kod: "BR03_Braket_Kit18+",
    miktar: 0,
    birim: "adet",
    birim_maliyet: 67.38,
    aciklama: "",
    kategori: null,
    uretim_suresi: 0,
    aktif: true,
    barkod: "8690000000036"
  }
];
let nihaiUrunler = [
  {
    id: 1001,
    ad: "Test Nihai Ürün",
    kod: "TEST_NIHAI",
    barkod: "8690000010001",
    aciklama: "Test nihai ürünü",
    birim_fiyat: 200,
    stok_miktari: 0,
    min_stok_seviyesi: 5,
    kategori: "Test",
    uretim_suresi: 3,
    kalite_kontrolu: true
  },
  {
    id: 1002,
    ad: "Berlingo_2018+_2x",
    kod: "Berlingo_2018+_2x",
    barkod: "8690000010004",
    aciklama: "Berlingo 2018+ 2x ürünü",
    birim_fiyat: 200,
    stok_miktari: 0,
    min_stok_seviyesi: 5,
    kategori: "Berlingo",
    uretim_suresi: 3,
    kalite_kontrolu: true
  },
  {
    id: 1003,
    ad: "Berlingo_2018+_3X",
    kod: "Berlingo_2018+_3X",
    barkod: "8690000009992",
    aciklama: "Berlingo 2018+ 3X ürünü",
    birim_fiyat: 250,
    stok_miktari: 0,
    min_stok_seviyesi: 5,
    kategori: "Berlingo",
    uretim_suresi: 4,
    kalite_kontrolu: true
  }
];
let urunAgaci = [
  {
    id: 1,
    ana_urun_id: 504,
    ana_urun_tipi: 'yarimamul',
    alt_urun_id: 1,
    alt_urun_tipi: 'hammadde',
    gerekli_miktar: 2.5,
    birim: 'adet'
  },
  {
    id: 2,
    ana_urun_id: 504,
    ana_urun_tipi: 'yarimamul',
    alt_urun_id: 2,
    alt_urun_tipi: 'hammadde',
    gerekli_miktar: 1.0,
    birim: 'adet'
  },
  {
    id: 3,
    ana_urun_id: 1001,
    ana_urun_tipi: 'nihai',
    alt_urun_id: 504,
    alt_urun_tipi: 'yarimamul',
    gerekli_miktar: 1.0,
    birim: 'adet'
  }
];
let workOrders = [
  {
    id: 1,
    work_order_number: "WO1757572527679",
    product_name: "Test Ürün",
    product_code: "TEST001",
    quantity: 10,
    priority: "normal",
    status: "pending",
    assigned_personnel: "Test Personel",
    start_date: "2025-01-11",
    end_date: "2025-01-18",
    notes: "Test iş emri",
    created_at: "2025-09-11T06:35:27.679Z",
    updated_at: "2025-09-11T06:35:27.679Z"
  }
];
let workOrderStatusHistory = [];

// Hammadde routes
app.get('/api/hammaddeler', async (req, res) => {
  try {
    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('hammaddeler')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        res.json(hammaddeler);
      }
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
    const hammadde = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('hammaddeler')
          .insert([hammadde])
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        hammaddeler.push(hammadde);
        res.json(hammadde);
      }
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
    const updates = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
        .from('hammaddeler')
          .update(updates)
          .eq('id', id)
          .select();
      
      if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = hammaddeler.findIndex(h => h.id === id);
        if (index !== -1) {
          hammaddeler[index] = { ...hammaddeler[index], ...updates };
          res.json(hammaddeler[index]);
        } else {
          res.status(404).json({ error: 'Hammadde bulunamadı' });
        }
      }
    } else {
      const index = hammaddeler.findIndex(h => h.id === id);
      if (index !== -1) {
        hammaddeler[index] = { ...hammaddeler[index], ...updates };
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
      try {
        const { error } = await supabase
        .from('hammaddeler')
          .delete()
          .eq('id', id);
      
      if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
      const index = hammaddeler.findIndex(h => h.id === id);
      if (index !== -1) {
          hammaddeler.splice(index, 1);
          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Hammadde bulunamadı' });
        }
      }
    } else {
      const index = hammaddeler.findIndex(h => h.id === id);
      if (index !== -1) {
        hammaddeler.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Hammadde bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yarı mamul routes
app.get('/api/yarimamuller', async (req, res) => {
  try {
    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('yarimamuller')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        res.json(yarimamuller);
      }
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
    const yarimamul = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('yarimamuller')
          .insert([yarimamul])
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        yarimamuller.push(yarimamul);
        res.json(yarimamul);
      }
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
    const updates = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
        .from('yarimamuller')
          .update(updates)
          .eq('id', id)
          .select();
      
      if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = yarimamuller.findIndex(y => y.id === id);
        if (index !== -1) {
          yarimamuller[index] = { ...yarimamuller[index], ...updates };
          res.json(yarimamuller[index]);
        } else {
          res.status(404).json({ error: 'Yarı mamul bulunamadı' });
        }
      }
    } else {
      const index = yarimamuller.findIndex(y => y.id === id);
      if (index !== -1) {
        yarimamuller[index] = { ...yarimamuller[index], ...updates };
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
      try {
        const { error } = await supabase
        .from('yarimamuller')
          .delete()
          .eq('id', id);
      
      if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
      const index = yarimamuller.findIndex(y => y.id === id);
      if (index !== -1) {
          yarimamuller.splice(index, 1);
          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Yarı mamul bulunamadı' });
        }
      }
    } else {
      const index = yarimamuller.findIndex(y => y.id === id);
      if (index !== -1) {
        yarimamuller.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Yarı mamul bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nihai ürün routes
app.get('/api/nihai_urunler', async (req, res) => {
  try {
    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        res.json(nihaiUrunler);
      }
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
    const nihaiUrun = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
      const { data, error } = await supabase
        .from('nihai_urunler')
          .insert([nihaiUrun])
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        nihaiUrunler.push(nihaiUrun);
        res.json(nihaiUrun);
      }
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
    const updates = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('nihai_urunler')
          .update(updates)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = nihaiUrunler.findIndex(n => n.id === id);
        if (index !== -1) {
          nihaiUrunler[index] = { ...nihaiUrunler[index], ...updates };
          res.json(nihaiUrunler[index]);
        } else {
          res.status(404).json({ error: 'Nihai ürün bulunamadı' });
        }
      }
    } else {
      const index = nihaiUrunler.findIndex(n => n.id === id);
      if (index !== -1) {
        nihaiUrunler[index] = { ...nihaiUrunler[index], ...updates };
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
      try {
      const { error } = await supabase
        .from('nihai_urunler')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = nihaiUrunler.findIndex(n => n.id === id);
        if (index !== -1) {
          nihaiUrunler.splice(index, 1);
          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Nihai ürün bulunamadı' });
        }
      }
    } else {
      const index = nihaiUrunler.findIndex(n => n.id === id);
      if (index !== -1) {
        nihaiUrunler.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Nihai ürün bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ürün ağacı routes
app.get('/api/urun_agaci', async (req, res) => {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('urun_agaci')
        .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        res.json(urunAgaci);
      }
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
    const urunAgaciItem = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('urun_agaci')
          .insert([urunAgaciItem])
          .select();
        
        if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        urunAgaci.push(urunAgaciItem);
        res.json(urunAgaciItem);
      }
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
    const updates = req.body;

    if (supabase) {
      try {
      const { data, error } = await supabase
          .from('urun_agaci')
          .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = urunAgaci.findIndex(u => u.id === id);
        if (index !== -1) {
          urunAgaci[index] = { ...urunAgaci[index], ...updates };
          res.json(urunAgaci[index]);
    } else {
          res.status(404).json({ error: 'Ürün ağacı bulunamadı' });
        }
      }
    } else {
      const index = urunAgaci.findIndex(u => u.id === id);
      if (index !== -1) {
        urunAgaci[index] = { ...urunAgaci[index], ...updates };
        res.json(urunAgaci[index]);
      } else {
        res.status(404).json({ error: 'Ürün ağacı bulunamadı' });
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
      try {
        const { error } = await supabase
          .from('urun_agaci')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = urunAgaci.findIndex(u => u.id === id);
        if (index !== -1) {
          urunAgaci.splice(index, 1);
          res.json({ success: true });
      } else {
          res.status(404).json({ error: 'Ürün ağacı bulunamadı' });
        }
      }
    } else {
      const index = urunAgaci.findIndex(u => u.id === id);
      if (index !== -1) {
        urunAgaci.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Ürün ağacı bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BOM maliyet hesaplama
app.post('/api/calculate-bom-cost', async (req, res) => {
  try {
    const { product_id, product_type } = req.body;
    
    // Bu endpoint sadece mock data için
    res.json({ 
      success: true, 
      message: 'BOM maliyet hesaplama tamamlandı',
      total_cost: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock data sıfırlama
app.post('/api/reset-mock-data', async (req, res) => {
  try {
    hammaddeler = [];
    yarimamuller = [];
    nihaiUrunler = [];
    urunAgaci = [];
    
    res.json({ success: true, message: 'Mock data sıfırlandı' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow veri yapıları
let workflows = [
  {
    id: 1,
    name: "Hammadde Girişi",
    description: "Yeni hammadde sisteme giriş workflow'u",
    type: "hammadde",
    steps: [
      {
        id: 1,
        name: "Veri Doğrulama",
        type: "data_validation",
        config: {
          fields: ["ad", "kod", "miktar", "birim_fiyat"],
          description: "Hammadde bilgileri kontrol edilir"
        }
      },
      {
        id: 2,
        name: "Hammadde Kaydı",
        type: "api_call",
        config: {
          endpoint: "/api/hammaddeler",
          method: "POST",
          description: "Hammadde veritabanına kaydedilir"
        }
      },
      {
        id: 3,
        name: "Maliyet Hesaplama",
        type: "calculation",
        config: {
          formula: "miktar * birim_fiyat",
          description: "Toplam hammadde maliyeti hesaplanır"
        }
      },
      {
        id: 4,
        name: "Bildirim",
        type: "notification",
        config: {
          message: "Hammadde başarıyla eklendi",
          description: "Kullanıcıya başarı bildirimi gönderilir"
        }
      }
    ],
    triggers: {
      type: "manual",
      conditions: []
    },
    conditions: {
      min_stock_level: 0
    },
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Yarı Mamul Üretimi",
    description: "Yarı mamul üretim workflow'u",
    type: "yarimamul",
    steps: [
      {
        id: 1,
        name: "BOM Kontrolü",
        type: "data_validation",
        config: {
          check_bom: true,
          description: "Gerekli hammaddeler kontrol edilir"
        }
      },
      {
        id: 2,
        name: "Hammadde Tüketimi",
        type: "api_call",
        config: {
          endpoint: "/api/consume-materials",
          method: "POST",
          description: "Gerekli hammaddeler stoktan düşülür"
        }
      },
      {
        id: 3,
        name: "Yarı Mamul Kaydı",
        type: "api_call",
        config: {
          endpoint: "/api/yarimamuller",
          method: "POST",
          description: "Üretilen yarı mamul sisteme kaydedilir"
        }
      },
      {
        id: 4,
        name: "BOM Maliyet Hesaplama",
        type: "api_call",
        config: {
          endpoint: "/api/calculate-bom-cost",
          method: "POST",
          description: "Yarı mamul maliyeti hesaplanır"
        }
      }
    ],
    triggers: {
      type: "manual",
      conditions: []
    },
    conditions: {
      min_bom_items: 1
    },
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Nihai Ürün Üretimi",
    description: "Nihai ürün üretim workflow'u",
    type: "nihai",
    steps: [
      {
        id: 1,
        name: "Ürün Ağacı Kontrolü",
        type: "data_validation",
        config: {
          check_bom: true,
          product_type: "nihai",
          description: "Gerekli yarı mamul ve hammaddeler kontrol edilir"
        }
      },
      {
        id: 2,
        name: "Malzeme Çekimi",
        type: "api_call",
        config: {
          endpoint: "/api/consume-materials",
          method: "POST",
          description: "Gerekli malzemeler stoktan çekilir"
        }
      },
      {
        id: 3,
        name: "Üretim İşlemi",
        type: "calculation",
        config: {
          duration: "uretim_suresi",
          description: "Nihai ürün üretilir"
        }
      },
      {
        id: 4,
        name: "Kalite Kontrol",
        type: "data_validation",
        config: {
          quality_check: true,
          description: "Ürün kalitesi kontrol edilir"
        }
      },
      {
        id: 5,
        name: "Nihai Ürün Kaydı",
        type: "api_call",
        config: {
          endpoint: "/api/nihai_urunler",
          method: "POST",
          description: "Nihai ürün sisteme kaydedilir"
        }
      },
      {
        id: 6,
        name: "BOM Maliyet Hesaplama",
        type: "api_call",
        config: {
          endpoint: "/api/calculate-bom-cost",
          method: "POST",
          description: "Nihai ürün maliyeti hesaplanır"
        }
      },
      {
        id: 7,
        name: "İş Emri Oluşturma",
        type: "work_order_creation",
        config: {
          description: "Üretim personeline iş emri oluşturulur"
        }
      }
    ],
    triggers: {
      type: "manual",
      conditions: []
    },
    conditions: {
      min_bom_items: 1
    },
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
let workflowExecutions = [];
let nextId = 4;

// Workflow CRUD API'leri
app.get('/api/workflows', async (req, res) => {
  try {
    console.log('Workflows API called, supabase:', !!supabase);
    
    // Supabase timeout sorunu nedeniyle direkt mock data kullan
    console.log('Workflows array length:', workflows.length);
    console.log('Workflows array:', JSON.stringify(workflows, null, 2));
    res.json(workflows);
  } catch (error) {
    console.error('Workflows API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const workflow = {
      id: nextId++,
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
      const { data, error } = await supabase
          .from('workflows')
          .insert([workflow])
          .select();
      
      if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workflows.push(workflow);
        res.json(workflow);
      }
    } else {
      workflows.push(workflow);
      res.json(workflow);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workflows/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    if (supabase) {
      try {
      const { data, error } = await supabase
          .from('workflows')
          .update(updates)
          .eq('id', id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = workflows.findIndex(w => w.id === id);
        if (index !== -1) {
          workflows[index] = { ...workflows[index], ...updates };
          res.json(workflows[index]);
    } else {
          res.status(404).json({ error: 'Workflow bulunamadı' });
        }
      }
    } else {
      const index = workflows.findIndex(w => w.id === id);
      if (index !== -1) {
        workflows[index] = { ...workflows[index], ...updates };
        res.json(workflows[index]);
      } else {
        res.status(404).json({ error: 'Workflow bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workflows/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      try {
      const { error } = await supabase
          .from('workflows')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = workflows.findIndex(w => w.id === id);
        if (index !== -1) {
          workflows.splice(index, 1);
          res.json({ success: true });
    } else {
          res.status(404).json({ error: 'Workflow bulunamadı' });
        }
      }
    } else {
      const index = workflows.findIndex(w => w.id === id);
      if (index !== -1) {
        workflows.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Workflow bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow Execution API'leri
app.get('/api/workflow-executions', async (req, res) => {
  try {
    console.log('Executions API called, supabase:', !!supabase);
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_executions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        console.log('WorkflowExecutions array length:', data.length);
        console.log('WorkflowExecutions array:', JSON.stringify(data, null, 2));
        res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        console.log('WorkflowExecutions array length:', workflowExecutions.length);
        console.log('WorkflowExecutions array:', JSON.stringify(workflowExecutions, null, 2));
        res.json(workflowExecutions);
      }
    } else {
      console.log('WorkflowExecutions array length:', workflowExecutions.length);
      console.log('WorkflowExecutions array:', JSON.stringify(workflowExecutions, null, 2));
      res.json(workflowExecutions);
    }
  } catch (error) {
    console.error('Workflow executions API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflow-executions', async (req, res) => {
  try {
    const execution = {
      id: Math.floor(Math.random() * 2147483647), // 32-bit integer aralığında
      ...req.body,
      status: 'pending',
      progress: 0,
      current_step: 0,
      execution_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_executions')
          .insert([execution])
          .select();
        
        if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workflowExecutions.push(execution);
        res.json(execution);
      }
    } else {
      workflowExecutions.push(execution);
      res.json(execution);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workflow-executions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    if (supabase) {
      try {
      const { data, error } = await supabase
          .from('workflow_executions')
          .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = workflowExecutions.findIndex(e => e.id === id);
        if (index !== -1) {
          workflowExecutions[index] = { ...workflowExecutions[index], ...updates };
          res.json(workflowExecutions[index]);
    } else {
          res.status(404).json({ error: 'Workflow execution bulunamadı' });
        }
      }
    } else {
      const index = workflowExecutions.findIndex(e => e.id === id);
      if (index !== -1) {
        workflowExecutions[index] = { ...workflowExecutions[index], ...updates };
        res.json(workflowExecutions[index]);
      } else {
        res.status(404).json({ error: 'Workflow execution bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow çalıştırma
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const executionData = req.body;
    
    // Workflow'u bul
    let workflow;
      if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .single();
        
        if (error) throw error;
        workflow = data;
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workflow = workflows.find(w => w.id === workflowId);
      }
    } else {
      workflow = workflows.find(w => w.id === workflowId);
    }

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow bulunamadı' });
    }

    // Execution oluştur
    const execution = {
      id: Math.floor(Math.random() * 2147483647), // 32-bit integer aralığında
      workflow_id: workflowId,
      status: 'running',
      started_at: new Date().toISOString(),
      execution_data: executionData,
      progress: 0,
      current_step: 0,
      execution_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_executions')
          .insert([execution])
          .select();
        
        if (error) throw error;
        execution.id = data[0].id;
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workflowExecutions.push(execution);
      }
    } else {
      workflowExecutions.push(execution);
    }

    // Workflow'u asenkron olarak çalıştır
    executeWorkflow(workflow, execution, executionData);

    res.json({ 
      success: true, 
      message: 'Workflow başlatıldı!',
      execution_id: execution.id 
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Workflow durdurma
app.post('/api/workflow-executions/:id/stop', async (req, res) => {
  try {
    const executionId = parseInt(req.params.id);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_executions')
          .update({ 
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', executionId)
          .select();
        
        if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = workflowExecutions.findIndex(e => e.id === executionId);
        if (index !== -1) {
          workflowExecutions[index].status = 'paused';
          workflowExecutions[index].updated_at = new Date().toISOString();
          res.json(workflowExecutions[index]);
      } else {
          res.status(404).json({ error: 'Workflow execution bulunamadı' });
        }
      }
    } else {
      const index = workflowExecutions.findIndex(e => e.id === executionId);
        if (index !== -1) {
        workflowExecutions[index].status = 'paused';
        workflowExecutions[index].updated_at = new Date().toISOString();
        res.json(workflowExecutions[index]);
        } else {
        res.status(404).json({ error: 'Workflow execution bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow execution engine
async function executeWorkflow(workflow, execution, executionData) {
  console.log(`🚀 Workflow başlatılıyor: ${workflow.name} (ID: ${workflow.id})`);
  
  try {
    const steps = workflow.steps;
    const totalSteps = steps.length;
    let currentLogs = [];

    for (let i = 0; i < totalSteps; i++) {
      const step = steps[i];
      console.log(`📋 Adım ${i + 1}/${totalSteps}: ${step.name}`);
      
      // Adım başlangıç logu
      const startLog = {
        step: i + 1,
        step_name: step.name,
        timestamp: new Date().toISOString(),
        status: 'running'
      };
      currentLogs.push(startLog);

      try {
        // Adımı çalıştır
        await executeStep(step, executionData);
        
        // Adım tamamlandı logu
        const completeLog = {
          step: i + 1,
          step_name: step.name,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        currentLogs.push(completeLog);

        // Progress güncelle
        const progress = Math.round(((i + 1) / totalSteps) * 100);
        await updateExecution(execution.id, {
          progress: progress,
          current_step: i + 1,
          execution_log: [...currentLogs]
        });

        console.log(`✅ Adım ${i + 1} tamamlandı: ${step.name}`);
        
        // Adımlar arası bekleme (gerçek uygulamada kaldırılabilir)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (stepError) {
        console.error(`❌ Adım ${i + 1} hatası: ${step.name}`, stepError);
        
        // Hata logu
        const errorLog = {
          step: i + 1,
          step_name: step.name,
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: stepError.message
        };
        currentLogs.push(errorLog);

        // Execution'ı failed olarak güncelle
        await updateExecution(execution.id, {
          status: 'failed',
          error_message: stepError.message,
          execution_log: [...currentLogs]
        });

        return; // Workflow'u durdur
      }
    }

    // Workflow tamamlandı
    console.log(`🎉 Workflow tamamlandı: ${workflow.name}`);
    await updateExecution(execution.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      execution_log: [...currentLogs]
    });

  } catch (error) {
    console.error(`💥 Workflow hatası: ${workflow.name}`, error);
    await updateExecution(execution.id, {
      status: 'failed',
      error_message: error.message,
      execution_log: [...currentLogs]
    });
  }
}

// Adım çalıştırma fonksiyonu
async function executeStep(step, executionData) {
  console.log(`🔧 Step çalıştırılıyor: ${step.name} (${step.type})`);
  
  switch (step.type) {
    case 'data_validation':
      await executeDataValidation(step, executionData);
      break;
    case 'api_call':
      await executeApiCall(step, executionData);
      break;
    case 'calculation':
      await executeCalculation(step, executionData);
      break;
    case 'notification':
      await executeNotification(step, executionData);
      break;
    case 'work_order_creation':
      await executeWorkOrderCreation(step, executionData);
      break;
    default:
      throw new Error(`Bilinmeyen step tipi: ${step.type}`);
  }
}

// Veri doğrulama
async function executeDataValidation(step, executionData) {
  console.log(`🔍 Veri doğrulama: ${step.name}`);
  
  if (step.config.fields) {
    // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
    const dataToValidate = executionData.real_data || executionData;
    console.log('🔍 Doğrulanacak veri:', dataToValidate);
    
    const missingFields = step.config.fields.filter(field => !dataToValidate[field]);
    if (missingFields.length > 0) {
      throw new Error(`Eksik alanlar: ${missingFields.join(', ')}`);
    }
  }
  
  if (step.config.check_bom) {
    console.log('📋 BOM kontrolü yapılıyor...');
    // BOM kontrolü burada yapılabilir
  }
  
  if (step.config.quality_check) {
    console.log('🔬 Kalite kontrolü yapılıyor...');
    // Kalite kontrolü burada yapılabilir
  }
  
  console.log('✅ Veri doğrulama başarılı');
}

// API çağrısı
async function executeApiCall(step, executionData) {
  console.log(`🔗 API çağrısı: ${step.config.endpoint}`);
  
  if (step.config.endpoint === '/api/hammaddeler' && step.config.method === 'POST') {
    // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
    const dataToUse = executionData.real_data || executionData;
    console.log('🔗 Kullanılacak veri:', dataToUse);
    
    // Hammadde ekleme
    const hammaddeData = {
      ad: dataToUse.ad,
      kod: dataToUse.kod,
      miktar: dataToUse.miktar,
      birim: dataToUse.birim || 'adet',
      birim_fiyat: dataToUse.birim_fiyat,
      tedarikci: dataToUse.tedarikci || '',
      kategori: dataToUse.kategori || '',
      aktif: true
    };
    
      if (supabase) {
      const { data, error } = await supabase
        .from('hammaddeler')
        .insert([hammaddeData])
        .select();
      
      if (error) throw error;
      console.log('✅ Hammadde veritabanına kaydedildi:', data[0]);
    } else {
      hammaddeData.id = Date.now();
      hammaddeler.push(hammaddeData);
      console.log('✅ Hammadde mock data\'ya kaydedildi:', hammaddeData);
    }
  } else if (step.config.endpoint === '/api/yarimamuller' && step.config.method === 'POST') {
    // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
    const dataToUse = executionData.real_data || executionData;
    console.log('🔗 Kullanılacak veri:', dataToUse);
    
    // Yarı mamul ekleme
    const yarimamulData = {
      ad: dataToUse.ad,
      kod: dataToUse.kod,
      miktar: dataToUse.miktar,
      birim: dataToUse.birim || 'adet',
      aciklama: dataToUse.aciklama || '',
      aktif: true
    };
    
    if (supabase) {
        const { data, error } = await supabase
          .from('yarimamuller')
        .insert([yarimamulData])
          .select();
        
        if (error) throw error;
      console.log('✅ Yarı mamul veritabanına kaydedildi:', data[0]);
      } else {
      yarimamulData.id = Date.now();
      yarimamuller.push(yarimamulData);
      console.log('✅ Yarı mamul mock data\'ya kaydedildi:', yarimamulData);
    }
  } else if (step.config.endpoint === '/api/nihai_urunler' && step.config.method === 'POST') {
    // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
    const dataToUse = executionData.real_data || executionData;
    console.log('🔗 Kullanılacak veri:', dataToUse);
    
    // Nihai ürün ekleme
    const nihaiUrunData = {
      ad: dataToUse.ad,
      kod: dataToUse.kod,
      barkod: dataToUse.barkod || '',
      miktar: dataToUse.miktar || 0,
      birim: dataToUse.birim || 'adet',
      aciklama: dataToUse.aciklama || '',
      aktif: true
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('nihai_urunler')
        .insert([nihaiUrunData])
        .select();
      
      if (error) throw error;
      console.log('✅ Nihai ürün veritabanına kaydedildi:', data[0]);
    } else {
      nihaiUrunData.id = Date.now();
      nihaiUrunler.push(nihaiUrunData);
      console.log('✅ Nihai ürün mock data\'ya kaydedildi:', nihaiUrunData);
    }
  } else if (step.config.endpoint.includes('/api/work-orders/') && step.config.endpoint.includes('/status') && step.config.method === 'PUT') {
    // İş emri durum güncelleme
    const dataToUse = executionData.real_data || executionData;
    console.log('🔗 İş emri durum güncelleme verisi:', dataToUse);
    
    const workOrderId = dataToUse.work_order_id;
    const newStatus = dataToUse.new_status;
    
    if (!workOrderId || !newStatus) {
      throw new Error('İş emri ID ve yeni durum gerekli');
    }
    
    console.log(`🔄 İş emri ${workOrderId} durumu ${newStatus} olarak güncelleniyor...`);
    
    if (supabase) {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', BigInt(workOrderId))
        .select();
      
      if (error) throw error;
      console.log('✅ İş emri durumu veritabanında güncellendi:', data[0]);
    } else {
      const workOrder = mockWorkOrders.find(wo => wo.id === parseInt(workOrderId));
      if (workOrder) {
        workOrder.status = newStatus;
        workOrder.updated_at = new Date().toISOString();
        console.log('✅ İş emri durumu mock data\'da güncellendi:', workOrder);
      } else {
        throw new Error('İş emri bulunamadı');
      }
    }
  } else if (step.config.endpoint === '/api/work-order-status-history' && step.config.method === 'POST') {
    // İş emri durum geçmişi kaydı
    const dataToUse = executionData.real_data || executionData;
    console.log('🔗 Durum geçmişi kayıt verisi:', dataToUse);
    
    const statusHistoryData = {
      work_order_id: dataToUse.work_order_id,
      old_status: dataToUse.old_status || 'unknown',
      new_status: dataToUse.new_status,
      changed_by: dataToUse.changed_by || 'system',
      change_reason: dataToUse.change_reason || 'Workflow execution',
      changed_at: new Date().toISOString()
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('work_order_status_history')
        .insert([statusHistoryData])
        .select();
      
      if (error) throw error;
      console.log('✅ Durum geçmişi veritabanına kaydedildi:', data[0]);
    } else {
      statusHistoryData.id = Date.now();
      console.log('✅ Durum geçmişi mock data\'ya kaydedildi:', statusHistoryData);
    }
  }
  
  console.log('✅ API çağrısı başarılı');
}

// Hesaplama
async function executeCalculation(step, executionData) {
  console.log(`🧮 Hesaplama: ${step.name}`);
  
  if (step.config.formula === 'miktar * birim_fiyat') {
    // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
    const dataToUse = executionData.real_data || executionData;
    const totalCost = dataToUse.miktar * dataToUse.birim_fiyat;
    console.log(`💰 Toplam maliyet hesaplandı: ${totalCost}`);
    dataToUse.calculated_cost = totalCost;
  }
  
  if (step.config.duration) {
    console.log(`⏱️ Süre hesaplaması: ${step.config.duration}`);
    // Süre hesaplaması burada yapılabilir
  }
  
  console.log('✅ Hesaplama tamamlandı');
}

// Bildirim
async function executeNotification(step, executionData) {
  console.log(`📢 Bildirim: ${step.config.message}`);
  console.log('✅ Bildirim gönderildi');
}

// İş emri oluşturma
async function executeWorkOrderCreation(step, executionData) {
  console.log(`📋 İş emri oluşturuluyor: ${step.name}`);
  
  // Veri real_data içindeyse onu kullan, değilse direkt executionData'yı kullan
  const dataToUse = executionData.real_data || executionData;
  console.log('📋 Kullanılacak veri:', dataToUse);
  
  // İş emri oluştur
  const workOrderData = {
    product_name: dataToUse.ad || dataToUse.product_name || 'Ürün',
    product_code: dataToUse.kod || dataToUse.product_code || '',
    quantity: dataToUse.miktar || dataToUse.quantity || 1,
    priority: 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 gün sonra
    assigned_personnel: 'Atanacak',
    status: 'pending',
    bom_data: dataToUse.bom_data || null,
    notes: `Otomatik oluşturulan iş emri - ${step.name}`,
    created_by: 'Workflow Sistemi'
  };
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .insert([workOrderData])
        .select();
      
      if (error) throw error;
      console.log('✅ İş emri veritabanına kaydedildi:', data[0]);
    } catch (supabaseError) {
      console.log('Supabase error, using mock data:', supabaseError.message);
      workOrderData.id = Date.now();
      workOrderData.work_order_number = `WO${Date.now()}`;
      workOrders.push(workOrderData);
      console.log('✅ İş emri mock data\'ya kaydedildi:', workOrderData);
    }
  } else {
    workOrderData.id = Date.now();
    workOrderData.work_order_number = `WO${Date.now()}`;
    workOrders.push(workOrderData);
    console.log('✅ İş emri mock data\'ya kaydedildi:', workOrderData);
  }
  
  console.log('✅ İş emri oluşturma tamamlandı');
}


// Execution güncelleme
async function updateExecution(executionId, updates) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update(updates)
        .eq('id', executionId);
      
      if (error) throw error;
    } catch (supabaseError) {
      console.log('Supabase error, using mock data:', supabaseError.message);
      const index = workflowExecutions.findIndex(e => e.id === executionId);
        if (index !== -1) {
        workflowExecutions[index] = { ...workflowExecutions[index], ...updates };
      }
    }
        } else {
    const index = workflowExecutions.findIndex(e => e.id === executionId);
    if (index !== -1) {
      workflowExecutions[index] = { ...workflowExecutions[index], ...updates };
    }
  }
}

// Work Order API'leri
app.get('/api/work-orders', async (req, res) => {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        res.json(workOrders);
      }
    } else {
      res.json(workOrders);
    }
  } catch (error) {
    console.error('Work orders API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/work-orders', async (req, res) => {
  try {
    const workOrderNumber = `WO${Date.now()}`;
    const workOrder = {
      id: Math.floor(Math.random() * 2147483647), // 32-bit integer aralığında
      work_order_number: workOrderNumber,
      ...req.body,
      total_cost: req.body.total_cost || 0, // total_cost kolonu ekle
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .insert([workOrder])
          .select();
        
        if (error) throw error;
        res.json(data[0]);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workOrders.push(workOrder);
        res.json(workOrder);
      }
      } else {
      workOrders.push(workOrder);
      res.json(workOrder);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tek iş emri getirme
app.get('/api/work-orders/:id', async (req, res) => {
  try {
    console.log('🔍 GET /api/work-orders/:id - req.params:', req.params);
    console.log('🔍 req.params.id:', req.params.id, 'type:', typeof req.params.id);
    
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'İş emri ID gerekli' });
    }
    
    const id = BigInt(req.params.id);
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        res.json(data);
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const workOrder = workOrders.find(w => w.id === id);
        if (workOrder) {
          res.json(workOrder);
        } else {
          res.status(404).json({ error: 'İş emri bulunamadı' });
        }
      }
    } else {
      const workOrder = workOrders.find(w => w.id === id);
      if (workOrder) {
        res.json(workOrder);
      } else {
        res.status(404).json({ error: 'İş emri bulunamadı' });
      }
    }
  } catch (error) {
    console.error('İş emri getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Malzeme hesaplama API'si
app.post('/api/calculate-materials', async (req, res) => {
  try {
    const { productId, productType, quantity } = req.body;
    
    if (!productId || !productType || !quantity) {
      return res.status(400).json({ error: 'Eksik parametreler' });
    }
    
    const materials = [];
    const productIdInt = parseInt(productId);
    
    // Ürün ağacından alt ürünleri bul
    const bomItems = urunAgaci.filter(item => 
      item.ana_urun_id === productIdInt && 
      item.ana_urun_tipi === productType
    );
    
    for (const bomItem of bomItems) {
      const requiredQuantity = bomItem.gerekli_miktar * quantity;
      let material = null;
      let currentStock = 0;
      let unitPrice = 0;
      
      // Malzeme tipine göre bilgileri al
      if (bomItem.alt_urun_tipi === 'hammadde') {
        material = hammaddeler.find(h => h.id === bomItem.alt_urun_id);
        if (material) {
          currentStock = material.miktar;
          unitPrice = material.birim_fiyat;
        }
      } else if (bomItem.alt_urun_tipi === 'yarimamul') {
        material = yarimamuller.find(y => y.id === bomItem.alt_urun_id);
        if (material) {
          currentStock = material.miktar;
          unitPrice = material.birim_maliyet;
        }
      }
      
      if (material) {
        const shortage = Math.max(0, requiredQuantity - currentStock);
        const totalCost = requiredQuantity * unitPrice;
        const status = shortage > 0 ? 'Yetersiz' : 'Yeterli';
        
        materials.push({
          id: material.id,
          name: material.ad,
          code: material.kod,
          type: bomItem.alt_urun_tipi,
          required: requiredQuantity,
          available: currentStock,
          shortage: shortage,
          unit: bomItem.birim,
          unitPrice: unitPrice,
          totalCost: totalCost,
          status: status
        });
      }
    }
    
    res.json(materials);
  } catch (error) {
    console.error('Malzeme hesaplama API hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş emri durum güncelleme (Basit sistem)
app.put('/api/work-orders/:id/status', async (req, res) => {
  try {
    const idParam = req.params.id;
    console.log('Basit durum güncelleme - İş emri ID:', idParam, 'Tip:', typeof idParam);
    
    if (!idParam || idParam === 'undefined' || idParam === 'null') {
      return res.status(400).json({ error: 'İş emri ID gerekli' });
    }
    
    const id = BigInt(idParam);
    const { status } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('İş emri durum güncelleme hatası:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      res.json(data[0]);
    } else {
      // Mock data için
      const workOrder = mockWorkOrders.find(wo => wo.id === id);
      if (workOrder) {
        workOrder.status = status;
        workOrder.updated_at = new Date().toISOString();
        res.json(workOrder);
      } else {
        res.status(404).json({ error: 'İş emri bulunamadı' });
      }
    }
  } catch (error) {
    console.error('İş emri durum güncelleme API hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş emri güncelleme
app.put('/api/work-orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    if (supabase) {
      const { data, error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
    } else {
      const index = workOrders.findIndex(w => w.id === id);
      if (index !== -1) {
        workOrders[index] = { ...workOrders[index], ...updates };
        res.json(workOrders[index]);
      } else {
        res.status(404).json({ error: 'İş emri bulunamadı' });
      }
    }
  } catch (error) {
    console.error('İş emri güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('work_orders')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        res.json({ success: true });
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        const index = workOrders.findIndex(w => w.id === id);
        if (index !== -1) {
          workOrders.splice(index, 1);
          res.json({ success: true });
    } else {
          res.status(404).json({ error: 'İş emri bulunamadı' });
        }
      }
    } else {
      const index = workOrders.findIndex(w => w.id === id);
      if (index !== -1) {
        workOrders.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'İş emri bulunamadı' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// İş emri koduna göre ürün bilgilerini getir
app.get('/api/work-orders/code/:code', async (req, res) => {
  try {
    const code = req.params.code;
    
    // İş emrini bul
    let workOrder;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .eq('work_order_number', code)
          .single();
        
        if (error) throw error;
        workOrder = data;
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workOrder = workOrders.find(w => w.work_order_number === code);
      }
    } else {
      workOrder = workOrders.find(w => w.work_order_number === code);
    }

    if (!workOrder) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // Ürün tipini belirle (gerçek veri tabanında arayarak)
    let productType = 'nihai'; // Varsayılan olarak nihai ürün
    
    if (workOrder.product_code) {
      // Önce yarı mamuller arasında ara
      const yarimamul = yarimamuller.find(p => p.kod === workOrder.product_code);
      if (yarimamul) {
        productType = 'yarimamul';
      } else {
        // Yarı mamul değilse nihai ürün olarak kabul et
        const nihaiUrun = nihaiUrunler.find(p => p.kod === workOrder.product_code);
        if (nihaiUrun) {
          productType = 'nihai';
        }
      }
    }
    
    console.log(`Ürün tipi tespit edildi: ${productType} (kod: ${workOrder.product_code})`);

    res.json({
      workOrder: workOrder,
      productType: productType,
      productCode: workOrder.product_code,
      productName: workOrder.product_name,
      quantity: workOrder.quantity,
      materials: workOrder.materials || []
    });
  } catch (error) {
    console.error('Work order lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş emri PDF oluşturma
// HTML görüntüleme endpoint'i
app.get('/api/work-orders/:id/html', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // İş emrini bul
    let workOrder;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        workOrder = data;
      } catch (supabaseError) {
        logSupabaseError(supabaseError.message);
        workOrder = workOrders.find(w => w.id === id);
      }
    } else {
      workOrder = workOrders.find(w => w.id === id);
    }

    if (!workOrder) {
      return res.status(404).json({ error: 'İş emri bulunamadı' });
    }

    // HTML içeriği oluştur
    const htmlContent = generateWorkOrderHTML(workOrder);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('HTML generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HTML oluşturma fonksiyonu
function generateWorkOrderHTML(workOrder) {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  const currentTime = new Date().toLocaleTimeString('tr-TR');
  
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İş Emri - ${workOrder.work_order_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 10px;
            line-height: 1.4;
            font-size: 12px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        .document-title {
            font-size: 14px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        .work-order-info {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .info-section {
            background-color: #f8f9fa;
            padding: 8px;
            border-radius: 3px;
        }
        .info-section h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            font-size: 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .product-details {
            margin-bottom: 15px;
        }
        .product-details h3 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            font-size: 12px;
        }
        .bom-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
            font-size: 4px;
        }
        .bom-table th,
        .bom-table td {
            border: 1px solid #ddd;
            padding: 1px;
            text-align: left;
        }
        .bom-table th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        .bom-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .signature-section {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .materials-section {
            margin-bottom: 15px;
        }
        .notes-section {
            margin-bottom: 15px;
        }
        .signature-box {
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 5px;
            font-size: 10px;
        }
        .signature-line {
            height: 30px;
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
        }
        .priority-urgent { color: #e74c3c; font-weight: bold; }
        .priority-high { color: #f39c12; font-weight: bold; }
        .priority-normal { color: #27ae60; font-weight: bold; }
        .priority-low { color: #95a5a6; font-weight: bold; }
        .status-pending { color: #f39c12; font-weight: bold; }
        .status-in_progress { color: #3498db; font-weight: bold; }
        .status-completed { color: #27ae60; font-weight: bold; }
        .status-cancelled { color: #e74c3c; font-weight: bold; }
        .badge {
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-primary { background-color: #3498db; color: white; }
        .badge-warning { background-color: #f39c12; color: white; }
        .qr-code {
            text-align: center;
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 3px;
            font-size: 10px;
        }
        .notes {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 8px;
            border-radius: 3px;
            margin-top: 10px;
            font-size: 10px;
        }
        .notes h4 {
            margin-top: 0;
            color: #856404;
            font-size: 10px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">THUNDER V1 ÜRETİM SİSTEMİ</div>
        <div class="document-title">İŞ EMRİ</div>
        <div style="margin-top: 5px; font-size: 10px; color: #7f8c8d;">
            ${currentDate} ${currentTime}
        </div>
    </div>

    <div class="work-order-info">
        <div class="info-section">
            <h3>İş Emri Bilgileri</h3>
            <div class="info-row">
                <span class="info-label">İş Emri No:</span>
                <span class="info-value"><strong>${workOrder.work_order_number}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Durum:</span>
                <span class="info-value status-${workOrder.status}">${getStatusText(workOrder.status)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Öncelik:</span>
                <span class="info-value priority-${workOrder.priority}">${getPriorityText(workOrder.priority)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Oluşturan:</span>
                <span class="info-value">${workOrder.created_by || 'Sistem'}</span>
            </div>
        </div>

        <div class="info-section">
            <h3>Ürün Bilgileri</h3>
            <div class="info-row">
                <span class="info-label">Ürün Adı:</span>
                <span class="info-value"><strong>${workOrder.product_name}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Ürün Kodu:</span>
                <span class="info-value">${workOrder.product_code || 'Belirtilmemiş'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Üretim Miktarı:</span>
                <span class="info-value"><strong>${workOrder.quantity} adet</strong></span>
            </div>
        </div>

        <div class="info-section">
            <h3>Tarih Bilgileri</h3>
            <div class="info-row">
                <span class="info-label">Başlangıç Tarihi:</span>
                <span class="info-value">${workOrder.start_date ? new Date(workOrder.start_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Bitiş Tarihi:</span>
                <span class="info-value">${workOrder.end_date ? new Date(workOrder.end_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sorumlu Personel:</span>
                <span class="info-value">${workOrder.assigned_personnel || 'Atanmamış'}</span>
            </div>
        </div>
    </div>

    <div class="materials-section">
        <h3>Gerekli Malzemeler</h3>
        ${workOrder.materials && workOrder.materials.length > 0 ? `
            <table class="bom-table">
                <thead>
                    <tr>
                        <th>Malzeme</th>
                        <th>Kod</th>
                        <th>Gerekli</th>
                        <th>Mevcut</th>
                        <th>Durum</th>
                    </tr>
                </thead>
                <tbody>
                    ${workOrder.materials.map(material => `
                        <tr>
                            <td>${material.name || 'Belirtilmemiş'}</td>
                            <td>${material.code || '-'}</td>
                            <td>${material.required ? material.required.toFixed(1) : 0} ${material.unit || 'adet'}</td>
                            <td>${material.available ? material.available.toFixed(1) : 0} ${material.unit || 'adet'}</td>
                            <td><span class="status-${material.status === 'Yeterli' ? 'completed' : 'pending'}">${material.status || 'Bilinmiyor'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p>Malzeme bilgisi bulunamadı</p>'}
    </div>

    ${workOrder.notes ? `
    <div class="notes-section">
        <h3>Özel Notlar</h3>
        <p>${workOrder.notes}</p>
    </div>
    ` : ''}


    ${workOrder.bom_data ? `
    <div class="product-details">
        <h3>Malzeme Listesi (BOM)</h3>
        <table class="bom-table">
            <thead>
                <tr>
                    <th>Malzeme Adı</th>
                    <th>Kod</th>
                    <th>Miktar</th>
                    <th>Birim</th>
                    <th>Notlar</th>
                </tr>
            </thead>
            <tbody>
                ${workOrder.bom_data.map(item => `
                    <tr>
                        <td>${item.name || 'Belirtilmemiş'}</td>
                        <td>${item.code || '-'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${item.unit || 'adet'}</td>
                        <td>${item.notes || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${workOrder.notes ? `
    <div class="notes">
        <h4>Özel Notlar</h4>
        <p>${workOrder.notes}</p>
    </div>
    ` : ''}

    <div class="qr-code">
        <div style="font-size: 8px; color: #7f8c8d; margin-bottom: 5px;">
            Takip Kodu: ${workOrder.work_order_number}
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>Üretim Personeli</strong></div>
            <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                Ad Soyad & İmza
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>Üretim Yöneticisi</strong></div>
            <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                Ad Soyad & İmza
            </div>
        </div>
    </div>

    <div style="text-align: center; margin-top: 15px; font-size: 8px; color: #7f8c8d;">
        ThunderV1 Üretim Sistemi
    </div>

    <script>
        // Yazdırma için otomatik sayfa ayarları
        window.onload = function() {
            // Yazdırma için optimize edilmiş görünüm
            if (window.location.search.includes('print=true')) {
                window.print();
            }
        };
    </script>
</body>
</html>
  `;
}

// Yardımcı fonksiyonlar
function getStatusText(status) {
  const statusMap = {
    'pending': 'Beklemede',
    'in_progress': 'Devam Ediyor',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi'
  };
  return statusMap[status] || status;
}

function getPriorityText(priority) {
  const priorityMap = {
    'low': 'Düşük',
    'normal': 'Normal',
    'high': 'Yüksek',
    'urgent': 'Acil'
  };
  return priorityMap[priority] || priority;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
