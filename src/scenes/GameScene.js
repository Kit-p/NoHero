import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import Constants from '../classes/Constants';
import { Character } from '../classes/Character';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { HumanControlState } from '../states/HumanControlState';
import { StrongAIControlState } from '../states/StrongAIControlState';
import { BasicProjectile } from '../projectiles/BasicProjectile';
import { Potion } from '../items/Potion';
import { Spike } from '../traps/Spike';

export class GameScene extends Phaser.Scene {
    /** @type {{tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset, layers: Phaser.Tilemaps.TilemapLayer[]}} */
    map = {
        tilemap: null,
        tileset: null,
        layers: [],
    };

    /** @type {EasyStar.js} The EasyStar library for path-finding. */
    easystar = new EasyStar.js();

    /** @type {Phaser.Physics.Arcade.Group} A group of characters with physics. */
    characterGroup;

    /** @type {Phaser.Physics.Arcade.Group} A group of projectiles with physics. */
    projectileGroup;

    /** @type {Phaser.Physics.Arcade.Group} A group of potions with physics. */
    potionGroup;

    /** @type {Phaser.Physics.Arcade.Group} A group of spikes with physics. */
    spikeGroup;

    /** @type {{x: number, y: number}[]} */
    pillars = [];

    /** @type {PlayerCharacter} The current human controlled character. */
    currentHumanControlledCharacter;

    /** @protected @type {{player: {small: number, large: number}, enemy: {small: number, large: number}}} The count of different potion for both teams. */
    _potionCount = {
        player: {
            small: 3,
            large: 1,
        },
        enemy: {
            small: 6,
            large: 2,
        },
    };

    /** @protected @type {{small: number, large: number}} The healing effect of each potion types (uses same ratio as damage). */
    _potionHealing = {
        small: 2,
        large: 6,
    };

    /** @protected @type {number} The number of spikes to be spawned on the map. */
    _spikeCount = 2;

    constructor() {
        super({ key: Constants.SCENE.GAME });
    }

    init() {
        this.characterGroup = this.physics.add.group();
        this.projectileGroup = this.physics.add.group();
        this.potionGroup = this.physics.add.group();
        this.spikeGroup = this.physics.add.group();

        // make each of the character to overlap with each other
        this.physics.add.overlap(
            this.characterGroup,
            this.characterGroup,
            this._characterOverlapCallback,
            undefined,
            this
        );

        // make each of the projectiles to overlap with characters
        this.physics.add.overlap(
            this.projectileGroup,
            this.characterGroup,
            this._projectileOverlapCallback,
            undefined,
            this
        );

        // make each of the potions to overlap with characters
        this.physics.add.overlap(
            this.potionGroup,
            this.characterGroup,
            this._potionOverlapCallback,
            undefined,
            this
        );

        // make each of the spikes to overlap with characters
        this.physics.add.overlap(
            this.spikeGroup,
            this.characterGroup,
            this._spikeOverlapCallback,
            undefined,
            this
        );

        console.log(this);
    }

    create() {
        const player = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'big_demon_idle_anim_f0',
            {
                name: 'big_demon',
                controlState: HumanControlState,
                maxHealth: 24,
                type: 'player',
                cooldowns: {
                    projectile: 1000,
                    dash: 2000,
                },
            }
        );
        // manually adjust the collision body size and offset
        player.body.setSize(player.width * 0.7, player.height * 0.8, true);
        player.body.setOffset(
            player.body.width * 0.25,
            player.body.height * 0.25
        );

