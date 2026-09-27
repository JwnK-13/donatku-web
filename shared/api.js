/* ============================================================
   DONATKU SHARED — API Wrapper (CRUD)
   ============================================================ */

const API = {
  /* ============ STORE SETTINGS ============ */
  async getSettings() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw new Error('Gagal memuat pengaturan toko.');
    return data;
  },

  async updateSettings(patch) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('store_settings')
      .update(patch)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw new Error('Gagal menyimpan pengaturan.');
    return data;
  },

  /* ============ TOPPINGS ============ */
  async getToppings(activeOnly) {
    const sb = getSupabase();
    let q = sb.from('toppings').select('*').order('sort_order', { ascending: true });
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw new Error('Gagal memuat topping.');
    return data || [];
  },

  async getTopping(id) {
    const sb = getSupabase();
    const { data, error } = await sb.from('toppings').select('*').eq('id', id).single();
    if (error) throw new Error('Topping tidak ditemukan.');
    return data;
  },

  async createTopping(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from('toppings').insert(payload).select().single();
    if (error) throw new Error('Gagal menambah topping: ' + error.message);
    return data;
  },

  async updateTopping(id, patch) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('toppings')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Gagal memperbarui topping.');
    return data;
  },

  async deleteTopping(id) {
    const sb = getSupabase();
    const { error } = await sb.from('toppings').delete().eq('id', id);
    if (error) throw new Error('Gagal menghapus topping.');
    return true;
  },

  /* ============ CRUMBLES ============ */
  async getCrumbles(activeOnly) {
    const sb = getSupabase();
    let q = sb.from('crumbles').select('*').order('sort_order', { ascending: true });
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw new Error('Gagal memuat crumble.');
    return data || [];
  },

  async createCrumble(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from('crumbles').insert(payload).select().single();
    if (error) throw new Error('Gagal menambah crumble.');
    return data;
  },

  async updateCrumble(id, patch) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('crumbles')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Gagal memperbarui crumble.');
    return data;
  },

  async deleteCrumble(id) {
    const sb = getSupabase();
    const { error } = await sb.from('crumbles').delete().eq('id', id);
    if (error) throw new Error('Gagal menghapus crumble.');
    return true;
  },

  /* ============ TOPPING-CRUMBLE RELATIONS ============ */
  async getToppingCrumbleMap() {
    const sb = getSupabase();
    const { data, error } = await sb.from('topping_crumble_relations').select('topping_id, crumble_id');
    if (error) throw new Error('Gagal memuat relasi.');
    // Return map: { toppingId: [crumbleId, ...] }
    const map = {};
    (data || []).forEach(function(r) {
      if (!map[r.topping_id]) map[r.topping_id] = [];
      map[r.topping_id].push(r.crumble_id);
    });
    return map;
  },

  async setToppingCrumbleRelations(toppingId, crumbleIds) {
    const sb = getSupabase();
    // Hapus yang lama
    await sb.from('topping_crumble_relations').delete().eq('topping_id', toppingId);
    // Insert baru
    if (crumbleIds && crumbleIds.length) {
      const rows = crumbleIds.map(function(cid) {
        return { topping_id: toppingId, crumble_id: cid };
      });
      const { error } = await sb.from('topping_crumble_relations').insert(rows);
      if (error) throw new Error('Gagal menyimpan relasi crumble.');
    }
    return true;
  },

  /* ============ DELIVERY DATES ============ */
  async getDeliveryDates(fromDate, toDate) {
    const sb = getSupabase();
    let q = sb.from('delivery_dates').select('*').order('date', { ascending: true });
    if (fromDate) q = q.gte('date', fromDate);
    if (toDate) q = q.lte('date', toDate);
    const { data, error } = await q;
    if (error) throw new Error('Gagal memuat tanggal pengantaran.');
    return data || [];
  },

  async getDeliveryDate(date) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('delivery_dates')
      .select('*')
      .eq('date', date)
      .maybeSingle();
    if (error) throw new Error('Gagal memuat tanggal.');
    return data;
  },

  async upsertDeliveryDate(payload) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('delivery_dates')
      .upsert(payload, { onConflict: 'date' })
      .select()
      .single();
    if (error) throw new Error('Gagal menyimpan tanggal.');
    return data;
  },

  async deleteDeliveryDate(date) {
    const sb = getSupabase();
    const { error } = await sb.from('delivery_dates').delete().eq('date', date);
    if (error) throw new Error('Gagal menghapus tanggal.');
    return true;
  },

  // Cek kapasitas terpakai untuk tanggal tertentu
  async getUsedCapacity(date) {
    const sb = getSupabase();
    const { data, error } = await sb.rpc('get_used_capacity', { p_date: date });
    if (error) return 0;
    return data || 0;
  },

  /* ============ ORDERS ============ */
  async createOrderAtomic({ customerId, deliveryDate, paymentMethod, items, notes }) {
    const sb = getSupabase();
    // Generate idempotency key dari hash data
    const idem = 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    const { data, error } = await sb.rpc('create_order_atomic', {
      p_customer_id: customerId,
      p_delivery_date: deliveryDate,
      p_payment_method: paymentMethod,
      p_items: items,
      p_notes: notes || null,
      p_idempotency_key: idem
    });

    if (error) throw new Error(translateOrderError(error.message));
    return data; // order id
  },

  // Orders milik customer yang login
  async getMyOrders() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Belum login.');

    const { data, error } = await sb
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Gagal memuat pesanan.');
    return data || [];
  },

  async getOrder(orderId) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .eq('id', orderId)
      .single();
    if (error) throw new Error('Pesanan tidak ditemukan.');
    return data;
  },

  // Admin: semua order
  async getAllOrders(filters) {
    const sb = getSupabase();
    filters = filters || {};
    let q = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (filters.deliveryDate) q = q.eq('delivery_date', filters.deliveryDate);
    if (filters.status) q = q.eq('order_status', filters.status);
    if (filters.paymentStatus) q = q.eq('payment_status', filters.paymentStatus);
    if (filters.customerId) q = q.eq('customer_id', filters.customerId);
    if (filters.limit) q = q.limit(filters.limit);
    const { data, error } = await q;
    if (error) throw new Error('Gagal memuat pesanan.');
    return data || [];
  },

  async updateOrderStatus(orderId, newStatus, cancelReason) {
    const sb = getSupabase();
    const patch = { order_status: newStatus };
    if (cancelReason) patch.cancel_reason = cancelReason;
    const { data, error } = await sb
      .from('orders')
      .update(patch)
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw new Error('Gagal memperbarui status.');
    return data;
  },

  /* ============ PAYMENTS ============ */
  async createPayment({ orderId, amount, method, proofUrl }) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('payments')
      .insert({
        order_id: orderId,
        amount: amount,
        method: method,
        proof_url: proofUrl || null,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw new Error('Gagal membuat pembayaran.');
    return data;
  },

  async verifyPayment(paymentId, approved, reason) {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    const patch = {
      status: approved ? 'verified' : 'rejected',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      rejection_reason: approved ? null : (reason || 'Ditolak admin')
    };
    const { data: payment, error } = await sb
      .from('payments')
      .update(patch)
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw new Error('Gagal verifikasi pembayaran.');

    // Update order status juga
    if (approved) {
      await sb
        .from('orders')
        .update({ payment_status: 'terverifikasi', order_status: 'pembayaran_terverifikasi' })
        .eq('id', payment.order_id);
    } else {
      await sb
        .from('orders')
        .update({ payment_status: 'ditolak' })
        .eq('id', payment.order_id);
    }

    // Buat notifikasi untuk customer
    const { data: order } = await sb
      .from('orders')
      .select('customer_id')
      .eq('id', payment.order_id)
      .single();

    if (order) {
      await sb.from('notifications').insert({
        customer_id: order.customer_id,
        title: approved ? 'Pembayaran diverifikasi ✅' : 'Pembayaran ditolak ❌',
        message: approved
          ? 'Pembayaran kamu sudah diverifikasi. Pesanan akan segera diproses.'
          : 'Pembayaran perlu diperiksa kembali. ' + (reason || ''),
        order_id: payment.order_id
      });
    }

    return payment;
  },

  async getPaymentsPendingVerification() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('payments')
      .select('*, orders(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Gagal memuat pembayaran.');
    return data || [];
  },

  /* ============ STORAGE UPLOAD ============ */
  async uploadPaymentProof(file) {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Belum login.');

    // Validasi file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.indexOf(file.type) < 0) {
      throw new Error('Format file harus JPG, JPEG, PNG, atau WEBP.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Ukuran file maksimal 5 MB.');
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = user.id + '/' + Date.now() + '.' + ext;

    const { error: uploadError } = await sb.storage
      .from('payment-proofs')
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error('Gagal upload bukti pembayaran: ' + uploadError.message);

    // Buat signed URL (karena bucket private)
    const { data: signedData, error: signError } = await sb.storage
      .from('payment-proofs')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 hari

    if (signError) throw new Error('Gagal membuat URL bukti.');

    return { path: fileName, url: signedData.signedUrl };
  },

  async uploadQRIS(file) {
    const sb = getSupabase();
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.indexOf(file.type) < 0) throw new Error('Format QRIS harus gambar.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Maksimal 5 MB.');

    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = 'qris-' + Date.now() + '.' + ext;

    const { error: uploadError } = await sb.storage
      .from('qris')
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error('Gagal upload QRIS.');

    const { data: publicData } = sb.storage.from('qris').getPublicUrl(fileName);
    return publicData.publicUrl;
  },

  /* ============ PROFILES (Admin) ============ */
  async getAllCustomers() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Gagal memuat customers.');
    return data || [];
  },

  async updateProfile(id, patch) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Gagal memperbarui profil.');
    return data;
  },

  /* ============ NOTIFICATIONS ============ */
  async getMyNotifications() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return [];
    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return data || [];
  },

  async markNotificationRead(id) {
    const sb = getSupabase();
    await sb.from('notifications').update({ read: true }).eq('id', id);
  },

  /* ============ ADMIN LOGS ============ */
  async logAdminAction({ action, targetType, targetId, detail }) {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: profile } = await sb.from('profiles').select('full_name').eq('id', user.id).single();
    await sb.from('admin_logs').insert({
      admin_id: user.id,
      admin_name: profile ? profile.full_name : 'Admin',
      action: action,
      target_type: targetType || null,
      target_id: targetId || null,
      detail: detail || null
    });
  },

  async getAdminLogs(limit) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 100);
    if (error) throw new Error('Gagal memuat log.');
    return data || [];
  }
};

/* ============================================================
   TRANSLATE ERROR ORDER
   ============================================================ */
function translateOrderError(msg) {
  if (!msg) return 'Terjadi kesalahan.';
  const m = msg.toLowerCase();
  if (m.includes('stok tidak mencukupi')) return msg; // sudah Indonesia
  if (m.includes('tanggal pengantaran belum dibuka'))
    return 'Tanggal pengantaran belum dibuka.';
  if (m.includes('topping tidak tersedia'))
    return 'Ada topping yang tidak tersedia. Silakan refresh halaman.';
  if (m.includes('tidak mendukung crumble'))
    return msg;
  if (m.includes('customer tidak ditemukan'))
    return 'Sesi kamu habis. Silakan login ulang.';
  return 'Gagal membuat pesanan: ' + msg;
}