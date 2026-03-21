(() => {
  const FuncJump = (window.FuncJump = window.FuncJump || {});

  FuncJump.STAGES = [
    {
      name: "Stage 1",
      start: { x: 120, y: 420 },
      goal: { x: 840, y: 170 },
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform(260, 430, 180, 20);
        platform(520, 350, 200, 20);
        platform(760, 270, 180, 20);
      },
    },
    {
      name: "Stage 2",
      start: { x: 140, y: 420 },
      goal: { x: 820, y: 100 },
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform(180, 140, 120, 20);
        platform(480, 180, 120, 20);
        platform(780, 140, 120, 20);
      },
    },
    {
      name: "Stage 3",
      start: { x: 120, y: 340 },
      goal: { x: 840, y: 220 },
      build: (platform) => {
        platform.reset(480, 500, 960, 40);
        platform(180, 360, 160, 20);
        platform.reset(420, 280, 20, 160);
        platform(640, 360, 160, 20);
      },
    },
    {
      name: "Stage 4",
      start: { x: 120, y: 420 },
      goal: { x: 780, y: 140 },
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform.reset(780, 200, 150, 20);
      },
    },
    {
      name: "Stage 5",
      start: { x: 120, y: 480 },
      goal: { x: 880, y: 200 },
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform.reset(220, 380, 20, 200);
        platform.reset(360, 180, 20, 340);
        platform.reset(500, 380, 20, 200);
        platform.reset(640, 180, 20, 340);
        platform.reset(780, 380, 20, 200);
      },
    },
  ];
})();
