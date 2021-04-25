import Phaser from 'phaser';

import Constants from '../classes/Constants';

export class PreloaderScene extends Phaser.Scene {
    // * This class loads all needed resources for the game for efficiency.

    constructor() {
        super({ key: Constants.SCENE.PRELOADER });
    }

    preload() {
        this.load.image(
            Constants.RESOURCE.IMAGE.ALL_IN_ONE_2,
            'assets/tiles/all-in-one/2.png'
        );
        this.load.tilemapTiledJSON(
            Constants.RESOURCE.TILEMAP.TRIAL_1,
            'assets/maps/trial-1.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/tile_all-in-one-2.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_1,
            'assets/tiles/effects/attack-1.png',
            'assets/tiles/atlases/effect_attack-1.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_2,
            'assets/tiles/effects/attack-2.png',
            'assets/tiles/atlases/effect_attack-2.json'
        );
    }

    create() {
        this.scene.start(Constants.SCENE.TITLE);
    }
}
