# BUILD & DEPLOYMENT PIPELINE AUDIT

## 1. Build Architecture
* **Frontend**: Built via `vite build` targeting `dist/` with ES2020 bundle optimization and CSS minification.
* **Backend**: Bundled via `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.
* **Production Start**: Directly boots via `node dist/server.cjs` binding to `0.0.0.0:3000`.

## 2. Integrity Verification
* Single atomic build command (`npm run build`) generates both static frontend and compiled CommonJS backend bundle cleanly.
* Build artifacts in `dist/` are isolated from source control and temporary developer files.
