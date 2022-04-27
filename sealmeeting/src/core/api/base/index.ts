import { EnumErrorCode } from '@/types/Enums'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'

export interface IAxiosRequest {
  baseURL?: string
  url: string
  data?: object
  params?: object
  method?: Method
  headers?: object
  timeout?: number
  responseType?: ResponseType
}

export interface IAxiosResponse {
  data: any
  headers: object
  request?: object
  status: number
  statusText: string
  config: IAxiosRequest
}

export interface IResponse {
  readonly code: EnumErrorCode
  readonly msg: string
  data: any
  result?: any
}

export interface IApiResult<T> {
  readonly code: EnumErrorCode
  readonly msg: string
  readonly data: T
}
