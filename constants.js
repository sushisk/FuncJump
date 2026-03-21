(() => {
  const FuncJump = (window.FuncJump = window.FuncJump || {});

  FuncJump.WIDTH = 960;
  FuncJump.HEIGHT = 540;
  FuncJump.GRID_SIZE = 60;
  FuncJump.PLATFORM_THICKNESS = 15;
  FuncJump.PLATFORM_THICKNESS_MAX = 100;
  FuncJump.FUNC_DRAW_EXTENT = 3;
  FuncJump.WALL_THICKNESS = 24;
  FuncJump.FUNC_MARCH_STEP = 4;
  FuncJump.RENDER_LIMIT_TIME = 3000;
  FuncJump.APPLY_COOLDOWN_MS = 400;
  FuncJump.SE_VOLUME = 0.7;
  FuncJump.BGM_VOLUME = 0.7;

  FuncJump.COLORS = {
    bg: 0x0a1b3d,
    panel: 0x0f2a5c,
    blue: 0x4ea3ff,
    blueSoft: 0x8cc9ff,
    white: 0xffffff,
  };
})();
