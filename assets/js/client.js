// ====================== Client View Functions ==========================

// Initialize client when view is shown
function initializeClient() {
  console.log('Client view initialized');
  
  // Setup client event listeners
  setupClientEventListeners();
  
  // Load client data
  loadClientData();
}

// Setup client event listeners
function setupClientEventListeners() {
  // Add client button
  const addClientBtn = document.getElementById('add-client-btn');
  if (addClientBtn) {
    addClientBtn.addEventListener('click', () => {
      openClientModal();
    });
  }
  
  console.log('Client event listeners setup');
}

// Load client data
async function loadClientData() {
  if (!window.getSupabaseClient) return;
  
  try {
    await loadClients();
    console.log('Client data loaded');
  } catch (error) {
    console.error('Error loading client data:', error);
    if (window.showError) {
      showError('Failed to load client data: ' + error.message, 'Error');
    }
  }
}

// Load clients
async function loadClients() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    console.error('Supabase client not available');
    return;
  }
  
  try {
    console.log('Loading clients from database...');
    
    // Try with auth wrapper first
    try {
      const result = await window.mainModule.supabaseWithAuth(async () => {
        const { data: clients, error } = await supabaseClient
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return clients;
      });
      
      console.log('Clients loaded successfully (with auth):', result);
      displayClients(result || []);
      
    } catch (authError) {
      console.warn('Auth wrapper failed, trying direct load:', authError);
      
      // Fallback to direct query without auth wrapper
      const { data: clients, error } = await supabaseClient
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Clients loaded successfully (direct):', clients);
      displayClients(clients || []);
    }
    
  } catch (error) {
    console.error('Error loading clients:', error);
    
    // Show error message to user
    if (window.showError) {
      showError('Failed to load clients: ' + error.message, 'Error');
    }
    
    // Display empty state
    displayClients([]);
  }
}

// Display clients
function displayClients(clients) {
  const tableBody = document.querySelector('#client-table tbody');
  if (!tableBody) {
    console.warn('Client table body not found');
    return;
  }
  
  if (clients.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No clients found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  console.log('Displaying clients:', clients);
  
  const rows = clients.map(client => `
    <tr>
      <td>${client.plant || '-'}</td>
      <td>${client.destination || '-'}</td>
      <td>${client.address || '-'}</td>
      <td>${client.going_to || '-'}</td>
      <td>${client.going_back || '-'}</td>
      <td>
        <button class="btn-edit" onclick="window.clientModule.editClient('${client.id}')">Edit</button>
        <button class="btn-delete" onclick="window.clientModule.deleteClient('${client.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// Open client modal
function openClientModal(clientId = null) {
  // Check if user is admin
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  const modal = document.getElementById('client-modal');
  if (!modal) {
    console.error('Client modal not found');
    return;
  }
  
  // Reset form only if adding new client (no clientId)
  if (!clientId) {
    const form = document.getElementById('client-form');
    if (form) {
      form.reset();
    }
    
    // Set plant field to currently selected plant
    const plantSelect = document.getElementById('client-plant');
    if (plantSelect) {
      // Try to get selected plant from plantStateManager or selectedPlantFilter
      let selectedPlant = null;
      if (window.plantStateManager) {
        selectedPlant = window.plantStateManager.getSelectedPlant();
      }
      // Fallback to selectedPlantFilter if plantStateManager not available
      if (!selectedPlant && typeof selectedPlantFilter !== 'undefined') {
        selectedPlant = selectedPlantFilter;
      }
      if (selectedPlant) {
        plantSelect.value = selectedPlant;
      }
    }
    
    // Reset modal title to "Add Client"
    const modalTitle = document.querySelector('#client-modal .modal-header h2');
    if (modalTitle) modalTitle.textContent = 'Add Client';
  }
  
  // Show modal
  modal.style.display = 'flex';
}

// Close client modal
function closeClientModal() {
  const modal = document.getElementById('client-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Edit client
async function editClient(clientId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  console.log(`Editing client: ${clientId}`);
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { data: client, error } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    
    if (!client) {
      if (window.showError) {
        showError('Client not found', 'Error');
      }
      return;
    }
    
    // Open modal and populate form
    openClientModal(clientId);
    
    // Populate form fields
    const plantSelect = document.getElementById('client-plant');
    const destinationInput = document.getElementById('client-destination');
    const addressInput = document.getElementById('client-address');
    const goingToInput = document.getElementById('client-going-to');
    const goingBackInput = document.getElementById('client-going-back');
    const totalKmInput = document.getElementById('client-total-km');
    const averageTimeInput = document.getElementById('client-average-time');
    
    if (plantSelect) plantSelect.value = client.plant || '';
    if (destinationInput) destinationInput.value = client.destination || '';
    if (addressInput) addressInput.value = client.address || '';
    if (goingToInput) goingToInput.value = client.going_to || '';
    if (goingBackInput) goingBackInput.value = client.going_back || '';
    if (totalKmInput) totalKmInput.value = client.total_km || '';
    if (averageTimeInput) averageTimeInput.value = client.average_time || '';
    
    // Update modal title
    const modalTitle = document.getElementById('client-modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Client';
    
  } catch (error) {
    console.error('Error loading client for edit:', error);
    if (window.showError) {
      showError('Failed to load client data: ' + error.message, 'Error');
    }
  }
}

// Delete client
async function deleteClient(clientId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  if (!confirm('Are you sure you want to delete this client?')) {
    return;
  }
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient
      .from('clients')
      .delete()
      .eq('id', clientId);
    
    if (error) throw error;
    
    await loadClients();

    const rfidView = document.getElementById('rfid-view');
    if (rfidView && rfidView.classList.contains('active') && window.rfidModule && typeof window.rfidModule.loadRfidDashboard === 'function') {
      window.rfidModule.loadRfidDashboard();
    }
    
    if (window.showSuccess) {
      showSuccess('Client deleted successfully!');
    }
    
  } catch (error) {
    console.error('Error deleting client:', error);
    if (window.showError) {
      showError('Failed to delete client: ' + error.message, 'Error');
    }
  }
}

// Export functions for use in main.js
window.clientModule = {
  initializeClient,
  loadClientData,
  loadClients,
  openClientModal,
  closeClientModal,
  editClient,
  deleteClient
};
