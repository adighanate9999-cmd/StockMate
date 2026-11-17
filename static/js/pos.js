/**
 * SMART STOCK & MONEY MANAGER - POS & Billing Engine
 */

let cart = [];
let discountType = 'fixed'; // 'fixed' (₹) or 'percent' (%)
let paymentMethod = 'Cash'; // 'Cash', 'UPI', 'Credit'

document.addEventListener('DOMContentLoaded', () => {
    initPOSCatalog();
    initPOSPaymentToggles();
    initDiscountListeners();
    renderCart();
});

/**
 * Filter product catalog by search and category
 */
function initPOSCatalog() {
    const searchInput = document.getElementById('pos-search-input');
    const categoryPills = document.querySelectorAll('.pos-cat-pill');
    const productCards = document.querySelectorAll('.pos-product-item');

    let currentCategory = 'all';

    function filterItems() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        productCards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            const code = card.dataset.code.toLowerCase();
            const cat = card.dataset.category;

            const matchesCategory = (currentCategory === 'all' || cat === currentCategory);
            const matchesQuery = (name.includes(query) || code.includes(query));

            if (matchesCategory && matchesQuery) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterItems);
    }

    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => {
                p.classList.remove('bg-navy-900', 'text-white');
                p.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
            });
            pill.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
            pill.classList.add('bg-navy-900', 'text-white');

            currentCategory = pill.dataset.category;
            filterItems();
        });
    });
}

/**
 * Payment method selector (Cash / UPI / Credit)
 */
function initPOSPaymentToggles() {
    const btns = document.querySelectorAll('.payment-method-btn');
    const upiQrBox = document.getElementById('pos-upi-qr-box');
    const customerSelect = document.getElementById('pos-customer-select');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => {
                b.classList.remove('border-emerald-600', 'bg-emerald-50', 'text-emerald-700');
                b.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
            });
            btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
            btn.classList.add('border-emerald-600', 'bg-emerald-50', 'text-emerald-700');

            paymentMethod = btn.dataset.method;

            // Show QR helper if UPI
            if (upiQrBox) {
                if (paymentMethod === 'UPI') {
                    upiQrBox.classList.remove('hidden');
                    updateUPIQrCode();
                } else {
                    upiQrBox.classList.add('hidden');
                }
            }

            // If Credit, highlight customer selection
            if (paymentMethod === 'Credit') {
                if (customerSelect && customerSelect.value === 'walk-in') {
                    showToast('warning', 'Please select a registered customer to record Khata/Credit.', 'Customer Required');
                    customerSelect.focus();
                }
            }
        });
    });
}

/**
 * Add product to cart
 */
function addToCart(productId, code, name, price, costPrice, unit, maxStock) {
    if (maxStock <= 0) {
        showToast('error', `"${name}" is currently Out of Stock!`, 'Out of Stock');
        return;
    }

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        if (existing.quantity >= maxStock) {
            showToast('warning', `Only ${maxStock} ${unit} available in store!`, 'Stock Limit Reached');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            code: code,
            name: name,
            price: parseFloat(price),
            costPrice: parseFloat(costPrice),
            unit: unit,
            maxStock: parseFloat(maxStock),
            quantity: 1
        });
    }

    renderCart();
}

/**
 * Update item quantity in cart
 */
function updateCartQty(productId, change) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQty > item.maxStock) {
        showToast('warning', `Only ${item.maxStock} ${item.unit} available in store!`, 'Stock Limit');
        return;
    }

    item.quantity = newQty;
    renderCart();
}

/**
 * Direct input of quantity in cart
 */
function setCartQtyDirect(productId, val) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    let qty = parseFloat(val);
    if (isNaN(qty) || qty <= 0) {
        qty = 1;
    }
    if (qty > item.maxStock) {
        showToast('warning', `Only ${item.maxStock} ${item.unit} available! Resetting to maximum.`, 'Stock Limit');
        qty = item.maxStock;
    }
    item.quantity = qty;
    renderCart();
}

/**
 * Remove single item from cart
 */
function removeFromCart(productId) {
    cart = cart.filter(i => i.productId !== productId);
    renderCart();
}

/**
 * Clear full cart
 */
function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    renderCart();
    showToast('info', 'Cart cleared successfully.');
}

/**
 * Discount input listeners
 */
