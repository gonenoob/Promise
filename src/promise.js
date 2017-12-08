const PENDING = 0
const RESOLVED = 1
const REJECTED = 2

class MyPromise {
  constructor(exector) {
    this._state = PENDING
    this._value = undefined
    this._reason = undefined

    this._onResolvedCallback = []
    this._onRejectdCallback = []

    if (isFunction(exector)) {
      exector(this.resolve.bind(this), this.reject.bind(this))
    }
  }

  then(onResolved, onRejected) {
    //返回值需要是promise
    const promise = new MyPromise()

    //注册回调
    this._onResolvedCallback.push(this.handler(promise, onResolved, 'resolve'))
    this._onRejectdCallback.push(this.handler(promise, onRejected, 'reject'))

    return promise
  }

  handler(promise, fn, actionType) {
    return function(val) {
      if (isFunction(fn)) {
        //如果是函数，则 以函数执行结果为resolve
        try {
          resolve(promise, fn(val))
        } catch (e) {
          promise.reject(e)
        }
      } else {
        //如果不是函数，则根据状态返回val
        //promise的值穿透
        promise[actionType](val)
      }
    }
  }

  resolve(x) {
    if (this._state !== PENDING) {
      return
    }
    //resolve状态执行回调
    this._state = RESOLVED
    this._value = x 

    this.exeCallback()
  }

  reject(reason) {
    if (this._state !== PENDING) {
      return
    }

    //reject状态执行回调
    this._state = REJECTED
    this._reason = reason

    this.exeCallback()
  }

  exeCallback() {
    if (this._state === PENDING) {
      return
    }

    const callbackList = this._state === RESOLVED ? this._onResolvedCallback : this._onRejectdCallback
    const val = this._state === RESOLVED ? this._value : this._reason

    setTimeout(function() {
      for (let i = 0, len = callbackList.length; i < len; i++) {
        callbackList[i](val)
      }
    }, 0)
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  static resolve(value) {
    return new Promise(function(resolve, reject) {
      resolve(value)
    })
  }

  static reject(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason)
    })
  }

  static all(promiseList) {
    //并行执行多个promise，全部resolve或者有一个reject就返回
    let promise = new MyPromise()
    if (!isArray(promiseList)) {
      return promise.reject(new TypeError(''))
    }
    let length = promiseList.length
    let results = []
    let leftLength = length

    for (let i = 0; i < length; i++) {
      try {
        promiseList[i].then(function(value){

          results[i] = value
          leftLength--

          if (leftLength == 0) {
            promise.resolve(results)
          }

        }, function(reason) {
          promise,reject(reason)
        })
      } catch (e) {
        promise.reject(e)
      }
    }
    return promise
  }

  static race(promiseList) {
    //并行执行多个promise，一个resolve或者reject就返回
    let promise = new MyPromise()
    
    if (!isArray(promiseList)) {
      return promise.reject(new TypeError(''))
    }

    for (let i = 0, len = promiseList.length; i < len; i++) {
      try {
        promiseList[i].then(function(value) {
          promise.resolve(value)
        }, function(reason) {
          promise.reject(reason)
        })
      } catch (e) {
        promise.reject(e)
      }
    }
    return promise
  }
}

function isArray(arr) {
  return Array.isArray(arr)
}

function isFunction(fn) {
  return typeof fn === 'function'
}

function isThenable(val) {
  return val && isFunction(val.then)
}

function resolve(promise, x) {
  //https://promisesaplus.com/#point-48
  if (promise === x) {
    promise.reject(new TypeError(''))
    return
  }

  if (isThenable(x)) {
    //如果x是promise，则执行x获取结果,并以x的状态作为promise的状态
    try {
      x.then(function(value) {
        resolve(promise, value)
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

module.exports = MyPromise