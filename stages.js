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
      start: { x: 200, y: 340 },
      goal: { x: 840, y: 220 },
      build: (platform) => {
        platform.reset(480, 500, 960, 40);
        platform(240, 360, 160, 20);
        platform.reset(480, 280, 20, 160);
        platform(720, 360, 160, 20);
      },
    },
    {
      name: "Stage 4",
      start: { x: 120, y: 420 },
      goal: { x: 780, y: 140 },
      checkpoints: [
        { x: 520, y: 420 },
        { x: 750, y: 170 },
      ],
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform.reset(750, 200, 210, 20);
      },
    },
    {
      name: "Stage 5",
      start: { x: 80, y: 460 },
      goal: { x: 880, y: 200 },
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform.reset(190, 380, 20, 200);
        platform.reset(330, 180, 20, 340);
        platform.reset(480, 380, 20, 200);
        platform.reset(630, 180, 20, 340);
        platform.reset(780, 380, 20, 200);
      },
    },
    {
      name: "Stage 6",
      start: { x: 120, y: 420 },
      goal: { x: 840, y: 170 },
      checkpoints: [
        { x: 260, y: 380 },
        { x: 520, y: 300 },
      ],
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform(260, 430, 180, 20);
        platform(520, 350, 200, 20);
        platform(760, 270, 180, 20);
      },
    },
    {
      name: "Stage 7",
      start: { x: 120, y: 420 },
      goal: { x: 780, y: 170 },
      checkpoints: [
        { x: 180, y: 170 },
        { x: 780, y: 420 },
      ],
      build: (platform) => {
        platform(480, 500, 960, 40);
        platform(260, 430, 180, 20);
        platform(520, 350, 200, 20);
        platform(760, 270, 180, 20);
      },
    },
  ];
})();
