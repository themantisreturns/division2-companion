# Division 2 Companion v2.0.0

## Installable application

The site now includes a web app manifest, application icons, and an install prompt supported by compatible browsers. Installed copies open in a standalone window and remain tied to the existing GitHub Pages deployment.

## Offline support

A service worker caches the application shell and previously loaded static resources. Catalog and vendor data use a network-first strategy so current information remains preferred, with cached data available when the network is unavailable.

Cloud authentication, profile saves, and fresh vendor downloads still require an internet connection.

## Update handling

When a new deployment is detected, the application displays an Update ready notice. Selecting Reload activates the new service worker and refreshes the app.

## Network status

The app displays a persistent offline notice when connectivity is lost and confirms when the connection returns.
