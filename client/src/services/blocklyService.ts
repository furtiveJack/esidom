/* eslint-disable no-param-reassign */
import type { WorkspaceSvg } from 'blockly';
import Blockly from 'blockly';
import BlockFactory from 'blockly';
import esidomGenerator, { EntityTypeEnum } from '../routes/automation/esidomGenerator';
import EntityService from './entityService';
import type { Entity } from '../../types/entityType';
import type { Service } from '../../types/serviceType';
import type { EntityWithServices } from '../../types/entityWithServicesType';
import type { BlocksDefinitions } from '../routes/automation/esidomBlocks';
import COLORS from '../routes/automation/esidomConst';
import BlocklyObjects from '../routes/automation/blocklyObject';
import type { ObjectBlock } from '../../types/objectsBlockType';
import type { Automation } from '../../types/automationType';
import type { EsidomBlockType } from '../../types/esidomBlockType';
import EsidomBlockGenerator from '../routes/automation/esidomBlockGenerator';

interface Type {
    name: EntityTypeEnum;
    friendlyName: string,
}

const TYPES: Type[] = [
    {
        name: 'binary_sensor',
        friendlyName: 'Capteur Binaire',
    },
    {
        name: 'person',
        friendlyName: 'Personne',
    },
    {
        name: 'weather',
        friendlyName: 'Météo',
    },
    {
        name: 'zwave',
        friendlyName: 'Zwave',
    },
    {
        name: 'sensor',
        friendlyName: 'Capteur',
    },
    {
        name: 'light',
        friendlyName: 'Lampe',
    },
    {
        name: 'automation',
        friendlyName: 'Routine',
    },
    {
        name: 'switch',
        friendlyName: 'Interrupteur',
    },
    {
        name: 'media_player',
        friendlyName: 'Lecteur multimédia',
    },
];

export default class BlocklyService {
    private workspace: WorkspaceSvg;

    constructor(workspace: WorkspaceSvg) {
        this.workspace = workspace;
    }

    convertToBlock(alias = 'test', description = 'test description'): void {
        const code = esidomGenerator.workspaceToCode(this.workspace);

        try {
            const json = JSON.parse(code);
            json.alias = alias;
            json.description = description;

            // TODO: send the json to HA
            console.log(JSON.stringify(json));
        } catch (e) {
            console.log(e);
        }
    }

    loadAutomation(xml: string): void {
        BlockFactory.mainWorkspace.clear();
        const block: Element = Blockly.Xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(block, this.workspace);
    }

    static async initBlockly(): Promise<void> {
        const entities = await EntityService.getEntities();
        const services = await EntityService.getServices();

        // We create the object_action Block
        this.createEntities(entities, services);
        // We create all the object Blocks
        this.createObjects(entities);
    }

