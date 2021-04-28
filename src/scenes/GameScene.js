import Phaser from 'phaser';

import Constants from '../classes/Constants';
import { Character } from '../classes/Character';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { HumanControlState } from '../states/HumanControlState';
import { StrongAIControlState } from '../states/StrongAIControlState';
import { BasicProjectile } from '../projectiles/BasicProjectile';

export class GameScene extends Phaser.Scene {
    /** @type {{tilemap: Phaser.Tilemaps.Tilemap, layers: Phaser.Tilemaps.TilemapLayer[]}} */
    map = {
        tilemap: null,
        layers: [],
    };

    /** @type {Phaser.Physics.Arcade.Group} A group of characters with physics. */
    characterGroup;

    /** @type {Phaser.Physics.Arcade.Group} A group of projectiles with physics. */
    projectileGroup;

    /** @type {PlayerCharacter} The current human controlled character. */
    currentHumanControlledCharacter;

    constructor() {
        super({ key: Constants.SCENE.GAME });
    }

    init() {
        this.characterGroup = this.physics.add.group();
        this.projectileGroup = this.physics.add.group();
        // make each of the game objects collide with each other
        this.physics.add.collider(
            this.characterGroup,
            this.characterGroup,
            this._characterCollideCallback,
            undefined,
            this
        );
        this.physics.add.collider(
            this.projectileGroup,
            this.characterGroup,
            this._projectileCollideCallback,
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
                maxHealth: 18,
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
                maxHealth: 12,
                collideAttackDamage: 6,
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        enemy.body.setSize(enemy.width * 0.75, enemy.height * 0.65, true);
        enemy.body.setOffset(enemy.body.width * 0.15, enemy.body.height * 0.5);

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
        // check end-game situations and transition to game end scene if ended
        if (count.player === 0 || count.enemy === 0) {
            // ? potentially use launch(), but need to pause current scenes
            this.scene.get(Constants.SCENE.GAME_UI).scene.stop();
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
            this.physics.add.collider(this.characterGroup, layer);
            this.physics.add.collider(
                this.projectileGroup,
                layer,
                this._projectileCollideCallback,
                undefined,
                this
            );
            this.map.layers.push(layer);
        }
        // ensure all sprites are at least on top of the lowest layer
        for (const character of this.characterGroup.getChildren()) {
            if (character instanceof Phaser.GameObjects.Sprite) {
                character.setDepth(this.map.layers[0].depth + 1);
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
    _characterCollideCallback(object1, object2) {
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
     * Check the type of the colliding objects and call corresponding methods if necessary.
     * @protected
     * @type {ArcadePhysicsCallback}
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object1
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object2
     */
    _projectileCollideCallback(object1, object2) {
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
        character.takeHit(projectile.damage, projectile.body);

        // destroy the projectile
        projectile.active = false;
        projectile.body?.setEnable(false);
        projectile.destroy();
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
