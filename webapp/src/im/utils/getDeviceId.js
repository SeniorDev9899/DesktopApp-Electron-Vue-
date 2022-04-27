import isEmpty from './isEmpty';
import cache from './cache';
import createUid from './createUid';

export default function getDeviceId() {
    let deviceId = cache.get('deviceId');
    if (isEmpty(deviceId)) {
        deviceId = createUid();
        cache.set('deviceId', deviceId);
    }
    return deviceId;
}
