(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS } = FuncJump;

  class ControlsScene extends Phaser.Scene {
    constructor() {
      super("ControlsScene");
    }

    create() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(false);
        FuncJump.UI.setError("");
      }

      this.add.text(centerX, 60, "Controls", {
        fontSize: "32px",
        color: "#ffffff",
      }).setOrigin(0.5);

      const lines = [
        "Move: Left/Right or A/D",
        "Jump: Space",
        "Retry: R",
        "Stage Select: ESC",
        "",
        "Function Input:",
        "Type an equation like y = x or y*y = sin(x)",
        "Press Apply to rebuild the curve",
      ];

      this.add.text(centerX, 150, lines.join("\n"), {
        fontSize: "16px",
        color: "#8cc9ff",
        align: "center",
        lineSpacing: 8,
      }).setOrigin(0.5, 0);

      const back = this.add.text(40, HEIGHT - 30, "<- Back to Title", {
        fontSize: "14px",
        color: "#8cc9ff",
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

      back.on("pointerdown", () => this.scene.start("TitleScene"));
    }
  }

  FuncJump.ControlsScene = ControlsScene;
})();
