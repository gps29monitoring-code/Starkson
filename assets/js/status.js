// ====================== Status View Functions ==========================

// Status state variables
let currentStatusView = 'trucks'; // 'trucks', 'trailers', 'containers'
window.currentStatusFilter = null; // Current status filter for truck table (accessible from main.js)

// Initialize status when view is shown
async function initializeStatus() {
  console.log('Status view initialized');
  
  // Setup status event listeners
  setupStatusEventListeners();
  
  // Ensure vehicle data is loaded before proceeding
  if (typeof window.vehicleStatusRecords === 'undefined' || !window.vehicleStatusRecords || window.vehicleStatusRecords.length === 0) {
    console.log('Vehicle data not loaded, loading now...');
    await loadVehicleStatus();
    console.log('Vehicle data loaded, count:', window.vehicleStatusRecords ? window.vehicleStatusRecords.length : 0);
  } else {
    console.log('Vehicle data already available, count:', window.vehicleStatusRecords.length);
  }
  
  // Setup status row click handlers (ensure they're attached)
  setupStatusRowListeners();
  
  // Reset to Truck as default active state when entering status tab
  setTimeout(() => {
    switchStatusView('trucks');
  }, 100);
  
  // Re-attach status row listeners after table is populated (delay to ensure table is rendered)
  setTimeout(() => {
    setupStatusRowListeners();
  }, 500);
}

// Setup status event listeners
function setupStatusEventListeners() {
  // Truck table button
  const truckBtn = document.getElementById('truck-table-btn');
  if (truckBtn) {
    truckBtn.addEventListener('click', () => {
      switchStatusView('trucks');
    });
  }
  
  // Trailer table button
  const trailerBtn = document.getElementById('trailer-table-btn');
  if (trailerBtn) {
    trailerBtn.addEventListener('click', () => {
      switchStatusView('trailers');
    });
  }
  
  // Container table button
  const containerBtn = document.getElementById('container-table-btn');
  if (containerBtn) {
    containerBtn.addEventListener('click', () => {
      switchStatusView('containers');
    });
  }
  
  // Status row click handlers for Vehicle Status Summary table
  const statusRows = document.querySelectorAll('.status-row.clickable');
  statusRows.forEach(row => {
    row.addEventListener('dblclick', function() {
      const status = this.getAttribute('data-status');
      handleStatusRowClick(status, this);
    });
  });
  
  // Setup editable placeholder functionality
  setupEditablePlaceholders();
}

// Handle status row click
function handleStatusRowClick(status, rowElement) {
  console.log('Status row clicked:', status);
  console.log('Current filter before click:', window.currentStatusFilter);
  console.log('vehicleStatusRecords available:', typeof window.vehicleStatusRecords !== 'undefined' && window.vehicleStatusRecords && window.vehicleStatusRecords.length > 0);
  
  // Toggle filter: if clicking the same status, clear the filter
  if (window.currentStatusFilter === status) {
    window.currentStatusFilter = null;
    // Remove highlight from all rows
    document.querySelectorAll('.status-row.clickable').forEach(r => {
      r.style.backgroundColor = '';
    });
    console.log('Status filter cleared');
  } else {
    window.currentStatusFilter = status;
    // Remove highlight from all rows
    document.querySelectorAll('.status-row.clickable').forEach(r => {
      r.style.backgroundColor = '';
    });
    // Highlight selected row
    rowElement.style.backgroundColor = '#e8f5e9';
    console.log('Status filter set to:', status);
  }
  
  // Apply filter immediately using cached data (no async delay)
  if (typeof window.vehicleStatusRecords !== 'undefined' && window.vehicleStatusRecords && window.vehicleStatusRecords.length > 0) {
    console.log('Using cached vehicleStatusRecords, count:', window.vehicleStatusRecords.length);
    if (typeof displayVehicleStatus === 'function') {
      displayVehicleStatus(window.vehicleStatusRecords);
      console.log('displayVehicleStatus called successfully');
    } else {
      console.error('displayVehicleStatus function not found in main.js');
    }
  } else {
    console.warn('vehicleStatusRecords not available, attempting to load...');
    // Only load data as a last resort - this should rarely happen
    loadVehicleStatus();
  }
}

