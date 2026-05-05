import App from "./app.js";
import "@/app/reset.css";
import "@/app/globals.css";

const $app = document.getElementById("App");

const app = new App({ $app });