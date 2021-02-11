import axios, { AxiosResponse } from 'axios';
import { Room } from '../src/types/room';

const mock: Room = expect.objectContaining({
    roomId: expect.any(String),
    name: expect.any(String),
    devices: expect.any(Array),
    automations: expect.any(Array),
} as Room);

const baseUrl: string = 'http://localhost:3000';

describe('Create room controller test', () => {
    test('Should can\'t create room with no name', async () => {
        await expect(async () => {
            await axios.post(`${baseUrl}/room`);
        }).rejects.toThrow().catch((err) => {
            expect(err).toHaveProperty('response');
            const res = err.response;
            expect(res).toHaveProperty('status');
            expect(res.status).toBe(400);
        });
    });

    test('Should can\'t create room with empty name', async () => {
        await expect(async () => {
            await axios.post(`${baseUrl}/room`, { name: '' });
        }).rejects.toThrow().catch((err) => {
            expect(err).toHaveProperty('response');
            const res = err.response;
            expect(res).toHaveProperty('status');
            expect(res.status).toBe(400);
        });
    });

    test('Should create a room "Cuisine"', async () => {
        const name = Math.random().toString(26).slice(2);
        const res: AxiosResponse<any> = await axios.post(`${baseUrl}/room`, { name });
        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toMatchObject(mock);
        expect(res.data.name).toBe(name);
    });

});

describe('Get room controller test', () => {
    test('Get room', async () => {
        const uname = Math.random().toString(26).slice(2);
        const room: AxiosResponse<any> = await axios.post(`${baseUrl}/room`, { name: uname });
        const res: AxiosResponse<any> = await axios.get(`${baseUrl}/room/${room.data.roomId}`);
        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toMatchObject(mock);
        expect(res.data.name).toBe(uname);
    });

});