    static createEntities(entities: Entity[], services: Service[]): void {
        const entityWithServices: EntityWithServices[] = [];

        entities.forEach((entity: Entity) => {
            const tmpServices: string[] = services
                .filter((service: Service) => service.name.split('.')[0] === entity.type)
                .map((service: Service) => service.name);

            if (tmpServices.length > 0) {
                entityWithServices.push({
                    id: entity.id,
                    name: entity.name,
                    services: tmpServices,
                });
            }
        });

        const block = Blockly.Blocks as unknown as BlocksDefinitions;
        // Create object_action Block
        block.object_action = {
            init() {
                const tmpDropdown1 = entityWithServices.map((
                    entity: EntityWithServices,
                    index: number,
                ) => {
                    if (entity.name === null || entity.name === '') {
                        entity.name = 'Nom inconnu';
                    }
                    return [entity.name, `${index.toString()}:${entity.id}:${entity.name}`];
                });

                const dropdown1 = tmpDropdown1.length > 0 ? tmpDropdown1 : [['Pas de nom', 'Pas de nom']];

                this.jsonInit?.(
                    {
                        type: 'object_action',
                        message0: 'Objet : %1',
                        args0: [
                            {
                                type: 'field_dropdown',
                                name: 'Entities',
                                options: dropdown1,
                            },

                        ],
                        inputsInline: false,
                        previousStatement: 'Action',
                        nextStatement: 'Action',
                        colour: COLORS.HUE_ORANGE,
                        tooltip: '',
                        helpUrl: '',
                        mutator: 'object_action_esidom_mutator',
                    },
                );
            },
        };

        const OBJECT_ACTION_MUTATOR_MIXIN = {

            mutationToDom(): HTMLElement {
                const container = document.createElement('mutation');
                const entitiesInput: number = parseInt((this as EsidomBlockType).getFieldValue('Entities').split(':')[0], 10);
                container.setAttribute('entities_input', entitiesInput.toString());
                return container;
            },

            domToMutation(xmlElement: HTMLElement): void {
                const attribute = xmlElement.getAttribute('entities_input');
                const index = attribute != null ? parseInt(attribute, 10) : 0;
                this.objectActionUpdateShape(index);
            },

            objectActionUpdateShape(index: number): void {
                const newDropdown = entityWithServices[index]
                    ?.services.map((service: string) => [service.split('.')[1], service])
                    ?? [['Action inconnu', 'Action inconnu']];

                (this as EsidomBlockType).removeInput?.('services', true);
                (this as EsidomBlockType).appendDummyInput?.('services')
                    .appendField?.('Action :')
                    .appendField?.(
                        new Blockly.FieldDropdown(newDropdown),
                        'Services',
                    );
            },
        };

        const OBJECT_ACTION_MUTATION_EXTENSION = function mutate(this: EsidomBlockType) {
            this.getField('Entities').setValidator((option: string) => {
                const index: number = parseInt(option.split(':')[0], 10);
                this.objectActionUpdateShape(index);
            });
        };

        try {
            Blockly.Extensions.registerMutator('object_action_esidom_mutator',
                OBJECT_ACTION_MUTATOR_MIXIN,
                OBJECT_ACTION_MUTATION_EXTENSION);
        } catch (error) {
            console.log(error);
        }
    }

    static createObjects(entities: Entity[]): void {
        const block = Blockly.Blocks as unknown as BlocksDefinitions;
        TYPES.forEach((type: Type) => {
            const typeName = type.name;
            const options: string[][] = entities
                .filter((entity: Entity) => entity.type === typeName)
                .map((entity: Entity) => [entity.name === '' ? 'Pas de nom' : entity.name, entity.id]);

            const blocklyObjects = new BlocklyObjects(
                typeName,
                typeName.charAt(0).toUpperCase() + typeName.slice(1),
                type.friendlyName,
                parseInt(COLORS.HUE_RED, 10),
            );

            blocklyObjects.addOptions(options);
            const objectBlock: ObjectBlock = blocklyObjects.getJson();

            // Create object Block
            block[type.name] = {
                init() {
                    this.jsonInit?.(objectBlock);
                },
            };
        });
    }

    static automationToXml(automation: Automation): string {
        let xml = `
            <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="esidom_automation" deletable="false" movable="false">
        `;

        automation.trigger.forEach((trigger) => {
            const plf = trigger.platform;

            xml += `
                <value name="Trigger">
                ${EsidomBlockGenerator.platform[plf](trigger)};
                </value>
            `;
        });

        automation.condition.forEach((condition) => {
            const cdt = condition.condition;

            xml += `
                <value name="Condition">;
                ${EsidomBlockGenerator.condition[cdt](condition)}
                </value>
            `;
        });

        automation.action.forEach((action) => {
            const { alias } = action;
            const { service } = action;

            xml += `
                <value name="Action">
                <block type="object_action">
                <field name="Entities">${alias}</field>
                <field name="Services">${service}</field>
                </block>
                </value>
            `;
        });

        xml += '</block></xml>';

        return xml;
    }
}
