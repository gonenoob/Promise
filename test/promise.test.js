const MyPromise = require('../src/promise')

test('it should resolve 1', () => {
  MyPromise.resolve(1).then((value) => {
    expect(value).toBe(1)
  })
})

test('it should reject 1', () => {
  MyPromise.reject(1).then((reason) => {
  }, reason => {
    expect(reason).toBe(1)
  })
})

test('it should resolve 2', done => {
  new MyPromise(function(resolve, reject) {
    setTimeout(()=> {
      resolve(2)
    }, 1000)
  }).then(function(value){
    expect(value).toBe(2)
    done()
  }, function(reason) {

  })
})

test('it should reject 2', done => {
  new MyPromise(function(resolve, reject) {
    setTimeout(() => {
      reject(2)
    }, 1000)
  }).then(function(value) {

  }, function(reason) {
    expect(reason).toBe(2)
    done()
  })
})

describe('then', () => {

  test('it should ignored', () => {
    let promise = new MyPromise(function(resolve, reject) {
      resolve(1)
    })
    promise.then(1, 2).then(function(value){
      expect(value).toBe(1)
    })
  })
  
  test('then can run many times', () => {
    let promise = new MyPromise(function(resolve, reject) {
      resolve(1)
    })
    promise.then(function(value) {
      expect(value).toBe(1)
    })
  
    promise.then(value =>{
      expect(value).toBe(1)
    })
  })
  
  test('then can run many times 2', () => {
    let rejectPromise = new MyPromise(function(resolve, reject) {
      reject(0)
    })
    rejectPromise.then(null, reason => {
      expect(reason).toBe(0)
    })
  
    rejectPromise.then(undefined, reason => {
      expect(reason).toBe(0)
    })
  })
  
  test('then pass result to next', (done) => {
    let fun1 = function() {
      return new MyPromise(function(resolve, reject) {
        setTimeout(function() {
          resolve(1)
        }, 0)
      })
    }
    
    let fun2 = function(val) {
      return new MyPromise(function(resolve, reject) {
        setTimeout(function() {
          resolve(1 + val)
        }, 0)
      })
    }
  
    let fun3 = function(val) {
      return new MyPromise(function(resolve, reject) {
        setTimeout(function() {
          resolve(1 + val)
        }, 200)
      })
    }
  
    fun1().then(fun2).then(fun3).then(function(value) {
      expect(value).toBe(3)
      done()
    })
  
  })
  
})

describe('catch', () => {

  test('catch reject', done => {
    let promise = new MyPromise(function(resolve, reject) {
      setTimeout(() => {
        reject(1)
      })
    })

    promise.then(null).catch(e => {
      expect(e).toBe(1)
      done()
    })
  })

  test('catch resolve itself', done => {
    let p1 = new MyPromise(function(resolve, reject) {
      setTimeout(() => {
        resolve(1)
      }, 200)
    })

    let p2 = p1.then(() => {
      return p2
    })

    p2.catch(e => {
      expect(e instanceof TypeError).toBeTruthy()
      done()
    })
  })

  test('catch error final', done => {
    let fun1 = () => {
      return new MyPromise(function(resolve, reject) {
        setTimeout(() => {
          reject(1)
        }, 0)
      })
    }

    let fun2 = () => {
      return new MyPromise(resolve => {
        resolve(2)
      })
    }

    let fun3 = () => {
      return new MyPromise((resolve, reject) => {
        reject(3)
      })
    }

    fun1()
    .then(fun2)
    .then(fun3)
    .catch(e => {
      expect(e).toBe(1)
      done()
    })
  })

})

describe('state', () => {
  test('state should be pending', () => {
    let promise = new MyPromise(function() {

    })

    expect(promise._state).toEqual(0)
    expect(promise._state).not.toEqual(1)
    expect(promise._state).not.toEqual(2)
  })

  test('state should be resolved', () => {
    let promise = new MyPromise(function(resolve) {
      resolve(1)
    })

    expect(promise._state).not.toEqual(0)
    expect(promise._state).toEqual(1)
    expect(promise._state).not.toEqual(2)
  })

  test('state should be rejected', () => {
    let promise = new MyPromise(function(resolve, reject) {
      reject(1)
    })

    expect(promise._state).not.toEqual(0)
    expect(promise._state).not.toEqual(1)
    expect(promise._state).toEqual(2)
  })

})

describe('promise all', () => {
  
  test('promiseList all resolve before resolve', () => {
    let promiseList = [1,2,3].map((item) => {
      return new MyPromise(resolve => {
        resolve(item)
      })
    })
    
    MyPromise.all(promiseList)
    .then(value => {
      expect(value).toEqual([1,2,3])
    })
  })

  test('promiseList should result order', done => {
    let p1 = new MyPromise(resolve => {
      setTimeout(() => {
        resolve(1) 
      }, 300)
    })

    let p2 = new MyPromise(resolve => {
      setTimeout(() => {
        resolve(2) 
      }, 100)
    })

    let p3 = new MyPromise(resolve => {
      setTimeout(() => {
        resolve(3) 
      }, 0)
    })

    MyPromise.all([p1, p2, p3]).then(value => {
      expect(value).toEqual([1,2,3])
      done()
    })
  })

  test('promiseList one reject then reject', () => {
    let promiseList = [1,2,3].map((item) => {
      return new MyPromise(resolve => {
        resolve(item)
      })
    })

    promiseList[1] = new MyPromise((resolve, reject) => {
        reject(2)
    })

    MyPromise.all(promiseList)
    .catch(reason => {
      expect(reason).toBe(2)
    })
  })
})

describe('promise race', () => {

  test('should race', done => {
    let promiseList = [1,2,3].map((item) => {
      return new MyPromise(resolve => {
        resolve(item)
      })
    })

    MyPromise.race(promiseList)
    .then(value => {
      expect(value).toBe(1)
      done()
    })
  })

  test('should race first', done => {
    

    var promises = [1, 2, 3].map(function(i) {
      return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(i * i)
          }, 200 * i)
      })
    })

    let p =  new Promise(function(resolve) {
      setTimeout(function() {
        resolve(4)
      }, 100)
    })
    
    MyPromise.race([...promises, p]).then(value => {
      expect(value).toBe(4)
      done()
    })
  })
})
