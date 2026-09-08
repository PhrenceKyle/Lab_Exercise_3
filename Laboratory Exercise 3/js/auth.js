// Authentication Module
// Handles user login, logout, and session management

let currentUser = null;

// Check if user is logged in on page load
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        return true;
    }
    return false;
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showNotification('Login successful!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        errorDiv.classList.remove('hidden');
    }
}

// Handle logout
async function handleLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        currentUser = null;
        showNotification('Logged out successfully', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Initialize auth on login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Initialize auth on dashboard page
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Check authentication and redirect if not logged in
    checkAuth().then(isAuthenticated => {
        if (!isAuthenticated) {
            window.location.href = 'login.html';
        } else {
            // Display user email
            const userEmail = document.getElementById('userEmail');
            if (userEmail && currentUser) {
                userEmail.textContent = currentUser.email;
            }
        }
    });
}
