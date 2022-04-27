import axios from 'axios'
import * as qiniu from 'qiniu-js'
import { IResponse } from '@/core/api/base'

export const qiniuUpload = (file: any, token: string): Promise<IResponse> => {
  return new Promise(resolve => {
    const observable = qiniu.upload(file, file.name, token)
    const onComplete = (params: any) => {
      resolve({
        code: 10000,
        msg: 'ok',
        data: { path: params.key }
      } as IResponse)
    }
    const onError = (err: any) => {
      resolve({ code: 0, msg: 'error', data: undefined } as IResponse)
    }
    observable.subscribe(undefined, onError, onComplete)
  })
}

export const rcxUpload = (
  server: string,
  file: File,
  token: string
): Promise<IResponse> => {
  const data = new FormData()
  data.append('token', token)
  data.append('filename', file.name)
  data.append('content', file)
  return new Promise(resolve => {
    axios({
      baseURL: server,
      headers: { 'Content-Type': 'multipart/form-data' },
      method: 'POST',
      data: data
    })
      .then(res => {
        resolve({
          code: 10000,
          msg: 'ok',
          data: { path: res.data.rc_url.path }
        } as IResponse)
      })
      .catch(e => {
        resolve({ code: 0, msg: 'error', data: undefined } as IResponse)
      })
  })
}
