import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import helpers, { constants, links, request } from 'helpers'
import actions from 'redux/actions'
import Link from 'local_modules/sw-valuelink'
import { connect } from 'redaction'
import config from 'helpers/externalConfig'
import { localisedUrl } from 'helpers/locale'

import cssModules from 'react-css-modules'
import styles from './WithdrawModal.scss'

import { BigNumber } from 'bignumber.js'
import Coin from 'components/Coin/Coin'
import Modal from 'components/modal/Modal/Modal'
import FieldLabel from 'components/forms/FieldLabel/FieldLabel'
import Input from 'components/forms/Input/Input'
import Button from 'components/controls/Button/Button'
import Tooltip from 'components/ui/Tooltip/Tooltip'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'
import { isMobile } from 'react-device-detect'
import QrReader from 'components/QrReader'
import InvoiceInfoBlock from 'components/InvoiceInfoBlock/InvoiceInfoBlock'

// import isCoinAddress from 'swap.app/util/typeforce'
import typeforce from 'swap.app/util/typeforce'
import minAmount from 'helpers/constants/minAmount'
import { inputReplaceCommaWithDot } from 'helpers/domUtils'

import redirectTo from 'helpers/redirectTo'
import AdminFeeInfoBlock from 'components/AdminFeeInfoBlock/AdminFeeInfoBlock'

import { getActivatedCurrencies } from 'helpers/user'

import CurrencyList from './components/CurrencyList'
import getCurrencyKey from 'helpers/getCurrencyKey'
import lsDataCache from 'helpers/lsDataCache'

import adminFee from 'helpers/adminFee'
import feedback from 'shared/helpers/feedback'
import metamask from 'helpers/metamask'

const isDark = localStorage.getItem(constants.localStorage.isDark)

@injectIntl
@connect(
  ({
    currencies,
    user: {
      ethData,
      btcData,
      ghostData,
      nextData,
      tokensData,
      activeFiat,
      isBalanceFetching,
      activeCurrency,
    },
    ui: { dashboardModalsAllowed },
  }) => ({
    activeFiat,
    activeCurrency,
    currencies: currencies.items,
    items: [ethData, btcData, ghostData, nextData],
    tokenItems: [...Object.keys(tokensData).map((k) => tokensData[k])],
    dashboardView: dashboardModalsAllowed,
    isBalanceFetching,
  })
)
@cssModules(styles, { allowMultiple: true })
export default class WithdrawModal extends React.Component<any, any> {
  props: any

  static propTypes = {
    name: PropTypes.string,
    data: PropTypes.object,
  }

  fiatRates: any

  constructor(data) {
    //@ts-ignore
    super()

    const {
      data: { amount, toAddress, currency, address: withdrawWallet },
    } = data

    const currentActiveAsset = data.data

    const currentDecimals = constants.tokenDecimals[getCurrencyKey(currency, true).toLowerCase()]
    const allCurrencyies = actions.core.getWallets({}) //items.concat(tokenItems)
    const selectedItem = actions.user.getWithdrawWallet(currency, withdrawWallet)

    const usedAdminFee = adminFee.isEnabled(selectedItem.currency)

    this.state = {
      isShipped: false,
      usedAdminFee,
      openScanCam: '',
      address: toAddress ? toAddress : '',
      amount: amount ? amount : '',
      balance: selectedItem.balance || 0,
      selectedItem,
      ethBalance: null,
      isEthToken: helpers.ethToken.isEthToken({ name: currency.toLowerCase() }),
      currentDecimals,
      selectedValue: currency,
      getFiat: 0,
      error: false,
      ownTx: '',
      isAssetsOpen: false,
      hiddenCoinsList: actions.core.getHiddenCoins(),
      currentActiveAsset,
      allCurrencyies,
      enabledCurrencies: getActivatedCurrencies(),
      wallet: selectedItem,
      devErrorMessage: false,
      tokenFee: `(Fetching fee)`,
      fetchFee: true,
      adminFeeSize: null,
    }
  }

