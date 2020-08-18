import BigInteger from 'bigi'

import { BigNumber } from 'bignumber.js'
import * as bitcoin from 'bitcoinjs-lib'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'

import bitcoinMessage from 'bitcoinjs-message'
import { getState } from 'redux/core'
import reducers from 'redux/core/reducers'
import { btc, apiLooper, constants, api } from 'helpers'
import actions from 'redux/actions'
import typeforce from "swap.app/util/typeforce"
import config from 'app-config'

import { localisePrefix } from 'helpers/locale'
import md5 from 'md5'
import getUnixTimeStamp from 'helpers/getUnixTimeStamp'


const hasAdminFee = (config
  && config.opts
  && config.opts.fee
  && config.opts.fee.btc
  && config.opts.fee.btc.fee
  && config.opts.fee.btc.address
  && config.opts.fee.btc.min
) ? config.opts.fee.btc : false

const getRandomMnemonicWords = () => bip39.generateMnemonic()

const validateMnemonicWords = (mnemonic) => bip39.validateMnemonic(convertMnemonicToValid(mnemonic))


const sweepToMnemonic = (mnemonic, path) => {
  const wallet = getWalletByWords(mnemonic, path)
  localStorage.setItem(constants.privateKeyNames.btcMnemonic, wallet.WIF)
  return wallet.WIF
}

const getMainPublicKey = () => {
  const {
    user: {
      btcData,
    },
  } = getState()

  return btcData.publicKey.toString('Hex')
}

const isSweeped = () => {
  const {
    user: {
      btcData,
      btcMnemonicData,
    },
  } = getState()

  if (btcMnemonicData
    && btcMnemonicData.address
    && btcData
    && btcData.address
    && btcData.address.toLowerCase() !== btcMnemonicData.address.toLowerCase()
  ) return false

  return true
}

const getSweepAddress = () => {
  const {
    user: {
      btcMnemonicData,
    },
  } = getState()

  if (btcMnemonicData && btcMnemonicData.address) return btcMnemonicData.address
  return false
}

const convertMnemonicToValid = (mnemonic) => {
  return mnemonic
    .trim()
    .toLowerCase()
    .split(` `)
    .filter((word) => word)
    .join(` `)
}

window.entryRegisters = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]
const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
}

const nextEntryA1 = () => {
  var ne = window.entryRegisters
  ne[0]++
  for (var i=0;i<15;i++) {
    if (ne[i] == 256) { ne[i] = 0; ne[i+1]++ }
  }
  window.entryRegisters = ne
}
const nextEntryA2 = () => {
  var ne = window.entryRegisters

  for (var i = 0 ; i<16; i++) {
    ne[i] = ne[i] + getRandomInt(10)
    if (ne[i]>255) ne[i] = ne[i] - 255
  }

  window.entryRegisters = ne
}
const nextEntryA3 = () => {
  var ne = window.entryRegisters
  var acc = getRandomInt(16)
  ne[acc]++
  if (ne[acc]>255) ne[acc] = 0
  window.entryRegisters = ne
}

const nextEntryA4 = () => {
  var ne = window.entryRegisters
  for (var i =0; i<16;i++) {
    ne[i]++
    if (ne[i]>255) ne[i] = getRandomInt(256)
  }
  window.entryRegisters = ne
}

const nextEntryA5 = () => {
  var ne = window.entryRegisters
  ne = ne.reverse()
  ne[0]++
  for (var i=0;i<15;i++) {
    if (ne[i] == 2) { ne[i] = 0; ne[i+1]++ }
  }
  window.entryRegisters = ne.reverse()
}

const nextEntryA6 = () => {
  var ne = window.entryRegisters
  ne[getRandomInt(16)] = getRandomInt(256)
  window.entryRegisters = ne
}

const nextEntryA7 = () => {
  const hexToBytes = (hex) => {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }
  var hash = md5(getUnixTimeStamp()- 60*60*24*365)
  window.entryRegisters = hexToBytes(hash)
}

const nextEntryA8 = () => {
  var ne = window.entryRegisters
  ne[getRandomInt(16)] = getRandomInt(256)
  var fe = ne.shift()
  ne.push(fe)
  window.entryRegisters = ne
}

