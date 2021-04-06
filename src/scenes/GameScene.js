import Phaser from 'phaser';

import Constants from '../classes/Constants';
import { Character } from '../classes/Character';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { HumanControlState } from '../states/HumanControlState';
import { StrongAIControlState } from '../states/StrongAIControlState';

export class GameScene extends Phaser.Scene {
    /** @type {{tilemap: Phaser.Tilemaps.Tilemap, layers: Phaser.Tilemaps.TilemapLayer[]}} */
    map = {
        tilemap: null,
        layers: [],
    };

    /** @type {Phaser.Physics.Arcade.Group} A group of game objects with physics. */
    physicsGroup;

    /** @type {PlayerCharacter} The current human controlled character. */
    currentHumanControlledCharacter;

    constructor() {
        super({ key: Constants.SCENE.GAME });
    }

    init() {
        this.physicsGroup = this.physics.add.group();
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
                type: 'player',
            }
        );
        // manually adjust the collision body size and offset
        player.body.setSize(player.width * 0.7, player.height * 0.8, true);
        player.body.setOffset(
            player.body.width * 0.25,
            player.body.height * 0.25
        );

        const enemy = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'knight_m_idle_anim_f0',
            {
                name: 'knight_m',
                controlState: StrongAIControlState,
                collideAttackDamage: 1,
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        enemy.body.setSize(enemy.width * 0.75, enemy.height * 0.65, true);
        enemy.body.setOffset(enemy.body.width * 0.15, enemy.body.height * 0.5);

        // set reference for GameUIScene to display health
        this.currentHumanControlledCharacter = player;

        // make each of the game objects collide with each other
        this.physics.add.collider(
            this.physicsGroup,
            this.physicsGroup,
            this._physicsObjectCollideCallback,
            undefined,
            this
        );

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
        enemy.setX(this.map.tilemap.widthInPixels * 0.5);
        enemy.setY(this.map.tilemap.heightInPixels * 0.5 + enemy.height * 0.5);

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
        for (const physicsObject of this.physicsGroup.getChildren()) {
            physicsObject.update();
            // count active game objects for determing end-game situations
            if (
                physicsObject.active &&
                physicsObject instanceof PlayerCharacter
            ) {
                if (typeof count[physicsObject.type] !== 'number') {
                    count[physicsObject.type] = 0;
                }
                ++count[physicsObject.type];
            }
        }
        // check end-game situations and transition to game end scene if ended
        if (count.player === 0 || count.enemy === 0) {
            // ? potentially use launch(), but need to pause current scenes
            this.scene.get(Constants.SCENE.GAME_UI).scene.stop();
            this.scene.start(Constants.SCENE.GAME_END, {
                isVictory: count.enemy === 0,
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
        map.addTilesetImage(tileset);
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
            for (const physicsObject of this.physicsGroup.getChildren()) {
                this.physics.add.collider(physicsObject, layer);
            }
            this.map.layers.push(layer);
        }
        // ensure all sprites are at least on top of the lowest layer
        for (const physicsObject of this.physicsGroup.getChildren()) {
            if (physicsObject instanceof Phaser.GameObjects.Sprite) {
                physicsObject.setDepth(this.map.layers[0].depth + 1);
            }
        }
        this.map.tilemap = map;
        return map;
    }

    /**
     * A callback function used as ArcadePhysicsCallback.
     * Check the type of the colliding objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _physicsObjectCollideCallback(object1, object2) {
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
            player.collideAttacks(enemy);
            // TODO: remove start
            enemy.collideAttacks(player);
            // TODO: remove end
        }
        if (object1 instanceof Character && object1.active) {
            object1.collidesWith(object2);
        }
        if (object2 instanceof Character && object2.active) {
            object2.collidesWith(object1);
        }
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
