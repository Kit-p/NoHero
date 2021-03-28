import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
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
        this.load.tilemapTiledJSON('map_trial-01', 'assets/maps/trial-01.json');
        this.load.atlas(
            'atlas_all-in-one-2',
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/all-in-one-2.json'
        );
    }

    create() {
        let map = this.add.tilemap('map_trial-01');
        map.addTilesetImage('tile_all-in-one-2');
        map.createLayer('Ground', 'tile_all-in-one-2', 0, -6);
        map.createLayer('Wall', 'tile_all-in-one-2', 0, -6);
        map.setCollisionByProperty({ collides: true });
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
        let elf_m = this.add.sprite(24, 32, 'atlas_all-in-one-2', 0);
        this.anims.create({
            key: 'elf_m_idle_anim',
            frameRate: 4,
            repeat: -1,
            frames: this.anims.generateFrameNames('atlas_all-in-one-2', {
                prefix: 'elf_m_idle_anim_f',
                start: 0,
                end: 3,
                zeroPad: 1,
            }),
        });
        elf_m.play('elf_m_idle_anim');
    }
}
