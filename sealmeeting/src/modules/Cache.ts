/**
 * 存储介质接口，用于数据永久性存储
 */
export interface IMedium {
  setItem(key: string, value: string): void
  getItem(key: string): string | null
  removeItem(key: string): void
}

/**
 * 缓存类，同时具备将数据通过指定类型的存储介质永久化存储的能力
 */
export default class Cache<K, V = any> {
  private readonly map: Map<K, V> = new Map()
  /**
   * 缓存类型对象构建函数，该类型对象具备数据存储能力，且作为持久化数据存储媒介
   * @param prefix 键前缀
   * @param flushKeys 需要持久化存储的键集合
   * @param medium 数据持久化存储介质，默认使用 localStorage，可自定义其他持久化数据存储手段
   */
  constructor(
    private readonly prefix: string,
    private readonly flushKeys: Set<K> = new Set(),
    private readonly medium: IMedium = localStorage
  ) {
    // 初始化时尝试从存储介质中恢复数据
    flushKeys.forEach(this.reload, this)
  }

  private transform(key: K): string {
    return `${this.prefix}_${key}`
  }

  public clear() {
    this.flushKeys.forEach(this.delete, this)
    // 清理进程内存数据
    this.map.clear()
  }

  public delete(key: K): boolean {
    if (this.flushKeys.has(key)) {
      this.medium.removeItem(this.transform(key))
    }
    return this.map.delete(key)
  }

  public entries() {
    return this.map.entries()
  }

  public forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ) {
    this.map.forEach(callbackfn, thisArg)
  }

  public get(key: K) {
    return this.map.get(key)
  }

  public has(key: K): boolean {
    return this.map.has(key)
  }

  public keys() {
    return this.map.keys()
  }

  public set(key: K, value: V): Cache<K, V> {
    if (this.flushKeys.has(key)) {
      this.medium.setItem(this.transform(key), JSON.stringify({ v: value }))
    }
    this._set(key, value)
    return this
  }

  private _set(key: K, value: V) {
    this.map.set(key, value)
  }

  /**
   * 当前存储的键值对数量
   */
  get size(): number {
    return this.map.size
  }

  public values() {
    return this.map.values()
  }

  /**
   * 从存储介质中重新加载数据
   * @param key
   */
  public reload(key: K) {
    const json = this.medium.getItem(this.transform(key))
    if (json) {
      const { v } = JSON.parse(json)
      this._set(key, v)
    }
  }
}
