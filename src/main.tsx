import {createRoot} from 'react-dom/client';
import App from './App';
import './journal.js';
import './macro.css';
import './puppy-theme.css';
import './studio.css';
const themeButton=document.querySelector<HTMLButtonElement>('#theme')!;
function applyTheme(value:string){
  document.documentElement.dataset.theme=value;
  const dark=value==='dark';
  themeButton.textContent=dark?'☀':'☾';
  themeButton.setAttribute('aria-label',dark?'Bật chế độ sáng':'Bật chế độ tối');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#233636':'#9ed1cd');
}
const theme=()=>localStorage.getItem('macroday.theme')??(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
applyTheme(theme());
themeButton.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('macroday.theme',next);applyTheme(next)};
window.addEventListener('storage',e=>{if(e.key==='macroday.theme')applyTheme(theme())});
createRoot(document.getElementById('macro-root')!).render(<App/>);
