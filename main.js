(() => {
  const FuncJump = window.FuncJump;
  const {
    WIDTH,
    HEIGHT,
    COLORS,
    ClickStartScene,
    TitleScene,
    StageSelectScene,
    RulesScene,
    CreditsScene,
    GameScene,
  } = FuncJump;

  const applyViewportFit = () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const barHeight = parseInt(rootStyle.getPropertyValue("--bar-height"), 10) || 64;
    const maxWidth = parseInt(rootStyle.getPropertyValue("--game-max-width"), 10) || WIDTH;
    const maxHeight = parseInt(rootStyle.getPropertyValue("--game-max-height"), 10) || HEIGHT;
    const availWidth = Math.max(320, window.innerWidth);
    const availHeight = Math.max(240, window.innerHeight - barHeight);

    const scale = Math.min(availWidth / WIDTH, availHeight / HEIGHT, maxWidth / WIDTH, maxHeight / HEIGHT);
    const viewWidth = Math.floor(WIDTH * scale);
    const viewHeight = Math.floor(HEIGHT * scale);

    document.documentElement.style.setProperty("--game-width", `${viewWidth}px`);
    document.documentElement.style.setProperty("--game-height", `${viewHeight}px`);
  };

  applyViewportFit();

  const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: "game",
    backgroundColor: COLORS.bg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
    },
    physics: {
      default: "matter",
      matter: {
        gravity: { y: 1 },
        debug: false,
      },
    },
    scene: [ClickStartScene, TitleScene, StageSelectScene, RulesScene, CreditsScene, GameScene],
  };

  new Phaser.Game(config);
})();
