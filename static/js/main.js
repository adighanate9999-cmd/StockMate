/**
 * SMART STOCK & MONEY MANAGER - Core Frontend Logic
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initClock();
    initKeyboardShortcuts();
    autoDismissFlashes();
    if (window.lucide) {
        lucide.createIcons();
    }
});

/**
 * Sidebar Toggle Logic (Desktop collapse + Mobile overlay)
 */
function initSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const mainContent = document.getElementById('app-main-content');
    const desktopToggle = document.getElementById('sidebar-toggle-desktop');
    const mobileToggle = document.getElementById('sidebar-toggle-mobile');
    const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');

    // Restore desktop state from localStorage
    const isCollapsed = localStorage.getItem('smartstock_sidebar_collapsed') === 'true';
    if (isCollapsed && window.innerWidth > 1024) {
        sidebar?.classList.add('collapsed');
        mainContent?.classList.add('sidebar-collapsed');
    }

    if (desktopToggle) {
        desktopToggle.addEventListener('click', () => {
            if (sidebar && mainContent) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                const collapsedNow = sidebar.classList.contains('collapsed');
                localStorage.setItem('smartstock_sidebar_collapsed', collapsedNow);
            }
        });
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('mobile-open');
            mobileBackdrop?.classList.toggle('hidden');
        });
    }

    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', () => {
            sidebar?.classList.remove('mobile-open');
            mobileBackdrop.classList.add('hidden');
        });
    }
}

/**
 * Topbar Real-Time Clock
 */
function initClock() {
    const clockEl = document.getElementById('live-top-clock');
    if (!clockEl) return;

    function updateClock() {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        };
        clockEl.textContent = now.toLocaleDateString('en-IN', options);
    }
    updateClock();
    setInterval(updateClock, 1000);
}

/**
 * Global Keyboard Shortcuts (F2: Quick POS, /: Focus Search, Esc: Close Modals)
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F2 -> Jump to Fast Billing POS
        if (e.key === 'F2') {
            e.preventDefault();
            window.location.href = '/pos';
        }
        // Escape -> Close any open modal
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Toast Notification System
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {string} message 
 * @param {string} [title] 
 */
function showToast(type, message, title = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white';

    let iconBg = 'bg-emerald-100 text-emerald-600';
    let iconName = 'check-circle';
    let defaultTitle = 'Success';

    if (type === 'error') {
        iconBg = 'bg-rose-100 text-rose-600';
        iconName = 'alert-triangle';
        defaultTitle = 'Error';
    } else if (type === 'warning') {
        iconBg = 'bg-amber-100 text-amber-600';
        iconName = 'alert-circle';
        defaultTitle = 'Attention';
    } else if (type === 'info') {
        iconBg = 'bg-blue-100 text-blue-600';
        iconName = 'info';
        defaultTitle = 'Information';
    }

    toast.innerHTML = `
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}">
            <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 pr-2">
            <h4 class="text-sm font-semibold text-slate-800">${title || defaultTitle}</h4>
            <p class="text-xs text-slate-600 mt-0.5">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ root: toast });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.style.transition = 'all 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/**
 * Format Indian Rupee currency
 */
function formatINR(number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(number || 0);
}

/**
 * Modal Management Utilities
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('[data-modal]').forEach(modal => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
    document.body.style.overflow = '';
}

/**
 * Auto dismiss flash messages from server
 */
function autoDismissFlashes() {
    setTimeout(() => {
        document.querySelectorAll('.flash-alert').forEach(el => {
            el.style.transition = 'all 0.5s ease';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        });
    }, 4500);
}

/**
 * Send WhatsApp Payment Reminder
 */
function sendWhatsAppReminder(phone, customerName, balance, shopName) {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    const msg = `Namaste ${customerName} ji! 🙏\nThis is a gentle reminder from *${shopName}* regarding your pending grocery credit balance of *₹${balance.toFixed(2)}*.\nKindly clear it at your earliest convenience via Cash or UPI.\nThank you for your business!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}
