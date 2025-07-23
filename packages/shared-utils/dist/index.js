"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = exports.debounce = exports.removeLocalStorage = exports.getLocalStorage = exports.setLocalStorage = exports.createApiError = exports.isTest = exports.isProduction = exports.isDevelopment = exports.buildSearchUrl = exports.buildCategoryUrl = exports.buildProductUrl = exports.calculateEstimatedDelivery = exports.formatLeadTime = exports.calculateTax = exports.calculateDiscount = exports.groupBy = exports.uniqueBy = exports.isValidPhoneNumber = exports.isValidUKPostalCode = exports.isValidEmail = exports.capitalizeFirst = exports.truncateText = exports.slugify = exports.formatDateTime = exports.formatDate = exports.formatCurrency = void 0;
// Currency formatting utilities
const formatCurrency = (amount, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
// Date formatting utilities
const formatDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
exports.formatDateTime = formatDateTime;
// String utilities
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
};
exports.truncateText = truncateText;
const capitalizeFirst = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
exports.capitalizeFirst = capitalizeFirst;
// Validation utilities
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidUKPostalCode = (postalCode) => {
    const ukPostalRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i;
    return ukPostalRegex.test(postalCode.trim());
};
exports.isValidUKPostalCode = isValidUKPostalCode;
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};
exports.isValidPhoneNumber = isValidPhoneNumber;
// Array utilities
const uniqueBy = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};
exports.uniqueBy = uniqueBy;
const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const value = String(item[key]);
        if (!groups[value]) {
            groups[value] = [];
        }
        groups[value].push(item);
        return groups;
    }, {});
};
exports.groupBy = groupBy;
// Price utilities
const calculateDiscount = (originalPrice, salePrice) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};
exports.calculateDiscount = calculateDiscount;
const calculateTax = (amount, taxRate) => {
    return Math.round((amount * taxRate / 100) * 100) / 100;
};
exports.calculateTax = calculateTax;
// Lead time utilities
const formatLeadTime = (minDays, maxDays) => {
    if (minDays === maxDays) {
        return `${minDays} working days`;
    }
    return `${minDays}-${maxDays} working days`;
};
exports.formatLeadTime = formatLeadTime;
const calculateEstimatedDelivery = (leadTimeMaxDays) => {
    const today = new Date();
    const deliveryDate = new Date(today);
    // Add lead time days, skipping weekends
    let daysAdded = 0;
    while (daysAdded < leadTimeMaxDays) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
            daysAdded++;
        }
    }
    return deliveryDate;
};
exports.calculateEstimatedDelivery = calculateEstimatedDelivery;
// URL utilities
const buildProductUrl = (slug) => {
    return `/products/${slug}`;
};
exports.buildProductUrl = buildProductUrl;
const buildCategoryUrl = (categorySlug) => {
    return `/products?category=${categorySlug}`;
};
exports.buildCategoryUrl = buildCategoryUrl;
const buildSearchUrl = (query) => {
    return `/search?q=${encodeURIComponent(query)}`;
};
exports.buildSearchUrl = buildSearchUrl;
// Environment utilities
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const isTest = () => {
    return process.env.NODE_ENV === 'test';
};
exports.isTest = isTest;
// Error utilities
const createApiError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
exports.createApiError = createApiError;
// Storage utilities (for browser)
const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
};
exports.setLocalStorage = setLocalStorage;
const getLocalStorage = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        }
        catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    }
    return defaultValue;
};
exports.getLocalStorage = getLocalStorage;
const removeLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
};
exports.removeLocalStorage = removeLocalStorage;
// Debounce utility
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
exports.debounce = debounce;
// Deep clone utility
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => (0, exports.deepClone)(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = (0, exports.deepClone)(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
};
exports.deepClone = deepClone;
