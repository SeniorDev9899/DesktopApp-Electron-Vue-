// PC 断开连接时也可以操作本地数据
export default IS_DESKTOP ? () => true : () => {
    // Web 连接成功时才可操作数据
    const CONNECTED = 0;
    const status = RongIMClient.getInstance().getCurrentConnectionStatus();
    return status === CONNECTED;
};
