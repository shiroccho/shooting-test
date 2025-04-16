const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲームの基本設定
const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let player;
let bullets = [];
let enemies = [];
let bombs = [];
let items = [];
let level = 1;
let score = 0;
let lives = 3;
let isGameOver = false;
let boss = null;
let boss появляться = false;
let bossHealth;
const BOSS_MAX_HEALTH = 50;

const PLAYER_SPEED = 5;
const ENEMY_SPEED = 2;
const BULLET_SPEED = 10;
const BOMB_RADIUS = 30;
const BOMB_DURATION = 60; // フレーム数

const ENEMY_TYPES = ['straight', 'zigzag', 'diagonal'];

// キー入力の状態管理
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// プレイヤーオブジェクト
class Player {
    constructor() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - 50;
        this.width = 30;
        this.height = 30;
        this.color = 'lime';
        this.isShooting = false;
        this.shootInterval = 10; // 連射間隔 (フレーム数)
        this.shootTimer = 0;
        this.hasBomb = true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update() {
        if (keys['ArrowLeft'] && this.x > this.width / 2) {
            this.x -= PLAYER_SPEED;
        }
        if (keys['ArrowRight'] && this.x < GAME_WIDTH - this.width / 2) {
            this.x += PLAYER_SPEED;
        }
        if (keys['ArrowUp'] && this.y > this.height / 2) {
            this.y -= PLAYER_SPEED;
        }
        if (keys['ArrowDown'] && this.y < GAME_HEIGHT - this.height / 2) {
            this.y += PLAYER_SPEED;
        }

        // 弾の発射
        if (keys[' '] && this.shootTimer === 0) {
            bullets.push(new Bullet(this.x, this.y - this.height / 2));
            this.shootTimer = this.shootInterval;
        }
        if (this.shootTimer > 0) {
            this.shootTimer--;
        }

        // ボムの使用
        if (keys['b'] && this.hasBomb && bombs.length === 0) {
            bombs.push(new Bomb(this.x, this.y));
            this.hasBomb = false;
        }
    }
}

// 弾オブジェクト
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = 'yellow';
        this.speed = BULLET_SPEED;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.y -= this.speed;
    }
}

// 敵オブジェクト
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.color = 'red';
        this.speed = ENEMY_SPEED;
        this.type = type;
        this.initialX = x;
        this.amplitude = 30;
        this.frequency = 0.05;
        this.angle = Math.random() * Math.PI * 2; // 斜め移動の初期角度
        this.health = 1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update() {
        switch (this.type) {
            case 'straight':
                this.y += this.speed;
                break;
            case 'zigzag':
                this.x = this.initialX + Math.sin(this.y * this.frequency) * this.amplitude;
                this.y += this.speed;
                break;
            case 'diagonal':
                this.x += Math.cos(this.angle) * this.speed * 0.7;
                this.y += Math.sin(this.angle) * this.speed * 0.7;
                break;
        }
    }
}

// 大ボスオブジェクト
class Boss {
    constructor() {
        this.x = GAME_WIDTH / 2;
        this.y = -100;
        this.width = 60;
        this.height = 60;
        this.color = 'purple';
        this.speed = 1;
        this.health = BOSS_MAX_HEALTH;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update() {
        if (this.y < 100) {
            this.y += this.speed;
        } else {
            // ボスの攻撃パターンなどを実装
        }
    }
}

// ボムオブジェクト
class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = BOMB_RADIUS;
        this.color = 'orange';
        this.duration = BOMB_DURATION;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.duration--;
    }
}

// アイテムオブジェクト
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.type = type;
        this.color = (type === 'heal') ? 'green' : 'blue';
        this.speed = ENEMY_SPEED / 2;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((this.type === 'heal') ? 'H' : 'L', this.x, this.y + 3);
    }

    update() {
        this.y += this.speed;
    }
}

// 敵の生成
function spawnEnemy() {
    const x = Math.random() * GAME_WIDTH;
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    enemies.push(new Enemy(x, -20, type));
}

// アイテムの生成
function spawnItem() {
    const x = Math.random() * GAME_WIDTH;
    const type = Math.random() < 0.5 ? 'heal' : 'life';
    items.push(new Item(x, -10, type));
}

// レベルアップ処理
function levelUp() {
    level++;
    boss появляться = true;
    boss = new Boss();
    bossHealth = BOSS_MAX_HEALTH;
    enemies = []; // 既存の敵を削除
}

