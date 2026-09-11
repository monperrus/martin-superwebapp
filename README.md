# Martin's Super Webapp

A mobile-first PWA that you build with itself — use the Build tab to add tabs, menus, and features powered by AI.

Use **Paste** in the Build header to replace an existing tab with a complete pasted HTML document. The replacement is saved in Version History and runs sandboxed.

**Live demo:** https://monperrus.github.io/martin-superwebapp/

## PWA support

Ships with a web app manifest and service worker, so it can be installed as a Progressive Web App and reopened offline after the core assets have been cached once.

## Import a PWA

Use **Import** in the Build header to inspect and snapshot a public HTTPS PWA URL as an editable tab. The importer captures the entry HTML and its CORS-readable, same-origin static resources (scripts, styles, images, fonts, media, and static module dependencies), then serves the snapshot offline through this app's service worker. The imported code is sandboxed and cannot access this app's local storage, API key, GitHub token, or DOM.

The source site must allow browser CORS requests. Server-side code, authenticated data, dynamic resource URLs, and the source app's existing browser storage cannot be copied; skipped or remote dependencies are reported before import. Imported snapshots can be edited through Build's tab-file tools and restored through Version History.

## Share a tab

Use the **Share** button in the bottom navigation and choose a share type. **Gist** publishes the selected tab as a public GitHub Gist, then lets you copy or use the native share sheet for the generated link. **GitHub** commits the selected current version to `monperrus/mws_apps`. **PWA** sharing is not implemented yet. Publishing needs a GitHub fine-grained personal access token with **Gists: read and write** permission; GitHub commits need **Contents: read and write** access. The token is stored only in the browser's local storage so the field can be prefilled for future publishes.

A shared link has a base64url-encoded `tab` query parameter that points to the public tab-document URL returned by GitHub. The document contains the publishing installation's globally unique `appId` and a version map (`"1"`, `"2"`, and so on), so additional tab versions can be added to the same Gist. Each version repeats `appId` for consistency checks and contains the tab plus the local-history metadata (`currentHash`, `previousHash`, and `prompt`) and its ISO-8601 `publishedAt` timestamp. After a first publish, the app records the returned URL as `tab.server.url = { type: "gist", value: "https://…" }`; later shares append the next version to that same Gist. Opening a link imports the highest numbered version after confirmation. Older documents without `publishedAt` and `appId` remain supported; they gain a global `appId` when next published.

Imported tabs are sandboxed because they contain third-party HTML; consequently, they cannot access the app's local storage.

## Commit a history version

Every entry in **Version History** has a **Commit** button. It commits that version's HTML over HTTPS to the private `monperrus/mws_apps` repository at `<appId>/<tab-id>.html`, creating the app folder or updating the existing tab file. The commit records the version's timestamp, prompt, hash, and app ID in its message. This uses the GitHub token saved through the Share panel; the token needs access to the repository with **Contents: read and write** permission.
