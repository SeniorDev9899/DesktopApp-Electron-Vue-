const checkIndexOutBound = (index, bound) => index > -1 && index < bound;

export default class ObserverList {
    observerList = [];

    add(observer, force) {
        if (force) {
            this.observerList.length = 0;
        }
        this.observerList.push(observer);
    }

    get(index) {
        if (checkIndexOutBound(index, this.observerList.length)) {
            return this.observerList[index];
        }
        return undefined;
    }

    count() {
        return this.observerList.length;
    }

    removeAt(index) {
        if (checkIndexOutBound(index, this.observerList.length)) this.observerList.splice(index, 1);
    }

    remove(observer) {
        if (!observer) {
            this.observerList.length = 0;
            return;
        }
        const observerList = Object.prototype.toString.call(observer) === '[object Function]' ? [observer] : observer;
        for (let i = 0, len = this.observerList.length; i < len; i += 1) {
            for (let j = 0; j < observerList.length; j += 1) {
                if (this.observerList[i] === observerList[j]) {
                    this.removeAt(i);
                    break;
                }
            }
        }
    }

    notify(...val) {
        for (let i = 0, len = this.observerList.length; i < len; i += 1) {
            /**
             * 38817 - 【转让群主】群主将群全员禁言后，转让群主给其它人 RCE 蓝屏
             */
            if (this.observerList[i]) {
                this.observerList[i](...val);
            }
        }
    }

    indexOf(observer, startIndex) {
        let i = startIndex || 0;
        const len = this.observerList.length;
        while (i < len) {
            if (this.observerList[i] === observer) {
                return i;
            }
            i += 1;
        }
        return -1;
    }
}
