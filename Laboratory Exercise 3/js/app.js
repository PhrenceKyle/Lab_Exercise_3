// Main Application Module
// Handles CRUD operations, dashboard, search, and filtering

let allRequests = [];
let deleteRequestId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    await loadRequests();
    setupEventListeners();
});

// Load all requests from Supabase
async function loadRequests() {
    try {
        const { data, error } = await supabaseClient
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allRequests = data || [];
        updateDashboard();
        renderRequests(allRequests);
        
    } catch (error) {
        console.error('Error loading requests:', error);
        showNotification('Failed to load requests', 'error');
    }
}

// Update dashboard statistics
function updateDashboard() {
    const total = allRequests.length;
    const pending = allRequests.filter(r => r.status === 'Pending').length;
    const inProgress = allRequests.filter(r => r.status === 'In Progress').length;
    const completed = allRequests.filter(r => r.status === 'Completed').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('inProgressRequests').textContent = inProgress;
    document.getElementById('completedRequests').textContent = completed;
}

// Render requests in table
function renderRequests(requests) {
    const tbody = document.getElementById('requestsTableBody');
    const noData = document.getElementById('noRequests');
    
    tbody.innerHTML = '';
    
    if (requests.length === 0) {
        noData.classList.remove('hidden');
        return;
    }
    
    noData.classList.add('hidden');
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        const priorityClass = getPriorityClass(request.priority);
        const statusClass = getStatusClass(request.status);
        
        const date = new Date(request.created_at).toLocaleDateString();
        
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${escapeHtml(request.requester_name)}</td>
            <td>${escapeHtml(request.department)}</td>
            <td>${escapeHtml(request.category)}</td>
            <td><span class="priority-badge ${priorityClass}">${escapeHtml(request.priority)}</span></td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(request.status)}</span></td>
            <td>${date}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editRequest(${request.id})">Edit</button>
                <button class="action-btn delete-btn" onclick="confirmDelete(${request.id})">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Get priority CSS class
function getPriorityClass(priority) {
    switch (priority) {
        case 'High': return 'priority-high';
        case 'Medium': return 'priority-medium';
        case 'Low': return 'priority-low';
        default: return '';
    }
}

// Get status CSS class
function getStatusClass(status) {
    switch (status) {
        case 'Pending': return 'status-pending';
        case 'In Progress': return 'status-progress';
        case 'Completed': return 'status-completed';
        default: return '';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup event listeners
function setupEventListeners() {
    // New request button
    document.getElementById('newRequestBtn').addEventListener('click', () => {
        openModal();
    });
    
    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // Request form submission
    document.getElementById('requestForm').addEventListener('submit', handleFormSubmit);
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterRequests);
    
    // Filter dropdowns
    document.getElementById('statusFilter').addEventListener('change', filterRequests);
    document.getElementById('priorityFilter').addEventListener('change', filterRequests);
    
    // Delete modal
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', deleteRequest);
    
    // Close modals on outside click
    document.getElementById('requestModal').addEventListener('click', (e) => {
        if (e.target.id === 'requestModal') closeModal();
    });
    
    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteModal') closeDeleteModal();
    });
}

// Open modal for new/edit request
function openModal(request = null) {
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('requestForm');
    const statusGroup = document.getElementById('statusGroup');
    
    form.reset();
    
    if (request) {
        title.textContent = 'Edit Service Request';
        document.getElementById('requestId').value = request.id;
        document.getElementById('requesterName').value = request.requester_name;
        document.getElementById('department').value = request.department;
        document.getElementById('category').value = request.category;
        document.getElementById('description').value = request.description;
        document.getElementById('priority').value = request.priority;
        document.getElementById('status').value = request.status;
        // Show status field when editing
        statusGroup.classList.remove('hidden');
    } else {
        title.textContent = 'New Service Request';
        document.getElementById('requestId').value = '';
        document.getElementById('status').value = 'Pending'; // Default status for new requests
        // Hide status field when creating new request
        statusGroup.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    document.getElementById('requestModal').classList.add('hidden');
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const requestId = document.getElementById('requestId').value;
    const requesterName = document.getElementById('requesterName').value.trim();
    const department = document.getElementById('department').value.trim();
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const status = document.getElementById('status').value;
    
    // Business Rules Validation
    if (!requesterName) {
        showNotification('Requester name is required (BR-01)', 'error');
        return;
    }
    
    if (!department) {
        showNotification('Department is required (BR-02)', 'error');
        return;
    }
    
    if (!category) {
        showNotification('Category must be selected (BR-03)', 'error');
        return;
    }
    
    if (description.length < 10) {
        showNotification('Description must contain sufficient information (BR-04)', 'error');
        return;
    }
    
    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
        showNotification('Priority must be Low, Medium, or High (BR-05)', 'error');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showNotification('User must be logged in (BR-07)', 'error');
        return;
    }
    
    try {
        if (requestId) {
            // Update existing request
            const { error } = await supabaseClient
                .from('service_requests')
                .update({
                    requester_name: requesterName,
                    department: department,
                    category: category,
                    description: description,
                    priority: priority,
                    status: status
                })
                .eq('id', requestId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            showNotification('Request updated successfully', 'success');
        } else {
            // Create new request
            const { error } = await supabaseClient
                .from('service_requests')
                .insert([{
                    requester_name: requesterName,
                    department: department,
                    category: category,
                    description: description,
                    priority: priority,
                    status: 'Pending', // BR-06: New requests automatically receive Pending status
                    user_id: user.id
                }]);
            
            if (error) throw error;
            
            showNotification('Request created successfully', 'success');
        }
        
        closeModal();
        await loadRequests();
        
    } catch (error) {
        console.error('Error saving request:', error);
        showNotification('Failed to save request', 'error');
    }
}

// Edit request
function editRequest(id) {
    const request = allRequests.find(r => r.id === id);
    if (request) {
        openModal(request);
    }
}

// Confirm delete
function confirmDelete(id) {
    deleteRequestId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteRequestId = null;
}

// Delete request
async function deleteRequest() {
    if (!deleteRequestId) return;
    
    try {
        const user = getCurrentUser();
        const { error } = await supabaseClient
            .from('service_requests')
            .delete()
            .eq('id', deleteRequestId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        showNotification('Request deleted successfully', 'success');
        closeDeleteModal();
        await loadRequests();
        
    } catch (error) {
        console.error('Error deleting request:', error);
        showNotification('Failed to delete request', 'error');
    }
}

// Filter requests based on search and filters
function filterRequests() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    let filtered = allRequests.filter(request => {
        // Search by requester name or description
        const matchesSearch = 
            request.requester_name.toLowerCase().includes(searchTerm) ||
            request.description.toLowerCase().includes(searchTerm);
        
        // Filter by status
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        
        // Filter by priority
        const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });
    
    renderRequests(filtered);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}
