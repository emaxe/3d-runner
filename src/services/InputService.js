/**
 * InputService - Unified controller handling Keyboard, Touch Gestures, and Virtual Buttons.
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

  initTouchSwipes() {
    window.addEventListener('touchstart', (e) => {
      if (!this.enabled || !e.touches || e.touches.length === 0) return;
      // Do not trigger swipe on modal interaction
      if (e.target.closest('button, input, .glass-modal, #shop-modal, #achievements-modal, #quests-modal, #settings-modal, #tutorial-modal')) {
        return;
      }

      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!this.enabled || !e.changedTouches || e.changedTouches.length === 0) return;
      if (e.target.closest('button, input, .glass-modal, #shop-modal, #achievements-modal, #quests-modal, #settings-modal, #tutorial-modal')) {
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const elapsed = performance.now() - this.touchStartTime;

      if (elapsed > 600) return; // ignore long drag

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > 30 && absX > absY) {
        if (dx > 0) {
          this.handlers.onMoveRight();
        } else {
          this.handlers.onMoveLeft();
        }
      } else if (absY > 30) {
        if (dy < 0) {
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
