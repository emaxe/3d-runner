/**
 * InputService - Unified controller handling Keyboard, Touch Gestures, and Virtual Buttons.
 *
 * Мобильные жесты:
 *  - Свайп влево/вправо — смена полосы.
 *  - Свайп вверх/вниз — прыжок/подкат (инвертируется при беге по потолку).
 *  - Двойной тап по экрану — смена гравитации.
 *  - Долгое нажатие (без движения) — буст (нитро).
 */
export class InputService {
  constructor() {
    this.handlers = {
      onMoveLeft: () => {},
      onMoveRight: () => {},
      onJumpStart: () => {},
      onJumpEnd: () => {},
      onSlide: () => {},
      onGravityFlip: () => {},
      onNitro: () => {},
      onPauseToggle: () => {}
    };

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.longPressTimer = null;
    this.longPressFired = false;
    this.lastTapTime = 0;
    this.lastTapX = 0;
    this.lastTapY = 0;
    this.onCeiling = false; // true, когда игрок бежит по потолку
    this.enabled = true;

    this.initKeyboard();
    this.initTouchSwipes();
  }

  setHandlers(callbacks) {
    this.handlers = { ...this.handlers, ...callbacks };
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  /** Сообщает сервису, бежит ли игрок по потолку (для инверсии свайпов). */
  setOnCeiling(val) {
    this.onCeiling = !!val;
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled || e.repeat) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.handlers.onMoveLeft();
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.handlers.onMoveRight();
          break;

        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          this.handlers.onJumpStart();
          break;

        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          this.handlers.onSlide();
          break;

        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyG':
          this.handlers.onGravityFlip();
          break;

        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyF':
          this.handlers.onNitro();
          break;

        case 'Escape':
        case 'KeyP':
          this.handlers.onPauseToggle();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.enabled) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.handlers.onJumpEnd();
      }
    });
  }

  /** true, если касание пришлось на интерактивный элемент (кнопки/модалки). */
  isInteractiveTarget(target) {
    return !!target.closest('button, input, .glass-modal, #shop-modal, #achievements-modal, #quests-modal, #settings-modal, #tutorial-modal');
  }

  initTouchSwipes() {
    window.addEventListener('touchstart', (e) => {
      if (!this.enabled || !e.touches || e.touches.length === 0) return;
      // Не обрабатываем касания по кнопкам/модалкам
      if (this.isInteractiveTarget(e.target)) return;

      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
      this.touchMoved = false;
      this.longPressFired = false;

      // Долгое нажатие → буст (нитро). Срабатывает, если палец не двигался.
      clearTimeout(this.longPressTimer);
      this.longPressTimer = setTimeout(() => {
        if (!this.touchMoved && !this.longPressFired) {
          this.longPressFired = true;
          this.handlers.onNitro();
        }
      }, 450);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.enabled || !e.touches || e.touches.length === 0) return;
      if (this.isInteractiveTarget(e.target)) return;

      const touch = e.touches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      // Любое заметное движение отменяет долгое нажатие (это свайп/тап)
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        this.touchMoved = true;
        clearTimeout(this.longPressTimer);
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!this.enabled || !e.changedTouches || e.changedTouches.length === 0) return;
      if (this.isInteractiveTarget(e.target)) return;

      clearTimeout(this.longPressTimer);

      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const elapsed = performance.now() - this.touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Быстрый тап без движения → проверка двойного тапа (смена гравитации)
      if (elapsed < 250 && absX < 12 && absY < 12) {
        const now = performance.now();
        const isDoubleTap =
          now - this.lastTapTime < 300 &&
          Math.abs(touch.clientX - this.lastTapX) < 40 &&
          Math.abs(touch.clientY - this.lastTapY) < 40;

        if (isDoubleTap) {
          this.lastTapTime = 0;
          this.handlers.onGravityFlip();
        } else {
          this.lastTapTime = now;
          this.lastTapX = touch.clientX;
          this.lastTapY = touch.clientY;
        }
        return;
      }

      // Свайп
      if (elapsed > 600) return; // ignore long drag

      if (absX > 30 && absX > absY) {
        if (dx > 0) {
          this.handlers.onMoveRight();
        } else {
          this.handlers.onMoveLeft();
        }
      } else if (absY > 30) {
        // Инверсия при беге по потолку: "вверх" по экрану = вниз по миру
        const swipeUp = dy < 0;
        const jump = this.onCeiling ? !swipeUp : swipeUp;
        if (jump) {
          this.handlers.onJumpStart();
          setTimeout(() => this.handlers.onJumpEnd(), 150);
        } else {
          this.handlers.onSlide();
        }
      }
    }, { passive: true });
  }

  bindVirtualButtons(elements) {
    if (!elements) return;

    if (elements.jump) {
      elements.jump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlers.onJumpStart();
      });
      elements.jump.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handlers.onJumpEnd();
      });
    }

    if (elements.slide) {
      elements.slide.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlers.onSlide();
      });
    }

    if (elements.gravity) {
      elements.gravity.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlers.onGravityFlip();
      });
    }

    if (elements.nitro) {
      elements.nitro.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlers.onNitro();
      });
    }
  }
}