// Setup editable placeholder functionality for textareas
function setupEditablePlaceholders() {
  const editableElements = document.querySelectorAll('.editable-placeholder');
  
  editableElements.forEach(element => {
    const placeholder = element.getAttribute('data-placeholder');
    
    // Focus event - select all text if it's the placeholder
    element.addEventListener('focus', function() {
      if (this.value === placeholder) {
        this.select();
      }
    });
    
    // Click event - select all text if it's the placeholder
    element.addEventListener('click', function() {
      if (this.value === placeholder) {
        this.select();
      }
    });
    
        
    // Handle form submission - don't submit placeholder value
    const form = element.closest('form');
    if (form) {
      form.addEventListener('submit', function() {
        if (element.value === placeholder) {
          element.value = '';
        }
      });
    }
  });
}

// Switch status view
function switchStatusView(view) {
  currentStatusView = view;
  
  // Update button states
  const truckBtn = document.getElementById('truck-table-btn');
  const trailerBtn = document.getElementById('trailer-table-btn');
  const containerBtn = document.getElementById('container-table-btn');
  
  // Remove active class from all buttons
  [truckBtn, trailerBtn, containerBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  
  // Add active class to selected button
  switch (view) {
    case 'trucks':
      if (truckBtn) truckBtn.classList.add('active');
      break;
    case 'trailers':
      if (trailerBtn) trailerBtn.classList.add('active');
      break;
    case 'containers':
      if (containerBtn) containerBtn.classList.add('active');
      break;
  }
  
  // Show/hide tables
  const truckTable = document.getElementById('truck-images-table');
  const trailerTable = document.getElementById('trailer-images-table');
  const containerTable = document.getElementById('container-images-table');
  const summaryTable = document.getElementById('vehicle-status-summary-table');
  
  if (truckTable) truckTable.style.display = 'none';
  if (trailerTable) trailerTable.style.display = 'none';
  if (containerTable) containerTable.style.display = 'none';
  if (summaryTable) summaryTable.closest('.recentVehicles').style.display = 'none';
  
  switch (view) {
    case 'trucks':
      if (truckTable) truckTable.style.display = 'table';
      if (summaryTable) summaryTable.closest('.recentVehicles').style.display = 'block';
      break;
    case 'trailers':
      if (trailerTable) trailerTable.style.display = 'table';
      break;
    case 'containers':
      if (containerTable) containerTable.style.display = 'table';
      break;
  }
  
  // Load appropriate data
  loadStatusData();
}

// Load status data
async function loadStatusData() {
  if (!window.getSupabaseClient) return;
  
  try {
    switch (currentStatusView) {
      case 'trucks':
        await loadVehicleStatus();
        await loadVehicleStatusSummary();
        break;
      case 'trailers':
        await loadTrailerStatus();
        break;
      case 'containers':
        await loadContainerStatus();
        break;
    }
    console.log(`Status data loaded for ${currentStatusView}`);
  } catch (error) {
    console.error('Error loading status data:', error);
    if (window.showError) {
      showError('Failed to load status data: ' + error.message, 'Error');
    }
  }
}

// Load vehicle status
async function loadVehicleStatus() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: vehicles, error } = await supabaseClient
      .from('vehicle_registry')
      .select('*')
      .order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    // Set window.vehicleStatusRecords for filtering
    window.vehicleStatusRecords = vehicles || [];
    console.log('vehicleStatusRecords set in status.js, count:', window.vehicleStatusRecords.length);
    
    displayVehicleStatus(vehicles || []);
    
  } catch (error) {
    console.error('Error loading vehicle status:', error);
    throw error;
  }
}

