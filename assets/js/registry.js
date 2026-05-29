// ====================== Registry View Functions ==========================

// Registry state variables
let currentRegistryView = 'truck'; // 'truck', 'trailer', 'container'
let registryFilter = 'all'; // 'all', 'plant1', 'plant2', etc.

// Initialize registry when view is shown
function initializeRegistry() {
  console.log('Registry view initialized');
  
  // Set up event listeners for registry buttons
  setupRegistryEventListeners();
  
  // Set truck button as active by default
  const truckBtn = document.getElementById('registry-truck-btn');
  if (truckBtn) {
    truckBtn.classList.add('active');
  }
  
  // Load plant counts with truck as default tab type
  if (window.loadPlantCounts) {
    window.loadPlantCounts('registry', 'truck');
  }
  
  // Load default view (truck)
  loadRegistryData();
}

// Set up registry event listeners
function setupRegistryEventListeners() {
  // Truck registry button
  const truckBtn = document.getElementById('registry-truck-btn');
  if (truckBtn) {
    truckBtn.addEventListener('click', () => {
      switchRegistryView('truck');
    });
  }
  
  // Trailer registry button
  const trailersBtn = document.getElementById('registry-trailer-btn');
  if (trailersBtn) {
    trailersBtn.addEventListener('click', () => {
      switchRegistryView('trailer');
    });
  }
  
  // Container registry button
  const containersBtn = document.getElementById('registry-container-btn');
  if (containersBtn) {
    containersBtn.addEventListener('click', () => {
      switchRegistryView('container');
    });
  }
  
  // Plant filter buttons
  const filterButtons = document.querySelectorAll('[data-plant-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plant = e.target.dataset.plantFilter;
      setRegistryPlantFilter(plant);
    });
  });
}

// Switch registry view
function switchRegistryView(view) {
  currentRegistryView = view;
  
  // Update button states
  const truckBtn = document.getElementById('registry-truck-btn');
  const trailersBtn = document.getElementById('registry-trailer-btn');
  const containersBtn = document.getElementById('registry-container-btn');
  
  // Remove active class from all buttons
  [truckBtn, trailersBtn, containersBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  
  // Add active class to selected button
  switch (view) {
    case 'truck':
      if (truckBtn) truckBtn.classList.add('active');
      break;
    case 'trailer':
      if (trailersBtn) trailersBtn.classList.add('active');
      break;
    case 'container':
      if (containersBtn) containersBtn.classList.add('active');
      break;
  }
  
  // Load appropriate data
  loadRegistryData();
}

// Set registry plant filter
function setRegistryPlantFilter(plant) {
  registryFilter = plant;
  
  // Update filter button states
  const filterButtons = document.querySelectorAll('[data-plant-filter]');
  filterButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.plantFilter === plant) {
      btn.classList.add('active');
    }
  });
  
  // Reload data with new filter
  loadRegistryData();
}

// Load registry data
async function loadRegistryData() {
  if (!window.getSupabaseClient) return;
  
  try {
    switch (currentRegistryView) {
      case 'truck':
        await loadVehicles(registryFilter === 'all' ? null : registryFilter);
        break;
      case 'trailer':
        await loadTrailers(registryFilter === 'all' ? null : registryFilter);
        break;
      case 'container':
        await loadContainers(registryFilter === 'all' ? null : registryFilter);
        break;
    }
    console.log(`Registry data loaded for ${currentRegistryView} with filter ${registryFilter}`);
  } catch (error) {
    console.error('Error loading registry data:', error);
    if (window.showError) {
      showError('Failed to load registry data: ' + error.message, 'Error');
    }
  }
}

// Load vehicles data
async function loadVehicles(plantFilter = null) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    let query = supabaseClient.from('vehicle_registry').select('*');
    
    if (plantFilter) {
      query = query.eq('location_plant', plantFilter);
    }
    
    const { data: vehicles, error } = await query.order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayVehicles(vehicles || []);
    
  } catch (error) {
    console.error('Error loading vehicles:', error);
    throw error;
  }
}

// Load trailers data
async function loadTrailers(plantFilter = null) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    let query = supabaseClient.from('trailer_registry').select('*');
    
    if (plantFilter) {
      query = query.eq('location_plant', plantFilter);
    }
    
    const { data: trailers, error } = await query.order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayTrailers(trailers || []);
    
  } catch (error) {
    console.error('Error loading trailers:', error);
    throw error;
  }
}

// Load containers data
async function loadContainers(plantFilter = null) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    let query = supabaseClient.from('containers').select('*');
    
    if (plantFilter) {
      query = query.eq('location_plant', plantFilter);
    }
    
    const { data: containers, error } = await query.order('container_number', { ascending: true });
    
    if (error) throw error;
    
    displayContainers(containers || []);
    
  } catch (error) {
    console.error('Error loading containers:', error);
    throw error;
  }
}

