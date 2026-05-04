export const App = ($target) => {
    const $app = document.createElement("div");
    $app.textContent = "Hello World";
    $target.appendChild($app);
};