// Load vehicle status summary
async function loadVehicleStatusSummary(plantFilter = null) {
  try {
    console.log('Loading vehicle status summary from status truck table data...');
    console.log('Plant filter:', plantFilter);
    
    // Update title based on plant filter
    const titleElement = document.getElementById('vehicle-status-summary-title');
    if (titleElement) {
      if (plantFilter) {
        titleElement.textContent = `Vehicle Status Summary - ${plantFilter}`;
      } else {
        titleElement.textContent = 'Vehicle Status Summary';
      }
    }
    
    // Use vehicleStatusRecords from main.js (contains merged data from vehicle_registry + drivers_status)
    let vehicles = [];
    if (typeof window.vehicleStatusRecords !== 'undefined' && window.vehicleStatusRecords) {
      vehicles = window.vehicleStatusRecords;
      console.log('Using vehicleStatusRecords from main.js:', vehicles.length, 'vehicles');
    } else {
      console.warn('vehicleStatusRecords not found in window, fetching from database...');
      // Fallback: fetch from database if vehicleStatusRecords is not available
      const supabaseClient = window.getSupabaseClient();
      if (!supabaseClient) {
        console.error('Supabase client not available');
        return;
      }
      
      const { data: dbVehicles, error } = await supabaseClient
        .from('vehicle_registry')
        .select('*');
      
      if (error) {
        console.error('Error fetching vehicle data:', error);
        throw error;
      }
      
      vehicles = dbVehicles || [];
      console.log('Vehicle data fetched from database:', vehicles.length, 'vehicles');
    }
    
    // Apply plant filter if specified
    if (plantFilter) {
      vehicles = vehicles.filter(vehicle => {
        const vehiclePlant = (vehicle.plant || '').toLowerCase().trim();
        const filterPlant = plantFilter.toLowerCase().trim();
        return vehiclePlant === filterPlant;
      });
      console.log('Vehicles after plant filter:', vehicles.length, 'vehicles');
    }
    
    // Filter out trailers to show only truck data
    const truckOnlyData = vehicles.filter(vehicle => {
      const vehicleType = (vehicle.vehicle_type || '').toLowerCase().trim();
      const size = (vehicle.size || '').toLowerCase().trim();
      return !vehicleType.includes('trailer') && !size.includes('trailer');
    });
    
    console.log('Truck-only data after filtering:', truckOnlyData.length, 'vehicles');
    displayVehicleStatusSummary(truckOnlyData);
    
  } catch (error) {
    console.error('Error loading vehicle status summary:', error);
    throw error;
  }
}

