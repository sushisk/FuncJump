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

  const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: "game",
    backgroundColor: COLORS.bg,
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
