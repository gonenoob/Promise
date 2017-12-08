//test
class Promise {
  constructor(exector) {
    this._state = 'pending'
    this._value = undefined
    this._reason = undefined

    this._onResolvedCallback = []
    this._onRejectedCallback = []

    if (isFunction(exector)) {
      exector(this.resolve.bind(this), this._onRejectedCallback.bind(this))
    }
  }

  resolve (value) {
    if (this._state !== 'pending') {
      return
    }

    this._state = 'resolved'
    this._value = value

    this.exeCallback()
  }

  reject(reason) {
    if (this._state !== 'pending') {
      return
    }

    this._state = 'rejected'
    this._reason = reason

    this.exeCallback()
  }

  catch(fn) {
    return this.then(null, fn)
  }

  exeCallback() {
    if (this._state === 'pending') {
      return
    }

    let callbacks = this._state === 'resolved' ? this._onResolvedCallback : this._onRejectedCallback
    let val = this._state === 'resolved' ? this._value : this._reason

    for (let i = 0, len = callbacks.length; i < callbacks.length; i++) {
      setTimeout(() => {
        callbacks[i](val)
      }, 0)
    }

  }

  then(onResolved, onRejected) {
    //需要返回一个promise
    let promise = new Promise

    //将回调函数push到对应的回调列表中

    this._onResolvedCallback.push(this.handlerCallback(promise, onResolved, 'resolve'))
    this._onRejectedCallback.push(this.handlerCallback(promise, onRejected, 'reject'))

    return promise
  }

  handlerCallback(promise, fn, actionType) {
    return function(val) {
      if (isFunction(fn)) {
        try {
          resolveRromise(promise, fn(val))
        } catch (e) {
          promise.reject(e)
        }
      } else {
        promise[actionType](val)
      }
    }
  }

  static resolve(value) {
    return new Promise(function(resolve) {
      resolve(value)
    })
  }

  static reject(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason)
    })
  }

  static all(arr) {
    let promise = new promise()
    if (!Array.isArray(arr)) {
      return promise.reject(new TypeError(''))
    }

    let result = []
    let length = arr.length
    let leftNumber = length

    for (let i = 0; i < length; i++) {
      try {
        arr[i].then(function(value){
          result[i] = value
          leftNumber--

          if (leftNumber == 0) {
            promise.resolve(result)
          }
        }, function(reason) {
          promise.reject(reason)
        })

      } catch (e) {
        promise.reject(e)
      }
    }

    return promise
  }

  static race(arr) {
    let promise = new Promise()
    if (!Array.isArray(arr)) {
      return promise.reject(new TypeError)
    }

    return promise
  }
}

function isFunction(fn) {
  return typeof fn === 'function'
}

function resolveRromise(promise, x) {
  if (x === promise) {
    return promise.reject(new TypeError(''))
  }

  if (x && isFunction(x.then)) {
    //如果是promise，取promise的返回值
    try {
      x.then(function(val){
        resolveRromise(promise, val)
      }, function(reason) {
        promise.reject(reason)
      })

    } catch (e) {
      promise.reject(e)
    }
  } else {
    promise.resolve(x)
  }
}