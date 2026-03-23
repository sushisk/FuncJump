(() => {
  const FuncJump = window.FuncJump;
  const {
    WIDTH,
    HEIGHT,
    COLORS,
    STAGES,
    GRID_SIZE,
    PLATFORM_THICKNESS,
    PLATFORM_THICKNESS_MAX,
    FUNC_DRAW_EXTENT,
    FUNC_MARCH_STEP,
    RENDER_LIMIT_TIME,
    APPLY_COOLDOWN_MS,
    SE_VOLUME,
  } = FuncJump;

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
    }

    init(data) {
      this.stageIndex = data.stageIndex ?? 0;
    }

    create() {
      this.cameras.main.setBackgroundColor(COLORS.bg);

      const stage = STAGES[this.stageIndex];
      this.origin = { x: WIDTH / 2, y: HEIGHT / 2 };
      this.functionDrawBounds = {
        halfWidth: (WIDTH / 2) * FUNC_DRAW_EXTENT,
        halfHeight: (HEIGHT / 2) * FUNC_DRAW_EXTENT,
      };

      this.drawAxes();

      this.basePlatforms = [];
      this.customPlatforms = [];
      this.functionGraphics = null;
      this.lastFunctionPoint = null;
      this.currentFunction = null;
      this.groundPairs = new Set();
      this.lastApplyAt = 0;
      this.checkpoints = [];
      this.checkpointByBody = new Map();
      this.goalUnlocked = false;

      this.matter.world.setBounds(0, 0, WIDTH, HEIGHT);

      const addBasePlatform = (x, y, width, height) => {
        const rect = this.add
          .rectangle(x, y, width, height, COLORS.blue)
          .setStrokeStyle(2, COLORS.blueSoft);
        this.matter.add.gameObject(rect, {
          isStatic: true,
          label: "platform",
        });
        this.basePlatforms.push(rect);
      };
      addBasePlatform.reset = (x, y, width, height) => {
        const rect = this.add
          .rectangle(x, y, width, height, COLORS.panel)
          .setStrokeStyle(2, COLORS.white);
        this.matter.add.gameObject(rect, {
          isStatic: true,
          label: "reset-platform",
        });
        this.basePlatforms.push(rect);
      };

      stage.build(addBasePlatform, this);

      this.player = this.add
        .rectangle(stage.start.x, stage.start.y, 30, 40, COLORS.white)
        .setStrokeStyle(2, COLORS.blueSoft);
      this.matter.add.gameObject(this.player, {
        label: "player",
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0.02,
        restitution: 0,
      });
      this.player.setFixedRotation();

      this.goal = this.add
        .rectangle(stage.goal.x, stage.goal.y, 36, 36, COLORS.blueSoft)
        .setStrokeStyle(3, COLORS.white);
      this.matter.add.gameObject(this.goal, {
        isStatic: true,
        isSensor: true,
        label: "goal",
      });

      this.createCheckpoints(stage);
      this.updateGoalState();

      this.setupCollisionEvents();

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.mobileInput = { left: false, right: false, jumpRequested: false };
      this.pointerZones = new Map();

      if (FuncJump.IS_MOBILE) {
        this.input.on("pointerdown", (pointer) => {
          const zone = this.getPointerZone(pointer.x);
          this.pointerZones.set(pointer.id, zone);
          if (zone === "center") {
            this.mobileInput.jumpRequested = true;
          }
          this.updateMobileDirections();
        });

        this.input.on("pointerup", (pointer) => {
          this.pointerZones.delete(pointer.id);
          this.updateMobileDirections();
        });

        this.input.on("pointercancel", (pointer) => {
          this.pointerZones.delete(pointer.id);
          this.updateMobileDirections();
        });
      }

      this.isCleared = false;
      this.coyoteFrames = 0;

      this.add.text(20, 16, stage.name, {
        fontSize: "18px",
        color: "#ffffff",
      }).setDepth(10);
      this.add.text(20, 38, "R: Retry  ESC: Stage Select", {
        fontSize: "12px",
        color: "#8cc9ff",
      }).setDepth(10);

      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("StageSelectScene");
      });

      if (FuncJump.UI) {
        FuncJump.UI.init();
        FuncJump.UI.showFunctionBar(true);
        FuncJump.UI.setError("");
        FuncJump.UI.setText("");
        FuncJump.UI.setHandlers({
          onApply: (text) => {
            this.resetPlayerToStart();
            this.resetCheckpoints();
            const result = this.applyFunctionInput(text, { timeLimitMs: RENDER_LIMIT_TIME });
            if (result === "ok") {
              this.playSfx("function-apply");
            } else if (result === "time-limit") {
              FuncJump.UI?.setError("Function too complex");
            }
          },
        });
      }
    }

    setupCollisionEvents() {
      this.matter.world.on("collisionstart", (event) => {
        event.pairs.forEach((pair) => {
          const { bodyA, bodyB } = pair;
          const playerBody = this.player.body;
          if (bodyA === playerBody || bodyB === playerBody) {
            const other = bodyA === playerBody ? bodyB : bodyA;
            const normalY = bodyA === playerBody ? pair.collision.normal.y : -pair.collision.normal.y;

            if (other.label === "checkpoint") {
              this.handleCheckpoint(other);
            }

            if (other.isSensor && other.label === "goal") {
              if (this.goalUnlocked) {
                this.handleClear();
              }
              return;
            }

            if (other.label === "reset-platform") {
              this.handleResetTrigger();
              this.playSfx("failed");
            }

            if (normalY < -0.5 && !other.isSensor) {
              this.groundPairs.add(pair.id);
            }
          }
        });
      });

      this.matter.world.on("collisionend", (event) => {
        event.pairs.forEach((pair) => {
          if (this.groundPairs.has(pair.id)) {
            this.groundPairs.delete(pair.id);
          }
        });
      });
    }

    isOnGround() {
      return this.groundPairs.size > 0;
    }

    createCheckpoints(stage) {
      this.checkpoints = [];
      this.checkpointByBody.clear();
      const list = stage.checkpoints || [];

      list.forEach((point, index) => {
        const rect = this.add
          .rectangle(point.x, point.y, 26, 26, COLORS.blueSoft)
          .setStrokeStyle(2, COLORS.white);
        this.matter.add.gameObject(rect, {
          isStatic: true,
          isSensor: true,
          label: "checkpoint",
        });
        rect.setData("checkpointIndex", index);

        const entry = { rect, passed: false };
        this.checkpoints.push(entry);
        if (rect.body) {
          this.checkpointByBody.set(rect.body, entry);
        }
      });
    }

    handleCheckpoint(body) {
      const entry = this.checkpointByBody.get(body);
      if (!entry || entry.passed) return;
      entry.passed = true;
      entry.rect.setFillStyle(COLORS.white);
      this.playSfx("checkpoint");
      this.updateGoalState();
    }

    resetCheckpoints() {
      this.checkpoints.forEach((entry) => {
        entry.passed = false;
        entry.rect.setFillStyle(COLORS.blueSoft);
      });
      this.updateGoalState();
    }

    updateGoalState() {
      const allPassed = this.checkpoints.length === 0 || this.checkpoints.every((c) => c.passed);
      this.goalUnlocked = allPassed;
      if (!this.goal) return;
      if (allPassed) {
        this.goal.setFillStyle(COLORS.blueSoft);
        this.goal.setAlpha(1);
      } else {
        this.goal.setFillStyle(COLORS.panel);
        this.goal.setAlpha(0.55);
      }
    }

    handleResetTrigger() {
      const now = this.time.now;
      if (now - this.lastApplyAt < APPLY_COOLDOWN_MS) return;
      this.lastApplyAt = now;

      const text = FuncJump.UI?.input ? FuncJump.UI.input.value : "";
      this.resetPlayerToStart();
      this.resetCheckpoints();
      this.applyFunctionInput(text);
    }

    drawAxes() {
      const graphics = this.add.graphics();
      const { x: ox, y: oy } = this.origin;
      const labelStyle = { fontSize: "11px", color: "#8cc9ff" };

      graphics.lineStyle(1, COLORS.blueSoft, 0.12);
      for (let x = ox + GRID_SIZE; x < WIDTH; x += GRID_SIZE) {
        graphics.lineBetween(x, 0, x, HEIGHT);
      }
      for (let x = ox - GRID_SIZE; x > 0; x -= GRID_SIZE) {
        graphics.lineBetween(x, 0, x, HEIGHT);
      }
      for (let y = oy + GRID_SIZE; y < HEIGHT; y += GRID_SIZE) {
        graphics.lineBetween(0, y, WIDTH, y);
      }
      for (let y = oy - GRID_SIZE; y > 0; y -= GRID_SIZE) {
        graphics.lineBetween(0, y, WIDTH, y);
      }

      graphics.lineStyle(2, COLORS.blueSoft, 0.5);
      graphics.lineBetween(ox, 0, ox, HEIGHT);
      graphics.lineBetween(0, oy, WIDTH, oy);

      graphics.fillStyle(COLORS.blueSoft, 0.7);
      graphics.fillCircle(ox, oy, 3);

      // Axis labels in grid units
      for (let x = ox; x < WIDTH; x += GRID_SIZE) {
        const value = Math.round((x - ox) / GRID_SIZE);
        this.add.text(x + 2, oy + 6, `${value}`, labelStyle).setDepth(2);
      }
      for (let x = ox - GRID_SIZE; x > 0; x -= GRID_SIZE) {
        const value = Math.round((x - ox) / GRID_SIZE);
        this.add.text(x + 2, oy + 6, `${value}`, labelStyle).setDepth(2);
      }
      for (let y = oy; y < HEIGHT; y += GRID_SIZE) {
        const value = Math.round((oy - y) / GRID_SIZE);
        if (value !== 0) {
          this.add.text(ox + 6, y + 2, `${value}`, labelStyle).setDepth(2);
        }
      }
      for (let y = oy - GRID_SIZE; y > 0; y -= GRID_SIZE) {
        const value = Math.round((oy - y) / GRID_SIZE);
        if (value !== 0) {
          this.add.text(ox + 6, y + 2, `${value}`, labelStyle).setDepth(2);
        }
      }

      graphics.setDepth(0);
    }

    applyFunctionInput(text, options = {}) {
      this.clearCustomPlatforms();

      if (!text || !text.trim()) {
        this.currentFunction = null;
        FuncJump.UI?.setError("");
        return "no-input";
      }

      const result = this.parseFunctionInput(text);
      if (!result) {
        this.currentFunction = null;
        FuncJump.UI?.setError("Use equations like y = x or y*y = sin(x)");
        return "invalid-input";
      }

      FuncJump.UI?.setError("");
      this.currentFunction = result.fn;
      const status = this.buildFunctionPlatforms(result, options.timeLimitMs);
      if (status === "time-limit") {
        this.invalidateFunctionRender();
        return "time-limit";
      }
      return "ok";
    }

    parseFunctionInput(text) {
      const trimmed = text.trim().toLowerCase();
      if (!trimmed) return null;

      const parts = trimmed.split("=");
      if (parts.length !== 2) return null;

      const left = parts[0].trim();
      const right = parts[1].trim();
      if (!left || !right) return null;

      const leftNormalized = this.normalizeExpression(left);
      const rightNormalized = this.normalizeExpression(right);
      if (!leftNormalized || !rightNormalized) return null;

      const normalized = `(${leftNormalized}) - (${rightNormalized})`;

      let fn;
      try {
        fn = new Function("x", "y", `return ${normalized};`);
      } catch (error) {
        return null;
      }

      return { fn, expression: trimmed };
    }

    normalizeExpression(expression) {
      let normalized = expression.toLowerCase();
      normalized = this.insertImplicitMultiplication(normalized);

      const allowedChars = /^[0-9a-z+\-*/^().,\s]*$/;
      if (!allowedChars.test(normalized)) return null;

      const identifiers = normalized.match(/[a-z_]+/g) || [];
      const allowedNames = new Set([
        "x",
        "y",
        "sin",
        "cos",
        "tan",
        "asin",
        "acos",
        "atan",
        "sinh",
        "cosh",
        "tanh",
        "log",
        "exp",
        "sqrt",
        "abs",
        "pow",
        "pi",
        "e",
      ]);

      for (const id of identifiers) {
        const lower = id.toLowerCase();
        if (!allowedNames.has(lower)) return null;
      }

      normalized = normalized.replace(/\^/g, "**");
      normalized = normalized.replace(/\bpi\b/gi, "Math.PI");
      normalized = normalized.replace(/\be\b/gi, "Math.E");
      normalized = normalized.replace(/\bsin\b/gi, "Math.sin");
      normalized = normalized.replace(/\bcos\b/gi, "Math.cos");
      normalized = normalized.replace(/\btan\b/gi, "Math.tan");
      normalized = normalized.replace(/\basin\b/gi, "Math.asin");
      normalized = normalized.replace(/\bacos\b/gi, "Math.acos");
      normalized = normalized.replace(/\batan\b/gi, "Math.atan");
      normalized = normalized.replace(/\bsinh\b/gi, "Math.sinh");
      normalized = normalized.replace(/\bcosh\b/gi, "Math.cosh");
      normalized = normalized.replace(/\btanh\b/gi, "Math.tanh");
      normalized = normalized.replace(/\blog\b/gi, "Math.log");
      normalized = normalized.replace(/\bexp\b/gi, "Math.exp");
      normalized = normalized.replace(/\bsqrt\b/gi, "Math.sqrt");
      normalized = normalized.replace(/\babs\b/gi, "Math.abs");
      normalized = normalized.replace(/\bpow\b/gi, "Math.pow");

      return normalized;
    }

    insertImplicitMultiplication(expression) {
      return expression
        .replace(/(\d)([a-z(])/g, "$1*$2")
        .replace(/([xy\)])(\d)/g, "$1*$2")
        .replace(/([xy\)])([a-z(])/g, "$1*$2")
        .replace(/(\))(\()/g, "$1*$2");
    }

    buildFunctionPlatforms({ fn }, timeLimitMs = null) {
      const startTime = timeLimitMs ? performance.now() : 0;
      const { halfWidth, halfHeight } = this.functionDrawBounds;
      const step = FUNC_MARCH_STEP;
      const scale = GRID_SIZE;
      const thickness = this.getFunctionThickness();
      this.prepareFunctionGraphics();

      const xMin = -halfWidth;
      const yMin = -halfHeight;
      const xSteps = Math.floor((halfWidth * 2) / step);
      const ySteps = Math.floor((halfHeight * 2) / step);

      const values = Array.from({ length: xSteps + 1 }, () => new Array(ySteps + 1));

      for (let xi = 0; xi <= xSteps; xi += 1) {
        const x = xMin + xi * step;
        for (let yi = 0; yi <= ySteps; yi += 1) {
          const y = yMin + yi * step;
          const val = fn(x / scale, y / scale);
          values[xi][yi] = Number.isFinite(val) ? val : null;
          if (timeLimitMs && performance.now() - startTime > timeLimitMs) {
            return "time-limit";
          }
        }
      }

      // Invalidate cells across sharp jumps to avoid linking discontinuities (e.g., tan).
      const jumpThreshold = -30;
      for (let xi = 0; xi < xSteps; xi += 1) {
        for (let yi = 0; yi <= ySteps; yi += 1) {
          const vA = values[xi][yi];
          const vB = values[xi + 1][yi];
          if (vA === null || vB === null) continue;
          if (vA * vB < jumpThreshold) {
            values[xi][yi] = null;
            values[xi + 1][yi] = null;
          }
        }
      }
      for (let xi = 0; xi <= xSteps; xi += 1) {
        for (let yi = 0; yi < ySteps; yi += 1) {
          const vA = values[xi][yi];
          const vB = values[xi][yi + 1];
          if (vA === null || vB === null) continue;
          if (vA * vB < jumpThreshold) {
            values[xi][yi] = null;
            values[xi][yi + 1] = null;
          }
        }
      }

      for (let xi = 0; xi < xSteps; xi += 1) {
        const x0 = xMin + xi * step;
        const x1 = x0 + step;
        for (let yi = 0; yi < ySteps; yi += 1) {
          const y0 = yMin + yi * step;
          const y1 = y0 + step;

          const v0 = values[xi][yi + 1];
          const v1 = values[xi + 1][yi + 1];
          const v2 = values[xi + 1][yi];
          const v3 = values[xi][yi];

          if (v0 === null || v1 === null || v2 === null || v3 === null) continue;

          const caseIndex =
            (v0 >= 0 ? 1 : 0) |
            (v1 >= 0 ? 2 : 0) |
            (v2 >= 0 ? 4 : 0) |
            (v3 >= 0 ? 8 : 0);

          if (caseIndex === 0 || caseIndex === 15) continue;

          const centerVal = fn((x0 + x1) / 2 / scale, (y0 + y1) / 2 / scale);
          const edges = this.computeCellIntersections(x0, y0, x1, y1, v0, v1, v2, v3);
          const segments = this.getSegmentsForCase(caseIndex, centerVal);

          segments.forEach(([eA, eB]) => {
            const pA = edges[eA];
            const pB = edges[eB];
            if (!pA || !pB) return;
            this.addFunctionSegmentBetween(pA, pB, thickness);
          });

          if (timeLimitMs && performance.now() - startTime > timeLimitMs) {
            return "time-limit";
          }
        }
      }
      return "ok";
    }

    computeCellIntersections(x0, y0, x1, y1, v0, v1, v2, v3) {
      const lerp = (a, b, va, vb) => {
        const denom = va - vb;
        if (denom === 0) return a;
        const t = va / denom;
        return a + t * (b - a);
      };

      const top = {
        x: lerp(x0, x1, v0, v1),
        y: y1,
      };
      const right = {
        x: x1,
        y: lerp(y1, y0, v1, v2),
      };
      const bottom = {
        x: lerp(x1, x0, v2, v3),
        y: y0,
      };
      const left = {
        x: x0,
        y: lerp(y0, y1, v3, v0),
      };

      return [top, right, bottom, left];
    }

    getSegmentsForCase(caseIndex, centerVal) {
      switch (caseIndex) {
        case 1:
          return [[3, 0]];
        case 2:
          return [[0, 1]];
        case 3:
          return [[3, 1]];
        case 4:
          return [[1, 2]];
        case 5:
          return centerVal >= 0 ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
        case 6:
          return [[0, 2]];
        case 7:
          return [[3, 2]];
        case 8:
          return [[2, 3]];
        case 9:
          return [[0, 2]];
        case 10:
          return centerVal >= 0 ? [[0, 3], [1, 2]] : [[0, 1], [2, 3]];
        case 11:
          return [[1, 2]];
        case 12:
          return [[1, 3]];
        case 13:
          return [[0, 1]];
        case 14:
          return [[3, 0]];
        default:
          return [];
      }
    }

    getThicknessFromSlope(slope) {
      const scale = Math.sqrt(1 + slope * slope);
      const thickness = PLATFORM_THICKNESS * scale;
      return Math.min(thickness, PLATFORM_THICKNESS_MAX);
    }

    getFunctionThickness() {
      return Math.min(PLATFORM_THICKNESS, PLATFORM_THICKNESS_MAX);
    }

    getSlopeImplicit(fn, x, y) {
      const delta = 1;
      const scale = GRID_SIZE;
      const fx1 = fn((x + delta) / scale, y / scale);
      const fx0 = fn((x - delta) / scale, y / scale);
      const fy1 = fn(x / scale, (y + delta) / scale);
      const fy0 = fn(x / scale, (y - delta) / scale);

      if (
        !Number.isFinite(fx1) ||
        !Number.isFinite(fx0) ||
        !Number.isFinite(fy1) ||
        !Number.isFinite(fy0)
      ) {
        return 0;
      }

      const dFdx = (fx1 - fx0) / (2 * delta);
      const dFdy = (fy1 - fy0) / (2 * delta);
      if (!Number.isFinite(dFdx) || !Number.isFinite(dFdy) || Math.abs(dFdy) < 1e-6) {
        return 0;
      }

      return -dFdx / dFdy;
    }

    addFunctionSegmentBetween(pointA, pointB, thickness) {
      const worldA = this.toWorldPoint(pointA);
      const worldB = this.toWorldPoint(pointB);

      const buffer = 60;
      const { halfWidth, halfHeight } = this.functionDrawBounds;
      const minX = this.origin.x - halfWidth - buffer;
      const maxX = this.origin.x + halfWidth + buffer;
      const minY = this.origin.y - halfHeight - buffer;
      const maxY = this.origin.y + halfHeight + buffer;
      if (
        worldA.x < minX ||
        worldA.x > maxX ||
        worldA.y < minY ||
        worldA.y > maxY ||
        worldB.x < minX ||
        worldB.x > maxX ||
        worldB.y < minY ||
        worldB.y > maxY
      ) {
        return;
      }

      const dx = worldB.x - worldA.x;
      const dy = worldB.y - worldA.y;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length < 0.5) return;

      const angle = Math.atan2(dy, dx);
      const midX = (worldA.x + worldB.x) / 2;
      const midY = (worldA.y + worldB.y) / 2;

      const rect = this.add
        .rectangle(midX, midY, length, thickness, COLORS.white)
        .setStrokeStyle(2, COLORS.white)
        .setRotation(angle);
      this.matter.add.gameObject(rect, {
        isStatic: true,
        label: "func-platform",
        angle,
      });
      this.customPlatforms.push(rect);
      this.addFunctionLine(worldA, worldB);
    }

    prepareFunctionGraphics() {
      if (!this.functionGraphics) {
        this.functionGraphics = this.add.graphics();
      }
      this.functionGraphics.clear();
      this.functionGraphics.lineStyle(2, COLORS.white, 0.7);
      this.functionGraphics.fillStyle(COLORS.white, 0.8);
      this.lastFunctionPoint = null;
    }

    addFunctionPoint(localX, localY) {
      if (!this.functionGraphics) return;
      const worldX = this.origin.x + localX;
      const worldY = this.origin.y - localY;
      const last = this.lastFunctionPoint;

      if (last) {
        const dx = worldX - last.x;
        const dy = worldY - last.y;
        const maxGap = 6;
        if (Math.hypot(dx, dy) <= maxGap) {
          this.functionGraphics.lineBetween(last.x, last.y, worldX, worldY);
        } else {
          this.functionGraphics.fillCircle(worldX, worldY, 1.5);
        }
      } else {
        this.functionGraphics.fillCircle(worldX, worldY, 1.5);
      }

      this.lastFunctionPoint = { x: worldX, y: worldY };
    }

    clearCustomPlatforms() {
      this.customPlatforms.forEach((rect) => {
        if (rect.body) {
          this.matter.world.remove(rect.body);
        }
        rect.destroy();
      });
      this.customPlatforms = [];
      if (this.functionGraphics) {
        this.functionGraphics.clear();
      }
      this.lastFunctionPoint = null;
      this.groundPairs.clear();
    }

    toWorldPoint(localPoint) {
      return {
        x: this.origin.x + localPoint.x,
        y: this.origin.y - localPoint.y,
      };
    }

    addFunctionLine(worldA, worldB) {
      if (!this.functionGraphics) return;
      this.functionGraphics.lineBetween(worldA.x, worldA.y, worldB.x, worldB.y);
    }

    invalidateFunctionRender() {
      this.currentFunction = null;
      this.clearCustomPlatforms();
    }

    playSfx(key) {
      const sound = this.sound.get(key) || this.sound.add(key, { volume: SE_VOLUME });
      if (sound) {
        sound.play();
      }
    }


    resetPlayerToStart() {
      const stage = STAGES[this.stageIndex];
      if (!this.player || !stage) return;
      this.player.setPosition(stage.start.x, stage.start.y);
      if (this.player.body) {
        this.player.setVelocity(0, 0);
      }
      this.coyoteFrames = 0;
      this.groundPairs.clear();
    }

    handleClear() {
      if (this.isCleared) return;
      this.isCleared = true;

      if (this.player?.body) {
        this.player.setVelocity(0, 0);
        this.player.setStatic(true);
      }

      this.playSfx("clear");

      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;

      const panel = this.add
        .rectangle(centerX, centerY, 360, 140, COLORS.panel)
        .setStrokeStyle(2, COLORS.blueSoft);
      const text = this.add.text(centerX, centerY - 10, "CLEAR!", {
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);
      const sub = this.add.text(centerX, centerY + 30, "Click to go to next stage", {
        fontSize: "14px",
        color: "#8cc9ff",
      }).setOrigin(0.5);

      panel.setDepth(20);
      text.setDepth(20);
      sub.setDepth(20);

      sub.setText("Press Space to go to next stage");
      this.input.keyboard.once("keydown-SPACE", () => {
        const nextIndex = (this.stageIndex + 1) % STAGES.length;
        this.scene.start("GameScene", { stageIndex: nextIndex });
      });
    }

    update() {
      if (!this.player || this.isCleared) return;

      const left = FuncJump.IS_MOBILE ? this.mobileInput.left : this.cursors.left.isDown;
      const right = FuncJump.IS_MOBILE ? this.mobileInput.right : this.cursors.right.isDown;

      if (left) {
        this.player.setVelocityX(-5);
      } else if (right) {
        this.player.setVelocityX(5);
      } else {
        this.player.setVelocityX(0);
      }

      const onGround = this.isOnGround();
      if (onGround) {
        this.coyoteFrames = 2;
      } else if (this.coyoteFrames > 0) {
        this.coyoteFrames -= 1;
      }

      if (
        (FuncJump.IS_MOBILE ? this.mobileInput.jumpRequested : Phaser.Input.Keyboard.JustDown(this.keyZ)) &&
        this.coyoteFrames > 0
      ) {
        this.player.setVelocityY(-9);
        this.coyoteFrames = 0;
      }
      this.mobileInput.jumpRequested = false;

      if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
        this.scene.restart({ stageIndex: this.stageIndex });
      }

      if (this.player.y > HEIGHT + 60) {
        this.scene.restart({ stageIndex: this.stageIndex });
      }
    }

    getPointerZone(x) {
      const third = WIDTH / 3;
      if (x < third) return "left";
      if (x > third * 2) return "right";
      return "center";
    }

    updateMobileDirections() {
      let left = false;
      let right = false;
      for (const zone of this.pointerZones.values()) {
        if (zone === "left") left = true;
        if (zone === "right") right = true;
      }
      this.mobileInput.left = left;
      this.mobileInput.right = right;
    }
  }

  FuncJump.GameScene = GameScene;
})();
