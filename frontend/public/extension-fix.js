// Fix for browser extension errors (like translate extensions)
// This prevents extension errors from interfering with the application

(function() {
    // Prevent translation extension errors
    if (typeof window !== 'undefined') {
        // Override console.error to filter out extension-related errors
        const originalError = console.error;
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Filter out known extension errors
            if (message.includes('translate-page') || 
                message.includes('Cannot find menu item') ||
                message.includes('content-all.js')) {
                return; // Silently ignore these errors
            }
            
            // Log other errors normally
            originalError.apply(console, args);
        };
        
        // Handle unhandled promise rejections from extensions
        window.addEventListener('unhandledrejection', function(event) {
            const message = event.reason?.message || event.reason || '';
            
            if (typeof message === 'string' && 
                (message.includes('translate-page') || 
                 message.includes('Cannot find menu item') ||
                 message.includes('content-all.js') ||
                 message.includes('y (content-all.js'))) {
                event.preventDefault(); // Prevent the error from showing
            }
        });

        // Additional protection for extension errors
        window.addEventListener('error', function(event) {
            const message = event.message || '';
            
            if (message.includes('translate-page') || 
                message.includes('Cannot find menu item') ||
                message.includes('content-all.js')) {
                event.preventDefault();
                return false;
            }
        });
    }
})();