        const knight = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'knight_m_idle_anim_f0',
            {
                name: 'knight_m',
                controlState: StrongAIControlState,
                maxHealth: 12,
                collideAttackDamage: 6,
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        knight.body.setSize(knight.width * 0.75, knight.height * 0.65, true);
        knight.body.setOffset(
            knight.body.width * 0.15,
            knight.body.height * 0.5
        );

        const wizard = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'wizard_m_idle_anim_f0',
            {
                name: 'wizard_m',
                controlState: StrongAIControlState,
                maxHealth: 8,
                movementSpeed: 36,
                cooldowns: {
                    projectile: 3000,
                },
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        wizard.body.setSize(wizard.width * 0.75, wizard.height * 0.65, true);
        wizard.body.setOffset(
            wizard.body.width * 0.15,
            wizard.body.height * 0.5
        );

        // set reference for GameUIScene to display health
        this.currentHumanControlledCharacter = player;

        // create the map for this scene
        this._createMap(
            Constants.RESOURCE.TILEMAP.TRIAL_1,
            Constants.RESOURCE.IMAGE.ALL_IN_ONE_2,
            0,
            -6
        );

        // place the player at the top center of the map
        player.setX(this.map.tilemap.widthInPixels * 0.5);
        player.setY(
            this.map.tilemap.heightInPixels * 0.25 - player.height * 0.5
        );

        // place the enemy at the bottom center of the map
        knight.setX(this.map.tilemap.widthInPixels * 0.25);
        knight.setY(
            this.map.tilemap.heightInPixels * 0.5 + knight.height * 0.5
        );

        // place the enemy at the bottom center of the map
        wizard.setX(this.map.tilemap.widthInPixels * 0.75);
        wizard.setY(
            this.map.tilemap.heightInPixels * 0.5 + wizard.height * 0.5
        );

        // spawn the spikes
        this._spawnSpikes();

        // spawn the healing potions
        this._spawnPotions();

        // launch the UI scene to both scenes run in parallel
        this.scene.launch(Constants.SCENE.GAME_UI, { gameScene: this });

        this._debug();
    }

    update() {
        const count = {
            player: 0,
            enemy: 0,
        };
        // update game objects with physics
        for (const character of this.characterGroup.getChildren()) {
            character.update();
            // count active game objects for determing end-game situations
            if (character.active && character instanceof PlayerCharacter) {
                if (typeof count[character.type] !== 'number') {
                    count[character.type] = 0;
                }
                ++count[character.type];
            }
        }
        for (const projectile of this.projectileGroup.getChildren()) {
            projectile.update();
        }
        for (const potion of this.potionGroup.getChildren()) {
            potion.update();
        }
        for (const spike of this.spikeGroup.getChildren()) {
            spike.update();
        }
        // check end-game situations and transition to game end scene if ended
        if (count.player === 0 || count.enemy === 0) {
            // ? potentially use launch(), but need to pause current scenes

            // disable physics
            this.physics.shutdown();

            // disable all tweens timeline
            for (const tween of this.tweens.getAllTweens()) {
                if (tween instanceof Phaser.Tweens.Timeline) {
                    tween.stop();
                }
            }

            // hide GameUIScene
            this.scene.get(Constants.SCENE.GAME_UI).scene.stop();

            // start GameEndScene
            this.time.delayedCall(2000, () => {
                this.scene.start(Constants.SCENE.GAME_END, {
                    isVictory: count.enemy === 0,
                });
            });
        }
    }

    /**
     * A utility method to create a map and the layers, also handles adding collisions with game objects.
     * @protected
     * @param {string} tilemap The key of the tilemap.
     * @param {string} tileset The key of the tileset image for the tilemap.
     * @param {number} offsetX The x offset of each layer.
     * @param {number} offsetY The y offset of each layer.
     * @returns {Phaser.Tilemaps.Tilemap} The created map.
     */
    _createMap(tilemap, tileset, offsetX = 0, offsetY = 0) {
        // reset variables
        this.map.tilemap = null;
        this.map.layers = [];
        const map = this.add.tilemap(tilemap);
        const tiles = map.addTilesetImage(tileset);
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        let layerDepth = 0;
        for (const layerData of map.layers) {
            const layer = map.createLayer(
                layerData.name,
                tileset,
                offsetX,
                offsetY
            );
            // add layer for collision detection
            layer.setCollisionByProperty({ collides: true }, true);
            // set the depth according to the layer's order
            layer.setDepth(layerDepth);
            layerDepth += 10;
            // allow game objects to collide with layer
            this.physics.add.collider(this.characterGroup, layer);
            this.physics.add.collider(
                this.projectileGroup,
                layer,
                this._projectileOverlapCallback,
                undefined,
                this
            );
            this.map.layers.push(layer);
        }

        if (this.map.layers.length > 0) {
            // ensure all sprites are at least on top of the base layer
            // set base layer to PillarBase if exists
            let baseLayer = this.map.layers.find(
                (layer) => layer.layer.name === 'PillarBase'
            );
            // set base layer to Ground if exists
            if (baseLayer === undefined) {
                baseLayer = this.map.layers.find(
                    (layer) => layer.layer.name === 'Ground'
                );
            }
            // set base layer as lowest layer
            if (baseLayer === undefined) {
                baseLayer = this.map.layers[0];
            }
            for (const character of this.characterGroup.getChildren()) {
                if (character instanceof Phaser.GameObjects.Sprite) {
                    character.setDepth(baseLayer.depth + 1);
                }
            }
        }

        this.map.tilemap = map;
        this.map.tileset = tiles;

        // populate the pillars array for other classes to use
        this._findPillars();

        // set up EasyStar
        this._initEasyStar();

        return map;
    }

    /**
     * A utility method to create spikes.
     */
    _spawnSpikes() {
        // get spike spawn position data if exists
        const spikeLayer = this.map.tilemap.getObjectLayer('Spike');
        if (spikeLayer !== undefined && spikeLayer !== null) {
            // spawn spikes at specified positions, ignore _spikeCount
            for (const spike of spikeLayer.objects) {
                new Spike(
                    this,
                    spike.x,
                    spike.y,
                    Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
                    3
                );
            }
        } else {
            // spawn spikes at random positions
            for (let i = 0; i < this._spikeCount; ++i) {
                /** @type {number} */
                let x, y;
                /** @type {boolean} */
                let clear;

                // generate random x y until no object exists in generated coordinates
                do {
                    x =
                        Math.random() *
                            (this.map.tilemap.widthInPixels - 16 * 5) +
                        16 * 2;
                    y =
                        Math.random() *
                            (this.map.tilemap.heightInPixels - 16 * 5) +
                        16 * 2;

                    // ensure the spawn is at a complete tile (not in between tiles)
                    x = Math.floor(x);
                    x = x - (x % 16) + 8;
                    y = Math.floor(y);
                    y = y - (y % 16) + 2;

                    clear = true;
                    for (const body of this.physics.world.bodies.getArray()) {
                        if (body.hitTest(x, y)) {
                            clear = false;
                            break;
                        }
                    }
                } while (!clear);

                new Spike(this, x, y, Constants.RESOURCE.ATLAS.ALL_IN_ONE_2, 3);
            }
        }
    }

    /**
     * A utility method to create potions.
     */
    _spawnPotions() {
        const frames = {
            player: {
                small: 'flask_red',
                large: 'flask_big_red',
            },
            enemy: {
                small: 'flask_blue',
                large: 'flask_big_blue',
            },
        };
        for (const [type, potions] of Object.entries(this._potionCount)) {
            for (const [potion, count] of Object.entries(potions)) {
                for (let i = 0; i < count; ++i) {
                    /** @type {number} */
                    let x, y;
                    /** @type {boolean} */
                    let clear;

                    // generate random x y until no object exists in generated coordinates
                    do {
                        x =
                            Math.random() *
                                (this.map.tilemap.widthInPixels - 16 * 5) +
                            16 * 2;
                        y =
                            Math.random() *
                                (this.map.tilemap.heightInPixels - 16 * 5) +
                            16 * 2;
                        clear = true;
                        for (const body of this.physics.world.bodies.getArray()) {
                            if (body.hitTest(x, y)) {
                                clear = false;
                                break;
                            }
                        }
                    } while (!clear);

                    // spawn the potion
                    new Potion(
                        this,
                        x,
                        y,
                        Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
                        frames[type][potion],
                        type,
                        this._potionHealing[potion]
                    );
                }
            }
        }
    }

    /**
     * Find all colliding objects on the map and save their positions.
     * @protected
     */
    _findPillars() {
        // find all the pillars on the map
        const pillarLayer = this.map.layers.find(
            (layer) => layer.layer.name === 'Pillar'
        );
        if (pillarLayer === undefined) {
            return;
        }
        const pillars = pillarLayer.filterTiles(
            () => true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { isNotEmpty: true, isColliding: true }
        );

        for (const pillar of pillars) {
            this.pillars.push({
                x: pillar.getCenterX(),
                y: pillar.getCenterY(),
            });
        }
    }

    /**
     * Initialize EasyStar with map data.
     * @protected
     */
    _initEasyStar() {
        // set up the world grid with the pillar layer
        const grid = [];
        for (let y = 0; y < this.map.tilemap.height; ++y) {
            const col = [];
            for (let x = 0; x < this.map.tilemap.width; ++x) {
                col.push(
                    this.map.tilemap.getTileAt(x, y, true, 'Pillar').index
                );
            }
            grid.push(col);
        }
        this.easystar.setGrid(grid);

        // set up the acceptable (walkable) tiles
        const acceptableTiles = [-1];
        const tileset = this.map.tileset;
        const properties = tileset.tileProperties;
        for (let i = tileset.firstgid - 1; i < tileset.total; ++i) {
            if (properties[i]?.collides !== true) {
                acceptableTiles.push(i + 1);
            }

            // set the tile cost if any
            if (properties[i]?.cost !== undefined) {
                this.easystar.setTileCost(i + 1, properties[i].cost);
            }
        }
        this.easystar.setAcceptableTiles(acceptableTiles);

        // enable more optimal path-finding settings
        // this.easystar.enableDiagonals();
        // this.easystar.enableCornerCutting();
    }

    /**
     * A callback function used as ArcadePhysicsCallback.
     * Check the type of the colliding objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _characterOverlapCallback(object1, object2) {
        if (
            object1 instanceof PlayerCharacter &&
            object2 instanceof PlayerCharacter &&
            object1.type !== object2.type
        ) {
            if (object1.type !== 'player' && object2.type !== 'player') {
                // no player involved
                return;
            }
            let [player, enemy] = [object1, object2];
            if (player.type !== 'player') {
                [player, enemy] = [object2, object1];
            }
            enemy.collideAttacks(player);
        }
        if (object1 instanceof Character && object1.active) {
            object1.collidesWith(object2);
        }
        if (object2 instanceof Character && object2.active) {
            object2.collidesWith(object1);
        }
    }

    /**
     * A callback function used as ArcadePhysicsCallback.
     * Check the type of the overlapping objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _projectileOverlapCallback(object1, object2) {
        let projectile, character;
        if (object1 instanceof BasicProjectile) {
            projectile = object1;
        } else if (object2 instanceof BasicProjectile) {
            projectile = object2;
        } else {
            return;
        }

        if (object2 instanceof PlayerCharacter) {
            character = object2;
        } else if (object1 instanceof PlayerCharacter) {
            character = object1;
        } else {
            // collide with wall
            // destroy the projectile
            projectile.active = false;
            projectile.body?.setEnable(false);
            projectile.destroy();
            return;
        }

        if (projectile.type === character.type) {
            return;
        }

        // collide with enemy character and deal damage
        character.takeHit(projectile.damage, projectile);

        // destroy the projectile
        projectile.active = false;
        projectile.body?.setEnable(false);
        projectile.destroy();
    }

    /**
     * A callback function used as ArcadePhysicsCallback.
     * Check the type of the colliding objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _potionOverlapCallback(object1, object2) {
        let potion, character;
        if (object1 instanceof Potion) {
            potion = object1;
        } else if (object2 instanceof Potion) {
            potion = object2;
        } else {
            return;
        }

        if (object2 instanceof PlayerCharacter) {
            character = object2;
        } else if (object1 instanceof PlayerCharacter) {
            character = object1;
        } else {
            return;
        }

        // ignore potion for enemy team
        if (potion.type !== character.type) {
            return;
        }

        // heal the character
        character.heal(potion.healing);

        // destroy the potion
        potion.active = false;
        potion.body?.setEnable(false);
        potion.destroy();
    }

    /**
     * A callback function used as ArcadePhysicsCallback.
     * Check the type of the colliding objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _spikeOverlapCallback(object1, object2) {
        let spike, character;
        if (object1 instanceof Spike) {
            spike = object1;
        } else if (object2 instanceof Spike) {
            spike = object2;
        } else {
            return;
        }

        if (object2 instanceof PlayerCharacter) {
            character = object2;
        } else if (object1 instanceof PlayerCharacter) {
            character = object1;
        } else {
            return;
        }

        // ignore if spike not trusted out
        if (!spike.isDamaging) {
            return;
        }

        // damage the character
        character.takeHit(spike.damage, spike);

        // remember collision to prevent continuous damage
        character.collidesWith(spike);
    }

    /**
     * Render debug graphics
     * @protected
     */
    _debug() {
        const debugGraphics = this.add.graphics().setAlpha(0.5).setDepth(999);
        for (const [i, layer] of this.map.layers.entries()) {
            layer.renderDebug(debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(
                    (Math.random() * 255 * i) % 255,
                    (Math.random() * 255 * i) % 255,
                    (Math.random() * 255 * i) % 255,
                    255
                ),
                faceColor: new Phaser.Display.Color(
                    (Math.random() * 255 * i) % 255,
                    (Math.random() * 255 * i) % 255,
                    (Math.random() * 255 * i) % 255,
                    255
                ),
            });
        }
    }
}
