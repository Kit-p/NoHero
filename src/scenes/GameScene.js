import Phaser from 'phaser';

import PlayerCharacter from '../characters/PlayerCharacter';

export default class GameScene extends Phaser.Scene {
    /** @type {{tilemap: Phaser.Tilemaps.Tilemap, layers: Phaser.Tilemaps.TilemapLayer[]}} */
    map = {
        tilemap: null,
        layers: [],
    };

    /** @type {Phaser.GameObjects.GameObject[]} */
    gameObjects = [];

    constructor() {
        super({
            key: 'scene_game',
            active: true,
            visible: true,
        });
    }

    init() {
        console.log(this);
    }

    preload() {
        this.load.image('tile_all-in-one-2', 'assets/tiles/all-in-one/2.png');
        this.load.tilemapTiledJSON('map_trial-1', 'assets/maps/trial-1.json');
        this.load.atlas(
            'atlas_all-in-one-2',
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/all-in-one-2.json'
        );
    }

    create() {
        const player = new PlayerCharacter(
            this,
            24,
            40,
            'atlas_all-in-one-2',
            'elf_m_idle_anim_f0',
            'elf_m'
        );
        this.gameObjects.push(player);

        // create the map for this scene
        this._createMap('map_trial-1', 'tile_all-in-one-2', 0, -6);
    }

    update() {
        for (const gameObject of this.gameObjects) {
            gameObject.update();
        }
    }

    /**
     * A utility method to create a map and the layers, also handles adding collisions with game objects.
     * @param {string} tilemap The key of the tilemap.
     * @param {string} tileset The key of the tileset image for the tilemap.
     * @param {number} offsetX The x offset of each layer.
     * @param {number} offsetY The y offset of each layer.
     * @returns {Phaser.Tilemaps.Tilemap} The created map.
     */
    _createMap(tilemap, tileset, offsetX = 0, offsetY = 0) {
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
            for (const gameObject of this.gameObjects) {
                this.physics.add.collider(gameObject, layer);
            }
            this.map.layers.push(layer);
        }
        // ensure all sprites are at least on top of the lowest layer
        for (const gameObject of this.gameObjects) {
            if (gameObject instanceof Phaser.GameObjects.Sprite) {
                gameObject.setDepth(this.map.layers[0].depth + 1);
            }
        }
        this.map.tilemap = map;
        return map;
    }
}