// Display vehicle status summary
function displayVehicleStatusSummary(vehicles) {
  console.log('Processing vehicle status summary with', vehicles.length, 'vehicles');
  console.log('Sample vehicle data:', vehicles.slice(0, 3));
  
  // Initialize counters
  const counts = {
    operational: { truckHead: 0, wheeler12: 0, wheeler10: 0, wheeler8: 0, wheeler6: 0, wheeler4: 0 },
    hustling: { truckHead: 0, wheeler12: 0, wheeler10: 0, wheeler8: 0, wheeler6: 0, wheeler4: 0 },
    down: { truckHead: 0, wheeler12: 0, wheeler10: 0, wheeler8: 0, wheeler6: 0, wheeler4: 0 },
    totallyDown: { truckHead: 0, wheeler12: 0, wheeler10: 0, wheeler8: 0, wheeler6: 0, wheeler4: 0 }
  };
  
  let processedCount = 0;
  let skippedCount = 0;
  
  // Count vehicles by type and status
  vehicles.forEach(vehicle => {
    const status = (vehicle.status || '').toLowerCase();
    // Use size column from both vehicle_registry and trailer_registry
    const size = (vehicle.size || '').toLowerCase();
    
    console.log('Processing vehicle:', {
      plate: vehicle.plate_no || vehicle.plate,
      status: status,
      size: size,
      source: vehicle.source
    });
    
    // Only process vehicles that have a status
    if (!status || status === '' || status === 'null' || status === 'undefined' || status === 'n/a') {
      console.log('Skipping vehicle with no status:', vehicle.plate_no || vehicle.plate);
      skippedCount++;
      return;
    }
    
    processedCount++;
    
    // Determine status category
    let statusCategory;
    if (status.includes('totally down') || status.includes('totallydown')) {
      statusCategory = 'totallyDown';
    } else if (status.includes('operational/hustling') || status.includes('hustling')) {
      statusCategory = 'hustling';
    } else if (status.includes('down')) {
      statusCategory = 'down';
    } else if (status.includes('operational')) {
      statusCategory = 'operational';
    } else {
      statusCategory = 'operational'; // Default to operational
    }
    
    // Determine vehicle type based on size column
    if (size.includes('truck head') || size.includes('truckhead')) {
      counts[statusCategory].truckHead++;
    } else if (size.includes('12') || size.includes('12wheeler')) {
      counts[statusCategory].wheeler12++;
    } else if (size.includes('10') || size.includes('10wheeler')) {
      counts[statusCategory].wheeler10++;
    } else if (size.includes('8') || size.includes('8wheeler')) {
      counts[statusCategory].wheeler8++;
    } else if (size.includes('6') || size.includes('6wheeler')) {
      counts[statusCategory].wheeler6++;
    } else if (size.includes('4') || size.includes('4wheeler')) {
      counts[statusCategory].wheeler4++;
    } else {
      // If size doesn't match any category, count as Truck Head by default
      counts[statusCategory].truckHead++;
    }
  });
  
  console.log('Processed:', processedCount, 'vehicles');
  console.log('Skipped:', skippedCount, 'vehicles (no status)');
  console.log('Counts calculated:', counts);
  
  // Calculate totals
  const operationalTotal = counts.operational.truckHead + counts.operational.wheeler12 + 
                          counts.operational.wheeler10 + counts.operational.wheeler8 + 
                          counts.operational.wheeler6 + counts.operational.wheeler4;
  const hustlingTotal = counts.hustling.truckHead + counts.hustling.wheeler12 + 
                       counts.hustling.wheeler10 + counts.hustling.wheeler8 + 
                       counts.hustling.wheeler6 + counts.hustling.wheeler4;
  const downTotal = counts.down.truckHead + counts.down.wheeler12 + 
                  counts.down.wheeler10 + counts.down.wheeler8 + 
                  counts.down.wheeler6 + counts.down.wheeler4;
  const totallyDownTotal = counts.totallyDown.truckHead + counts.totallyDown.wheeler12 + 
                          counts.totallyDown.wheeler10 + counts.totallyDown.wheeler8 + 
                          counts.totallyDown.wheeler6 + counts.totallyDown.wheeler4;
  
  const grandTotalTruckHead = counts.operational.truckHead + counts.hustling.truckHead + counts.down.truckHead + counts.totallyDown.truckHead;
  const grandTotal12 = counts.operational.wheeler12 + counts.hustling.wheeler12 + counts.down.wheeler12 + counts.totallyDown.wheeler12;
  const grandTotal10 = counts.operational.wheeler10 + counts.hustling.wheeler10 + counts.down.wheeler10 + counts.totallyDown.wheeler10;
  const grandTotal8 = counts.operational.wheeler8 + counts.hustling.wheeler8 + counts.down.wheeler8 + counts.totallyDown.wheeler8;
  const grandTotal6 = counts.operational.wheeler6 + counts.hustling.wheeler6 + counts.down.wheeler6 + counts.totallyDown.wheeler6;
  const grandTotal4 = counts.operational.wheeler4 + counts.hustling.wheeler4 + counts.down.wheeler4 + counts.totallyDown.wheeler4;
  const grandTotal = operationalTotal + hustlingTotal + downTotal + totallyDownTotal;
  
  // Helper function to convert 0 to dash
  const formatValue = (value) => value === 0 ? '-' : value;
  
  // Update table cells
  document.getElementById('summary-truckhead-operational').textContent = formatValue(counts.operational.truckHead);
  document.getElementById('summary-12wheeler-operational').textContent = formatValue(counts.operational.wheeler12);
  document.getElementById('summary-10wheeler-operational').textContent = formatValue(counts.operational.wheeler10);
  document.getElementById('summary-8wheeler-operational').textContent = formatValue(counts.operational.wheeler8);
  document.getElementById('summary-6wheeler-operational').textContent = formatValue(counts.operational.wheeler6);
  document.getElementById('summary-4wheeler-operational').textContent = formatValue(counts.operational.wheeler4);
  document.getElementById('summary-total-operational').textContent = formatValue(operationalTotal);
  
  document.getElementById('summary-truckhead-hustling').textContent = formatValue(counts.hustling.truckHead);
  document.getElementById('summary-12wheeler-hustling').textContent = formatValue(counts.hustling.wheeler12);
  document.getElementById('summary-10wheeler-hustling').textContent = formatValue(counts.hustling.wheeler10);
  document.getElementById('summary-8wheeler-hustling').textContent = formatValue(counts.hustling.wheeler8);
  document.getElementById('summary-6wheeler-hustling').textContent = formatValue(counts.hustling.wheeler6);
  document.getElementById('summary-4wheeler-hustling').textContent = formatValue(counts.hustling.wheeler4);
  document.getElementById('summary-total-hustling').textContent = formatValue(hustlingTotal);
  
  document.getElementById('summary-truckhead-down').textContent = formatValue(counts.down.truckHead);
  document.getElementById('summary-12wheeler-down').textContent = formatValue(counts.down.wheeler12);
  document.getElementById('summary-10wheeler-down').textContent = formatValue(counts.down.wheeler10);
  document.getElementById('summary-8wheeler-down').textContent = formatValue(counts.down.wheeler8);
  document.getElementById('summary-6wheeler-down').textContent = formatValue(counts.down.wheeler6);
  document.getElementById('summary-4wheeler-down').textContent = formatValue(counts.down.wheeler4);
  document.getElementById('summary-total-down').textContent = formatValue(downTotal);
  
  document.getElementById('summary-truckhead-totallydown').textContent = formatValue(counts.totallyDown.truckHead);
  document.getElementById('summary-12wheeler-totallydown').textContent = formatValue(counts.totallyDown.wheeler12);
  document.getElementById('summary-10wheeler-totallydown').textContent = formatValue(counts.totallyDown.wheeler10);
  document.getElementById('summary-8wheeler-totallydown').textContent = formatValue(counts.totallyDown.wheeler8);
  document.getElementById('summary-6wheeler-totallydown').textContent = formatValue(counts.totallyDown.wheeler6);
  document.getElementById('summary-4wheeler-totallydown').textContent = formatValue(counts.totallyDown.wheeler4);
  document.getElementById('summary-total-totallydown').textContent = formatValue(totallyDownTotal);
  
  document.getElementById('summary-grand-truckhead').textContent = formatValue(grandTotalTruckHead);
  document.getElementById('summary-grand-12wheeler').textContent = formatValue(grandTotal12);
  document.getElementById('summary-grand-10wheeler').textContent = formatValue(grandTotal10);
  document.getElementById('summary-grand-8wheeler').textContent = formatValue(grandTotal8);
  document.getElementById('summary-grand-6wheeler').textContent = formatValue(grandTotal6);
  document.getElementById('summary-grand-4wheeler').textContent = formatValue(grandTotal4);
  document.getElementById('summary-grand-total').textContent = formatValue(grandTotal);
  
  console.log('Summary table updated successfully');
  
  // Re-attach event listeners to status rows after table update
  setupStatusRowListeners();
}

