import Database from './Database';

export default IS_DESKTOP ? () => {
    window.localStorage.clear();
} : () => {
    Database.close();
    RongDesktop.cleanStorage();
    window.localStorage.clear();
};
