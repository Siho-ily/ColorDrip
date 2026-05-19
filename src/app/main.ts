import App from "./app";
import "@/app/reset.css";
import "@/app/globals.css";

import { initShortcuts } from "@/lib/shortcuts";

const $app = document.getElementById("App") as HTMLElement;

initShortcuts();

new App({ $app });
