import ObserverList from './ObserverList';

export default class Watcher {
    observerList = new ObserverList();

    watch(handle) {
        this.observerList.add(handle);
    }

    unwatch(handle) {
        this.observerList.remove(handle);
    }
}