  componentDidMount() {
    this.fiatRates = {}
    this.getFiatBalance()
    this.actualyMinAmount()
    this.setBalanceOnState()
    //@ts-ignore
    feedback.withdraw.entered()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data || prevProps.items !== this.props.items) {
      this.setCurrenctActiveAsset()
    }
    if (
      prevProps.isBalanceFetching != this.props.isBalanceFetching &&
      prevProps.isBalanceFetching === true
    ) {
      this.setBalanceOnState()
    }
  }

  setCurrenctActiveAsset = () => {
    const { items, tokenItems, data } = this.props
    const allCurrencyies = items.concat(tokenItems)
    this.setState({
      currentActiveAsset: data,
      allCurrencyies,
    })
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.amount = this.fixDecimalCountETH(nextState.amount)
  }

  fixDecimalCountETH = (amount) => {
    if (this.props.data.currency === 'ETH' && new BigNumber(amount).dp() > 18) {
      const amountInt = new BigNumber(amount).integerValue()
      const amountDecimal = new BigNumber(amount).mod(1)

      const amountIntStr = amountInt.toString()
      const amountDecimalStr = new BigNumber(new BigNumber(amountDecimal).toPrecision(15))
        .toString()
        .substring(1)
      const regexr = /[e+-]/g

      const result = amountIntStr + amountDecimalStr

      console.warn(
        'To avoid [ethjs-unit]error: while converting number with more then 18 decimals to wei - you can`t afford yourself add more than 18 decimals'
      ) // eslint-disable-line
      if (regexr.test(result)) {
        console.warn(
          'And ofcourse you can not write number which can not be saved without an exponential notation in JS'
        )
        return 0
      }
      return result
    }
    return amount
  }

  getMinAmountForEthToken = () => {
    const { currentDecimals } = this.state

    let ethTokenMinAmount = '0.'

    for (let a = 0; a < currentDecimals - 1; a++) {
      ethTokenMinAmount += '0'
    }

    return (ethTokenMinAmount += '1')
  }

  actualyMinAmount = async () => {
    const {
      data: { currency },
    } = this.props
    const {
      isEthToken,
      wallet: { address },
      wallet,
      usedAdminFee,
      adminFeeSize,
      amount,
    } = this.state

    const currentCoin = getCurrencyKey(currency, true).toLowerCase()

    if (isEthToken) {
      minAmount[currentCoin] = +this.getMinAmountForEthToken()
      //@ts-ignore
      minAmount.eth = await helpers.eth.estimateFeeValue({
        method: 'send',
        speed: 'fast',
      })

      const tokenFee = await helpers.ethToken.estimateFeeValue({
        method: 'send',
        speed: 'fast',
      })

      this.setState({
        tokenFee,
      })
    }

    if (constants.coinsWithDynamicFee.includes(currentCoin)) {
      let method = 'send'
      if (wallet.isUserProtected) method = 'send_multisig'
      if (wallet.isPinProtected) method = 'send_2fa'
      if (wallet.isSmsProtected) method = 'send_2fa'

      minAmount[currentCoin] = await helpers[currentCoin].estimateFeeValue({
        method,
        speed: 'fast',
        address,
      })

      this.setState({
        fetchFee: false,
      })
    }

    const valueAdminFee = usedAdminFee ? adminFee.calc(wallet.currency, amount) : 0

    this.setState({
      fetchFee: false,
      adminFeeSize: valueAdminFee,
    })
  }

  setBalanceOnState = async () => {
    const {
      wallet: { currency, address },
    } = this.state

    const wallet = actions.user.getWithdrawWallet(currency, address)

    const { balance, unconfirmedBalance } = wallet

    const finalBalance =
      unconfirmedBalance !== undefined && unconfirmedBalance < 0
        ? new BigNumber(balance).plus(unconfirmedBalance).toString()
        : balance

    const ethBalance =
      metamask.isEnabled() && metamask.isConnected()
        ? metamask.getBalance()
        : await actions.eth.getBalance()

    this.setState(() => ({
      balance: finalBalance,
      ethBalance,
      selectedItem: wallet,
    }))
  }

  getFiatBalance = async () => {
    const {
      data: { currency },
      activeFiat,
    } = this.props

    const exCurrencyRate = await actions.user.getExchangeRate(currency, activeFiat.toLowerCase())

    this.setState(() => ({ exCurrencyRate }))
  }

  handleSubmit = async () => {
    //@ts-ignore
    feedback.withdraw.started()

    const { address: to, amount, ownTx, usedAdminFee, wallet } = this.state

    const {
      data: { currency, address, invoice, onReady },
      name,
    } = this.props

    this.setState(() => ({
      isShipped: true,
      error: false,
      devErrorMessage: false,
    }))

    this.setBalanceOnState()

    let sendOptions = {
      to,
      amount,
      speed: 'fast',
    }

    const adminFeeSize = usedAdminFee ? adminFee.calc(wallet.currency, amount) : 0

    if (helpers.ethToken.isEthToken({ name: currency.toLowerCase() })) {
      sendOptions = {
        ...sendOptions,
        //@ts-ignore
        name: currency.toLowerCase(),
        // from: address, // Need check eth
      }
    } else {
      sendOptions = {
        ...sendOptions,
        //@ts-ignore
        from: address,
      }
    }

    // Опрашиваем балансы отправителя и получателя на момент выполнения транзакции
    // Нужно для расчета final balance получателя и отправителя
    let beforeBalances = false
    try {
      // beforeBalances = await helpers.transactions.getTxBalances(currency, address, to)
    } catch (e) {
      console.log('Fail fetch balances - may be destination is segwit')
      console.error(e)
    }

    if (invoice && ownTx) {
      await actions.invoices.markInvoice(invoice.id, 'ready', ownTx, address)
      actions.loader.hide()
      actions.notifications.show(constants.notifications.SuccessWithdraw, {
        amount,
        currency,
        address: to,
      })
      this.setState(() => ({ isShipped: false, error: false }))
      actions.modals.close(name)
      if (onReady instanceof Function) {
        onReady()
      }
      return
    }

    if (wallet.isPinProtected || wallet.isSmsProtected || wallet.isUserProtected) {
      let nextStepModal = constants.modals.WithdrawBtcPin
      if (wallet.isSmsProtected) nextStepModal = constants.modals.WithdrawBtcSms
      if (wallet.isUserProtected) nextStepModal = constants.modals.WithdrawBtcMultisig

      actions.modals.close(name)
      actions.modals.open(nextStepModal, {
        wallet,
        invoice,
        sendOptions,
        beforeBalances,
        onReady,
        adminFee: adminFeeSize,
      })
      return
    }

    await actions[currency.toLowerCase()]
      .send(sendOptions)
      .then(async (txRaw) => {
        actions.loader.hide()
        actions[currency.toLowerCase()].getBalance(currency)
        if (invoice) {
          await actions.invoices.markInvoice(invoice.id, 'ready', txRaw, address)
        }
        this.setBalanceOnState()

        this.setState(() => ({
          isShipped: false,
          error: false,
        }))

        if (onReady instanceof Function) {
          onReady()
        }

        // Redirect to tx
        const txInfo = helpers.transactions.getInfo(currency.toLowerCase(), txRaw)
        const { tx: txId } = txInfo

        // Не используем await. Сбрасываем статистику по транзакции (final balance)
        // Без блокировки клиента
        // Результат и успешность запроса критического значения не имеют
        helpers.transactions.pullTxBalances(txId, amount, beforeBalances, adminFee)

        // Сохраняем транзакцию в кеш
        const txInfoCache = {
          amount,
          senderAddress: address,
          receiverAddress: to,
          confirmed: false,
          adminFee: adminFeeSize,
        }

        lsDataCache.push({
          key: `TxInfo_${currency.toLowerCase()}_${txId}`,
          time: 3600,
          data: txInfoCache,
        })
        //@ts-ignore
        feedback.withdraw.finished()

        const txInfoUrl = helpers.transactions.getTxRouter(currency.toLowerCase(), txId)
        redirectTo(txInfoUrl)
      })
      .then(() => {
        actions.modals.close(name)
      })
      .catch((e) => {
        //@ts-ignore
        feedback.withdraw.failed()
        const errorText = e.res ? e.res.text : ''
        const error = {
          name: {
            id: 'Withdraw218',
            defaultMessage: 'Withdrawal error',
          },
          message: {
            id: 'ErrorNotification12',
            defaultMessage: 'Oops, looks like something went wrong!',
          },
        }

        if (/insufficient priority|bad-txns-inputs-duplicate/.test(errorText)) {
          error.message = {
            id: 'Withdraw232',
            defaultMessage: 'There is not enough confirmation of the last transaction. Try later.',
          }
        }

        console.error(error.name.defaultMessage, ':', e)

        this.setState(() => ({
          error,
          devErrorMessage: e.message,
          isShipped: false,
        }))
      })
  }

  isEthOrERC20() {
    const { ethBalance, isEthToken, tokenFee } = this.state

    return isEthToken === true && ethBalance < tokenFee
  }

  addressIsCorrect() {
    const {
      data: { currency },
    } = this.props
    const { address, isEthToken, wallet } = this.state

    if (getCurrencyKey(currency, false).toLowerCase() === `btc`) {
      if (!typeforce.isCoinAddress.BTC(address)) {
        return actions.btc.addressIsCorrect(address)
      } else return true
    }

    if (isEthToken) {
      return typeforce.isCoinAddress.ETH(address)
    }

    return typeforce.isCoinAddress[getCurrencyKey(currency, false).toUpperCase()](address)
  }

  openScan = () => {
    const { openScanCam } = this.state

    this.setState(() => ({
      openScanCam: !openScanCam,
    }))
  }

  handleError = (err) => {
    console.error(err)
  }

  handleScan = (data) => {
    if (data) {
      const address = data.split(':')[1].split('?')[0]
      const amount = data.split('=')[1]

      this.setState(() => ({ address, amount }))
      this.openScan()
    }
  }

  handleDollarValue = (value) => {
    const { currentDecimals, exCurrencyRate } = this.state

    this.setState({
      fiatAmount: value,
      amount: value ? (value / exCurrencyRate).toFixed(currentDecimals) : '',
    })
  }

  handleAmount = (value) => {
    const { exCurrencyRate } = this.state

    this.setState({
      fiatAmount: value ? (value * exCurrencyRate).toFixed(2) : '',
      amount: value,
    })
  }

  handleClose = () => {
    const {
      history,
      intl: { locale },
    } = this.props
    const { name } = this.props
    history.push(localisedUrl(locale, links.home))
    actions.modals.close(name)
  }

  handleBuyCurrencySelect = (value) => {
    this.setState({
      selectedValue: value,
    })
  }

  render() {
    const {
      error,
      ownTx,
      amount,
      address,
      balance,
      isShipped,
      fiatAmount,
      isEthToken,
      openScanCam,
      isAssetsOpen,
      exCurrencyRate,
      currentDecimals,
      hiddenCoinsList,
      currentActiveAsset,
      selectedValue,
      allCurrencyies: allData,
      usedAdminFee,
      enabledCurrencies,
      devErrorMessage,
      tokenFee,
      fetchFee,
      adminFeeSize,
    } = this.state

    const { name, intl, portalUI, activeFiat, activeCurrency, dashboardView } = this.props

    const linked = Link.all(this, 'address', 'amount', 'ownTx', 'fiatAmount', 'amountRUB', 'amount')

    const {
      currency,
      address: currentAddress,
      balance: currentBalance,
      infoAboutCurrency,
      invoice,
    } = currentActiveAsset

    const currencyView = getCurrencyKey(currentActiveAsset.currency, true).toUpperCase()
    const selectedValueView = getCurrencyKey(selectedValue, true).toUpperCase()

    let tableRows = actions.core.getWallets({}).filter(({ currency, address, balance }) => {
      // @ToDo - В будущем нужно убрать проверку только по типу монеты.
      // Старую проверку оставил, чтобы у старых пользователей не вывалились скрытые кошельки

      return (
        (!hiddenCoinsList.includes(currency) &&
          !hiddenCoinsList.includes(`${currency}:${address}`)) ||
        balance > 0
      )
    })

    tableRows = tableRows.filter(({ currency }) => enabledCurrencies.includes(currency))

    let dinamicFee = isEthToken ? 0 : minAmount[getCurrencyKey(currency, false).toLowerCase()]
    let defaultMinFee = dinamicFee // non-changing value in an amount hint
 
    dinamicFee = usedAdminFee
      ? new BigNumber(dinamicFee).plus(adminFee.calc(currency, amount)).toNumber()
      : dinamicFee

    let allowedCriptoBalance: BigNumber | 0 = new BigNumber(balance).minus(defaultMinFee)
    let allowedUsdBalance: BigNumber | 0 = new BigNumber(
      ((allowedCriptoBalance as any) * exCurrencyRate) as number
    ).dp(2, BigNumber.ROUND_FLOOR)
    
    allowedCriptoBalance = +allowedCriptoBalance > 0 ? allowedCriptoBalance : 0
    allowedUsdBalance = +allowedUsdBalance > 0 ? allowedUsdBalance : 0

    const criptoValueIsOk = new BigNumber(
      linked.amount.pipe(this.handleAmount).value
    ).isLessThanOrEqualTo(allowedCriptoBalance)
    const usdValueIsOk = new BigNumber(
      linked.fiatAmount.pipe(this.handleAmount).value
    ).isLessThanOrEqualTo(allowedUsdBalance)
    
    const setMaxBalance = () => {
      this.setState({
        amount: allowedCriptoBalance,
        fiatAmount: allowedUsdBalance,
      })
    }

    const isDisabled =
      !address ||
      !+amount || // string to number -> inverting
      isShipped ||
      ownTx ||
      !this.addressIsCorrect() ||
      !criptoValueIsOk ||
      !usdValueIsOk ||
      new BigNumber(amount).isGreaterThan(balance) ||
      new BigNumber(amount).dp() > currentDecimals ||
      this.isEthOrERC20()

    const labels = defineMessages({
      withdrowModal: {
        id: 'withdrowTitle271',
        defaultMessage: `Send`,
      },
      balanceFiatMobile: {
        id: 'Withdraw_FiatBalanceMobile',
        defaultMessage: '~{amount} {currency}',
      },
      balanceFiatDesktop: {
        id: 'Withdraw_FiatBalanceDesktop',
        defaultMessage: 'это ~{amount} {currency}',
      },
      balanceMobile: {
        id: 'Withdraw_BalanceMobile',
        defaultMessage: '{amount} {currency}',
      },
      balanceDesktop: {
        id: 'Withdraw_BalanceDesktop',
        defaultMessage: '{amount} {currency} будет отправленно',
      },
      ownTxPlaceholder: {
        id: 'withdrawOwnTxPlaceholder',
        defaultMessage: 'Если оплатили с другого источника',
      },
    })

    const amountInputKeyDownCallback = (event) => {
      const BACKSPACE_CODE = 8
      const LEFT_ARROW = 37
      const RIGHT_ARROW = 39
      const ZERO_CODE = 48
      const NINE_CODE = 57

      if (
        !(
          (event.keyCode >= ZERO_CODE && event.keyCode <= NINE_CODE) ||
          event.keyCode === BACKSPACE_CODE ||
          event.keyCode === LEFT_ARROW ||
          event.keyCode === RIGHT_ARROW ||
          event.key === '.'
        )
      ) {
        event.preventDefault()
      }
    }

    const dataCurrency = isEthToken ? 'ETH' : currency.toUpperCase()

    const formRender = (
      <Fragment>
        {openScanCam && (
          <QrReader
            openScan={this.openScan}
            handleError={this.handleError}
            handleScan={this.handleScan}
          />
        )}
        {invoice && <InvoiceInfoBlock invoiceData={invoice} />}
        {!dashboardView && (
          <p styleName={isEthToken ? 'rednotes' : 'notice'}>
            <FormattedMessage
              id="Withdrow213"
              defaultMessage="Please note: Fee is {minAmount} {data}.{br}Your balance must exceed this sum to perform transaction"
              values={{
                minAmount: <span>{isEthToken ? minAmount.eth : dinamicFee}</span>,
                br: <br />,
                data: `${dataCurrency}`,
              }}
            />
          </p>
        )}

        <div style={{ marginBottom: '40px' }}>
          <div styleName="customSelectContainer">
            <FieldLabel>
              <FormattedMessage id="Withdrow559" defaultMessage="Отправить с кошелька " />
            </FieldLabel>
            <CurrencyList
              {...this.props}
              currentActiveAsset={currentActiveAsset}
              currentBalance={currentBalance}
              currency={currency}
              exCurrencyRate={exCurrencyRate}
              activeFiat={activeFiat}
              tableRows={tableRows}
              currentAddress={currentAddress}
            />
          </div>
        </div>
        <div styleName="highLevel">
          <FieldLabel>
            <FormattedMessage id="Withdrow1194" defaultMessage="Address " />{' '}
            <Tooltip id="WtH203">
              <div style={{ textAlign: 'center' }}>
                <FormattedMessage
                  id="WTH275"
                  defaultMessage="Make sure the wallet you{br}are sending the funds to supports {currency}"
                  values={{
                    br: <br />,
                    currency: `${currency.toUpperCase()}`,
                  }}
                />
              </div>
            </Tooltip>
          </FieldLabel>
          <Input
            valueLink={linked.address}
            focusOnInit
            pattern="0-9a-zA-Z:"
            placeholder={`Enter ${currency.toUpperCase()} address to transfer`}
            qr={isMobile}
            withMargin
            openScan={this.openScan}
          />
          {/*
           * show invalid value warning in address input
           */}
          {address && !this.addressIsCorrect() && (
            <div styleName="rednote bottom0">
              <FormattedMessage
                id="WithdrawIncorectAddress"
                defaultMessage="Your address not correct"
              />
            </div>
          )}
        </div>
        <div styleName={`lowLevel ${isDark ? 'dark' : ''}`} style={{ marginBottom: '50px' }}>
          <div styleName="additionalСurrencies">
            <span
              styleName={cx('additionalСurrenciesItem', {
                additionalСurrenciesItemActive: selectedValue.toUpperCase() === activeFiat,
              })}
              onClick={() => this.handleBuyCurrencySelect(activeFiat)}
            >
              {activeFiat}
            </span>
            <span styleName="delimiter"></span>
            <span
              styleName={cx('additionalСurrenciesItem', {
                additionalСurrenciesItemActive:
                  selectedValueView.toUpperCase() === currencyView.toUpperCase(),
              })}
              onClick={() => this.handleBuyCurrencySelect(currentActiveAsset.currency)}
            >
              {currencyView}
            </span>
          </div>
          <p styleName="balance">
            {amount > 0 && (
              <FormattedMessage
                {...labels[
                  selectedValue !== activeFiat
                    ? isMobile
                      ? `balanceFiatMobile`
                      : `balanceFiatDesktop`
                    : isMobile
                    ? `balanceMobile`
                    : `balanceDesktop`
                ]}
                values={{
                  amount:
                    selectedValue !== activeFiat
                      ? new BigNumber(fiatAmount).dp(2, BigNumber.ROUND_FLOOR)
                      : new BigNumber(amount).dp(6, BigNumber.ROUND_FLOOR),
                  currency: selectedValue !== activeFiat ? activeFiat : currencyView.toUpperCase(),
                }}
              />
            )}
          </p>
          <FieldLabel>
            <FormattedMessage id="Withdrow118" defaultMessage="Amount" />
          </FieldLabel>

          <div styleName="group">
            {selectedValue === currentActiveAsset.currency ? (
              <Input
                type="number"
                valueLink={linked.amount.pipe(this.handleAmount)}
                onKeyDown={amountInputKeyDownCallback}
              />
            ) : (
              <Input
                type="number"
                valueLink={linked.fiatAmount.pipe(this.handleDollarValue)}
                onKeyDown={amountInputKeyDownCallback}
              />
            )}
            {/* 
              showing hint about maximum possible amount
            */}
            {dashboardView && (
              <div styleName={'note'}>
                {selectedValue === currentActiveAsset.currency ? (
                  <FormattedMessage
                    id="Withdrow170"
                    defaultMessage="Maximum amount you can send is {allowedCriptoBalance} {currency}"
                    values={{
                      allowedCriptoBalance: `${allowedCriptoBalance}`,
                      currency: `${getCurrencyKey(dataCurrency, true).toUpperCase()}`,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="Withdrow171"
                    defaultMessage="Maximum amount you can send is {allowedUsdBalance} USD"
                    values={{
                      allowedUsdBalance: `${allowedUsdBalance}`,
                    }}
                  />
                )}{' '}
                {/* ^ for indent before the tooltip */}
                <Tooltip id="WtH204">
                  <div style={{ maxWidth: '24em', textAlign: 'center' }}>
                    <FormattedMessage
                      id="WTH276"
                      defaultMessage="The amount should not exceed your{br} current balance minus mining fee"
                      values={{
                        br: <br />,
                      }}
                    />
                </div>
                </Tooltip>
              </div>
            )}
            <div style={{ marginLeft: '15px' }}>
              <Button disabled={fetchFee} blue big onClick={setMaxBalance} id="Withdrow134">
                <FormattedMessage id="Select210" defaultMessage="MAX" />
              </Button>
            </div>
            {!isMobile && (
              <Tooltip id="Withdrow134" place="top" mark={false}>
                <FormattedMessage
                  id="WithdrawButton32"
                  defaultMessage="When you click this button, in the field, an amount{br}equal to your balance minus the miners commission will appear"
                  values={{
                    br: <br />,
                  }}
                />
              </Tooltip>
            )}
          </div>
          {this.isEthOrERC20() && (
            <div styleName="rednote">
              <FormattedMessage
                id="WithdrawModal263"
                defaultMessage="You need {minAmount} ETH on your balance"
                values={{ minAmount: `${isEthToken ? tokenFee : minAmount.eth}` }}
              />
            </div>
          )}
        </div>
        <div styleName="sendBtnsWrapper">
          <div styleName="actionBtn">
            <Button big fill gray onClick={this.handleClose}>
              <Fragment>
                <FormattedMessage id="WithdrawModalCancelBtn" defaultMessage="Cancel" />
              </Fragment>
            </Button>
          </div>
          <div styleName="actionBtn">
            <Button blue big fill disabled={isDisabled} onClick={this.handleSubmit}>
              {isShipped ? (
                <Fragment>
                  <FormattedMessage id="WithdrawModal11212" defaultMessage="Processing ..." />
                </Fragment>
              ) : (
                <Fragment>
                  <FormattedMessage id="WithdrawModal111" defaultMessage="Send" />{' '}
                  {`${currency.toUpperCase()}`}
                </Fragment>
              )}
            </Button>
          </div>
        </div>
        {usedAdminFee && isEthToken && (
          <AdminFeeInfoBlock {...usedAdminFee} amount={amount} currency={currency} />
        )}
        {error && (
          <div styleName="rednote">
            <FormattedMessage
              id="WithdrawModalErrorSend"
              defaultMessage="{errorName} {currency}:{br}{errorMessage}"
              values={{
                errorName: intl.formatMessage(error.name),
                errorMessage: intl.formatMessage(error.message),
                br: <br />,
                currency: `${currency}`,
              }}
            />
            <br />
            {devErrorMessage && <span>Dev info: {devErrorMessage}</span>}
          </div>
        )}
        {invoice && (
          <Fragment>
            <hr />
            <div styleName="lowLevel" style={{ marginBottom: '50px' }}>
              <div styleName="groupField">
                <div styleName="downLabel">
                  <FieldLabel inRow>
                    <span styleName="mobileFont">
                      <FormattedMessage id="WithdrowOwnTX" defaultMessage="Или укажите TX" />
                    </span>
                  </FieldLabel>
                </div>
              </div>
              <div styleName="group">
                <Input
                  styleName="input"
                  valueLink={linked.ownTx}
                  placeholder={`${intl.formatMessage(labels.ownTxPlaceholder)}`}
                />
              </div>
            </div>
            <Button
              styleName="buttonFull"
              blue
              big
              fullWidth
              disabled={!ownTx || isShipped}
              onClick={this.handleSubmit}
            >
              {isShipped ? (
                <Fragment>
                  <FormattedMessage id="WithdrawModal11212" defaultMessage="Processing ..." />
                </Fragment>
              ) : (
                <FormattedMessage
                  id="WithdrawModalInvoiceSaveTx"
                  defaultMessage="Отметить как оплаченный"
                />
              )}
            </Button>
          </Fragment>
        )}
        {dashboardView && (
          <p
            styleName={cx({
              notice: !isEthToken,
              rednotes: isEthToken,
              dashboardViewNotice: dashboardView,
            })}
            >
            {
              usedAdminFee && (
                <>
                  <FormattedMessage
                    id="Withdrow214"
                    defaultMessage="Admin Fee {currency}: {adminFee}"
                    values={{
                      adminFee: `${fetchFee ? '...' : adminFeeSize}`,
                      currency: `${getCurrencyKey(dataCurrency, true).toUpperCase()}`,
                    }}
                  />
                  <br />
                </>
              )
            }
            <FormattedMessage
              id="Withdrow213"
              defaultMessage="Please note: Fee is {minAmount} {data}.{br}Your balance must exceed this sum to perform transaction"
              values={{
                minAmount: <span>{isEthToken ? tokenFee : dinamicFee}</span>,
                br: <br />,
                data: `${getCurrencyKey(dataCurrency, true).toUpperCase()}`,
              }}
            />
          </p>
        )}
      </Fragment>
    )
    return portalUI ? (
      formRender
    ) : (
      <Modal
        name={name}
        onClose={this.handleClose}
        title={`${intl.formatMessage(labels.withdrowModal)}${' '}${currency.toUpperCase()}`}
      >
        <div style={{ paddingBottom: '50px', paddingTop: '15px' }}>{formRender}</div>
      </Modal>
    )
  }
}