const nextEntryA9 = () => {
  var ne = window.entryRegisters
  var fe = ne.shift()
  ne.push(getRandomInt(256))
  window.entryRegisters = ne
}

let nextEntryA10_Counter = 0
const nextEntryA10 = () => {
  if (nextEntryA10_Counter === 0) {
    const hexToBytes = (hex) => {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    }
    var hash = md5(getUnixTimeStamp()- 60*60*24*365)
    window.entryRegisters = hexToBytes(hash)
  }
  var ne = window.entryRegisters
  for (var i=0;i<16;i++) {
    ne[i]++
    if (ne[i] === 256 && (nextEntryA10_Counter === 0)) ne[i] = 0
  }
  nextEntryA10_Counter++
  if (nextEntryA10_Counter === 256) {
    nextEntryA10_Counter = 0
  }
  window.entryRegisters = ne
}

const nextEntryA11 = () => {
  var i = getRandomInt(16)
  window.entryRegisters[i]++
  if (window.entryRegisters[i]>=256) window.entryRegisters[i] = 0
}

window.nextEntry = nextEntryA11
window.nextEntryA1 = nextEntryA1
window.nextEntryA2 = nextEntryA2
window.nextEntryA3 = nextEntryA3
window.nextEntryA4 = nextEntryA4
window.nextEntryA5 = nextEntryA5
window.nextEntryA6 = nextEntryA6
window.nextEntryA7 = nextEntryA7
window.nextEntryA8 = nextEntryA8
window.nextEntryA9 = nextEntryA9
window.nextEntryA10 = nextEntryA10
window.nextEntryA11 = nextEntryA11

