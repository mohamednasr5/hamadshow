/*========================================
  NASR LIVE - Simple Hash Router
  ========================================*/

const NasrRouter = (() => {
    'use strict';

    let routes = {};
    let currentRoute = null;

    function init() {
        window.addEventListener('hashchange', handleRouteChange);
        // Handle initial route
        handleRouteChange();
    }

    function register(path, handler) {
        routes[path] = handler;
    }

    function navigate(path) {
        window.location.hash = path;
    }

    function getCurrentPath() {
        return window.location.hash.replace('#', '') || '/';
    }

    function handleRouteChange() {
        const path = getCurrentPath();
        
        // Try exact match first
        if (routes[path]) {
            currentRoute = path;
            routes[path]();
            return;
        }

        // Try pattern matching (e.g., /live/category/:id)
        for (const routePath in routes) {
            const params = matchRoute(routePath, path);
            if (params) {
                currentRoute = routePath;
                routes[routePath](params);
                return;
            }
        }

        // Default route
        if (routes['/']) {
            routes['/']();
        }
    }

    function matchRoute(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const pathParts = actualPath.split('/');
        
        if (routeParts.length !== pathParts.length) return null;
        
        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    }

    function getParam(name) {
        const path = getCurrentPath();
        const parts = path.split('/');
        // Find the param in registered routes
        for (const routePath in routes) {
            const routeParts = routePath.split('/');
            if (routeParts.length === parts.length) {
                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i] === ':' + name) {
                        return parts[i];
                    }
                }
            }
        }
        return null;
    }

    return { init, register, navigate, getCurrentPath, getParam, handleRouteChange };
})();