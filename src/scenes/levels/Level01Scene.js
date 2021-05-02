import Constants from '../../classes/Constants';
import { GameScene } from '../GameScene';
import { PlayerCharacter } from '../../characters/PlayerCharacter';
import { HumanControlState } from '../../states/HumanControlState';
import { StrongAIControlState } from '../../states/StrongAIControlState';

/**
 * @extends GameScene
 */
export class Level01Scene extends GameScene {
    constructor() {
        super({ key: Constants.SCENE.LEVELS[0] }, Constants.SCENE.LEVELS?.[1]);

        // set level specific constants
        this._potionCount = {
            player: {
                small: 3,
                large: 1,
            },
            enemy: {
                small: 6,
                large: 2,
            },
        };

        this._potionHealing = {
            small: 2,
            large: 6,
        };

        this._spikeCount = 2;
    }

    /**
     * @override
     */
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
}
