/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */

import Watcher from './core/Watcher';

export default (RongIM) => {
    RongIM.dataModel.Account = new Watcher();
};
