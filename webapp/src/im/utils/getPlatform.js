import system from '../system';

// @return 'web' or 'OSX' or 'windows'
export default function getPlatform() {
    const platform = system.platform;
    if (platform === 'darwin') {
        return 'OSX';
    } if (platform.indexOf('web') === 0) {
        return 'web';
    }
    return 'windows';
}
