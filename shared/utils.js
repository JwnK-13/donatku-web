/* ============================================================
   DONATKU SHARED — Utils
   ============================================================ */

const U = {
  // ============ ID ============
  uid(prefix) {
    prefix = prefix || 'id';
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  },

  // ============ FORMAT RUPIAH ============
  rupiah(n) {
    n = Math.round(Number(n) || 0);
    return 'Rp' + n.toLocaleString('id-ID');
  },

  parseNum(v) {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    return parseInt(String(v).replace(/[^\d-]/g, ''), 10) || 0;
  },

  // ============ TANGGAL (WITA = UTC+8) ============
  todayISO() {
    return U.dateToISO(new Date());
  },

  // Konversi Date → 'YYYY-MM-DD' dalam timezone WITA
  dateToISO(d) {
    // Tambah offset WITA (+8 jam)
    const wita = new Date(d.getTime() + (8 * 60 * 60 * 1000));
    const y = wita.getUTCFullYear();
    const m = String(wita.getUTCMonth() + 1).padStart(2, '0');
    const day = String(wita.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  isoToDate(iso) {
    if (!iso) return new Date();
    const parts = iso.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  },

  dayOfWeek(iso) {
    // Konversi ISO → Date dengan timezone WITA
    const d = U.isoToDate(iso);
    return d.getUTCDay();
  },

  dayName(iso) {
    const n = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    return n[U.dayOfWeek(iso)];
  },

  dayNameShort(iso) {
    const n = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    return n[U.dayOfWeek(iso)];
  },

  monthName(m) {
    return ['Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'][m];
  },

  formatLongDate(iso) {
    if (!iso) return '-';
    const d = U.isoToDate(iso);
    return U.dayName(iso) + ', ' + d.getUTCDate() + ' ' + U.monthName(d.getUTCMonth()) + ' ' + d.getUTCFullYear();
  },

  formatMediumDate(iso) {
    if (!iso) return '-';
    const d = U.isoToDate(iso);
    return U.dayNameShort(iso) + ', ' + d.getUTCDate() + ' ' + U.monthName(d.getUTCMonth()).slice(0,3) + ' ' + d.getUTCFullYear();
  },

  formatShortDate(iso) {
    if (!iso) return '-';
    const d = U.isoToDate(iso);
    return d.getUTCDate() + ' ' + U.monthName(d.getUTCMonth()).slice(0,3) + ' ' + d.getUTCFullYear();
  },

  // Format timestamp ke "DD MMM YYYY, HH:MM" WITA
  formatDateTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const wita = new Date(d.getTime() + (8 * 60 * 60 * 1000));
    const day = wita.getUTCDate();
    const month = U.monthName(wita.getUTCMonth()).slice(0,3);
    const year = wita.getUTCFullYear();
    const hh = String(wita.getUTCHours()).padStart(2, '0');
    const mm = String(wita.getUTCMinutes()).padStart(2, '0');
    return day + ' ' + month + ' ' + year + ', ' + hh + ':' + mm;
  },

  // Tambah hari ke ISO date
  addDays(iso, n) {
    const d = U.isoToDate(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.getUTCFullYear() + '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  },

  weekRange(iso) {
    const d = U.isoToDate(iso);
    const day = d.getUTCDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d); mon.setUTCDate(d.getUTCDate() + diffToMon);
    const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    return {
      start: mon.getUTCFullYear() + '-' + String(mon.getUTCMonth()+1).padStart(2,'0') + '-' + String(mon.getUTCDate()).padStart(2,'0'),
      end: sun.getUTCFullYear() + '-' + String(sun.getUTCMonth()+1).padStart(2,'0') + '-' + String(sun.getUTCDate()).padStart(2,'0')
    };
  },

  monthRange(year, month) {
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    return {
      start: start.getUTCFullYear() + '-' + String(start.getUTCMonth()+1).padStart(2,'0') + '-01',
      end: end.getUTCFullYear() + '-' + String(end.getUTCMonth()+1).padStart(2,'0') + '-' + String(end.getUTCDate()).padStart(2,'0')
    };
  },

  // ============ ESCAPE HTML ============
  escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  },

  // ============ DOWNLOAD FILE ============
  download(filename, content, mime) {
    mime = mime || 'application/octet-stream';
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 500);
  },

  // ============ CSV ============
  toCSV(rows, headers) {
    const esc = function(v) {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const head = headers ? headers.map(esc).join(',') : '';
    const body = rows.map(function(r) { return r.map(esc).join(','); }).join('\n');
    return '\uFEFF' + (head ? head + '\n' : '') + body;
  },

  // ============ SALAM WHATSAPP ============
  getGreeting() {
    // Ambil jam WITA sekarang
    const now = new Date();
    const wita = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const hour = wita.getUTCHours();
    if (hour >= 5 && hour < 11) return 'Pagi';
    if (hour >= 11 && hour < 15) return 'Siang';
    if (hour >= 15 && hour < 18) return 'Sore';
    return 'Malam';
  },

  // ============ DEBOUNCE ============
  debounce(fn, ms) {
    ms = ms || 300;
    let t;
    return function() {
      const args = arguments;
      const self = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(self, args); }, ms);
    };
  },

  // ============ STORAGE HELPERS (cart, dll) ============
  storage: {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
      } catch (e) { return fallback !== undefined ? fallback : null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  },

  // ============ KELAS ============
  classList() {
    const classes = [];
    for (let i = 1; i <= 17; i++) classes.push("X'" + i);
    for (let i = 1; i <= 17; i++) classes.push("XI'" + i);
    for (let i = 1; i <= 19; i++) classes.push("XII'" + i);
    return classes;
  },

  // Build kelas selector dengan optgroup
  buildClassOptions(selected) {
    selected = selected || '';
    let html = '<option value="">— Pilih Kelas —</option>';
    html += '<optgroup label="Kelas X">';
    for (let i = 1; i <= 17; i++) {
      const c = "X'" + i;
      html += '<option value="' + c + '" ' + (selected === c ? 'selected' : '') + '>' + c + '</option>';
    }
    html += '</optgroup>';
    html += '<optgroup label="Kelas XI">';
    for (let i = 1; i <= 17; i++) {
      const c = "XI'" + i;
      html += '<option value="' + c + '" ' + (selected === c ? 'selected' : '') + '>' + c + '</option>';
    }
    html += '</optgroup>';
    html += '<optgroup label="Kelas XII">';
    for (let i = 1; i <= 19; i++) {
      const c = "XII'" + i;
      html += '<option value="' + c + '" ' + (selected === c ? 'selected' : '') + '>' + c + '</option>';
    }
    html += '</optgroup>';
    return html;
  }
};