// Display vehicles in table
function displayVehicles(vehicles) {
  const tableBody = document.querySelector('#vehicle-registry-table tbody');
  if (!tableBody) return;
  
  if (vehicles.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
          <div>No vehicles found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = vehicles.map(vehicle => `
    <tr>
      <td>${vehicle.plate_no || '-'}</td>
      <td>${vehicle.make_model || '-'}</td>
      <td>${vehicle.year_model || '-'}</td>
      <td>${vehicle.color || '-'}</td>
      <td>${vehicle.location_plant || '-'}</td>
      <td>${vehicle.status || 'Active'}</td>
      <td>
        <button class="btn-edit" onclick="window.registryModule.editVehicle('${vehicle.id}')">Edit</button>
        <button class="btn-delete" onclick="window.registryModule.deleteVehicle('${vehicle.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Display trailers in table
function displayTrailers(trailers) {
    if (!tableBody) return;
  
  if (trailers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
          <div>No trailers found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = trailers.map(trailer => `
    <tr>
      <td>${trailer.plate_no || '-'}</td>
      <td>${trailer.chassis_no || '-'}</td>
      <td>${trailer.mv_file_no || '-'}</td>
      <td>${trailer.year_model || '-'}</td>
      <td>${trailer.owner_name || '-'}</td>
      <td>${trailer.trailer_type || '-'}</td>
      <td>${trailer.gross_weight || '-'}</td>
      <td>${trailer.location_plant || '-'}</td>
      <td>
        <button class="btn-edit" onclick="window.registryModule.editTrailer('${trailer.id}')">Edit</button>
        <button class="btn-delete" onclick="window.registryModule.deleteTrailer('${trailer.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Display containers in table
function displayContainers(containers) {
  const tableBody = document.querySelector('#container-table tbody');
    if (!tableBody) return;

  // Check if user is admin
  const isAdmin = window.authSystem && window.authSystem.isAdmin();

  // Hide/show Actions column header based on auth status
  const containerTable = document.querySelector('#container-table');
  if (containerTable) {
    const actionsHeader = containerTable.querySelector('thead tr td:nth-child(6)');
    if (actionsHeader) {
      actionsHeader.style.display = isAdmin ? '' : 'none';
    }
  }

  if (containers.length === 0) {
    const colspan = isAdmin ? 6 : 5;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colspan}" style="text-align: center; padding: 40px; color: #666;">
          <div>No containers found</div>
        </td>
      </tr>
    `;
    return;
  }

  const rows = containers.map(container => `
    <tr>
      <td>${container.container_number || '-'}</td>
      <td>${container.size || '-'}</td>
      <td>${container.type || '-'}</td>
      <td>${container.status || 'Active'}</td>
      <td>${container.location_plant || '-'}</td>
      ${isAdmin ? `<td class="auth-required">
        <button class="btn-edit" onclick="window.registryModule.editContainer('${container.id}')">Edit</button>
        <button class="btn-delete" onclick="window.registryModule.deleteContainer('${container.id}')">Delete</button>
      </td>` : ''}
    </tr>
  `).join('');

  tableBody.innerHTML = rows;

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Edit vehicle
async function editVehicle(vehicleId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  console.log(`Editing vehicle: ${vehicleId}`);
  // Implementation for opening edit modal
}

// Delete vehicle
async function deleteVehicle(vehicleId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  if (!confirm('Are you sure you want to delete this vehicle?')) {
    return;
  }
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient
      .from('vehicle_registry')
      .delete()
      .eq('id', vehicleId);
    
    if (error) throw error;
    
    await loadVehicles(registryFilter === 'all' ? null : registryFilter);
    
    if (window.showSuccess) {
      showSuccess('Vehicle deleted successfully!');
    }
    
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    if (window.showError) {
      showError('Failed to delete vehicle: ' + error.message, 'Error');
    }
  }
}

// Edit trailer
async function editTrailer(trailerId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  console.log(`Editing trailer: ${trailerId}`);
  // Implementation for opening edit modal
}

// Delete trailer
async function deleteTrailer(trailerId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  if (!confirm('Are you sure you want to delete this trailer?')) {
    return;
  }
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient
      .from('trailer_registry')
      .delete()
      .eq('id', trailerId);
    
    if (error) throw error;
    
    await loadTrailers(registryFilter === 'all' ? null : registryFilter);
    
    if (window.showSuccess) {
      showSuccess('Trailer deleted successfully!');
    }
    
  } catch (error) {
    console.error('Error deleting trailer:', error);
    if (window.showError) {
      showError('Failed to delete trailer: ' + error.message, 'Error');
    }
  }
}

// Edit container
async function editContainer(containerId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  console.log(`Editing container: ${containerId}`);
  // Implementation for opening edit modal
}

// Delete container
async function deleteContainer(containerId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    if (window.showError) {
      showError('Access denied. Admin privileges required.', 'Authentication Error');
    }
    return;
  }
  
  if (!confirm('Are you sure you want to delete this container?')) {
    return;
  }
  
  try {
    const supabaseClient = window.getSupabaseClient();
    const { error } = await supabaseClient
      .from('containers')
      .delete()
      .eq('id', containerId);
    
    if (error) throw error;
    
    await loadContainers(registryFilter === 'all' ? null : registryFilter);
    
    if (window.showSuccess) {
      showSuccess('Container deleted successfully!');
    }
    
  } catch (error) {
    console.error('Error deleting container:', error);
    if (window.showError) {
      showError('Failed to delete container: ' + error.message, 'Error');
    }
  }
}

// Export functions for use in main.js
window.registryModule = {
  initializeRegistry,
  loadRegistryData,
  loadVehicles,
  loadTrailers,
  loadContainers,
  switchRegistryView,
  setRegistryPlantFilter,
  editVehicle,
  deleteVehicle,
  editTrailer,
  deleteTrailer,
  editContainer,
  deleteContainer
};
