(() => {
  const FuncJump = (window.FuncJump = window.FuncJump || {});

  const UI = {
    initialized: false,
    onApply: null,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.bar = document.getElementById("function-bar");
      this.input = document.getElementById("function-input");
      this.applyButton = document.getElementById("apply-function");
      this.error = document.getElementById("function-error");

      if (!this.bar || !this.input || !this.applyButton || !this.error) {
        return;
      }

      this.applyButton.addEventListener("click", () => {
        if (this.onApply) this.onApply(this.input.value);
      });


      this.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (this.onApply) this.onApply(this.input.value);
        }
      });
    },

    showFunctionBar(visible) {
      if (!this.bar) return;
      if (visible) {
        this.bar.classList.add("is-visible");
      } else {
        this.bar.classList.remove("is-visible");
      }
    },

    setHandlers({ onApply }) {
      this.onApply = onApply || null;
    },

    setText(text) {
      if (this.input) this.input.value = text;
    },

    setError(message) {
      if (!this.error) return;
      if (message) {
        this.error.textContent = message;
        this.error.classList.add("is-visible");
      } else {
        this.error.textContent = "";
        this.error.classList.remove("is-visible");
      }
    },
  };

  FuncJump.UI = UI;
})();
