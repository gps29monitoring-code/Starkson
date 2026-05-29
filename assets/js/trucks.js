// ====================== Trucks View Functions ==========================

// Trucks state variables
let currentTrucksView = 'trucks'; // 'trucks', 'trailers', 'containers'

// Initialize trucks when view is shown
function initializeTrucks() {
  console.log('Trucks view initialized');
  
  // Setup trucks event listeners
  setupTrucksEventListeners();
  
  // Load plant counts with truck as default tab type
  if (window.loadPlantCounts) {
    window.loadPlantCounts('trucks', 'truck');
  }
  
  // Reset to Truck as default active state when entering trucks tab
  setTimeout(() => {
    switchTrucksView('trucks');
  }, 100);
}

// Setup trucks event listeners
function setupTrucksEventListeners() {
  // Truck images buttons
  const truckImagesBtn = document.getElementById('truck-images-btn');
  if (truckImagesBtn) {
    truckImagesBtn.addEventListener('click', () => {
      switchTrucksView('trucks');
    });
  }
  
  // Trailer images buttons
  const trailerImagesBtn = document.getElementById('trailer-images-btn');
  if (trailerImagesBtn) {
    trailerImagesBtn.addEventListener('click', () => {
      switchTrucksView('trailers');
    });
  }
  
  // Container images buttons
  const containerImagesBtn = document.getElementById('container-images-btn');
  if (containerImagesBtn) {
    containerImagesBtn.addEventListener('click', () => {
      switchTrucksView('containers');
    });
  }
  
  console.log('Trucks event listeners setup');
}

// Switch trucks view
function switchTrucksView(view) {
  currentTrucksView = view;
  
  // Update button states
  const truckImagesBtn = document.getElementById('truck-images-btn');
  const trailerImagesBtn = document.getElementById('trailer-images-btn');
  const containerImagesBtn = document.getElementById('container-images-btn');
  
  // Remove active class from all buttons
  [truckImagesBtn, trailerImagesBtn, containerImagesBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  
  // Add active class to selected button
  switch (view) {
    case 'trucks':
      if (truckImagesBtn) truckImagesBtn.classList.add('active');
      break;
    case 'trailers':
      if (trailerImagesBtn) trailerImagesBtn.classList.add('active');
      break;
    case 'containers':
      if (containerImagesBtn) containerImagesBtn.classList.add('active');
      break;
  }
  
  // Show/hide tables
  const truckTable = document.getElementById('truck-images-table');
  const trailerTable = document.getElementById('trailer-images-table');
  const containerTable = document.getElementById('container-images-table');
  
  if (truckTable) truckTable.style.display = 'none';
  if (trailerTable) trailerTable.style.display = 'none';
  if (containerTable) containerTable.style.display = 'none';
  
  switch (view) {
    case 'trucks':
      if (truckTable) truckTable.style.display = 'table';
      break;
    case 'trailers':
      if (trailerTable) trailerTable.style.display = 'table';
      break;
    case 'containers':
      if (containerTable) containerTable.style.display = 'table';
      break;
  }
  
  // Load appropriate data
  loadTrucksData();
}

// Load trucks data
async function loadTrucksData() {
  if (!window.getSupabaseClient) return;
  
  try {
    switch (currentTrucksView) {
      case 'trucks':
        await loadTruckImages();
        break;
      case 'trailers':
        await loadTrailerImages();
        break;
      case 'containers':
        await loadContainerImages();
        break;
    }
    console.log(`Trucks data loaded for ${currentTrucksView}`);
  } catch (error) {
    console.error('Error loading trucks data:', error);
    if (window.showError) {
      showError('Failed to load trucks data: ' + error.message, 'Error');
    }
  }
}

// Load truck images
async function loadTruckImages() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: trucks, error } = await supabaseClient
      .from('vehicle_registry')
      .select('*')
      .eq('type', 'Truck')
      .order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayTruckImages(trucks || []);
    
  } catch (error) {
    console.error('Error loading truck images:', error);
    throw error;
  }
}

// Load trailer images
async function loadTrailerImages() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: trailers, error } = await supabaseClient
      .from('trailer_registry')
      .select('*')
      .order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayTrailerImages(trailers || []);
    
  } catch (error) {
    console.error('Error loading trailer images:', error);
    throw error;
  }
}

// Load container images
async function loadContainerImages() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: containers, error } = await supabaseClient
      .from('containers')
      .select('*')
      .order('container_number', { ascending: true });
    
    if (error) throw error;
    
    displayContainerImages(containers || []);
    
  } catch (error) {
    console.error('Error loading container images:', error);
    throw error;
  }
}

// Display truck images
function displayTruckImages(trucks) {
  const tableBody = document.querySelector('#truck-images-table tbody');
  if (!tableBody) return;
  
  if (trucks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No truck images available</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = trucks.map(truck => `
    <tr>
      <td>${truck.plate_no || '-'}</td>
      <td>${truck.make_model || '-'}</td>
      <td>${truck.year_model || '-'}</td>
      <td>${truck.color || '-'}</td>
      <td>${truck.status || 'Active'}</td>
      <td>
        <button class="btn-view" onclick="window.trucksModule.viewTruckDetails('${truck.id}')">View</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// Display trailer images
function displayTrailerImages(trailers) {
  const tableBody = document.querySelector('#trailer-images-table tbody');
  if (!tableBody) return;
  
  if (trailers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No trailer images available</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = trailers.map(trailer => `
    <tr>
      <td>${trailer.plate_no || '-'}</td>
      <td>${trailer.chassis_no || '-'}</td>
      <td>${trailer.year_model || '-'}</td>
      <td>${trailer.mv_file_no || '-'}</td>
      <td>${trailer.status || 'Active'}</td>
      <td>
        <button class="btn-view" onclick="window.trucksModule.viewTrailerDetails('${trailer.id}')">View</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// Display container images
function displayContainerImages(containers) {
  const tableBody = document.querySelector('#container-images-table tbody');
  if (!tableBody) return;
  
  if (containers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div>No container images available</div>
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
      <td>
        <button class="btn-view" onclick="window.trucksModule.viewContainerDetails('${container.id}')">View</button>
      </td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

// View truck details
function viewTruckDetails(truckId) {
  console.log(`Viewing truck details: ${truckId}`);
  // Implementation for viewing truck details
}

// View trailer details
function viewTrailerDetails(trailerId) {
  console.log(`Viewing trailer details: ${trailerId}`);
  // Implementation for viewing trailer details
}

// View container details
function viewContainerDetails(containerId) {
  console.log(`Viewing container details: ${containerId}`);
  // Implementation for viewing container details
}

// Export functions for use in main.js
window.trucksModule = {
  initializeTrucks,
  loadTrucksData,
  switchTrucksView,
  loadTruckImages,
  loadTrailerImages,
  loadContainerImages,
  viewTruckDetails,
  viewTrailerDetails,
  viewContainerDetails
};
