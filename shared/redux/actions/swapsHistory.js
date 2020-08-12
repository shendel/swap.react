// backup and restore swaps history
import config from 'app-config'
import { getState } from 'redux/core'
import apiLooper from 'helpers/apiLooper'
import localStorage from 'helpers/localStorage'
import md5 from 'md5'


const restore = () => {
  return new Promise((resolve) => {
    const {
      user: {
        btcData: {
          privateKey,
          address,
        },
      },
    } = getState()

    const uniqKey = md5(`${privateKey}:{address}`)
    apiLooper.post('swapHistory', `/fetch/`, {
      body: {
        owner: uniqKey,
      },
    }).then((res) => {
      if (res
        && res.answer
        && res.answer === `ok`
      ) {
        resolve(true)
      } else {
        resolve(false)
      }
    }).catch((e) => {
      resolve(false)
    })
  })
}

const backup = (swapId) => {
  return new Promise((resolve) => {
    const {
      user: {
        btcData: {
          privateKey,
          address,
        },
      },
    } = getState()

    const uniqKey = md5(`${privateKey}:{address}`)

    const swapIds = localStorage.getItem(`swapId`)
    if (swapIds.indexOf(swapId) !== -1) {
      const swapData = window.localStorage.getItem(`swap:swap.${swapId}`)
      const flowData = window.localStorage.getItem(`swap:flow.${swapId}`)
      const postData = {
        owner: uniqKey,
        swapId,
        swap: swapData,
        flow: flowData,
      }

      apiLooper.post('swapsHistory', `/pushone/`, {
        body: postData,
      }).then((res) => {
        if (res
          && res.answer
          && res.answer === `ok`
        ) {
          resolve(true)
        } else {
          resolve(false)
        }
      }).catch((e) => {
        resolve(false)
      })
    } else {
      resolve(false)
    }
  })
}

const backupAll = () => {
  return new Promise((resolve) => {
    const {
      user: {
        btcData: {
          privateKey,
          address,
        },
      },
    } = getState()

    const uniqKey = md5(`${privateKey}:{address}`)
    const swapIds = localStorage.getItem(`swapId`)
    const swaps = {}
    const flows = {}

    swapIds.forEach((swapId) => {
      const swapData = window.localStorage.getItem(`swap:swap.${swapId}`)
      const flowData = window.localStorage.getItem(`swap:flow.${swapId}`)

      swaps[swapId] = swapData
      flows[swapId] = flowData
    })

    const postData = {
      owner: uniqKey,
      swapIds,
      swaps,
      flows,
    }

    apiLooper.post('swapsHistory', `/push/`, {
      body: postData,
    }).then((res) => {
      if (res
        && res.answer
        && res.answer === `ok`
      ) {
        resolve(true)
      } else {
        resolve(false)
      }
    }).catch ((e) => {
      resolve(false)
    })
  })
}

window.swapHistory = {
  backupAll,
  backup,
  restore,
}
export default {
  restore,
  backup,
  backupAll,
}

