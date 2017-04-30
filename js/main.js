  //              //
 //  PERSONAGEM  //
//              //

function Personagem(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);

    // ref. física
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;

    // ref. animações
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true);
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
}

Personagem.prototype = Object.create(Phaser.Sprite.prototype);
Personagem.prototype.constructor = Personagem;

Personagem.prototype.mover = function (direcao) {
    // move o personagem; direcao define o sentido esq/dir

    const VELOCIDADE = 200;
    this.body.velocity.x = direcao * VELOCIDADE;

    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Personagem.prototype.pular = function () {
    const VELOCIDADE_PULO = 600;
    let podePular = this.body.touching.down;

    if (podePular) {
        this.body.velocity.y = -VELOCIDADE_PULO;
    }

    return podePular;
};

Personagem.prototype.bounce = function () {
    const VELOCIDADE_BOUNCE = 200;
    this.body.velocity.y = -VELOCIDADE_BOUNCE;
};

Personagem.prototype.update = function () {
    let nomeAnimacao = this._getAnimacoes();
    if (this.animations.name !== nomeAnimacao) {
        this.animations.play(nomeAnimacao);
    }
};

Personagem.prototype._getAnimacoes = function () {
    let retorno = 'stop';

    if (this.body.velocity.y < 0) {
        retorno = 'jump';
    }
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        retorno = 'fall';
    }
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        retorno = 'run';
    }

    return retorno;
};

  //              //
 //   INIMIGO    //
//              //

function Inimigo(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'enemy');
    this.anchor.set(0.5);

    // ref. animação
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('morrer', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // ref. física
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Inimigo.VELOCIDADE;
}

Inimigo.VELOCIDADE = 100;

Inimigo.prototype = Object.create(Phaser.Sprite.prototype);
Inimigo.prototype.constructor = Inimigo;

Inimigo.prototype.update = function () {
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Inimigo.VELOCIDADE; 
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Inimigo.VELOCIDADE;
    }
};

Inimigo.prototype.morrer = function () {
    this.body.enable = false;

    this.animations.play('morrer').onComplete.addOnce(function () {
        this.kill();
    }, this);
};

  //              //
 //    STATES    //
//              //

PlayState = {};

const LEVEL_COUNT = 2;

PlayState.init = function (data) {
    // renderSession.roundPixels para não desfocar durante o movimento do personagem.
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    this.keys.up.onDown.add(function () {
        let pulou = this.hero.pular();
        if (pulou) {
            this.sfx.pular.play();
        }
    }, this);

    this.countMoedas = 0;
    this.temChave = false;
    this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');

    this.game.load.image('font:numbers', 'images/numero.png');

    this.game.load.image('background', 'images/fundo.png');
    this.game.load.image('ground', 'images/chao.png');
    this.game.load.image('platform:8x1', 'images/plataforma_8x1.png');
    this.game.load.image('platform:6x1', 'images/plataforma_6x1.png');
    this.game.load.image('platform:4x1', 'images/plataforma_4x1.png');
    this.game.load.image('platform:2x1', 'images/plataforma_2x1.png');
    this.game.load.image('platform:1x1', 'images/plataforma_1x1.png');
    this.game.load.image('invisible-wall', 'images/box_colisao.png');
    this.game.load.image('icon:coin', 'images/moeda.png');
    this.game.load.image('key', 'images/chave.png');

    this.game.load.spritesheet('coin', 'images/moeda_animada.png', 22, 22);
    this.game.load.spritesheet('enemy', 'images/inimigo.png', 42, 32);
    this.game.load.spritesheet('hero', 'images/personagem.png', 36, 42);
    this.game.load.spritesheet('door', 'images/porta.png', 42, 66);
    this.game.load.spritesheet('icon:key', 'images/icone_moeda.png', 34, 30);

    this.game.load.audio('sfx:pular', 'audio/pular.wav');
    this.game.load.audio('sfx:chave', 'audio/chave.wav');
    this.game.load.audio('sfx:morte', 'audio/morte.wav');
    this.game.load.audio('sfx:chave', 'audio/chave.wav');
    this.game.load.audio('sfx:porta', 'audio/porta.wav');
};

