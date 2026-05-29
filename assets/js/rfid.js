// ====================== RFID dashboard: destinations from clients + rfid_data ==========================

(function () {
  'use strict';

  const RFID_VIEW_ID = 'rfid-view';

  const NUM_FIELDS = [
    'going_to_autosweep_class2',
    'going_to_autosweep_class3',
    'going_back_autosweep_class2',
    'going_back_autosweep_class3',
    'going_to_easytrip_class2',
    'going_to_easytrip_class3',
    'going_back_easytrip_class2',
    'going_back_easytrip_class3',
  ];

  /** @type {Map<string, object>} */
  let rowStateByClientId = new Map();
  let editModalBound = false;

  function getSupabase() {
    return typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;
  }

  async function runWithAuth(operation) {
    if (typeof supabaseWithAuth === 'function') {
      return supabaseWithAuth(operation);
    }
    if (window.mainModule && typeof window.mainModule.supabaseWithAuth === 'function') {
      return window.mainModule.supabaseWithAuth(operation);
    }
    return operation();
  }

  function nz(v) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function computeDerived(values) {
    const g2a2 = nz(values.going_to_autosweep_class2);
    const g2a3 = nz(values.going_to_autosweep_class3);
    const gba2 = nz(values.going_back_autosweep_class2);
    const gba3 = nz(values.going_back_autosweep_class3);
    const g2e2 = nz(values.going_to_easytrip_class2);
    const g2e3 = nz(values.going_to_easytrip_class3);
    const gbe2 = nz(values.going_back_easytrip_class2);
    const gbe3 = nz(values.going_back_easytrip_class3);

    const autosweep2 = g2a2 + gba2;
    const autosweep3 = g2a3 + gba3;
    const easytrip2 = g2e2 + gbe2;
    const easytrip3 = g2e3 + gbe3;
    const total2 = autosweep2 + easytrip2;
    const total3 = autosweep3 + easytrip3;

    return {
      autosweep2,
      autosweep3,
      easytrip2,
      easytrip3,
      total2,
      total3,
    };
  }

  function defaultCounts() {
    const o = {};
    NUM_FIELDS.forEach((k) => {
      o[k] = 0;
    });
    return o;
  }

  function mergeRow(client, rfidRow) {
    const base = defaultCounts();
    if (rfidRow) {
      NUM_FIELDS.forEach((k) => {
        base[k] = nz(rfidRow[k]);
      });
    }
    const derived = computeDerived(base);
    return {
      client_id: client.id,
      rfid_id: rfidRow ? rfidRow.id : null,
      destination: (client.destination || '').trim(),
      plant: client.plant || null,
      counts: base,
      derived,
    };
  }

  /** Load clients; Destination column comes only from clients.destination */
  async function fetchClientsDestinations() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await runWithAuth(async () => {
      return supabase.from('clients').select('id, plant, destination').order('destination', { ascending: true });
    });

    if (error) {
      console.error('RFID: failed to load clients', error);
      if (typeof showError === 'function') {
        showError('Failed to load client destinations: ' + error.message, 'Error');
      }
      return [];
    }

    return (data || []).filter((c) => (c.destination || '').trim().length > 0);
  }

  async function fetchRfidRows() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await runWithAuth(async () => {
      return supabase.from('rfid_data').select('*');
    });

    if (error) {
      console.warn('RFID: rfid_data not available or empty (create table if you need saved counts):', error.message);
      return [];
    }

    return data || [];
  }

  function getActivePlantInRfidView() {
    const root = document.getElementById(RFID_VIEW_ID);
    if (!root) return null;
    const active = root.querySelector('.plant-card.active');
    return active && active.dataset.plant ? active.dataset.plant : null;
  }

  function getRfidTableBody() {
    const root = document.getElementById(RFID_VIEW_ID);
    if (!root) return null;
    return root.querySelector('#rfid-table-body');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatNumber(value) {
    const num = parseInt(value, 10);
    return num === 0 ? '-' : String(num);
  }

  function renderTable(rows) {
    const tableBody = getRfidTableBody();
    if (!tableBody) return;

    tableBody.innerHTML = '';
    rowStateByClientId = new Map();

    if (!rows.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 16;
      cell.className = 'rfid-table-empty';
      cell.textContent =
        'No client destinations found. Add destinations in the Clients module (clients.destination).';
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    rows.forEach((r) => {
      rowStateByClientId.set(String(r.client_id), r);
      const { derived, counts, destination, client_id, rfid_id } = r;
      const tr = document.createElement('tr');

      const cells = [
        { html: escapeHtml(destination) },
        { text: formatNumber(derived.total2) },
        { text: formatNumber(derived.total3) },
        { text: formatNumber(derived.autosweep2) },
        { text: formatNumber(derived.autosweep3) },
        { text: formatNumber(derived.easytrip2) },
        { text: formatNumber(derived.easytrip3) },
        { text: formatNumber(counts.going_to_autosweep_class2) },
        { text: formatNumber(counts.going_to_autosweep_class3) },
        { text: formatNumber(counts.going_back_autosweep_class2) },
        { text: formatNumber(counts.going_back_autosweep_class3) },
        { text: formatNumber(counts.going_to_easytrip_class2) },
        { text: formatNumber(counts.going_to_easytrip_class3) },
        { text: formatNumber(counts.going_back_easytrip_class2) },
        { text: formatNumber(counts.going_back_easytrip_class3) },
      ];

      cells.forEach((c) => {
        const td = document.createElement('td');
        if (c.html != null) td.innerHTML = c.html;
        else td.textContent = c.text;
        tr.appendChild(td);
      });

      // Only show Edit button for admin users
      if (window.authSystem && window.authSystem.isAdmin()) {
        const actionTd = document.createElement('td');
        actionTd.className = 'auth-required'; 
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('data-rfid-edit-client', String(client_id));
        editBtn.setAttribute('data-rfid-record', rfid_id ? String(rfid_id) : '');
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);
      }

      tableBody.appendChild(tr);
    });

    if (typeof reinitializeExpandableText === 'function') {
      reinitializeExpandableText();
    }
  }

  async function loadRfidDashboard() {
    const tableBody = getRfidTableBody();
    if (!tableBody) return;

    const plant = getActivePlantInRfidView();
    const [clients, rfidRows] = await Promise.all([fetchClientsDestinations(), fetchRfidRows()]);
    const rfidByClient = new Map();
    rfidRows.forEach((row) => {
      const cid = row.client_id != null ? String(row.client_id) : '';
      if (cid && !rfidByClient.has(cid)) {
        rfidByClient.set(cid, row);
      }
    });

    const filteredClients = plant ? clients.filter((c) => (c.plant || '') === plant) : clients;
    const merged = filteredClients.map((c) => mergeRow(c, rfidByClient.get(String(c.id))));
    renderTable(merged);
  }

  /** When Edit is clicked before the table has finished loading, build row from Supabase. */
  async function loadRowForEdit(clientId) {
    const key = String(clientId).trim();
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: client, error: clientErr } = await runWithAuth(async () => {
      return supabase.from('clients').select('id, plant, destination').eq('id', key).maybeSingle();
    });
    if (clientErr || !client) {
      console.warn('RFID edit: client not found', key, clientErr);
      return null;
    }
    if (!(client.destination || '').trim()) return null;

    let rfidRow = null;
    const { data: rfid, error: rfidErr } = await runWithAuth(async () => {
      return supabase.from('rfid_data').select('*').eq('client_id', key).maybeSingle();
    });
    if (!rfidErr && rfid) rfidRow = rfid;

    const merged = mergeRow(client, rfidRow);
    rowStateByClientId.set(key, merged);
    return merged;
  }

  function initializeRfid() {
    bindRfidViewEventsOnce();
    bindEditModalOnce();
    loadRfidDashboard();
  }

  function bindRfidViewEventsOnce() {
    const root = document.getElementById(RFID_VIEW_ID);
    if (!root || root.dataset.rfidBound === '1') return;
    root.dataset.rfidBound = '1';
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rfid-edit-client]');
      if (!btn) return;
      const clientId = btn.getAttribute('data-rfid-edit-client');
      if (clientId) void openEditModal(clientId);
    });
  }

  function bindEditModalOnce() {
    if (editModalBound) return;
    const form = document.getElementById('rfid-edit-form');
    const closeBtn = document.getElementById('rfid-edit-modal-close-btn');
    const cancelBtn = document.getElementById('rfid-edit-cancel-btn');
    const overlay = document.getElementById('rfid-edit-modal-overlay');
    if (!form || !closeBtn || !cancelBtn || !overlay) return;
    editModalBound = true;

    closeBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) closeEditModal();
    });

    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach((inp) => inp.addEventListener('input', updateEditModalComputed));

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      await saveEditModal();
    });
  }

  async function openEditModal(clientId) {
    const key = String(clientId == null ? '' : clientId).trim();
    if (!key || key === 'undefined' || key === 'null') {
      return;
    }

    let row = rowStateByClientId.get(key);
    if (!row) {
      row = await loadRowForEdit(key);
    }
    if (!row) {
      if (typeof showWarning === 'function') {
        showWarning(
          'Could not open this row yet. Wait for the table to finish loading, or check that the client still has a destination.',
          'RFID'
        );
      }
      return;
    }

    const modal = document.getElementById('rfid-edit-modal');
    const overlay = document.getElementById('rfid-edit-modal-overlay');
    if (!modal || !overlay) return;

    document.getElementById('rfid-edit-record-id').value = row.rfid_id || '';
    document.getElementById('rfid-edit-client-id').value = String(row.client_id);
    document.getElementById('rfid-edit-destination-display').value = row.destination || '-';

    const c = row.counts;
    document.getElementById('rfid-edit-going-to-autosweep-c2').value = String(c.going_to_autosweep_class2);
    document.getElementById('rfid-edit-going-to-autosweep-c3').value = String(c.going_to_autosweep_class3);
    document.getElementById('rfid-edit-going-back-autosweep-c2').value = String(c.going_back_autosweep_class2);
    document.getElementById('rfid-edit-going-back-autosweep-c3').value = String(c.going_back_autosweep_class3);
    document.getElementById('rfid-edit-going-to-easytrip-c2').value = String(c.going_to_easytrip_class2);
    document.getElementById('rfid-edit-going-to-easytrip-c3').value = String(c.going_to_easytrip_class3);
    document.getElementById('rfid-edit-going-back-easytrip-c2').value = String(c.going_back_easytrip_class2);
    document.getElementById('rfid-edit-going-back-easytrip-c3').value = String(c.going_back_easytrip_class3);

    updateEditModalComputed();
    modal.classList.remove('rfid-edit-modal--hidden');
    overlay.classList.remove('rfid-edit-modal--hidden');
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    const modal = document.getElementById('rfid-edit-modal');
    const overlay = document.getElementById('rfid-edit-modal-overlay');
    if (modal) {
      modal.style.display = '';
      modal.classList.add('rfid-edit-modal--hidden');
    }
    if (overlay) {
      overlay.style.display = '';
      overlay.classList.add('rfid-edit-modal--hidden');
    }
    document.body.style.overflow = 'auto';
  }

  function readEditFormCounts() {
    return {
      going_to_autosweep_class2: nz(document.getElementById('rfid-edit-going-to-autosweep-c2').value),
      going_to_autosweep_class3: nz(document.getElementById('rfid-edit-going-to-autosweep-c3').value),
      going_back_autosweep_class2: nz(document.getElementById('rfid-edit-going-back-autosweep-c2').value),
      going_back_autosweep_class3: nz(document.getElementById('rfid-edit-going-back-autosweep-c3').value),
      going_to_easytrip_class2: nz(document.getElementById('rfid-edit-going-to-easytrip-c2').value),
      going_to_easytrip_class3: nz(document.getElementById('rfid-edit-going-to-easytrip-c3').value),
      going_back_easytrip_class2: nz(document.getElementById('rfid-edit-going-back-easytrip-c2').value),
      going_back_easytrip_class3: nz(document.getElementById('rfid-edit-going-back-easytrip-c3').value),
    };
  }

  function updateEditModalComputed() {
    const el = document.getElementById('rfid-edit-computed-summary');
    if (!el) return;
    const d = computeDerived(readEditFormCounts());
    el.innerHTML = `
      <strong>Autosweep</strong> — Class 2: ${d.autosweep2}, Class 3: ${d.autosweep3}<br/>
      <strong>Easytrip</strong> — Class 2: ${d.easytrip2}, Class 3: ${d.easytrip3}<br/>
      <strong>Total</strong> — Class 2: ${d.total2}, Class 3: ${d.total3}
    `;
  }

  async function saveEditModal() {
    const supabase = getSupabase();
    if (!supabase) {
      if (typeof showError === 'function') showError('Supabase is not available.', 'Error');
      return;
    }

    try {
      const recordId = document.getElementById('rfid-edit-record-id').value.trim();
      const clientId = document.getElementById('rfid-edit-client-id').value.trim();
      const counts = readEditFormCounts();

      const { data: clientRow, error: clientErr } = await runWithAuth(async () => {
        return supabase.from('clients').select('destination').eq('id', clientId).maybeSingle();
      });
      if (clientErr) throw clientErr;
      const destination = ((clientRow && clientRow.destination) || '').trim();
      if (!destination) {
        if (typeof showWarning === 'function') {
          showWarning('This client has no destination set. Update the Clients module first.', 'RFID');
        }
        return;
      }

      const payload = {
        client_id: clientId,
        destination,
        ...counts,
      };

      if (recordId) {
        const { error } = await runWithAuth(async () => {
          return supabase.from('rfid_data').update(payload).eq('id', recordId);
        });
        if (error) throw error;
      } else {
        const { error } = await runWithAuth(async () => {
          return supabase.from('rfid_data').insert([payload]);
        });
        if (error) {
          if (error.code === '23505') {
            if (typeof showWarning === 'function') {
              showWarning('A record already exists for this client. Reloading…', 'RFID');
            }
            await loadRfidDashboard();
            closeEditModal();
            return;
          }
          throw error;
        }
      }

      if (typeof showSuccess === 'function') {
        showSuccess('RFID data saved.');
      }
      closeEditModal();
      await loadRfidDashboard();
    } catch (err) {
      console.error('RFID save failed', err);
      if (typeof showError === 'function') {
        showError('Failed to save RFID data: ' + (err.message || String(err)), 'Error');
      }
    }
  }

  window.rfidModule = {
    initializeRfid,
    loadRfidDashboard,
    openEditModal,
    closeEditModal,
  };

  function bootRfidEditModalUi() {
    bindEditModalOnce();
    closeEditModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootRfidEditModalUi);
  } else {
    bootRfidEditModalUi();
  }

  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) {
      closeEditModal();
    }
  });
})();
