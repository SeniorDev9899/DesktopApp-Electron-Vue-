import initCore from './core';
import initStatus from './status';
import initFile from './file';
import initFriend from './friend';
import initUser from './user';
import initOrg from './organization';
import initGroup from './group';
import initMsg from './message';
import initConver from './conversation';
import initStar from './star';
import initPin from './pin';
import initGroupNotice from './group-notice';
import initContact from './contact';
import initPublic from './public';
import initDevices from './device';
import initAccount from './account';
import initCollect from './collect';
import initVersionChecker from './app-version-check';
import initMeeting from './meeting';

export default (RongIM) => {
    initCore(RongIM);
    initStatus(RongIM);
    initFile(RongIM);
    initFriend(RongIM);
    initUser(RongIM);
    initOrg(RongIM);
    initGroup(RongIM);
    initMsg(RongIM);
    initConver(RongIM);
    initStar(RongIM);
    initPin(RongIM);
    initGroupNotice(RongIM);
    initContact(RongIM);
    initPublic(RongIM);
    initDevices(RongIM);
    initAccount(RongIM);
    initCollect(RongIM);
    initVersionChecker(RongIM);
    initMeeting(RongIM);
};