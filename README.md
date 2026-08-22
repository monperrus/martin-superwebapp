# Martin's Super Webapp

A mobile-first PWA that you build with itself — use the Build tab to add tabs, menus, and features powered by AI.

**Live demo:** https://monperrus.github.io/martin-superwebapp/

## PWA support

Ships with a web app manifest and service worker, so it can be installed as a Progressive Web App and reopened offline after the core assets have been cached once.

## Share a tab

Use the **Share** button in the bottom navigation to publish the selected tab as a public GitHub Gist, then copy or use the native share sheet for the generated link. Publishing needs a GitHub fine-grained personal access token with **Gists: read and write** permission; the token is used for that request only and is not stored.

A shared link has a base64url-encoded `tab` query parameter that points to the public tab-document URL returned by GitHub. Opening it imports the tab after confirmation.

Imported tabs are sandboxed because they contain third-party HTML; consequently, they cannot access the app's local storage.
