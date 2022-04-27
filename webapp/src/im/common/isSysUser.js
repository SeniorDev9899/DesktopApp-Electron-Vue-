import UserType from './UserType';

export default function isSysUser(user) {
    return user.type === UserType.OTHERAPP;
}
