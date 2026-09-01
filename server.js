It looks like we don't have access to your repo, but we'll try to clone it anyway.
==> Cloning from https://github.com/multiprime/loup-garou-v7
==> Checking out commit fa53ef60df80a65079d4f6f2457b0072f30a7393 in branch main
==> Using Node.js version 24.14.1 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
added 91 packages, and audited 92 packages in 3s
16 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 1.3s. Compression took 0.1s
==> Build successful 🎉
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
==> Running 'npm start'
> loup-garou-v7@7.0.0 start
> node server.js
/opt/render/project/src/server.js:7
const socket = io();
               ^
ReferenceError: io is not defined
    at Object.<anonymous> (/opt/render/project/src/server.js:7:16)
    at Module._compile (node:internal/modules/cjs/loader:1812:14)
    at Object..js (node:internal/modules/cjs/loader:1943:10)
    at Module.load (node:internal/modules/cjs/loader:1533:32)
    at Module._load (node:internal/modules/cjs/loader:1335:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47
Node.js v24.14.1
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> loup-garou-v7@7.0.0 start
> node server.js
/opt/render/project/src/server.js:7
const socket = io();
               ^