// Setup status row click handlers (separate function to call after table updates)
function setupStatusRowListeners() {
  const statusRows = document.querySelectorAll('.status-row.clickable');
  statusRows.forEach(row => {
    // Remove existing listeners to avoid duplicates
    row.removeEventListener('click', handleStatusRowClickWrapper);
    // Add new listener
    row.addEventListener('click', handleStatusRowClickWrapper);
  });
}

// Wrapper function to handle status row click
function handleStatusRowClickWrapper(event) {
  const row = event.currentTarget;
  const status = row.getAttribute('data-status');
  handleStatusRowClick(status, row);
}

// Load trailer status
async function loadTrailerStatus() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    const { data: trailers, error } = await supabaseClient
      .from('trailer_registry')
      .select('*')
      .order('plate_no', { ascending: true });
    
    if (error) throw error;
    
    displayTrailerStatus(trailers || []);
    
  } catch (error) {
    console.error('Error loading trailer status:', error);
    throw error;
  }
}

// Load container status
async function loadContainerStatus() {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) return;
  
  try {
    console.log('Fetching container data from database...');
    // Force fresh data by using .select() with no caching
    const { data: containers, error } = await supabaseClient
      .from('containers')
      .select('id, container_number, chassi_no, color, size, remarks, container_issue, status')
      .order('container_number', { ascending: true })
      .limit(1000); // Add limit to ensure fresh data
    
    if (error) throw error;
    
    console.log('Container data fetched:', containers);
    console.log('Number of containers:', containers?.length || 0);
    
    displayContainerStatus(containers || []);
    
  } catch (error) {
    console.error('Error loading container status:', error);
    throw error;
  }
}

