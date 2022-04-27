import user from './contact/user';
import setting from './setting/layout';
import setPassword from './set-password';
import addPin from './pin/add-pin';
import addAttachment from './pin/add-attachment';
import addReceivers from './pin/add-receiver';
import getFileHelper from './file-helper';
import approvalDetail from './approval-detail';
import verifyFriend from './friend/verify-friend';
import userRequest from './friend/user-request';
import addFriend from './friend/add-friend';
import deviceLocking from './device-locking';
import screenLocking from './screen-locking';
import groupRemoveMembers from './group/removemembers';
import createGroup from './group/create';
import getAtPanel from './at-panel';

import previewImage from './conversation/preview-image';
import ack from './conversation/ack';
import card from './conversation/card';
import forward from './conversation/forward';
import groupBanned from './conversation/group-banned';
import groupQRCode from './conversation/group-qrcode';
import groupTransfer from './conversation/group-transfer';

import collectDetail from './collect/collect-detail';
import collect from './collect/collect-dialog';

import addSealRtcReceivers from './seal-meeting/add-receiver';
import updateVersionTip from './update-version-tip';
import sealmeetingSetting from './seal-meeting/setting';
import setMeetingPassword from './seal-meeting/password';

export default {
    user,
    setting,
    setPassword,
    addPin,
    addAttachment,
    addReceivers,
    getFileHelper,
    approvalDetail,
    verifyFriend,
    userRequest,
    addFriend,
    deviceLocking,
    screenLocking,
    groupRemoveMembers,
    createGroup,
    getAtPanel,

    card,
    ack,
    previewImage,
    forward,
    groupBanned,
    groupQRCode,
    groupTransfer,

    collectDetail,
    collect,

    addSealRtcReceivers,
    updateVersionTip,
    sealmeetingSetting,
    setMeetingPassword,

};