const findWallet = async (onEntry, onReady, onError) => {
  const wordNums = []
  
  const getWalletData = (address) => apiLooper.get('bitpay', `/addr/${address}`, {
    checkStatus: (answer) => {
      try {
        if (answer && answer.balance !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
    inQuery: {
      delay: 500,
      name: `balance`,
    },
  }).then((data) => data)
  
  const _getWord = (n) => {
    const topWord = 10 // 2048

    let wordNum = getRandomInt(topWord)
    //while(wordNums.indexOf(wordNum) !== -1) {
    //  wordNum = getRandomInt(topWord)
    //}
    wordNums.push(wordNum)
    return bip39.wordlists.english[wordNum]
  }

  const ownRand = (size) => {
    const ret = new Uint8Array(window.entryRegisters)
    window.nextEntry()
    return ret
  }
  const mnemonic = bip39.generateMnemonic(128,ownRand)
  const wallets = [
    getWalletByWords(mnemonic,0),
    getWalletByWords(mnemonic,1),
    getWalletByWords(mnemonic,2),
    getWalletByWords(mnemonic,3),
    getWalletByWords(mnemonic,4),
  ]
  const processWallet = async () => {
    const wallet = wallets.shift()
    if (onEntry) {
      onEntry({
        entry: window.entryRegisters,
        mnemonic,
        address: wallet.address,
      })
    }
    let walletData = null
    try {
      walletData = await getWalletData(wallet.address)
    } catch (e) {
      if (onError) {
        onError()
      }
    }
    if (walletData) {
      if (onReady) {
        onReady({
          entry: window.entryRegisters,
          mnemonic,
          address: wallet.address,
          balance: walletData.balance,
          totalReceivedSat: walletData.totalReceivedSat,
          length: wallets.length,
        })
      }
      const {
        balance,
        totalReceivedSat,
        totalReceived,
      } = walletData

      if (totalReceivedSat > 0) {
        console.log(wallet.address, totalReceived, balance, mnemonic)
      } else {
        console.log("Fetch next")
      }
    } else {
      if (onError) {
        onError()
      }
    }
    if (wallets.length) {
      //setTimeout( processWallet, 200)
    } else {
      if (!onReady) {
        setTimeout( findWallet, 1000)
      }
    }
  }
  processWallet()
}
window.generateMnemonic = bip39.generateMnemonic
window.findWallet = findWallet

const getWalletByWords = (mnemonic, walletNumber = 0, path) => {
  mnemonic = convertMnemonicToValid(mnemonic)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, btc.network)
  const node = root.derivePath((path) ? path : `m/44'/0'/0'/0/${walletNumber}`)

  const account = bitcoin.payments.p2pkh({
    pubkey: node.publicKey,
    network: btc.network,
  })

  return {
    mnemonic,
    address: account.address,
    publicKey: node.publicKey.toString('Hex'),
    WIF: node.toWIF(),
    node,
    account,
  }
}

window.getWalletByWords = getWalletByWords

const auth = (privateKey) => {
  if (privateKey) {
    const hash = bitcoin.crypto.sha256(privateKey)
    const d = BigInteger.fromBuffer(hash)

    const keyPair = bitcoin.ECPair.fromWIF(privateKey, btc.network)

    const account = bitcoin.ECPair.fromWIF(privateKey, btc.network) // eslint-disable-line
    const { address } = bitcoin.payments.p2pkh({ pubkey: account.publicKey, network: btc.network })
    const { publicKey } = account

    return {
      account,
      keyPair,
      address,
      privateKey,
      publicKey,
    }
  }
}

const getPrivateKeyByAddress = (address) => {
  const {
    user: {
      btcData: {
        address: oldAddress,
        privateKey,
      },
      btcMnemonicData: {
        address: mnemonicAddress,
        privateKey: mnemonicKey,
      }
    },
  } = getState()

  if (oldAddress === address) return privateKey
  if (mnemonicAddress === address) return mnemonicKey
}

const login = (privateKey, mnemonic, mnemonicKeys) => {
  let sweepToMnemonicReady = false

  if (privateKey
    && mnemonic
    && mnemonicKeys
    && mnemonicKeys.btc === privateKey
  ) sweepToMnemonicReady = true

  if (!privateKey && mnemonic) sweepToMnemonicReady = true

  if (privateKey) {
    const hash = bitcoin.crypto.sha256(privateKey)
    const d = BigInteger.fromBuffer(hash)

    //keyPair     = bitcoin.ECPair.fromWIF(privateKey, btc.network)
  }
  else {
    console.info('Created account Bitcoin ...')
    //keyPair     = bitcoin.ECPair.makeRandom({ network: btc.network })
    //privateKey  = keyPair.toWIF()
    // use random 12 words
    if (!mnemonic) mnemonic = bip39.generateMnemonic()
    const accData = getWalletByWords(mnemonic)
    console.log('Btc. Generated walled from random 12 words')
    console.log(accData)
    privateKey = accData.WIF
    localStorage.setItem(constants.privateKeyNames.btcMnemonic, privateKey)
  }

  localStorage.setItem(constants.privateKeyNames.btc, privateKey)

  const data = {
    ...auth(privateKey),
    isMnemonic: sweepToMnemonicReady,
  }

  window.getBtcAddress = () => data.address
  window.getBtcData = () => data

  console.info('Logged in with Bitcoin', data)
  reducers.user.setAuthData({ name: 'btcData', data })
  if (!sweepToMnemonicReady) {
    // Auth with our mnemonic account
    if (mnemonic === `-`) {
      console.error('Sweep. Cant auth. Need new mnemonic or enter own for re-login')
      return
    }

    if (!mnemonicKeys
      || !mnemonicKeys.btc
    ) {
      console.error('Sweep. Cant auth. Login key undefined')
      return
    }

    const mnemonicData = {
      ...auth(mnemonicKeys.btc),
      isMnemonic: true,
    }
    console.info('Logged in with Bitcoin Mnemonic', mnemonicData)
    reducers.user.addWallet({
      name: 'btcMnemonicData',
      data: {
        currency: 'BTC',
        fullName: 'Bitcoin (New)',
        balance: 0,
        isBalanceFetched: false,
        balanceError: null,
        infoAboutCurrency: null,
        ...mnemonicData,
      }
    })
    new Promise(async (resolve) => {
      const balanceData = await fetchBalanceStatus(mnemonicData.address)
      if (balanceData) {
        reducers.user.setAuthData({
          name: 'btcMnemonicData',
          data: {
            ...balanceData,
            isBalanceFetched: true,
          },
        })
      } else {
        reducers.user.setBalanceError({ name: 'btcMnemonicData' })
      }
      resolve(true)
    })
  }

  return privateKey
}



const getTx = (txRaw) => {
  if (txRaw
    && txRaw.getId
    && txRaw.getId instanceof 'function'
  ) {
    return txRaw.getId()
  } else {
    return txRaw
  }
}

const getTxRouter = (txId) => {
  return `/btc/tx/${txId}`
}

const getLinkToInfo = (tx) => {

  if (!tx) {
    return
  }

  return `${config.link.bitpay}/tx/${tx}`
}

const fetchBalanceStatus = (address) => {
  return apiLooper.get('bitpay', `/addr/${address}`, {
    checkStatus: (answer) => {
      try {
        if (answer && answer.balance !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
  }).then(({ balance, unconfirmedBalance }) => {
    return {
      address,
      balance,
      unconfirmedBalance,
    }
  })
    .catch((e) => {
      return false
    })
}
const getBalance = () => {
  const { user: { btcData: { address } } } = getState()

  return apiLooper.get('bitpay', `/addr/${address}`, {
    inQuery: {
      delay: 500,
      name: `balance`,
    },
    checkStatus: (answer) => {
      try {
        if (answer && answer.balance !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
  }).then(({ balance, unconfirmedBalance }) => {
    console.log('BTC Balance: ', balance)
    console.log('BTC unconfirmedBalance Balance: ', unconfirmedBalance)
    reducers.user.setBalance({ name: 'btcData', amount: balance, unconfirmedBalance })
    return balance
  })
    .catch((e) => {
      reducers.user.setBalanceError({ name: 'btcData' })
    })
}

const fetchBalance = (address) =>
  apiLooper.get('bitpay', `/addr/${address}`, {
    checkStatus: (answer) => {
      try {
        if (answer && answer.balance !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
    inQuery: {
      delay: 500,
      name: `balance`,
    },
  }).then(({ balance }) => balance)

const fetchTxRaw = (txId, cacheResponse) => 
  apiLooper.get('bitpay', `/rawtx/${txId}`, {
    cacheResponse,
    checkStatus: (answer) => {
      try {
        if (answer && answer.rawtx !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
  }).then(({ rawtx }) => rawtx)

const fetchTx = (hash, cacheResponse) =>
  apiLooper.get('bitpay', `/tx/${hash}`, {
    cacheResponse,
    checkStatus: (answer) => {
      try {
        if (answer && answer.fees !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
  }).then(({ fees, ...rest }) => ({
    fees: BigNumber(fees).multipliedBy(1e8),
    ...rest,
  }))

const fetchTxInfo = (hash, cacheResponse) =>
  fetchTx(hash, cacheResponse)
    .then(({ vin, vout, ...rest }) => {
      const senderAddress = vin ? vin[0].addr : null
      const amount = vout ? new BigNumber(vout[0].value).toNumber() : null

      let afterBalance = vout && vout[1] ? new BigNumber(vout[1].value).toNumber() : null
      let adminOutput = []
      let adminFee = false

      if (hasAdminFee) {
        adminOutput = vout.filter((out) => {
          const voutAddrBuf = Buffer.from(out.scriptPubKey.hex, 'hex')
          const currentAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)
          return (
            currentAddress === hasAdminFee.address
            && !(new BigNumber(out.value).eq(amount))
          )
        })
      }

      const afterOutput = vout.filter((out) => {
        const voutAddrBuf = Buffer.from(out.scriptPubKey.hex, 'hex')
        const currentAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)
        return (
          currentAddress !== hasAdminFee.address
          && currentAddress !== senderAddress
        )
      })

      if (afterOutput.length) {
        afterBalance = new BigNumber(afterOutput[0].value).toNumber()
      }

      if (adminOutput.length) {
        adminFee = new BigNumber(adminOutput[0].value).toNumber()
      }

      let receiverAddress = null
      if (vout) {
        const voutAddrBuf = Buffer.from(vout[0].scriptPubKey.hex, 'hex')
        receiverAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)
      }
      const txInfo = {
        amount,
        afterBalance,
        senderAddress,
        receiverAddress,
        confirmed: (rest.confirmations) ? true : false,
        minerFee: rest.fees.dividedBy(1e8).toNumber(),
        adminFee,
        minerFeeCurrency: 'BTC',
        outputs: vout.map((out) => {
          const voutAddrBuf = Buffer.from(out.scriptPubKey.hex, 'hex')
          const currentAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)
          return {
            amount: new BigNumber(out.value).toNumber(),
            address: currentAddress,
          }
        }),
        ...rest,
      }

      return txInfo
    })

const getInvoices = (address) => {
  const { user: { btcData: { userAddress } } } = getState()

  address = address || userAddress

  return actions.invoices.getInvoices({
    currency: 'BTC',
    address,
  })
}

const getAllMyAddresses = () => {
  const {
    user: {
      btcData,
      btcMnemonicData,
      btcMultisigSMSData,
      btcMultisigUserData,
      btcMultisigG2FAData,
      btcMultisigPinData
    },
  } = getState()

  const retData = []
  // Проверяем, был ли sweep
  if (btcMnemonicData
    && btcMnemonicData.address
    && btcData
    && btcData.address
    && btcMnemonicData.address !== btcData.address
  ) {
    retData.push(btcMnemonicData.address.toLowerCase())
  }

  retData.push(btcData.address.toLowerCase())

  if (btcMultisigSMSData && btcMultisigSMSData.address) retData.push(btcMultisigSMSData.address.toLowerCase())
  // @ToDo - SMS MultiWallet

  if (btcMultisigUserData && btcMultisigUserData.address) retData.push(btcMultisigUserData.address.toLowerCase())
  if (btcMultisigUserData && btcMultisigUserData.wallets && btcMultisigUserData.wallets.length) {
    btcMultisigUserData.wallets.map((wallet) => {
      retData.push(wallet.address.toLowerCase())
    })
  }

  if (btcMultisigPinData && btcMultisigPinData.address) retData.push(btcMultisigPinData.address.toLowerCase())

  return retData
}

const getDataByAddress = (address) => {
  const {
    user: {
      btcData,
      btcMnemonicData,
      btcMultisigSMSData,
      btcMultisigUserData,
      btcMultisigG2FAData,
    },
  } = getState()

  const founded = [
    btcData,
    btcMnemonicData,
    btcMultisigSMSData,
    btcMultisigUserData,
    ...(
      btcMultisigUserData
      && btcMultisigUserData.wallets
      && btcMultisigUserData.wallets.length
    )
      ? btcMultisigUserData.wallets
      : [],
    btcMultisigG2FAData,
  ].filter(data => data && data.address && data.address.toLowerCase() === address.toLowerCase())

  return (founded.length) ? founded[0] : false
}

const getTransaction = (address, ownType) =>
  new Promise((resolve) => {
    const myAllWallets = getAllMyAddresses()

    let { user: { btcData: { address: userAddress } } } = getState()
    address = address || userAddress

    const type = (ownType) ? ownType : 'btc'

    if (!typeforce.isCoinAddress['BTC'](address)) {
      resolve([])
    }

    const url = `/txs/?address=${address}`

    return apiLooper.get('bitpay', url, {
      checkStatus: (answer) => {
        try {
          if (answer && answer.txs !== undefined) return true
        } catch (e) { /* */ }
        return false
      },
      inQuery: {
        delay: 500,
        name: `balance`,
      },
    }).then((res) => {
      const transactions = res.txs.map((item) => {
        const direction = item.vin[0].addr !== address ? 'in' : 'out'

        const isSelf = direction === 'out'
          && item.vout.filter((item) => {
              const voutAddrBuf = Buffer.from(item.scriptPubKey.hex, 'hex')
              const currentAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)
              return currentAddress === address
          }).length === item.vout.length

        return({
          type,
          hash: item.txid,
          canEdit: (myAllWallets.indexOf(address) !== -1),
          confirmations: item.confirmations,
          value: isSelf
            ? item.fees
            : item.vout.filter((item) => {
              const voutAddrBuf = Buffer.from(item.scriptPubKey.hex, 'hex')
              const currentAddress = bitcoin.address.fromOutputScript(voutAddrBuf, btc.network)

              return direction === 'in'
                ? (currentAddress === address)
                : (currentAddress !== address)
            })[0].value,
          date: item.time * 1000,
          direction: isSelf ? 'self' : direction,
        })
      })
      resolve(transactions)
    })
      .catch((error) => {
        console.error(error)
        resolve([])
      })
  })

const addressIsCorrect = (address) => {
  try {
    let outputScript = bitcoin.address.toOutputScript(address, btc.network)
    if (outputScript) return true
  } catch (e) {}
  return false
}

const send = (data) => {
  return sendV5(data)
  // v4 with deprecated TransactionBuilder
  return (hasAdminFee) ? sendWithAdminFee(data) : sendDefault(data)
}

// Deprecated
const sendWithAdminFee = async ({ from, to, amount, feeValue, speed } = {}) => {
  const {
    fee: adminFee,
    address: adminFeeAddress,
    min: adminFeeMinValue,
  } = config.opts.fee.btc
  const adminFeeMin = BigNumber(adminFeeMinValue)

  // fee - from amount - percent
  let feeFromAmount = BigNumber(adminFee).dividedBy(100).multipliedBy(amount)
  if (adminFeeMin.isGreaterThan(feeFromAmount)) feeFromAmount = adminFeeMin

  feeFromAmount = feeFromAmount.multipliedBy(1e8).integerValue() // Admin fee in satoshi


  feeValue = feeValue || await btc.estimateFeeValue({ inSatoshis: true, speed })

  const tx = new bitcoin.TransactionBuilder(btc.network)
  const unspents = await fetchUnspents(from)

  let fundValue = new BigNumber(String(amount)).multipliedBy(1e8).integerValue().toNumber()

  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0)
  const skipValue = totalUnspent - fundValue - feeValue - feeFromAmount

  unspents.forEach(({ txid, vout }) => tx.addInput(txid, vout, 0xfffffffe))
  tx.addOutput(to, fundValue)

  if (skipValue > 546) {
    tx.addOutput(from, skipValue)
  }

  // admin fee output
  tx.addOutput(adminFeeAddress, feeFromAmount.toNumber())

  const txRaw = signAndBuild(tx, from)

  await broadcastTx(txRaw.toHex())

  return txRaw
}

const sendV5 = async ({ from, to, amount, feeValue, speed, stateCallback } = {}) => {
  const privateKey = getPrivateKeyByAddress(from)

  const keyPair = bitcoin.ECPair.fromWIF(privateKey, btc.network)

  // fee - from amount - percent

  let feeFromAmount = BigNumber(0)
  if (hasAdminFee) {
    const {
      fee: adminFee,
      min: adminFeeMinValue,
    } = config.opts.fee.btc
    const adminFeeMin = BigNumber(adminFeeMinValue)

    feeFromAmount = BigNumber(adminFee).dividedBy(100).multipliedBy(amount)
    if (adminFeeMin.isGreaterThan(feeFromAmount)) feeFromAmount = adminFeeMin

    feeFromAmount = feeFromAmount.multipliedBy(1e8).integerValue().toNumber() // Admin fee in satoshi
  }

  feeValue = feeValue || await btc.estimateFeeValue({ inSatoshis: true, speed })

  const unspents = await fetchUnspents(from)
  const fundValue = new BigNumber(String(amount)).multipliedBy(1e8).integerValue().toNumber()
  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0)
  const skipValue = totalUnspent - fundValue - feeValue - feeFromAmount

  const psbt = new bitcoin.Psbt({network: btc.network})

  psbt.addOutput({
    address: to,
    value: fundValue,
  })

  if (skipValue > 546) {
    psbt.addOutput({
      address: from,
      value: skipValue
    })
  }

  if (hasAdminFee) {
    psbt.addOutput({
      address: hasAdminFee.address,
      value: feeFromAmount,
    })
  }

  for (let i = 0; i < unspents.length; i++) {
    const { txid, vout } = unspents[i]
    let rawTx = false
    rawTx = await fetchTxRaw(txid)

    psbt.addInput({
      hash: txid,
      index: vout,
      nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
    })
  }

  psbt.signAllInputs(keyPair)
  psbt.finalizeAllInputs()

  const rawTx = psbt.extractTransaction().toHex();

  const broadcastAnswer = await broadcastTx(rawTx)

  const { txid } = broadcastAnswer
  return txid
}

// Deprecated
const sendDefault = async ({ from, to, amount, feeValue, speed } = {}) => {
  feeValue = feeValue || await btc.estimateFeeValue({ inSatoshis: true, speed })

  const tx = new bitcoin.TransactionBuilder(btc.network)
  const unspents = await fetchUnspents(from)

  const fundValue = new BigNumber(String(amount)).multipliedBy(1e8).integerValue().toNumber()
  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0)
  const skipValue = totalUnspent - fundValue - feeValue

  unspents.forEach(({ txid, vout }) => tx.addInput(txid, vout, 0xfffffffe))
  tx.addOutput(to, fundValue)

  if (skipValue > 546) {
    tx.addOutput(from, skipValue)
  }



  const txRaw = signAndBuild(tx, from)

  await broadcastTx(txRaw.toHex())

  return txRaw
}

const signAndBuild = (transactionBuilder, address) => {
  let { user: { btcData: { privateKey } } } = getState()

  if (address) {
    // multi wallet - sweep upgrade
    privateKey = getPrivateKeyByAddress(address)
  } else {
    // single wallet - use btcData
  }

  const keyPair = bitcoin.ECPair.fromWIF(privateKey, btc.network)

  transactionBuilder.__INPUTS.forEach((input, index) => {
    transactionBuilder.sign(index, keyPair)
  })
  return transactionBuilder.buildIncomplete()
}

const fetchUnspents = (address) =>
  apiLooper.get('bitpay', `/addr/${address}/utxo`, { cacheResponse: 5000 })

const broadcastTx = (txRaw) => {
  return new Promise(async (resolve, reject) => {
    let answer = false
    try {
      answer = await apiLooper.post('bitpay', `/tx/send`, {
        body: {
          rawtx: txRaw,
        },
      })
    } catch (e) {}
    if (!answer || !answer.txid) {
      // use blockcryper
      const bcAnswer = await apiLooper.post('blockcypher', `/txs/push`, {
        body: {
          tx: txRaw,
        },
      })
      if (bcAnswer
        && bcAnswer.tx
        && bcAnswer.tx.hash) {
        resolve({
          txid: bcAnswer.tx.hash,
        })
      } else {
        reject()
      }
    } else {
      resolve(answer)
    }
  })
}

const signMessage = (message, encodedPrivateKey) => {
  const keyPair = bitcoin.ECPair.fromWIF(encodedPrivateKey, [bitcoin.networks.bitcoin, bitcoin.networks.testnet])
  const privateKeyBuff = Buffer.from(keyPair.privateKey)

  const signature = bitcoinMessage.sign(message, privateKeyBuff, keyPair.compressed)

  return signature.toString('base64')
}

const getReputation = () => Promise.resolve(0)

window.getMainPublicKey = getMainPublicKey

/*
  Проверяет списание со скрипта - последняя транзакция выхода
  Возвращает txId, адресс и сумму
*/
const checkWithdraw = (scriptAddress) => {
  const url = `/txs/?address=${scriptAddress}`

  return apiLooper.get('bitpay', url, {
    checkStatus: (answer) => {
      try {
        if (answer && answer.txs !== undefined) return true
      } catch (e) { /* */ }
      return false
    },
  }).then((res) => {
    if (res.txs.length > 1
      && res.txs[0].vout.length
    ) {
      const address = res.txs[0].vout[0].scriptPubKey.addresses[0]
      const {
        txid,
        valueOut: amount,
      } = res.txs[0]
      return {
        address,
        txid,
        amount,
      }
    }
    return false
  })
}


export default {
  login,
  checkWithdraw,
  getBalance,
  getTransaction,
  send,
  fetchUnspents,
  broadcastTx,
  fetchTx,
  fetchTxInfo,
  fetchBalance,
  signMessage,
  getReputation,
  getTx,
  getLinkToInfo,
  getInvoices,
  getWalletByWords,
  getRandomMnemonicWords,
  validateMnemonicWords,
  sweepToMnemonic,
  isSweeped,
  getSweepAddress,
  getAllMyAddresses,
  getDataByAddress,
  getMainPublicKey,
  getTxRouter,
  fetchTxRaw,
  addressIsCorrect,
  convertMnemonicToValid,
  findWallet,
}