// Display vehicle status
function displayVehicleStatus(vehicles) {
  const tbody = document.querySelector('#status-table tbody');
  if (!tbody) return;

  // Check if user is admin
  const isAdmin = window.authSystem && window.authSystem.isAdmin();

  // Hide/show Actions column header based on auth status
  const actionsHeader = document.querySelector('#status-table thead tr td:nth-child(7)');
  if (actionsHeader) {
    actionsHeader.style.display = isAdmin ? '' : 'none';
  }

  // Apply status filter if active
  let filteredVehicles = vehicles;
  if (window.currentStatusFilter) {
    filteredVehicles = vehicles.filter(vehicle => {
      const vehicleStatus = (vehicle.status || '').toLowerCase();
      const filterStatus = window.currentStatusFilter.toLowerCase();
      
      // Match status with partial matching for "Totally Down" and "Operational/Hustling"
      if (filterStatus.includes('totally down')) {
        return vehicleStatus.includes('totally down') || vehicleStatus.includes('totallydown');
      } else if (filterStatus.includes('operational/hustling') || filterStatus.includes('hustling')) {
        return vehicleStatus.includes('operational/hustling') || vehicleStatus.includes('hustling');
      } else if (filterStatus.includes('down')) {
        return vehicleStatus.includes('down') && !vehicleStatus.includes('totally');
      } else if (filterStatus.includes('operational')) {
        return vehicleStatus.includes('operational') && !vehicleStatus.includes('hustling');
      }
      return false;
    });
    console.log(`Filtered to ${filteredVehicles.length} vehicles with status: ${window.currentStatusFilter}`);
  }

  if (filteredVehicles.length === 0) {
    const colspan = isAdmin ? 7 : 6;
    const message = window.currentStatusFilter 
      ? `No vehicles found with status: ${window.currentStatusFilter}`
      : 'No vehicles found. Add vehicles to Vehicle Registry first.';
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666;">
          ${message}
        </td>
      </tr>
    `;
    return;
  }

  // Map status values to colors for consistency
  const statusColor = {
    'OPERATIONAL': 'green',
    'OPERATIONAL/HUSTLING': 'blue',
    'DOWN': 'red',
    'TOTALLY DOWN': 'brown'
  };

  const vehicleRows = filteredVehicles.map(vehicle => {
    const color = statusColor[vehicle.status] || 'black';
    return `
      <tr>
        <td>${vehicle.plate || 'N/A'}</td>
        <td>${vehicle.size || 'N/A'}</td>
        <td>${vehicle.model || 'N/A'}</td>
        <td>${vehicle.driver || 'N/A'}</td>
        <td>${vehicle.truck_issue || '-'}</td>
        <td><span style="color: ${color}; font-weight: 600;">${vehicle.status || 'N/A'}</span></td>
        ${isAdmin ? `
          <td style="text-align: center; gap: 5px; display: flex;">
            <button onclick="openTruckEditModal('${vehicle.plate}')" class="action-btn">Edit</button>
          </td>` : ''}
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = vehicleRows;

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Display trailer status
function displayTrailerStatus(trailers) {
  const tableBody = document.querySelector('#trailer-images-table tbody');
  if (!tableBody) return;

  // Check if user is admin
  const isAdmin = window.authSystem && window.authSystem.isAdmin();

  if (trailers.length === 0) {
    const colspan = isAdmin ? 6 : 5;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colspan}" style="text-align: center; padding: 40px; color: #666;">
          <div>No trailer status data available</div>
        </td>
      </tr>
    `;
    return;
  }

  const rows = trailers.map(trailer => `
    <tr>
      <td>${trailer.plate_no || '-'}</td>
      <td>${trailer.chassis_no || '-'}</td>
      <td>${getStyledStatus(trailer.status)}</td>
      <td>${trailer.location_plant || '-'}</td>
      <td>${trailer.container || '-'}</td>
      ${isAdmin ? `<td>
        <button class="btn-view auth-required" onclick="window.statusModule.viewTrailerDetails('${trailer.id}')">View</button>
      </td>` : ''}
    </tr>
  `).join('');

  tableBody.innerHTML = rows;

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Helper function to generate styled status with color, bold, and all caps
function getStyledStatus(status) {
  const statusText = (status || 'ACTIVE').toString().toUpperCase();
  
  // Return dash for ACTIVE status
  if (statusText === 'ACTIVE') {
    return '-';
  }
  
  let color = 'green'; // default color
  
  // Check for totally down first (before other checks)
  if (statusText.includes('TOTALLY DOWN') || statusText.includes('TOTALLYDOWN')) {
    color = 'brown';
  } else if (statusText === 'DOWN') {
    color = 'red';
  } else if (statusText === 'OPERATIONAL/HUSTLING') {
    color = 'blue';
  } else if (statusText === 'OPERATIONAL') {
    color = 'green';
  } else {
    color = 'green';
  }
  
  return `<span style="color: ${color}; font-weight: bold; text-transform: uppercase;">${statusText}</span>`;
}

// Display container status
function displayContainerStatus(containers) {
  console.log('Displaying container status with data:', containers);
  
  const tableBody = document.querySelector('#status-container-table tbody');
  if (!tableBody) {
    console.error('Container table body not found!');
    return;
  }
  
  // Hide/show Actions column header based on user role
  const isAdmin = window.authSystem && window.authSystem.isAdmin();
  const headerRow = document.querySelector('#status-container-table thead tr');
  if (headerRow) {
    const headerCells = headerRow.querySelectorAll('td');
    // The Actions column is the last column (8th column)
    if (headerCells.length >= 8) {
      headerCells[7].style.display = isAdmin ? '' : 'none';
    }
  }
  
  if (containers.length === 0) {
    console.log('No containers to display');
    const isAdmin = window.authSystem && window.authSystem.isAdmin();
    const colspan = isAdmin ? 8 : 7; // 8 columns for admin (including Actions), 7 for guest
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colspan}" style="text-align: center; padding: 40px; color: #666;">
          <div>No container status data available</div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = containers.map(container => {
    console.log('Rendering container:', container);
    return `
    <tr>
      <td>${container.container_number || '-'}</td>
      <td>${container.chassi_no || '-'}</td>
      <td style="color: ${container.color === 'Blue' ? 'blue' : container.color === 'Red' ? 'red' : container.color === 'Green' ? 'green' : container.color === 'Yellow' ? 'yellow' : 'inherit'}; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${container.color || '-'}</td>
      <td>${container.size || '-'}</td>
      <td>${container.remarks || '-'}</td>
      <td>${container.container_issue || '-'}</td>
      <td>${getStyledStatus(container.status)}</td>
      ${window.authSystem && window.authSystem.isAdmin() ? `
      <td class="auth-required">
        <button class="btn-edit" onclick="editContainerStatus('${container.id || ''}', '${container.container_number || ''}', '${container.chassi_no || ''}', '${container.color || ''}', '${container.size || ''}', '${container.remarks || ''}', '${container.container_issue || ''}', '${container.status || ''}')">Edit</button>
        <button class="btn-delete" onclick="window.statusModule.deleteContainerFromStatus('${container.id || ''}')">Delete</button>
      </td>` : ''}
    </tr>
  `;
  }).join('');

  console.log('Generated table rows:', rows);
  console.log('Updating table body HTML...');
  tableBody.innerHTML = rows;
  console.log('Table body HTML updated. Current HTML:', tableBody.innerHTML);

  // Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
  if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
  }
}

// Edit container status function
function editContainerStatus(id, containerNumber, chassiNo, color, size, remarks, containerIssue, status) {
  // Populate modal fields with container data
  document.getElementById('status-container-number').value = containerNumber || '';
  document.getElementById('status-container-chassi').value = chassiNo || '';
  document.getElementById('status-container-color').value = color || '';
  document.getElementById('status-container-size').value = size || '';
  // Handle editable placeholders for remarks and container issue
  const remarksField = document.getElementById('status-container-remarks');
  const issueField = document.getElementById('status-container-issue');
  
  if (remarks && remarks.trim() !== '') {
    remarksField.value = remarks;
  } else {
    remarksField.value = remarksField.getAttribute('data-placeholder') || '-';
  }
  
  if (containerIssue && containerIssue.trim() !== '') {
    issueField.value = containerIssue;
  } else {
    issueField.value = issueField.getAttribute('data-placeholder') || '-';
  }
  document.getElementById('status-container-status').value = status || '';
  
  // Store the container ID for saving changes
  window.currentEditingContainerId = id;
  
  // Show the modal
  const modal = document.getElementById('status-container-modal');
  const overlay = document.getElementById('status-container-modal-overlay');
  
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Close status container modal function
function closeStatusContainerModal() {
  const modal = document.getElementById('status-container-modal');
  const overlay = document.getElementById('status-container-modal-overlay');
  
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Clear the editing container ID
  window.currentEditingContainerId = null;
}

// Handle status container form submission
async function handleStatusContainerFormSubmit(e) {
  e.preventDefault();
  
  if (!window.currentEditingContainerId) {
    showError('No container selected for editing', 'Error');
    return;
  }
  
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    showError('Database connection not available', 'Error');
    return;
  }
  
  // Get form values
  const containerNumber = document.getElementById('status-container-number').value;
  const chassiNo = document.getElementById('status-container-chassi').value;
  const color = document.getElementById('status-container-color').value;
  const size = document.getElementById('status-container-size').value;
  const remarks = document.getElementById('status-container-remarks').value;
  const containerIssue = document.getElementById('status-container-issue').value;
  let status = document.getElementById('status-container-status').value;
  
  // Convert empty status to null to satisfy database constraint
  status = status.trim() === '' ? null : status;
  
  try {
    // Update container data in database
    const { data, error } = await supabaseClient
      .from('containers')
      .update({
        container_number: containerNumber,
        chassi_no: chassiNo,
        color: color,
        size: size,
        remarks: remarks,
        container_issue: containerIssue,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', window.currentEditingContainerId)
      .select();
    
    if (error) throw error;
    
    showSuccess('Container status updated successfully!');
    closeStatusContainerModal();
    
    console.log('Container updated, refreshing tables...');
    
    // Force immediate refresh
    setTimeout(async () => {
      try {
        // Switch to containers view if not already there
        if (currentStatusView !== 'containers') {
          console.log('Switching to containers view...');
          switchStatusView('containers');
        }
        
        // Force refresh with multiple attempts
        console.log('Refreshing container tables...');
        await refreshContainerTables();
        
        // Additional direct refresh call
        setTimeout(async () => {
          console.log('Second refresh attempt...');
          await loadContainerStatus();
        }, 200);
        
      } catch (error) {
        console.error('Error during refresh:', error);
      }
    }, 100);
    
  } catch (error) {
    console.error('Error updating container status:', error);
    showError('Failed to update container status: ' + error.message, 'Error');
  }
}

// View vehicle details
function viewVehicleDetails(vehicleId) {
  console.log(`Viewing vehicle details: ${vehicleId}`);
  // Implementation for viewing vehicle details
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

// Refresh container tables function
async function refreshContainerTables() {
  console.log('Starting container table refresh...');
  try {
    // Refresh Status tab container table
    console.log('Loading container status...');
    await loadContainerStatus();
    console.log('Container status loaded successfully');
    
    // Also refresh Vehicle Registry container table if it exists
    if (typeof loadContainerDataForRegistry === 'function') {
      console.log('Loading container data for registry...');
      loadContainerDataForRegistry();
      console.log('Container data for registry loaded successfully');
    }
    
    console.log('Container tables refreshed successfully');
  } catch (error) {
    console.error('Error refreshing container tables:', error);
    // Try to at least refresh the main container table
    try {
      console.log('Attempting fallback refresh...');
      await loadContainerStatus();
      console.log('Fallback refresh successful');
    } catch (fallbackError) {
      console.error('Fallback refresh also failed:', fallbackError);
    }
  }
}

// Delete container function for Status tab
async function deleteContainerFromStatus(containerId) {
  if (!window.authSystem || !window.authSystem.isAdmin()) {
    showError('Access denied. Admin privileges required.', 'Authentication Error');
    return;
  }

  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    showError('Database connection not available', 'Error');
    return;
  }

  try {
    // Delete container from database
    const { error } = await supabaseClient
      .from('containers')
      .delete()
      .eq('id', containerId);
    
    if (error) throw error;
    
    showSuccess('Container deleted successfully!');
    
    // Refresh the container tables
    setTimeout(() => refreshContainerTables(), 100);
    
  } catch (error) {
    console.error('Error deleting container:', error);
    showError('Failed to delete container: ' + error.message, 'Error');
  }
}

// Export functions for use in main.js
window.statusModule = {
  initializeStatus,
  loadStatusData,
  switchStatusView,
  loadVehicleStatus,
  loadTrailerStatus,
  loadContainerStatus,
  loadVehicleStatusSummary,
  viewVehicleDetails,
  viewTrailerDetails,
  viewContainerDetails,
  deleteContainerFromStatus,
  refreshContainerTables
};
