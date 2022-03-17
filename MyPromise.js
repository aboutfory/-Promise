class MyPromise {
  constructor(fn) {
    this.data = null
    this.status = 'pending'
    this.callBacks = []

    let resolve = value => {
      if (this.status !== 'pending') return
      this.status = 'fulfilled'
      this.data = value
      while (this.callBacks.length > 0) {
        let first = this.callBacks.shift()
        first.onResolved()
      }
    }
    let reject = value => {
      if (this.status !== 'pending') return
      this.status = 'rejected'
      this.data = value
      while (this.callBacks.length > 0) {
        let first = this.callBacks.shift()
        first.onRejected()
      }
    }
    
    try {
      fn(resolve, reject)
    } catch (error) {
      reject(error)
    }
  } 
}

MyPromise.prototype.then = function (onfulfilled = value => value, onrejected = reason => { throw(reason) }) {
  return new MyPromise((nextResolve, nextReject) => {
    const handle = callBack => {
      try {
        let child = callBack(this.data)
        if (child instanceof MyPromise) {//调用后返回的还是Promise对象,调用其then方法
          child.then(nextResolve, nextReject)
        } else {//非Promise
          nextResolve(child)
        }
      } catch (error) {
        nextReject(error)
      }
    }
    if (this.status === 'pending') {
      this.callBacks.push({
        onResolved: () => {
          handle(onfulfilled)
        },
        onRejected: () => {
          handle(onrejected)
        },
      })
    }
    if (this.status === 'fulfilled') {
      handle(onfulfilled)
    }
    if (this.status === 'rejected') {
      handle(onrejected)
    }
  })
}

MyPromise.prototype.catch = function (onrejected = reason => { throw(reason) }) {
  return this.then(null, onrejected)
}

// 全部resolve才变fulfilled，有一个reject就变rejected
MyPromise.all = function(promiseList) {
  return new MyPromise((resolve, reject) => {
    let resArr = [], i = 0, j = 0
    promiseList.forEach((el, index) => {
      el.then(res => {
        resArr[index] = res
        i++
        if (i === promiseList.length) {
          resolve(resArr)
        }
      }).catch(err => {
        if (j < 1) {
          reject(err)
        }
        j++
      })
    });
  })
}

// 谁先变，返回谁
MyPromise.race = function(promiseList) {
  return new MyPromise((resolve, reject) => {
    let i = 0
    promiseList.forEach(el => {
      el.then(res => {
        if (i < 1) {
          resolve(res)
        }
        i++
      }).catch(err => {
        if (i < 1) {
          reject(err)
        }
        i++
      })
    });
  })
}

// 只要有一个resolve就返回它，全部都reject就返回错误信息
MyPromise.any = function(promiseList) {
  return new MyPromise((resolve, reject) => {
    let i = 0, j = 0
    promiseList.forEach(el => {
      el.then(res => {
        if (i < 1) {
          resolve(res)
        }
        i++
        j++
      }).catch(err => {
        if (j >= promiseList.length - 1) {
          reject('AggregateError: All promises were rejected')
        }
        j++
      })
    });
  })
}