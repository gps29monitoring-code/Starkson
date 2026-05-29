// ====================== Repair View Functions ==========================

// Initialize repair when view is shown
function initializeRepair() {
  console.log('Repair view initialized');
  
  // Setup repair event listeners
  setupRepairEventListeners();
  
  // Load plant counts with truck as default tab type
  if (window.loadPlantCounts) {
    window.loadPlantCounts('repair', 'truck');
  }
  
  // Load repair data
  loadRepairData();
}

// Setup repair event listeners
function setupRepairEventListeners() {
  // Add repair button
  const addRepairBtn = document.getElementById('add-repair-btn');
  if (addRepairBtn) {
    addRepairBtn.addEventListener('click', () => {
      openRepairModal();
    });
  }
  
  // Setup repair filter buttons
  setupRepairFilterButtons();
  
  console.log('Repair event listeners setup');
}

// Setup repair filter buttons
function setupRepairFilterButtons() {
  const repairTruckBtn = document.getElementById('repair-truck-btn');
  const repairTrailerBtn = document.getElementById('repair-trailer-btn');
  const repairContainerBtn = document.getElementById('repair-container-btn');
  
  if (repairTruckBtn) {
    repairTruckBtn.addEventListener('click', () => {
      setActiveRepairFilter('truck');
    });
  }
  
  if (repairTrailerBtn) {
    repairTrailerBtn.addEventListener('click', () => {
      setActiveRepairFilter('trailer');
    });
  }
  
  if (repairContainerBtn) {
    repairContainerBtn.addEventListener('click', () => {
      setActiveRepairFilter('container');
    });
  }
}

// Set active repair filter
function setActiveRepairFilter(filterType) {
  // Remove active class from all repair filter buttons
  const repairButtons = document.querySelectorAll('.repair-filter-btn');
  repairButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  const activeBtn = document.getElementById(`repair-${filterType}-btn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Filter repair data based on type
  filterRepairData(filterType);
}

// Filter repair data
function filterRepairData(filterType) {
  const repairTable = document.getElementById('repair-table');
  if (!repairTable) return;
  
  const rows = repairTable.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const shouldShow = shouldShowRepairRow(row, filterType);
    row.style.display = shouldShow ? '' : 'none';
  });
}

// Determine if repair row should be shown based on filter
function shouldShowRepairRow(row, filterType) {
  if (filterType === 'truck') {
    // Show rows that contain truck-related data
    const plateCell = row.cells[0]; // Assuming plate number is first column
    if (plateCell) {
      const plateText = plateCell.textContent.toLowerCase();
      // Filter logic for trucks - you may need to adjust this based on your data structure
      return !plateText.includes('trailer') && !plateText.includes('container');
    }
  } else if (filterType === 'trailer') {
    // Show rows that contain trailer-related data
    const plateCell = row.cells[0];
    if (plateCell) {
      const plateText = plateCell.textContent.toLowerCase();
      return plateText.includes('trailer') || plateText.includes('trl');
    }
  } else if (filterType === 'container') {
    // Show rows that contain container-related data
    const plateCell = row.cells[0];
    if (plateCell) {
      const plateText = plateCell.textContent.toLowerCase();
      return plateText.includes('container') || plateText.includes('cntr');
    }
  }
  
  return true; // Show all if no specific filter logic
}

// Load repair data
async function loadRepairData() {
  if (!window.getSupabaseClient) return;
  
  try {
    await loadRepairs();
    await loadVehicleStatus(); // Load vehicle status data for repair table
    console.log('Repair data loaded');
  } catch (error) {
    console.error('Error loading repair data:', error);
    if (window.showError) {
      showError('Failed to load repair data: ' + error.message, 'Error');
    }
  }
}

// Load repairs
async function loadRepairs() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: repairs, error } = await supabaseClient
      .from('repair_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    displayRepairs(repairs || []);
    
  } catch (error) {
    console.error('Error loading repairs:', error);
    throw error;
  }
}

// Load vehicle status for repair table
async function loadVehicleStatus() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: vehicles, error } = await supabaseClient
      .from('vehicle_registry')
      .select('*')
      .order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayVehicleStatusForRepair(vehicles || []);
    
  } catch (error) {
    console.error('Error loading vehicle status:', error);
    throw error;
  }
}

// Display repairs
function displayRepairs(repairs) {
  const tableBody = document.querySelector('#repair-table tbody');
  if (!tableBody) return;
  
  if (repairs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No repair records found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = repairs.map(repair => `
    <tr>
      <td>${repair.plate_no || '-'}</td>
      <td>${repair.repair_type || '-'}</td>
      <td>${repair.description || '-'}</td>
      <td>${repair.status || 'Pending'}</td>
      <td>${formatDate(repair.created_at) || '-'}</td>
      <td>
        <button class="btn-edit" onclick="window.repairModule.editRepair('${repair.id}')">Edit</button>
        <button class="btn-delete" onclick="window.repairModule.deleteRepair('${repair.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// Display vehicle status for repair table
function displayVehicleStatusForRepair(vehicles) {
  const tableBody = document.querySelector('#vehicle-status-table tbody');
  if (!tableBody) return;
  
  if (vehicles.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No vehicle status data available</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = vehicles.map(vehicle => `
    <tr>
      <td>${vehicle.plate_no || '-'}</td>
      <td>${vehicle.make_model || '-'}</td>
      <td>${vehicle.status || 'Active'}</td>
      <td>${vehicle.location_plant || '-'}</td>
      <td>${vehicle.last_maintenance || '-'}</td>
      <td>
        <button class="btn-add" onclick="window.repairModule.addRepairForVehicle('${vehicle.id}', '${vehicle.plate_no}')">Add Repair</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// Open repair modal
function openRepairModal(repairId = null, plateNo = null) {
  // Check if user is admin
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  const modal = document.getElementById('repair-modal');
  if (!modal) {
    console.error('Repair modal not found');
    return;
  }
  
  // Reset form
  const form = document.getElementById('repair-form');
  if (form) {
    form.reset();
  }
  
  // Set plate number if provided
  if (plateNo) {
    const plateInput = document.getElementById('repair-plate');
    if (plateInput) {
      plateInput.value = plateNo;
      plateInput.readOnly = true;
    }
  }
  
  // Show modal
  modal.style.display = 'flex';
}

// Close repair modal
function closeRepairModal() {
  const modal = document.getElementById('repair-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Add repair for vehicle
function addRepairForVehicle(vehicleId, plateNo) {
  openRepairModal(null, plateNo);
}

// Edit repair
function editRepair(repairId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  console.log(`Editing repair: ${repairId}`);
  // Implementation for editing repair
}

// Delete repair
async function deleteRepair(repairId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  if (!confirm('Are you sure you want to delete this repair record?')) {
    return;
  }
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient
      .from('repair_records')
      .delete()
      .eq('id', repairId);
    
    if (error) throw error;
    
    await loadRepairs();
    
    if (window.showSuccess) {
      showSuccess('Repair record deleted successfully!');
    }
    
  } catch (error) {
    console.error('Error deleting repair:', error);
    if (window.showError) {
      showError('Failed to delete repair record: ' + error.message, 'Error');
    }
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Export functions for use in main.js
window.repairModule = {
  initializeRepair,
  loadRepairData,
  loadRepairs,
  loadVehicleStatus,
  openRepairModal,
  closeRepairModal,
  addRepairForVehicle,
  editRepair,
  deleteRepair
};
