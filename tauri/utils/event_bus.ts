import { ref } from 'vue';

const eventBus = ref([]);

export function emitEvent(event, ...args) {
    eventBus.value.forEach((callback) => {
        if (callback.event === event) {
            callback.fn(...args);
        }
    });
}
export function onEvent(event, fn) {
    eventBus.value.push({ event, fn });
}