// 衝突判定
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius ||
           (obj1.x - obj1.width / 2 < obj2.x + obj2.width / 2 &&
            obj1.x + obj1.width / 2 > obj2.x - obj2.width / 2 &&
            obj1.y - obj1.height / 2 < obj2.y + obj2.height / 2 &&
            obj1.y + obj1.height / 2 > obj2.y - obj2.height / 2);
}

// ゲームオーバー処理
function gameOver() {
    isGameOver = true;
}

// ゲームループ
function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!isGameOver) {
        player.update();
        player.draw();

        // 弾の更新と描画
        bullets.forEach((bullet, index) => {
            bullet.update();
            bullet.draw();
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }
        });

        // 敵の生成
        if (!boss появляться && Math.random() < 0.02 * level) {
            spawnEnemy();
        }

        // 敵の更新と描画
        enemies.forEach((enemy, index) => {
            enemy.update();
            enemy.draw();

            // 敵と弾の衝突判定
            bullets.forEach((bullet, bulletIndex) => {
                if (checkCollision(bullet, enemy)) {
                    enemies.splice(index, 1);
                    bullets.splice(bulletIndex, 1);
                    score += 10;
                }
            });

            // 敵とプレイヤーの衝突判定
            if (checkCollision(player, enemy)) {
                lives--;
                enemies.splice(index, 1);
                if (lives <= 0) {
                    gameOver();
                }
            }

            if (enemy.y > GAME_HEIGHT) {
                enemies.splice(index, 1);
            }
        });

        // ボムの更新と描画
        bombs.forEach((bomb, index) => {
            bomb.update();
            bomb.draw();
            if (bomb.duration <= 0) {
                bombs.splice(index, 1);
            } else {
                // ボムと敵の衝突判定
                enemies.forEach((enemy, enemyIndex) => {
                    if (checkCollision(bomb, enemy)) {
                        enemies.splice(enemyIndex, 1);
                        score += 10;
                    }
                });
            }
        });

        // アイテムの生成
        if (Math.random() < 0.01) {
            spawnItem();
        }

        // アイテムの更新と描画
        items.forEach((item, index) => {
            item.update();
            item.draw();

            // アイテムとプレイヤーの衝突判定
            if (checkCollision(player, item)) {
                if (item.type === 'heal' && lives < 3) {
                    lives++;
                } else if (item.type === 'life') {
                    player.hasBomb = true;
                }
                items.splice(index, 1);
            }

            if (item.y > GAME_HEIGHT) {
                items.splice(index, 1);
            }
        });

        // ボスの出現
        if (boss появляться) {
            boss.update();
            boss.draw();

            // 弾とボスの衝突判定
            bullets.forEach((bullet, index) => {
                if (checkCollision(bullet, boss)) {
                    bossHealth--;
                    bullets.splice(index, 1);
                    if (bossHealth <= 0) {
                        boss появляться = false;
                        boss = null;
                        score += 100;
                        levelUp(); // 次のレベルへ
                    }
                }
            });

            if (checkCollision(player, boss)) {
                lives = 0;
                gameOver();
            }
        } else if (enemies.length === 0 && !boss) {
            // 敵がいなくなったらレベルアップの準備
            if (Math.random() < 0.01) { // 少し遅らせてレベルアップ
                levelUp();
            }
        }

        // UI表示
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Score: ${score}`, 10, 20);
        ctx.fillText(`Lives: ${lives}`, 10, 40);
        ctx.fillText(`Level: ${level}`, 10, 60);
        if (player.hasBomb) {
            ctx.fillText('Bomb: Available', 10, 80);
        }

        if (boss появляться && boss) {
            ctx.fillStyle = 'red';
            ctx.fillRect(GAME_WIDTH - 150, 10, 140, 10);
            ctx.fillStyle = 'lime';
            ctx.fillRect(GAME_WIDTH - 150, 10, 140 * (bossHealth / BOSS_MAX_HEALTH), 10);
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(`Boss Health: ${bossHealth}`, GAME_WIDTH - 150, 30);
        }

    } else {
        // ゲームオーバー画面
        ctx.fillStyle = 'red';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    }

    requestAnimationFrame(gameLoop);
}

// ゲームの初期化
function init() {
    player = new Player();
    gameLoop();
}

init();
