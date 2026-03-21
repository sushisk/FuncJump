(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS } = FuncJump;

  class CreditsScene extends Phaser.Scene {
    constructor() {
      super("CreditsScene");
    }

    create() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(false);
        FuncJump.UI.setError("");
      }

      this.add.text(centerX, 60, "Credits", {
        fontSize: "32px",
        color: "#ffffff",
      }).setOrigin(0.5);

      const lines = [
        'BGM : "PuzzliNg" by Cloria Sound Labs',
        'Others : sushisk'
      ];

      this.add.text(centerX, 150, lines.join("\n"), {
        fontSize: "20px",
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

  FuncJump.CreditsScene = CreditsScene;
})();
