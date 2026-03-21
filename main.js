(() => {
  const FuncJump = window.FuncJump;
  const {
    WIDTH,
    HEIGHT,
    COLORS,
    TitleScene,
    StageSelectScene,
    ControlsScene,
    RulesScene,
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
    scene: [TitleScene, StageSelectScene, ControlsScene, RulesScene, GameScene],
  };

  new Phaser.Game(config);
})();
