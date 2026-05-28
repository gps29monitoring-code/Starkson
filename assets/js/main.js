// ====================== Click-to-Expand Text Functionality ==========================
function initializeExpandableText() {

// Find all table cells that might need expandable text, but exclude Actions column

const tableCells = document.querySelectorAll('table td:not(.vehicle-actions-cell), .details table td, .recentVehicles table td, #truck-images-table tbody tr td');

tableCells.forEach(cell => {

// Skip cells that contain buttons or action elements

if (cell.querySelector('button, [role="button"], .vehicle-registry-action-btn') ||

cell.classList.contains('vehicle-actions-cell')) {

return;
}
const text = cell.textContent.trim();
// Only apply to cells with text longer than 20 characters
if (text.length > 20) {
// Check if text is already truncated by CSS
const tempSpan = document.createElement('span');
tempSpan.style.whiteSpace = 'nowrap';
tempSpan.style.overflow = 'hidden';
tempSpan.style.textOverflow = 'ellipsis';
tempSpan.textContent = text;
tempSpan.style.maxWidth = cell.offsetWidth + 'px';
// Create expandable wrapper
const expandableDiv = document.createElement('div');
expandableDiv.className = 'text-expandable';
expandableDiv.textContent = text;
// Clear cell and add expandable text
cell.innerHTML = '';
cell.appendChild(expandableDiv);
// Add click event
expandableDiv.addEventListener('click', function(e) {
e.stopPropagation();
this.classList.toggle('expanded');
// Close other expanded texts in the same row
const row = this.closest('tr');
if (row) {
const otherExpanded = row.querySelectorAll('.text-expandable.expanded');
otherExpanded.forEach(other => {
if (other !== this) {
other.classList.remove('expanded');
}
});
}
});
}
});
}
// Auto-hide expanded text when clicking outside
function handleExpandableTextClickOutside(e) {

if (!e.target.closest('.text-expandable')) {

const expandedTexts = document.querySelectorAll('.text-expandable.expanded');

expandedTexts.forEach(text => {

text.classList.remove('expanded');

});
}
}
// ====================== Global Functions ==========================
// Toggle tool status - Global function for onclick handlers
async function toggleToolStatus(toolType, plateNo, currentValue, button) {
try {
// Check if user is admin before allowing toggle
if (!window.authSystem || !window.authSystem.isAdmin()) {
console.warn('Only admin users can change tool status');
showWarning('Only admin users can change tool status. Please login as admin.', 'Access Denied');
return;
}
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
const newValue = !currentValue;
// Update in database
const { error } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('vehicle_tools')
.update({ [toolType]: newValue })
.eq('plate_no', plateNo);
});
if (error) throw error;
// Update UI instantly
if (button) {
button.classList.toggle('available', newValue);
button.classList.toggle('not-available', !newValue);
button.textContent = newValue ? '✓' : '✗';
button.setAttribute('onclick', `toggleToolStatus('${toolType}', '${plateNo}', ${newValue}, this)`);
}
} catch (error) {
console.error('Error updating tool status:', error);
// Handle silently - just log to console as requested
}
}
// Initialize expandable text when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
// Initialize expandable text after tables are loaded
setTimeout(initializeExpandableText, 1000);
// Re-initialize when data is loaded
const observer = new MutationObserver(function(mutations) {
mutations.forEach(function(mutation) {
if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
const hasTables = Array.from(mutation.addedNodes).some(node =>
node.nodeType === 1 && (node.tagName === 'TABLE' || node.querySelector('table'))
);
if (hasTables) {
setTimeout(initializeExpandableText, 500);
}
}
});
});
observer.observe(document.body, {
childList: true,
subtree: true
});
// Handle clicks outside expanded text
document.addEventListener('click', handleExpandableTextClickOutside);
});
// Re-initialize expandable text after data loading
function reinitializeExpandableText() {

setTimeout(initializeExpandableText, 500);
}
// ================== Custom Notification System ==================
class NotificationSystem {
constructor() {
this.container = document.getElementById('notification-container');
this.notificationId = 0;
}
show(options) {
const {
type = 'info',
title = 'Notification',
message = '',
actions = null,
autoHide = true,
duration = 5000
} = options;
const id = ++this.notificationId;
const notification = this.createNotification(id, type, title, message, actions);
this.container.appendChild(notification);
// Auto-hide functionality
if (autoHide && !actions) {
notification.classList.add('auto-hide');
setTimeout(() => {
this.hide(id);
}, duration);
}
return id;
}
hide(id) {
const notification = document.getElementById(`notification-${id}`);
if (notification) {
notification.classList.add('slide-out');
setTimeout(() => {
notification.remove();
}, 300);
}
}
createNotification(id, type, title, message, actions) {
const notification = document.createElement('div');
notification.id = `notification-${id}`;
notification.className = 'notification';
const iconMap = {
info: 'information-circle-outline',
success: 'checkmark-circle-outline',
warning: 'warning-outline',
error: 'close-circle-outline'
};
notification.innerHTML = `
<div class="notification-header">
<div class="notification-icon ${type}">
<ion-icon name="${iconMap[type]}"></ion-icon>
</div>
<h3 class="notification-title">${title}</h3>
</div>
<div class="notification-body">
<p class="notification-message">${message}</p>
${actions ? this.createActions(actions, id) : ''}
</div>
`;
return notification;
}
createActions(actions, notificationId) {
const actionButtons = actions.map((action, index) => {
const btnClass = action.primary ? 'notification-btn-primary' : 'notification-btn-secondary';
const positionStyle = action.primary ? 'order: 1;' : 'order: 2;';
return `
<button class="notification-btn ${btnClass}"
style="${positionStyle}"
onclick="notificationSystem.handleAction(${notificationId}, '${action.callback}')">
${action.text}
</button>
`;
}).join('');
return `<div class="notification-actions">${actionButtons}</div>`;
}
handleAction(notificationId, callbackName) {
this.hide(notificationId);
// Execute the callback if it exists
if (typeof window[callbackName] === 'function') {
window[callbackName]();
}
}
}
// Create global notification system instance
const notificationSystem = new NotificationSystem();
// Convenience functions for different notification types
function showInfo(message, title = 'Info', options = {}) {

return notificationSystem.show({ type: 'info', title, message, ...options });
}
function showSuccess(message, title = 'Success', options = {}) {

return notificationSystem.show({ type: 'success', title, message, ...options });
}
function showWarning(message, title = 'Warning', options = {}) {

return notificationSystem.show({ type: 'warning', title, message, ...options });
}
function showError(message, title = 'Error', options = {}) {

return notificationSystem.show({ type: 'error', title, message, ...options });
}
// Show Confirmation Dialog
function showConfirmation(message, title = 'Confirm Delete', onConfirm = null, onCancel = null) {

return notificationSystem.show({

type: 'warning',

title,

message,

actions: [

{

text: 'Delete',

primary: true,

class: 'btn-danger',

onclick: () => {

notificationSystem.hide();

if (onConfirm) onConfirm();
}
},
{
text: 'Cancel',
primary: false,
class: 'btn-secondary',
onclick: () => {
notificationSystem.hide();
if (onCancel) onCancel();
}
}
]
});
}
// Confirmation dialog replacement
function showConfirm(message, title = 'Confirm', onConfirm = null, onCancel = null) {

return notificationSystem.show({

type: 'warning',

title,

message,

autoHide: false,

actions: [

{

text: 'Cancel',

primary: false,

callback: onCancel || 'confirmCancel'

},

{

text: 'OK',

primary: true,

callback: onConfirm || 'confirmOk'
}
]
});
}
// Global callback handlers for confirm dialogs
window.confirmOk = function() {
// This will be overridden by specific confirm dialogs
};
window.confirmCancel = function() {
// This will be overridden by specific confirm dialogs
};
// ============ Supabase Setup ============
let supabaseClient = null;
function initSupabase() {

if (!window.getSupabaseClient) {

console.error('Supabase client singleton not loaded');

return;
}
supabaseClient = window.getSupabaseClient();
}
// Function to set session token for database operations
async function setSessionTokenForDB() {
if (window.authSystem && window.authSystem.sessionToken && supabaseClient) {
try {
await supabaseClient.rpc('set_app_setting', {
setting_name: 'current_session_token',
setting_value: window.authSystem.sessionToken
});
} catch (error) {
console.error('Error setting session token:', error);
}
}
}
// Wrapper function for Supabase operations with auth
async function supabaseWithAuth(operation) {
await setSessionTokenForDB();
return operation();
}
if (typeof window !== 'undefined') {
window.mainModule = window.mainModule || {};
window.mainModule.supabaseWithAuth = supabaseWithAuth;
}
// ================== Global Plant State Management ==================
class PlantStateManager {
constructor() {
this.selectedPlant = this.loadSelectedPlant();
this.listeners = [];
this.availablePlants = ['DISNEY 3', 'DISNEY 6', 'HASBRO', 'WARNER'];
}
// Load selected plant from localStorage - DISABLED for default "All Plants"
loadSelectedPlant() {
// Always return null to show all plants by default
return null;
}
// Save selected plant to localStorage - DISABLED
saveSelectedPlant(plant) {
// Do not persist to localStorage - always start with "All Plants"
}
// Get current selected plant
getSelectedPlant() {
return this.selectedPlant;
}
// Set selected plant and notify listeners
setSelectedPlant(plant) {
if (this.selectedPlant !== plant) {
this.selectedPlant = plant;
this.saveSelectedPlant(plant);
this.notifyListeners(plant);
}
}
// Subscribe to plant changes
subscribe(listener) {
this.listeners.push(listener);
return () => {
this.listeners = this.listeners.filter(l => l !== listener);
};
}
// Notify all listeners of plant change
notifyListeners(plant) {
this.listeners.forEach(listener => listener(plant));
}
// Get all available plants
getAvailablePlants() {
return this.availablePlants;
}
// Get plant display name
getPlantDisplayName(plant) {
const displayNames = {
'DISNEY 3': 'Disney 3',
'DISNEY 6': 'Disney 6',
'HASBRO': 'Hasbro',
'WARNER': 'Warner'
};
return displayNames[plant] || plant;
}
// Get plant location
getPlantLocation(plant) {
const locations = {
'DISNEY 3': 'Cavite',
'DISNEY 6': 'Cavite',
'HASBRO': 'Manila',
'WARNER': 'Cebu'
};
return locations[plant] || 'Unknown';
}
}
// Create global plant state manager instance
const plantStateManager = new PlantStateManager();
// Update selectedPlantFilter when plant changes
plantStateManager.subscribe((newPlant) => {
selectedPlantFilter = newPlant;
// Reload all data for new plant
if (supabaseClient) {
loadVehicles(newPlant);
loadRepairs();
loadTruckImages(newPlant, selectedTruckImagesType);
loadVehicleStatus();
}
});
// ============ Navigation ============
let viewLinks = null;
function setActiveLink(selectedLink) {

if (!viewLinks) {

viewLinks = document.querySelectorAll('.navigation a.nav-link');
}
viewLinks.forEach(link => {
const parentLi = link.closest('li');
if (parentLi) parentLi.classList.toggle('active', link === selectedLink);
});
}
function showView(viewName) {

// Hide all content views

const contentViews = document.querySelectorAll('.content-view');

contentViews.forEach(view => view.classList.remove('active'));

// Show selected content view

const selectedView = document.getElementById(`${viewName}-view`);

if (selectedView) {

selectedView.classList.add('active');
}
if (viewName !== 'rfid' && window.rfidModule && typeof window.rfidModule.closeEditModal === 'function') {
window.rfidModule.closeEditModal();
}
// Update active navigation link
const viewLinks = document.querySelectorAll('.navigation a.nav-link');
const target = Array.from(viewLinks).find(link => link.dataset.view === viewName);
if (target) setActiveLink(target);
// Reset search bar when switching tabs
const searchInput = document.getElementById('universal-search');
if (searchInput) {
searchInput.value = '';
performUniversalSearch('');
}
// Reset to show all plants whenever user changes tabs/views
selectedPlantFilter = null;
plantStateManager.setSelectedPlant(null);
// Reset all tab-specific plant filters
truckPlantFilter = null;
trailerPlantFilter = null;
containerPlantFilter = null;
gpsPlantFilter = null;
// Clear any existing localStorage entries for plant filters
localStorage.removeItem('selectedPlant');
localStorage.removeItem('selectedPlantFilter');
// Update UI to show all plants
const cards = document.querySelectorAll('.plant-card');
// Handle search bar visibility for About Us page
if (viewName === 'about') {
document.body.classList.add('about-view-active');
} else {
document.body.classList.remove('about-view-active');
}
cards.forEach(card => card.classList.remove('active'));
// Update Show All Plants button states
updateShowAllButtonsState();
// Keep tables in sync with latest saved data whenever user switches tabs.
if (supabaseClient) {
// Get the active filter button for the current view to determine tab type
const viewElement = document.getElementById(`${viewName}-view`);
let currentFilterType = 'truck'; // Default to truck
if (viewElement) {
  const activeFilterBtn = viewElement.querySelector('.registry-filter-btn.active');
  if (activeFilterBtn) {
    currentFilterType = activeFilterBtn.dataset.filter;
  }
}
// Update plant counts for the current view with tab type
loadPlantCounts(viewName, currentFilterType);
// Initialize dashboard module if dashboard view
if (viewName === 'dashboard') {
if (window.dashboardModule && typeof window.dashboardModule.initializeDashboard === 'function') {
window.dashboardModule.initializeDashboard();
}
}
// Initialize registry module if registry view
if (viewName === 'registry') {
if (window.registryModule && typeof window.registryModule.initializeRegistry === 'function') {
}
}
// Reset Vehicle Repair Report to Truck tab when entering status view
if (viewName === 'status') {
// Reset to Truck tab by default
const truckBtn = document.getElementById('repair-truck-btn');
const trailerBtn = document.getElementById('repair-trailer-btn');
const containerBtn = document.getElementById('repair-container-btn');

if (truckBtn && trailerBtn && containerBtn) {
// Reset button styles
truckBtn.style.background = 'linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%)';
trailerBtn.style.background = 'linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%)';
containerBtn.style.background = 'linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%)';

// Show truck data by default
filterRepairTable('truck');
}
}
// Initialize RFID module if rfid view
if (viewName === 'rfid') {
if (window.rfidModule && typeof window.rfidModule.initializeRfid === 'function') {
window.rfidModule.initializeRfid();
}
}
if (viewName === 'registry' || viewName === 'status') {
loadVehicles(null); // Load all vehicles (no plant filter)
}
if (viewName === 'status') {
// Load vehicle status first, then switch to truck view
loadVehicleStatus().then(() => {
// Initialize status module
if (window.statusModule && typeof window.statusModule.initializeStatus === 'function') {
window.statusModule.initializeStatus();
}
// Hide + Trailer and + Container buttons when navigating to Status
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
// Reset to Truck as default active state when entering status tab
const truckBtn = document.getElementById('truck-table-btn');
const trailerBtn = document.getElementById('trailer-table-btn');
const containerBtn = document.getElementById('container-table-btn');
const crBtn = document.getElementById('cr-table-btn');
const orBtn = document.getElementById('or-table-btn');
if (truckBtn) truckBtn.classList.add('active');
if (trailerBtn) trailerBtn.classList.remove('active');
if (containerBtn) containerBtn.classList.remove('active');
if (crBtn) crBtn.classList.remove('active');
if (orBtn) orBtn.classList.remove('active');
// Filter out trailers from vehicleStatusRecords before displaying
vehicleStatusRecords = vehicleStatusRecords.filter(vehicle => {
const vehicleType = (vehicle.vehicle_type || '').toLowerCase().trim();
const size = (vehicle.size || '').toLowerCase().trim();
return !vehicleType.includes('trailer') && !size.includes('trailer');
});
// Now switch to truck table after data is loaded and filtered
switchTable('truck');
}).catch(err => {
console.error('Error loading vehicle status:', err);
// Still try to switch to truck view even if loading fails
switchTable('truck');
});
}
if (viewName === 'trucks') {
loadTruckImages(null); // Load all truck images (no plant filter)
// Initialize trucks module
if (window.trucksModule && typeof window.trucksModule.initializeTrucks === 'function') {
window.trucksModule.initializeTrucks();
}
// Hide + Trailer and + Container buttons when navigating to Trucks
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
// Reset to Truck as default active state when entering trucks tab
setTimeout(() => {
// Reset Truck button to active state and show Truck table using proper styling function
selectedTruckImagesType = 'truck';
updateTruckImagesButtonStyles('truck');
}, 100);
}
if (viewName === 'repair') {
// Load data first, then apply filter
Promise.all([loadRepairs(), loadVehicleStatus()]).then(() => {
    // Initialize repair module
    if (window.repairModule && typeof window.repairModule.initializeRepair === 'function') {
        window.repairModule.initializeRepair();
    }
    // Reset repair buttons to Truck as default after data is loaded
    setRepairFilter('truck');
    // Hide + Trailer and + Container buttons when navigating to Repair
    const addTrailerBtn = document.getElementById('add-trailer-btn');
    const addContainerBtn = document.getElementById('add-container-btn');
    if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
    if (addContainerBtn) addContainerBtn.classList.add('hidden');
}).catch(err => {
    console.error('Error loading repair data:', err);
    // Still apply filter even if data loading fails
    setRepairFilter('truck');
});
}
if (viewName === 'client') {
loadClientData();
// Initialize client module
if (window.clientModule && typeof window.clientModule.initializeClient === 'function') {
window.clientModule.initializeClient();
}
// Hide + Trailer and + Container buttons when navigating to Client
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
}
if (viewName === 'diesel') {
loadDieselData();
// Initialize diesel module
if (window.dieselModule && typeof window.dieselModule.initializeDiesel === 'function') {
window.dieselModule.initializeDiesel();
}
// Hide + Trailer and + Container buttons when navigating to Diesel
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
// Always reset to Min as default active state when entering diesel tab
setTimeout(() => {
// Reset Min button to active state and show Min table
const minBtn = document.getElementById('diesel-min-btn');
const aveBtn = document.getElementById('diesel-ave-btn');
if (minBtn) minBtn.classList.add('active');
if (aveBtn) aveBtn.classList.remove('active');
switchDieselTable('min');
}, 100);
}
}
// Trigger search for the newly active tab (will be empty now)
if (searchInput) {
performUniversalSearch(searchInput.value.trim());
}
// Hide + Trailer and + Container buttons when switching to any view (always hide by default)
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded', function() {
// Menu toggle
const toggle = document.querySelector('.toggle');
const navigation = document.querySelector('.navigation');
const main = document.querySelector('.main');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');

if (toggle) {
toggle.addEventListener('click', function() {
// Check if we're on mobile (screen width <= 768px)
if (window.innerWidth <= 768) {
// Mobile navigation toggle
navigation.classList.toggle('mobile-active');
main.classList.toggle('mobile-nav-open');
if (mobileNavOverlay) {
mobileNavOverlay.classList.toggle('active');
}
} else {
// Desktop navigation toggle (collapse sidebar)
navigation.classList.toggle('active');
main.classList.toggle('active');
}
});
}

// Mobile overlay click to close navigation
if (mobileNavOverlay) {
mobileNavOverlay.addEventListener('click', function() {
navigation.classList.remove('mobile-active');
main.classList.remove('mobile-nav-open');
mobileNavOverlay.classList.remove('active');
});
}

// Handle window resize to reset navigation states and ensure adaptive widths
window.addEventListener('resize', function() {
const navigation = document.querySelector('.navigation');
const main = document.querySelector('.main');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');

// When switching from mobile to desktop
if (window.innerWidth > 768) {
// Remove mobile-specific classes
if (navigation) navigation.classList.remove('mobile-active');
if (main) main.classList.remove('mobile-nav-open');
if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');

// CSS will automatically handle adaptive widths based on media queries
// No need to manually set widths in JavaScript
}
// When switching from desktop to mobile
else {
// Remove desktop-specific classes
if (navigation) navigation.classList.remove('active');
if (main) main.classList.remove('active');
}
});
// Active link hover + selected
const navItems = document.querySelectorAll('.navigation li');
navItems.forEach(item => {
item.addEventListener('mouseover', function() {
navItems.forEach(i => i.classList.remove('hovered'));
this.classList.add('hovered');
});
item.addEventListener('mouseleave', function() {
this.classList.remove('hovered');
});
});
viewLinks = document.querySelectorAll('.navigation a.nav-link');
viewLinks.forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
const viewName = link.dataset.view;
showView(viewName);
// Auto-close navigation on mobile after clicking a link
const navigation = document.querySelector('.navigation');
const main = document.querySelector('.main');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');
// Check if we're on mobile (screen width <= 768px)
if (window.innerWidth <= 768) {
if (navigation && main) {
navigation.classList.remove('mobile-active');
main.classList.remove('mobile-nav-open');
if (mobileNavOverlay) {
mobileNavOverlay.classList.remove('active');
}
}
} else {
// Desktop: check if navigation is collapsed
if (navigation && main && navigation.classList.contains('active')) {
navigation.classList.remove('active');
main.classList.remove('active');
}
}
});
});
// Initialize Show All Plants buttons with proper event listeners
initializeShowAllButtons();
// Clear any existing localStorage entries for plant filters to ensure fresh start
localStorage.removeItem('selectedPlant');
localStorage.removeItem('selectedPlantFilter');
// Load saved filter state from localStorage (now always defaults to "All Plants")
loadSavedFilterState();
// plant card click filter - ensure event listeners are only attached once
const plantCards = document.querySelectorAll('.plant-card');
plantCards.forEach(card => {
// Remove any existing click listeners by cloning
const newCard = card.cloneNode(true);
card.parentNode.replaceChild(newCard, card);
});
// Re-select the cloned cards and add fresh event listeners
const freshPlantCards = document.querySelectorAll('.plant-card');
freshPlantCards.forEach(card => {
card.style.cursor = 'pointer';
card.addEventListener('click', function(e) {
e.preventDefault();
e.stopPropagation();
const plant = this.dataset.plant;
if (plant) {
applyPlantFilter(plant);
}
});
});
// Back to status button event listener
const backToStatusBtn = document.getElementById('backToStatusBtn');
if (backToStatusBtn) {
backToStatusBtn.addEventListener('click', backToStatus);
}
// Go to Top button functionality
const goToTopBtn = document.getElementById('goToTopBtn');
// Show/hide button based on scroll position
window.addEventListener('scroll', function() {
if (goToTopBtn) {
if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
goToTopBtn.style.display = 'flex';
} else {
goToTopBtn.style.display = 'none';
}
}
});
// Scroll to top when button is clicked
if (goToTopBtn) {
goToTopBtn.addEventListener('click', function() {
window.scrollTo({
top: 0,
behavior: 'smooth'
});
});
}
// No default plant selection - All Plants by default
// default view
showView('dashboard');
// Initialize Supabase and load vehicles
initSupabase();
// Wait for auth system to initialize, then update UI and load data
setTimeout(() => {
if (window.authSystem) {
// Update UI based on auth status
window.authSystem.updateAuthUI();
// Load data if Supabase is ready
if (supabaseClient) {
loadVehicles();
loadVehicleStatus(); // Load vehicle status on page load
loadGpsData(); // Load GPS data on page load
loadPlantCounts('dashboard'); // Load plant counts on page load
// Load plate options after Supabase is ready
setTimeout(() => {
loadPlateOptions();
loadRepairs();
loadTruckImages(selectedPlantFilter);
// Update container and trailer count badges from correct database tables
updateContainerTrailerCounts();
}, 1000);
// Reload GPS data after auth system is fully initialized to ensure Actions column shows correctly
setTimeout(() => {
loadGpsData();
}, 1500);
}
} else {
// Fallback if auth system is not ready
if (supabaseClient) {
loadVehicles();
loadVehicleStatus();
loadGpsData();
loadPlantCounts('dashboard'); // Load plant counts on page load
setTimeout(() => {
loadPlateOptions();
loadRepairs();
loadTruckImages(selectedPlantFilter);
}, 1000);
}
}
}, 100);
});
// ============ Plant Count Functions ============
async function loadPlantCounts(view = 'dashboard', tabType = 'truck') {
  if (!supabaseClient) {
    console.error('Supabase not initialized');
    return;
  }
  try {
    let plantCounts = {};
    
    // Count based on current view and tab type from database
    switch(view) {
      case 'dashboard':
        // Count vehicles from vehicle_registry based on tab type
        if (tabType === 'truck') {
          const { data: vehicles, error: vehiclesError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('vehicle_registry').select('plant');
          });
          if (!vehiclesError && vehicles) {
            vehicles.forEach(vehicle => {
              const plant = vehicle.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        }
        break;
        
      case 'status':
        // Count based on tab type
        if (tabType === 'truck') {
          const { data: statusVehicles, error: statusError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('vehicle_registry').select('plant');
          });
          if (!statusError && statusVehicles) {
            statusVehicles.forEach(vehicle => {
              const plant = vehicle.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'trailer') {
          const { data: trailers, error: trailersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('trailer_registry').select('location_plant');
          });
          if (!trailersError && trailers) {
            trailers.forEach(trailer => {
              const plant = trailer.location_plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'container') {
          const { data: containers, error: containersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('containers').select('plant');
          });
          if (!containersError && containers) {
            containers.forEach(container => {
              const plant = container.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        }
        break;
        
      case 'repair':
        // Count based on tab type
        if (tabType === 'truck') {
          const { data: repairVehicles, error: repairError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('vehicle_registry').select('plant');
          });
          if (!repairError && repairVehicles) {
            repairVehicles.forEach(vehicle => {
              const plant = vehicle.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'trailer') {
          const { data: repairTrailers, error: repairTrailersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('trailer_registry').select('location_plant');
          });
          if (!repairTrailersError && repairTrailers) {
            repairTrailers.forEach(trailer => {
              const plant = trailer.location_plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'container') {
          const { data: repairContainers, error: repairContainersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('containers').select('plant');
          });
          if (!repairContainersError && repairContainers) {
            repairContainers.forEach(container => {
              const plant = container.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        }
        break;
        
      case 'registry':
        // Count based on tab type
        if (tabType === 'truck') {
          const { data: regVehicles, error: regVehiclesError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('vehicle_registry').select('plant');
          });
          if (!regVehiclesError && regVehicles) {
            regVehicles.forEach(vehicle => {
              const plant = vehicle.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'trailer') {
          const { data: regTrailers, error: regTrailersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('trailer_registry').select('location_plant');
          });
          if (!regTrailersError && regTrailers) {
            regTrailers.forEach(trailer => {
              const plant = trailer.location_plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'container') {
          const { data: containers, error: containersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('containers').select('plant');
          });
          if (!containersError && containers) {
            containers.forEach(container => {
              const plant = container.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        }
        break;
        
      case 'trucks':
        // Count based on tab type
        if (tabType === 'truck') {
          const { data: truckVehicles, error: truckVehiclesError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('vehicle_registry').select('plant');
          });
          if (!truckVehiclesError && truckVehicles) {
            truckVehicles.forEach(vehicle => {
              const plant = vehicle.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'trailer') {
          const { data: truckTrailers, error: truckTrailersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('trailer_registry').select('location_plant');
          });
          if (!truckTrailersError && truckTrailers) {
            truckTrailers.forEach(trailer => {
              const plant = trailer.location_plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        } else if (tabType === 'container') {
          const { data: truckContainers, error: truckContainersError } = await supabaseWithAuth(async () => {
            return supabaseClient.from('containers').select('plant');
          });
          if (!truckContainersError && truckContainers) {
            truckContainers.forEach(container => {
              const plant = container.plant || 'UNASSIGNED';
              plantCounts[plant] = (plantCounts[plant] || 0) + 1;
            });
          }
        }
        break;
        
      default:
        // Default to vehicle_registry count
        const { data: defaultVehicles, error: defaultError } = await supabaseWithAuth(async () => {
          return supabaseClient.from('vehicle_registry').select('plant');
        });
        if (!defaultError && defaultVehicles) {
          defaultVehicles.forEach(vehicle => {
            const plant = vehicle.plant || 'UNASSIGNED';
            plantCounts[plant] = (plantCounts[plant] || 0) + 1;
          });
        }
    }
    
    // Update plant-count elements
    const plantCards = document.querySelectorAll('.plant-card');
    plantCards.forEach(card => {
      const plant = card.dataset.plant;
      const countElement = card.querySelector('.plant-count');
      if (countElement && plant) {
        countElement.textContent = (plantCounts[plant] || 0) + ' unit';
      }
    });
    
  } catch (error) {
    console.error('Error loading plant counts:', error);
  }
}

// ============ Vehicle Functions ============
async function loadVehicles(plantFilter = selectedPlantFilter) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
return await supabaseWithAuth(async () => {
// Load from vehicle_registry table first (contains detailed data for CR)
let registryQuery = supabaseClient
.from('vehicle_registry')
.select('*')
.order('plate', { ascending: true });
if (plantFilter) {
registryQuery = registryQuery.eq('plant', plantFilter);
}
const { data: registryVehicles, error: registryError } = await registryQuery;
// Also load from trailer_registry table
let trailerQuery = supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
if (plantFilter) {
trailerQuery = trailerQuery.eq('location_plant', plantFilter);
}
const { data: trailerData, error: trailerError } = await trailerQuery;
// Also load from containers table
let containerQuery = supabaseClient
.from('containers')
.select('*')
.order('container', { ascending: true });
if (plantFilter) {
containerQuery = containerQuery.eq('plant', plantFilter);
}
const { data: containerData, error: containerError } = await containerQuery;
if (registryError)
console.warn('vehicle_registry table error, falling back to vehicles table:', registryError);
// Fallback to vehicles table if vehicle_registry doesn't exist or has errors
let query = supabaseClient
.from('vehicles')
.select('*')
.order('plate', { ascending: true });
if (plantFilter)
query = query.eq('plant', plantFilter);
// Check if we're in trailer filter mode
const isTrailerFilter = typeof currentRegistryFilter !== 'undefined' && currentRegistryFilter === 'trailer';
let combinedVehicles = [];
if (isTrailerFilter) {
// When trailer filter is active, only load from trailer_registry table
if (trailerData && !trailerError) {
// Map trailer_registry columns to match vehicle structure with full truck-like fields
combinedVehicles = trailerData.map(trailer => ({
id: trailer.id,
plate: trailer.plate_no,
chassi_no: trailer.chassis_no,
mv_file: trailer.mv_file_no || 'N/A',
year_model: trailer.year_model || 'N/A',
owner_name: trailer.owner_name || 'N/A',
container: trailer.container || 'N/A',
trailer_issue: trailer.trailer_issue || 'N/A',
status: trailer.status || 'Active',
vehicle_type: 'Trailer',
size: 'Trailer',
plant: trailer.location_plant || 'UNASSIGNED',
created_at: trailer.created_at
}));
} else if (trailerError) {
console.warn('Error loading trailer_registry:', trailerError);
combinedVehicles = [];
}
} else {
// Normal mode: load from vehicle_registry/vehicles tables
if (registryError) {
console.warn('vehicle_registry table error, falling back to vehicles table:', registryError);
// Fallback to vehicles table if vehicle_registry doesn't exist or has errors
let query = supabaseClient
.from('vehicles')
.select('*')
.order('plate', { ascending: true });
if (plantFilter) {
query = query.eq('plant', plantFilter);
}
const { data: vehicles, error } = await query;
if (error) throw error;
combinedVehicles = vehicles || [];
} else {
combinedVehicles = registryVehicles || [];
}
}
// Container data is handled separately in the container filter and should not be mixed with truck data
// Commented out to prevent container data from appearing in truck table
/*
if (containerData && !containerError) {
const containerVehicles = containerData.map(container => ({
id: container.id,
plate: container.container,
chassi_no: container.chassi_no,
container: container.container,
color: container.color,
size: container.size,
status: container.status,
container_issue: container.container_issue,
vehicle_type: 'container',
plant: 'UNASSIGNED', // Containers don't have plant assignment
created_at: container.created_at
}));
combinedVehicles = [...combinedVehicles, ...containerVehicles];
} else if (containerError) {
console.warn('Error loading containers:', containerError);
}
*/
allVehicles = combinedVehicles;
// Check for trailer data specifically
const trailerVehicles = allVehicles.filter(v => {
const vehicleType = (v.vehicle_type || '').toLowerCase();
const size = (v.size || '').toLowerCase();
return vehicleType.includes('trailer') || size.includes('trailer');
});
const filterToUse = typeof currentRegistryFilter !== 'undefined' ? currentRegistryFilter : null;
displayVehicles(allVehicles, plantFilter, filterToUse);
// Also update vehicle status display if we're on the status tab
if (document.getElementById('status-view').classList.contains('active')) {
displayVehicleStatus(vehicleStatusRecords);
}
// Update plate options for truck form
setTimeout(() => loadPlateOptions(), 100);
});
} catch (err) {
console.error('Error loading vehicles:', err);
// Backward compatibility: if the `plant` column doesn't exist, reload
// without plant filtering so Status + Registry still display data.
if (
plantFilter &&
err &&
err.message &&
err.message.toLowerCase().includes('plant')
) {
console.warn('Plant column may not exist, retrying without plant filter');
try {
return await supabaseWithAuth(async () => {
// Try vehicle_registry first
let { data: vehicles, error: retryError } = await supabaseClient
.from('vehicle_registry')
.select('*')
.order('plate', { ascending: true });
if (retryError) {
// Fallback to vehicles table
const fallback = await supabaseClient
.from('vehicles')
.select('*')
.order('plate', { ascending: true });
if (!fallback.error) {
vehicles = fallback.data;
retryError = null;
}
}
if (retryError) throw retryError;
allVehicles = vehicles || [];
displayVehicles(allVehicles, null);
});
} catch (retryErr) {
console.error('Retry loading vehicles without plant filter failed:', retryErr);
}
}
}
}
let editingVehiclePlate = null;
let allVehicles = [];
let selectedPlantFilter = null; // Default to All Plants
// Separate plant filters for each tab type
let truckPlantFilter = null; // Truck tab plant filter
let trailerPlantFilter = null; // Trailer tab plant filter
let containerPlantFilter = null; // Container tab plant filter
let gpsPlantFilter = null; // GPS tab plant filter
let currentRegistryFilter = 'truck'; // Default registry filter
let currentStatusFilter = 'truck'; // Default status filter
// Legacy function for backward compatibility
clearPlantFilter = showAllPlants;
// Unified Show All Plants function with proper error handling and logging
let showAllPlantsTimeout = null;
function showAllPlants() {

try {

// Clear any pending show all operations

if (showAllPlantsTimeout) {

clearTimeout(showAllPlantsTimeout);
}
// Debounce the show all operation
showAllPlantsTimeout = setTimeout(() => {
// Log user action for AI/chat tracking
logUserAction('show_all_plants', { timestamp: new Date().toISOString() });
// Clear all tab-specific filters
truckPlantFilter = null;
trailerPlantFilter = null;
containerPlantFilter = null;
// Clear filter using plant state manager
selectedPlantFilter = null;
plantStateManager.setSelectedPlant(null);
// Clear any existing localStorage entries for plant filters
localStorage.removeItem('selectedPlant');
localStorage.removeItem('selectedPlantFilter');
// Update UI
const cards = document.querySelectorAll('.plant-card');
cards.forEach(card => card.classList.remove('active'));
// Reload all data without plant filter
loadVehicles(null);
loadTruckImages(null, selectedTruckImagesType);
// Update plant counts for current view with tab type
const activeViewShowAll = document.querySelector('.content-view.active');
if (activeViewShowAll) {
  const viewNameShowAll = activeViewShowAll.id.replace('-view', '');
  // Get the active filter button for the current view to determine tab type
  const activeFilterBtnShowAll = activeViewShowAll.querySelector('.registry-filter-btn.active');
  let currentFilterTypeShowAll = 'truck'; // Default to truck
  if (activeFilterBtnShowAll) {
    currentFilterTypeShowAll = activeFilterBtnShowAll.dataset.filter;
  }
  loadPlantCounts(viewNameShowAll, currentFilterTypeShowAll);
}
loadRepairs();
loadGpsData();
loadClientData();
loadTrailerData();
loadContainerDataForRegistry(null, window.authSystem && window.authSystem.isAdmin());
loadStatusTrailerData();
loadContainerData();
// Update container and trailer count badges
updateContainerTrailerCounts();
// Reload vehicle status without plant filter and wait for it to complete
loadVehicleStatus().then(() => {
  // Refresh Vehicle Status Summary without plant filter (show all) after vehicle status is loaded
  if (typeof window.statusModule !== 'undefined' && typeof window.statusModule.loadVehicleStatusSummary === 'function') {
    window.statusModule.loadVehicleStatusSummary(null);
  }
}).catch(err => {
  console.error('Error loading vehicle status for summary:', err);
});
// Refresh Repair section tables without plant filter
const repairViewElShowAll = document.getElementById('repair-view');
if (repairViewElShowAll && repairViewElShowAll.classList.contains('active') && typeof setRepairFilter === 'function') {
// Get current repair filter type from active button
const activeRepairBtnShowAll = document.querySelector('#repair-view .registry-filter-btn.active');
const currentFilterShowAll = activeRepairBtnShowAll ? activeRepairBtnShowAll.dataset.filter : 'truck';
setRepairFilter(currentFilterShowAll);
}
const rfidViewElShowAll = document.getElementById('rfid-view');
if (rfidViewElShowAll && rfidViewElShowAll.classList.contains('active') && window.rfidModule && typeof window.rfidModule.loadRfidDashboard === 'function') {
window.rfidModule.loadRfidDashboard();
}
// Update button states
updateShowAllButtonsState();
}, 100); // 100ms debounce
} catch (error) {
console.error('Error in showAllPlants:', error);
// Fallback to basic functionality
selectedPlantFilter = null;
const cards = document.querySelectorAll('.plant-card');
cards.forEach(card => card.classList.remove('active'));
loadVehicles(null);
}
}
// User action logging for AI/chat tracking
function logUserAction(action, data = {}) {

try {

const logEntry = {

action,

data,

userAgent: navigator.userAgent,

url: window.location.href,

timestamp: new Date().toISOString()

};

// Store in localStorage for debugging

const logs = JSON.parse(localStorage.getItem('userActionLogs') || '[]');

logs.push(logEntry);

// Keep only last 100 entries to prevent storage bloat

if (logs.length > 100) {

logs.splice(0, logs.length - 100);
}
localStorage.setItem('userActionLogs', JSON.stringify(logs));
// Optional: Send to analytics endpoint
// sendToAnalytics(logEntry);
} catch (error) {
console.error('Failed to log user action:', error);
}
}
// Update Show All Plants button states
function updateShowAllButtonsState() {

const buttons = document.querySelectorAll('[id^="clear-filter-btn"]');

buttons.forEach(button => {

button.disabled = false;

button.textContent = 'Show All Plants';

button.style.opacity = '1';

button.style.cursor = 'pointer';

});
}
// Initialize Show All Plants buttons with proper event listeners
function initializeShowAllButtons() {

const buttonIds = [

'clear-filter-btn',

'clear-filter-btn-trucks',

'clear-filter-btn-status',

'clear-filter-btn-repair',

'clear-filter-btn-registry',

'clear-filter-btn-gps',

'clear-filter-btn-client',

'clear-filter-btn-diesel',

'clear-filter-btn-rfid'

];

buttonIds.forEach(buttonId => {

const button = document.getElementById(buttonId);

if (button) {

// Remove any existing onclick handlers

button.removeAttribute('onclick');

// Add proper event listener

button.addEventListener('click', function(e) {

e.preventDefault();

e.stopPropagation();

showAllPlants();

});

} else {

console.warn(`Show All Plants button not found: ${buttonId}`);
}
});
}
// Apply plant filter without localStorage persistence
let plantFilterTimeout = null;
function applyPlantFilter(plant) {

try {

// Clear any pending filter operations

if (plantFilterTimeout) {

clearTimeout(plantFilterTimeout);
}
// Debounce the filter operation to prevent rapid clicks (reduced to 50ms for faster response)
plantFilterTimeout = setTimeout(() => {
// Determine which tab is currently active and set the appropriate filter
const activeView = document.querySelector('.content-view.active');
let currentFilterType = 'truck'; // Default to truck

if (activeView) {
  const viewName = activeView.id.replace('-view', '');
  
  // Check if this is the GPS view
  if (viewName === 'gps-status') {
    currentFilterType = 'gps';
  } else {
    // Get the active filter button for the current view
    const activeFilterBtn = activeView.querySelector('.registry-filter-btn.active');
    if (activeFilterBtn) {
      currentFilterType = activeFilterBtn.dataset.filter;
    }
  }
  
  // Set the tab-specific plant filter
  switch(currentFilterType) {
    case 'truck':
      truckPlantFilter = plant;
      break;
    case 'trailer':
      trailerPlantFilter = plant;
      break;
    case 'container':
      containerPlantFilter = plant;
      break;
    case 'gps':
      gpsPlantFilter = plant;
      break;
    default:
      truckPlantFilter = plant;
  }
}

// Update global filter for backward compatibility
selectedPlantFilter = plant;
// IMPORTANT: Also update the plant state manager for status tab
plantStateManager.setSelectedPlant(plant);
// DO NOT save to localStorage - always start with "All Plants"
// Update UI
const cards = document.querySelectorAll('.plant-card');
cards.forEach(card => card.classList.toggle('active', card.dataset.plant === plant));
// Reload data with filter
loadVehicles(plant);
loadTruckImages(plant, selectedTruckImagesType);
// Update plant counts for current view with tab type
if (activeView) {
  const viewName = activeView.id.replace('-view', '');
  // Get the active filter button for the current view to determine tab type
  const activeFilterBtn = activeView.querySelector('.registry-filter-btn.active');
  let currentFilterType = 'truck'; // Default to truck
  if (activeFilterBtn) {
    currentFilterType = activeFilterBtn.dataset.filter;
  }
  loadPlantCounts(viewName, currentFilterType);
}
// Reload vehicle status with new filter and wait for it to complete
loadVehicleStatus().then(() => {
  // Refresh Vehicle Status Summary with plant filter after vehicle status is loaded
  if (typeof window.statusModule !== 'undefined' && typeof window.statusModule.loadVehicleStatusSummary === 'function') {
    window.statusModule.loadVehicleStatusSummary(plant);
  }
}).catch(err => {
  console.error('Error loading vehicle status for summary:', err);
});
loadGpsData(); // Also reload GPS data with new filter
loadRepairs(); // Also reload repair data with new filter
loadClientData(); // Also reload client data with new filter
loadTrailerData(); // Also reload trailer data with new filter
loadContainerDataForRegistry(plant, window.authSystem && window.authSystem.isAdmin()); // Also reload container data with new filter
loadStatusTrailerData(); // Also reload Status section trailer data with new filter
loadContainerData(); // Also reload Status section container data with new filter
// Refresh Repair section tables with new plant filter (always refresh, not just when active)
if (typeof setRepairFilter === 'function') {
// Get current repair filter type from active button
const activeRepairBtn = document.querySelector('#repair-view .registry-filter-btn.active');
const currentFilter = activeRepairBtn ? activeRepairBtn.dataset.filter : 'truck';
setRepairFilter(currentFilter);
}
const rfidViewEl = document.getElementById('rfid-view');
if (rfidViewEl && rfidViewEl.classList.contains('active') && window.rfidModule && typeof window.rfidModule.loadRfidDashboard === 'function') {
window.rfidModule.loadRfidDashboard();
}
// Log user action
logUserAction('apply_plant_filter', { plant, timestamp: new Date().toISOString() });
}, 50); // 50ms debounce for faster response
} catch (error) {
console.error('Error in applyPlantFilter:', error);
}
}
// Load saved filter state - DISABLED for default "All Plants"
function loadSavedFilterState() {

try {

// Always start with "All Plants" - do not load from localStorage

selectedPlantFilter = null;

plantStateManager.setSelectedPlant(null);

// Update UI to reflect default state

updatePlantUI();

} catch (error) {

console.error('Error loading saved filter state:', error);
}
}
async function addVehicle(plate, model, size, year_model, plant) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
return await supabaseWithAuth(async () => {
// Collect all form data
const formData = {
plate: document.getElementById('plate').value.trim(),
model: document.getElementById('model').value.trim(),
size: document.getElementById('size').value.trim(),
year_model: parseInt(document.getElementById('year_model').value),
plant: document.getElementById('plant').value,
// Engine & Vehicle Details
engine_no: document.getElementById('engine_no').value.trim(),
chassi_no: document.getElementById('chassi_no').value.trim(),
classification: document.getElementById('classification').value.trim(),
vehicle_type: document.getElementById('vehicle_type').value.trim(),
color: document.getElementById('color').value.trim(),
aircon_type: document.getElementById('aircon_type').value.trim(),
// Registration Details
cr_no: document.getElementById('cr_no').value.trim(),
cr_registered: document.getElementById('cr_registered').value,
mv_file: document.getElementById('mv_file').value.trim(),
// Technical Specifications
denomination: document.getElementById('denomination').value.trim(),
piston_displacement: document.getElementById('piston_displacement').value.trim(),
no_of_cylinder: parseInt(document.getElementById('no_of_cylinder').value) || null,
fuel: document.getElementById('fuel').value.trim(),
series: document.getElementById('series').value.trim(),
// Body & Dimensions
body_type: document.getElementById('body_type').value.trim(),
body_no: document.getElementById('body_no').value.trim(),
gross_wt: parseFloat(document.getElementById('gross_wt').value) || null,
net_wt: parseFloat(document.getElementById('net_wt').value) || null,
shipping_wt: parseFloat(document.getElementById('shipping_wt').value) || null,
net_capacity: document.getElementById('net_capacity').value.trim(),
length: parseFloat(document.getElementById('length').value) || null,
width: parseFloat(document.getElementById('width').value) || null,
height: parseFloat(document.getElementById('height').value) || null,
volume: parseFloat(document.getElementById('volume').value) || null,
// Owner Information
owner_name: document.getElementById('owner_name').value.trim(),
address: document.getElementById('address').value.trim(),
company: document.getElementById('company').value.trim(),
// Additional Details
no_of_years: parseInt(document.getElementById('no_of_years').value) || null,
pallets_cap: parseInt(document.getElementById('pallets_cap').value) || null,
tire_size_front: document.getElementById('tire_size_front').value.trim(),
tire_size_rear: document.getElementById('tire_size_rear').value.trim(),
total_tire_front: parseInt(document.getElementById('total_tire_front').value) || null,
total_tire_rear: parseInt(document.getElementById('total_tire_rear').value) || null,
autosweep: document.getElementById('autosweep').value.trim(),
easytrip: document.getElementById('easytrip').value.trim(),
gps_type: document.getElementById('gps_type').value.trim(),
remarks: document.getElementById('remarks').value.trim()
};
// Validate required fields
if (!formData.plate || !formData.model || !formData.size || !formData.year_model || !formData.plant) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
// Clean up empty values (convert empty strings to null)
for (const key in formData) {
if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
formData[key] = null;
}
}
if (editingVehiclePlate) {
// Update existing record
const { error } = await supabaseClient
.from('vehicle_registry')
.update(formData)
.eq('plate', editingVehiclePlate);
if (error) throw error;
editingVehiclePlate = null;
} else {
// Check for duplicates before inserting new vehicle
// Check if plate already exists
const { data: existingPlate, error: plateError } = await supabaseClient
.from('vehicle_registry')
.select('plate')
.eq('plate', formData.plate)
.limit(1);

if (plateError) throw plateError;
if (existingPlate && existingPlate.length > 0) {
showError('Vehicle with this Plate No. already exists!', 'Duplicate Error');
return;
}

// Check if chassis_no already exists (if provided)
if (formData.chassi_no) {
const { data: existingChassis, error: chassisError } = await supabaseClient
.from('vehicle_registry')
.select('plate')
.eq('chassi_no', formData.chassi_no)
.limit(1);

if (chassisError) throw chassisError;
if (existingChassis && existingChassis.length > 0) {
showError('Vehicle with this Chassis No. already exists!', 'Duplicate Error');
return;
}
}

// Check if engine_no already exists (if provided)
if (formData.engine_no) {
const { data: existingEngine, error: engineError } = await supabaseClient
.from('vehicle_registry')
.select('plate')
.eq('engine_no', formData.engine_no)
.limit(1);

if (engineError) throw engineError;
if (existingEngine && existingEngine.length > 0) {
showError('Vehicle with this Engine No. already exists!', 'Duplicate Error');
return;
}
}

// Insert new record
const { error } = await supabaseClient
.from('vehicle_registry')
.insert([formData]);
if (error) throw error;
}
// Also update the legacy vehicles table for backward compatibility
const legacyRecord = {
plate: formData.plate,
model: formData.model,
size: formData.size,
year_model: formData.year_model,
plant: formData.plant
};
await supabaseClient
.from('vehicles')
.upsert([legacyRecord], { onConflict: 'plate' });
loadVehicles();
closeVehicleModal();
showSuccess('Vehicle saved successfully!', 'Success');
});
} catch (err) {
console.error('Error saving vehicle:', err.message);
showError('Error: ' + err.message, 'Save Error');
}
}
async function deleteVehicle(plate) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
// Set up confirmation handlers
window.confirmOk = async function() {
try {
await supabaseWithAuth(async () => {
// Try to delete from vehicle_registry first
const { error: registryError } = await supabaseClient
.from('vehicle_registry')
.delete()
.eq('plate', plate);
if (registryError && !registryError.message.includes('No rows')) {
console.warn('Error deleting from vehicle_registry:', registryError);
}
// Also delete from vehicles table for backward compatibility
const { error: vehiclesError } = await supabaseClient
.from('vehicles')
.delete()
.eq('plate', plate);
if (vehiclesError && !vehiclesError.message.includes('No rows')) {
console.warn('Error deleting from vehicles:', vehiclesError);
}
// If both tables had errors, throw the first one
if (registryError && !registryError.message.includes('No rows') &&
vehiclesError && !vehiclesError.message.includes('No rows')) {
throw registryError;
}
loadVehicles();
showSuccess('Vehicle deleted successfully', 'Success');
});
} catch (err) {
console.error('Error deleting vehicle:', err.message);
showError('Error: ' + err.message, 'Delete Error');
}
};
window.confirmCancel = function() {
// Do nothing on cancel
};
showConfirm('Are you sure you want to delete this vehicle?', 'Confirm Delete', 'confirmOk', 'confirmCancel');
}
async function populateEditForm(plate) {
if (!supabaseClient) return;
try {
// Try to get data from vehicle_registry first
let { data: vehicle, error } = await supabaseClient
.from('vehicle_registry')
.select('*')
.eq('plate', plate)
.single();
// If vehicle_registry doesn't have data, fall back to vehicles table
if (error && error.message && error.message.includes('No rows')) {
const fallback = await supabaseClient
.from('vehicles')
.select('*')
.eq('plate', plate)
.single();
if (!fallback.error) {
vehicle = fallback.data;
}
}
if (error && !vehicle) throw error;
const plateInput = document.getElementById('plate');
plateInput.value = vehicle.plate;
// plateInput.disabled = true; // Disable plate field during edit - REMOVED to allow editing
document.getElementById('model').value = vehicle.model || '';
// Normalize size value to match dropdown options
const sizeValue = (vehicle.size || '').trim().toLowerCase();
const sizeOptions = ['truck head', '12 wheeler', '10 wheeler', '8 wheeler', '6 wheeler', '4 wheeler'];
const matchedSize = sizeOptions.find(opt => opt.toLowerCase() === sizeValue);
document.getElementById('size').value = matchedSize || '';
document.getElementById('year_model').value = vehicle.year_model || '';
document.getElementById('plant').value = vehicle.plant || '';
// Engine & Vehicle Details
document.getElementById('engine_no').value = vehicle.engine_no || '';
document.getElementById('chassi_no').value = vehicle.chassi_no || '';
document.getElementById('classification').value = vehicle.classification || '';
document.getElementById('vehicle_type').value = vehicle.vehicle_type || '';
document.getElementById('color').value = vehicle.color || '';
document.getElementById('aircon_type').value = vehicle.aircon_type || '';
// Registration Details
document.getElementById('cr_no').value = vehicle.cr_no || '';
document.getElementById('cr_registered').value = vehicle.cr_registered || '';
document.getElementById('mv_file').value = vehicle.mv_file || '';
// Technical Specifications
document.getElementById('denomination').value = vehicle.denomination || '';
document.getElementById('piston_displacement').value = vehicle.piston_displacement || '';
document.getElementById('no_of_cylinder').value = vehicle.no_of_cylinder || '';
document.getElementById('fuel').value = vehicle.fuel || '';
document.getElementById('series').value = vehicle.series || '';
// Body & Dimensions
document.getElementById('body_type').value = vehicle.body_type || '';
document.getElementById('body_no').value = vehicle.body_no || '';
document.getElementById('gross_wt').value = vehicle.gross_wt || '';
document.getElementById('net_wt').value = vehicle.net_wt || '';
document.getElementById('shipping_wt').value = vehicle.shipping_wt || '';
document.getElementById('net_capacity').value = vehicle.net_capacity || '';
document.getElementById('length').value = vehicle.length || '';
document.getElementById('width').value = vehicle.width || '';
document.getElementById('height').value = vehicle.height || '';
document.getElementById('volume').value = vehicle.volume || '';
// Owner Information
document.getElementById('owner_name').value = vehicle.owner_name || '';
document.getElementById('address').value = vehicle.address || '';
document.getElementById('company').value = vehicle.company || '';
// Additional Details
document.getElementById('no_of_years').value = vehicle.no_of_years || '';
document.getElementById('pallets_cap').value = vehicle.pallets_cap || '';
document.getElementById('tire_size_front').value = vehicle.tire_size_front || '';
document.getElementById('tire_size_rear').value = vehicle.tire_size_rear || '';
document.getElementById('total_tire_front').value = vehicle.total_tire_front || '';
document.getElementById('total_tire_rear').value = vehicle.total_tire_rear || '';
document.getElementById('autosweep').value = vehicle.autosweep || '';
document.getElementById('easytrip').value = vehicle.easytrip || '';
document.getElementById('gps_type').value = vehicle.gps_type || '';
document.getElementById('remarks').value = vehicle.remarks || '';
editingVehiclePlate = plate;
const vehicleSubmitBtn = document.getElementById('vehicle-submit-btn');
if (vehicleSubmitBtn) vehicleSubmitBtn.textContent = 'Update Vehicle';
// Open modal
const vehicleModal = document.getElementById('vehicle-modal');
const vehicleModalOverlay = document.getElementById('vehicle-modal-overlay');
vehicleModal.style.display = 'block';
vehicleModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
} catch (err) {
console.error('Error loading vehicle for edit:', err.message);
showError('Error: ' + err.message, 'Load Error');
}
}
// ============ Truck Functions ============
let truckImages = {}; // Store truck and driver images
// Load and populate plate dropdown from registered vehicles
async function loadPlateOptions() {
// Load for truck images form
const truckPlateInput = document.getElementById('truck-plate');
if (truckPlateInput) {
try {
// Get only truck plates (filter out trailers and containers)
const truckPlates = allVehicles.filter(v => {
const vehicleType = (v.vehicle_type || '').toLowerCase();
const size = (v.size || '').toLowerCase();
// Include only actual trucks (not trailers or containers)
return !vehicleType.includes('trailer') && !vehicleType.includes('container') && !size.includes('trailer') && !size.includes('container');
});
const uniquePlates = [...new Set(truckPlates.map(v => v.plate))];
// Create datalist if it doesn't exist
let datalist = document.getElementById('plate-options');
if (!datalist) {
datalist = document.createElement('datalist');
datalist.id = 'plate-options';
document.body.appendChild(datalist);
truckPlateInput.setAttribute('list', 'plate-options');
}
// Update datalist options
datalist.innerHTML = uniquePlates
.map(plate => `<option value="${plate}"></option>`)
.join('');
} catch (err) {
console.error('Error loading truck plate options:', err);
}
}
// Load for repair form
const repairPlateSelect = document.getElementById('repair-plate');
if (repairPlateSelect) {
try {
// Get only plates with DOWN status from vehicleStatusRecords
const downStatusVehicles = vehicleStatusRecords.filter(vehicle =>
vehicle.status === 'DOWN'
);
// Clear existing options except the default one
repairPlateSelect.innerHTML = '<option value="">-- Select Plate # --</option>';
// Add only DOWN status vehicle plates as options
downStatusVehicles.forEach(vehicle => {
const option = document.createElement('option');
option.value = vehicle.plate;
option.textContent = `${vehicle.plate} - ${vehicle.driver || 'No Driver'}`;
repairPlateSelect.appendChild(option);
});
// If no DOWN status vehicles found, show a message
if (downStatusVehicles.length === 0) {
const option = document.createElement('option');
option.value = "";
option.textContent = "No vehicles with DOWN status";
option.disabled = true;
repairPlateSelect.appendChild(option);
}
} catch (err) {
console.error('Error loading repair plate options:', err);
}
}
}
// Upload image to Supabase Storage
async function uploadTruckImage(file, imageType) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return null;
}
if (!file) return null;
try {
const fileName = `${imageType}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
const filePath = `trucks/${fileName}`;
const { data, error: uploadError } = await supabaseClient.storage
.from('vehicles')
.upload(filePath, file, { upsert: false });
if (uploadError) throw uploadError;
// Get public URL
const { data: urlData } = supabaseClient.storage
.from('vehicles')
.getPublicUrl(filePath);
return { url: urlData.publicUrl, path: filePath };
} catch (err) {
console.error(`Error uploading ${imageType}:`, err.message);
throw err;
}
}
async function addTruck(plate, truckImageFile, driverImageFile) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Validate plate
if (!plate || !plate.trim()) {
showWarning('Please select a plate number from the registry', 'Validation Error');
return;
}
// Check if plate exists in vehicles
const { data: vehicleExists } = await supabaseClient
.from('vehicles')
.select('plate')
.eq('plate', plate.trim())
.single();
if (!vehicleExists) {
showWarning('Plate number not found in vehicle registry. Please add it first.', 'Validation Error');
return;
}
let truckImageUrl = null;
let truckImagePath = null;
let driverImageUrl = null;
let driverImagePath = null;
// Upload truck image if provided
if (truckImageFile) {
const truckUpload = await uploadTruckImage(truckImageFile, 'truck');
truckImageUrl = truckUpload.url;
truckImagePath = truckUpload.path;
}
// Upload driver image if provided
if (driverImageFile) {
const driverUpload = await uploadTruckImage(driverImageFile, 'driver');
driverImageUrl = driverUpload.url;
driverImagePath = driverUpload.path;
}
const record = {
plate: plate.trim(),
truck_image_url: truckImageUrl,
truck_image_path: truckImagePath,
driver_image_url: driverImageUrl,
driver_image_path: driverImagePath
};
// Insert new truck
const { error: insertError } = await supabaseClient
.from('trucks')
.upsert([record], { onConflict: 'plate' });
if (insertError) throw insertError;
document.getElementById('truck-form').reset();
document.querySelector('#truck-form button[type="submit"]').textContent = 'Add Truck';
showSuccess('Truck information saved successfully!', 'Success');
closeTruckImagesModal();
// Reload truck data to refresh table
setTimeout(() => loadVehicles(), 500);
} catch (err) {
showError('Error: ' + err.message, 'Save Error');
console.error('Error adding truck:', err.message);
}
}
async function deleteTruck(plate) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
// Set up confirmation handlers
window.confirmOk = async function() {
try {
const { error } = await supabaseClient
.from('trucks')
.delete()
.eq('plate', plate);
if (error) throw error;
showSuccess('Truck deleted successfully', 'Success');
// Reload truck data to refresh table
setTimeout(() => loadVehicles(), 500);
} catch (err) {
showError('Error deleting truck: ' + err.message, 'Delete Error');
console.error('Error deleting truck:', err.message);
}
};
window.confirmCancel = function() {
// Do nothing on cancel
};
showConfirm('Are you sure you want to delete this truck?', 'Confirm Delete', 'confirmOk', 'confirmCancel');
}
function displayVehicles(vehicles, plantFilter = null, registryFilter = null) {

// Determine which table to populate based on current filter

let registryBody;

let totalColumns = 46; // Default for main vehicle table

if (registryFilter === 'trailer') {

// Use registry trailer table (not the status trailer table)

registryBody = document.querySelector('#registry-trailer-table tbody');

totalColumns = 9; // Registry trailer table has 9 columns including Actions

// Make sure registry trailer table container is visible

const trailerTableContainer = document.getElementById('trailer-table-container');

const trailerTable = document.getElementById('registry-trailer-table');

if (trailerTableContainer) {

trailerTableContainer.style.display = 'block';
}
if (trailerTable) {
trailerTable.style.display = 'table';
}
} else if (registryFilter === 'container') {
// Use container table
registryBody = document.querySelector('#container-table tbody');
totalColumns = 5; // Container table has 5 columns
} else {
// Use main vehicle table
registryBody = document.querySelector('#vehicle-table tbody');
totalColumns = 46; // Main vehicle table columns
}
const dashboardBody = document.querySelector('#dashboard-vehicle-table tbody');
const dashboardDriversBody = document.querySelector('#dashboard-drivers-table tbody');
// Apply plant filter first
let filtered = plantFilter ? vehicles.filter(v => v.plant === plantFilter) : vehicles;
// Apply registry filter (truck, trailer, container)
if (registryFilter) {
filtered = vehicles.filter(v => {
const vehicleType = (v.vehicle_type || '').toLowerCase();
const size = (v.size || '').toLowerCase();
switch (registryFilter) {
case 'truck':
// Show vehicles that are trucks (not trailers or containers)
return !vehicleType.includes('trailer') && !vehicleType.includes('container') &&
!size.includes('trailer') && !size.includes('container');
case 'trailer':
// Show vehicles that are trailers
return vehicleType.includes('trailer') || size.includes('trailer');
case 'container':
// Show vehicles that are containers
return vehicleType.includes('container') || size.includes('container');
default:
return true;
}
});

// Sort filtered data alphabetically by plate number
filtered.sort((a, b) => {
const plateA = (a.plate || '').toLowerCase();
const plateB = (b.plate || '').toLowerCase();
return plateA.localeCompare(plateB);
});
// Check if user is admin (guest view if not)
const isAdmin = window.authSystem && window.authSystem.isAdmin();
// Special handling for container filter since container data is not in main vehicles array
if (registryFilter === 'container') {
return loadContainerDataForRegistry(plantFilter, isAdmin);
}
console.log(`Vehicles after ${registryFilter} filter:`, filtered.map(v => ({
plate: v.plate,
vehicle_type: v.vehicle_type,
size: v.size
})));
}
// Hide/show Actions column header in Vehicle Registry table based on auth status
const registryActionsHeader = document.querySelector('#vehicle-table thead tr td:nth-child(' + totalColumns + ')');
if (registryActionsHeader) {
registryActionsHeader.style.display = isAdmin ? '' : 'none';
}
// Handle empty state for Vehicle Registry table
let registryRows;
if (filtered.length === 0 && plantFilter) {
const plantName = plantStateManager.getPlantDisplayName(plantFilter);
const colspan = isAdmin ? totalColumns : totalColumns - 1; // Hide Actions column for guests
registryRows = `
<tr>
<td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No vehicles found in ${plantName}
</td>
</tr>
`;
} else if (filtered.length === 0) {
const colspan = isAdmin ? totalColumns : totalColumns - 1; // Hide Actions column for guests
registryRows = `
<tr>
<td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No vehicles found. Add your first vehicle to get started.
</td>
</tr>
`;
} else {
registryRows = filtered.map(v => {
// Calculate no of years if not provided
const noOfYears = v.no_of_years || (v.year_model ? new Date().getFullYear() - v.year_model : 'N/A');
// Generate different row structure based on current filter
if (registryFilter === 'trailer') {
// Registry trailer table row structure (7 columns) without Trailer Type and Gross Weight
const actionsHtml = isAdmin ? `
<button class="action-btn auth-required" onclick="editTrailer('${v.id || ''}')" style="margin-right: 5px;">Edit</button>
<button class="action-btn auth-required" onclick="deleteTrailer('${v.id || ''}')" style="margin-right: 5px;">Delete</button>
` : '-';
return `
<tr>
<td>${v.plate || 'N/A'}</td>
<td>${v.chassi_no || 'N/A'}</td>
<td>${v.mv_file || 'N/A'}</td>
<td>${v.year_model || 'N/A'}</td>
<td>${v.owner_name || 'N/A'}</td>
<td>${v.plant || 'N/A'}</td>
<td class="vehicle-actions-cell auth-required">${actionsHtml}</td>
</tr>
`;
} else if (registryFilter === 'container') {
// Container table row structure (4 columns to match HTML)
return `
<tr>
<td>${v.container || v.plate || 'N/A'}</td>
<td>${v.size || 'N/A'}</td>
<td>${v.color || 'N/A'}</td>
<td>${v.plant || 'UNASSIGNED'}</td>
</tr>
`;
} else {
// Main vehicle table row structure (46 columns)
return `
<tr>
<td>${v.plate || 'N/A'}</td>
${isAdmin ? `
<td class="vehicle-actions-cell auth-required" style="text-align: center; gap: 5px; display: flex;">
<span class="action-btn auth-required" onclick="populateEditForm('${v.plate}')" role="button" tabindex="0">Edit</span>
<span class="action-btn auth-required" onclick="deleteVehicle('${v.plate}')" role="button" tabindex="0">Delete</span>
</td>` : ''}
<td>${v.model || 'N/A'}</td>
<td>${v.size || 'N/A'}</td>
<td>${v.year_model || 'N/A'}</td>
<td>${v.plant || 'N/A'}</td>
<td>${v.engine_no || 'N/A'}</td>
<td>${v.chassi_no || 'N/A'}</td>
<td>${v.classification || 'N/A'}</td>
<td>${v.vehicle_type || 'N/A'}</td>
<td>${v.color || 'N/A'}</td>
<td>${v.aircon_type || 'N/A'}</td>
<td>${v.cr_no || 'N/A'}</td>
<td>${v.cr_registered || 'N/A'}</td>
<td>${v.mv_file || 'N/A'}</td>
<td>${v.denomination || 'N/A'}</td>
<td>${v.piston_displacement || 'N/A'}</td>
<td>${v.no_of_cylinder || 'N/A'}</td>
<td>${v.fuel || 'N/A'}</td>
<td>${v.series || 'N/A'}</td>
<td>${v.body_type || 'N/A'}</td>
<td>${v.body_no || 'N/A'}</td>
<td>${v.gross_wt || 'N/A'}</td>
<td>${v.net_wt || 'N/A'}</td>
<td>${v.shipping_wt || 'N/A'}</td>
<td>${v.net_capacity || 'N/A'}</td>
<td>${v.length || 'N/A'}</td>
<td>${v.width || 'N/A'}</td>
<td>${v.height || 'N/A'}</td>
<td>${v.volume || 'N/A'}</td>
<td>${v.owner_name || 'N/A'}</td>
<td>${v.address || 'N/A'}</td>
<td>${v.company || 'N/A'}</td>
<td>${noOfYears}</td>
<td>${v.pallets_cap || 'N/A'}</td>
<td>${v.tire_size_front || 'N/A'}</td>
<td>${v.tire_size_rear || 'N/A'}</td>
<td>${v.total_tire_front || 'N/A'}</td>
<td>${v.total_tire_rear || 'N/A'}</td>
<td>${v.autosweep || 'N/A'}</td>
<td>${v.easytrip || 'N/A'}</td>
<td>${v.gps_type || 'N/A'}</td>
<td>${v.remarks || 'N/A'}</td>
</tr>
`;
}
}).join('');
}
// Handle empty state for Dashboard Vehicle table
let dashboardRows;
if (filtered.length === 0 && plantFilter) {
const plantName = plantStateManager.getPlantDisplayName(plantFilter);
dashboardRows = `
<tr>
<td colspan="5" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No vehicles found in ${plantName}
</td>
</tr>
`;
} else if (filtered.length === 0) {
dashboardRows = `
<tr>
<td colspan="5" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No vehicles found. Add your first vehicle to get started.
</td>
</tr>
`;
} else {
dashboardRows = filtered.map(v => `
<tr>
<td>${v.plate}</td>
<td>${v.model}</td>
<td>${v.vehicle_type || v.size}</td>
<td>${v.year_model}</td>
<td>${v.no_of_years || (v.year_model ? new Date().getFullYear() - v.year_model : 'N/A')}</td>
</tr>
`).join('');
}
// Handle empty state for Dashboard Drivers table
let dashboardDriverRows;
if (filtered.length === 0 && plantFilter) {
const plantName = plantStateManager.getPlantDisplayName(plantFilter);
dashboardDriverRows = `
<tr>
<td colspan="5" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No drivers found in ${plantName}
</td>
</tr>
`;
} else if (filtered.length === 0) {
dashboardDriverRows = `
<tr>
<td colspan="5" style="text-align: center; padding: 20px; color: #666; font-style: poppins;">
No drivers found. Add your first vehicle to get started.
</td>
</tr>
`;
} else {
dashboardDriverRows = filtered.map(v => {
// Sample data for demonstration
const containerList = ['CONT-001', 'CONT-002', 'CONT-003'];
const trailerList = ['TRL-001', 'TRL-002'];
const tools = ['Wrench Set', 'Jack', 'Tire Iron', 'Spare Tire'];
return `
<tr>
<td class="clickable-cell" onclick="openModal('Container List', ${JSON.stringify(containerList).replace(/"/g, '&quot;')})" style="cursor: pointer; color: var(--blue); text-decoration: underline;">View Containers</td>
<td class="clickable-cell" onclick="openModal('Trailer List', ${JSON.stringify(trailerList).replace(/"/g, '&quot;')})" style="cursor: pointer; color: var(--blue); text-decoration: underline;">View Trailers</td>
<td style="color: #4caf50; font-weight: 600;">Done</td>
<td style="color: #ff9800; font-weight: 600;">Pending</td>
<td class="clickable-cell" onclick="openModal('Tools', ${JSON.stringify(tools).replace(/"/g, '&quot;')})" style="cursor: pointer; color: var(--blue); text-decoration: underline;">View Tools</td>
</tr>
`}).join('');
}
if (registryBody) {
registryBody.innerHTML = registryRows || '<tr><td colspan="6" style="text-align: center;">No data available</td></tr>';
} else {
console.error('Registry body not found for filter:', registryFilter);
}
if (dashboardBody) dashboardBody.innerHTML = dashboardRows;
if (dashboardDriversBody) dashboardDriversBody.innerHTML = dashboardDriverRows;
// Also render status table - removed deprecated function call

// Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
}
}
// Load trailer data for repair section
async function loadTrailerDataForRepair(plantFilter) {
    try {
        // Use selectedPlantFilter if plantFilter is not provided
        const effectiveFilter = plantFilter !== undefined ? plantFilter : selectedPlantFilter;
        // Load trailer data from trailer_registry table - only Down status
        let query = supabaseClient
            .from('trailer_registry')
            .select('*')
            .or('status.eq.Down,status.eq.DOWN,status.eq.down')
            .order('plate_no', { ascending: true });
        // Apply plant filter if specified (trailer_registry uses location_plant column)
        if (effectiveFilter) {
            query = query.eq('location_plant', effectiveFilter);
        }
        const { data: trailerData, error: trailerError } = await query;

        if (trailerError) {
            console.error('Error loading trailers for repair:', trailerError);
            return;
        }

        // Get the trailer table body
        const trailerTbody = document.querySelector('#repair-trailer-table tbody');
        if (!trailerTbody) return;

        // Filter trailers by plant if specified
        let filteredTrailers = trailerData || [];

        // Show empty state if no records
        if (filteredTrailers.length === 0) {
            trailerTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No Trailer Vehicles Found For The Selected Plant.
                    </td>
                </tr>
            `;
            return;
        }

        // Populate trailer table with trailer-specific format
        trailerTbody.innerHTML = filteredTrailers.map(trailer => {
            // Map status values to colors for consistency
            const statusColor = {
                'OPERATIONAL': 'green',
                'OPERATIONAL/HUSTLING': 'blue',
                'DOWN': 'red',
                'Down': 'red',
                'down': 'red',
                'TOTALLY DOWN': 'brown'
            }[trailer.status] || 'black';

            return `
                <tr>
                    <td>${trailer.plate_no || '-'}</td>
                    <td>${trailer.chassis_no || '-'}</td>
                    <td>${trailer.trailer_type || '-'}</td>
                    <td>${trailer.trailer_issue || '-'}</td>
                    <td>${trailer.date_reported || '-'}</td>
                    <td><span style="color: ${statusColor}; font-weight: 600;">${trailer.status || 'Active'}</span></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error in loadTrailerDataForRepair:', error);
        const trailerTbody = document.querySelector('#repair-trailer-table tbody');
        if (trailerTbody) {
            trailerTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        Error loading trailer data.
                    </td>
                </tr>
            `;
        }
    }
}

// Load container data for repair section
async function loadContainerDataForRepair(plantFilter) {
    try {
        // Use selectedPlantFilter if plantFilter is not provided
        const effectiveFilter = plantFilter !== undefined ? plantFilter : selectedPlantFilter;
        // Load container data from containers table - only Down status
        let query = supabaseClient
            .from('containers')
            .select('*')
            .or('status.eq.Down,status.eq.DOWN,status.eq.down')
            .order('container', { ascending: true });
        // Apply plant filter if specified
        if (effectiveFilter) {
            query = query.eq('plant', effectiveFilter);
        }
        const { data: containerData, error: containerError } = await query;
            
        if (containerError) {
            console.error('Error loading containers for repair:', containerError);
            return;
        }
        
        // Get the container table body
        const containerTbody = document.querySelector('#repair-container-table tbody');
        if (!containerTbody) return;
        
        // Filter containers by plant if specified (containers don't have plant, so show all)
        let filteredContainers = containerData || [];
        
        // Show empty state if no records
        if (filteredContainers.length === 0) {
            containerTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No Container Vehicles Found For The Selected Plant.
                    </td>
                </tr>
            `;
            return;
        }
        
        // Populate container table with container-specific format
        containerTbody.innerHTML = filteredContainers.map(container => {
            // Map status values to colors for consistency
            const statusColor = {
                'OPERATIONAL': 'green',
                'OPERATIONAL/HUSTLING': 'blue',
                'DOWN': 'red',
                'Down': 'red',
                'down': 'red',
                'TOTALLY DOWN': 'brown'
            }[container.status] || 'black';

            // Apply color styling to container text based on container color field
            const colorStyle = container.color === 'Blue' ? 'blue' : 
                              container.color === 'Red' ? 'red' : 
                              container.color === 'Green' ? 'green' : 
                              container.color === 'Yellow' ? 'yellow' : 
                              container.color ? container.color.toLowerCase() : 'inherit';
                
            return `
                <tr>
                    <td>${container.chassi_no || '-'}</td>
                    <td style="color: ${colorStyle}; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${container.container || '-'}</td>
                    <td>${container.size || '-'}</td>
                    <td>${container.container_issue || '-'}</td>
                    <td>${container.date_reported || '-'}</td>
                    <td><span style="color: ${statusColor}; font-weight: 600;">${container.status || 'Active'}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error in loadContainerDataForRepair:', error);
        const containerTbody = document.querySelector('#repair-container-table tbody');
        if (containerTbody) {
            containerTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        Error loading container data.
                    </td>
                </tr>
            `;
        }
    }
}

// Update container count badge
function updateContainerCountBadge(count) {
const containerCountBadge = document.getElementById('container-count-badge');
if (containerCountBadge) {
containerCountBadge.textContent = count;
}
}
// Update trailer count badge
function updateTrailerCountBadge(count) {
const trailerCountBadge = document.getElementById('trailer-count-badge');
if (trailerCountBadge) {
trailerCountBadge.textContent = count;
}
}
// Fetch and update container and trailer counts
async function updateContainerTrailerCounts() {
try {
if (!supabaseClient) {
console.error('Supabase client not initialized');
return;
}
// Fetch container count from containers table
const { data: containerData, error: containerError } = await supabaseClient
.from('containers')
.select('id');
if (containerError) {
console.error('Error fetching container count:', containerError);
} else {
updateContainerCountBadge(containerData ? containerData.length : 0);
console.log('Container count updated:', containerData ? containerData.length : 0);
}
// Fetch trailer count from trailer_registry table
const { data: trailerData, error: trailerError } = await supabaseClient
.from('trailer_registry')
.select('id');
if (trailerError) {
console.error('Error fetching trailer count:', trailerError);
} else {
updateTrailerCountBadge(trailerData ? trailerData.length : 0);
console.log('Trailer count updated:', trailerData ? trailerData.length : 0);
}
} catch (error) {
console.error('Error updating counts:', error);
}
}
// Load container data separately for the registry
async function loadContainerDataForRegistry(plantFilter, isAdmin) {
try {
// Load container data from containers table
let query = supabaseClient
.from('containers')
.select('*')
.order('container', { ascending: true });
// Apply plant filter if specified
if (plantFilter) {
query = query.eq('plant', plantFilter);
}
const { data: containerData, error: containerError } = await query;
if (containerError) {
console.error('Error loading containers:', containerError);
return;
}
// Update container count badge
updateContainerCountBadge(containerData ? containerData.length : 0);
if (!containerData || containerData.length === 0) {
const tbody = document.querySelector('#container-table tbody');
if (tbody) {
tbody.innerHTML = `
<tr>
<td colspan="5" style="text-align: center; padding: 20px; color: #666;">
No containers found.
</td>
</tr>
`;
}
return;
}
// Display container data for Vehicle Registry (5 columns)
const tbody = document.querySelector('#container-table tbody');
if (tbody) {
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();

// Hide/show Actions column header based on auth status
const containerTable = document.querySelector('#container-table');
if (containerTable) {
const actionsHeader = containerTable.querySelector('thead tr td:nth-child(5)');
if (actionsHeader) {
actionsHeader.style.display = isAdmin ? '' : 'none';
}
}

tbody.innerHTML = containerData.map(container => {
const colorStyle = container.color === 'Blue' ? 'blue' : container.color === 'Red' ? 'red' : container.color === 'Green' ? 'green' : container.color === 'Yellow' ? 'yellow' : container.color ? container.color.toLowerCase() : 'inherit';
return `
<tr>
<td>${container.chassi_no || '-'}</td>
<td style="color: ${colorStyle}; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${container.container || '-'}</td>
<td>${container.color || '-'}</td>
<td>${container.size || '-'}</td>
${isAdmin ? `<td class="auth-required">
<button onclick="editContainer('${container.id}')" class="action-btn">Edit</button>
<button onclick="deleteContainer('${container.id}')" class="action-btn">Delete</button>
</td>` : ''}
</tr>
`;
}).join('');

// Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
if (window.updateCrudVisibility) {
window.updateCrudVisibility();
}
}
} catch (error) {
console.error('Error in loadContainerDataForRegistry:', error);
}
}
// Edit container function
function editContainer(containerId) {
// TODO: Implement edit container functionality
// This could open a modal with the container data pre-filled
showNotification('Edit container functionality coming soon!', 'info');
}
// Delete container function
function deleteContainer(containerId) {
showConfirm('Are you sure you want to delete this container?', 'Confirm Delete', 
() => {
// User confirmed deletion
deleteContainerFromDB(containerId);
},
() => {
// User cancelled deletion
}
);
}
// Delete container from database
async function deleteContainerFromDB(containerId) {
try {
const { error } = await supabaseClient
.from('containers')
.delete()
.eq('id', containerId);
if (error) {
console.error('Error deleting container:', error);
showNotification('Error deleting container', 'error');
} else {
showNotification('Container deleted successfully', 'success');
// Reload container data
loadContainerDataForRegistry();
}
} catch (error) {
console.error('Error in deleteContainerFromDB:', error);
showNotification('Error deleting container', 'error');
}
}
// Show vehicle status for trailers
function showVehicleStatus(plateNumber) {

console.log('Showing status for trailer:', plateNumber);

// Find trailer data from trailer_registry

const trailerData = allVehicles.find(v => v.plate === plateNumber && v.vehicle_type === 'Trailer');

if (!trailerData) {

showError('Trailer not found', 'Error');

return;
}
// Create status modal content
const statusContent = `
<div style="padding: 20px;">
<h3>Trailer Status Information</h3>
<div style="margin-top: 15px;">
<p><strong>Plate Number:</strong> ${trailerData.plate}</p>
<p><strong>Chassis Number:</strong> ${trailerData.chassi_no}</p>
<p><strong>M.V. File No:</strong> ${trailerData.mv_file}</p>
<p><strong>Year Model:</strong> ${trailerData.year_model}</p>
<p><strong>Owner:</strong> ${trailerData.owner_name}</p>
<p><strong>Location Plant:</strong> ${trailerData.plant}</p>
<p><strong>Container:</strong> ${trailerData.container}</p>
<p><strong>Trailer Issue:</strong> ${trailerData.trailer_issue}</p>
<p><strong>Status:</strong> ${trailerData.status}</p>
</div>
</div>
`;
// Show modal with status content
showNotification(statusContent, 'Trailer Status', 10000);
}
// ============ Modal Functions for Drivers Table ============
function openModal(title, items) {

const modal = document.getElementById('drivers-modal');

const overlay = document.getElementById('drivers-modal-overlay');

const modalTitle = document.getElementById('drivers-modal-title');

const modalList = document.getElementById('drivers-modal-list');

// Set modal title

modalTitle.textContent = title;

// Clear and populate list

modalList.innerHTML = '';

items.forEach(item => {

const li = document.createElement('li');

li.textContent = item;

li.style.cssText = 'padding: 8px 0; border-bottom: 1px solid #eee; color: var(--black1);';

modalList.appendChild(li);

});

// Show modal and overlay

modal.style.display = 'block';

overlay.style.display = 'block';

// Prevent body scroll

document.body.style.overflow = 'hidden';
}
function closeModal() {

const modal = document.getElementById('drivers-modal');

const overlay = document.getElementById('drivers-modal-overlay');

// Hide modal and overlay

modal.style.display = 'none';

overlay.style.display = 'none';

// Restore body scroll

document.body.style.overflow = '';
}
// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', function() {
// Close modal when clicking X button
const closeBtn = document.getElementById('drivers-modal-close-btn');
if (closeBtn) {
closeBtn.addEventListener('click', closeModal);
}
// Close modal when clicking overlay
const overlay = document.getElementById('drivers-modal-overlay');
if (overlay) {
overlay.addEventListener('click', function(e) {
if (e.target === overlay) {
closeModal();
}
});
}
// Close modal when pressing Escape key
document.addEventListener('keydown', function(e) {
if (e.key === 'Escape') {
closeModal();
}
});
});
// Trailer Modal Event Listeners
document.addEventListener('DOMContentLoaded', function() {
// Ensure + Trailer button is hidden initially
const addTrailerBtn = document.getElementById('add-trailer-btn');
if (addTrailerBtn) {
addTrailerBtn.style.display = 'none';
}
// Old trailer form submission handler removed - using the correct one below
// Trailer modal close buttons
const trailerModalCloseBtn = document.getElementById('trailer-modal-close-btn');
const trailerModalCancelBtn = document.getElementById('trailer-modal-cancel-btn');
const trailerModalOverlay = document.getElementById('trailer-modal-overlay');
if (trailerModalCloseBtn) {
trailerModalCloseBtn.addEventListener('click', closeTrailerModal);
}
if (trailerModalCancelBtn) {
trailerModalCancelBtn.addEventListener('click', closeTrailerModal);
}
if (trailerModalOverlay) {
trailerModalOverlay.addEventListener('click', function(e) {
if (e.target === trailerModalOverlay) {
closeTrailerModal();
}
});
}
// Container modal close buttons
const containerModalCloseBtn = document.getElementById('container-modal-close-btn');
const containerModalCancelBtn = document.getElementById('container-modal-cancel-btn');
const containerModalOverlay = document.getElementById('container-modal-overlay');
if (containerModalCloseBtn) {
containerModalCloseBtn.addEventListener('click', closeContainerModal);
}
if (containerModalCancelBtn) {
containerModalCancelBtn.addEventListener('click', closeContainerModal);
}
if (containerModalOverlay) {
containerModalOverlay.addEventListener('click', function(e) {
if (e.target === containerModalOverlay) {
closeContainerModal();
}
});
}
// Duplicate container form submission handler removed - using the correct one below
});
// ============ Vehicle Status Functions ============
let vehicleStatusRecords = [];
let editingStatusPlate = null;

// Expose vehicleStatusRecords to window for use in other modules
window.vehicleStatusRecords = vehicleStatusRecords;
// Load vehicle status records with driver and status
async function loadVehicleStatus() {
return new Promise(async (resolve, reject) => {
if (!supabaseClient) {
console.error('Supabase not initialized');
displayVehicleStatus([]);
reject(new Error('Supabase not initialized'));
return;
}
try {
// Get all vehicles from vehicle_registry
let vehicleQuery = supabaseClient
.from('vehicle_registry')
.select('*')
.order('plate', { ascending: true });
if (selectedPlantFilter) {
vehicleQuery = vehicleQuery.eq('plant', selectedPlantFilter);
}
const { data: vehicles, error: vehicleError } = await vehicleQuery;
if (vehicleError) throw vehicleError;

// Get all trailers from trailer_registry
let trailerQuery = supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
if (selectedPlantFilter) {
trailerQuery = trailerQuery.eq('location_plant', selectedPlantFilter);
}
const { data: trailers, error: trailerError } = await trailerQuery;
if (trailerError) throw trailerError;

// Get all driver statuses
const { data: driverStatuses, error: driverError } = await supabaseClient
.from('drivers_status')
.select('plate, driver, status, truck_issue, date_reported');
if (driverError) throw driverError;

// Create a map of driver statuses by plate
const driverStatusMap = {};
(driverStatuses || []).forEach(ds => {
driverStatusMap[ds.plate] = ds;
});

// Merge vehicle data with driver/status data
const vehicleMergedData = (vehicles || []).map(vehicle => ({
...vehicle,
driver: driverStatusMap[vehicle.plate]?.driver || 'N/A',
status: driverStatusMap[vehicle.plate]?.status || 'N/A',
truck_issue: driverStatusMap[vehicle.plate]?.truck_issue || '-',
date_reported: driverStatusMap[vehicle.plate]?.date_reported || '-',
}));

// Merge trailer data with driver/status data
const trailerMergedData = (trailers || []).map(trailer => ({
...trailer,
plate: trailer.plate_no, // Normalize plate field
chassi_no: trailer.chassis_no, // Normalize chassis field
plant: trailer.location_plant, // Normalize plant field
vehicle_type: 'Trailer', // Set vehicle type for filtering
driver: driverStatusMap[trailer.plate_no]?.driver || 'N/A',
status: driverStatusMap[trailer.plate_no]?.status || trailer.status || 'N/A',
truck_issue: driverStatusMap[trailer.plate_no]?.truck_issue || trailer.trailer_issue || '-',
date_reported: trailer.date_reported || driverStatusMap[trailer.plate_no]?.date_reported || '-',
}));

// Combine both vehicle and trailer data
let mergedData = [...vehicleMergedData, ...trailerMergedData];

vehicleStatusRecords = mergedData;

// Update window.vehicleStatusRecords for use in other modules
window.vehicleStatusRecords = vehicleStatusRecords;

// Only display data if we're not in Status view (to avoid overriding filtered views)
if (!document.getElementById('status-view').classList.contains('active')) {
displayVehicleStatus(vehicleStatusRecords);
}
resolve();
} catch (err) {
console.error('Error loading vehicles:', err.message);
displayVehicleStatus([]);
reject(err);
}
});
}
function displayVehicleStatus(vehicleRecords) {

console.log('displayVehicleStatus called with', vehicleRecords.length, 'records');
console.log('Current filter active:', window.currentStatusFilter);

const tbody = document.querySelector('#status-table tbody');

if (!tbody) {
  console.error('status-table tbody not found!');
  return;
}

console.log('status-table tbody found, proceeding to update');

// Always filter out trailers from default status table
vehicleRecords = vehicleRecords.filter(vehicle => {
    const vehicleType = (vehicle.vehicle_type || '').toLowerCase().trim();
    const size = (vehicle.size || '').toLowerCase().trim();
    return !vehicleType.includes('trailer') && !size.includes('trailer');
});

// Apply status filter if active (from status.js)
if (window.currentStatusFilter) {
  const filterStatus = window.currentStatusFilter.toLowerCase().trim();
  console.log('Applying filter for status:', filterStatus);
  console.log('Total vehicles before filter:', vehicleRecords.length);
  
  vehicleRecords = vehicleRecords.filter(vehicle => {
    const vehicleStatus = (vehicle.status || '').toLowerCase().trim();
    
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
  console.log(`Filtered to ${vehicleRecords.length} vehicles with status: ${window.currentStatusFilter}`);
  
  // Log sample statuses for debugging
  if (vehicleRecords.length === 0) {
    console.log('No vehicles matched. Sample statuses from database:');
    const sampleStatuses = [...new Set(vehicleRecords.map(v => v.status))].slice(0, 5);
    console.log(sampleStatuses);
  }
}

// Check if user is admin (guest view if not)

const isAdmin = window.authSystem && window.authSystem.isAdmin();

// Hide/show Actions column header based on auth status

const actionsHeader = document.querySelector('#status-table thead tr td:nth-child(7)');

if (actionsHeader) {

actionsHeader.style.display = isAdmin ? '' : 'none';
}
if (!vehicleRecords || vehicleRecords.length === 0) {
const colspan = isAdmin ? 7 : 6; // 7 columns for admin (including Actions), 6 for guest (no Actions column)
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
// Display vehicles from vehicle_registry table with driver and status
console.log('Generating vehicle rows for', vehicleRecords.length, 'vehicles');
const vehicleRows = vehicleRecords.map(vehicle => {
// Map status values to colors for consistency
const statusColor = {
'OPERATIONAL': 'green',
'OPERATIONAL/HUSTLING': 'blue',
'DOWN': 'red',
'TOTALLY DOWN': 'brown'
}[vehicle.status] || 'black';
return `
<tr>
<td>${vehicle.plate || 'N/A'}</td>
<td>${vehicle.size || 'N/A'}</td>
<td>${vehicle.model || 'N/A'}</td>
<td>${vehicle.driver || 'N/A'}</td>
<td>${vehicle.truck_issue || '-'}</td>
<td><span style="color: ${statusColor}; font-weight: 600;">${vehicle.status || 'N/A'}</span></td>
${isAdmin ? `
<td style="text-align: center; gap: 5px; display: flex;">
<button onclick="openTruckEditModal('${vehicle.plate}')" class="action-btn">Edit</button>
</td>` : ''}
</tr>
`;
}).join('');
console.log('Generated', vehicleRows.split('</tr>').length - 1, 'rows');
console.log('Setting tbody.innerHTML');
tbody.innerHTML = vehicleRows;
console.log('tbody.innerHTML set successfully');
}
// Function to populate CERTIFICATE OF REGISTRATION table
function displayCertificateOfRegistration(vehicles) {

const crTableBody = document.querySelector('#status-table-2 tbody');

if (!crTableBody) return;

if (vehicles.length === 0) {

crTableBody.innerHTML = `

<tr>

<td colspan="9" style="text-align: center; padding: 20px; color: #666;">

No vehicles found. Add vehicles to Vehicle Registry first.

</td>

</tr>

`;

return;
}
// Sort vehicles alphabetically by plate number
vehicles.sort((a, b) => {
const plateA = (a.plate || '').toLowerCase();
const plateB = (b.plate || '').toLowerCase();
return plateA.localeCompare(plateB);
});

// Map vehicle data to CR table format
const crRows = vehicles.map(vehicle => {
return `
<tr>
<td>${vehicle.plate || 'N/A'}</td>
<td>${vehicle.mv_file || 'N/A'}</td>
<td>${vehicle.engine_no || 'N/A'}</td>
<td>${vehicle.chassi_no || 'N/A'}</td>
<td>${vehicle.model || 'N/A'}</td>
<td>${vehicle.vehicle_type || vehicle.size || 'N/A'}</td>
<td>${vehicle.year_model || 'N/A'}</td>
<td>${vehicle.gross_weight || vehicle.gross_wt || 'N/A'}</td>
<td style="text-align: center;">
${vehicle.cr_image_url ? 
  `<i class="fas fa-file-pdf" onclick="openPdfInTab('${vehicle.plate}', '${vehicle.cr_image_url}', 'CR')" style="font-size: 20px; color: #dc3545; cursor: pointer; margin-right: 8px;" title="View C/R Document"></i>` :
  `<button onclick="openCrActionModal('${vehicle.plate}')" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3); transition: all 0.2s ease;">C/R</button>`
}
</td>
</tr>
`;
}).join('');
crTableBody.innerHTML = crRows;
}
// Open truck edit modal
async function openTruckEditModal(plate) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Get vehicle information from vehicle_registry
const { data: vehicle, error } = await supabaseClient
.from('vehicle_registry')
.select('*')
.eq('plate', plate)
.single();
if (error || !vehicle) {
showError('Vehicle not found', 'Not Found');
return;
}
// Get driver/status from drivers_status table
const { data: driverStatus, error: driverError } = await supabaseClient
.from('drivers_status')
.select('driver, status, truck_issue, date_reported, cr_image_url, cr_image_name, or_image_url, or_image_name')
.eq('plate', plate)
.single();

// Get vehicle status data for dates
const { data: vehicleStatus, error: vehicleError } = await supabaseClient
.from('vehicle_status')
.select('registered_date, expiration_date')
.eq('plate', plate)
.maybeSingle();

// Debug logging
console.log('Driver Status Data:', driverStatus);
console.log('Driver Status Error:', driverError);
console.log('Vehicle Status Data:', vehicleStatus);
console.log('Vehicle Status Error:', vehicleError);

// Populate form with vehicle data
document.getElementById('status-plate').value = vehicle.plate || '';
document.getElementById('status-truck-size').value = vehicle.size || '';
document.getElementById('status-model').value = vehicle.model || '';
if (!driverError && driverStatus) {
document.getElementById('status-driver').value = driverStatus.driver || '';
document.getElementById('status-truck-status').value = driverStatus.status || '';
document.getElementById('status-truck-issue').value = driverStatus.truck_issue || '';
document.getElementById('status-registration-date').value = vehicleStatus?.registered_date || '';
document.getElementById('status-expiration-date').value = vehicleStatus?.expiration_date || '';
document.getElementById('status-date-reported').value = driverStatus.date_reported || '';
} else {
document.getElementById('status-driver').value = '';
document.getElementById('status-truck-status').value = '';
document.getElementById('status-truck-issue').value = '';
document.getElementById('status-registration-date').value = '';
document.getElementById('status-expiration-date').value = '';
document.getElementById('status-date-reported').value = '';
}
// Handle date reported field visibility based on status
const currentStatus = document.getElementById('status-truck-status').value;
const dateReportedGroup = document.getElementById('date-reported-group');
if (currentStatus === 'DOWN' && dateReportedGroup) {
dateReportedGroup.style.display = 'block';
} else if (dateReportedGroup) {
dateReportedGroup.style.display = 'none';
}
// Store plate for saving
editingStatusPlate = plate;
// Display existing images if they exist
const orImagePreview = document.getElementById('status-truck-or-preview');
const crImagePreview = document.getElementById('status-truck-cr-preview');
// Clear current previews
orImagePreview.innerHTML = '<span style="color: #666;">Click to upload O/R PDF</span>';
orImagePreview.classList.remove('has-image');
crImagePreview.innerHTML = '<span style="color: #666;">Click to upload C/R PDF</span>';
crImagePreview.classList.remove('has-image');
// Reset file variables
orImageFile = null;
crImageFile = null;
// Display O/R PDF if exists
if (!driverError && driverStatus && driverStatus.or_image_url) {
const orFileName = driverStatus.or_image_name || 'O/R PDF';
orImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px; position: relative; cursor: pointer;"
onclick="viewOrImage('${plate}', '${driverStatus.or_image_url}')"
title="Click to view: ${orFileName}">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666;" title="${orFileName}">${orFileName}</div>
<div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">O/R</div>
<div onclick="event.stopPropagation(); clearTruckDocument('or')" style="position: absolute; top: 5px; left: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; user-select: none; line-height: 1; padding: 0; margin: 0; box-sizing: border-box; border: none; flex-shrink: 0;">×</div>
</div>
`;
orImagePreview.classList.add('has-image');
}
// Display C/R PDF if exists
if (!driverError && driverStatus && driverStatus.cr_image_url) {
// Get filename from URL for display
const crFileName = driverStatus.cr_image_name || 'C/R PDF';
crImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px; position: relative; cursor: pointer;"
onclick="viewCrImage('${plate}', '${driverStatus.cr_image_url}')"
title="Click to view: ${crFileName}">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666;" title="${crFileName}">${crFileName}</div>
<div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">C/R</div>
<div onclick="event.stopPropagation(); clearTruckDocument('cr')" style="position: absolute; top: 5px; left: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; user-select: none; line-height: 1; padding: 0; margin: 0; box-sizing: border-box; border: none; flex-shrink: 0;">×</div>
</div>
`;
crImagePreview.classList.add('has-image');
}
// Open modal
const modal = document.getElementById('vehicle-status-modal');
const overlay = document.getElementById('vehicle-status-modal-overlay');
modal.style.display = 'block';
overlay.style.display = 'block';
document.body.style.overflow = 'hidden';
} catch (err) {
console.error('Error opening status modal:', err.message);
showError('Error: ' + err.message, 'Modal Error');
}
}
// View C/R PDF function
window.viewCrImage = function(plate, pdfUrl) {
if (!pdfUrl) {
showWarning('No C/R PDF available for this vehicle', 'No PDF');
return;
}
// Use openPdfInTab to open in new tab only
openPdfInTab(plate, pdfUrl, 'CR');
};
// Close C/R Image Modal function
window.closeCrImageModal = function() {
const modal = document.getElementById('cr-image-modal');
const overlay = document.getElementById('cr-image-modal-overlay');
modal.style.display = 'none';
overlay.style.display = 'none';
document.body.style.overflow = 'auto';
document.getElementById('download-cr-pdf').style.display = 'none';
};
// View O/R PDF function
window.viewOrImage = function(plate, pdfUrl) {
if (!pdfUrl) {
showWarning('No O/R PDF available for this vehicle', 'No PDF');
return;
}
// Use openPdfInTab to open in new tab only
openPdfInTab(plate, pdfUrl, 'OR');
};
// Close O/R PDF Modal function
window.closeOrPdfModal = function() {
const modal = document.getElementById('or-pdf-modal');
const overlay = document.getElementById('or-pdf-modal-overlay');
modal.style.display = 'none';
overlay.style.display = 'none';
document.body.style.overflow = 'auto';
document.getElementById('download-or-pdf').style.display = 'none';
};
// Direct PDF download function (no modal)
window.downloadPdf = function(plate, pdfUrl, documentType) {
if (!pdfUrl) {
showWarning(`No ${documentType} PDF available for this vehicle`, 'No PDF');
return;
}

// Check if it's a base64 data URL
if (pdfUrl.startsWith('data:application/pdf;base64,')) {
  // Extract base64 data
  const base64Data = pdfUrl.split(',')[1];
  
  try {
    // Convert base64 to blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    
    // Create blob URL for viewing in new tab only
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    // Clean up blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    // Fallback to open in new tab only
    window.open(pdfUrl, '_blank');
  }
} else {
  // For regular URLs, use the original method without download
  window.open(pdfUrl, '_blank');
}
};

// Open PDF in new tab only (no download) - for trailer C/R and O/R
window.openPdfInTab = function(plate, pdfUrl, documentType) {
if (!pdfUrl) {
showWarning(`No ${documentType} PDF available for this vehicle`, 'No PDF');
return;
}

// Check if it's a base64 data URL
if (pdfUrl.startsWith('data:application/pdf;base64,')) {
  // Extract base64 data
  const base64Data = pdfUrl.split(',')[1];
  
  try {
    // Convert base64 to blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    
    // Create blob URL for viewing in new tab only
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    // Clean up blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    // Fallback to open in new tab only
    window.open(pdfUrl, '_blank');
  }
} else {
  // For regular URLs, use the original method
  window.open(pdfUrl, '_blank');
}
};
// View vehicle details function
async function viewDetails(plate) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Fetch data from Supabase
const { data, error } = await supabaseClient
.from('vehicle_registry')
.select('*')
.eq('plate', plate)
.single();
if (error) throw error;
// Clear existing table body
const detailsBody = document.getElementById('vehicleDetailsBody');
if (!detailsBody) return;
detailsBody.innerHTML = '';
// Dynamically insert rows like Field | Value
const fieldMappings = [
{ label: 'Plate #', value: data.plate },
{ label: 'Model', value: data.model },
{ label: 'Size', value: data.size },
{ label: 'Year Model', value: data.year_model },
{ label: 'Plant', value: data.plant },
// Engine & Vehicle Details
{ label: 'Engine No', value: data.engine_no || 'N/A' },
{ label: 'Chassis No', value: data.chassi_no || 'N/A' },
{ label: 'Classification', value: data.classification || 'N/A' },
{ label: 'Vehicle Type', value: data.vehicle_type || 'N/A' },
{ label: 'Color', value: data.color || 'N/A' },
{ label: 'Aircon Type', value: data.aircon_type || 'N/A' },
// Registration Details
{ label: 'CR No', value: data.cr_no || 'N/A' },
{ label: 'CR Registered Date', value: data.cr_registered ? new Date(data.cr_registered).toLocaleDateString() : 'N/A' },
{ label: 'MV File', value: data.mv_file || 'N/A' },
// Technical Specifications
{ label: 'Denomination', value: data.denomination || 'N/A' },
{ label: 'Piston Displacement', value: data.piston_displacement || 'N/A' },
{ label: 'Number of Cylinders', value: data.no_of_cylinder || 'N/A' },
{ label: 'Fuel', value: data.fuel || 'N/A' },
{ label: 'Series', value: data.series || 'N/A' },
// Body & Dimensions
{ label: 'Body Type', value: data.body_type || 'N/A' },
{ label: 'Body No', value: data.body_no || 'N/A' },
{ label: 'Gross Weight', value: data.gross_wt || 'N/A' },
{ label: 'Net Weight', value: data.net_wt || 'N/A' },
{ label: 'Shipping Weight', value: data.shipping_wt || 'N/A' },
{ label: 'Net Capacity', value: data.net_capacity || 'N/A' },
{ label: 'Length', value: data.length || 'N/A' },
{ label: 'Width', value: data.width || 'N/A' },
{ label: 'Height', value: data.height || 'N/A' },
{ label: 'Volume', value: data.volume || 'N/A' },
// Owner Information
{ label: 'Owner Name', value: data.owner_name || 'N/A' },
{ label: 'Address', value: data.address || 'N/A' },
{ label: 'Company', value: data.company || 'N/A' },
// Additional Details
{ label: 'Number of Years', value: data.no_of_years || 'N/A' },
{ label: 'Pallets Capacity', value: data.pallets_cap || 'N/A' },
{ label: 'Tire Size (Front)', value: data.tire_size_front || 'N/A' },
{ label: 'Tire Size (Rear)', value: data.tire_size_rear || 'N/A' },
{ label: 'Total Tires (Front)', value: data.total_tire_front || 'N/A' },
{ label: 'Total Tires (Rear)', value: data.total_tire_rear || 'N/A' },
{ label: 'Autosweep', value: data.autosweep || 'N/A' },
{ label: 'Easytrip', value: data.easytrip || 'N/A' },
{ label: 'GPS Type', value: data.gps_type || 'N/A' },
{ label: 'Remarks', value: data.remarks || 'N/A' }
];
// Group fields visually with section headers
const sections = [
{
title: 'Basic Information',
fields: ['Plate #', 'Model', 'Size', 'Year Model', 'Plant']
},
{
title: 'Engine & Vehicle Details',
fields: ['Engine No', 'Chassis No', 'Classification', 'Vehicle Type', 'Color', 'Aircon Type']
},
{
title: 'Registration Details',
fields: ['CR No', 'CR Registered Date', 'MV File']
},
{
title: 'Technical Specifications',
fields: ['Denomination', 'Piston Displacement', 'Number of Cylinders', 'Fuel', 'Series']
},
{
title: 'Body & Dimensions',
fields: ['Body Type', 'Body No', 'Gross Weight', 'Net Weight', 'Shipping Weight', 'Net Capacity', 'Length', 'Width', 'Height', 'Volume']
},
{
title: 'Owner Information',
fields: ['Owner Name', 'Address', 'Company']
},
{
title: 'Additional Details',
fields: ['Number of Years', 'Pallets Capacity', 'Tire Size (Front)', 'Tire Size (Rear)', 'Total Tires (Front)', 'Total Tires (Rear)', 'Autosweep', 'Easytrip', 'GPS Type', 'Remarks']
}
];
// Create table rows with section headers
let rows = '';
sections.forEach(section => {
// Add section header
rows += `
<tr style="background: #f0f0f0; color: #333; font-weight: bold;">
<td colspan="2" style="padding: 12px; border: 1px solid #ddd;">
<strong>${section.title}</strong>
</td>
<td style="padding: 12px; border: 1px solid #ddd; text-align: right;">
<strong style="color: #c95454;">${section.fields.length} fields</strong>
</td>
</tr>
`;
// Add fields in this section
section.fields.forEach(field => {
const fieldData = fieldMappings.find(f => f.label === field);
const value = fieldData ? fieldData.value : 'N/A';
const isImportant = ['Plate #', 'CR No', 'Owner Name'].includes(field);
rows += `
<tr style="${isImportant ? 'background: #fff3cd; color: #333;' : ''}">
<td style="padding: 12px; border: 1px solid #ddd; font-weight: ${isImportant ? 'bold' : 'normal'};">
${field}
</td>
<td style="padding: 12px; border: 1px solid #ddd; ${isImportant ? 'color: #c95454; font-weight: bold;' : ''}">
${value}
</td>
</tr>
`;
});
});
detailsBody.innerHTML = rows;
// Hide status table view and show vehicle details view
document.getElementById("statusTableView").style.display = "none";
document.getElementById("vehicleDetailsView").style.display = "block";
} catch (err) {
console.error('Error fetching vehicle details:', err.message);
showError('Error: ' + err.message, 'Fetch Error');
}
}
// Back to Status function
function backToStatus() {

// Hide vehicle details view and show status table view

document.getElementById("vehicleDetailsView").style.display = "none";

document.getElementById("statusTableView").style.display = "block";
}
// Close vehicle modal
function closeVehicleModal() {

const vehicleModal = document.getElementById('vehicle-modal');

const vehicleModalOverlay = document.getElementById('vehicle-modal-overlay');

const vehicleForm = document.getElementById('vehicle-form');

const vehicleSubmitBtn = document.getElementById('vehicle-submit-btn');

// Scroll modal content to top before closing
const modalContent = vehicleModal ? vehicleModal.querySelector('.modal-content') : null;
if (modalContent) {
  modalContent.scrollTop = 0;
}

if (vehicleModal) vehicleModal.style.display = 'none';

if (vehicleModalOverlay) vehicleModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

if (vehicleForm) {
  vehicleForm.reset();
  // Ensure plate field is enabled when closing modal
  const plateInput = document.getElementById('plate');
  if (plateInput) plateInput.disabled = false;
}

if (vehicleSubmitBtn) vehicleSubmitBtn.textContent = 'Save Vehicle';

editingVehiclePlate = null;
}
// Close trailer modal
function closeTrailerModal() {

const trailerModal = document.getElementById('trailer-modal');

const trailerModalOverlay = document.getElementById('trailer-modal-overlay');

const trailerForm = document.getElementById('trailer-form');

const trailerSubmitBtn = document.getElementById('trailer-submit-btn');

if (trailerModal) trailerModal.style.display = 'none';

if (trailerModalOverlay) trailerModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

if (trailerForm) trailerForm.reset();

if (trailerSubmitBtn) trailerSubmitBtn.textContent = 'Save Trailer';

editingTrailerPlate = null;
}
// Clear container form validation errors
function clearContainerFormErrors() {
const containerForm = document.getElementById('container-form');
if (!containerForm) return;
const inputs = containerForm.querySelectorAll('input, select');
inputs.forEach(input => {
input.classList.remove('error');
});
}
// Clear trailer form validation errors
function clearTrailerFormErrors() {

const trailerForm = document.getElementById('trailer-form');

if (!trailerForm) return;

const inputs = trailerForm.querySelectorAll('input, select');

inputs.forEach(input => {

input.classList.remove('error');

const errorDiv = input.parentNode.querySelector('.error-message');

if (errorDiv) {

errorDiv.remove();
}
});
}
// Close vehicle status modal
function closeStatusModal() {

const modal = document.getElementById('vehicle-status-modal');

const overlay = document.getElementById('vehicle-status-modal-overlay');

modal.style.display = 'none';

overlay.style.display = 'none';

document.body.style.overflow = 'auto';

document.getElementById('vehicle-status-form').reset();

editingStatusPlate = null;
}
// Close vehicle status modal (alias for closeVehicleStatusModal)
function closeVehicleStatusModal() {

const modal = document.getElementById('vehicle-status-modal');

const overlay = document.getElementById('vehicle-status-modal-overlay');

modal.style.display = 'none';

overlay.style.display = 'none';

document.body.style.overflow = 'auto';

document.getElementById('vehicle-status-form').reset();

// Clear O/R and C/R image previews and data

orImageFile = null;

crImageFile = null;

const orImagePreview = document.getElementById('or-image-preview');

const crImagePreview = document.getElementById('cr-image-preview');

if (orImagePreview) {

orImagePreview.innerHTML = '<span style="color: #666;">Click to upload O/R PDF</span>';

orImagePreview.classList.remove('has-image');

}

if (crImagePreview) {

crImagePreview.innerHTML = '<span style="color: #666;">Click to upload C/R PDF</span>';

crImagePreview.classList.remove('has-image');

}

// Clear pending document removal flags
window.pendingTruckDocumentRemoval = null;

editingStatusPlate = null;
}
// Save vehicle status
async function saveVehicleStatus(plate, registeredDate, expirationDate, noOfYears) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Validate dates
const regDate = new Date(registeredDate);
const expDate = new Date(expirationDate);
if (expDate <= regDate) {
showWarning('Expiration date must be after registered date', 'Date Validation Error');
return;
}
// Get vehicle information for the additional fields
const vehicle = allVehicles.find(v => v.plate === plate);
if (!vehicle) {
showWarning('Vehicle not found in registry', 'Not Found');
return;
}
const record = {
plate: plate,
truck_size: vehicle.size,
model: vehicle.model,
year: vehicle.year_model,
no_of_years: noOfYears ? parseInt(noOfYears) : null,
registered_date: registeredDate,
expiration_date: expirationDate
};
if (editingStatusPlate) {
// Update existing record
const { error } = await supabaseClient
.from('vehicle_status')
.update(record)
.eq('plate', plate);
if (error) throw error;
} else {
// Insert new record
const { error } = await supabaseClient
.from('vehicle_status')
.upsert([record], { onConflict: 'plate' });
if (error) throw error;
}
await loadVehicleStatus();
// Refresh Vehicle Status Summary
if (typeof window.statusModule !== 'undefined' && typeof window.statusModule.loadVehicleStatusSummary === 'function') {
  await window.statusModule.loadVehicleStatusSummary(selectedPlantFilter);
}
closeStatusModal();
showSuccess('Vehicle status saved successfully!', 'Success');
} catch (err) {
console.error('Error saving vehicle status:', err.message);
showError('Failed to save vehicle status', 'Error');
}
}
// Save truck data (driver, status, truck issue, and O/R C/R images)
async function saveTruckData(plate, driver, status, truckIssue = '', orImage = null, crImage = null, registrationDate = null, expirationDate = null, dateReported = null) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
console.log('saveTruckData - orImage:', orImage, 'crImage:', crImage, 'orImage instanceof File:', orImage instanceof File, 'crImage instanceof File:', crImage instanceof File);
try {
// Prepare update data for drivers_status table
const driverStatusData = { driver, status, truck_issue: truckIssue };
// Add date reported if provided (only when status is DOWN)
if (dateReported && status === 'DOWN') {
driverStatusData.date_reported = dateReported;
}
// Handle pending document removals (marked by X button clicks)
if (window.pendingTruckDocumentRemoval) {
if (window.pendingTruckDocumentRemoval.or === true) {
driverStatusData.or_image_url = null;
driverStatusData.or_image_name = null;
}
if (window.pendingTruckDocumentRemoval.cr === true) {
driverStatusData.cr_image_url = null;
driverStatusData.cr_image_name = null;
}
}
// Prepare update data for vehicle_status table
const vehicleStatusData = {};
// Add date fields if provided
if (registrationDate) {
vehicleStatusData.registered_date = registrationDate;
}
if (expirationDate) {
vehicleStatusData.expiration_date = expirationDate;
}
// Handle O/R PDF upload
if (orImage && orImage instanceof File) {
try {
const orFileName = `or_${plate}_${Date.now()}.pdf`;
const { data: orUploadData, error: orUploadError } = await supabaseClient.storage
.from('truck-documents')
.upload(orFileName, orImage, {
contentType: 'application/octet-stream', // Bypass MIME type restrictions
cacheControl: '3600',
upsert: false
});
if (orUploadError) throw orUploadError;
const { data: orPublicUrl } = supabaseClient.storage
.from('truck-documents')
.getPublicUrl(orFileName);
// O/R document functionality enabled
driverStatusData.or_image_url = orPublicUrl.publicUrl;
driverStatusData.or_image_name = orFileName;
console.log('O/R PDF uploaded successfully:', orFileName);
} catch (imgError) {
console.error('Error uploading O/R PDF:', imgError);
showWarning('Failed to upload O/R PDF', 'Upload Error');
}
}
// Handle C/R PDF upload
if (crImage && crImage instanceof File) {
try {
const crFileName = `cr_${plate}_${Date.now()}.pdf`;
const { data: crUploadData, error: crUploadError } = await supabaseClient.storage
.from('truck-documents')
.upload(crFileName, crImage, {
contentType: 'application/octet-stream', // Bypass MIME type restrictions
cacheControl: '3600',
upsert: false
});
if (crUploadError) throw crUploadError;
const { data: crPublicUrl } = supabaseClient.storage
.from('truck-documents')
.getPublicUrl(crFileName);
// C/R document functionality enabled
driverStatusData.cr_image_url = crPublicUrl.publicUrl;
driverStatusData.cr_image_name = crFileName;
console.log('C/R PDF uploaded successfully:', crFileName);
} catch (imgError) {
console.error('Error uploading C/R PDF:', imgError);
showWarning('Failed to upload C/R PDF', 'Upload Error');
}
}
// Save to drivers_status table
const { data: existingDriverRecord, error: driverCheckError } = await supabaseClient
.from('drivers_status')
.select('*')
.eq('plate', plate)
.single();
if (driverCheckError && driverCheckError.code !== 'PGRST116') throw driverCheckError;
if (existingDriverRecord) {
// Update existing driver status record
const { error: driverUpdateError } = await supabaseClient
.from('drivers_status')
.update(driverStatusData)
.eq('plate', plate);
if (driverUpdateError) throw driverUpdateError;
} else {
// Insert new driver status record
const { error: driverInsertError } = await supabaseClient
.from('drivers_status')
.insert({ plate, ...driverStatusData });
if (driverInsertError) throw driverInsertError;
}
// Clear pending removal flags after successful save
window.pendingTruckDocumentRemoval = null;
// Save to vehicle_status table if date data is provided
if (Object.keys(vehicleStatusData).length > 0) {
  // Validate date constraint: expiration_date must be greater than registered_date
  // Only validate if both dates are provided
  if (vehicleStatusData.registered_date && vehicleStatusData.expiration_date) {
    const regDate = new Date(vehicleStatusData.registered_date);
    const expDate = new Date(vehicleStatusData.expiration_date);
    
    if (expDate <= regDate) {
      throw new Error('Expiration date must be later than registration date');
    }
  } else if (vehicleStatusData.registered_date && !vehicleStatusData.expiration_date) {
    // If only registration date is provided, skip vehicle_status update
    console.log('Only registration date provided, skipping vehicle_status update');
    vehicleStatusData.registered_date = undefined;
    delete vehicleStatusData.registered_date;
  } else if (!vehicleStatusData.registered_date && vehicleStatusData.expiration_date) {
    // If only expiration date is provided, skip vehicle_status update
    console.log('Only expiration date provided, skipping vehicle_status update');
    vehicleStatusData.expiration_date = undefined;
    delete vehicleStatusData.expiration_date;
  }
  
  // Only proceed if we still have data to save
  if (Object.keys(vehicleStatusData).length > 0) {
const { data: existingVehicleRecord, error: vehicleCheckError } = await supabaseClient
.from('vehicle_status')
.select('*')
.eq('plate', plate)
.single();
if (vehicleCheckError && vehicleCheckError.code !== 'PGRST116') throw vehicleCheckError;
if (existingVehicleRecord) {
// Update existing vehicle status record
const { error: vehicleUpdateError } = await supabaseClient
.from('vehicle_status')
.update(vehicleStatusData)
.eq('plate', plate);
if (vehicleUpdateError) throw vehicleUpdateError;
} else {
// Insert new vehicle status record
const { error: vehicleInsertError } = await supabaseClient
.from('vehicle_status')
.insert({ plate, ...vehicleStatusData });
if (vehicleInsertError) throw vehicleInsertError;
}
  } else {
    console.log('No valid date data to save to vehicle_status table');
  }
}
// Reload data to refresh tables
await loadVehicleStatus();
// Refresh Vehicle Status Summary
if (typeof window.statusModule !== 'undefined' && typeof window.statusModule.loadVehicleStatusSummary === 'function') {
  await window.statusModule.loadVehicleStatusSummary(selectedPlantFilter);
}
// Only refresh O/R table if vehicle_status data was actually changed
if (Object.keys(vehicleStatusData).length > 0 && 
    (vehicleStatusData.registered_date || vehicleStatusData.expiration_date)) {
  await loadOfficialReceiptData(); // Refresh O/R table only when dates are actually saved
}
// Refresh the current vehicle's PDF display if we have the same plate
if (editingStatusPlate) {
const { data: updatedDriverStatus } = await supabaseClient
.from('drivers_status')
.select('*')
.eq('plate', editingStatusPlate)
.single();
if (updatedDriverStatus) {
// Update O/R PDF display
// O/R document functionality disabled - column doesn't exist in database
if (false) {
const orFileName = updatedDriverStatus.or_image_name || 'O/R PDF';
const orImagePreview = document.getElementById('or-image-preview');
orImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px; position: relative; cursor: pointer;"
/* onclick="viewOrImage('${editingStatusPlate}', '${updatedDriverStatus.or_image_url}')" */ // Disabled - column doesn't exist
title="Click to view: ${orFileName}">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666;" title="${orFileName}">${orFileName}</div>
<button type="button" class="remove-image" onclick="removeOrImage(event)" title="Remove: ${orFileName}" style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">Ã—</button>
</div>
`;
orImagePreview.classList.add('has-image');
}
// Update C/R PDF display
// C/R document functionality disabled - column doesn't exist in database
if (false) {
const crFileName = updatedDriverStatus.cr_image_name || 'C/R PDF';
const crImagePreview = document.getElementById('cr-image-preview');
crImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px; position: relative; cursor: pointer;"
// onclick="viewCrImage('${editingStatusPlate}', '${updatedDriverStatus.cr_image_url}')" // Disabled - column doesn't exist
title="Click to view: ${crFileName}">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666;" title="${crFileName}">${crFileName}</div>
<button type="button" class="remove-image" onclick="removeCrImage(event)" title="Remove: ${crFileName}" style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">Ã—</button>
</div>
`;
crImagePreview.classList.add('has-image');
}
}
}
closeStatusModal();
showSuccess('Truck data saved successfully!', 'Success');
// Reload truck data to refresh table
setTimeout(() => loadVehicles(), 500);
} catch (err) {
console.error('Error saving truck data:', err.message);
showError('Failed to save truck data', 'Error');
}
}
// ============ Repair Functions ============
let repairRecords = [];
async function loadRepairs() {
if (!supabaseClient) {
console.error('Supabase not initialized');
// Don't filter here - let setRepairFilter handle it
return;
}
try {
const { data, error } = await supabaseClient
.from('vehicle_repairs')
.select('*')
.order('date_reported', { ascending: false });
if (error) throw error;
repairRecords = data || [];
// Don't filter here - let setRepairFilter handle it
} catch (err) {
console.error('Error loading repair records:', err.message);
// Don't filter here - let setRepairFilter handle it
}
}
async function addRepairRecord(dateReported, plate, truckIssue, inCharge) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Check for duplicate repair records
const { data: existingRepair, error: repairError } = await supabaseClient
.from('vehicle_repairs')
.select('ir_no')
.eq('plate', plate)
.eq('date_reported', dateReported)
.eq('truck_issue', truckIssue)
.limit(1);

if (repairError) throw repairError;
if (existingRepair && existingRepair.length > 0) {
showError('A repair record for this vehicle with the same issue and date already exists!', 'Duplicate Error');
return;
}

const { data, error } = await supabaseClient
.from('vehicle_repairs')
.insert([{ ir_no: 'IR-' + Date.now(), date_reported: dateReported, plate: plate, truck_issue: truckIssue, in_charge: inCharge }]);
if (error) throw error;
showSuccess('Repair report submitted successfully!', 'Success');
await loadRepairs();
} catch (err) {
console.error('Error adding repair record:', err.message);
showError('Error saving repair record: ' + err.message, 'Save Error');
}
}
async function deleteRepairRecord(irNo) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
// Set up confirmation handlers
window.confirmOk = async function() {
try {
const { error } = await supabaseClient
.from('vehicle_repairs')
.delete()
.eq('ir_no', irNo);
if (error) throw error;
showSuccess('Repair record deleted successfully', 'Success');
await loadRepairs();
} catch (err) {
console.error('Error deleting repair record:', err.message);
showError('Error deleting repair record: ' + err.message, 'Delete Error');
}
};
window.confirmCancel = function() {
// Do nothing on cancel
};
showConfirm('Are you sure you want to delete this repair report?', 'Confirm Delete', 'confirmOk', 'confirmCancel');
}

// Function to set repair filter and update UI
function setRepairFilter(filterType) {
// Update button states immediately
const buttons = document.querySelectorAll('#repair-view .registry-filter-btn');
buttons.forEach(btn => {
btn.classList.remove('active');
if (btn.dataset.filter === filterType) {
btn.classList.add('active');
}
});

// Update plant filter state based on tab type
let currentPlantFilter = null;
switch(filterType) {
  case 'truck':
    currentPlantFilter = truckPlantFilter;
    break;
  case 'trailer':
    currentPlantFilter = trailerPlantFilter;
    break;
  case 'container':
    currentPlantFilter = containerPlantFilter;
    break;
  default:
    currentPlantFilter = truckPlantFilter;
}

// Update global filter for backward compatibility
selectedPlantFilter = currentPlantFilter;

// Update plant counts with the new tab type
loadPlantCounts('repair', filterType);

// Update title based on filter
const repairTitle = document.querySelector('#repair-view .recentVehicles .cardHeader h2');
if (repairTitle) {
if (filterType === 'trailer') {
repairTitle.textContent = 'Trailer Repair Report';
} else if (filterType === 'container') {
repairTitle.textContent = 'Container Repair Report';
} else {
repairTitle.textContent = 'Vehicle Repair Report';
}
}

// Trigger existing filterRepairTable function immediately (no delay)
filterRepairTable(filterType);
}

// Filter repair table by vehicle type
function filterRepairTable(vehicleType) {
    // Get table elements
    const truckTable = document.getElementById('repair-truck-table');
    const trailerTable = document.getElementById('repair-trailer-table');
    const containerTable = document.getElementById('repair-container-table');
    const truckTbody = truckTable ? truckTable.querySelector('tbody') : null;
    const trailerTbody = trailerTable ? trailerTable.querySelector('tbody') : null;
    const containerTbody = containerTable ? containerTable.querySelector('tbody') : null;
    
    if (!truckTbody || !trailerTbody || !containerTbody) return;

    // Note: Button styles are already handled by setRepairFilter function

    // Check if user is admin (guest view if not)
    const isAdmin = window.authSystem && window.authSystem.isAdmin();

    // Use vehicle status data from Status section
    const selectedPlant = selectedPlantFilter;

    // Filter vehicles by selected plant, Down status, and vehicle type
    let filteredVehicles = selectedPlant
        ? vehicleStatusRecords.filter(vehicle => {
            return vehicle.plant === selectedPlant && (
                vehicle.status === 'Down' ||
                vehicle.status === 'DOWN' ||
                vehicle.status === 'down' ||
                vehicle.status === 'Repair' ||
                vehicle.status === 'Maintenance' ||
                vehicle.status === 'Out of Service' ||
                vehicle.status === 'Unavailable'
            );
        })
        : vehicleStatusRecords.filter(vehicle =>
            vehicle.status === 'Down' ||
            vehicle.status === 'DOWN' ||
            vehicle.status === 'down' ||
            vehicle.status === 'Repair' ||
            vehicle.status === 'Maintenance' ||
            vehicle.status === 'Out of Service' ||
            vehicle.status === 'Unavailable'
        );

    // Show/hide appropriate tables BEFORE loading data
    if (vehicleType === 'trailer') {
        truckTable.style.display = 'none';
        trailerTable.style.display = 'table';
        containerTable.style.display = 'none';
        // Show loading state immediately
        trailerTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">Loading...</td></tr>';
        // For trailers, load from trailer_registry table instead of vehicleStatusRecords
        loadTrailerDataForRepair(selectedPlantFilter);
        return; // Exit early since we handle trailers separately
    } else if (vehicleType === 'container') {
        truckTable.style.display = 'none';
        trailerTable.style.display = 'none';
        containerTable.style.display = 'table';
        // Show loading state immediately
        containerTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">Loading...</td></tr>';
        // For containers, load from containers table instead of vehicleStatusRecords
        loadContainerDataForRepair(selectedPlantFilter);
        return; // Exit early since we handle containers separately
    } else {
        truckTable.style.display = 'table';
        trailerTable.style.display = 'none';
        containerTable.style.display = 'none';
    }

    // Further filter by vehicle type (skip filtering for 'all')
    if (vehicleType !== 'all') {
        filteredVehicles = filteredVehicles.filter(vehicle => {
            // Prioritize vehicle_type field for categorization
            const vehicleTypeField = (vehicle.vehicle_type || '').toLowerCase();
            const sizeField = (vehicle.size || '').toLowerCase();

            // Map vehicle type to filter criteria based on actual vehicle_type field
            if (vehicleType === 'truck') {
                // Trucks: vehicle_type must be 'truck' (case-insensitive) OR not 'trailer'/'container'
                return vehicleTypeField === 'truck' ||
                      (vehicleTypeField !== 'trailer' && vehicleTypeField !== 'container' && !sizeField.includes('ft'));
            }
            return true;
        });
    }

    // Clear all table bodies
    truckTbody.innerHTML = '';
    trailerTbody.innerHTML = '';
    containerTbody.innerHTML = '';
    
    // Determine which table to populate
    let targetTbody, colspan;
    if (vehicleType === 'trailer') {
        targetTbody = trailerTbody;
        colspan = 6; // Trailer has 6 columns
    } else if (vehicleType === 'container') {
        targetTbody = containerTbody;
        colspan = 6; // Container has 6 columns
    } else {
        targetTbody = truckTbody;
        colspan = 7; // Truck has 7 columns
    }
    
    // Show empty state if no records
    if (filteredVehicles.length === 0) {
        targetTbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666;">
                    No ${vehicleType} vehicles found for ${selectedPlantFilter ? selectedPlantFilter : 'the selected plant'}.
                </td>
            </tr>
        `;
    } else {
        if (vehicleType === 'trailer') {
            // Populate trailer table with trailer-specific format
            targetTbody.innerHTML = filteredVehicles.map(vehicle => {
                // Map status values to colors for consistency
                const statusColor = {
                    'OPERATIONAL': 'green',
                    'OPERATIONAL/HUSTLING': 'blue',
                    'DOWN': 'red',
                    'Down': 'red',
                    'down': 'red',
                    'TOTALLY DOWN': 'brown'
                }[vehicle.status] || 'black';

                return `
                    <tr>
                        <td>${vehicle.plate || 'N/A'}</td>
                        <td>${vehicle.chassi_no || 'N/A'}</td>
                        <td>${vehicle.vehicle_type || vehicle.size || 'N/A'}</td>
                        <td>${vehicle.trailer_issue || vehicle.truck_issue || '-'}</td>
                        <td>${vehicle.date_reported || '-'}</td>
                        <td><span style="color: ${statusColor}; font-weight: 600;">${vehicle.status || 'N/A'}</span></td>
                    </tr>
                `;
            }).join('');
        } else if (vehicleType === 'container') {
            // Populate container table with container-specific format
            targetTbody.innerHTML = filteredVehicles.map(vehicle => {
                // Map status values to colors for consistency
                const statusColor = {
                    'OPERATIONAL': 'green',
                    'OPERATIONAL/HUSTLING': 'blue',
                    'DOWN': 'red',
                    'Down': 'red',
                    'down': 'red',
                    'TOTALLY DOWN': 'brown'
                }[vehicle.status] || 'black';

                return `
                    <tr>
                        <td>${vehicle.chassi_no || 'N/A'}</td>
                        <td>${vehicle.plate || 'N/A'}</td>
                        <td>${vehicle.size || 'N/A'}</td>
                        <td>${vehicle.truck_issue || '-'}</td>
                        <td>${vehicle.date_reported || '-'}</td>
                        <td><span style="color: ${statusColor}; font-weight: 600;">${vehicle.status || 'N/A'}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            // Populate truck table with truck format
            targetTbody.innerHTML = filteredVehicles.map(vehicle => {
                // Map status values to colors for consistency (same as Status table)
                const statusColor = {
                    'OPERATIONAL': 'green',
                    'OPERATIONAL/HUSTLING': 'blue',
                    'DOWN': 'red',
                    'Down': 'red',
                    'down': 'red',
                    'TOTALLY DOWN': 'brown'
                }[vehicle.status] || 'black';

                // Format date to "Month Day Year" format
                let dateReported = vehicle.date_reported || '-';
                if (dateReported !== '-' && dateReported) {
                  try {
                    const date = new Date(dateReported);
                    if (!isNaN(date.getTime())) {
                      const options = { month: 'short', day: 'numeric', year: 'numeric' };
                      dateReported = date.toLocaleDateString('en-US', options);
                    }
                  } catch (e) {
                    dateReported = '-';
                  }
                }

                return `
                    <tr>
                        <td>${vehicle.plate || 'N/A'}</td>
                        <td>${vehicle.vehicle_type || vehicle.size || 'N/A'}</td>
                        <td>${vehicle.model || 'N/A'}</td>
                        <td>${vehicle.driver || 'N/A'}</td>
                        <td>${vehicle.truck_issue || '-'}</td>
                        <td>${dateReported}</td>
                        <td><span style="color: ${statusColor}; font-weight: 600;">${vehicle.status || 'N/A'}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// Update repair button styles to reflect active filter (like vehicle registry)
function updateRepairButtonStyles(activeFilter) {
    // Update button states using CSS classes like vehicle registry
    const buttons = document.querySelectorAll('.registry-filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === activeFilter) {
            btn.classList.add('active');
        }
    });
}
// ============ Truck Gallery Functions ============
let currentTruckImages = [];
let currentImageIndex = 0;
let currentPlateNumber = '';
// Open truck gallery modal
function openTruckGallery(plateNumber, images) {

currentPlateNumber = plateNumber;

currentTruckImages = images.filter(img => img !== null && img !== undefined && img !== '');

currentImageIndex = 0;

if (currentTruckImages.length === 0) {

showWarning('No images available for this truck', 'No Images');

return;
}
const modal = document.getElementById('truck-gallery-modal');
const modalImage = document.getElementById('modal-image');
const modalPlate = document.getElementById('modal-plate');
const modalCounter = document.getElementById('modal-counter');
const modalThumbnails = document.getElementById('modal-thumbnails');
// Set main image and info
modalImage.src = currentTruckImages[currentImageIndex];
modalPlate.textContent = plateNumber;
updateImageCounter();
// Generate thumbnails
generateThumbnails();
// Show modal with enhanced animation
modal.classList.remove('hiding');
modal.classList.add('showing');
modal.style.display = 'block';
document.body.style.overflow = 'hidden';
// Add keyboard navigation
document.addEventListener('keydown', handleGalleryKeyboard);
// Add touch/swipe support
setupSwipeGestures();
}
// Close truck gallery modal
function closeTruckGallery() {

const modal = document.getElementById('truck-gallery-modal');

// Add hiding animation

modal.classList.remove('showing');

modal.classList.add('hiding');

// Hide after animation completes

setTimeout(() => {

modal.style.display = 'none';

modal.classList.remove('hiding');

}, 300);

document.body.style.overflow = 'auto';

// Remove keyboard navigation

document.removeEventListener('keydown', handleGalleryKeyboard);

// Remove touch event listeners

const modalImageContainer = document.querySelector('.modal-image-container');

if (modalImageContainer) {

modalImageContainer.removeEventListener('touchstart', handleTouchStart);

modalImageContainer.removeEventListener('touchend', handleTouchEnd);

modalImageContainer.removeEventListener('touchmove', handleTouchMove);
}
}
// Generate thumbnail navigation
function generateThumbnails() {

const modalThumbnails = document.getElementById('modal-thumbnails');

if (!modalThumbnails || currentTruckImages.length === 0) return;

// Clear existing thumbnails

modalThumbnails.innerHTML = '';

// Create thumbnail elements

currentTruckImages.forEach((imageUrl, index) => {

const thumbnail = document.createElement('div');

thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;

thumbnail.onclick = () => goToImage(index);

const img = document.createElement('img');

img.src = imageUrl;

img.alt = `Truck Image ${index + 1}`;

img.onerror = () => {

img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNDQ0MiIHN0cm9rZT0iIzk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';

};

thumbnail.appendChild(img);

modalThumbnails.appendChild(thumbnail);

});
}
// Go to specific image by index
function goToImage(index) {

if (index < 0 || index >= currentTruckImages.length) return;

currentImageIndex = index;

const modalImage = document.getElementById('modal-image');

// Add fade effect

modalImage.style.transform = 'scale(0.95)';

modalImage.style.opacity = '0.7';

setTimeout(() => {

modalImage.src = currentTruckImages[currentImageIndex];

modalImage.style.transform = 'scale(1)';

modalImage.style.opacity = '1';

updateImageCounter();

updateThumbnailSelection();

}, 150);
}
// Update thumbnail selection
function updateThumbnailSelection() {

const thumbnails = document.querySelectorAll('.thumbnail');

thumbnails.forEach((thumbnail, index) => {

thumbnail.classList.toggle('active', index === currentImageIndex);

});

// Scroll thumbnail into view if needed

const activeThumbnail = thumbnails[currentImageIndex];

if (activeThumbnail) {

activeThumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
}
// Update image counter
function updateImageCounter() {

const modalCounter = document.getElementById('modal-counter');

if (modalCounter) {

modalCounter.textContent = `${currentImageIndex + 1} / ${currentTruckImages.length}`;
}
}
// Handle keyboard navigation
function handleGalleryKeyboard(e) {

if (e.key === 'ArrowLeft') {

navigateImage(-1);

} else if (e.key === 'ArrowRight') {

navigateImage(1);

} else if (e.key === 'Escape') {

closeTruckGallery();
}
}
// Delete all images for a truck
async function deleteTruckImages(plate) {
if (!confirm(`Are you sure you want to delete ALL images for ${plate}? This action cannot be undone.`)) {
return;
}

try {
await supabaseWithAuth(async () => {
// Get the truck data to update
const { data: truckData, error: truckError } = await supabaseClient
.from('vehicle_registry')
.select('truck_images')
.eq('plate', plate)
.single();

if (truckError) {
console.error('Error fetching truck data:', truckError);
throw truckError;
}

// Delete all images from storage
let imagesToDelete = [];
if (truckData.truck_images) {
try {
const images = Array.isArray(truckData.truck_images) ? truckData.truck_images : JSON.parse(truckData.truck_images);
imagesToDelete = images.map(img => img.split('/').pop());
} catch (e) {
console.error('Error parsing truck_images:', e);
}
}

if (imagesToDelete.length > 0) {
const { error: storageError } = await supabaseClient
.storage
.from('truck-images')
.remove(imagesToDelete);

if (storageError) {
console.error('Storage delete error:', storageError);
throw storageError;
}
}

// Update truck record to clear images array
const { error: updateError } = await supabaseClient
.from('vehicle_registry')
.update({ truck_images: JSON.stringify([]) })
.eq('plate', plate);

if (updateError) {
console.error('Error updating truck images:', updateError);
throw updateError;
}

showSuccess(`All images deleted for ${plate}`, 'Success');
loadTruckImages(); // Refresh the gallery
});
} catch (error) {
console.error('Error deleting truck images:', error);
showError('Failed to delete images: ' + error.message, 'Delete Error');
}
}

// Open C/R Action Modal for uploading or managing C/R documents
function openCrActionModal(plate) {
// For now, open the existing C/R image modal
// In the future, this could be expanded to show upload options
const modal = document.getElementById('cr-image-modal');
const overlay = document.getElementById('cr-image-modal-overlay');
const modalImage = document.getElementById('cr-modal-image');
const modalTitle = document.getElementById('cr-modal-title');

if (modal && overlay) {
// Set title to show which truck's C/R we're managing
if (modalTitle) {
modalTitle.textContent = `C/R Document - ${plate}`;
}
// Clear any existing image
if (modalImage) {
modalImage.src = '';
modalImage.style.display = 'none';
}
modal.style.display = 'block';
overlay.style.display = 'block';

// Store the current plate for potential upload functionality
window.currentCrPlate = plate;
}
}

// Delete current truck image
async function deleteCurrentImage() {
if (!currentTruckImages || currentTruckImages.length === 0) {
showError('No images to delete', 'Error');
return;
}

if (currentImageIndex < 0 || currentImageIndex >= currentTruckImages.length) {
showError('Please select a valid image to delete', 'Error');
return;
}

const currentImage = currentTruckImages[currentImageIndex];
const plateNumber = currentTruckImagesPlate;

if (!confirm(`Are you sure you want to delete this image for ${plateNumber}?`)) {
return;
}

try {
await supabaseWithAuth(async () => {
// Delete from storage
const imagePath = currentImage.split('/').pop();
const { error: storageError } = await supabaseClient
.storage
.from('truck-images')
.remove([imagePath]);

if (storageError) {
console.error('Storage delete error:', storageError);
throw storageError;
}

// Get the truck data to update the images array
const { data: truckData, error: truckError } = await supabaseClient
.from('vehicle_registry')
.select('truck_images')
.eq('plate', plateNumber)
.single();

if (truckError) {
console.error('Error fetching truck data:', truckError);
throw truckError;
}

// Remove the image from the truck_images array
let updatedImages = [];
if (truckData.truck_images) {
try {
updatedImages = Array.isArray(truckData.truck_images) ? truckData.truck_images : JSON.parse(truckData.truck_images);
} catch (e) {
console.error('Error parsing truck_images:', e);
updatedImages = [];
}
}

// Filter out the deleted image
updatedImages = updatedImages.filter(img => {
const imgPath = img.split('/').pop();
return imgPath !== imagePath;
});

// Update the truck record with new images array
const { error: updateError } = await supabaseClient
.from('vehicle_registry')
.update({ truck_images: JSON.stringify(updatedImages) })
.eq('plate', plateNumber);

if (updateError) {
console.error('Error updating truck images:', updateError);
throw updateError;
}

// Update local arrays
currentTruckImages = updatedImages;
currentTruckImagesPlate = plateNumber;

// Adjust current index if necessary
if (currentImageIndex >= currentTruckImages.length) {
currentImageIndex = currentTruckImages.length - 1;
}

// Update modal display
if (currentTruckImages.length === 0) {
closeTruckGallery();
showSuccess('All images deleted successfully', 'Success');
} else {
updateModalDisplay();
showSuccess('Image deleted successfully', 'Success');
}

// Refresh the truck gallery to show updated images
loadTruckImages();
});
} catch (error) {
console.error('Error deleting image:', error);
showError('Failed to delete image: ' + error.message, 'Delete Error');
}
}

// Navigate to specific image by index
function navigateImage(direction) {

if (direction < 0) {

goToImage(currentImageIndex - 1);

} else if (direction > 0) {

goToImage(currentImageIndex + 1);
}
}
// Setup swipe gestures for touch navigation
function setupSwipeGestures() {

const modalImageContainer = document.querySelector('.modal-image-container');

if (!modalImageContainer) return;

let touchStartX = 0;

let touchEndX = 0;

modalImageContainer.addEventListener('touchstart', (e) => {

touchStartX = e.changedTouches[0].screenX;

});

modalImageContainer.addEventListener('touchend', (e) => {

touchEndX = e.changedTouches[0].screenX;

const swipeThreshold = 50;

const diff = touchStartX - touchEndX;

if (Math.abs(diff) > swipeThreshold) {

if (diff > 0) {

// Swipe left - go to next image

navigateImage(1);

} else {

// Swipe right - go to previous image

navigateImage(-1);
}
}
});
}
// Touch event handlers (for compatibility with existing code)
function handleTouchStart(e) {

// Touch start handler - can be used for additional touch interactions
}
function handleTouchEnd(e) {

// Touch end handler - can be used for additional touch interactions
}
function handleTouchMove(e) {

// Touch move handler - can be used for additional touch interactions
}
// Display truck gallery with modern card layout
function displayTruckGallery(vehicles) {

const grid = document.querySelector('#truck-gallery-grid');

if (!grid) return;

console.log('displayTruckGallery called with', vehicles.length, 'vehicles');

// Filter vehicles by selected plant
const selectedPlant = plantStateManager.getSelectedPlant();

console.log('Selected plant:', selectedPlant);

const filteredVehicles = selectedPlant
? vehicles.filter(v => {
// Check plant field based on vehicle type
if (v.vehicle_type === 'trailer') {
return v.location_plant === selectedPlant;
} else if (v.vehicle_type === 'container') {
return v.plant === selectedPlant;
} else {
return v.plant === selectedPlant;
}
})
: vehicles;

console.log('Filtered vehicles:', filteredVehicles.length);

if (!filteredVehicles || filteredVehicles.length === 0) {

const plantName = plantStateManager.getPlantDisplayName(selectedPlant);

let vehicleTypeText = 'trucks';

if (selectedTruckImagesType === 'trailer') {

vehicleTypeText = 'trailers';

} else if (selectedTruckImagesType === 'container') {

vehicleTypeText = 'containers';
}
const message = selectedPlant
? `No ${vehicleTypeText} found for ${plantName}`
: `No ${vehicleTypeText} found across all plants`;
const subMessage = selectedPlant
? `Try selecting a different plant or add ${vehicleTypeText} to Vehicle Registry.`
: `Add ${vehicleTypeText} images using the button above to see them here.`;
grid.innerHTML = `
<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666; background: #f9f9f9; border-radius: 20px; border: 2px dashed #ddd;">
<div style="font-size: 4rem; margin-bottom: 16px;"></div>
<div style="font-size: 1.3rem; font-weight: 600; margin-bottom: 8px;">${message}</div>
<div style="font-size: 1rem;">${subMessage}</div>
</div>
`;
return;
}
// Create truck cards
const cards = filteredVehicles.map(v => {
// Get all available images for this vehicle
const images = [
v.image1_url, v.image2_url, v.image3_url, v.image4_url
].filter(img => img !== null && img !== undefined && img !== '');
if (images.length === 0) {
// Show placeholder for vehicles without images
const iconClass = v.vehicle_type === 'trailer' ? 'fa-trailer' : v.vehicle_type === 'container' ? 'fa-box' : 'fa-truck';
return `
<div class="truck-card" style="cursor: default;">
<div class="truck-card-image-container" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
<div style="text-align: center; color: #999;">
<i class="fas ${iconClass}" style="font-size: 3rem; margin-bottom: 10px;"></i>
<div style="font-size: 0.9rem;">No Images</div>
</div>
</div>
<div class="truck-card-plate-section">
<div class="truck-plate-badge">${v.plate}</div>
</div>
</div>
`;
}
// Use only the first image for the card
const firstImage = images[0];
return `
<div class="truck-card" onclick="openTruckGallery('${v.plate}', ${JSON.stringify(images).replace(/"/g, '&quot;')})">
<div class="truck-card-image-container">
<img src="${firstImage}" alt="${v.plate}" class="truck-card-image">
<button class="truck-card-delete-btn auth-required" onclick="event.stopPropagation(); deleteTruckImages('${v.plate}')" title="Delete Truck Images">
<i class="fas fa-trash"></i>
</button>
</div>
<div class="truck-card-plate-section">
<div class="truck-plate-badge">${v.plate}</div>
</div>
</div>
`;
}).filter(card => card !== null);
if (cards.length === 0) {
grid.innerHTML = `
<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666; background: #f9f9f9; border-radius: 20px; border: 2px dashed #ddd;">
<div style="font-size: 4rem; margin-bottom: 16px;">ðŸ“¸</div>
<div style="font-size: 1.3rem; font-weight: 600; margin-bottom: 8px;">No truck images found</div>
<div style="font-size: 1rem;">Add truck images using the button above to see them here.</div>
</div>
`;
return;
}
grid.innerHTML = cards.join('');

// Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
if (window.updateCrudVisibility) {
  window.updateCrudVisibility();
}
}
// ============ Truck Images Functions ============
// Load truck images from vehicles table
async function loadTruckImages(plantFilter = selectedPlantFilter, vehicleTypeFilter = null) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
let vehiclesWithImages = [];
if (vehicleTypeFilter === 'trailer') {
// Load from trailer_registry table
let query = supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
// Apply plant filter if specified
if (plantFilter) {
query = query.eq('location_plant', plantFilter);
}
const { data: trailers, error } = await query;
if (error) {
console.error('Error loading trailers:', error.message);
displayTruckImagesWithMessage('Unable to load trailer images. Check console for details.');
return;
}
// Filter trailers that have at least one image URL
vehiclesWithImages = (trailers || []).filter(t =>
t.image1_url || t.image2_url || t.image3_url || t.image4_url
).map(t => ({
...t,
plate: t.plate_no,
vehicle_type: 'trailer'
}));
} else if (vehicleTypeFilter === 'container') {
// Load from containers table
let query = supabaseClient
.from('containers')
.select('*')
.order('container', { ascending: true });
// Apply plant filter if specified
if (plantFilter) {
query = query.eq('plant', plantFilter);
}
const { data: containers, error } = await query;
if (error) {
console.error('Error loading containers:', error.message);
displayTruckImagesWithMessage('Unable to load container images. Check console for details.');
return;
}
// Filter containers that have at least one image URL
vehiclesWithImages = (containers || []).filter(c =>
c.image1_url || c.image2_url || c.image3_url || c.image4_url
).map(c => ({
...c,
plate: c.container,
vehicle_type: 'container'
}));
} else {
// Load from vehicle_registry table (trucks)
let query = supabaseClient
.from('vehicle_registry')
.select('*')
.order('plate', { ascending: true });
// Apply plant filter if specified (only for trucks)
if (plantFilter) {
query = query.eq('plant', plantFilter);
}
const { data: vehicles, error } = await query;
if (error) {
console.error('Error loading vehicles:', error.message);
displayTruckImagesWithMessage('Unable to load truck images. Check console for details.');
return;
}
// Filter vehicles that have at least one image URL
vehiclesWithImages = (vehicles || []).filter(v =>
v.image1_url || v.image2_url || v.image3_url || v.image4_url
).map(v => ({
...v,
vehicle_type: 'truck'
}));
}
// Use the new gallery display function
displayTruckGallery(vehiclesWithImages);
} catch (err) {
console.error('Error loading truck images:', err.message);
displayTruckImagesWithMessage('Error loading truck images. Please ensure the vehicles table has image columns.');
}
}
// Upload images to Supabase Storage
async function uploadTruckImages(plateNumber, files) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return [];
}
const imageUrls = [];
for (let i = 0; i < files.length; i++) {
if (!files[i]) {
imageUrls.push(null);
continue;
}
try {
const file = files[i];
const fileName = `image${i + 1}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
const filePath = `trucks/${plateNumber}/${fileName}`;
const { data, error: uploadError } = await supabaseClient.storage
.from('vehicles')
.upload(filePath, file, { upsert: true });
if (uploadError) throw uploadError;
const { data: urlData } = supabaseClient.storage
.from('vehicles')
.getPublicUrl(filePath);
imageUrls.push(urlData.publicUrl);
} catch (err) {
console.error(`Error uploading image ${i + 1}:`, err.message);
imageUrls.push(null);
}
}
return imageUrls;
}
// Save truck images to vehicles table
async function saveTruckImages(plateNumber, imageUrls) {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
const updateObj = {
image1_url: imageUrls[0] || null,
image2_url: imageUrls[1] || null,
image3_url: imageUrls[2] || null,
image4_url: imageUrls[3] || null
};
let table, column;
if (selectedTruckImagesType === 'trailer') {
table = 'trailer_registry';
column = 'plate_no';
} else if (selectedTruckImagesType === 'container') {
table = 'containers';
column = 'container';
} else {
table = 'vehicle_registry';
column = 'plate';
}
const { error } = await supabaseClient
.from(table)
.update(updateObj)
.eq(column, plateNumber);
if (error) {
if (error.message && error.message.includes('image1_url')) {
throw new Error(
`The ${table} table is missing image columns. ` +
`Please add these columns to your Supabase ${table} table:\n` +
'- image1_url (text)\n' +
'- image2_url (text)\n' +
'- image3_url (text)\n' +
'- image4_url (text)\n\n' +
'See console for detailed error information.'
);
}
throw error;
}
} catch (err) {
console.error(`Error saving ${selectedTruckImagesType} images:`, err.message);
throw err;
}
}
// Display truck images in responsive grid
function displayTruckImages(vehicles) {

const grid = document.querySelector('#truck-images-grid');

if (!grid) return;

if (!vehicles || vehicles.length === 0) {

const plantName = selectedPlantFilter || 'All Plants';

let vehicleTypeText = 'trucks';

let vehicleTypeTextCaps = 'Trucks';

if (selectedTruckImagesType === 'trailer') {

vehicleTypeText = 'trailers';

vehicleTypeTextCaps = 'Trailers';

} else if (selectedTruckImagesType === 'container') {

vehicleTypeText = 'containers';

vehicleTypeTextCaps = 'Containers';
}
const message = selectedPlantFilter
? `No ${vehicleTypeText} found for ${plantName}`
: `No ${vehicleTypeText} found across all plants`;
const subMessage = selectedPlantFilter
? `Try selecting a different plant or add ${vehicleTypeText} to the Vehicle Registry.`
: `Add ${vehicleTypeText} images using the button above to see them here.`;
grid.innerHTML = `
<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #666; background: #f9f9f9; border-radius: 12px; border: 2px dashed #ddd;">
<div style="font-size: 3rem; margin-bottom: 10px;"></div>
<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 5px;">${message}</div>
<div style="font-size: 0.9rem;">${subMessage}</div>
</div>
`;
return;
}
// Create image elements for each vehicle with images
const elements = vehicles.map(v => {
// Get all available images for this vehicle
const images = [
v.image1_url, v.image2_url, v.image3_url, v.image4_url
];
// Create image elements HTML (horizontal layout)
const imageElements = images.map((url, index) => {
if (!url) return `<div class="image-item empty"></div>`;
return `
<div class="image-item">
<img src="${url}" alt="Image ${index + 1} - ${v.plate}" onclick="openTruckImageModal('${url}', 'Image ${index + 1} - ${v.plate}')">
</div>
`;
}).join('');
return `
<div class="truck-vehicle-section">
<div class="truck-images-horizontal">
${imageElements}
</div>
<div class="truck-plate-number">${v.plate}</div>
</div>
`;
}).filter(element => element !== null); // Remove null entries
grid.innerHTML = elements.join('');
}
// Display message in grid (for errors/status)
function displayTruckImagesWithMessage(message) {

const grid = document.querySelector('#truck-images-grid');

if (!grid) return;

grid.innerHTML = `

<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #d32f2f; background: #ffebee; border-radius: 12px; border: 2px dashed #d32f2f;">

<div style="font-size: 3rem; margin-bottom: 10px;">âš ï¸</div>

<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px;">Unable to load truck images</div>

<div style="font-size: 0.9rem; line-height: 1.4;">${message}</div>

</div>

`;
}
// Open image modal
function openTruckImageModal(imageUrl, title) {

const modal = document.createElement('div');

modal.className = 'truck-image-modal';

modal.innerHTML = `

<div class="truck-image-modal-content">

<button onclick="this.closest('.truck-image-modal').remove()">Ã—</button>

<h3 style="margin: 0 0 10px 0;">${title}</h3>

<img src="${imageUrl}">

</div>

`;

document.body.appendChild(modal);
}
// Delete truck images
async function deleteTruckImages(plateNumber) {
// Set up confirmation handlers
window.confirmOk = async function() {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
let table, column;
if (selectedTruckImagesType === 'trailer') {
table = 'trailer_registry';
column = 'plate_no';
} else if (selectedTruckImagesType === 'container') {
table = 'containers';
column = 'container';
} else {
table = 'vehicle_registry';
column = 'plate';
}
const { error } = await supabaseClient
.from(table)
.update({
image1_url: null,
image2_url: null,
image3_url: null,
image4_url: null
})
.eq(column, plateNumber);
if (error) {
if (error.message && error.message.includes('image')) {
showError('Unable to delete images. The vehicles table may be missing image columns.', 'Schema Error');
console.error('Column error:', error.message);
return;
}
throw error;
}
showSuccess('Truck images deleted successfully', 'Success');
await loadTruckImages(selectedPlantFilter, selectedTruckImagesType);
} catch (err) {
console.error('Error deleting truck images:', err.message);
showError('Error: ' + err.message, 'Delete Error');
}
};
window.confirmCancel = function() {
// Do nothing on cancel
};
showConfirm('Are you sure you want to delete all images for this truck?', 'Confirm Delete', 'confirmOk', 'confirmCancel');
}
// Update plate select dropdown
async function updatePlateSelectOptions() {
const plateSelect = document.getElementById('truck-plate-select');
if (!plateSelect) return;
const currentValue = plateSelect.value;
let options = [];
let placeholderText = '-- Select a plate number --';
if (selectedTruckImagesType === 'trailer') {
// Load trailers from database
try {
const { data: trailers, error } = await supabaseClient
.from('trailer_registry')
.select('chassis_no')
.order('chassis_no', { ascending: true });
if (!error && trailers) {
options = trailers.map(t => t.chassis_no);
placeholderText = '-- Select a chassis number --';
}
} catch (err) {
console.error('Error loading trailers:', err);
}
} else if (selectedTruckImagesType === 'container') {
// Load containers from database
try {
const { data: containers, error } = await supabaseClient
.from('containers')
.select('container')
.order('container', { ascending: true });
if (!error && containers) {
options = containers.map(c => c.container);
placeholderText = '-- Select a container --';
}
} catch (err) {
console.error('Error loading containers:', err);
}
} else {
// Load trucks from allVehicles (existing logic)
const uniquePlates = [...new Set(allVehicles.map(v => v.plate))];
options = uniquePlates;
placeholderText = '-- Select a truck plate --';
}
// Keep the first option (placeholder)
plateSelect.innerHTML = `<option value="">${placeholderText}</option>`;
options.forEach(option => {
const optionElement = document.createElement('option');
optionElement.value = option;
optionElement.textContent = option;
plateSelect.appendChild(optionElement);
});
// Restore previous selection if it still exists
if (currentValue && options.includes(currentValue)) {
plateSelect.value = currentValue;
}
}
// Handle image preview on file selection
function setupImagePreviewHandlers() {

for (let i = 1; i <= 4; i++) {

const fileInput = document.getElementById(`image-${i}`);

const preview = document.getElementById(`image-${i}-preview`);

if (fileInput && preview) {

fileInput.addEventListener('change', function(e) {

const file = e.target.files[0];

if (file) {

const reader = new FileReader();

reader.onload = function(event) {

preview.style.backgroundImage = `url('${event.target.result}')`;

preview.classList.add('has-image');

preview.textContent = '';

};

reader.readAsDataURL(file);
}
});
}
}
}
// Form Handler
document.addEventListener('DOMContentLoaded', function() {
// ============ Vehicle Modal Handler ============
const vehicleModal = document.getElementById('vehicle-modal');
const vehicleModalOverlay = document.getElementById('vehicle-modal-overlay');
const addVehicleBtn = document.getElementById('add-vehicle-btn');
const vehicleModalCloseBtn = document.getElementById('vehicle-modal-close-btn');
const vehicleModalCancelBtn = document.getElementById('vehicle-modal-cancel-btn');
const vehicleForm = document.getElementById('vehicle-form');
const vehicleSubmitBtn = document.getElementById('vehicle-submit-btn');
// Trailer Modal Elements
const trailerModal = document.getElementById('trailer-modal');
const trailerModalOverlay = document.getElementById('trailer-modal-overlay');
const trailerModalCloseBtn = document.getElementById('trailer-modal-close-btn');
const trailerModalCancelBtn = document.getElementById('trailer-modal-cancel-btn');
const trailerSubmitBtn = document.getElementById('trailer-submit-btn');
const trailerForm = document.getElementById('trailer-form');
let editingTrailerPlate = null;
// Container Modal Elements
const containerModal = document.getElementById('container-modal');
const containerModalOverlay = document.getElementById('container-modal-overlay');
const containerModalCloseBtn = document.getElementById('container-modal-close-btn');
const containerModalCancelBtn = document.getElementById('container-modal-cancel-btn');
const containerSubmitBtn = document.getElementById('container-submit-btn');
const containerForm = document.getElementById('container-form');
// Registry Filter Buttons
const registryTruckBtn = document.getElementById('registry-truck-btn');
const registryTrailerBtn = document.getElementById('registry-trailer-btn');
const registryContainerBtn = document.getElementById('registry-container-btn');
// Registry filter button event listeners
if (registryTruckBtn) {
registryTruckBtn.addEventListener('click', function() {
setRegistryFilter('truck');
});
}
if (registryTrailerBtn) {
registryTrailerBtn.addEventListener('click', function() {
setRegistryFilter('trailer');
});
}
if (registryContainerBtn) {
registryContainerBtn.addEventListener('click', function() {
setRegistryFilter('container');
});
}

// Status section filter buttons
const statusTruckBtn = document.getElementById('status-truck-btn');
const statusTrailerBtn = document.getElementById('status-trailer-btn');
const statusContainerBtn = document.getElementById('status-container-btn');
const statusCrBtn = document.getElementById('status-cr-btn');
const statusOrBtn = document.getElementById('status-or-btn');

if (statusTruckBtn) {
statusTruckBtn.addEventListener('click', function() {
setStatusFilter('truck');
});
}
if (statusTrailerBtn) {
statusTrailerBtn.addEventListener('click', function() {
setStatusFilter('trailer');
});
}
if (statusContainerBtn) {
statusContainerBtn.addEventListener('click', function() {
setStatusFilter('container');
});
}
if (statusCrBtn) {
statusCrBtn.addEventListener('click', function() {
setStatusFilter('cr');
});
}
if (statusOrBtn) {
statusOrBtn.addEventListener('click', function() {
setStatusFilter('or');
});
}

// Repair section filter buttons
const repairTruckBtn = document.getElementById('repair-truck-btn');
const repairTrailerBtn = document.getElementById('repair-trailer-btn');
const repairContainerBtn = document.getElementById('repair-container-btn');

if (repairTruckBtn) {
repairTruckBtn.addEventListener('click', function() {
setRepairFilter('truck');
});
}
if (repairTrailerBtn) {
repairTrailerBtn.addEventListener('click', function() {
setRepairFilter('trailer');
});
}
if (repairContainerBtn) {
repairContainerBtn.addEventListener('click', function() {
setRepairFilter('container');
});
}

// Trucks section filter buttons
const truckImagesTruckBtn = document.getElementById('truck-images-truck-btn');
const truckImagesTrailerBtn = document.getElementById('truck-images-trailer-btn');
const truckImagesContainerBtn = document.getElementById('truck-images-container-btn');

if (truckImagesTruckBtn) {
truckImagesTruckBtn.addEventListener('click', function() {
setTruckImagesFilter('truck');
});
}
if (truckImagesTrailerBtn) {
truckImagesTrailerBtn.addEventListener('click', function() {
setTruckImagesFilter('trailer');
});
}
if (truckImagesContainerBtn) {
truckImagesContainerBtn.addEventListener('click', function() {
setTruckImagesFilter('container');
});
}
// Function to set registry filter and update UI
function setRegistryFilter(filterType) {

currentRegistryFilter = filterType;

// Update button states
const buttons = document.querySelectorAll('.registry-filter-btn');
buttons.forEach(btn => {
btn.classList.remove('active');
if (btn.dataset.filter === filterType) {
btn.classList.add('active');
}
});

// Update plant filter state based on tab type
let currentPlantFilter = null;
switch(filterType) {
  case 'truck':
    currentPlantFilter = truckPlantFilter;
    break;
  case 'trailer':
    currentPlantFilter = trailerPlantFilter;
    break;
  case 'container':
    currentPlantFilter = containerPlantFilter;
    break;
  default:
    currentPlantFilter = truckPlantFilter;
}

// Update global filter for backward compatibility
selectedPlantFilter = currentPlantFilter;

// Update plant counts with the new tab type
loadPlantCounts('registry', filterType);

// Update title and button text based on filter
// Use more specific selector to target the registry view title
const registryTitle = document.querySelector('#registry-view .recentVehicles .cardHeader h2');
const addVehicleBtn = document.getElementById('add-vehicle-btn');
if (registryTitle) {
if (filterType === 'trailer') {
registryTitle.textContent = 'Trailer Registry';
} else if (filterType === 'container') {
registryTitle.textContent = 'Container Registry';
} else {
registryTitle.textContent = 'Vehicle Registry';
}
}
if (addVehicleBtn) {
if (filterType === 'trailer') {
addVehicleBtn.textContent = '+ Add Trailer';
} else if (filterType === 'container') {
addVehicleBtn.textContent = '+ Add Container';
} else {
addVehicleBtn.textContent = '+ Add Vehicle';
}
}
// Show/hide appropriate add buttons
const addContainerBtn = document.getElementById('add-container-btn');
if (addContainerBtn) {
if (filterType === 'container') {
addContainerBtn.style.display = 'block';
} else {
addContainerBtn.style.display = 'none';
}
}
// Show/hide appropriate tables
const vehicleTableContainer = document.querySelector('.table-container:not(#trailer-table-container):not(#container-table-container)');
const trailerTableContainer = document.getElementById('trailer-table-container');
const containerTableContainer = document.getElementById('container-table-container');
if (filterType === 'trailer') {
// Show registry trailer table, hide others
if (vehicleTableContainer) vehicleTableContainer.style.display = 'none';
if (trailerTableContainer) {
trailerTableContainer.style.display = 'block';
}
if (containerTableContainer) containerTableContainer.style.display = 'none';
} else if (filterType === 'container') {
// Show container table, hide others
if (vehicleTableContainer) vehicleTableContainer.style.display = 'none';
if (trailerTableContainer) trailerTableContainer.style.display = 'none';
if (containerTableContainer) containerTableContainer.style.display = 'block';
} else {
// Show main vehicle table, hide others
if (vehicleTableContainer) vehicleTableContainer.style.display = 'block';
if (trailerTableContainer) trailerTableContainer.style.display = 'none';
if (containerTableContainer) containerTableContainer.style.display = 'none';
}
// Reload vehicles with new filter
loadVehicles();
}

// Function to set status filter and update UI
function setStatusFilter(filterType) {
// Track current status filter
currentStatusFilter = filterType;

// Track last selected parent button (truck or trailer)
if (filterType === 'truck' || filterType === 'trailer') {
lastSelectedParentButton = filterType;
}

// Update button states
const buttons = document.querySelectorAll('#status-view .registry-filter-btn');
buttons.forEach(btn => {
btn.classList.remove('active');
if (btn.dataset.filter === filterType) {
btn.classList.add('active');
}
});

// Update plant filter state based on tab type
let currentPlantFilter = null;
switch(filterType) {
  case 'truck':
    currentPlantFilter = truckPlantFilter;
    break;
  case 'trailer':
    currentPlantFilter = trailerPlantFilter;
    break;
  case 'container':
    currentPlantFilter = containerPlantFilter;
    break;
  default:
    currentPlantFilter = truckPlantFilter;
}

// Update global filter for backward compatibility
selectedPlantFilter = currentPlantFilter;

// Update plant counts with the new tab type
loadPlantCounts('status', filterType);

// For C/R and O/R, also keep the parent button active
if (filterType === 'cr' || filterType === 'or') {
const parentBtn = document.getElementById(`status-${lastSelectedParentButton}-btn`);
if (parentBtn) {
parentBtn.classList.add('active');
}
}

// Hide/show C/R and O/R buttons based on filter type
const statusCrBtn = document.getElementById('status-cr-btn');
const statusOrBtn = document.getElementById('status-or-btn');
if (statusCrBtn && statusOrBtn) {
if (filterType === 'container') {
statusCrBtn.style.display = 'none';
statusOrBtn.style.display = 'none';
} else {
statusCrBtn.style.display = '';
statusOrBtn.style.display = '';
}
}

// Update title based on filter
const statusTitle = document.querySelector('#status-view .recentVehicles .cardHeader h2');
if (statusTitle) {
if (filterType === 'trailer') {
statusTitle.textContent = 'Trailer Registration';
} else if (filterType === 'container') {
statusTitle.textContent = 'Container Registration';
} else if (filterType === 'cr') {
statusTitle.textContent = 'C/R Registration';
} else if (filterType === 'or') {
statusTitle.textContent = 'O/R Registration';
} else {
statusTitle.textContent = 'Truck Registration';
}
}

// Trigger existing switchTable function
switchTable(filterType);
}


// Function to set truck images filter and update UI
function setTruckImagesFilter(filterType) {
// Update button states
const buttons = document.querySelectorAll('#trucks-view .registry-filter-btn');
buttons.forEach(btn => {
btn.classList.remove('active');
if (btn.dataset.filter === filterType) {
btn.classList.add('active');
}
});

// Update plant filter state based on tab type
let currentPlantFilter = null;
switch(filterType) {
  case 'truck':
    currentPlantFilter = truckPlantFilter;
    break;
  case 'trailer':
    currentPlantFilter = trailerPlantFilter;
    break;
  case 'container':
    currentPlantFilter = containerPlantFilter;
    break;
  default:
    currentPlantFilter = truckPlantFilter;
}

// Update global filter for backward compatibility
selectedPlantFilter = currentPlantFilter;

// Update plant counts with the new tab type
loadPlantCounts('trucks', filterType);

// Update title based on filter
const truckImagesTitle = document.querySelector('#trucks-view .recentVehicles .cardHeader h2');
if (truckImagesTitle) {
if (filterType === 'trailer') {
truckImagesTitle.textContent = 'Trailer Images';
} else if (filterType === 'container') {
truckImagesTitle.textContent = 'Container Images';
} else {
truckImagesTitle.textContent = 'Truck Images';
}
}

// Trigger existing switchTruckImagesTable function
switchTruckImagesTable(filterType);
}
// Open modal for adding vehicle
if (addVehicleBtn) {
addVehicleBtn.addEventListener('click', function() {
// Check current filter to determine which modal to open
if (currentRegistryFilter === 'trailer') {
// Open trailer modal
if (trailerForm) trailerForm.reset();
clearTrailerFormErrors();
trailerSubmitBtn.textContent = 'Save Trailer';
editingTrailerPlate = null;
trailerModal.style.display = 'block';
trailerModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
} else if (currentRegistryFilter === 'container') {
// Open container modal
console.log('Opening container modal from main add button'); // Debug log
openContainerModal();
return;
} else {
// Open vehicle modal (default behavior)
vehicleForm.reset();
document.getElementById('plate').disabled = false; // Ensure plate field is enabled
clearVehicleFormErrors();
vehicleSubmitBtn.textContent = 'Save Vehicle';
editingVehiclePlate = null;

// Show/hide size dropdown based on status filter
const sizeField = document.getElementById('size').parentElement;
if (sizeField) {
// Check if we're in status section and current filter is truck
const isStatusSection = document.querySelector('#status-view.active');
if (isStatusSection && currentStatusFilter === 'truck') {
sizeField.style.display = 'block';
document.getElementById('size').required = true;
} else if (isStatusSection) {
// Hide size dropdown for non-truck types in status section
sizeField.style.display = 'none';
document.getElementById('size').required = false;
document.getElementById('size').value = '';
} else {
// Show size dropdown for registry section
sizeField.style.display = 'block';
document.getElementById('size').required = true;
}
}

vehicleModal.style.display = 'block';
vehicleModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
}
});
}
if (vehicleModalCloseBtn) {
vehicleModalCloseBtn.addEventListener('click', closeVehicleModal);
}
if (vehicleModalCancelBtn) {
vehicleModalCancelBtn.addEventListener('click', closeVehicleModal);
}
// Close modal when clicking overlay
if (vehicleModalOverlay) {
vehicleModalOverlay.addEventListener('click', function(e) {
if (e.target === vehicleModalOverlay) {
closeVehicleModal();
}
});
}
// Trailer Modal Event Listeners
if (trailerModalCloseBtn) {
trailerModalCloseBtn.addEventListener('click', closeTrailerModal);
}
if (trailerModalCancelBtn) {
trailerModalCancelBtn.addEventListener('click', closeTrailerModal);
}
// Close trailer modal when clicking overlay
if (trailerModalOverlay) {
trailerModalOverlay.addEventListener('click', function(e) {
if (e.target === trailerModalOverlay) {
closeTrailerModal();
}
});
}
// Container Modal Event Listeners
if (containerModalCloseBtn) {
containerModalCloseBtn.addEventListener('click', closeContainerModal);
}
if (containerModalCancelBtn) {
containerModalCancelBtn.addEventListener('click', closeContainerModal);
}
// Close container modal when clicking overlay
if (containerModalOverlay) {
containerModalOverlay.addEventListener('click', function(e) {
if (e.target === containerModalOverlay) {
closeContainerModal();
}
});
}
// Clear form validation errors
function clearVehicleFormErrors() {

const inputs = vehicleForm.querySelectorAll('input, select');

inputs.forEach(input => {

input.classList.remove('error');

});
}
// Handle form submission
if (vehicleForm) {
vehicleForm.addEventListener('submit', async function(e) {
e.preventDefault();
const plate = document.getElementById('plate').value.trim();
const model = document.getElementById('model').value.trim();
const size = document.getElementById('size').value.trim();
const year_model = parseInt(document.getElementById('year_model').value, 10);
const plant = document.getElementById('plant').value.trim();
// Validate all fields
let isValid = true;
clearVehicleFormErrors();
if (!plate) {
document.getElementById('plate').classList.add('error');
isValid = false;
}
if (!model) {
document.getElementById('model').classList.add('error');
isValid = false;
}
if (!size) {
document.getElementById('size').classList.add('error');
isValid = false;
}
if (!year_model || isNaN(year_model)) {
document.getElementById('year_model').classList.add('error');
isValid = false;
}
if (!plant) {
document.getElementById('plant').classList.add('error');
isValid = false;
}
if (!isValid) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
await addVehicle(plate, model, size, year_model, plant);
closeVehicleModal();
// Update truck plate options after adding vehicle
setTimeout(() => loadPlateOptions(), 500);
});
}
// Trailer form submission handler
if (trailerForm) {
trailerForm.addEventListener('submit', async function(e) {
e.preventDefault();
const plate = document.getElementById('trailer-plate').value.trim();
const chassis = document.getElementById('trailer-chassis').value.trim();
const mvFile = document.getElementById('trailer-mv-file').value.trim();
const year = parseInt(document.getElementById('trailer-year').value, 10);
const owner = document.getElementById('trailer-owner').value.trim();
const plant = document.getElementById('trailer-plant').value.trim();
let isValid = true;
// Validation
if (!plate) {
document.getElementById('trailer-plate').classList.add('error');
isValid = false;
}
if (!chassis) {
document.getElementById('trailer-chassis').classList.add('error');
isValid = false;
}
if (!mvFile) {
document.getElementById('trailer-mv-file').classList.add('error');
isValid = false;
}
if (!year || isNaN(year)) {
document.getElementById('trailer-year').classList.add('error');
isValid = false;
}
if (!owner) {
document.getElementById('trailer-owner').classList.add('error');
isValid = false;
}
if (!plant) {
document.getElementById('trailer-plant').classList.add('error');
isValid = false;
}
if (!isValid) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
// Save trailer to database
try {
if (!supabaseClient) {
console.error('Supabase not initialized');
showWarning('Database connection error', 'Error');
return;
}
await supabaseWithAuth(async () => {
const trailerData = {
plate_no: plate,
chassis_no: chassis,
mv_file_no: mvFile,
year_model: year,
owner_name: owner,
location_plant: plant
};
let result;
if (editingTrailerId) {
// Update existing trailer
const { data, error } = await supabaseClient
.from('trailer_registry')
.update(trailerData)
.eq('id', editingTrailerId)
.select();
if (error) {
console.error('Error updating trailer_registry:', error);
throw error;
}
result = data;
showSuccess('Trailer updated successfully!');
} else {
// Insert new trailer
trailerData.created_at = new Date().toISOString();
const { data, error } = await supabaseClient
.from('trailer_registry')
.insert([trailerData])
.select();
if (error) {
console.error('Error saving to trailer_registry:', error);
throw error;
}
result = data;
showSuccess('Trailer added successfully!');
}
closeTrailerModal();
// Reload vehicles to show the updated/new trailer
setTimeout(() => loadVehicles(), 500);
});
} catch (error) {
console.error('Error saving trailer:', error);
showWarning('Failed to save trailer: ' + error.message, 'Error');
}
});
}
// Container form submission handler
if (containerForm) {
containerForm.addEventListener('submit', async function(e) {
e.preventDefault();
const containerNumber = document.getElementById('container-number').value.trim();
const containerName = document.getElementById('container-name').value.trim();
const containerSize = document.getElementById('container-size').value.trim();
const containerColor = document.getElementById('container-color').value.trim();
const containerLocation = document.getElementById('container-location').value.trim();
let isValid = true;
clearContainerFormErrors();
// Validation
if (!containerNumber) {
document.getElementById('container-number').classList.add('error');
isValid = false;
}
if (!containerName) {
document.getElementById('container-name').classList.add('error');
isValid = false;
}
if (!containerSize) {
document.getElementById('container-size').classList.add('error');
isValid = false;
}
if (!containerColor) {
document.getElementById('container-color').classList.add('error');
isValid = false;
}
if (!containerLocation) {
document.getElementById('container-location').classList.add('error');
isValid = false;
}
if (!isValid) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
// Save container using the existing saveContainer function
await saveContainer(containerNumber, containerName, containerSize, containerColor, containerLocation);
});
}
// Function to create sample trailer data for testing
async function createSampleTrailerData() {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
const sampleTrailers = [
{
plate: 'TRL-001',
chassi_no: 'CHS-TRL-001',
mv_file: 'MV-TRL-001',
year_model: 2020,
owner_name: 'John Doe Transport',
plant: 'DISNEY 3',
vehicle_type: 'Trailer',
size: 'Trailer',
created_at: new Date().toISOString()
},
{
plate: 'TRL-002',
chassi_no: 'CHS-TRL-002',
mv_file: 'MV-TRL-002',
year_model: 2021,
owner_name: 'Jane Smith Logistics',
plant: 'DISNEY 6',
vehicle_type: 'Trailer',
size: 'Trailer',
created_at: new Date().toISOString()
},
{
plate: 'TRL-003',
chassi_no: 'CHS-TRL-003',
mv_file: 'MV-TRL-003',
year_model: 2019,
owner_name: 'ABC Transport Co.',
plant: 'HASBRO',
vehicle_type: 'Trailer',
size: 'Trailer',
created_at: new Date().toISOString()
}
];
try {
await supabaseWithAuth(async () => {
// Try to save to vehicle_registry table first
let { data, error } = await supabaseClient
.from('vehicle_registry')
.insert(sampleTrailers)
.select();
if (error) {
console.warn('vehicle_registry table error, trying vehicles table:', error);
// Fallback to vehicles table
const fallbackData = sampleTrailers.map(trailer => ({
plate: trailer.plate,
chassi_no: trailer.chassi_no,
mv_file: trailer.mv_file,
year_model: trailer.year_model,
owner_name: trailer.owner_name,
plant: trailer.plant,
vehicle_type: trailer.vehicle_type,
size: trailer.size
}));
const { data: fallbackDataResult, error: fallbackError } = await supabaseClient
.from('vehicles')
.insert(fallbackData)
.select();
if (fallbackError) {
throw fallbackError;
}
} else {
}
});
} catch (error) {
console.error('Error creating sample trailer data:', error);
}
}
// Make it available globally for testing
window.createSampleTrailerData = createSampleTrailerData;
const truckForm = document.getElementById('truck-form');
if (truckForm) {
truckForm.addEventListener('submit', async function(e) {
e.preventDefault();
const plate = document.getElementById('truck-plate').value.trim();
const truckImageFile = document.getElementById('truck-image').files[0];
const driverImageFile = document.getElementById('driver-image').files[0];
if (!plate) {
showWarning('Please select a plate number', 'Validation Error');
return;
}
if (!truckImageFile) {
showWarning('Please select a truck image', 'Validation Error');
return;
}
if (!driverImageFile) {
showWarning('Please select a driver image', 'Validation Error');
return;
}
await addTruck(plate, truckImageFile, driverImageFile);
truckForm.reset();
});
}
// ============ Repair Modal Handler ============
const repairModal = document.getElementById('repair-modal');
const repairModalOverlay = document.getElementById('repair-modal-overlay');
const addRepairBtn = document.getElementById('add-repair-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const repairForm = document.getElementById('repair-form');
// Open modal
if (addRepairBtn) {
addRepairBtn.addEventListener('click', function() {
repairForm.reset();
clearFormErrors();
// Load fresh plate options when opening repair modal
loadPlateOptions();
repairModal.style.display = 'block';
repairModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
});
}
// Close modal
function closeRepairModal() {

repairModal.style.display = 'none';

repairModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

repairForm.reset();

clearFormErrors();
}
if (modalCloseBtn) {
modalCloseBtn.addEventListener('click', closeRepairModal);
}
if (modalCancelBtn) {
modalCancelBtn.addEventListener('click', closeRepairModal);
}
// Close modal when clicking overlay
if (repairModalOverlay) {
repairModalOverlay.addEventListener('click', function(e) {
if (e.target === repairModalOverlay) {
closeRepairModal();
}
});
}
// Clear form validation errors
function clearFormErrors() {

const inputs = repairForm.querySelectorAll('input, textarea, select');

inputs.forEach(input => {

input.classList.remove('error');

});
}
// Handle form submission
if (repairForm) {
repairForm.addEventListener('submit', async function(e) {
e.preventDefault();
const dateReported = document.getElementById('date-reported').value.trim();
const plate = document.getElementById('repair-plate').value.trim();
const truckIssue = document.getElementById('truck-issue').value.trim();
const inCharge = document.getElementById('incharge').value.trim();
// Validate all fields
let isValid = true;
clearFormErrors();
if (!dateReported) {
document.getElementById('date-reported').classList.add('error');
isValid = false;
}
if (!plate) {
document.getElementById('repair-plate').classList.add('error');
isValid = false;
}
if (!truckIssue) {
document.getElementById('truck-issue').classList.add('error');
isValid = false;
}
if (!inCharge) {
document.getElementById('incharge').classList.add('error');
isValid = false;
}
if (!isValid) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
await addRepairRecord(dateReported, plate, truckIssue, inCharge);
closeRepairModal();
});
}
// ============ Truck Images Modal Handler ============
const truckImagesModal = document.getElementById('truck-images-modal');
const truckImagesModalOverlay = document.getElementById('truck-images-modal-overlay');
const addTruckImagesBtn = document.getElementById('add-truck-images-btn');
const truckImagesModalCloseBtn = document.getElementById('truck-images-modal-close-btn');
const truckImagesModalCancelBtn = document.getElementById('truck-images-modal-cancel-btn');
const truckImagesForm = document.getElementById('truck-images-form');
// Helper function to clear image previews
function clearTruckImagePreviews() {

for (let i = 1; i <= 4; i++) {

const preview = document.getElementById(`image-${i}-preview`);

if (preview) {

preview.style.backgroundImage = '';

preview.classList.remove('has-image');

preview.textContent = 'Click to upload';
}
}
}
// Open modal
if (addTruckImagesBtn) {
addTruckImagesBtn.addEventListener('click', async function() {
truckImagesForm.reset();
clearTruckImagePreviews();
// Update modal title and label based on selected vehicle type
const modalTitle = document.getElementById('truck-images-modal-title');
const selectLabel = document.getElementById('truck-images-select-label');
if (selectedTruckImagesType === 'trailer') {
modalTitle.textContent = 'Add Trailer Images';
selectLabel.innerHTML = 'Select Chassis No. <span class="required">*</span>';
} else if (selectedTruckImagesType === 'container') {
modalTitle.textContent = 'Add Container Images';
selectLabel.innerHTML = 'Select Container <span class="required">*</span>';
} else {
modalTitle.textContent = 'Add Truck Images';
selectLabel.innerHTML = 'Select Truck Plate <span class="required">*</span>';
}
await updatePlateSelectOptions();
truckImagesModal.style.display = 'block';
truckImagesModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
});
}
// Close modal
function closeTruckImagesModal() {

truckImagesModal.style.display = 'none';

truckImagesModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

truckImagesForm.reset();

clearTruckImagePreviews();
}
if (truckImagesModalCloseBtn) {
truckImagesModalCloseBtn.addEventListener('click', closeTruckImagesModal);
}
if (truckImagesModalCancelBtn) {
truckImagesModalCancelBtn.addEventListener('click', closeTruckImagesModal);
}
// Close modal when clicking overlay
if (truckImagesModalOverlay) {
truckImagesModalOverlay.addEventListener('click', function(e) {
if (e.target === truckImagesModalOverlay) {
closeTruckImagesModal();
}
});
}
// Handle form submission
if (truckImagesForm) {
truckImagesForm.addEventListener('submit', async function(e) {
e.preventDefault();
const plateNumber = document.getElementById('truck-plate-select').value.trim();
const files = [
document.getElementById('image-1').files[0],
document.getElementById('image-2').files[0],
document.getElementById('image-3').files[0],
document.getElementById('image-4').files[0]
];
if (!plateNumber) {
showWarning('Please select a plate number', 'Validation Error');
return;
}
// Check if at least one image is selected
if (!files.some(f => f)) {
showWarning('Please upload at least one image', 'Validation Error');
return;
}
try {
// Show loading indicator
const submitBtn = truckImagesForm.querySelector('button[type="submit"]');
const originalText = submitBtn.textContent;
submitBtn.disabled = true;
submitBtn.textContent = 'Uploading...';
// Upload images
const imageUrls = await uploadTruckImages(plateNumber, files);
// Save to database
await saveTruckImages(plateNumber, imageUrls);
// Show success message based on current type
const successMessage = selectedTruckImagesType === 'trailer' ? 'Trailer images saved successfully!' :
selectedTruckImagesType === 'container' ? 'Container images saved successfully!' :
'Truck images saved successfully!';
showSuccess(successMessage, 'Success');
// Reset form and close modal for all types
closeTruckImagesModal();
// Reload images based on current type
await loadTruckImages(selectedPlantFilter, selectedTruckImagesType);
// Restore button
submitBtn.disabled = false;
submitBtn.textContent = originalText;
} catch (err) {
const submitBtn = truckImagesForm.querySelector('button[type="submit"]');
submitBtn.disabled = false;
submitBtn.textContent = 'Upload Images';
// Check if it's a schema error
if (err.message && err.message.includes('image1_url')) {
showError(err.message, 'Schema Error');
} else {
showError('Error: ' + err.message, 'Upload Error');
}
}
});
}
// Setup image preview handlers
setupImagePreviewHandlers();
// ============ Vehicle Status Modal Handler ============
const vehicleStatusModal = document.getElementById('vehicle-status-modal');
const vehicleStatusModalOverlay = document.getElementById('vehicle-status-modal-overlay');
const vehicleStatusModalCloseBtn = document.getElementById('vehicle-status-modal-close-btn');
const vehicleStatusModalCancelBtn = document.getElementById('vehicle-status-modal-cancel-btn');
const vehicleStatusForm = document.getElementById('vehicle-status-form');
// Close modal
if (vehicleStatusModalCloseBtn) {
vehicleStatusModalCloseBtn.addEventListener('click', closeVehicleStatusModal);
}
if (vehicleStatusModalCancelBtn) {
vehicleStatusModalCancelBtn.addEventListener('click', closeVehicleStatusModal);
}
// Close modal when clicking overlay
if (vehicleStatusModalOverlay) {
vehicleStatusModalOverlay.addEventListener('click', function(e) {
if (e.target === vehicleStatusModalOverlay) {
closeStatusModal();
}
});
}
// Add event listener for status dropdown to show/hide date reported field
const statusTruckStatus = document.getElementById('status-truck-status');
const dateReportedGroup = document.getElementById('date-reported-group');
if (statusTruckStatus && dateReportedGroup) {
statusTruckStatus.addEventListener('change', function() {
if (this.value === 'DOWN') {
dateReportedGroup.style.display = 'block';
} else {
dateReportedGroup.style.display = 'none';
document.getElementById('status-date-reported').value = ''; // Clear the date when hiding
}
});
}
// ============ C/R Image Modal Handler ============
const crImageModal = document.getElementById('cr-image-modal');
const crImageModalOverlay = document.getElementById('cr-image-modal-overlay');
const crImageModalCloseBtn = document.getElementById('cr-image-modal-close-btn');
// Close C/R image modal
if (crImageModalCloseBtn) {
crImageModalCloseBtn.addEventListener('click', closeCrImageModal);
}
// Close C/R image modal when clicking overlay
if (crImageModalOverlay) {
crImageModalOverlay.addEventListener('click', function(e) {
if (e.target === crImageModalOverlay) {
closeCrImageModal();
}
});
}
// ============ O/R PDF Modal Handler ============
const orPdfModal = document.getElementById('or-pdf-modal');
const orPdfModalOverlay = document.getElementById('or-pdf-modal-overlay');
const orPdfModalCloseBtn = document.getElementById('or-pdf-modal-close-btn');
// Close O/R PDF modal
if (orPdfModalCloseBtn) {
orPdfModalCloseBtn.addEventListener('click', closeOrPdfModal);
}
// Close O/R PDF modal when clicking overlay
if (orPdfModalOverlay) {
orPdfModalOverlay.addEventListener('click', function(e) {
if (e.target === orPdfModalOverlay) {
closeOrPdfModal();
}
});
}
// O/R and C/R Image Upload Variables
let orImageFile = null;
let crImageFile = null;
// O/R Image Upload Handler
const orImageUpload = document.getElementById('or-image-upload');
const orImagePreview = document.getElementById('or-image-preview');
if (orImageUpload) {
orImageUpload.addEventListener('change', function(e) {
const file = e.target.files[0];
if (file) {
if (file.type === 'application/pdf') {
orImageFile = file;
orImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px;">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666; word-break: break-all;">${file.name}</div>
<button type="button" class="remove-image" onclick="removeOrImage(event)" title="Remove PDF" style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">Ã—</button>
</div>
`;
orImagePreview.classList.add('has-image');
} else {
showWarning('Please select a valid PDF file', 'Invalid File');
}
}
});
}
// C/R Image Upload Handler
const crImageUpload = document.getElementById('cr-image-upload');
const crImagePreview = document.getElementById('cr-image-preview');
if (crImageUpload) {
crImageUpload.addEventListener('change', function(e) {
const file = e.target.files[0];
if (file) {
if (file.type === 'application/pdf') {
crImageFile = file;
crImagePreview.innerHTML = `
<div style="text-align: center; padding: 20px;">
<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
<div style="font-size: 12px; color: #666; word-break: break-all;">${file.name}</div>
<button type="button" class="remove-image" onclick="removeCrImage(event)" title="Remove PDF" style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">Ã—</button>
</div>
`;
crImagePreview.classList.add('has-image');
} else {
showWarning('Please select a valid PDF file', 'Invalid File');
}
}
});
}
// Remove O/R Image Function
window.removeOrImage = function(event) {
event.stopPropagation();
orImageFile = null;
orImageUpload.value = '';
orImagePreview.innerHTML = '<span style="color: #666;">Click to upload O/R PDF</span>';
orImagePreview.classList.remove('has-image');
};
// Remove C/R Image Function
window.removeCrImage = function(event) {
event.stopPropagation();
crImageFile = null;
crImageUpload.value = '';
crImagePreview.innerHTML = '<span style="color: #666;">Click to upload C/R PDF</span>';
crImagePreview.classList.remove('has-image');
};
// Handle form submission
if (vehicleStatusForm) {
vehicleStatusForm.addEventListener('submit', async function(e) {
e.preventDefault();
const driver = document.getElementById('status-driver').value.trim();
const status = document.getElementById('status-truck-status').value;
const truckIssue = document.getElementById('status-truck-issue').value.trim();
const registrationDate = document.getElementById('status-registration-date').value;
const expirationDate = document.getElementById('status-expiration-date').value;
const dateReported = document.getElementById('status-date-reported').value;
const plate = editingStatusPlate;

// Read files directly from status truck modal input elements
const orPdfInput = document.getElementById('status-truck-or-pdf');
const crPdfInput = document.getElementById('status-truck-cr-pdf');
const orFile = orPdfInput ? orPdfInput.files[0] : null;
const crFile = crPdfInput ? crPdfInput.files[0] : null;

console.log('Form submission - orFile:', orFile, 'crFile:', crFile);
if (!driver || !status) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
await saveTruckData(editingStatusPlate, driver, status, truckIssue, orFile, crFile, registrationDate, expirationDate, dateReported);
closeVehicleStatusModal();
});
}
// ============ RFID Modal Handler ============
const rfidModal = document.getElementById('rfid-modal');
const rfidModalOverlay = document.getElementById('rfid-modal-overlay');
const rfidModalCloseBtn = document.getElementById('rfid-modal-close-btn');
const rfidModalCancelBtn = document.getElementById('rfid-modal-cancel-btn');
// Open RFID modal
function openRfidModal() {

rfidModal.style.display = 'block';

rfidModalOverlay.style.display = 'block';

document.body.style.overflow = 'hidden';

loadRfidAccountModalData();
}
// Close RFID modal
function closeRfidModal() {

rfidModal.style.display = 'none';

rfidModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';
}
// Load RFID account modal (vehicle registry plate list)
async function loadRfidAccountModalData() {
  const loadingElement = document.getElementById('rfid-account-loading');
  const noDataElement = document.getElementById('rfid-account-no-data');
  const tableBody = document.getElementById('rfid-account-table-body');
  const searchInput = document.getElementById('rfid-account-search-input');
  if (!loadingElement || !noDataElement || !tableBody) return;

  loadingElement.style.display = 'block';
  noDataElement.style.display = 'none';
  tableBody.innerHTML = '';

  try {
    if (!supabaseClient) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabaseWithAuth(async () => {
      return await supabaseClient
        .from('vehicle_registry')
        .select('plate, autosweep, easytrip')
        .order('plate', { ascending: true });
    });

    if (error) throw error;

    const vehicles = data || [];
    loadingElement.style.display = 'none';

    if (vehicles.length === 0) {
      noDataElement.style.display = 'block';
      return;
    }

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filteredVehicles = vehicles.filter(vehicle => {
      if (!searchTerm) return true;
      const plate = (vehicle.plate || '').toLowerCase();
      const autosweep = (vehicle.autosweep || '').toLowerCase();
      const easytrip = (vehicle.easytrip || '').toLowerCase();
      const haystack = [plate, autosweep, easytrip].join(' ');
      return haystack.includes(searchTerm);
    });

    if (filteredVehicles.length === 0) {
      noDataElement.style.display = 'block';
      return;
    }

    filteredVehicles.forEach(vehicle => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: 600; color: var(--black1); text-align: center;">${vehicle.plate || '-'}</td>
        <td style="text-align: center;">${vehicle.autosweep || '-'}</td>
        <td style="text-align: center;">${vehicle.easytrip || '-'}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading RFID data:', error);
    loadingElement.style.display = 'none';
    noDataElement.style.display = 'block';
    showError('Failed to load RFID data', 'Error');
  }
}
// RFID modal event listeners
if (rfidModalCloseBtn) {
rfidModalCloseBtn.addEventListener('click', closeRfidModal);
}
if (rfidModalCancelBtn) {
rfidModalCancelBtn.addEventListener('click', closeRfidModal);
}
// Add search input event listener
const rfidSearchInput = document.getElementById('rfid-account-search-input');
if (rfidSearchInput) {
let searchTimeout;
rfidSearchInput.addEventListener('input', function() {
clearTimeout(searchTimeout);
searchTimeout = setTimeout(() => {
loadRfidAccountModalData();
}, 300); // Debounce search to avoid excessive API calls
});
}
// Close modal when clicking overlay
if (rfidModalOverlay) {
rfidModalOverlay.addEventListener('click', function(e) {
if (e.target === rfidModalOverlay) {
closeRfidModal();
}
});
}



// ============ Tire Size Modal Handler ============
const tireSizeModal = document.getElementById('tire-size-modal');
const tireSizeModalOverlay = document.getElementById('tire-size-modal-overlay');
const tireSizeModalCloseBtn = document.getElementById('tire-size-modal-close-btn');
const tireSizeModalCancelBtn = document.getElementById('tire-size-modal-cancel-btn');
// Open Tire Size modal
function openTireSizeModal() {

tireSizeModal.style.display = 'block';

tireSizeModalOverlay.style.display = 'block';

document.body.style.overflow = 'hidden';

loadTireSizeData();
}
// Close Tire Size modal
function closeTireSizeModal() {

tireSizeModal.style.display = 'none';

tireSizeModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';
}
// Load tire size data from vehicle registry
async function loadTireSizeData() {
const loadingElement = document.getElementById('tire-size-loading');
const noDataElement = document.getElementById('tire-size-no-data');
const tableBody = document.getElementById('tire-size-table-body');
const searchInput = document.getElementById('tire-size-search-input');
// Show loading state
loadingElement.style.display = 'block';
noDataElement.style.display = 'none';
tableBody.innerHTML = '';
try {
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
const { data: vehicles, error } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('vehicle_registry')
.select('plate, tire_size_front, tire_size_rear, total_tire_front, total_tire_rear')
.order('plate', { ascending: true });
});
if (error) throw error;
loadingElement.style.display = 'none';
if (!vehicles || vehicles.length === 0) {
noDataElement.style.display = 'block';
return;
}
// Filter vehicles based on search input
const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
let filteredVehicles = vehicles;
if (searchTerm) {
filteredVehicles = vehicles.filter(vehicle => {
return (
(vehicle.plate && vehicle.plate.toLowerCase().includes(searchTerm)) ||
(vehicle.tire_size_front && vehicle.tire_size_front.toLowerCase().includes(searchTerm)) ||
(vehicle.tire_size_rear && vehicle.tire_size_rear.toLowerCase().includes(searchTerm)) ||
(vehicle.total_tire_front && vehicle.total_tire_front.toString().includes(searchTerm)) ||
(vehicle.total_tire_rear && vehicle.total_tire_rear.toString().includes(searchTerm))
);
});
}
if (filteredVehicles.length === 0) {
noDataElement.style.display = 'block';
return;
}
// Populate table with filtered results
filteredVehicles.forEach(vehicle => {
const row = document.createElement('tr');
row.innerHTML = `
<td style="font-weight: 600; color: var(--black1);">${vehicle.plate || '-'}</td>
<td>${vehicle.tire_size_front || '-'}</td>
<td>${vehicle.tire_size_rear || '-'}</td>
<td>${vehicle.total_tire_front || '-'}</td>
<td>${vehicle.total_tire_rear || '-'}</td>
`;
tableBody.appendChild(row);
});
} catch (error) {
console.error('Error loading tire size data:', error);
loadingElement.style.display = 'none';
noDataElement.style.display = 'block';
showError('Failed to load tire size data', 'Error');
}
}
// Tire Size modal event listeners
if (tireSizeModalCloseBtn) {
tireSizeModalCloseBtn.addEventListener('click', closeTireSizeModal);
}
if (tireSizeModalCancelBtn) {
tireSizeModalCancelBtn.addEventListener('click', closeTireSizeModal);
}
// Add search input event listener
const tireSizeSearchInput = document.getElementById('tire-size-search-input');
if (tireSizeSearchInput) {
let searchTimeout;
tireSizeSearchInput.addEventListener('input', function() {
clearTimeout(searchTimeout);
searchTimeout = setTimeout(() => {
loadTireSizeData();
}, 300); // Debounce search to avoid excessive API calls
});
}
// Close modal when clicking overlay
if (tireSizeModalOverlay) {
tireSizeModalOverlay.addEventListener('click', function(e) {
if (e.target === tireSizeModalOverlay) {
closeTireSizeModal();
}
});
}

// ============ Trailer Registry Modal Functions ============
const trailerRegistryModal = document.getElementById('trailer-registry-modal');
const trailerRegistryModalOverlay = document.getElementById('trailer-registry-modal-overlay');
const trailerRegistryModalCloseBtn = document.getElementById('trailer-registry-modal-close-btn');
const trailerRegistryModalCancelBtn = document.getElementById('trailer-registry-modal-cancel-btn');

// Open Trailer Registry modal
function openTrailerRegistryModal() {
  trailerRegistryModal.style.display = 'block';
  trailerRegistryModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  loadTrailerRegistryData();
}

// Expose to global scope
window.openTrailerRegistryModal = openTrailerRegistryModal;

// Close Trailer Registry modal
function closeTrailerRegistryModal() {
  trailerRegistryModal.style.display = 'none';
  trailerRegistryModalOverlay.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Load Trailer Registry data from trailer_registry table
async function loadTrailerRegistryData() {
  const loadingElement = document.getElementById('trailer-registry-loading');
  const noDataElement = document.getElementById('trailer-registry-no-data');
  const tableBody = document.getElementById('trailer-registry-tbody');
  const searchInput = document.getElementById('trailer-registry-search-input');

  // Show loading state
  if (loadingElement) loadingElement.style.display = 'block';
  if (noDataElement) noDataElement.style.display = 'none';
  if (tableBody) tableBody.innerHTML = '';

  try {
    let query = supabaseClient
      .from('trailer_registry')
      .select('*')
      .order('plate_no', { ascending: true });

    // Apply plant filter if specified
    if (selectedPlantFilter) {
      query = query.eq('location_plant', selectedPlantFilter);
    }

    // Apply search filter if provided
    if (searchInput && searchInput.value.trim()) {
      const searchTerm = searchInput.value.trim().toLowerCase();
      query = query.or(`plate_no.ilike.%${searchTerm}%,chassis_no.ilike.%${searchTerm}%,location_plant.ilike.%${searchTerm}%`);
    }

    const { data: trailers, error } = await query;

    if (error) throw error;

    // Hide loading state
    if (loadingElement) loadingElement.style.display = 'none';

    if (!trailers || trailers.length === 0) {
      if (noDataElement) noDataElement.style.display = 'block';
      return;
    }

    // Populate table with trailer data
    if (tableBody) {
      tableBody.innerHTML = trailers.map(trailer => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.plate_no || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.chassis_no || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.mv_file_no || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.year_model || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.owner_name || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${trailer.location_plant || '-'}</td>
        </tr>
      `).join('');
    }

  } catch (error) {
    console.error('Error loading trailer registry data:', error);
    if (loadingElement) loadingElement.style.display = 'none';
    if (noDataElement) noDataElement.style.display = 'block';
  }
}

// Trailer Registry modal event listeners
if (trailerRegistryModalCloseBtn) {
  trailerRegistryModalCloseBtn.addEventListener('click', closeTrailerRegistryModal);
}
if (trailerRegistryModalCancelBtn) {
  trailerRegistryModalCancelBtn.addEventListener('click', closeTrailerRegistryModal);
}
if (trailerRegistryModalOverlay) {
  trailerRegistryModalOverlay.addEventListener('click', closeTrailerRegistryModal);
}

// Add search input event listener
const trailerRegistrySearchInput = document.getElementById('trailer-registry-search-input');
if (trailerRegistrySearchInput) {
  let searchTimeout;
  trailerRegistrySearchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadTrailerRegistryData();
    }, 300); // Debounce search to avoid excessive API calls
  });
}

// ============ Container Registry Modal Functions ============
const containerRegistryModal = document.getElementById('container-registry-modal');
const containerRegistryModalOverlay = document.getElementById('container-registry-modal-overlay');
const containerRegistryModalCloseBtn = document.getElementById('container-registry-modal-close-btn');
const containerRegistryModalCancelBtn = document.getElementById('container-registry-modal-cancel-btn');

// Open Container Registry modal
function openContainerRegistryModal() {
  containerRegistryModal.style.display = 'block';
  containerRegistryModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  loadContainerRegistryData();
}

// Expose to global scope
window.openContainerRegistryModal = openContainerRegistryModal;

// Close Container Registry modal
function closeContainerRegistryModal() {
  containerRegistryModal.style.display = 'none';
  containerRegistryModalOverlay.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Load Container Registry data from containers table
async function loadContainerRegistryData() {
  const loadingElement = document.getElementById('container-registry-loading');
  const noDataElement = document.getElementById('container-registry-no-data');
  const tableBody = document.getElementById('container-registry-tbody');
  const searchInput = document.getElementById('container-registry-search-input');

  // Show loading state
  if (loadingElement) loadingElement.style.display = 'block';
  if (noDataElement) noDataElement.style.display = 'none';
  if (tableBody) tableBody.innerHTML = '';

  try {
    let query = supabaseClient
      .from('containers')
      .select('*')
      .order('chassi_no', { ascending: true });

    // Apply plant filter if specified
    if (selectedPlantFilter) {
      query = query.eq('plant', selectedPlantFilter);
    }

    // Apply search filter if provided
    if (searchInput && searchInput.value.trim()) {
      const searchTerm = searchInput.value.trim().toLowerCase();
      query = query.or(`chassi_no.ilike.%${searchTerm}%,container.ilike.%${searchTerm}%,plant.ilike.%${searchTerm}%`);
    }

    const { data: containers, error } = await query;

    if (error) throw error;

    // Hide loading state
    if (loadingElement) loadingElement.style.display = 'none';

    if (!containers || containers.length === 0) {
      if (noDataElement) noDataElement.style.display = 'block';
      return;
    }

    // Populate table with container data
    if (tableBody) {
      tableBody.innerHTML = containers.map(container => {
        const containerText = container.container || '-';
        const colorStyle = container.color === 'Blue' ? 'blue' : container.color === 'Red' ? 'red' : container.color === 'Green' ? 'green' : container.color === 'Yellow' ? 'yellow' : container.color ? container.color.toLowerCase() : 'inherit';
        
        return `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">${container.chassi_no || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">
            <span style="color: ${colorStyle};">${containerText}</span>
          </td>
          <td style="padding: 12px; border: 1px solid #ddd;">${container.size || '-'}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${container.plant || '-'}</td>
        </tr>
      `;
      }).join('');
    }

  } catch (error) {
    console.error('Error loading container registry data:', error);
    if (loadingElement) loadingElement.style.display = 'none';
    if (noDataElement) noDataElement.style.display = 'block';
  }
}

// Container Registry modal event listeners
if (containerRegistryModalCloseBtn) {
  containerRegistryModalCloseBtn.addEventListener('click', closeContainerRegistryModal);
}
if (containerRegistryModalCancelBtn) {
  containerRegistryModalCancelBtn.addEventListener('click', closeContainerRegistryModal);
}
if (containerRegistryModalOverlay) {
  containerRegistryModalOverlay.addEventListener('click', closeContainerRegistryModal);
}

// Add search input event listener
const containerRegistrySearchInput = document.getElementById('container-registry-search-input');
if (containerRegistrySearchInput) {
  let searchTimeout;
  containerRegistrySearchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadContainerRegistryData();
    }, 300); // Debounce search to avoid excessive API calls
  });
}

// ============ Tools Modal Handler ============
const toolsModal = document.getElementById('tools-modal');
const toolsModalOverlay = document.getElementById('tools-modal-overlay');
const toolsModalCloseBtn = document.getElementById('tools-modal-close-btn');
const toolsModalCancelBtn = document.getElementById('tools-modal-cancel-btn');
// Open Tools modal
function openToolsModal() {

toolsModal.style.display = 'block';

toolsModalOverlay.style.display = 'block';

document.body.style.overflow = 'hidden';

loadToolsData();
}
// Close Tools modal
function closeToolsModal() {

toolsModal.style.display = 'none';

toolsModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';
}
// Load tools data from vehicle_registry and vehicle_tools tables
async function loadToolsData() {
const loadingElement = document.getElementById('tools-loading');
const noDataElement = document.getElementById('tools-no-data');
const tableBody = document.getElementById('tools-table-body');
const searchInput = document.getElementById('tools-search-input');
// Show loading state
loadingElement.style.display = 'block';
noDataElement.style.display = 'none';
tableBody.innerHTML = '';
try {
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
// Get all vehicles from vehicle_registry
const { data: vehiclesData, error: vehiclesError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('vehicle_registry')
.select('plate')
.order('plate', { ascending: true });
});
if (vehiclesError) throw vehiclesError;
// Get tools data for all vehicles
const { data: toolsData, error: toolsError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('vehicle_tools')
.select('*');
});
if (toolsError) throw toolsError;
loadingElement.style.display = 'none';
if (!vehiclesData || vehiclesData.length === 0) {
noDataElement.style.display = 'block';
return;
}
// Filter vehicles based on search input
const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
let filteredVehicles = vehiclesData;
if (searchTerm) {
filteredVehicles = vehiclesData.filter(vehicle => {
return (
(vehicle.plate && vehicle.plate.toLowerCase().includes(searchTerm))
);
});
}
if (filteredVehicles.length === 0) {
noDataElement.style.display = 'block';
return;
}
// Create tools lookup map
const toolsMap = new Map();
if (toolsData) {
toolsData.forEach(tool => {
toolsMap.set(tool.plate_no, tool);
});
}
// Populate table with filtered vehicles
filteredVehicles.forEach(vehicle => {
const tools = toolsMap.get(vehicle.plate) || {};
const row = document.createElement('tr');
row.innerHTML = `
<td style="font-weight: 600; color: var(--black1);">${vehicle.plate || '-'}</td>
<td>${createToolsStatusButton('mechanical_key', vehicle.plate, tools.mechanical_key || false)}</td>
<td>${createToolsStatusButton('battery_case_key', vehicle.plate, tools.battery_case_key || false)}</td>
<td>${createToolsStatusButton('adblue_key', vehicle.plate, tools.adblue_key || false)}</td>
<td>${createToolsStatusButton('wheel_chock', vehicle.plate, tools.wheel_chock || false)}</td>
<td>${createToolsStatusButton('first_aid_kit', vehicle.plate, tools.first_aid_kit || false)}</td>
<td>${createToolsStatusButton('hazard_warning_triangle', vehicle.plate, tools.hazard_warning_triangle || false)}</td>
<td>${createToolsStatusButton('warning_lamp', vehicle.plate, tools.warning_lamp || false)}</td>
<td>${createToolsStatusButton('spare_bulb', vehicle.plate, tools.spare_bulb || false)}</td>
<td>${createToolsStatusButton('manual', vehicle.plate, tools.manual || false)}</td>
<td>${createToolsStatusButton('tire_inflating_hose', vehicle.plate, tools.tire_inflating_hose || false)}</td>
<td>${createToolsStatusButton('tilt_bar', vehicle.plate, tools.tilt_bar || false)}</td>
<td>${createToolsStatusButton('tire_jack', vehicle.plate, tools.tire_jack || false)}</td>
`;
tableBody.appendChild(row);
});
} catch (error) {
console.error('Error loading tools data:', error);
loadingElement.style.display = 'none';
noDataElement.style.display = 'block';
// Handle silently - just log to console as requested
}
}
// Create status button for tool items
function createToolsStatusButton(toolType, plateNo, currentValue) {

const status = currentValue ? true : false;

const statusClass = status ? 'available' : 'not-available';

return `<button class="tools-toggle-btn ${statusClass}"

onclick="toggleToolStatus('${toolType}', '${plateNo}', ${status}, this)"

title="Click to toggle status">

${status ? '✓' : '✗'}

</button>`;
}
// Tools modal event listeners
if (toolsModalCloseBtn) {
toolsModalCloseBtn.addEventListener('click', closeToolsModal);
}
if (toolsModalCancelBtn) {
toolsModalCancelBtn.addEventListener('click', closeToolsModal);
}
// Add search input event listener
const toolsSearchInput = document.getElementById('tools-search-input');
if (toolsSearchInput) {
let searchTimeout;
toolsSearchInput.addEventListener('input', function() {
clearTimeout(searchTimeout);
searchTimeout = setTimeout(() => {
loadToolsData();
}, 300); // Debounce search to avoid excessive API calls
});
}
// Close modal when clicking overlay
if (toolsModalOverlay) {
toolsModalOverlay.addEventListener('click', function(e) {
if (e.target === toolsModalOverlay) {
closeToolsModal();
}
});
}
// ============ Container Trailer Button Event Listeners ============
const containerTrailerBtns = document.querySelectorAll('.container-trailer-btn');
containerTrailerBtns.forEach(btn => {
btn.addEventListener('click', function(e) {
e.preventDefault();
const action = this.dataset.action;
switch(action) {
case 'preventive-maintenance':
openRfidModal();
break;
case 'container-list':
// Handle container list action
break;
case 'trailer-list':
// Handle trailer list action
break;
case 'change-tires':
openTireSizeModal();
break;
case 'tools':
openToolsModal();
break;
default:
}
});
});
// Load repairs, and truck images on page load
if (supabaseClient) {
setTimeout(() => {
loadPlateOptions();
loadRepairs();
loadTruckImages(selectedPlantFilter);
}, 500);
}
});
// ============ GPS Status Functions ============
// Load GPS status records
async function loadGpsStatus() {
// Table is intentionally kept empty
return;
}
// Generate random location for demo purposes
function getRandomLocation() {

const locations = [

'Manila, Philippines',

'Quezon City, Philippines',

'Cavite, Philippines',

'Cebu, Philippines',

'Makati, Philippines',

'Pasay, Philippines'

];

return locations[Math.floor(Math.random() * locations.length)];
}
// Display GPS status records in table
function displayGpsStatus(records) {

const tableBody = document.querySelector('#gps-status-table tbody');

if (!tableBody) return;

if (records.length === 0) {

tableBody.innerHTML = `

<tr>

<td colspan="6" style="text-align: center; padding: 40px; color: #666;">

<div style="margin-bottom: 10px;">

<ion-icon name="location-outline" style="font-size: 48px; color: #ccc;"></ion-icon>

</div>

<div>No GPS tracking data available</div>

<div style="font-size: 12px; margin-top: 5px;">GPS tracking will appear here when vehicles are equipped with GPS devices</div>

</td>

</tr>

`;

return;
}
const rows = records.map(record => {
const statusClass = record.gps_status === 'Active' ? 'status-active' : 'status-inactive';
const signalBars = generateSignalBars(record.signal_strength);
return `
<tr>
<td>${record.plate}</td>
<td>${record.vehicle}</td>
<td><span class="status-badge ${statusClass}">${record.gps_status}</span></td>
<td>${formatDateTime(record.last_update)}</td>
<td>${record.location}</td>
<td>${signalBars}</td>
</tr>
`;
}).join('');
tableBody.innerHTML = rows;
}
// Generate signal strength bars
function generateSignalBars(strength) {

const bars = [];

for (let i = 1; i <= 5; i++) {

const filled = i <= strength ? 'filled' : '';

bars.push(`<div class="signal-bar ${filled}"></div>`);
}
return `<div class="signal-strength">${bars.join('')}</div>`;
}
// Format date time
function formatDateTime(dateString) {

if (!dateString) return 'N/A';

const date = new Date(dateString);

return date.toLocaleString('en-US', {

month: 'short',

day: 'numeric',

year: 'numeric',

hour: '2-digit',

minute: '2-digit'

});
}
// ================== Plant Selection Functions ==================
function selectPlant(plant) {

// Use the existing applyPlantFilter function for consistency

applyPlantFilter(plant);
}
function updatePlantUI() {

const selectedPlant = plantStateManager.getSelectedPlant();

// Update plant cards

const plantCards = document.querySelectorAll('.plant-card');

plantCards.forEach(card => {

const cardPlant = card.dataset.plant;

if (cardPlant === selectedPlant) {

card.classList.add('active');

} else {

card.classList.remove('active');
}
});
// Update clear filter button text
const clearBtn = document.getElementById('clear-filter-btn-status');
if (clearBtn) {
clearBtn.textContent = `Show All Plants`;
}
}
// Legacy function already defined above - removed duplicate
// Plant card event listeners are already handled in the main DOMContentLoaded listener above
// ================== Universal Search Functionality ==================
let searchTimeout;
// Initialize universal search
const searchInput = document.getElementById('universal-search');
if (searchInput) {
searchInput.addEventListener('input', handleUniversalSearch);
}
// Handle universal search with debounce
function handleUniversalSearch(event) {

clearTimeout(searchTimeout);

const searchTerm = event.target.value.trim();

// Debounce search for better performance

searchTimeout = setTimeout(() => {

performUniversalSearch(searchTerm);

}, 300);
}
// Perform universal search across all visible tables and truck gallery
function performUniversalSearch(searchTerm) {

// Get all tables in the currently active tab

const activeView = document.querySelector('.content-view.active');

if (!activeView) return;

const tables = activeView.querySelectorAll('table');

tables.forEach(table => {

searchTable(table, searchTerm);

});

// Also search in truck gallery grid if it exists in the active view

const truckGallery = activeView.querySelector('#truck-gallery-grid');

if (truckGallery) {

searchTruckGallery(truckGallery, searchTerm);
}
}
// Search individual table
function searchTable(table, searchTerm) {

const tbody = table.querySelector('tbody');

if (!tbody) return;

const rows = tbody.querySelectorAll('tr');

let hasResults = false;

rows.forEach(row => {

const rowText = getRowSearchText(row);

const matches = searchTerm === '' ||

rowText.toLowerCase().includes(searchTerm.toLowerCase());

// Show/hide row based on match

row.style.display = matches ? '' : 'none';

if (matches) {

hasResults = true;
}
});
// Show "no results" message if needed
showNoResultsMessage(table, !hasResults && searchTerm !== '');
}
// Search truck gallery grid
function searchTruckGallery(gallery, searchTerm) {

const truckCards = gallery.querySelectorAll('.truck-card');

let hasResults = false;

truckCards.forEach(card => {

const cardText = getTruckCardSearchText(card);

const matches = searchTerm === '' ||

cardText.toLowerCase().includes(searchTerm.toLowerCase());

// Show/hide truck card based on match

card.style.display = matches ? '' : 'none';

if (matches) {

hasResults = true;
}
});
// Show "no results" message for truck gallery if needed
showTruckGalleryNoResults(gallery, !hasResults && searchTerm !== '');
}
// Get searchable text from table row
function getRowSearchText(row) {

const cells = row.querySelectorAll('td');

let text = '';

cells.forEach(cell => {

// Get text content, excluding HTML tags

text += cell.textContent + ' ';

});

return text.trim();
}
// Get searchable text from truck card
function getTruckCardSearchText(card) {

let text = '';

// Look for plate number (usually in a specific element)

const plateElement = card.querySelector('.truck-plate, .plate-number, [data-plate]');

if (plateElement) {

text += plateElement.textContent + ' ';
}
// Get all text content as fallback
text += card.textContent + ' ';
return text.trim();
}
// Show no results message for truck gallery
function showTruckGalleryNoResults(gallery, show) {

// Remove existing no results message

const existingMessage = gallery.querySelector('.no-results-message');

if (existingMessage) {

existingMessage.remove();
}
if (show) {
const searchInput = document.getElementById('universal-search');
const searchTerm = searchInput ? searchInput.value.trim() : '';
const messageDiv = document.createElement('div');
messageDiv.className = 'no-results-message';
messageDiv.style.cssText = `
text-align: center;
padding: 40px 20px;
color: #666;
font-style: italic;
grid-column: 1 / -1;
background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
border-radius: 8px;
border: 1px dashed #dee2e6;
margin: 10px 0;
`;
messageDiv.innerHTML = `No truck images found for "${searchTerm}"`;
gallery.appendChild(messageDiv);
}
}
// Show/hide no results message
function showNoResultsMessage(table, show) {

const tbody = table.querySelector('tbody');

// Remove existing no results message

const existingMessage = tbody.querySelector('.no-results-message');

if (existingMessage) {

existingMessage.remove();
}
if (show) {
const searchInput = document.getElementById('universal-search');
const searchTerm = searchInput ? searchInput.value.trim() : '';
const plantName = selectedPlantFilter || 'All Plants';
const messageRow = document.createElement('tr');
messageRow.className = 'no-results-message';
messageRow.innerHTML = `
<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">
No results found for "${searchTerm}" in ${plantName}
</td>
`;
tbody.appendChild(messageRow);
}
}
// ================== GPS Modal Functionality ==================
// GPS Modal Variables
let editingGpsId = null;
// GPS Modal Elements
const gpsModal = document.getElementById('gps-modal');
const gpsModalOverlay = document.getElementById('gps-modal-overlay');
const gpsModalCloseBtn = document.getElementById('gps-modal-close-btn');
const gpsModalCancelBtn = document.getElementById('gps-modal-cancel-btn');
const gpsForm = document.getElementById('gps-form');
const addGpsBtn = document.getElementById('add-gps-btn');
const statusBtn = document.getElementById('new-gps-btn');
const statusTable = document.getElementById('status-summary-table');
const gpsTable = document.getElementById('gps-status-table');
const gpsTrackingTitle = document.getElementById('gps-tracking-title');
// Status Modal Elements
const statusModal = document.getElementById('status-modal');
const statusModalOverlay = document.getElementById('status-modal-overlay');
const statusModalCloseBtn = document.getElementById('status-modal-close-btn');
const statusModalCancelBtn = document.getElementById('status-modal-cancel-btn');
const statusForm = document.getElementById('status-form');
// Open Status Modal
function openStatusModal() {

// Check if user is admin

if (!window.authSystem || !window.authSystem.isAdmin()) {

showError('Access denied. Admin privileges required.', 'Authentication Error');

return;
}
if (!statusModal || !statusModalOverlay) return;
// Reset form
statusForm.reset();
clearStatusFormErrors();
editingStatusId = null;
// Set today's date as default for date_installed
const today = new Date().toISOString().split('T')[0];
const dateInstalledField = document.getElementById('status-date-installed');
if (dateInstalledField) {
dateInstalledField.value = today;
}
// Update button text
const submitBtn = statusForm.querySelector('button[type="submit"]');
if (submitBtn) {
submitBtn.textContent = 'Add Status';
}
// Show modal
statusModal.style.display = 'block';
statusModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
}
// Close Status Modal
function closeStatusModal() {

if (!statusModal || !statusModalOverlay) return;

statusModal.style.display = 'none';

statusModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

statusForm.reset();

clearStatusFormErrors();

editingStatusId = null;

// Clear editing ID from form dataset
if (statusForm) {
delete statusForm.dataset.editingId;
}

// Reset modal title
const modalTitle = document.querySelector('#status-modal h2');
if (modalTitle) modalTitle.textContent = 'Add Status Record';

// Reset submit button text
const submitBtn = statusForm.querySelector('button[type="submit"]');
if (submitBtn) {
submitBtn.textContent = 'Add Status';
}
}
// Clear Status form validation errors
function clearStatusFormErrors() {

if (!statusForm) return;

const formGroups = statusForm.querySelectorAll('.form-group');

formGroups.forEach(group => {

group.classList.remove('error');

});

const errorMessages = statusForm.querySelectorAll('.error-message');

errorMessages.forEach(error => {

error.style.display = 'none';

error.textContent = '';

});
}
// Toggle Status Table
function toggleStatusTable() {

if (!statusTable || !gpsTable) return;

if (statusTable.style.display === 'none' || statusTable.style.display === '') {

// Show status table, hide GPS table

statusTable.style.display = 'table';

gpsTable.style.display = 'none';

loadStatusData();

// Update UI elements for Status view

if (gpsTrackingTitle) gpsTrackingTitle.textContent = 'Vehicle Status';

if (addGpsBtn) addGpsBtn.textContent = '+ Add Status';

if (statusBtn) statusBtn.textContent = 'GPS';

} else {

// Hide status table, show GPS table

statusTable.style.display = 'none';

gpsTable.style.display = 'table';

// Update UI elements for GPS view

if (gpsTrackingTitle) gpsTrackingTitle.textContent = 'GPS Tracking Status';

if (addGpsBtn) addGpsBtn.textContent = '+ Add GPS Record';

if (statusBtn) statusBtn.textContent = 'Status';
}
}
// Load Status Data from vehicle_status_records table
async function loadStatusData() {
if (!window.getSupabaseClient) return;

const supabaseClient = window.getSupabaseClient();

try {
const { data: statusRecords, error } = await supabaseClient
.from('vehicle_status_records')
.select('*')
.order('date_installed', { ascending: false });

if (error) throw error;

displayStatusData(statusRecords || []);
} catch (error) {
console.error('Error loading status data:', error);
const statusTableBody = statusTable.querySelector('tbody');
if (statusTableBody) {
statusTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666;">Error loading data</td></tr>';
}
}
}
// Display status data in table
function displayStatusData(statusRecords) {

const statusTableBody = statusTable.querySelector('tbody');

if (!statusTableBody) return;

const isAdmin = window.authSystem && window.authSystem.isAdmin();

if (statusRecords.length === 0) {

statusTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666; font-style: italic;">No status records found</td></tr>';

return;
}
const rows = statusRecords.map(record => {
const dateInstalled = record.date_installed ? formatDateWithShortMonth(record.date_installed) : '-';
const statusClass = record.status === 'active' ? 'status-active' :
record.status === 'offline' ? 'status-inactive' : 'status-warning';
const actionsHtml = isAdmin ? `
<button class="action-btn" onclick="editStatusRecord('${record.id}')" style="margin-right: 5px;">Edit</button>
<button class="action-btn" onclick="deleteStatusRecord('${record.id}')">Delete</button>
` : '-';
return `
<tr>
<td>${record.plate_no || '-'}</td>
<td>${record.imei_no || '-'}</td>
<td>
<span class="status-badge ${statusClass}">${record.status || '-'}</span>
</td>
<td>${record.remarks || '-'}</td>
<td>${record.date_repair_or_pullout ? formatDateWithShortMonth(record.date_repair_or_pullout) : '-'}</td>
<td>${dateInstalled}</td>
<td>${record.plant || '-'}</td>
<td>${actionsHtml}</td>
</tr>
`;
}).join('');
statusTableBody.innerHTML = rows;
}
// Edit Status Record
async function editStatusRecord(recordId) {
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}

if (!window.getSupabaseClient) return;

const supabaseClient = window.getSupabaseClient();

try {
const { data: record, error } = await supabaseClient
.from('vehicle_status_records')
.select('*')
.eq('id', recordId)
.single();

if (error) throw error;

// Populate the status form with the record data
if (statusForm) {
document.getElementById('status-plate-no').value = record.plate_no || '';
document.getElementById('status-imei-no').value = record.imei_no || '';
document.getElementById('status-vehicle-status').value = record.status || '';
document.getElementById('status-remarks').value = record.remarks || '';
document.getElementById('status-date-repair-pullout').value = record.date_repair_or_pullout || '';
document.getElementById('status-date-installed').value = record.date_installed || '';
document.getElementById('status-plant').value = record.plant || '';

// Store the record ID for updating
statusForm.dataset.editingId = recordId;

// Change modal title
const modalTitle = document.querySelector('#status-modal h2');
if (modalTitle) modalTitle.textContent = 'Edit Status Record';

// Show the modal
if (statusModal) statusModal.style.display = 'block';
if (statusModalOverlay) statusModalOverlay.style.display = 'block';
}
} catch (error) {
console.error('Error loading status record:', error);
showError('Failed to load status record for editing.', 'Error');
}
}
// Delete Status Record
async function deleteStatusRecord(recordId) {
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}

// Show confirmation dialog using notification system
const confirmed = await new Promise((resolve) => {
notificationSystem.show({
type: 'warning',
title: 'Confirm Delete',
message: 'Are you sure you want to delete this status record?',
autoHide: false,
actions: [
{
text: 'Delete',
primary: true,
callback: 'confirmDeleteStatus'
},
{
text: 'Cancel',
callback: 'cancelDeleteStatus'
}
]
});
// Set up temporary global functions
window.confirmDeleteStatus = () => resolve(true);
window.cancelDeleteStatus = () => resolve(false);
});

if (!confirmed) return;

if (!window.getSupabaseClient) return;

const supabaseClient = window.getSupabaseClient();

try {
const { error } = await supabaseClient
.from('vehicle_status_records')
.delete()
.eq('id', recordId);

if (error) throw error;

showSuccess('Status record deleted successfully!', 'Success');
// Reload the status data
loadStatusData();
} catch (error) {
console.error('Error deleting status record:', error);
showError('Failed to delete status record.', 'Error');
}
}
// Handle Status Form Submit
async function handleStatusFormSubmit(e) {
e.preventDefault();
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!statusForm) return;
const formData = new FormData(statusForm);
const statusData = {
plate_no: formData.get('plate_no')?.trim() || '',
imei_no: formData.get('imei_no')?.trim() || '',
status: formData.get('status') || '',
remarks: formData.get('remarks') || '',
date_repair_or_pullout: formData.get('date_repair_pullout') || null,
date_installed: formData.get('date_installed') || null,
plant: formData.get('plant') || ''
};
// Validate required fields
if (!statusData.plate_no) {
showStatusFieldError('status-plate-no', 'Plate number is required');
return;
}
if (!statusData.imei_no) {
showStatusFieldError('status-imei-no', 'IMEI number is required');
return;
}
if (!statusData.status) {
showStatusFieldError('status-vehicle-status', 'Status is required');
return;
}
try {
// Check if we're editing an existing record
const editingId = statusForm.dataset.editingId;

if (editingId) {
// Update existing record
const { data, error } = await supabaseClient
.from('vehicle_status_records')
.update({
plate_no: statusData.plate_no,
imei_no: statusData.imei_no,
status: statusData.status,
remarks: statusData.remarks,
date_installed: statusData.date_installed,
date_repair_or_pullout: statusData.date_repair_or_pullout,
plant: statusData.plant
})
.eq('id', editingId)
.select();

if (error) throw error;
showSuccess('Status record updated successfully!', 'Success');
} else {
// Insert new record
const { data, error } = await supabaseClient
.from('vehicle_status_records')
.insert([{
plate_no: statusData.plate_no,
imei_no: statusData.imei_no,
status: statusData.status,
remarks: statusData.remarks,
date_installed: statusData.date_installed || new Date().toISOString().split('T')[0],
date_repair_or_pullout: statusData.date_repair_or_pullout,
plant: statusData.plant
}])
.select();

if (error) throw error;
showSuccess('Status record added successfully!', 'Success');
}

closeStatusModal();
loadStatusData(); // Reload status data
} catch (error) {
console.error('Error saving status record:', error);
showError('Failed to save status record. Please try again.', 'Error');
}
}
// Show Status Field Error
function showStatusFieldError(fieldId, message) {

if (!statusForm) return;

const field = statusForm.querySelector(`#${fieldId}`);

if (!field) return;

const formGroup = field.closest('.form-group');

if (formGroup) {

const errorElement = formGroup.querySelector('.error-message');

if (errorElement) {

errorElement.textContent = message;

errorElement.style.display = 'block';
}
formGroup.classList.add('has-error');
}
}
// Open GPS Modal
function openGpsModal() {

// Check if user is admin

if (!window.authSystem || !window.authSystem.isAdmin()) {

showError('Access denied. Admin privileges required.', 'Authentication Error');

return;
}
if (!gpsModal || !gpsModalOverlay) return;
// Reset form
gpsForm.reset();
clearGpsFormErrors();
editingGpsId = null;
// Set today's date as default
const today = new Date().toISOString().split('T')[0];
document.getElementById('gps-date').value = today;
// Update button text
const submitBtn = gpsForm.querySelector('button[type="submit"]');
const btnText = submitBtn.querySelector('.btn-text');
btnText.textContent = 'Save GPS Record';
// Show modal
gpsModal.style.display = 'block';
gpsModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
}
// Close GPS Modal
function closeGpsModal() {

if (!gpsModal || !gpsModalOverlay) return;

gpsModal.style.display = 'none';

gpsModalOverlay.style.display = 'none';

document.body.style.overflow = 'auto';

gpsForm.reset();

clearGpsFormErrors();

editingGpsId = null;
}
// Clear GPS form validation errors
function clearGpsFormErrors() {

if (!gpsForm) return;

const formGroups = gpsForm.querySelectorAll('.form-group');

formGroups.forEach(group => {

group.classList.remove('error');

});
}
// Validate GPS form
function validateGpsForm() {

if (!gpsForm) return false;

let isValid = true;

clearGpsFormErrors();

const date = document.getElementById('gps-date').value.trim();

const plate = document.getElementById('gps-plate').value.trim();

if (!date) {

showGpsFieldError('gps-date', 'Date is required');

isValid = false;
}
if (!plate) {
showGpsFieldError('gps-plate', 'Plate number is required');
isValid = false;
} else {
// Validate plate number format (e.g., ABC 1234, XYZ 567)
const platePattern = /^[A-Z]{2,3}\s?\d{3,4}$/i;
if (!platePattern.test(plate)) {
showGpsFieldError('gps-plate', 'Invalid plate format. Use format like ABC 1234');
isValid = false;
}
}
return isValid;
}
// Show field error
function showGpsFieldError(fieldId, message) {

const field = document.getElementById(fieldId);

const formGroup = field.closest('.form-group');

if (formGroup) {

formGroup.classList.add('error');

let errorMsg = formGroup.querySelector('.error-message');

if (!errorMsg) {

errorMsg = document.createElement('div');

errorMsg.className = 'error-message';

formGroup.appendChild(errorMsg);
}
errorMsg.textContent = message;
}
}
// Handle GPS form submission
async function handleGpsFormSubmit(e) {
e.preventDefault();
if (!validateGpsForm()) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
if (!supabaseClient) {
showError('Database not connected', 'Error');
return;
}
try {
// Show loading state
const submitBtn = gpsForm.querySelector('button[type="submit"]');
const btnText = submitBtn.querySelector('.btn-text');
const btnSpinner = submitBtn.querySelector('.btn-spinner');
submitBtn.disabled = true;
btnText.style.display = 'none';
btnSpinner.style.display = 'inline-block';
// Get form data
const formData = {
date: document.getElementById('gps-date').value,
plate_no: document.getElementById('gps-plate').value.trim(),
description: document.getElementById('gps-description').value.trim(),
remarks: document.getElementById('gps-remarks').value.trim(),
imsi_no: document.getElementById('gps-imsi').value.trim(),
plant: document.getElementById('gps-plant').value
};
let result;
if (editingGpsId) {
// Update existing record
result = await supabaseClient
.from('gps_tracking')
.update(formData)
.eq('id', editingGpsId);
} else {
// Insert new record
result = await supabaseClient
.from('gps_tracking')
.insert([formData]);
}
if (result.error) throw result.error;
showSuccess(
editingGpsId ? 'GPS record updated successfully!' : 'GPS record added successfully!',
'Success'
);
// Close modal and reload data
closeGpsModal();
await loadGpsData();
} catch (err) {
console.error('Error saving GPS record:', err);
showError('Error saving GPS record: ' + err.message, 'Error');
} finally {
// Restore button state
const submitBtn = gpsForm.querySelector('button[type="submit"]');
const btnText = submitBtn.querySelector('.btn-text');
const btnSpinner = submitBtn.querySelector('.btn-spinner');
submitBtn.disabled = false;
btnText.style.display = 'inline-block';
btnSpinner.style.display = 'none';
}
}
// Load GPS data
async function loadGpsData() {
if (!supabaseClient) return;
try {
let query = supabaseClient
.from('gps_tracking')
.select('*')
.order('date', { ascending: false });
// Apply plant filter if active
if (gpsPlantFilter) {
query = query.eq('plant', gpsPlantFilter);
}
const { data: gpsRecords, error } = await query;
if (error) throw error;
displayGpsData(gpsRecords || []);
} catch (error) {
console.error('Error loading GPS data:', error);
const tbody = document.querySelector('#gps-status-table tbody');
if (tbody) {
const isAdmin = window.authSystem && window.authSystem.isAdmin();
const colspan = isAdmin ? 7 : 6; // 7 columns for admin, 6 for guest (no Actions column)
tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: #666;">Error loading data</td></tr>`;
}
}
}
// Format date with three-letter month abbreviation
function formatDateWithShortMonth(dateString) {

const date = new Date(dateString);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const month = months[date.getMonth()];

const day = date.getDate();

const year = date.getFullYear();

return `${month} ${day} ${year}`;
}
// Display GPS data in table
function displayGpsData(gpsRecords) {

const tbody = document.querySelector('#gps-status-table tbody');

if (!tbody) return;

// Check if user is admin (guest view if not)

const isAdmin = window.authSystem && window.authSystem.isAdmin();

// Hide/show Actions column header in GPS table based on auth status

const gpsActionsHeader = document.querySelector('#gps-status-table thead tr td:nth-child(7)');

if (gpsActionsHeader) {

gpsActionsHeader.style.display = isAdmin ? '' : 'none';
}
if (gpsRecords.length === 0) {
const colspan = isAdmin ? 7 : 6; // 7 columns for admin, 6 for guest (no Actions column)
tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: #666; font-style: italic;">No GPS records found</td></tr>`;
return;
}
// Sort GPS records alphabetically by plate number
gpsRecords.sort((a, b) => {
const plateA = (a.plate_no || '').toLowerCase();
const plateB = (b.plate_no || '').toLowerCase();
return plateA.localeCompare(plateB);
});

const rows = gpsRecords.map(record => `
<tr>
<td>${formatDateWithShortMonth(record.date)}</td>
<td>${record.plate_no || ''}</td>
<td>${record.description || ''}</td>
<td>${record.remarks || ''}</td>
<td>${record.imsi_no || ''}</td>
<td>${record.plant || ''}</td>
${isAdmin ? `
<td style="text-align: center; gap: 5px; display: flex;">
<button onclick="editGpsRecord('${record.id}')" class="action-btn">Edit</button>
<button onclick="deleteGpsRecord('${record.id}')" class="action-btn">Delete</button>
</td>` : ''}
</tr>
`).join('');
tbody.innerHTML = rows;
}
// Edit GPS record
async function editGpsRecord(id) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) return;
try {
const { data: record, error } = await supabaseClient
.from('gps_tracking')
.select('*')
.eq('id', id)
.single();
if (error) throw error;
editingGpsId = id;
// Fill form with record data
document.getElementById('gps-date').value = record.date;
document.getElementById('gps-plate').value = record.plate_no;
document.getElementById('gps-description').value = record.description || '';
document.getElementById('gps-remarks').value = record.remarks || '';
document.getElementById('gps-imsi').value = record.imsi_no || '';
document.getElementById('gps-plant').value = record.plant || '';
// Update button text
const submitBtn = gpsForm.querySelector('button[type="submit"]');
const btnText = submitBtn.querySelector('.btn-text');
btnText.textContent = 'Update GPS Record';
// Show modal
gpsModal.style.display = 'block';
gpsModalOverlay.style.display = 'block';
document.body.style.overflow = 'hidden';
} catch (err) {
console.error('Error loading GPS record for edit:', err);
showError('Error loading record: ' + err.message, 'Error');
}
}
// Delete GPS record
async function deleteGpsRecord(id) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) return;
// Show confirmation dialog
const confirmed = await new Promise((resolve) => {
notificationSystem.show({
type: 'warning',
title: 'Confirm Delete',
message: 'Are you sure you want to delete this GPS record?',
autoHide: false,
actions: [
{
text: 'Delete',
primary: true,
callback: 'confirmDelete'
},
{
text: 'Cancel',
primary: false,
callback: 'cancelDelete'
}
]
});
// Set up temporary global functions
window.confirmDelete = () => resolve(true);
window.cancelDelete = () => resolve(false);
});
if (!confirmed) return;
try {
const { error } = await supabaseClient
.from('gps_tracking')
.delete()
.eq('id', id);
if (error) throw error;
showSuccess('GPS record deleted successfully!', 'Success');
await loadGpsData();
} catch (err) {
console.error('Error deleting GPS record:', err);
showError('Error deleting record: ' + err.message, 'Error');
}
}
// Status Button Event Listener
if (statusBtn) {
statusBtn.addEventListener('click', toggleStatusTable);
}
// Add Button Event Listener - handles both GPS and Status
if (addGpsBtn) {
addGpsBtn.addEventListener('click', function() {
// Check which view is currently active
if (statusTable && statusTable.style.display !== 'none' && statusTable.style.display !== '') {
// Status view is active, open Status modal
openStatusModal();
} else {
// GPS view is active, open GPS modal
openGpsModal();
}
});
}
if (gpsModalCloseBtn) {
gpsModalCloseBtn.addEventListener('click', closeGpsModal);
}
if (gpsModalCancelBtn) {
gpsModalCancelBtn.addEventListener('click', closeGpsModal);
}
if (gpsModalOverlay) {
gpsModalOverlay.addEventListener('click', function(e) {
if (e.target === gpsModalOverlay) {
closeGpsModal();
}
});
}
if (gpsForm) {
gpsForm.addEventListener('submit', handleGpsFormSubmit);
}
// Status Modal Event Listeners
if (statusModalCloseBtn) {
statusModalCloseBtn.addEventListener('click', closeStatusModal);
}
if (statusModalCancelBtn) {
statusModalCancelBtn.addEventListener('click', closeStatusModal);
}
if (statusModalOverlay) {
statusModalOverlay.addEventListener('click', function(e) {
if (e.target === statusModalOverlay) {
closeStatusModal();
}
});
}
if (statusForm) {
statusForm.addEventListener('submit', handleStatusFormSubmit);
}
// Status Trailer Modal Event Listeners
const statusTrailerModalCloseBtn = document.getElementById('status-trailer-modal-close-btn');
const statusTrailerModalCancelBtn = document.getElementById('status-trailer-modal-cancel-btn');
const statusTrailerModalOverlay = document.getElementById('status-trailer-modal-overlay');
const statusTrailerForm = document.getElementById('status-trailer-form');

if (statusTrailerModalCloseBtn) {
statusTrailerModalCloseBtn.addEventListener('click', closeStatusTrailerModal);
}
if (statusTrailerModalCancelBtn) {
statusTrailerModalCancelBtn.addEventListener('click', closeStatusTrailerModal);
}
if (statusTrailerModalOverlay) {
statusTrailerModalOverlay.addEventListener('click', function(e) {
if (e.target === statusTrailerModalOverlay) {
closeStatusTrailerModal();
}
});
}
if (statusTrailerForm) {
statusTrailerForm.addEventListener('submit', handleStatusTrailerFormSubmit);
}

// Status dropdown change listener for Date Reported field
const statusTrailerStatus = document.getElementById('status-trailer-status');
if (statusTrailerStatus) {
statusTrailerStatus.addEventListener('change', function() {
const dateReportedGroup = document.getElementById('trailer-date-reported-group');
console.log('Status changed to:', this.value); // Debug log
if (this.value === 'DOWN') {
dateReportedGroup.style.display = 'block';
console.log('Showing date reported field'); // Debug log
} else {
dateReportedGroup.style.display = 'none';
document.getElementById('status-trailer-date-reported').value = '';
console.log('Hiding date reported field'); // Debug log
}
});
} else {
console.log('Status trailer dropdown not found'); // Debug log
}

// Status dropdown change listener for Container Date Reported field
const statusContainerStatus = document.getElementById('status-container-status');
if (statusContainerStatus) {
statusContainerStatus.addEventListener('change', function() {
const dateReportedGroup = document.getElementById('container-date-reported-group');
console.log('Container status changed to:', this.value); // Debug log
if (this.value === 'DOWN') {
dateReportedGroup.style.display = 'block';
console.log('Showing container date reported field'); // Debug log
} else {
dateReportedGroup.style.display = 'none';
document.getElementById('status-container-date-reported').value = '';
console.log('Hiding container date reported field'); // Debug log
}
});
} else {
console.log('Status container dropdown not found'); // Debug log
}

// File input event listeners for PDF uploads
const statusTrailerOrPdf = document.getElementById('status-trailer-or-pdf');
const statusTrailerCrPdf = document.getElementById('status-trailer-cr-pdf');

if (statusTrailerOrPdf) {
statusTrailerOrPdf.addEventListener('change', function() {
handleTrailerFileChange('or', this.files[0]);
});
}

if (statusTrailerCrPdf) {
statusTrailerCrPdf.addEventListener('change', function() {
handleTrailerFileChange('cr', this.files[0]);
});
}

// File input event listeners for truck modal PDF uploads
const statusTruckOrPdf = document.getElementById('status-truck-or-pdf');
const statusTruckCrPdf = document.getElementById('status-truck-cr-pdf');

if (statusTruckOrPdf) {
statusTruckOrPdf.addEventListener('change', function() {
handleTruckFileChange('or', this.files[0]);
});
}

if (statusTruckCrPdf) {
statusTruckCrPdf.addEventListener('change', function() {
handleTruckFileChange('cr', this.files[0]);
});
}

// Date change event listeners for trailer form removed to prevent automatic status reset
// Users can now manually set status without it being overridden by date changes

// Add date change event listeners for truck form
const truckRegistrationDate = document.getElementById('status-registration-date');
const truckExpirationDate = document.getElementById('status-expiration-date');
const truckStatus = document.getElementById('status');

if (truckRegistrationDate) {
truckRegistrationDate.addEventListener('change', function() {
updateStatusBasedOnDates('status-registration-date', 'status-expiration-date', 'status');
});
}

if (truckExpirationDate) {
truckExpirationDate.addEventListener('change', function() {
updateStatusBasedOnDates('status-registration-date', 'status-expiration-date', 'status');
});
}
// Status Container Modal Event Listeners
const statusContainerModalCloseBtn = document.getElementById('status-container-modal-close-btn');
const statusContainerModalCancelBtn = document.getElementById('status-container-modal-cancel-btn');
const statusContainerModalOverlay = document.getElementById('status-container-modal-overlay');
const statusContainerForm = document.getElementById('status-container-form');

if (statusContainerModalCloseBtn) {
statusContainerModalCloseBtn.addEventListener('click', closeStatusContainerModal);
}
if (statusContainerModalCancelBtn) {
statusContainerModalCancelBtn.addEventListener('click', closeStatusContainerModal);
}
if (statusContainerModalOverlay) {
statusContainerModalOverlay.addEventListener('click', function(e) {
if (e.target === statusContainerModalOverlay) {
closeStatusContainerModal();
}
});
}
if (statusContainerForm) {
statusContainerForm.addEventListener('submit', handleStatusContainerFormSubmit);
}
// Clear error on input
document.addEventListener('input', function(e) {
if (e.target.matches('#gps-form input, #gps-form select, #gps-form textarea')) {
const formGroup = e.target.closest('.form-group');
if (formGroup) {
formGroup.classList.remove('error');
}
}
});
// ================== Table State Management ==================
let selectedTable = 'truck'; // Default to truck table
let selectedVehicleType = 'truck'; // Track current vehicle type (truck, trailer, container)
let lastSelectedParentButton = 'truck'; // Track last selected parent button (truck or trailer)
// Table switching functionality
function switchTable(tableType) {

selectedTable = tableType;

// Get all table elements

const truckTable = document.getElementById('status-table');

const truckTable2 = document.getElementById('status-table-2');

const trailerTable = document.getElementById('trailer-table');

const containerTable = document.getElementById('status-container-table');

const orTable = document.getElementById('or-table');

const trailerCrTable = document.getElementById('trailer-cr-table');

const trailerOrTable = document.getElementById('trailer-or-table');

const summaryTable = document.getElementById('vehicle-status-summary-table');

// Get C/R and O/R buttons

const crBtn = document.getElementById('cr-table-btn');

const orBtn = document.getElementById('or-table-btn');

// Hide all tables first

if (truckTable) truckTable.style.display = 'none';

if (truckTable2) truckTable2.style.display = 'none';

if (trailerTable) trailerTable.style.display = 'none';

if (containerTable) containerTable.style.display = 'none';

if (orTable) orTable.style.display = 'none';

if (trailerCrTable) trailerCrTable.style.display = 'none';

if (trailerOrTable) trailerOrTable.style.display = 'none';

if (summaryTable) summaryTable.closest('.recentVehicles').style.display = 'none';

// Track vehicle type and control C/R and O/R button visibility

if (tableType === 'truck') {

selectedVehicleType = 'truck';

// Show C/R and O/R buttons for truck

if (crBtn) crBtn.style.display = '';

if (orBtn) orBtn.style.display = '';

// Hide Trailer and Container buttons, show Add button for truck

updateStatusButtons('truck');

} else if (tableType === 'trailer') {

selectedVehicleType = 'trailer';

// Show C/R and O/R buttons for trailer

if (crBtn) crBtn.style.display = '';

if (orBtn) orBtn.style.display = '';

// Show Trailer button, hide Container button

updateStatusButtons('trailer');

} else if (tableType === 'container') {

selectedVehicleType = 'container';

// Hide C/R and O/R buttons for container

if (crBtn) crBtn.style.display = 'none';

if (orBtn) orBtn.style.display = 'none';

// Show Container button, hide Trailer button

updateStatusButtons('container');

} else if (tableType === 'cr' || tableType === 'or') {

// For C/R and O/R, maintain the current vehicle type but hide + Trailer and + Container buttons

// Don't change selectedVehicleType, just show/hide buttons based on current context

if (selectedVehicleType === 'truck' || selectedVehicleType === 'trailer') {

if (crBtn) crBtn.style.display = '';

if (orBtn) orBtn.style.display = '';

} else {

// Default to truck if no vehicle type is set

selectedVehicleType = 'truck';

if (crBtn) crBtn.style.display = '';

if (orBtn) orBtn.style.display = '';
}
// Hide + Trailer and + Container buttons for C/R and O/R tabs
updateStatusButtons('cr-or');
}
// Show selected table and load its data
switch (tableType) {
case 'truck':
if (truckTable) {
truckTable.style.display = '';
// Load fresh data from database before displaying
loadVehicleStatus().then(() => {
loadTruckData();
}).catch(err => {
console.error('Error loading vehicle status:', err);
});
}
if (summaryTable) summaryTable.closest('.recentVehicles').style.display = 'block';
// Load vehicle status summary
if (typeof window.statusModule !== 'undefined' && typeof window.statusModule.loadVehicleStatusSummary === 'function') {
window.statusModule.loadVehicleStatusSummary(selectedPlantFilter);
}
break;
case 'trailer':
if (trailerTable) {
trailerTable.style.display = '';
loadStatusTrailerData();
}
break;
case 'container':
if (containerTable) {
containerTable.style.display = '';
loadContainerData();
}
break;
case 'cr':
if (selectedVehicleType === 'truck') {
if (truckTable2) {
truckTable2.style.display = '';
loadCertificateOfRegistrationData();
}
} else if (selectedVehicleType === 'trailer') {
if (trailerCrTable) {
trailerCrTable.style.display = '';
loadTrailerCertificateOfRegistrationData();
}
}
break;
case 'or':
if (selectedVehicleType === 'truck') {
if (orTable) {
orTable.style.display = '';
loadOfficialReceiptData();
}
} else if (selectedVehicleType === 'trailer') {
if (trailerOrTable) {
trailerOrTable.style.display = '';
loadTrailerOfficialReceiptData();
}
}
break;
}
// Update button styles to show active state
updateTableButtonStyles(tableType);
// Show/hide Add buttons based on active table and user role
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
// Hide all add buttons first
if (addTrailerBtn) addTrailerBtn.style.display = 'none';
if (addContainerBtn) addContainerBtn.style.display = 'none';
// Show appropriate add button only for admin users
if (isAdmin) {
if (tableType === 'trailer' && addTrailerBtn) {
addTrailerBtn.style.display = 'block';
} else if (tableType === 'container' && addContainerBtn) {
addContainerBtn.style.display = 'block';
}
}
}
// Update button styles to reflect active table
function updateTableButtonStyles(activeTable) {

const buttons = document.querySelectorAll('.table-switch-btn');

buttons.forEach(btn => {

const btnTable = btn.dataset.table;

// Keep vehicle type buttons (truck, trailer, container) active when C/R or O/R is selected

if (activeTable === 'cr' || activeTable === 'or') {

// When C/R or O/R is active, keep the current vehicle type button active too

if (btnTable === selectedVehicleType || btnTable === activeTable) {

btn.classList.add('active');

} else {

btn.classList.remove('active');
}
} else {
// Normal behavior for other table switches
if (btnTable === activeTable) {
btn.classList.add('active');
} else {
btn.classList.remove('active');
}
}
});
// Show/hide + Truck button based on active table
const addTruckBtn = document.getElementById('add-truck-btn');
if (addTruckBtn)
addTruckBtn.style.display = activeTable === 'truck' ? '' : 'none';
// Show/hide + Trailer button based on active table
const addTrailerBtn = document.getElementById('add-trailer-btn');
if (addTrailerBtn)
addTrailerBtn.style.display = activeTable === 'trailer' ? '' : 'none';
// Show/hide + Container button based on active table
const addContainerBtn = document.getElementById('add-container-btn');
if (addContainerBtn) {
addContainerBtn.style.display = activeTable === 'container' ? '' : 'none';
}
// Update h2 tag with active table name
const cardHeaderH2 = document.querySelector('#statusTableView .cardHeader h2');
if (cardHeaderH2) {
const tableNames = {
'truck': 'Truck',
'trailer': 'Trailer',
'container': 'Container',
'cr': 'Certificate of Registration'
};
cardHeaderH2.textContent = tableNames[activeTable] || 'Vehicle Registration';
}
}
// Diesel table switching functionality
function switchDieselTable(tableType) {

// Get table elements

const minTable = document.getElementById('diesel-min-table');

const aveTable = document.getElementById('diesel-ave-table');

// Get button elements

const minBtn = document.getElementById('diesel-min-btn');

const aveBtn = document.getElementById('diesel-ave-btn');

// Get Add Diesel buttons

const addMinBtn = document.getElementById('add-diesel-min-btn');

const addAveBtn = document.getElementById('add-diesel-ave-btn');

// Hide both tables first

if (minTable) minTable.style.display = 'none';

if (aveTable) aveTable.style.display = 'none';

// Hide both Add Diesel buttons first

if (addMinBtn) addMinBtn.style.setProperty('display', 'none', 'important');

if (addAveBtn) addAveBtn.style.setProperty('display', 'none', 'important');

// Show selected table

if (tableType === 'min') {

if (minTable) minTable.style.display = '';

if (addMinBtn) addMinBtn.style.setProperty('display', 'inline-block', 'important');

} else if (tableType === 'ave') {

if (aveTable) aveTable.style.display = '';

if (addAveBtn) addAveBtn.style.setProperty('display', 'inline-block', 'important');
}
// Update button active states using CSS classes
const buttons = document.querySelectorAll('.table-switch-btn[data-table="min"], .table-switch-btn[data-table="ave"]');
buttons.forEach(btn => {
const btnTable = btn.dataset.table;
if (btnTable === tableType) {
btn.classList.add('active');
} else {
btn.classList.remove('active');
}
});
}
// Load truck data (existing functionality)
function loadTruckData() {

// Existing truck data loading logic

if (typeof displayVehicleStatus === 'function') {

// Filter out trailer data - only show vehicles that are not trailers
const truckOnlyData = vehicleStatusRecords.filter(vehicle => {
const vehicleType = (vehicle.vehicle_type || '').toLowerCase().trim();
const size = (vehicle.size || '').toLowerCase().trim();
// Exclude vehicles with vehicle_type containing 'trailer' or size containing 'trailer'
return !vehicleType.includes('trailer') && !size.includes('trailer');
});
console.log('Vehicles after truck filter:', truckOnlyData);
displayVehicleStatus(truckOnlyData);
}
}
// Load Certificate of Registration data for C/R table
async function loadCertificateOfRegistrationData() {
const crTable = document.getElementById('status-table-2');
if (!crTable) return;
const tbody = crTable.querySelector('tbody');
if (!tbody) return;
// Filter only truck vehicles for C/R data
const truckVehicles = allVehicles.filter(vehicle =>
!vehicle.vehicle_type || !vehicle.vehicle_type.toLowerCase().includes('trailer')
);
// Get C/R image URLs from drivers_status table
const { data: driverStatusData, error: driverStatusError } = await supabaseClient
.from('drivers_status')
.select('plate, cr_image_url, cr_image_name')
.in('plate', truckVehicles.map(v => v.plate));
if (driverStatusError) {
console.error('Error fetching driver status data:', driverStatusError);
}
// Create a lookup map for image URLs
const imageUrlMap = {};
if (driverStatusData) {
driverStatusData.forEach(status => {
imageUrlMap[status.plate] = status.cr_image_url;
});
}
// Debug logging for Actions column
console.log('Driver Status Data for C/R:', driverStatusData);
console.log('Image URL Map:', imageUrlMap);
const crData = truckVehicles.map(vehicle => ({
plate: vehicle.plate || 'N/A',
mv_file: vehicle.mv_file || 'N/A',
engine_no: vehicle.engine_no || 'N/A',
chassis_no: vehicle.chassis_no || vehicle.chassi_no || 'N/A',
model: vehicle.model || 'N/A',
vehicle_type: vehicle.vehicle_type || 'N/A',
year_model: vehicle.year_model || 'N/A',
gross_weight: vehicle.gross_weight || vehicle.gross_wt || 'N/A',
cr_image_url: imageUrlMap[vehicle.plate] || null
}));
tbody.innerHTML = '';
crData.forEach(cr => {
const row = tbody.insertRow();
row.innerHTML = `
<td>${cr.plate}</td>
<td>${cr.mv_file}</td>
<td>${cr.engine_no}</td>
<td>${cr.chassis_no}</td>
<td>${cr.model}</td>
<td>${cr.vehicle_type}</td>
<td>${cr.year_model}</td>
<td>${cr.gross_weight}</td>
<td style="text-align: center;">
${cr.cr_image_url ? 
  `<i class="fas fa-file-pdf" onclick="viewCrImage('${cr.plate}', '${cr.cr_image_url}')" style="font-size: 20px; color: #dc3545; cursor: pointer; margin-right: 8px;" title="View C/R Document"></i>` :
  `-`
}
</td>
`;
});
}
// Load Official Receipt data for O/R table
async function loadOfficialReceiptData() {
const orTable = document.getElementById('or-table');
if (!orTable) return;
const tbody = orTable.querySelector('tbody');
if (!tbody) return;
try {
// Fetch vehicle registry data
const { data: vehicleRegistryData, error: registryError } = await supabaseClient
.from('vehicle_registry')
.select('plate, size, vehicle_type');
if (registryError) throw registryError;
// Fetch vehicle status data
const { data: vehicleStatusData, error: statusError } = await supabaseClient
.from('vehicle_status')
.select('plate, registered_date, expiration_date');
if (statusError) throw statusError;
// Fetch O/R document URLs from drivers_status table
const { data: driverStatusData, error: driverStatusError } = await supabaseClient
.from('drivers_status')
.select('plate, or_image_url, or_image_name')
.in('plate', vehicleRegistryData.map(v => v.plate));
if (driverStatusError) {
console.error('Error fetching driver status data:', driverStatusError);
}
// Create a lookup map for O/R image URLs
const orImageUrlMap = {};
if (driverStatusData) {
driverStatusData.forEach(status => {
orImageUrlMap[status.plate] = status.or_image_url;
});
}
// Debug logging for O/R Actions column
console.log('O/R Driver Status Data:', driverStatusData);
console.log('O/R Image URL Map:', orImageUrlMap);
// Create a map of vehicle status data by plate for easy lookup
const statusMap = {};
if (vehicleStatusData) {
vehicleStatusData.forEach(status => {
statusMap[status.plate] = {
registered_date: status.registered_date,
expiration_date: status.expiration_date
};
});
}
// Filter only truck vehicles and combine data
const orData = vehicleRegistryData.filter(vehicle =>
!vehicle.vehicle_type || !vehicle.vehicle_type.toLowerCase().includes('trailer')
).map(vehicle => {
const statusInfo = statusMap[vehicle.plate] || {};
// Calculate status based on expiration date
let status = 'No Expiry Date'; // Default to No Expiry Date
if (statusInfo.expiration_date) {
const expiryDate = new Date(statusInfo.expiration_date);
const currentDate = new Date();
const diffTime = expiryDate - currentDate;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
status = diffDays >= 0 ? 'Active' : 'Expired';
}
return {
plate: vehicle.plate || 'N/A',
truck_size: vehicle.size || 'N/A',
registration_date: statusInfo.registered_date || 'N/A',
expiration_date: statusInfo.expiration_date || 'N/A',
status: status,
or_image_url: orImageUrlMap[vehicle.plate] || null
};
});
// Sort O/R data alphabetically by plate number
orData.sort((a, b) => {
const plateA = (a.plate || '').toLowerCase();
const plateB = (b.plate || '').toLowerCase();
return plateA.localeCompare(plateB);
});

tbody.innerHTML = '';
orData.forEach(or => {
const row = tbody.insertRow();
// Add status styling
const statusClass = or.status === 'Active' ? 'status-active' : or.status === 'Expired' ? 'status-expired' : 'status-unknown';
console.log(`Status: ${or.status}, Class: ${statusClass}`); // Debug logging
// Format dates to "Month Day Year" format
const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return dateString;
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  } catch (e) {
    return dateString;
  }
  return dateString;
};

row.innerHTML = `
<td>${or.plate}</td>
<td>${or.truck_size}</td>
<td>${formatDate(or.registration_date)}</td>
<td>${formatDate(or.expiration_date)}</td>
<td><span class="${statusClass}" style="color: ${or.status === 'Active' ? '#28a745' : or.status === 'Expired' ? '#dc3545' : '#6c757d'} !important; font-weight: 600 !important;">${or.status}</span></td>
<td style="text-align: center;">
${or.or_image_url ? 
  `<i class="fas fa-file-pdf" onclick="openPdfInTab('${or.plate}', '${or.or_image_url}', 'OR')" style="font-size: 20px; color: #dc3545; cursor: pointer; margin-right: 8px;" title="View O/R Document"></i>` :
  `-`
}
</td>
`;
});
} catch (error) {
console.error('Error loading O/R data:', error);
tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Error loading data</td></tr>';
}
}
// Handle vehicle action button click
async function handleVehicleAction(plate) {
try {
// Fetch driver status data to get O/R and C/R document URLs
const { data: driverStatus, error: driverError } = await supabaseClient
.from('drivers_status')
.select('*')
.eq('plate', plate)
.single();
if (driverError) {
console.error('Error fetching driver status:', driverError);
showWarning('No documents found for this vehicle', 'No Documents');
return;
}
// Determine which table is currently active
const orTable = document.getElementById('or-table');
const crTable = document.getElementById('status-table-2');
// Check which table is visible to determine context
let showOnlyCR = false;
if (crTable && crTable.style.display !== 'none') {
showOnlyCR = true;
} else if (orTable && orTable.style.display !== 'none') {
showOnlyCR = false;
}
// Open appropriate document viewer modal
if (showOnlyCR) {
openCRDocumentViewer(plate, driverStatus);
} else {
openDocumentViewer(plate, driverStatus);
}
} catch (error) {
console.error('Error in handleVehicleAction:', error);
showWarning('Failed to load vehicle documents', 'Error');
}
}
// Open document viewer modal
function openDocumentViewer(plate, driverStatus) {

// Create modal overlay

const modalOverlay = document.createElement('div');

modalOverlay.style.cssText = `

position: fixed;

top: 0;

left: 0;

width: 100%;

height: 100%;

background: rgba(0, 0, 0, 0.8);

display: flex;

justify-content: center;

align-items: center;

z-index: 10000;

`;

// Create modal content

const modalContent = document.createElement('div');

modalContent.style.cssText = `

background: white;

border-radius: 12px;

max-width: 500px;

width: 90%;

max-height: 90vh;

overflow-y: auto;

box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

`;

// Create modal header

const modalHeader = document.createElement('div');

modalHeader.style.cssText = `

padding: 20px 24px;

border-bottom: 1px solid #e5e7eb;

display: flex;

justify-content: space-between;

align-items: center;

background: linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%);

color: white;

border-radius: 12px 12px 0 0;

`;

modalHeader.innerHTML = `

<h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Vehicle Documents - ${plate}</h2>

<button type="button" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">Ã—</button>

`;

// Create modal body

const modalBody = document.createElement('div');

modalBody.style.cssText = `

padding: 24px;

`;

// Create document sections

modalBody.innerHTML = `

<div style="display: grid; grid-template-columns: 1fr; gap: 24px;">

<p style="text-align: center; color: #666; padding: 20px;">Document functionality is currently unavailable.</p>

</div>

`;

// Assemble modal

modalContent.appendChild(modalHeader);

modalContent.appendChild(modalBody);

modalOverlay.appendChild(modalContent);

// Add to body

document.body.appendChild(modalOverlay);

// Add event listeners

const closeBtn = modalHeader.querySelector('button');

closeBtn.onclick = () => document.body.removeChild(modalOverlay);

modalOverlay.onclick = (e) => {

if (e.target === modalOverlay) {

document.body.removeChild(modalOverlay);
}
};
}
// Open C/R document viewer modal (shows only C/R document)
function openCRDocumentViewer(plate, driverStatus) {

// Create modal overlay

const modalOverlay = document.createElement('div');

modalOverlay.style.cssText = `

position: fixed;

top: 0;

left: 0;

width: 100%;

height: 100%;

background: rgba(0, 0, 0, 0.8);

display: flex;

justify-content: center;

align-items: center;

z-index: 10000;

`;

// Create modal content

const modalContent = document.createElement('div');

modalContent.style.cssText = `

background: white;

border-radius: 12px;

max-width: 500px;

width: 90%;

max-height: 90vh;

overflow-y: auto;

box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

`;

// Create modal header

const modalHeader = document.createElement('div');

modalHeader.style.cssText = `

padding: 20px 24px;

border-bottom: 1px solid #e5e7eb;

display: flex;

justify-content: space-between;

align-items: center;

background: linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%);

color: white;

border-radius: 12px 12px 0 0;

`;

modalHeader.innerHTML = `

<h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">C/R Document - ${plate}</h2>

<button type="button" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">Ã—</button>

`;

// Create modal body

const modalBody = document.createElement('div');

modalBody.style.cssText = `

padding: 24px;

`;

// Document sections disabled - columns don't exist in database

modalBody.innerHTML = `

<div style="display: grid; grid-template-columns: 1fr; gap: 24px;">

<p style="text-align: center; color: #666; padding: 20px;">Document functionality is currently unavailable.</p>

</div>

`;

// Assemble modal

modalContent.appendChild(modalHeader);

modalContent.appendChild(modalBody);

modalOverlay.appendChild(modalContent);

// Add to body

document.body.appendChild(modalOverlay);

// Add event listeners

const closeBtn = modalHeader.querySelector('button');

closeBtn.onclick = () => document.body.removeChild(modalOverlay);

modalOverlay.onclick = (e) => {

if (e.target === modalOverlay) {

document.body.removeChild(modalOverlay);
}
};
}
// Create document section HTML
function createDocumentSection(title, imageUrl, imageName, plate, color) {

if (imageUrl) {

return `

<div style="border: 2px solid ${color}; border-radius: 8px; padding: 20px; text-align: center; background: #f9f9f9;">

<h3 style="margin: 0 0 16px 0; color: ${color}; font-size: 1.1rem; font-weight: 600;">${title}</h3>

<div style="margin-bottom: 16px;">

<div style="font-size: 14px; color: #666; margin-bottom: 8px;">${imageName || 'Document'}</div>

</div>

<div style="display: flex; gap: 12px; justify-content: center;">

<button onclick="viewDocument('${imageUrl}', '${imageName || title}')" style="padding: 10px 20px; background: ${color}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">View Document</button>

</div>

</div>

`;

} else {

return `

<div style="border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; background: #f9f9f9;">

<h3 style="margin: 0 0 16px 0; color: #666; font-size: 1.1rem; font-weight: 600;">${title}</h3>

<div style="color: #999; font-size: 14px;">

<i class="fas fa-file-pdf" style="font-size: 48px; margin-bottom: 12px; display: block;"></i>

No document uploaded

</div>

</div>

`;
}
}
// View document in new window
function viewDocument(imageUrl, title) {

window.open(imageUrl, '_blank');
}
// Download document
function downloadDocument(imageUrl, filename) {

const link = document.createElement('a');

link.href = imageUrl;

link.download = filename;

link.target = '_blank';

document.body.appendChild(link);

link.click();

document.body.removeChild(link);
}
// Load Certificate of Registration data for Trailer C/R table
async function loadTrailerCertificateOfRegistrationData() {
const trailerCrTable = document.getElementById('trailer-cr-table');
if (!trailerCrTable) return;
const tbody = trailerCrTable.querySelector('tbody');
if (!tbody) return;
try {
// Fetch trailer data from trailer_registry table
const { data: trailerData, error: trailerError } = await supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
if (trailerError) throw trailerError;
// Get C/R documents from trailer_documents table
const { data: documentData, error: documentError } = await supabaseClient
.from('trailer_documents')
.select('plate_no, file_path, file_name')
.eq('document_type', 'CR')
.eq('is_active', true)
.in('plate_no', trailerData.map(t => t.plate_no));
if (documentError) {
console.error('Error fetching C/R document data:', documentError);
}
// Create a lookup map for document data
const imageUrlMap = {};
if (documentData) {
documentData.forEach(doc => {
// Convert base64 to data URL for display
const dataUrl = `data:application/pdf;base64,${doc.file_path}`;
imageUrlMap[doc.plate_no] = dataUrl;
});
}
// Map trailer data to table format
const trailerCrData = trailerData.map(trailer => ({
plate: trailer.plate_no || 'N/A',
mv_file: trailer.mv_file_no || 'N/A',
chassis_no: trailer.chassis_no || 'N/A',
trailer_type: trailer.trailer_type || 'Trailer',
year_model: trailer.year_model || 'N/A',
gross_weight: trailer.gross_weight || 'N/A',
cr_image_url: imageUrlMap[trailer.plate_no] || null
}));
tbody.innerHTML = '';
trailerCrData.forEach(cr => {
const row = tbody.insertRow();
row.innerHTML = `
<td>${cr.plate}</td>
<td>${cr.mv_file}</td>
<td>${cr.chassis_no}</td>
<td>${cr.trailer_type}</td>
<td>${cr.year_model}</td>
<td>${cr.gross_weight}</td>
<td style="text-align: center;">
${cr.cr_image_url ? 
  `<i class="fas fa-file-pdf" onclick="openPdfInTab('${cr.plate}', '${cr.cr_image_url}', 'CR')" style="font-size: 20px; color: #dc3545; cursor: pointer; margin-right: 8px;" title="View C/R Document"></i>` :
  `-`
}
</td>
`;
});
} catch (error) {
console.error('Error loading trailer C/R data:', error);
tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading data</td></tr>';
}
}
// Load Official Receipt data for Trailer O/R table
async function loadTrailerOfficialReceiptData() {
const trailerOrTable = document.getElementById('trailer-or-table');
if (!trailerOrTable) return;
const tbody = trailerOrTable.querySelector('tbody');
if (!tbody) return;
try {
// Fetch trailer data from trailer_registry table
const { data: trailerData, error: trailerError } = await supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
if (trailerError) throw trailerError;
// Get O/R documents from trailer_documents table
const { data: orDocumentData, error: orDocumentError } = await supabaseClient
.from('trailer_documents')
.select('plate_no, file_path, file_name')
.eq('document_type', 'OR')
.eq('is_active', true)
.in('plate_no', trailerData.map(t => t.plate_no));
if (orDocumentError) {
console.error('Error fetching O/R document data:', orDocumentError);
}
// Create a lookup map for O/R document data
const orImageUrlMap = {};
if (orDocumentData) {
orDocumentData.forEach(doc => {
// Convert base64 to data URL for display
const dataUrl = `data:application/pdf;base64,${doc.file_path}`;
orImageUrlMap[doc.plate_no] = dataUrl;
});
}
// Map trailer data to table format
const trailerOrData = trailerData.map(trailer => {
// Calculate status based on expiration date - same logic as regular O/R table
let status = 'No Expiry Date'; // Default to No Expiry Date
if (trailer.cr_expiry_date && trailer.cr_expiry_date !== 'N/A') {
const expiryDate = new Date(trailer.cr_expiry_date);
const currentDate = new Date();
const diffTime = expiryDate - currentDate;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
status = diffDays >= 0 ? 'Active' : 'Expired';
}
return {
chassis_no: trailer.chassis_no || 'N/A',
plate: trailer.plate_no || 'N/A',
vehicle_type: trailer.trailer_type || 'Trailer',
registration_date: trailer.cr_registered || 'N/A',
expiration_date: trailer.cr_expiry_date || 'N/A',
status: status,
or_image_url: orImageUrlMap[trailer.plate_no] || null
};
});
tbody.innerHTML = '';
trailerOrData.forEach(or => {
const row = tbody.insertRow();
// Add status styling for trailer O/R table
const statusClass = or.status === 'Active' ? 'status-active' : or.status === 'Expired' ? 'status-expired' : 'status-unknown';
// Format dates to "Month Day Year" format
const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return dateString;
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  } catch (e) {
    return dateString;
  }
  return dateString;
};

row.innerHTML = `
<td>${or.chassis_no}</td>
<td>${or.plate}</td>
<td>${or.vehicle_type}</td>
<td>${formatDate(or.registration_date)}</td>
<td>${formatDate(or.expiration_date)}</td>
<td><span class="${statusClass}">${or.status}</span></td>
<td style="text-align: center;">
${or.or_image_url ?
  `<i class="fas fa-file-pdf" onclick="openPdfInTab('${or.plate}', '${or.or_image_url}', 'OR')" style="font-size: 20px; color: #dc3545; cursor: pointer; margin-right: 8px;" title="View O/R Document"></i>` :
  `-`
}
</td>
`;
});
} catch (error) {
console.error('Error loading trailer O/R data:', error);
tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading data</td></tr>';
}
}
// Load Client data
async function loadClientData() {
const clientTable = document.getElementById('client-table');
if (!clientTable) return;
const tbody = clientTable.querySelector('tbody');
if (!tbody) return;
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Try with auth wrapper first
try {
return await supabaseWithAuth(async () => {
// Fetch both client data and diesel data
let clientQuery = supabaseClient
.from('clients')
.select('*')
.order('created_at', { ascending: false });
if (selectedPlantFilter) {
clientQuery = clientQuery.eq('plant', selectedPlantFilter);
}
const { data: clients, error: clientError } = await clientQuery;
const { data: dieselData, error: dieselError } = await supabaseClient
.from('diesel_records_ave')
.select('*');
const error = clientError || dieselError;
if (error) {
console.warn('data fetch error with auth, trying direct:', error);
throw error;
}
displayClients(clients, dieselData);
});
} catch (authError) {
console.warn('Auth wrapper failed for load, trying direct:', authError);
// Fallback to direct query without auth wrapper
let clientQuery = supabaseClient
.from('clients')
.select('*')
.order('destination', { ascending: true });
if (selectedPlantFilter) {
clientQuery = clientQuery.eq('plant', selectedPlantFilter);
}
const { data: clients, error: clientError } = await clientQuery;
const { data: dieselData, error: dieselError } = await supabaseClient
.from('diesel_records_ave')
.select('*');
const error = clientError || dieselError;
if (error) {
console.warn('data fetch error, showing empty table:', error);
tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No client data available</td></tr>';
return;
}
displayClients(clients, dieselData);
}
} catch (err) {
console.error('Error loading clients:', err);
tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: red;">Error loading client data</td></tr>';
}
// Helper function to display clients
function displayClients(clients, dieselData = []) {

tbody.innerHTML = '';

if (!clients || clients.length === 0) {

tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No clients found</td></tr>';

return;
}
// Create a map of diesel data by destination for easy lookup
const dieselMap = {};
if (dieselData) {
dieselData.forEach(record => {
if (record.destination) {
dieselMap[record.destination.toLowerCase()] = {
four_w_six_w: record.four_w_six_w,
ten_w: record.ten_w,
tractor_head: record.tractor_head
};
}
});
}
clients.forEach(client => {
const row = tbody.insertRow();
// Get diesel data for this client's destination
const dieselInfo = dieselMap[client.destination?.toLowerCase()] || {};
row.innerHTML = `
<td>${client.destination || '-'}</td>
<td>${client.address || '-'}</td>
<td>${client.going_to || '-'}</td>
<td>${client.going_back || '-'}</td>
<td>${client.total_km || '-'}</td>
<td>${client.average_time || '-'}</td>
<td>${dieselInfo.four_w_six_w || '-'}</td>
<td>${dieselInfo.ten_w || '-'}</td>
<td>${dieselInfo.tractor_head || '-'}</td>
<td class="auth-required">
<button class="action-btn" onclick="editClient('${client.id}')" style="margin-right: 4px; margin-bottom: 4px;">Edit</button>
<button class="action-btn" onclick="deleteClient('${client.id}')" style="margin-bottom: 4px;">Delete</button>
</td>
`;
});
}
}
// Save Client data to database
async function saveClient(clientData) {
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
try {
// Try with auth wrapper first
try {
return await supabaseWithAuth(async () => {
const { data, error } = await supabaseClient
.from('clients')
.insert([{
destination: clientData.destination,
address: clientData.address,
going_to: clientData.goingTo,
going_back: clientData.goingBack,
total_km: clientData.totalKm,
average_time: clientData.averageTime,
created_at: new Date().toISOString()
}])
.select();
if (error) throw error;
return data;
});
} catch (authError) {
console.warn('Auth wrapper failed, trying direct insert:', authError);
// Fallback to direct insert without auth wrapper
const { data, error } = await supabaseClient
.from('clients')
.insert([{
destination: clientData.destination,
address: clientData.address,
going_to: clientData.goingTo,
going_back: clientData.goingBack,
total_km: clientData.totalKm,
average_time: clientData.averageTime,
created_at: new Date().toISOString()
}])
.select();
if (error) throw error;
console.log('Client saved successfully (direct):', data);
return data;
}
} catch (error) {
console.error('Error saving client:', error);
throw error;
}
}
// Edit Client function
async function editClient(clientId) {
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) {
showError('Database not initialized', 'Error');
return;
}
try {
return await supabaseWithAuth(async () => {
const { data: client, error } = await supabaseClient
.from('clients')
.select('*')
.eq('id', clientId)
.single();
if (error) throw error;
// Populate form with client data
document.getElementById('client-plant').value = client.plant || '';
document.getElementById('client-destination').value = client.destination || '';
document.getElementById('client-address').value = client.address || '';
document.getElementById('client-going-to').value = client.going_to || '';
document.getElementById('client-going-back').value = client.going_back || '';
document.getElementById('client-total-km').value = client.total_km || '';
document.getElementById('client-average-time').value = client.average_time || '';
// Change modal title to Edit Client
const modalTitle = document.querySelector('#client-modal .modal-header h2');
if (modalTitle) modalTitle.textContent = 'Edit Client';
// Change form to edit mode
const form = document.getElementById('client-form');
const submitBtn = form.querySelector('button[type="submit"]');
submitBtn.textContent = 'Update Client';
submitBtn.onclick = async function(e) {
e.preventDefault();
await updateClient(clientId);
};
// Show modal
const modal = document.getElementById('client-modal');
const overlay = document.getElementById('client-modal-overlay');
modal.style.display = 'block';
overlay.style.display = 'block';
});
} catch (error) {
console.error('Error loading client for edit:', error);
showError('Failed to load client data', 'Error');
}
}
// Update Client function
async function updateClient(clientId) {
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
try {
const plant = document.getElementById('client-plant').value.trim();
const destination = document.getElementById('client-destination').value.trim();
const address = document.getElementById('client-address').value.trim();
const goingTo = document.getElementById('client-going-to').value.trim();
const goingBack = document.getElementById('client-going-back').value.trim();
const totalKm = document.getElementById('client-total-km').value.trim();
const averageTime = document.getElementById('client-average-time').value.trim();
// Validate required fields
if (!plant || !destination || !address || !averageTime) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
return await supabaseWithAuth(async () => {
const { data, error } = await supabaseClient
.from('clients')
.update({
plant,
destination,
address,
going_to: goingTo,
going_back: goingBack,
total_km: totalKm,
average_time: averageTime,
updated_at: new Date().toISOString()
})
.eq('id', clientId)
.select();
if (error) throw error;
showSuccess('Client updated successfully!', 'Success');
closeClientModal();
loadClientData();
// Reset form to add mode
const form = document.getElementById('client-form');
const submitBtn = form.querySelector('button[type="submit"]');
submitBtn.textContent = 'Save Client';
submitBtn.onclick = null;
});
} catch (error) {
console.error('Error updating client:', error);
showError('Failed to update client. Please try again.', 'Error');
}
}
// Delete Client function
async function deleteClient(clientId) {
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
// Store the client ID globally for the confirmation callback
window.clientToDelete = clientId;
// Show confirmation dialog
showConfirm(
'Are you sure you want to delete this client? This action cannot be undone.',
'Confirm Delete',
'confirmDeleteClient',
'confirmCancelDeleteClient'
);
}
// Global function for confirming client deletion
window.confirmDeleteClient = async function() {
try {
if (!supabaseClient) {
throw new Error('Supabase not initialized');
}
const clientId = window.clientToDelete;
return await supabaseWithAuth(async () => {
const { error } = await supabaseClient
.from('clients')
.delete()
.eq('id', clientId);
if (error) throw error;
showSuccess('Client deleted successfully!', 'Success');
loadClientData();
});
} catch (error) {
console.error('Error deleting client:', error);
showError('Failed to delete client. Please try again.', 'Error');
}
};
// Global function for canceling client deletion
window.confirmCancelDeleteClient = function() {
// Do nothing on cancel
window.clientToDelete = null;
};
// Load trailer data from Supabase
async function loadTrailerData() {
if (!supabaseClient) {
console.error('Supabase not initialized');
displayTrailers([]);
return;
}
try {
let query = supabaseClient
.from('trailer_registry')
.select('*')
.order('plate_no', { ascending: true });
// Apply plant filter if specified
if (selectedPlantFilter) {
query = query.eq('location_plant', selectedPlantFilter);
}
const { data, error } = await query;
if (error) throw error;
// Update trailer count badge
updateTrailerCountBadge(data ? data.length : 0);
displayTrailers(data || []);
} catch (err) {
console.error('Error loading trailers:', err.message);
displayTrailers([]);
}
}
// Load trailer data for Status tab (show only plate and chassis numbers)
async function loadStatusTrailerData() {
if (!supabaseClient) {
console.error('Supabase not initialized');
displayStatusTrailers([]);
return;
}
try {
let query = supabaseClient
.from('trailer_registry')
.select('id, plate_no, chassis_no, container, remarks, trailer_issue, status, trailer_type, gross_weight')
.order('plate_no', { ascending: true });
// Apply plant filter if specified
if (selectedPlantFilter) {
query = query.eq('location_plant', selectedPlantFilter);
}
const { data, error } = await query;
if (error) throw error;
displayStatusTrailers(data || []);
} catch (err) {
console.error('Error loading status trailers:', err.message);
displayStatusTrailers([]);
}
}
// Display trailers in Status table with only plate and chassis numbers
function displayStatusTrailers(trailers) {

const trailerTable = document.getElementById('trailer-table');

if (!trailerTable) return;

const tbody = trailerTable.querySelector('tbody');

if (!tbody) return;

// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();

// Hide/show Actions column header based on auth status
const actionsHeader = trailerTable.querySelector('thead tr td:nth-child(7)');
if (actionsHeader) {
    actionsHeader.style.display = isAdmin ? '' : 'none';
}

// Clear existing content

tbody.innerHTML = '';

if (!trailers || trailers.length === 0) {
const colspan = isAdmin ? 7 : 6;
tbody.innerHTML = `

<tr>

<td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666;">

No trailers found.

</td>

</tr>

`;

return;
}
trailers.forEach(trailer => {
const row = document.createElement('tr');
row.innerHTML = `
<td>${trailer.plate_no || '-'}</td>
<td>${trailer.chassis_no || '-'}</td>
<td>${trailer.container || '-'}</td>
<td>${trailer.remarks || '-'}</td>
<td>${trailer.trailer_issue || '-'}</td>
<td>${getStyledStatus(trailer.status)}</td>
${isAdmin ? `<td class="auth-required">
  <button class="action-btn auth-required" onclick="editTrailerStatus('${trailer.id || ''}', '${trailer.plate_no || ''}', '${trailer.chassis_no || ''}', '${trailer.container ? trailer.container : ''}', '${trailer.remarks ? trailer.remarks : ''}', '${trailer.trailer_issue ? trailer.trailer_issue : ''}', '${trailer.status || ''}', '${trailer.trailer_type ? trailer.trailer_type : ''}', '${trailer.gross_weight ? trailer.gross_weight : ''}')">Edit</button>
</td>` : ''}
`;
tbody.appendChild(row);
});

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

// Edit trailer status function
function editTrailerStatus(id, plateNo, chassisNo, container, remarks, trailerIssue, status, trailerType, grossWeight) {
  // Populate modal fields with trailer data
  document.getElementById('status-trailer-plate').value = plateNo || '';
  document.getElementById('status-trailer-chassis').value = chassisNo || '';
  document.getElementById('status-trailer-type').value = (trailerType && trailerType !== '-') ? trailerType : '';
  document.getElementById('status-trailer-gross-weight').value = (grossWeight && grossWeight !== '-') ? grossWeight : '';
  document.getElementById('status-trailer-container').value = (container && container !== '-') ? container : '';
  document.getElementById('status-trailer-remarks').value = (remarks && remarks !== '-') ? remarks : '';
  document.getElementById('status-trailer-issue').value = (trailerIssue && trailerIssue !== '-') ? trailerIssue : '';
  // Set status dropdown - if no status or status is 'ACTIVE', show default option
  const statusElement = document.getElementById('status-trailer-status');
  if (status && status !== 'ACTIVE' && status !== '') {
    statusElement.value = status;
  } else {
    statusElement.value = ''; // This will show the --Select Status-- option
  }
  
  // Fetch and populate registration and expiration dates
  populateTrailerDates(id);
  
  // Load existing documents for this trailer
  loadTrailerDocuments(plateNo);
  
  // Store the trailer ID for saving changes
  window.currentEditingTrailerId = id;
  
  // Show the modal
  const modal = document.getElementById('status-trailer-modal');
  const overlay = document.getElementById('status-trailer-modal-overlay');
  
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Populate trailer registration and expiration dates from database
async function populateTrailerDates(trailerId) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    console.error('Database connection not available');
    return;
  }
  
  try {
    // Fetch trailer data from trailer_registry table
    const { data: trailerData, error: trailerError } = await supabaseClient
      .from('trailer_registry')
      .select('cr_registered, cr_expiry_date, date_reported, status')
      .eq('id', trailerId)
      .single();
    
    if (trailerError) {
      console.error('Error fetching trailer dates:', trailerError);
      return;
    }
    
    if (trailerData) {
      // Populate registration date
      const regDateField = document.getElementById('status-trailer-registration-date');
      if (regDateField && trailerData.cr_registered) {
        // Format date for input field (YYYY-MM-DD)
        const regDate = new Date(trailerData.cr_registered);
        if (!isNaN(regDate.getTime())) {
          regDateField.value = regDate.toISOString().split('T')[0];
        }
      }
      
      // Populate expiration date
      const expDateField = document.getElementById('status-trailer-expiration-date');
      if (expDateField && trailerData.cr_expiry_date) {
        // Format date for input field (YYYY-MM-DD)
        const expDate = new Date(trailerData.cr_expiry_date);
        if (!isNaN(expDate.getTime())) {
          expDateField.value = expDate.toISOString().split('T')[0];
        }
      }
      
      // Populate date reported
      const dateReportedField = document.getElementById('status-trailer-date-reported');
      const dateReportedGroup = document.getElementById('trailer-date-reported-group');
      if (dateReportedField && trailerData.date_reported) {
        // Format date for input field (YYYY-MM-DD)
        const dateReported = new Date(trailerData.date_reported);
        if (!isNaN(dateReported.getTime())) {
          dateReportedField.value = dateReported.toISOString().split('T')[0];
        }
      }
      
      // Show/hide date reported field based on status
      if (trailerData.status === 'DOWN') {
        dateReportedGroup.style.display = 'block';
      } else {
        dateReportedGroup.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error populating trailer dates:', error);
  }
}

// Edit container status function
function editContainerStatus(id, container, chassi_no, color, size, remarks, container_issue, status, date_reported) {
  // Populate modal fields with container data
  document.getElementById('status-container-number').value = container || '';
  document.getElementById('status-container-chassi').value = chassi_no || '';
  document.getElementById('status-container-color').value = color || '';
  document.getElementById('status-container-size').value = size || '';
  document.getElementById('status-container-remarks').value = (remarks && remarks !== '-') ? remarks : '';
  document.getElementById('status-container-issue').value = (container_issue && container_issue !== '-') ? container_issue : '';
  // Set status dropdown - if no status or status is 'ACTIVE', show default option
  const containerStatusElement = document.getElementById('status-container-status');
  if (status && status !== 'ACTIVE' && status !== '') {
    containerStatusElement.value = status;
  } else {
    containerStatusElement.value = ''; // This will show the --Select Status-- option
  }
  
  // Set date reported field
  const dateReportedElement = document.getElementById('status-container-date-reported');
  if (date_reported && date_reported !== '0000-00-00' && date_reported !== '') {
    dateReportedElement.value = date_reported;
  } else {
    dateReportedElement.value = '';
  }
  
  // Trigger the change event to show/hide date reported field based on status
  const changeEvent = new Event('change');
  containerStatusElement.dispatchEvent(changeEvent);
  
  // Store the container ID for saving changes
  window.currentEditingContainerId = id;
  
  // Show the modal
  const modal = document.getElementById('status-container-modal');
  const overlay = document.getElementById('status-container-modal-overlay');
  
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Close status trailer modal function
function closeStatusTrailerModal() {
  const modal = document.getElementById('status-trailer-modal');
  const overlay = document.getElementById('status-trailer-modal-overlay');
  
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Clear the editing trailer ID
  window.currentEditingTrailerId = null;
  
  // Clear pending document removal flags
  window.pendingTrailerDocumentRemoval = null;
}

// Handle status trailer form submission
async function handleStatusTrailerFormSubmit(e) {
  e.preventDefault();
  
  if (!window.currentEditingTrailerId) {
    showError('No trailer selected for editing', 'Error');
    return;
  }
  
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    showError('Database connection not available', 'Error');
    return;
  }
  
  // Get form values
  const trailerType = document.getElementById('status-trailer-type').value;
  let grossWeight = document.getElementById('status-trailer-gross-weight').value;
  const container = document.getElementById('status-trailer-container').value;
  const remarks = document.getElementById('status-trailer-remarks').value;
  const trailerIssue = document.getElementById('status-trailer-issue').value;
  let status = document.getElementById('status-trailer-status').value;
  const registrationDate = document.getElementById('status-trailer-registration-date').value;
  const expirationDate = document.getElementById('status-trailer-expiration-date').value;
  const dateReported = document.getElementById('status-trailer-date-reported').value;
  
  // Convert empty status to null to satisfy database constraint
  status = status.trim() === '' ? null : status;
  
  // Convert empty gross_weight to null to satisfy numeric type constraint
  grossWeight = grossWeight.trim() === '' ? null : grossWeight;
  
  // Get document files
  const orFile = document.getElementById('status-trailer-or-pdf').files[0];
  const crFile = document.getElementById('status-trailer-cr-pdf').files[0];
  
  try {
    // Get current trailer data to preserve all fields
    const { data: currentTrailer, error: fetchError } = await supabaseClient
      .from('trailer_registry')
      .select('*')
      .eq('id', window.currentEditingTrailerId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update trailer data in trailer_registry table, preserving all existing fields
    const { data, error } = await supabaseClient
      .from('trailer_registry')
      .update({
        plate_no: currentTrailer.plate_no,
        chassis_no: currentTrailer.chassis_no,
        trailer_type: trailerType,
        gross_weight: grossWeight,
        container: container,
        remarks: remarks,
        trailer_issue: trailerIssue,
        status: status,
        date_reported: dateReported || null,
        cr_registered: registrationDate || null,
        cr_expiry_date: expirationDate || null,
        owners_name: currentTrailer.owners_name,
        location_plant: currentTrailer.location_plant,
        updated_at: new Date().toISOString()
      })
      .eq('id', window.currentEditingTrailerId)
      .select();
    
    if (error) throw error;
    
    // Handle document uploads
    const plateNo = currentTrailer.plate_no;
    const uploadedBy = window.authSystem?.getCurrentUser()?.username || 'anonymous';
    
    // Upload O/R document if provided
    if (orFile) {
      await uploadTrailerDocument(plateNo, 'OR', orFile, uploadedBy);
    }
    
    // Upload C/R document if provided
    if (crFile) {
      await uploadTrailerDocument(plateNo, 'CR', crFile, uploadedBy);
    }
    
    // Handle pending document removals (marked by X button clicks)
    if (window.pendingTrailerDocumentRemoval) {
      if (window.pendingTrailerDocumentRemoval.or) {
        await saveRemovedTrailerDocument('or');
      }
      if (window.pendingTrailerDocumentRemoval.cr) {
        await saveRemovedTrailerDocument('cr');
      }
    }
    
    // Clear pending removal flags after successful save
    window.pendingTrailerDocumentRemoval = null;
    
    showSuccess('Trailer status updated successfully!');
    closeStatusTrailerModal();
    
    // Reload trailer data to reflect changes
    await loadStatusTrailerData();
    
  } catch (error) {
    console.error('Error updating trailer status:', error);
    showError('Failed to update trailer status: ' + error.message, 'Error');
  }
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
  const container = document.getElementById('status-container-number').value;
  const chassiNo = document.getElementById('status-container-chassi').value;
  const color = document.getElementById('status-container-color').value;
  const size = document.getElementById('status-container-size').value;
  const remarks = document.getElementById('status-container-remarks').value;
  const containerIssue = document.getElementById('status-container-issue').value;
  let status = document.getElementById('status-container-status').value;
  const dateReported = document.getElementById('status-container-date-reported').value;
  
  // Convert empty status to null to satisfy database constraint
  status = status.trim() === '' ? null : status;
  
  try {
    // Get current container data to preserve all fields
    const { data: currentContainer, error: fetchError } = await supabaseClient
      .from('containers')
      .select('*')
      .eq('id', window.currentEditingContainerId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update container data in containers table, preserving all existing fields
    const { data, error } = await supabaseClient
      .from('containers')
      .update({
        container: container,
        chassi_no: chassiNo,
        color: color,
        size: size,
        remarks: remarks,
        container_issue: containerIssue,
        status: status,
        date_reported: dateReported || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', window.currentEditingContainerId)
      .select();
    
    if (error) throw error;
    
    showSuccess('Container status updated successfully!');
    closeStatusContainerModal();
    
    // Reload container data to reflect changes
    await loadContainerData();
    
  } catch (error) {
    console.error('Error updating container status:', error);
    showError('Failed to update container status: ' + error.message, 'Error');
  }
}

// Calculate status based on registration and expiration dates
function calculateStatusFromDates(registrationDate, expirationDate) {
  // If either date is missing, return 'Inactive'
  if (!registrationDate || !expirationDate) {
    return 'Inactive';
  }
  
  // Parse dates
  const regDate = new Date(registrationDate);
  const expDate = new Date(expirationDate);
  const currentDate = new Date();
  
  // Check if dates are valid
  if (isNaN(regDate.getTime()) || isNaN(expDate.getTime())) {
    return 'Inactive';
  }
  
  // If expiration date is in the future, status is 'Active'
  // If expiration date is in the past or today, status is 'Inactive'
  return expDate > currentDate ? 'Active' : 'Inactive';
}

// Update status field based on date changes
function updateStatusBasedOnDates(registrationFieldId, expirationFieldId, statusFieldId) {
  const registrationDate = document.getElementById(registrationFieldId)?.value;
  const expirationDate = document.getElementById(expirationFieldId)?.value;
  const statusField = document.getElementById(statusFieldId);
  
  if (statusField) {
    const calculatedStatus = calculateStatusFromDates(registrationDate, expirationDate);
    statusField.value = calculatedStatus;
  }
}

// Upload trailer document to database and storage
async function uploadTrailerDocument(plateNo, documentType, file, uploadedBy) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    throw new Error('Database connection not available');
  }
  
  try {
    // Generate unique filename
    const timestamp = new Date().getTime();
    const fileName = `${plateNo}_${documentType}_${timestamp}.pdf`;
    
    // For now, we'll store the file as base64 in the database
    // In a production environment, you might want to use Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64String = btoa(binaryString);
    
    // Deactivate any existing documents of the same type for this plate
    await supabaseClient
      .from('trailer_documents')
      .update({ is_active: false })
      .eq('plate_no', plateNo)
      .eq('document_type', documentType);
    
    // Insert new document record
    const { data, error } = await supabaseClient
      .from('trailer_documents')
      .insert({
        plate_no: plateNo,
        document_type: documentType,
        file_name: file.name,
        file_path: base64String, // Store base64 data temporarily
        file_url: base64String, // Use base64 as file_url to satisfy not-null constraint
        file_size: file.size,
        upload_date: new Date().toISOString(), // Add missing upload_date field
        uploaded_by: uploadedBy,
        is_active: true
      })
      .select();
    
    if (error) throw error;
    
    console.log(`${documentType} document uploaded successfully for plate ${plateNo}`);
    return data;
    
  } catch (error) {
    console.error(`Error uploading ${documentType} document:`, error);
    throw error;
  }
}

// Handle trailer file input changes and display PDF logo
function handleTrailerFileChange(documentType, file) {
  const previewElement = document.getElementById(`status-trailer-${documentType}-preview`);
  
  if (!previewElement) return;
  
  if (file && file.type === 'application/pdf') {
    // Show PDF logo when file is selected with tag matching the design
    const tagText = documentType === 'or' ? 'O/R' : 'C/R';
    previewElement.innerHTML = `
      <div style="text-align: center; padding: 20px; position: relative; cursor: pointer;">
        <i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
        <div style="font-size: 12px; color: #666;">${file.name}</div>
        <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${tagText}</div>
        <div onclick="event.stopPropagation(); clearTrailerDocument('${documentType}')" style="position: absolute; top: 5px; left: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; user-select: none; line-height: 1; padding: 0; margin: 0; box-sizing: border-box; border: none; flex-shrink: 0;">×</div>
      </div>
    `;
    previewElement.style.background = '#ffffff';
    previewElement.style.borderColor = '#e0e0e0';
  } else {
    // Reset to default state when no file is selected
    resetTrailerDocumentPreview(documentType);
  }
}

// Handle truck file input changes and display PDF logo
function handleTruckFileChange(documentType, file) {
  const previewElement = document.getElementById(`status-truck-${documentType}-preview`);
  
  if (!previewElement) return;
  
  console.log('handleTruckFileChange - documentType:', documentType, 'file:', file);
  
  if (file && file.type === 'application/pdf') {
    // Set global file variable for form submission
    if (documentType === 'or') {
      orImageFile = file;
      console.log('Set orImageFile:', orImageFile);
    } else if (documentType === 'cr') {
      crImageFile = file;
      console.log('Set crImageFile:', crImageFile);
    }
    
    // Clear pending removal flag for this document type (new file overrides removal)
    window.pendingTruckDocumentRemoval = window.pendingTruckDocumentRemoval || {};
    window.pendingTruckDocumentRemoval[documentType] = false;
    
    // Show PDF logo when file is selected with tag matching the design
    const tagText = documentType === 'or' ? 'O/R' : 'C/R';
    previewElement.innerHTML = `
      <div style="text-align: center; padding: 20px; position: relative; cursor: pointer;">
        <i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
        <div style="font-size: 12px; color: #666;">${file.name}</div>
        <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${tagText}</div>
        <div onclick="event.stopPropagation(); clearTruckDocument('${documentType}')" style="position: absolute; top: 5px; left: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; user-select: none; line-height: 1; padding: 0; margin: 0; box-sizing: border-box; border: none; flex-shrink: 0;">×</div>
      </div>
    `;
    previewElement.style.background = '#ffffff';
    previewElement.style.borderColor = '#e0e0e0';
  } else {
    // Reset to default state when no file is selected
    previewElement.innerHTML = `<span style="color: #666;">Click to upload ${documentType === 'or' ? 'O/R' : 'C/R'} PDF</span>`;
  }
}

// Clear trailer document input and preview
function clearTrailerDocument(documentType) {
  const fileInput = document.getElementById(`status-trailer-${documentType}-pdf`);
  if (fileInput) {
    fileInput.value = ''; // Clear the file input
  }
  resetTrailerDocumentPreview(documentType);
  // Mark document for removal (will be saved when Save Changes is clicked)
  window.pendingTrailerDocumentRemoval = window.pendingTrailerDocumentRemoval || {};
  window.pendingTrailerDocumentRemoval[documentType] = true;
}

// Clear truck document input and preview
function clearTruckDocument(documentType) {
  const fileInput = document.getElementById(`status-truck-${documentType}-pdf`);
  if (fileInput) {
    fileInput.value = ''; // Clear the file input
  }
  const previewElement = document.getElementById(`status-truck-${documentType}-preview`);
  if (previewElement) {
    previewElement.innerHTML = `<span style="color: #666;">Click to upload ${documentType === 'or' ? 'O/R' : 'C/R'} PDF</span>`;
  }
  // Clear global file variable
  if (documentType === 'or') {
    orImageFile = null;
  } else if (documentType === 'cr') {
    crImageFile = null;
  }
  // Mark document for removal (will be saved when Save Changes is clicked)
  window.pendingTruckDocumentRemoval = window.pendingTruckDocumentRemoval || {};
  window.pendingTruckDocumentRemoval[documentType] = true;
}

// Save removed truck document to database
async function saveRemovedTruckDocument(documentType) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    console.error('Database connection not available');
    return;
  }

  if (!editingStatusPlate) {
    console.error('No plate selected for document removal');
    return;
  }

  try {
    // Prepare update data based on document type
    const updateData = {};
    if (documentType === 'or') {
      updateData.or_image_url = null;
      updateData.or_image_name = null;
    } else if (documentType === 'cr') {
      updateData.cr_image_url = null;
      updateData.cr_image_name = null;
    }

    // Update the drivers_status table
    const { error } = await supabaseClient
      .from('drivers_status')
      .update(updateData)
      .eq('plate', editingStatusPlate);

    if (error) throw error;

    showSuccess(`${documentType === 'or' ? 'O/R' : 'C/R'} document removed successfully`);
  } catch (error) {
    console.error('Error removing document:', error);
    showError('Failed to remove document', 'Error');
  }
}

// Save removed trailer document to database
async function saveRemovedTrailerDocument(documentType) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    console.error('Database connection not available');
    return;
  }

  if (!window.currentEditingTrailerId) {
    console.error('No trailer selected for document removal');
    return;
  }

  try {
    // Get the trailer plate number from the trailer_registry table
    const { data: trailerData, error: trailerError } = await supabaseClient
      .from('trailer_registry')
      .select('plate_no')
      .eq('id', window.currentEditingTrailerId)
      .single();

    if (trailerError) throw trailerError;
    if (!trailerData) {
      console.error('Trailer not found');
      return;
    }

    // Update the trailer_documents table to set is_active to false
    const { error } = await supabaseClient
      .from('trailer_documents')
      .update({ is_active: false })
      .eq('plate_no', trailerData.plate_no)
      .eq('document_type', documentType.toUpperCase());

    if (error) throw error;

    showSuccess(`${documentType === 'or' ? 'O/R' : 'C/R'} document removed successfully`);
  } catch (error) {
    console.error('Error removing trailer document:', error);
    showError('Failed to remove document', 'Error');
  }
}

// Load existing trailer documents and display PDF logos
async function loadTrailerDocuments(plateNo) {
  const supabaseClient = window.getSupabaseClient();
  if (!supabaseClient) {
    console.error('Database connection not available');
    return;
  }
  
  try {
    // Fetch active documents for this trailer
    const { data: documents, error } = await supabaseClient
      .from('trailer_documents')
      .select('*')
      .eq('plate_no', plateNo)
      .eq('is_active', true);
    
    if (error) throw error;
    
    // Reset both preview areas to default state first
    resetTrailerDocumentPreview('or');
    resetTrailerDocumentPreview('cr');
    
    // Display PDF logos for existing documents
    if (documents && documents.length > 0) {
      documents.forEach(doc => {
        const documentType = doc.document_type.toLowerCase(); // 'OR' or 'CR'
        if (documentType === 'or' || documentType === 'cr') {
          showTrailerDocumentPreview(documentType, doc.file_name);
        }
      });
    }
    
  } catch (error) {
    console.error('Error loading trailer documents:', error);
  }
}

// Reset trailer document preview to default state
function resetTrailerDocumentPreview(documentType) {
  const previewElement = document.getElementById(`status-trailer-${documentType}-preview`);
  if (!previewElement) return;
  
  const labelText = documentType === 'or' ? 'O/R' : 'C/R';
  previewElement.innerHTML = `
    <span style="color: #666;">Click to upload ${labelText} PDF</span>
  `;
  previewElement.style.background = '#f9f9f9';
  previewElement.style.borderColor = '#ccc';
}

// Show trailer document preview with PDF logo
function showTrailerDocumentPreview(documentType, fileName) {
  const previewElement = document.getElementById(`status-trailer-${documentType}-preview`);
  if (!previewElement) return;
  
  const documentLabel = documentType === 'or' ? 'O/R' : 'C/R';
  previewElement.innerHTML = `
    <div style="text-align: center; padding: 20px; position: relative; cursor: pointer;">
      <i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
      <div style="font-size: 12px; color: #666;">${fileName}</div>
      <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${documentLabel}</div>
      <div onclick="event.stopPropagation(); clearTrailerDocument('${documentType}')" style="position: absolute; top: 5px; left: 5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; user-select: none; line-height: 1; padding: 0; margin: 0; box-sizing: border-box; border: none; flex-shrink: 0;">×</div>
    </div>
  `;
  previewElement.style.background = '#ffffff';
  previewElement.style.borderColor = '#e0e0e0';
}

// Display trailers in Vehicle Registry table with proper column mapping
function displayTrailers(trailers) {

const trailerTable = document.getElementById('registry-trailer-table');

if (!trailerTable) return;

const tbody = trailerTable.querySelector('tbody');

if (!tbody) return;

// Check if user is admin

const isAdmin = window.authSystem && window.authSystem.isAdmin();

// Hide/show Actions column header based on auth status

const actionsHeader = trailerTable.querySelector('thead tr td:nth-child(7)');

if (actionsHeader) {

actionsHeader.style.display = isAdmin ? '' : 'none';
}

// Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
}
// Clear existing content
tbody.innerHTML = '';
if (!trailers || trailers.length === 0) {
const colspan = isAdmin ? 7 : 6;
tbody.innerHTML = `
<tr>
<td colspan="${colspan}" style="text-align: center; padding: 20px; color: #666;">
No trailers found.
</td>
</tr>
`;
return;
}
// Sort trailers alphabetically by plate number
trailers.sort((a, b) => {
const plateA = (a.plate_no || '').toLowerCase();
const plateB = (b.plate_no || '').toLowerCase();
return plateA.localeCompare(plateB);
});

// Display each trailer with proper column mapping
trailers.forEach(trailer => {
const row = document.createElement('tr');
row.innerHTML = `
<td>${trailer.plate_no || '-'}</td>
<td>${trailer.chassis_no || '-'}</td>
<td>${trailer.mv_file_no || '-'}</td>
<td>${trailer.year_model || '-'}</td>
<td>${trailer.owners_name || '-'}</td>
<td>${trailer.location_plant || '-'}</td>
${isAdmin ? `<td class="auth-required">
<button class="action-btn" onclick="editTrailer('${trailer.id || ''}')" style="margin-right: 5px;">Edit</button>
<button class="action-btn" onclick="deleteTrailer('${trailer.id || ''}')" style="margin-right: 5px;">Delete</button>
</td>` : ''}
`;
tbody.appendChild(row);
});
}
// Trailer Modal Functions
let editingTrailerId = null;
// Open trailer modal for add/edit
async function openTrailerModal(trailerId = null) {
// Check if user is admin
if (!window.authSystem || !window.authSystem.isAdmin()) {
showError('Access denied. Admin privileges required.', 'Authentication Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
editingTrailerId = trailerId;
const modalTitle = document.getElementById('trailer-modal-title');
const modal = document.getElementById('trailer-modal');
const overlay = document.getElementById('trailer-modal-overlay');
if (trailerId) {
// Edit mode - load existing trailer data
modalTitle.textContent = 'Edit Trailer';
try {
const { data: trailer, error } = await supabaseClient
.from('trailer_registry')
.select('*')
.eq('id', trailerId)
.single();
if (error || !trailer) {
showError('Trailer not found', 'Not Found');
return;
}
// Populate form with existing data
document.getElementById('trailer-plate').value = trailer.plate_no || '';
document.getElementById('trailer-chassis').value = trailer.chassis_no || '';
document.getElementById('trailer-mv-file').value = trailer.mv_file_no || '';
document.getElementById('trailer-year').value = trailer.year_model || '';
document.getElementById('trailer-owner').value = trailer.owner_name || '';
document.getElementById('trailer-plant').value = trailer.location_plant || '';
document.getElementById('status-trailer-type').value = trailer.trailer_type || '';
document.getElementById('status-trailer-gross-weight').value = trailer.gross_weight || '';
} catch (err) {
console.error('Error loading trailer for edit:', err.message);
showError('Error loading trailer data', 'Error');
return;
}
} else {
// Add mode - clear form
modalTitle.textContent = 'Add Trailer';
document.getElementById('trailer-form').reset();
}
// Open modal
modal.style.display = 'block';
overlay.style.display = 'block';
document.body.style.overflow = 'hidden';
}
// Close trailer modal
function closeTrailerModal() {

const modal = document.getElementById('trailer-modal');

const overlay = document.getElementById('trailer-modal-overlay');

modal.style.display = 'none';

overlay.style.display = 'none';

document.body.style.overflow = '';

// Clear form and reset editing state

document.getElementById('trailer-form').reset();

editingTrailerId = null;
}
// Debug function for testing + Trailer button functionality
window.testTrailerButton = function() {
// Check if button exists
const addTrailerBtn = document.getElementById('add-trailer-btn');
// Check if modal elements exist
const modal = document.getElementById('trailer-modal');
const overlay = document.getElementById('trailer-modal-overlay');
const form = document.getElementById('trailer-form');
// Check if functions exist
// Check Supabase connection
// Try to manually trigger the modal
try {
openTrailerModal();
} catch (error) {
console.error('10. Error opening modal:', error);
}
}
// Edit trailer function
async function editTrailer(trailerId) {
// Convert empty string to undefined to trigger add mode
const id = trailerId && trailerId.trim() !== '' ? trailerId : undefined;
// Open trailer modal in edit mode
await openTrailerModal(id);
}
// Delete trailer function
async function deleteTrailer(trailerId) {
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
if (!isAdmin) {
showError('Admin privileges required to perform this action', 'Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
// Convert empty string to undefined and check for valid ID
const id = trailerId && trailerId.trim() !== '' ? trailerId : undefined;
if (!id) {
showError('Invalid trailer ID', 'Error');
return;
}
// Show confirmation dialog
const confirmed = await new Promise((resolve) => {
showConfirm('Are you sure you want to delete this trailer?', 'Confirm Delete', 'confirmDelete', 'confirmCancel');
// Set up temporary global functions
window.confirmDelete = () => resolve(true);
window.confirmCancel = () => resolve(false);
});
if (!confirmed) {
return;
}
try {
const { error } = await supabaseClient
.from('trailer_registry')
.delete()
.eq('id', trailerId);
if (error) throw error;
showSuccess('Trailer deleted successfully!', 'Success');
// Reload trailer data to refresh table
await loadTrailerData();
// Update trailer count
updateContainerTrailerCounts();
} catch (err) {
console.error('Error deleting trailer:', err.message);
showError('Failed to delete trailer', 'Error');
}
}
// Save trailer data (insert or update)
async function saveTrailerData(plateNo, chassisNo, container, status, trailerIssue = '') {
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
if (!isAdmin) {
showError('Admin privileges required to perform this action', 'Error');
return;
}
if (!supabaseClient) {
showError('Database not initialized', 'Error');
return;
}
if (!plateNo || !chassisNo || !container || !status) {
showError('Please fill in all required fields', 'Error');
return;
}
try {
// Check for duplicates only when adding new trailer (not editing)
if (!editingTrailerId) {
// Check if chassis_no already exists (chassis must be unique)
const { data: existingChassis, error: chassisError } = await supabaseClient
.from('trailer_registry')
.select('id')
.eq('chassis_no', chassisNo)
.limit(1);

if (chassisError) throw chassisError;
if (existingChassis && existingChassis.length > 0) {
showError('Trailer with this Chassis No. already exists!', 'Duplicate Error');
return;
}

// Check if container already exists
const { data: existingContainer, error: containerError } = await supabaseClient
.from('trailer_registry')
.select('id')
.eq('container', container)
.limit(1);

if (containerError) throw containerError;
if (existingContainer && existingContainer.length > 0) {
showError('Trailer with this Container already exists!', 'Duplicate Error');
return;
}
}

if (editingTrailerId) {
// Update existing trailer
const { error } = await supabaseClient
.from('trailer_registry')
.update({ plate_no: plateNo, chassis_no: chassisNo, container, status, trailer_issue: trailerIssue })
.eq('id', editingTrailerId);
if (error) throw error;
} else {
// Insert new trailer
const { error } = await supabaseClient
.from('trailer_registry')
.insert([{ plate_no: plateNo, chassis_no: chassisNo, container, status, trailer_issue: trailerIssue }]);
if (error) throw error;
}
// Reload trailer data and close modal
await loadTrailerData();
closeTrailerModal();
showSuccess(editingTrailerId ? 'Trailer updated successfully!' : 'Trailer added successfully!', 'Success');
// Update trailer count
updateContainerTrailerCounts();
} catch (err) {
console.error('Error saving trailer:', err.message);
showError('Failed to save trailer', 'Error');
}
}
// ============ Container Functions ============
let editingContainerId = null;
// Open container modal for add/edit
async function openContainerModal(containerId = null) {
console.log('openContainerModal called with containerId:', containerId); // Debug log
// Check if user is admin (temporarily bypassed for testing)
// if (!window.authSystem || !window.authSystem.isAdmin()) {
// showError('Access denied. Admin privileges required.', 'Authentication Error');
// return;
// }
if (!supabaseClient) {
console.log('Supabase client not initialized'); // Debug log
showError('Database not initialized', 'Error');
return;
}
editingContainerId = containerId;
const modal = document.getElementById('container-modal');
const overlay = document.getElementById('container-modal-overlay');
if (!modal || !overlay) {
showError('Modal elements not found', 'Error');
return;
}
// Reset form and clear errors
const form = document.getElementById('container-form');
if (form) {
form.reset();
clearContainerFormErrors();
}
if (containerId) {
// Edit mode - load container data
try {
const { data: container, error } = await supabaseClient
.from('containers')
.select('*')
.eq('id', containerId)
.single();
if (error) throw error;
if (container) {
document.getElementById('container-number').value = container.chassi_no || '';
document.getElementById('container-name').value = container.container || '';
document.getElementById('container-size').value = container.size || '';
document.getElementById('container-color').value = container.color || '';
document.getElementById('container-location').value = container.plant || '';
// Update modal title and submit button text for edit mode
const modalTitle = document.getElementById('container-modal-title');
const submitBtn = document.getElementById('container-submit-btn');
if (modalTitle) modalTitle.textContent = 'Edit Container';
if (submitBtn) submitBtn.textContent = 'Update Container';
}
} catch (err) {
console.error('Error loading container:', err);
showError('Failed to load container data', 'Error');
return;
}
} else {
// Add mode
const modalTitle = document.getElementById('container-modal-title');
const submitBtn = document.getElementById('container-submit-btn');
if (modalTitle) modalTitle.textContent = 'Add Container';
if (submitBtn) submitBtn.textContent = 'Save Container';
}
// Show modal
modal.style.display = 'block';
overlay.style.display = 'block';
document.body.style.overflow = 'hidden';
}
// Close container modal
function closeContainerModal() {

const modal = document.getElementById('container-modal');

const overlay = document.getElementById('container-modal-overlay');

modal.style.display = 'none';

overlay.style.display = 'none';

document.body.style.overflow = 'auto';

// Reset form

const form = document.getElementById('container-form');

if (form) {

form.reset();
}
editingContainerId = null;
}
// Save container data (insert or update)
async function saveContainer(containerNumber, containerName, containerSize, containerColor, containerLocation) {
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
if (!isAdmin) {
showError('Admin privileges required to perform this action', 'Error');
return;
}
if (!supabaseClient) {
showError('Database not initialized', 'Error');
return;
}
if (!containerNumber || !containerSize || !containerColor || !containerLocation) {
showError('Please fill in all required fields', 'Error');
return;
}
try {
return await supabaseWithAuth(async () => {
// Check for duplicates only when adding new container (not editing)
if (!editingContainerId) {
// Check if chassis_no already exists
const { data: existingChassi, error: chassiError } = await supabaseClient
.from('containers')
.select('id')
.eq('chassi_no', containerNumber)
.limit(1);

if (chassiError) throw chassiError;
if (existingChassi && existingChassi.length > 0) {
showError('Container with this Chassis No. already exists!', 'Duplicate Error');
return;
}

// Check if container name already exists
const { data: existingContainer, error: containerError } = await supabaseClient
.from('containers')
.select('id')
.eq('container', containerName)
.limit(1);

if (containerError) throw containerError;
if (existingContainer && existingContainer.length > 0) {
showError('Container with this Container No. already exists!', 'Duplicate Error');
return;
}
}

let result;
if (editingContainerId) {
// Update existing container
result = await supabaseClient
.from('containers')
.update({
chassi_no: containerNumber,
container: containerName,
size: containerSize,
color: containerColor,
plant: containerLocation,
})
.eq('id', editingContainerId);
} else {
// Insert new container
result = await supabaseClient
.from('containers')
.insert({
chassi_no: containerNumber,
container: containerName,
size: containerSize,
color: containerColor,
plant: containerLocation,
created_at: new Date().toISOString()
});
}
if (result.error) {
throw result.error;
}
showSuccess(editingContainerId ? 'Container updated successfully!' : 'Container added successfully!');
closeContainerModal();
// Reload container table to show the new/updated container
setTimeout(() => {
loadContainerDataForRegistry();
updateContainerTrailerCounts();
}, 500);
});
} catch (err) {
console.error('Error saving container:', err.message);
showError('Failed to save container: ' + err.message, 'Error');
}
}
// Edit container function
async function editContainer(containerId) {
await openContainerModal(containerId);
}
// View container function
async function viewContainer(containerId) {
if (!supabaseClient) {
showError('Database not initialized', 'Error');
return;
}
try {
const { data: container, error } = await supabaseClient
.from('containers')
.select('*')
.eq('id', containerId)
.single();
if (error) throw error;
if (container) {
const message = `
Container Details:
Chassi No: ${container.chassi_no || 'N/A'}
Container: ${container.container || 'N/A'}
Color: ${container.color || 'N/A'}
Size: ${container.size || 'N/A'}
Status: ${container.status || 'N/A'}
`;
showInfo(message.trim(), 'Container Information');
}
} catch (err) {
console.error('Error viewing container:', err);
showError('Failed to load container data', 'Error');
}
}
// Delete container function
async function deleteContainer(containerId) {
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
if (!isAdmin) {
showError('Admin privileges required to perform this action', 'Error');
return;
}
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
// Show confirmation dialog
const confirmed = await new Promise((resolve) => {
showConfirm('Are you sure you want to delete this container?', 'Confirm Delete', 'confirmDelete', 'confirmCancel');
// Set up temporary global functions
window.confirmDelete = () => resolve(true);
window.confirmCancel = () => resolve(false);
});
if (!confirmed) {
return;
}
try {
const { error } = await supabaseClient
.from('containers')
.delete()
.eq('id', containerId);
if (error) throw error;
showSuccess('Container deleted successfully!', 'Success');
// Reload container data to refresh table
await loadContainerDataForRegistry();
// Update container count
updateContainerTrailerCounts();
} catch (err) {
console.error('Error deleting container:', err.message);
showError('Failed to delete container', 'Error');
}
}
// Load container data from database
async function loadContainerData() {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
const containerTable = document.getElementById('status-container-table');
if (!containerTable) return;
const tbody = containerTable.querySelector('tbody');
if (!tbody) return;
// Check if user is admin
const isAdmin = window.authSystem && window.authSystem.isAdmin();
// Fix header structure based on user role
const headerRow = containerTable.querySelector('thead tr');
if (headerRow) {
if (isAdmin) {
// Show all 8 columns for admin
headerRow.innerHTML = `
<td>Chassi No.</td>
<td>Container</td>
<td>Color</td>
<td>Size</td>
<td>Remarks</td>
<td>Container Issue</td>
<td>Status</td>
<td class="auth-required">Actions</td>
`;
} else {
// Show only 7 columns for guest users
headerRow.innerHTML = `
<td>Chassi No.</td>
<td>Container</td>
<td>Color</td>
<td>Size</td>
<td>Remarks</td>
<td>Container Issue</td>
<td>Status</td>
`;
}
}
try {
return await supabaseWithAuth(async () => {
// Fetch container data from database
let query = supabaseClient
.from('containers')
.select('*')
.order('container', { ascending: true });
// Apply plant filter if specified  
if (selectedPlantFilter) {
query = query.eq('plant', selectedPlantFilter);
}
const { data: containers, error } = await query;

if (error) throw error;

if (!containers || containers.length === 0) {
const colspan = isAdmin ? 8 : 7;
tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 20px;">No container data available</td></tr>`;
return;
}

// Generate table rows with container data
const rows = containers.map(container => {
const statusClass = container.status === 'Active' ? 'status-active' :
container.status === 'Inactive' ? 'status-expired' : 'status-unknown';
const colorStyle = container.color === 'Blue' ? 'blue' : container.color === 'Red' ? 'red' : container.color === 'Green' ? 'green' : container.color === 'Yellow' ? 'yellow' : container.color ? container.color.toLowerCase() : 'inherit';

return `
<tr>
<td>${container.chassi_no || '-'}</td>
<td style="color: ${colorStyle}; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${container.container || '-'}</td>
<td>${container.color || '-'}</td>
<td>${container.size || '-'}</td>
<td>${container.remarks || '-'}</td>
<td>${container.container_issue || '-'}</td>
<td>${getStyledStatus(container.status)}</td>
${isAdmin ? `<td class="auth-required">
  <button class="action-btn auth-required" onclick="editContainerStatus('${container.id || ''}', '${container.container || ''}', '${container.chassi_no || ''}', '${container.color || ''}', '${container.size || ''}', '${container.remarks || ''}', '${container.container_issue || ''}', '${container.status || ''}', '${container.date_reported || ''}')">Edit</button>
</td>` : ''}
</tr>
`;
}).join('');

tbody.innerHTML = rows || `<tr><td colspan="${isAdmin ? 8 : 7}" style="text-align: center; padding: 20px;">No container data available</td></tr>`;

// Call updateCrudVisibility to ensure all CRUD elements are properly hidden/shown
if (window.updateCrudVisibility) {
    window.updateCrudVisibility();
}
});
} catch (error) {
console.error('Error loading container data:', error);
const colspan = isAdmin ? 8 : 7;
tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 20px;">Error loading data</td></tr>`;
}
}
// ================== Table Toggle Functionality ==================
document.addEventListener('DOMContentLoaded', function() {
// Initialize table switching buttons
const truckBtn = document.getElementById('status-truck-btn');
const trailerBtn = document.getElementById('status-trailer-btn');
const containerBtn = document.getElementById('status-container-btn');
const crBtn = document.getElementById('status-cr-btn');
const orBtn = document.getElementById('status-or-btn');
const statusTable = document.getElementById('status-table');
const statusTable2 = document.getElementById('status-table-2');
// Diesel table switching buttons
const dieselMinBtn = document.getElementById('diesel-min-btn');
const dieselAveBtn = document.getElementById('diesel-ave-btn');
// Set truck button as active by default
updateTableButtonStyles('truck');
// Initialize truck table and hide buttons
updateStatusButtons('truck');
// Initialize repair buttons - set truck as active by default
setRepairFilter('truck');
// Immediately hide buttons on page load
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
// Add event listeners for new table switch buttons
if (truckBtn) {
truckBtn.addEventListener('click', function() {
switchTable('truck');
// Immediately hide both buttons when truck tab is clicked
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
});
}
if (trailerBtn) {
trailerBtn.addEventListener('click', function() {
switchTable('trailer');
// Show only trailer button when trailer tab is clicked
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.remove('hidden');
if (addContainerBtn) addContainerBtn.classList.add('hidden');
});
}
if (containerBtn) {
containerBtn.addEventListener('click', function() {
switchTable('container');
// Show only container button when container tab is clicked
const addTrailerBtn = document.getElementById('add-trailer-btn');
const addContainerBtn = document.getElementById('add-container-btn');
if (addTrailerBtn) addTrailerBtn.classList.add('hidden');
if (addContainerBtn) addContainerBtn.classList.remove('hidden');
});
}
// Add event listener for + Trailer button
const trailerAddBtn = document.getElementById('add-trailer-btn');
if (trailerAddBtn) {
trailerAddBtn.addEventListener('click', function() {
openTrailerModal(); // Open modal in add mode (no trailerId)
});
}
// Add event listener for + Container button
const containerAddBtn = document.getElementById('add-container-btn');
if (containerAddBtn) {
containerAddBtn.addEventListener('click', function(e) {
e.preventDefault();
e.stopPropagation();
console.log('Add Container button clicked'); // Debug log
openContainerModal(); // Open modal in add mode (no containerId)
});
} else {
console.log('Add Container button not found'); // Debug log
}
// Add event listener for C/R button
if (crBtn) {
crBtn.addEventListener('click', function() {
switchTable('cr');
});
}
// Add event listener for O/R button
if (orBtn) {
orBtn.addEventListener('click', function() {
switchTable('or');
});
}
// Add event listeners for diesel table switching buttons
if (dieselMinBtn) {
dieselMinBtn.addEventListener('click', function() {
switchDieselTable('min');
});
}
if (dieselAveBtn) {
dieselAveBtn.addEventListener('click', function() {
switchDieselTable('ave');
});
}
// Note: Event listeners for repair and truck images buttons are now handled in the unified section above
// Event listeners for + Trailer and + Container buttons are handled elsewhere
// Get toggle button for Show Other Table functionality
const toggleBtn = document.getElementById('toggle-btn');
// Keep existing toggle functionality for Show Other Table button
if (toggleBtn && statusTable && statusTable2) {
toggleBtn.addEventListener('click', function() {
// Only work with truck table toggle
if (selectedTable === 'truck') {
if (statusTable.style.display === 'none') {
// Show main table, hide second table
statusTable.style.display = '';
statusTable2.style.display = 'none';
toggleBtn.textContent = 'Show Other Table';
} else {
// Hide main table, show second table
statusTable.style.display = 'none';
statusTable2.style.display = '';
toggleBtn.textContent = 'Back to Main Table';
}
}
});
}
// Initialize with truck table visible
switchTable('truck');
// Load vehicle status data for Status section
loadVehicleStatus().then(() => {
    // Display truck data after loading
    if (typeof displayVehicleStatus === 'function') {
        displayVehicleStatus(vehicleStatusRecords);
    }
}).catch(err => {
    console.error('Error loading vehicle status:', err);
});
});
// Truck Images Table Switching Functions
let selectedTruckImagesType = 'truck'; // Track current truck images type
function switchTruckImagesTable(vehicleType) {

selectedTruckImagesType = vehicleType;

// Update button styles

updateTruckImagesButtonStyles(vehicleType);

// Update the h2 title based on selected vehicle type

const truckImagesHeader = document.querySelector('#trucks-view .cardHeader h2');

if (truckImagesHeader) {

const titles = {

'truck': 'Truck Images',

'trailer': 'Trailer Images',

'container': 'Container Images'

};

truckImagesHeader.textContent = titles[vehicleType] || 'Truck Images';
}
// Update the Add button text based on selected vehicle type
const addTruckImagesBtn = document.getElementById('add-truck-images-btn');
if (addTruckImagesBtn) {
const buttonTexts = {
'truck': '+ Add Truck Images',
'trailer': '+ Add Trailer Images',
'container': '+ Add Container Images'
};
addTruckImagesBtn.textContent = buttonTexts[vehicleType] || '+ Add Truck Images';
}
// Reload truck images with the selected vehicle type filter
loadTruckImages(selectedPlantFilter, vehicleType);
}
// Update truck images button styles based on selected vehicle type
function updateTruckImagesButtonStyles(vehicleType) {

const truckBtn = document.getElementById('truck-images-truck-btn');

const trailerBtn = document.getElementById('truck-images-trailer-btn');

const containerBtn = document.getElementById('truck-images-container-btn');

// First, reset ALL buttons to inactive state

const allButtons = [truckBtn, trailerBtn, containerBtn];

allButtons.forEach(btn => {

if (btn) {

// Force inactive styling

btn.style.setProperty('background', 'linear-gradient(135deg, #8b3f3f 0%, #c95454 50%, #a04949 100%)', 'important');

btn.style.setProperty('color', '#ffffff', 'important');

btn.style.setProperty('border', 'none', 'important');

btn.style.setProperty('transform', 'scale(1)', 'important');

btn.style.setProperty('padding', '8px 14px', 'important');

btn.style.setProperty('border-radius', '6px', 'important');

btn.style.setProperty('cursor', 'pointer', 'important');

btn.style.setProperty('font-weight', '600', 'important');
}
});
// Then apply active styling to the correct button
let activeBtn = null;
if (vehicleType === 'truck') activeBtn = truckBtn;
else if (vehicleType === 'trailer') activeBtn = trailerBtn;
else if (vehicleType === 'container') activeBtn = containerBtn;
if (activeBtn) {
// Force active styling
activeBtn.style.setProperty('background', '#ffffff', 'important');
activeBtn.style.setProperty('color', '#dc3545', 'important');
activeBtn.style.setProperty('transform', 'scale(1.05)', 'important');
} else {
console.warn(`No active button found for vehicleType: ${vehicleType}`);
}
}
// Update Status section button visibility based on vehicle type
function updateStatusButtons(vehicleType) {

const addTrailerBtn = document.getElementById('add-trailer-btn');

const addContainerBtn = document.getElementById('add-container-btn');

if (addTrailerBtn && addContainerBtn) {

if (vehicleType === 'trailer') {

// Show Trailer button, hide Container button

addTrailerBtn.classList.remove('hidden');

addContainerBtn.classList.add('hidden');

} else if (vehicleType === 'container') {

// Show Container button, hide Trailer button

addContainerBtn.classList.remove('hidden');

addTrailerBtn.classList.add('hidden');

} else {

// Hide both buttons for truck, cr-or, and all other types

addTrailerBtn.classList.add('hidden');

addContainerBtn.classList.add('hidden');
}
}
}
// ====================== CLIENT MODAL FUNCTIONS ==========================
// Open Client Modal
function openClientModal() {

// Check if user is admin

if (!window.authSystem || !window.authSystem.isAdmin()) {

showError('Access denied. Admin privileges required.', 'Authentication Error');

return;
}
const modal = document.getElementById('client-modal');
const overlay = document.getElementById('client-modal-overlay');
// Reset form
document.getElementById('client-form').reset();
document.getElementById('client-total-km').value = '';
// Show modal
modal.style.display = 'block';
overlay.style.display = 'block';
}
// Close Client Modal
function closeClientModal() {

const modal = document.getElementById('client-modal');

const overlay = document.getElementById('client-modal-overlay');

modal.style.display = 'none';

overlay.style.display = 'none';
}
// Load Diesel Data
async function loadDieselData() {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Show loading state
const minTableBody = document.querySelector('#diesel-min-table tbody');
const aveTableBody = document.querySelector('#diesel-ave-table tbody');
if (minTableBody) {
minTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading diesel records...</td></tr>';
}
if (aveTableBody) {
aveTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading diesel records...</td></tr>';
}
// Fetch diesel data and client data from Supabase
let minQuery = supabaseClient
.from('diesel_records_min')
.select('*')
.order('created_at', { ascending: false });
if (selectedPlantFilter) {
minQuery = minQuery.eq('plant', selectedPlantFilter);
}
const { data: minData, error: minError } = await supabaseWithAuth(async () => {
return await minQuery;
});
let aveQuery = supabaseClient
.from('diesel_records_ave')
.select('*')
.order('created_at', { ascending: false });
if (selectedPlantFilter) {
aveQuery = aveQuery.eq('plant', selectedPlantFilter);
}
const { data: aveData, error: aveError } = await supabaseWithAuth(async () => {
return await aveQuery;
});
// Fetch client data to get address information
let clientQuery = supabaseClient
.from('clients')
.select('destination, address')
.order('created_at', { ascending: false });
if (selectedPlantFilter) {
clientQuery = clientQuery.eq('plant', selectedPlantFilter);
}
const { data: clientData, error: clientError } = await supabaseWithAuth(async () => {
return await clientQuery;
});
// Create a map of destination to address for quick lookup
const destinationAddressMap = {};
if (clientData && clientData.length > 0) {
clientData.forEach(client => {
if (client.destination) {
destinationAddressMap[client.destination] = client.address || '-';
}
});
}
const error = minError || aveError;
if (error) {
console.error('Error fetching diesel data:', error);
if (minTableBody) {
minTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading diesel records</td></tr>';
}
if (aveTableBody) {
aveTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading diesel records</td></tr>';
}
return;
}
// Populate Min table with all client destinations
if (minTableBody) {
if (clientData && clientData.length > 0) {
minTableBody.innerHTML = clientData.map(client => {
// Find corresponding diesel record for this destination
let dieselRecord = null;
if (minData) {
// Only use exact match
dieselRecord = minData.find(record => record.destination === client.destination);
}
return `
<tr>
<td>${client.destination || '-'}</td>
<td>${dieselRecord ? (dieselRecord.four_w_six_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.eight_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.ten_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.twelve_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.tractor_head || '-') : '-'}</td>
<td class="auth-required">
<button class="action-btn" onclick="editDieselRecord('${dieselRecord ? dieselRecord.id : ''}', 'min', event, '${client.destination}')">Edit</button>
</td>
</tr>
`;
}).join('');
} else {
minTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No client destinations found</td></tr>';
}
}
// Populate Ave table with all client destinations
if (aveTableBody) {
if (clientData && clientData.length > 0) {
aveTableBody.innerHTML = clientData.map(client => {
// Find corresponding diesel record for this destination
let dieselRecord = null;
if (aveData) {
// Only use exact match
dieselRecord = aveData.find(record => record.destination === client.destination);
}
return `
<tr>
<td>${client.destination || '-'}</td>
<td>${dieselRecord ? (dieselRecord.four_w_six_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.eight_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.ten_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.twelve_w || '-') : '-'}</td>
<td>${dieselRecord ? (dieselRecord.tractor_head || '-') : '-'}</td>
<td class="auth-required">
<button class="action-btn" onclick="editDieselRecord('${dieselRecord ? dieselRecord.id : ''}', 'ave', event, '${client.destination}')">Edit</button>
</td>
</tr>
`;
}).join('');
} else {
aveTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No client destinations found</td></tr>';
}
}
} catch (error) {
console.error('Error in loadDieselData:', error);
const minTableBody = document.querySelector('#diesel-min-table tbody');
const aveTableBody = document.querySelector('#diesel-ave-table tbody');
if (minTableBody) {
minTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading diesel records</td></tr>';
}
if (aveTableBody) {
aveTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Error loading diesel records</td></tr>';
}
}
}
// Fix Diesel Records Destination Data
async function fixDieselRecordsDestination() {
if (!supabaseClient) {
console.error('Supabase not initialized');
return;
}
try {
// Get all client destinations
const { data: clientData, error: clientError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('clients')
.select('id, destination')
.order('id', { ascending: true });
});
if (clientError) {
console.error('Error fetching client data:', clientError);
return;
}
// Get all diesel records (both min and ave)
const { data: minData, error: minError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('diesel_records_min')
.select('*');
});
const { data: aveData, error: aveError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('diesel_records_ave')
.select('*');
});
if (minError || aveError) {
console.error('Error fetching diesel data:', minError || aveError);
return;
}
// Create a proper mapping from client ID to destination
const clientIdToDestinationMap = {};
clientData.forEach(client => {
clientIdToDestinationMap[client.id] = client.destination;
});
// Fix min table records
if (minData && minData.length > 0) {
for (const record of minData) {
// Check if destination is a number or doesn't match any client destination
const isNumericDestination = !isNaN(record.destination);
const matchingClient = clientData.find(client => client.destination === record.destination);
if (isNumericDestination || !matchingClient) {
// Try to map numeric destination to client ID, then to destination name
let correctDestination = record.destination;
if (isNumericDestination) {
const clientIndex = parseInt(record.destination) - 1; // Assuming 1-based index
if (clientData[clientIndex]) {
correctDestination = clientData[clientIndex].destination;
} else {
// Try to find by matching the numeric value as client ID
if (clientIdToDestinationMap[record.destination]) {
correctDestination = clientIdToDestinationMap[record.destination];
}
}
}
if (correctDestination !== record.destination) {
const { error: updateError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('diesel_records_min')
.update({ destination: correctDestination })
.eq('id', record.id);
});
if (updateError) {
console.error('Error updating min record:', updateError);
} else {
}
}
}
}
}
// Fix ave table records
if (aveData && aveData.length > 0) {
for (const record of aveData) {
const isNumericDestination = !isNaN(record.destination);
const matchingClient = clientData.find(client => client.destination === record.destination);
if (isNumericDestination || !matchingClient) {
let correctDestination = record.destination;
if (isNumericDestination) {
const clientIndex = parseInt(record.destination) - 1;
if (clientData[clientIndex]) {
correctDestination = clientData[clientIndex].destination;
} else {
if (clientIdToDestinationMap[record.destination]) {
correctDestination = clientIdToDestinationMap[record.destination];
}
}
}
if (correctDestination !== record.destination) {
const { error: updateError } = await supabaseWithAuth(async () => {
return await supabaseClient
.from('diesel_records_ave')
.update({ destination: correctDestination })
.eq('id', record.id);
});
if (updateError) {
console.error('Error updating ave record:', updateError);
} else {
}
}
}
}
}
showSuccess('Diesel records destination data fixed successfully!', 'Success');
// Reload the data to show updated records
loadDieselData();
} catch (error) {
console.error('Error fixing diesel records:', error);
showError('Error fixing diesel records', 'Error');
}
}
// Add fix button to diesel page (run this in console to add the button)
function addFixDieselButton() {

const dieselSection = document.querySelector('.diesel-section');

if (dieselSection) {

const fixButton = document.createElement('button');

fixButton.textContent = 'Fix Diesel Destinations';

fixButton.className = 'btn-fix-diesel';

fixButton.style.cssText = 'background: #ff9800; color: white; padding: 10px 20px; margin: 10px; border: none; border-radius: 4px; cursor: pointer;';

fixButton.onclick = fixDieselRecordsDestination;

dieselSection.insertBefore(fixButton, dieselSection.firstChild);
}
}
// Auto-fix diesel records on page load
async function autoFixDieselRecords() {
try {
await fixDieselRecordsDestination();
} catch (error) {
console.error('Auto-fix failed:', error);
}
}
// Run auto-fix when diesel page loads
document.addEventListener('DOMContentLoaded', function() {
// Check if we're on the diesel page
setTimeout(() => {
const dieselSection = document.querySelector('.diesel-section');
if (dieselSection) {
autoFixDieselRecords();
}
}, 2000); // Wait 2 seconds for page to load
});
// Calculate Total Km function
function calculateTotalKm() {

const goingTo = document.getElementById('client-going-to').value;

const goingBack = document.getElementById('client-going-back').value;

const totalKm = document.getElementById('client-total-km');

// Parse values as numbers (treat empty as 0)

const toValue = parseFloat(goingTo) || 0;

const backValue = parseFloat(goingBack) || 0;

// Calculate total

const total = toValue + backValue;

// Update total km field

totalKm.value = total.toString();
}
// Initialize Client Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
const clientModalCloseBtn = document.getElementById('client-modal-close-btn');
const clientModalOverlay = document.getElementById('client-modal-overlay');
const clientForm = document.getElementById('client-form');
// Close modal events
if (clientModalCloseBtn) {
clientModalCloseBtn.addEventListener('click', closeClientModal);
}
if (clientModalOverlay) {
clientModalOverlay.addEventListener('click', closeClientModal);
}
// Form submission
if (clientForm) {
clientForm.addEventListener('submit', async function(e) {
e.preventDefault();
// Get form values
const destination = document.getElementById('client-destination').value.trim();
const address = document.getElementById('client-address').value.trim();
const goingTo = document.getElementById('client-going-to').value.trim();
const goingBack = document.getElementById('client-going-back').value.trim();
const totalKm = document.getElementById('client-total-km').value.trim();
const averageTime = document.getElementById('client-average-time').value.trim();
// Validate required fields
if (!destination || !address || !averageTime) {
showWarning('Please fill in all required fields', 'Validation Error');
return;
}
try {
// Save client data to database
await saveClient({
destination,
address,
goingTo,
goingBack,
totalKm,
averageTime
});
showSuccess('Client added successfully!', 'Success');
closeClientModal();
// Refresh client table
loadClientData();
// Create blank diesel records for the new client
if (window.dieselModule && typeof window.dieselModule.createBlankDieselRecordsForClient === 'function') {
try {
await window.dieselModule.createBlankDieselRecordsForClient(destination);
console.log('Blank diesel records created for new client:', destination);
} catch (dieselError) {
console.error('Error creating blank diesel records:', dieselError);
// Don't fail the client save if diesel record creation fails
}
}
} catch (error) {
console.error('Error saving client:', error);
showError('Failed to save client. Please try again.', 'Error');
}
});
}
// Auto-calculation event listeners
const goingToInput = document.getElementById('client-going-to');
const goingBackInput = document.getElementById('client-going-back');
if (goingToInput) {
goingToInput.addEventListener('input', calculateTotalKm);
}
if (goingBackInput) {
goingBackInput.addEventListener('input', calculateTotalKm);
}
// ====================== DIESEL MODAL EVENT LISTENERS ==========================
const dieselModalCloseBtn = document.getElementById('diesel-modal-close-btn');
const dieselModalOverlay = document.getElementById('diesel-modal-overlay');
const dieselForm = document.getElementById('diesel-form');
// Close modal events
if (dieselModalCloseBtn) {
dieselModalCloseBtn.addEventListener('click', closeDieselModal);
}
if (dieselModalOverlay) {
dieselModalOverlay.addEventListener('click', closeDieselModal);
}
// Form submission
if (dieselForm) {
dieselForm.addEventListener('submit', saveDieselData);
}
});
