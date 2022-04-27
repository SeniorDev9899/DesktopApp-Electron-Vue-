export const storageUtil = {
  getString: (key: string) => {
    return localStorage.getItem(key)
  },
  setString: (key: string, value: string) => {
    localStorage.setItem(key, value)
  },
  getObject: (key: string) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : {}
  },
  setObject: (key: string, value: object) => {
    localStorage.setItem(key, JSON.stringify(value))
  }
}
