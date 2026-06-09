import './style.css';
import { mountHiringApp } from './app';

const app = document.getElementById('app');
if (app) {
  mountHiringApp(app);
}
