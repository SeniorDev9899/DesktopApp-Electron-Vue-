import { IApiResult, IAxiosRequest, IResponse } from '.';
import instance from './intercept';
import { loginAuth } from '@/store/login'
import { appConfig } from '@/appConfig';
class Abstract {
    protected headers: any = {
        "Content-Type": "application/json;charset=UTF-8",
    }
    private apiType = ''
    constructor(apitype: string) {
        this.apiType = apitype
    }
    private getBaseUrl() {
        return this.apiType === 'meeting' ? appConfig.commonServer : appConfig.controlServer;
    }
    protected apiAxios({ method, url, data, params, responseType }: IAxiosRequest): Promise<IResponse> {
        if (appConfig.launchFrom !== 'rce') {
            if (this.apiType === 'meeting') {
                this.headers['Authorization'] = loginAuth.authorization
            } else if (this.apiType === 'control') {
                this.headers['RCMT-Token'] = loginAuth.rcmtToken
            }
        }
        if (appConfig.launchFrom === 'rce') {
            if (this.apiType === 'control') {
                // 会控url
                url = url.replace('/meetings/', '/meetingControl/')
            } else if (this.apiType === 'meeting') {
                // 会议url
                url = url.replace('/meetings/', '/meeting/')
            }
        }
        return new Promise((resolve, reject) => {
            instance({
                baseURL: this.getBaseUrl(),
                headers: this.headers,
                withCredentials: true,
                method,
                url,
                params,
                data,
                responseType
            }).then((res) => {
                // 200:服务端业务处理正常结束
                if (res.status === 200) {
                    const rst = res.data as IResponse
                    rst.data = rst.data || rst.result
                    rst.result = undefined
                    resolve(res.data as IResponse)
                } else {
                    resolve({ code: res.status, msg: '请求失败', data: null } as IResponse)
                }
            }).catch((err) => {
                const message = err?.data?.errorMessage || err?.message || (url + '请求失败');
                resolve({ code: 0, msg: message, data: null } as IResponse);
            });
        });
    }

    /**
     * GET类型的网络请求
     */
    protected get(url: string, params: any): Promise<IResponse> {
        return this.apiAxios({ method: 'GET', url: url, params: params });
    }

    /**
     * POST类型的网络请求
     */
    protected post(url: string, data: any): Promise<IResponse> {
        return this.apiAxios({ method: 'POST', url: url, data: data });
    }

    /**
     * PUT类型的网络请求
     */
    protected put(url: string, data: any): Promise<IResponse> {
        return this.apiAxios({ method: 'PUT', url: url, data: data });
    }

    /**
     * DELETE类型的网络请求
     */
    protected delete(url: string, data: any): Promise<IResponse> {
        return this.apiAxios({ method: 'DELETE', url: url, data: data });
    }
}

export default Abstract;
