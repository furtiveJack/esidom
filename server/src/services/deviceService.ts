import httpForwarder from '../forwarders/httpForwarder';
import socketForwarder from '../forwarders/socketForwarder';
import { Device } from '../types/device';
import { HaDevice, HaEntity, HaStateResponse } from '../types/haTypes';
import entityService from './entityService';

class DeviceService {

    async getDevices(): Promise<Device[]> {
        const devices: HaDevice[] = await socketForwarder.forward({ type: 'config/device_registry/list' });
        const entities: HaEntity[] = await socketForwarder.forward({ type: 'config/entity_registry/list' });
        const states: HaStateResponse[] = await socketForwarder.forward({ type: 'get_states' });
        return devices.map((d: HaDevice) => {
            const device: Device = {
                id: d.id,
                name: d.name,
                model: d.model,
                entities: entityService.filterEntitiesByDevice(d.id, entities, states),
                automations: [],
                nameByUser: d.name_by_user ?? '',
                disabledBy: d.disabled_by ?? '',
                areaId: d.area_id ?? '',
            };
            // TODO: device.automations = populate automations
            return device;
        });
    }

    async getDeviceById(id: string) {
        const devices: Device[] = await this.getDevices();
        return devices.find((d: Device) => d.id === id);
    }

    async pairdevice(): Promise<any> {

        await httpForwarder.post<any>('/api/services/zwave/add_node', null);
        await socketForwarder.forward({
            type: 'call_service',
            domain: 'mqtt',
            service: 'publish',
            service_data: {
                topic: 'zigbee2mqtt/bridge/request/permit_join',
                payload_template: '"{"value": true}"',
            },
        });

    }

}

export default new DeviceService();
