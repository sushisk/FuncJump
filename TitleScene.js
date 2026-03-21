(() => {
  const FuncJump = window.FuncJump;
  const { WIDTH, HEIGHT, COLORS,BGM_VOLUME } = FuncJump;

  class TitleScene extends Phaser.Scene {
    constructor() {
      super("TitleScene");
    }

    preload() {
      this.load.audio("bgm", "./sound/PuzzliNg.mp3");
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

      this.add.text(centerX, HEIGHT - 40, "Controls: Left/Right or A/D  Jump: Space", {
        fontSize: "14px",
        color: "#8cc9ff",
      }).setOrigin(0.5);
    }
  }

  FuncJump.TitleScene = TitleScene;
})();
