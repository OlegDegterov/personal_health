// Copies the single-file build + launcher into dist/tablet/ for copying to the tablet desktop.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("dist/tablet", { recursive: true });
copyFileSync("dist/index.html", "dist/tablet/garmin-dashboard.html");
copyFileSync("scripts/start-dashboard.bat", "dist/tablet/start-dashboard.bat");
console.log("tablet files: dist/tablet/garmin-dashboard.html, dist/tablet/start-dashboard.bat");
