import mitt, { Emitter, Handler } from '@/modules/EventEmitt'

const eventEmitter: Emitter = mitt()

export const onEvent = (type: string, handler: Handler) => {
  eventEmitter.on(type, handler)
}

export const emitEvent = (type: string, event: any) => {
  eventEmitter.emit(type, event)
}