// ============ UI HELPER ============
const UI = {
  toast(msg, type, duration) {
    type = type || 'success';
    duration = duration || 2600;

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    container.appendChild(el);

    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(function() { el.remove(); }, 260);
    }, duration);
  },

  modal(opts) {
    // opts: { title, bodyHTML, footer: [{label, class, action, keepOpen}] }
    let backdrop = document.getElementById('modalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'modalBackdrop';
      backdrop.className = 'modal-backdrop hidden';
      backdrop.innerHTML =
        '<div class="modal">' +
          '<div class="modal-header"><h3 id="modalTitle"></h3><button class="icon-btn" id="modalClose">✕</button></div>' +
          '<div class="modal-body" id="modalBody"></div>' +
          '<div class="modal-footer" id="modalFooter"></div>' +
        '</div>';
      document.body.appendChild(backdrop);
    }

    document.getElementById('modalTitle').textContent = opts.title || 'Konfirmasi';
    document.getElementById('modalBody').innerHTML = opts.bodyHTML || '';

    const footerEl = document.getElementById('modalFooter');
    footerEl.innerHTML = '';

    const close = function() {
      backdrop.classList.add('hidden');
      if (opts.onClose) opts.onClose();
    };

    (opts.footer || []).forEach(function(btn) {
      const b = document.createElement('button');
      b.className = 'btn ' + (btn.class || '');
      b.textContent = btn.label;
      b.onclick = function() {
        if (btn.action) btn.action();
        if (!btn.keepOpen) close();
      };
      footerEl.appendChild(b);
    });

    document.getElementById('modalClose').onclick = close;
    backdrop.onclick = function(e) { if (e.target === backdrop) close(); };
    backdrop.classList.remove('hidden');

    return { close: close };
  },

  confirm(opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      let done = false;
      UI.modal({
        title: opts.title || 'Konfirmasi',
        bodyHTML: '<p style="margin:0; font-size:15px;">' + U.escapeHTML(opts.message || 'Lanjutkan?') + '</p>',
        footer: [
          { label: opts.cancelLabel || 'Batal', class: 'btn-outline',
            action: function() { if (!done) { done = true; resolve(false); } } },
          { label: opts.confirmLabel || 'Ya', class: opts.danger ? 'btn-danger' : 'btn-primary',
            action: function() { if (!done) { done = true; resolve(true); } } }
        ],
        onClose: function() { if (!done) { done = true; resolve(false); } }
      });
    });
  },

  loading(show, text) {
    let el = document.getElementById('globalLoading');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'globalLoading';
        el.className = 'global-loading';
        el.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">' + (text || 'Memuat…') + '</div>';
        document.body.appendChild(el);
      } else {
        const t = el.querySelector('.loading-text');
        if (t) t.textContent = text || 'Memuat…';
      }
      el.classList.remove('hidden');
    } else {
      if (el) el.classList.add('hidden');
    }
  }
};

// ============ CURRENCY INPUT HELPER ============
function attachCurrencyInput(el) {
  if (!el) return;
  const format = function() {
    const n = U.parseNum(el.value);
    el.value = n ? n.toLocaleString('id-ID') : '';
  };
  el.addEventListener('input', format);
  el.addEventListener('blur', format);
  el.getRupiah = function() { return U.parseNum(el.value); };
}