function initDiscountListeners() {
    const discountInput = document.getElementById('pos-discount-input');
    const discountTypeBtn = document.getElementById('pos-discount-type-btn');

    if (discountInput) {
        discountInput.addEventListener('input', renderCartCalculations);
    }

    if (discountTypeBtn) {
        discountTypeBtn.addEventListener('click', () => {
            if (discountType === 'fixed') {
                discountType = 'percent';
                discountTypeBtn.textContent = '%';
            } else {
                discountType = 'fixed';
                discountTypeBtn.textContent = '₹';
            }
            renderCartCalculations();
        });
    }
}

/**
 * Render Cart HTML and totals
 */
function renderCart() {
    const container = document.getElementById('pos-cart-items');
    const emptyState = document.getElementById('pos-cart-empty');
    const checkoutBtn = document.getElementById('pos-checkout-btn');
    const badgeCount = document.getElementById('pos-cart-badge-count');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (badgeCount) badgeCount.textContent = '0';
        renderCartCalculations();
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (badgeCount) badgeCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0).toString();

    let html = '';
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        html += `
        <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/70 transition-colors">
            <div class="flex-1 pr-2">
                <div class="font-medium text-slate-800 text-sm leading-snug">${item.name}</div>
                <div class="text-xs text-slate-500 mt-0.5">
                    ₹${item.price.toFixed(2)} / ${item.unit} &middot; <span class="text-emerald-600 font-semibold">Subtotal: ₹${itemSubtotal.toFixed(2)}</span>
                </div>
            </div>
            
            <!-- Stepper Controls -->
            <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="updateCartQty(${item.productId}, -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-sm font-bold shadow-xs">
                    -
                </button>
                <input type="number" min="1" max="${item.maxStock}" value="${item.quantity}" 
                       onchange="setCartQtyDirect(${item.productId}, this.value)"
                       class="w-12 h-7 text-center font-semibold text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <button type="button" onclick="updateCartQty(${item.productId}, 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-sm font-bold shadow-xs">
                    +
                </button>
                <button type="button" onclick="removeFromCart(${item.productId})" class="ml-1 text-slate-400 hover:text-rose-600 p-1" title="Remove">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons({ root: container });

    renderCartCalculations();
}

/**
 * Calculate totals (Subtotal, Discount, Grand Total)
 */
function renderCartCalculations() {
    const subtotalEl = document.getElementById('pos-cart-subtotal');
    const discountEl = document.getElementById('pos-cart-discount-amount');
    const totalEl = document.getElementById('pos-cart-total');
    const discountInput = document.getElementById('pos-discount-input');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountVal = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    let discountAmt = 0;

    if (discountType === 'percent') {
        discountAmt = (subtotal * Math.min(discountVal, 100)) / 100;
    } else {
        discountAmt = Math.min(discountVal, subtotal);
    }

    const grandTotal = Math.max(0, subtotal - discountAmt);

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-₹${discountAmt.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;

    updateUPIQrCode();
}

/**
 * Update dynamic UPI QR Code preview
 */
function updateUPIQrCode() {
    const upiImg = document.getElementById('pos-dynamic-upi-qr');
    const totalEl = document.getElementById('pos-cart-total');
    if (!upiImg || !totalEl) return;

    const totalStr = totalEl.textContent.replace('₹', '').trim();
    const amount = parseFloat(totalStr) || 0;
    
    // Standard UPI string: upi://pay?pa=smartkirana@okhdfcbank&pn=Smart%20Stock%20Manager&am=...&cu=INR
    const upiUri = `upi://pay?pa=smartkirana@okhdfcbank&pn=SmartKiranaStore&am=${amount.toFixed(2)}&cu=INR&tn=BillPayment`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUri)}`;
    upiImg.src = qrUrl;
}

/**
 * Complete Sale Transaction
 */
