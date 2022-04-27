import getUsernameFormat from './getUsernameFormat';

export default function getSearchUsername(user) {
    const tmpUser = user || {};
    return getUsernameFormat(tmpUser.name, tmpUser.alias);
}
