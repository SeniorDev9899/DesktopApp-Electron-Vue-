import { h, render } from 'vue';
import DialogConstructor from './DialogBase.vue';
import type { ComponentPublicInstance } from 'vue';
import { IDialogCompoProps, IDialogAttrs, IDialogResult } from './types';

const showDialog = (options:object):ComponentPublicInstance<{dialogVisible:boolean}> => {
  // 创建容器
  const container = document.createElement('div');
  // 将控件props都直接附值
  const vnode = h(DialogConstructor, options);
  render(vnode, container)    
  if (container.firstElementChild) {
    document.body.appendChild(container.firstElementChild);
  }
  const vm = vnode.component!.proxy as ComponentPublicInstance<{dialogVisible:boolean}>
  // 控件没有定义props的，都扔到attrs身上
  // for (const prop in options) {
  //   if (hasOwn(options, prop) && !hasOwn(vm.$props, prop)) {
  //     vm[prop] = options[prop]
  //   }
  // }
  return vm;
};

const dialogMap:Map<string,ComponentPublicInstance<{dialogVisible:boolean}>> = new Map()
const RongDialog = {
  show: (compoName: string,dialogAttrs?:IDialogAttrs, compoProps?:IDialogCompoProps):Promise<IDialogResult> => {
    RongDialog.close(compoName)
    return new Promise<IDialogResult>((resolve, reject) => {
      const options = {'compoName':compoName,dialogAttrs,compoProps,'resolve':resolve}
      const dialog = showDialog(options)
      dialogMap.set(compoName,dialog)
    }).finally(()=>{
      dialogMap.delete(compoName)
    });
  },
  close: (compoName: string) => {
    let dialog = dialogMap.get(compoName)
    dialog && (dialog.dialogVisible = false)
  },
  closeAll:()=>{
    for (const key in dialogMap) {
      RongDialog.close(key)
    }
  }
};

export default RongDialog;