async function completeSale() {
    if (cart.length === 0) {
        showToast('error', 'Cart is empty! Add products first.', 'Empty Cart');
        return;
    }

    const customerSelect = document.getElementById('pos-customer-select');
    const customerIdVal = customerSelect ? customerSelect.value : 'walk-in';
    let customerId = null;
    let customerName = 'Walk-in Customer';

    if (customerIdVal !== 'walk-in') {
        customerId = parseInt(customerIdVal);
        customerName = customerSelect.options[customerSelect.selectedIndex].text.split('(')[0].trim();
    }

    // Validation for Credit / Udhar
    if (paymentMethod === 'Credit' && customerIdVal === 'walk-in') {
        showToast('error', 'Cannot record Credit/Khata for Walk-in Customer! Please select or add a registered customer.', 'Select Customer');
        customerSelect?.focus();
        return;
    }

    const discountInput = document.getElementById('pos-discount-input');
    const discountVal = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const notesInput = document.getElementById('pos-sale-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    const payload = {
        customer_id: customerId,
        customer_name: customerName,
        payment_method: paymentMethod,
        discount_type: discountType,
        discount_val: discountVal,
        notes: notes,
        items: cart.map(item => ({
            product_id: item.productId,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            cost_price: item.costPrice,
            unit: item.unit
        }))
    };

    const checkoutBtn = document.getElementById('pos-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `<span class="inline-block animate-spin mr-2">🔄</span> Processing Sale...`;
    }

    try {
        const response = await fetch('/api/pos/complete-sale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast('success', `Bill ${result.invoice_no} generated successfully!`, 'Sale Recorded');

            // Update remaining stock on catalog items in DOM
            cart.forEach(item => {
                const stockBadge = document.getElementById(`stock-badge-${item.productId}`);
                const card = document.getElementById(`product-card-${item.productId}`);
                if (stockBadge && card) {
                    const newStock = Math.max(0, item.maxStock - item.quantity);
                    card.dataset.stock = newStock;
                    stockBadge.textContent = `${newStock} in stock`;
                    if (newStock === 0) {
                        stockBadge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full badge-out-of-stock';
                        stockBadge.textContent = 'Out of Stock';
                    } else if (newStock <= parseFloat(card.dataset.minStock || 5)) {
                        stockBadge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full badge-low-stock';
                    }
                }
            });

            // Pop up invoice receipt modal
            displayReceiptModal(result.invoice);

            // Reset cart
            cart = [];
            if (discountInput) discountInput.value = '';
            if (notesInput) notesInput.value = '';
            renderCart();
        } else {
            showToast('error', result.message || 'Failed to complete sale.', 'Transaction Failed');
        }
    } catch (err) {
        console.error(err);
        showToast('error', 'Network error while completing transaction.', 'Network Error');
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `
                <i data-lucide="printer" class="w-5 h-5 mr-2"></i>
                Complete Sale &amp; Print Bill (₹)
            `;
            if (window.lucide) lucide.createIcons({ root: checkoutBtn });
        }
    }
}

/**
 * Display thermal printable invoice modal
 */
function displayReceiptModal(invoice) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    document.getElementById('receipt-inv-no').textContent = invoice.invoice_no;
    document.getElementById('receipt-date').textContent = invoice.date_str;
    document.getElementById('receipt-customer').textContent = invoice.customer_name;
    document.getElementById('receipt-payment-method').textContent = invoice.payment_method.toUpperCase();
    document.getElementById('receipt-subtotal').textContent = `₹${invoice.subtotal.toFixed(2)}`;
    document.getElementById('receipt-discount').textContent = `₹${invoice.discount_amount.toFixed(2)}`;
    document.getElementById('receipt-grand-total').textContent = `₹${invoice.grand_total.toFixed(2)}`;

    // Items table
    const itemsTbody = document.getElementById('receipt-items-tbody');
    if (itemsTbody) {
        let itemsHtml = '';
        invoice.items.forEach(item => {
            itemsHtml += `
            <tr class="border-b border-slate-200/60 text-xs">
                <td class="py-1.5 text-left font-medium text-slate-800">${item.name}</td>
                <td class="py-1.5 text-center text-slate-600">${item.quantity} ${item.unit}</td>
                <td class="py-1.5 text-right text-slate-600">₹${item.unit_price.toFixed(2)}</td>
                <td class="py-1.5 text-right font-semibold text-slate-800">₹${item.subtotal.toFixed(2)}</td>
            </tr>
            `;
        });
        itemsTbody.innerHTML = itemsHtml;
    }

    openModal('receipt-modal');
}

/**
 * Trigger clean thermal/A4 print
 */
function printReceipt() {
    window.print();
}

/**
 * Create customer modal quick submit for POS
 */
async function quickAddCustomer(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/customers/add', {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const result = await response.json();

        if (result.success) {
            showToast('success', `Customer ${result.customer.name} added!`, 'Customer Created');
            
            // Add option to POS select and select it
            const select = document.getElementById('pos-customer-select');
            if (select) {
                const opt = document.createElement('option');
                opt.value = result.customer.id;
                opt.text = `${result.customer.name} (${result.customer.phone})`;
                opt.selected = true;
                select.appendChild(opt);
            }
            closeModal('quick-customer-modal');
            form.reset();
        } else {
            showToast('error', result.message || 'Error adding customer', 'Error');
        }
    } catch (e) {
        console.error(e);
        showToast('error', 'Failed to save customer.', 'Error');
    }
}
