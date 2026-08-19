/**
 * Global game balance, physics, and gameplay configuration constants.
 */
export const CONFIG = {
  // Lane dimensions
  LANE_WIDTH: 2.8,
  LANES_COUNT: 3,

  // Level chunking
  CHUNK_LENGTH: 50,
  MAX_ACTIVE_CHUNKS: 5,

  // Speed & Progression
  INITIAL_SPEED: 14.0,
  MAX_SPEED: 32.0,
  SPEED_ACCELERATION: 0.08, // per second

  // Physics & Bounds
  GRAVITY: 48.0,
  JUMP_VELOCITY: 14.5,
  MAX_JUMP_HOLD_TIME: 0.18,
  DOUBLE_JUMP_VELOCITY: 13.5,
  DOUBLE_JUMP_COOLDOWN: 1.2,
  GRAVITY_FLIP_VELOCITY: 18.0,
  SLIDE_DURATION: 0.75,
  SLIDE_HEIGHT: 0.7,
  NORMAL_HEIGHT: 1.8,
  FLOOR_Y: 0.0,
  CEILING_HEIGHT: 5.6,

  // Powerups & Special Boosts
  NITRO_DURATION: 3.5,
  NITRO_SPEED_MULTIPLIER: 1.6,
  NITRO_ENERGY_REQ: 30,
  NITRO_MAX_ENERGY: 100,
  NITRO_RECHARGE_RATE: 4.0,

  // World Events
  BOSS_INTERVAL_METERS: 400,
  BIOME_INTERVAL_METERS: 650,

  // Level progression (после каждого босса — новый уровень с усложнением)
  LEVEL_BOSS_INTERVAL_DECREASE: 25, // на сколько метров сокращается дистанция до босса за уровень
  LEVEL_MIN_BOSS_INTERVAL: 220, // минимальная дистанция до босса
  LEVEL_SPEED_BONUS: 0.6, // прибавка к базовой скорости за уровень
  LEVEL_MAX_SPEED_BONUS: 6.0, // потолок прибавки скорости
  LEVEL_OBSTACLE_DENSITY: 0.08, // прибавка плотности препятствий за уровень
  LEVEL_MAX_OBSTACLE_DENSITY: 0.5, // потолок плотности
  LEVEL_BOSS_HP_BONUS: 30, // прибавка HP босса за уровень
  LEVEL_BOSS_ATTACK_BONUS: 0.08, // прибавка к скорости атак босса за уровень

  // Object Pooling
  PARTICLE_POOL_SIZE: 160
};
