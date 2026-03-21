(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS, STAGES } = FuncJump;

  class StageSelectScene extends Phaser.Scene {
    constructor() {
      super("StageSelectScene");
    }

    create() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(false);
        FuncJump.UI.setError("");
      }

      this.add.text(centerX, 60, "Stage Select", {
        fontSize: "32px",
        color: "#ffffff",
      }).setOrigin(0.5);

      STAGES.forEach((stage, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = centerX + (col - 1) * 220;
        const y = 140 + row * 140;

        const panel = this.add
          .rectangle(x, y, 180, 80, COLORS.panel)
          .setStrokeStyle(2, COLORS.blueSoft);
        const label = this.add.text(x, y - 8, stage.name, {
          fontSize: "18px",
          color: "#ffffff",
        }).setOrigin(0.5);
        const sub = this.add.text(x, y + 18, "START", {
          fontSize: "12px",
          color: "#8cc9ff",
        }).setOrigin(0.5);

        const startStage = () => this.scene.start("GameScene", { stageIndex: index });

        panel.setInteractive({ useHandCursor: true }).on("pointerdown", startStage);
        label.setInteractive({ useHandCursor: true }).on("pointerdown", startStage);
        sub.setInteractive({ useHandCursor: true }).on("pointerdown", startStage);
      });

      const back = this.add
        .text(40, HEIGHT - 30, "<- Back to Title", {
          fontSize: "14px",
          color: "#8cc9ff",
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      back.on("pointerdown", () => this.scene.start("TitleScene"));
    }
  }

  FuncJump.StageSelectScene = StageSelectScene;
})();
