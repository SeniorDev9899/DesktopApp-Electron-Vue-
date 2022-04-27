const { remote, ipcRenderer } = require('electron');

const language = remote.getGlobal('locale').getLocale();
const locale = require(`../../windows/locale/${language}`).tray; // eslint-disable-line import/no-dynamic-require

/* eslint-disable no-new, no-undef */
new Vue({
    el: '#trayApp',
    data: {
        list: [],
        renderList: [],
        locale: {},
        colorList: [
            '#74cfde',
            '#5585a5',
            '#3a91f3',
            '#f56b2f',
        ],
    },
    mounted() {
        const context = this;
        this.locale = locale;

        ipcRenderer.on('tray-data', (event, data) => {
            /* eslint-disable camelcase */
            let b_update = false;
            let i = 0;
            let temp = null;

            if (data.length === context.list.length) {
                let old_sum = 0; let
                    new_sum = 0;

                for (i = 0; i < data.length; i += 1) {
                    temp = data[i];
                    new_sum += temp.unreadMessageCount;
                }

                for (i = 0; i < context.list.length; i += 1) {
                    temp = context.list[i];
                    old_sum += temp.unreadMessageCount;
                }

                if (new_sum !== old_sum) b_update = true;
            } else {
                b_update = true;
            }

            if (b_update === true) {
                context.list = data;
                context.renderList = context.filteredList();
                // Once updated message come, show tray dlg for check
                /* eslint-disable max-len */
                const firstConversation = context.renderList.length > 0 ? context.renderList[0] : null;
                ipcRenderer.send('open-tray-dialog', firstConversation);

                if (firstConversation === null) ipcRenderer.send('destory-tray-dialog');

                setTimeout(() => {
                    ipcRenderer.send('close-tray-dialog');
                }, 3000); // 3s after, tray dialog automatically close
            }
        });
    },
    watch: {
        renderList(newVal) {
            const list = newVal;

            if (list.length === 0) {
                ipcRenderer.send('destory-tray-dialog');
                return;
            }

            for (let i = 0; i < list.length; i += 1) {
                const item = list[i];

                if (item.conversationType === 1 || item.conversationType === 7) {
                    // personal avatar
                    const { user } = item.latestMessage;
                    if (user.avatar === '') {
                        const word = this.getFirstChar(user.name);

                        list[i].svgElement = this.generateCharAvatar(word);
                        list[i].imageType = 1; // personal
                    } else {
                        // image avatar
                        list[i].svgElement = user.avatar;
                        list[i].imageType = 2; // personal
                    }
                }

                if (item.conversationType === 3) {
                    // group avatar
                    const { firstNine } = item.group;
                    let svgElement = '<svg viewBox=\'0 0 128 128\'>';

                    for (let j = 0; j < firstNine.length; j += 1) {
                        const temp = firstNine[j];
                        let gEle = '';

                        if (temp.avatar === undefined) {
                            // character avatar
                            const n_char = this.getFirstChar(temp.name);
                            const nColor = this.colorList[Math.floor(Math.random() * 4)];
                            gEle = this.generateGroupCharAvatar(n_char, j, nColor);
                        } else {
                            // image avatar
                            const imgUrl = temp.avatar;
                            gEle = this.generateGroupImgAvatar(imgUrl, j);
                        }

                        svgElement += gEle;
                    }

                    svgElement += '</svg>';

                    list[i].svgElement = svgElement;
                    list[i].imageType = 3; // group avatar
                }
            }

            this.renderList = list;
            // console.log(this.renderList);
        },
    },
    methods: {
        filteredList() {
            return this.list.filter(obj => obj.unreadMessageCount > 0 && (obj.conversationType === 1 || obj.conversationType === 3 || obj.conversationType === 7));
        },
        viewConversation(item) {
            ipcRenderer.send('open-conversation-tray', item);
        },
        formatConversation(item) {
            let result = '';
            const { content } = item;

            switch (item.messageType) {
            case 'TextMessage':
                result = content.content;
                break;
            case 'ImageMessage':
                result = '[Image]';
                break;
            case 'LocationMessage':
                result = `[Location] latitude=${content.latitude},longitude=${content.longitude}`;
                break;
            case 'RCCombineMessage':
                result = '[Combine Message]';
                break;
            default:
                break;
            }

            return result;
        },
        getFirstChar(str) {
            const regex = new RegExp(/[\u3400-\u9FBF]/);
            const res = regex.exec(str);

            if (res == null) {
                return str.charAt(0);
            }
            if (res.index === 0) {
                return res[0];
            }
            return str.charAt(0);
        },
        isChinese(str) {
            const regex = new RegExp(/[\u3400-\u9FBF]/);

            return regex.exec(str);
        },
        generateCharAvatar(word) {
        // default setting
            const size = 128; const r = 64; const bgColor = '#f56b2f'; const fontSize = 0.6; const fontWeight = 400; const
                txtColor = '#fff';

            return `${`<svg viewBox='0 0 ${size} ${size}'>`
               + `<rect fill='${bgColor}' width='${size}px' height='${size}px' cx='${r}' cy='${r}' r='${r}' rx='5' ry='5' />`
               + `<text x='50%' y='50%' dominant-baseline="middle" alignment-baseline="middle" text-anchor="middle" font-size="${Math.round(size * fontSize)}" font-weight="${fontWeight}" stroke="${txtColor}" fill="${txtColor}" dy=".15em">`}${
                word
            }</text>`
               + '</svg>';
        },
        generateGroupCharAvatar(word, index, bgColor) {
            const nIndex = this.getIndex(index); // 0 : row, 1 : col

            return `${'<g>'
              + `<rect x='${nIndex[0]}' y='${nIndex[1]}'  width='42px' height='42px' fill='${bgColor}'/>`
              + `<text x='${nIndex[0] + 21}' y='${nIndex[1] + 21}' dominant-baseline="middle" alignment-baseline="middle" text-anchor="middle" font-size="20" font-weight="200" stroke="#FFF" fill="#FFF" dy=".3em">`}${
                word
            }</text>`
              + '</g>';
        },
        generateGroupImgAvatar(img, index) {
            const nIndex = this.getIndex(index); // 0 : row, 1 : col
            return '<g>'
                + `<image x='${nIndex[0]}' y='${nIndex[1]}' width="42" height="42" href='${img}' />`
                + '</g>';
        },
        getIndex(index) {
            const row = parseInt(index / 3, 10);
            const col = index % 3;
            let r1; let
                c1;

            switch (row) {
            case 0:
                r1 = 0;
                break;
            case 1:
                r1 = 43;
                break;
            case 2:
                r1 = 86;
                break;
            default:
                break;
            }

            switch (col) {
            case 0:
                c1 = 0;
                break;
            case 1:
                c1 = 43;
                break;
            case 2:
                c1 = 86;
                break;
            default:
                break;
            }

            return [c1, r1];
        },
        closeTrayDialog() {
            ipcRenderer.send('close-tray-dialog');
        },
    },
});
