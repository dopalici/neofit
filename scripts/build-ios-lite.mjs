#!/usr/bin/env node
/**
 * Build a featherweight, rapid-boot production bundle specifically optimized for iOS
 * (iPhone XS through iPhone 13 mini & iPhone 16).
 *
 * What it does:
 *   1. Runs `react-app-rewired build` with GENERATE_SOURCEMAP=false (saves ~7 MB).
 *   2. Removes heavy desktop-only 3D assets (50 MB .fbx animations + 5.5 MB .glb)
 *      from build/ so Capacitor never packs 55+ MB of dead weight into the iOS .ipa.
 *   3. Prints the exact final iOS web bundle size ready for `npx cap sync ios`.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(PROJECT_ROOT, "build");

function dirSizeBytes(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSizeBytes(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function main() {
  console.log("Building lightweight production bundle for iOS (source maps disabled)...");
  execSync("npx react-app-rewired build", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      CI: "true",
      GENERATE_SOURCEMAP: "false",
    },
  });

  // Strip heavy desktop 3D assets from the iOS bundle (on-demand 3D stays available on web)
  const heavyDirs = [
    path.join(BUILD_DIR, "animations"),
    path.join(BUILD_DIR, "models"),
  ];
  let removedBytes = 0;
  for (const dir of heavyDirs) {
    if (fs.existsSync(dir)) {
      removedBytes += dirSizeBytes(dir);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  const finalMb = (dirSizeBytes(BUILD_DIR) / (1024 * 1024)).toFixed(2);
  const savedMb = (removedBytes / (1024 * 1024)).toFixed(2);
  console.log(
    `\niOS Lite bundle ready in build/ (${finalMb} MB total — stripped ${savedMb} MB of heavy 3D assets + source maps).`
  );
  console.log("Next step on your Mac: npx cap sync ios && npx cap open ios");
}

main();
