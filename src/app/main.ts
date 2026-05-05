import App from "./app";
import "@/app/reset.css";
import "@/app/globals.css";

const $app = document.getElementById("App") as HTMLElement;
new App({ $app });
