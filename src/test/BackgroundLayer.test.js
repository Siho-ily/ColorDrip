import '@/app/reset.css';
import '@/app/globals.css';
import BackgroundLayer from '@/components/BackgroundLayer/BackgroundLayer.js';

const $app = document.getElementById('App');
const bg = new BackgroundLayer({ $target: $app });
bg.setState({});

// Controls
const $panel = document.createElement('div');
$panel.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3';
document.body.appendChild($panel);

const $status = document.createElement('p');
$status.className = 'text-sm bg-black/40 text-white/80 backdrop-blur-sm px-3 py-1 rounded-full';
$status.textContent = 'light mode';
$panel.appendChild($status);

const $btn = document.createElement('button');
$btn.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-black/50 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors cursor-pointer';
$btn.textContent = 'dark / light 토글';
$btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    $status.textContent = isDark ? 'dark mode' : 'light mode';
});
$panel.appendChild($btn);