PlayState.create = function () {
    // criação das referências de efeitos de áudio (sfx)
    this.sfx = {
        pular: this.game.add.audio('sfx:pular'),
        moeda: this.game.add.audio('sfx:moeda'),
        morte: this.game.add.audio('sfx:morte'),
        chave: this.game.add.audio('sfx:chave'),
        porta: this.game.add.audio('sfx:porta')
    };

    this.game.add.image(0, 0, 'background');
    this._carregarLevel(this.game.cache.getJSON(`level:${this.level}`));

    this._criarInterfaceHud();
};

PlayState.update = function () {
    this._tratamentoColisoes();
    this._tratamentoTeclado();

    this.fonteHudMoeda.text = `x${this.countMoedas}`;
    // sprite da chave tem dois estados, ter chave ou não
    this.iconeHudChave.frame = this.temChave ? 1 : 0;
};

PlayState._tratamentoColisoes = function () {
    this.game.physics.arcade.collide(this.enemies, this.platforms);
    this.game.physics.arcade.collide(this.enemies, this.enemyWalls);
    this.game.physics.arcade.collide(this.hero, this.platforms);

    this.game.physics.arcade.overlap(this.hero, this.coins, this._colidiuMoeda,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.enemies,
        this._colidiuInimigo, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._colidiuChave,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.door, this._colidiuPorta,

        function (hero, door) {
            return this.temChave && hero.body.touching.down;
        }, this);
};

PlayState._tratamentoTeclado = function () {
    if (this.keys.left.isDown) {
        this.hero.mover(-1);
    }
    else if (this.keys.right.isDown) {
        this.hero.mover(1);
    }
    else {
        this.hero.mover(0);
    }
};

PlayState._carregarLevel = function (data) {
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.enemies = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

    data.platforms.forEach(this._spawnPlataforma, this);
    this._spawnPersonagens({hero: data.hero, enemies: data.enemies});
    data.coins.forEach(this._spawnMoeda, this);
    this._spawnPorta(data.door.x, data.door.y);
    this._spawnChave(data.key.x, data.key.y);

    const GRAVIDADE = 1200;
    this.game.physics.arcade.gravity.y = GRAVIDADE;
};

PlayState._spawnPlataforma = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;

    this._spawnInimigoCollisionBox(platform.x, platform.y, 'left');
    this._spawnInimigoCollisionBox(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnInimigoCollisionBox = function (x, y, side) {
    // parede invisivel para evitar que os inimigos caiam
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // ref. física
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnPersonagens = function (data) {
    data.enemies.forEach(function (enemy) {
        let sprite = new Inimigo(this.game, enemy.x, enemy.y);
        this.enemies.add(sprite);
    }, this);

    this.hero = new Personagem(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

PlayState._spawnMoeda = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);

    // ref. fisica
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;

    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true);
    sprite.animations.play('rotate');
};

PlayState._spawnPorta = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);

    // ref. fisica
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnChave = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);

    // ref. fisica
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    
    this.key.y -= 3;

    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

PlayState._colidiuMoeda = function (hero, coin) {
    this.sfx.moeda.play();
    coin.kill();
    this.countMoedas++;
};

PlayState._colidiuInimigo = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { 
        // matou inimigo

        hero.bounce();
        enemy.morrer();
        this.sfx.morte.play();
    }
    else {
        // morreu para inimigo

        sweetAlert({
            title: "Game over!", 
            text: "Não foi dessa vez, tente novamente.", 
            type: "error"
        });
        
        this.sfx.morte.play();
        this.game.state.restart(true, false, {level: this.level});
    }
};

PlayState._colidiuChave = function (hero, key) {
    this.sfx.chave.play();
    key.kill();
    this.temChave = true;
};

PlayState._colidiuPorta = function (hero, door) {
    this.sfx.porta.play();
    this.game.state.restart(true, false, { level: this.level + 1 });
    sweetAlert({
        title: "Você venceu!",
        text:"Boa sorte na próxima fase.",
        type:"success"
    });
};

PlayState._criarInterfaceHud = function () {
    const NUMBERS_STR = '0123456789X ';
    this.fonteHudMoeda = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR);

    this.iconeHudChave = this.game.make.image(0, 19, 'icon:key');
    this.iconeHudChave.anchor.set(0, 0.5);

    let coinIcon = this.game.make.image(this.iconeHudChave.width + 7, 0, 'icon:coin');
    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,
        coinIcon.height / 2, this.fonteHudMoeda);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.add(this.iconeHudChave);
    this.hud.position.set(10, 10);
};

  //              //
 //    INÍCIO    //
//              //

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, {level: 0});
};