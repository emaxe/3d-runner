import './styles/main.css';
import { Game } from './core/Game.js';

/**
 * Bootstrap entry point
 */
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
