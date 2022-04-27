<template>
    <div class="multi-select-icons">
        <div class="multi-onebyone-forward" :class="isMergeAvailable ? 'active' : 'inactive'" @click="onebyoneForward">
            <div class="img" :title="locale.btns.onebyoneForward"></div>
            <em>{{locale.btns.onebyoneForward}}</em>
        </div>
        <div class="multi-merge-forward" :class="[(isMergeAvailable ? 'active' : 'inactive'), (lang === 'English' ? 'margin-right-52' : '')]" @click="mergeForward">
            <div class="img" :title="locale.btns.mergeForward"></div>
            <em>{{locale.btns.mergeForward}}</em>
        </div>
        <div class="multi-collect" :class="[(isMergeAvailable ? 'active' : 'inactive'), (lang === 'English' ? 'margin-right-80' : '')]" @click="collect">
            <div class="img" :title="locale.btns.collect"></div>
            <em>{{locale.btns.collect}}</em>
        </div>
        <div class="multi-delete" :class="isMergeAvailable ? 'active' : 'inactive'" @click="deleteMessage">
            <div class="img" :title="locale.btns.remove"></div>
            <em>{{locale.btns.remove}}</em>
        </div>
        <div class="multi-panel-quote">
            <div class="img" @click="quote"></div>
        </div>
    </div>
</template>
<script src='./multiselect-panel.js'></script>
<style lang="scss" scoped>
.multi-select-icons {
    margin-top: 30px;
    text-align: center;
    .multi-onebyone-forward,
    .multi-merge-forward,
    .multi-collect,
    .multi-delete {
        cursor: pointer;
        display: inline-block;
        margin-right: 25px;
        .img {
            margin: 0px auto;
            width: 45px;
            height: 45px;
        }
        em {
            display: block;
            margin-top: 5px;
            text-align: center;
        }
    }
    .multi-onebyone-forward {
        &.inactive {
            .img {
                background-image: url(/css/images/mulsel_onebyone.png);
            }
            em {
                color: #777;
            }
        }
        &.active {
            .img {
                background-image: url(/css/images/mulsel_onebyone_active.png);
                border: 1px solid #fff;
                border-radius: 50%;
            }
            .img:hover {
                border: 1px solid #a5a5a5;
                border-radius: 50%;
            }
            em {
                color: #333;
            }
        }
    }
    .multi-merge-forward {
        &.inactive {
            .img {
                background-image: url(/css/images/mulsel_merge.png);
            }
            em {
                color: #777;
            }
        }
        &.active {
            .img {
                background-image: url(/css/images/mulsel_merge_active.png);
                border: 1px solid #fff;
                border-radius: 50%;
            }
            .img:hover {
                border: 1px solid #a5a5a5;
                border-radius: 50%;
            }
            em {
                color: #333;
            }
        }
    }
    .multi-collect {
        &.inactive {
            .img {
                background-image: url(/css/images/mulsel_collect.png);
            }
            em {
                color: #777;
            }
        }
        &.active {
            .img {
                background-image: url(/css/images/mulsel_collect_active.png);
                border: 1px solid #fff;
                border-radius: 50%;
            }
            .img:hover {
                border: 1px solid #a5a5a5;
                border-radius: 50%;
            }
            em {
                color: #333;
            }
        }
    }
    .multi-delete {
        &.inactive {
            .img {
                background-image: url(/css/images/mulsel_del.png);
            }
            em {
                color: #777;
            }
        }
        &.active {
            .img {
                background-image: url(/css/images/mulsel_del_active.png);
                border: 1px solid #fff;
                border-radius: 50%;
            }
            .img:hover {
                border: 1px solid #a5a5a5;
                border-radius: 50%;
            }
            em {
                color: #333;
            }
        }
    }
    .multi-panel-quote {
        display: inline-block;
        height: 48px;
        .img {
            background-image: url(/css/images/mulsel_quote.png);
            width: 20px;
            height: 20px;
        }
    }
    .margin-right-52 {
        margin-right: 52px;
    }
    .margin-right-80 {
        margin-right: 80px;
    }
}
</style>
