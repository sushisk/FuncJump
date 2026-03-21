(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS } = FuncJump;

  class ClickStartScene extends Phaser.Scene {
    constructor() {
      super("ClickStartScene");
    }

    create() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(false);
        FuncJump.UI.setError("");
      }

      this.add.text(centerX, centerY - 20, "Click to Start", {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      this.input.once("pointerdown", () => {
        this.scene.start("TitleScene");
      });
    }
  }

  FuncJump.ClickStartScene = ClickStartScene;
})();
