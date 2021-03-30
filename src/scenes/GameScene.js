import Phaser from 'phaser';

import PlayerCharacter from '../characters/PlayerCharacter';

export default class GameScene extends Phaser.Scene {
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
        let map = this.add.tilemap('map_trial-1');
        map.addTilesetImage('tile_all-in-one-2');
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
        let groundLayer = map.createLayer('Ground', 'tile_all-in-one-2', 0, -6);
        groundLayer.setCollisionByProperty({ collides: true });
        let player = new PlayerCharacter(
            this,
            24,
            32,
            'atlas_all-in-one-2',
            'elf_m_idle_anim_f0',
            'elf_m'
        );
        let wallLayer = map.createLayer('Wall', 'tile_all-in-one-2', 0, -6);
        wallLayer.setCollisionByProperty({ collides: true });
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.physics.add.collider(player, groundLayer);
        this.physics.add.collider(player, wallLayer);
        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );
        this.cameras.main.startFollow(player, true, 0.1, 0.1);
        this.gameObjects.push(player);
        console.log(player);
    }

    update() {
        for (const gameObject of this.gameObjects) {
            gameObject.update();
        }
    }
}
