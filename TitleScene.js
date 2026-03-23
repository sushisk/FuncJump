(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS,BGM_VOLUME } = FuncJump;

  class TitleScene extends Phaser.Scene {
    constructor() {
      super("TitleScene");
    }

    preload() {
      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;

      const loadingText = this.add.text(centerX, centerY - 20, "Loading...", {
        fontSize: "22px",
        color: "#8cc9ff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      const progressText = this.add.text(centerX, centerY + 16, "0%", {
        fontSize: "14px",
        color: "#ffffff",
      }).setOrigin(0.5);

      this.load.on("progress", (value) => {
        const percent = Math.floor(value * 100);
        progressText.setText(`${percent}%`);
      });

      this.load.on("complete", () => {
        loadingText.destroy();
        progressText.destroy();
      });

      this.load.audio("bgm", "./sound/PuzzliNg.mp3");
      this.load.audio("clear", "./sound/clear.mp3");
      this.load.audio("failed", "./sound/failed.mp3");
      this.load.audio("checkpoint", "./sound/checkpoint.mp3");
      this.load.audio("function-apply", "./sound/function-apply.mp3");
    }

    create() { 
      if (!this.game.bgm) {
        this.game.bgm = this.sound.add('bgm', { loop: true, volume: BGM_VOLUME });
        this.game.bgm.play();
      }

      this.cameras.main.setBackgroundColor(COLORS.bg);
      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(false);
        FuncJump.UI.setError("");
      }

      this.add.text(centerX, centerY - 130, "FuncJump", {
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      this.add.text(centerX, centerY - 90, "Mathematical Function Pazzle", {
        fontSize: "18px",
        color: "#8cc9ff",
      }).setOrigin(0.5);

      const makeButton = (y, text, target) => {
        const box = this.add
          .rectangle(centerX, y, 240, 46, COLORS.panel)
          .setStrokeStyle(2, COLORS.blue);
        const label = this.add.text(centerX, y, text, {
          fontSize: "18px",
          color: "#ffffff",
        }).setOrigin(0.5);
        const go = () => this.scene.start(target);
        box.setInteractive({ useHandCursor: true }).on("pointerdown", go);
        label.setInteractive({ useHandCursor: true }).on("pointerdown", go);
      };

      makeButton(centerY, "Stage Select", "StageSelectScene");
      makeButton(centerY + 60, "Rules", "RulesScene");
      makeButton(centerY + 120, "Credits", "CreditsScene");

      this.add.text(centerX, HEIGHT - 40, "Controls: Left/Right or A/D  Jump: Z", {
        fontSize: "14px",
        color: "#8cc9ff",
      }).setOrigin(0.5);
    }
  }

  FuncJump.TitleScene = TitleScene;
})();
