import Cache from "./Cache";

export default class Caches {
    private static caches: Map<string, Cache> = new Map();

    static get Count(): number {
        return this.caches.size;
    }

    static clear() {
        this.caches.clear();
    }

    static async get(conferenceId: string): Promise<Cache> {
        let cache = this.caches.get(conferenceId);

        if (!cache) {
            cache = new Cache(conferenceId);
            await cache.initialise();
            this.caches.set(conferenceId, cache);
        }

        return cache;
    }
}
