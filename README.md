# Martin's Super Webapp

A mobile-first PWA that you build with itself — use the Build tab to add tabs, menus, and features powered by AI.

**Live demo:** https://monperrus.github.io/martin-superwebapp/

## PWA support

Ships with a web app manifest and service worker, so it can be installed as a Progressive Web App and reopened offline after the core assets have been cached once.

## Share a tab

Use the **Share** button in the bottom navigation to publish the selected tab as a public GitHub Gist, then copy or use the native share sheet for the generated link. Publishing needs a GitHub fine-grained personal access token with **Gists: read and write** permission. The token is stored only in the browser's local storage so the field can be prefilled for future publishes.

A shared link has a base64url-encoded `tab` query parameter that points to the public tab-document URL returned by GitHub. The document is a version map (`"1"`, `"2"`, and so on), so additional tab versions can be added to the same Gist. Each version contains the tab plus the local-history metadata: `currentHash`, `previousHash`, and `prompt`. After a first publish, the app records the returned URL as `tab.server.url = { type: "gist", value: "https://…" }`; later shares append the next version to that same Gist. Opening a link imports the highest numbered version after confirmation.

Imported tabs are sandboxed because they contain third-party HTML; consequently, they cannot access the app's local storage.
