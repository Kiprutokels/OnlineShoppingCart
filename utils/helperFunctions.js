// Format date to YYYY-MM-DD
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.min(Math.round((value / total) * 100), 100);
};

// Format currency
export const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
    }).format(amount);
};