//@ts-ignore
import React, { Component, Fragment } from 'react'
import actions from 'redux/actions'
import { connect } from 'redaction'
import helpers, { constants, links } from 'helpers'
import config from 'helpers/externalConfig'
import { isMobile } from 'react-device-detect'

import cssModules from 'react-css-modules'
import styles from './Row.scss'

import Coin from 'components/Coin/Coin'
import InlineLoader from 'components/loaders/InlineLoader/InlineLoader'
import DropdownMenu from 'components/ui/DropdownMenu/DropdownMenu'
// import LinkAccount from '../LinkAccount/LinkAcount'
import { withRouter } from 'react-router-dom'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'
import { localisedUrl } from 'helpers/locale'
import SwapApp from 'swap.app'
import { BigNumber } from 'bignumber.js'

import dollar from '../images/dollar.svg'
import PartOfAddress from '../components/PartOfAddress'
import Copy from '../../../components/ui/Copy/Copy'
import metamask from 'helpers/metamask'


const langLabels = defineMessages({
  unconfirmedBalance: {
    id: 'RowWallet181',
    defaultMessage: `Unconfirmed balance`,
  },
  msConfirmCount: {
    id: 'RowWallet_MsConfirmCountMobile',
    defaultMessage: `{count} tx wait your confirm`,
  },
})

@injectIntl
@withRouter
@connect(
  (
    {
      rememberedOrders,
      user: {
        activeFiat,
        ethData: {
          address,
          privateKey,
        },
        multisigStatus,
      }
    },
    { currency }
  ) => ({
    activeFiat,
    decline: rememberedOrders.savedOrders,
    multisigStatus,
    ethDataHelper: {
      address,
      privateKey,
    },
  })
)
@cssModules(styles, { allowMultiple: true })
export default class Row extends Component<any, any> {
  state = {
    isBalanceFetching: false,
    viewText: false,
    tradeAllowed: false,
    isAddressCopied: false,
    isTouch: false,
    isBalanceEmpty: true,
    showButtons: false,
    exCurrencyRate: 0,
    existUnfinished: false,
    isDropdownOpen: false,
  }

  static getDerivedStateFromProps({ itemData: { balance } }) {
    return {
      isBalanceEmpty: balance === 0,
    }
  }

  constructor(props) {
    super(props)

  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleSliceAddress)
  }

  async componentDidMount() {
    window.addEventListener('resize', this.handleSliceAddress)
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      itemData: { currency, balance },
    //@ts-ignore
    } = this.props

    if (balance > 0) {
      actions.analytics.balanceEvent({ action: 'have', currency, balance })
    }
  }

  handleReloadBalance = () => {
    const { isBalanceFetching } = this.state
    const {
      itemData: {
        isMetamask,
        isConnected,
        isERC20,
      }
    //@ts-ignore
    } = this.props

    if (isBalanceFetching) {
      return null
    }

    if (isMetamask && !isConnected ) {
      this.setState({
        isBalanceFetching: true,
      }, () => {
        setTimeout(() => {
          this.setState({isBalanceFetching: false})
        }, 500)
      })
      return null
    }

    //@ts-ignore
    this.setState({
      isBalanceFetching: true,
    }, () => {
      setTimeout(async () => {
        const {
          itemData: { currency, address },
        //@ts-ignore
        } = this.props

        switch (currency) {
          case 'BTC (SMS-Protected)':
            //@ts-ignore
            await actions.btcmultisig.getBalance()
            break
          case 'BTC (Multisig)':
            await actions.btcmultisig.getBalanceUser(address)
            break
          case 'BTC (PIN-Protected)':
            //@ts-ignore
            await actions.btcmultisig.getBalancePin()
            break
          default:
            if (isMetamask && !isERC20) {
              await metamask.getBalance()
            } else {
              await actions[currency.toLowerCase()].getBalance(
                currency.toLowerCase(),
                address
              )
            }
        }
        //@ts-ignore
        this.setState(() => ({
          isBalanceFetching: false,
        }))
      }, 250)
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    const getComparableProps = ({ itemData, index, selectId }) => ({
      itemData,
      index,
      selectId,
    })
    return (
      JSON.stringify({
        ...getComparableProps(nextProps),
        ...nextState,
      }) !==
      JSON.stringify({
        //@ts-ignore
        ...getComparableProps(this.props),
        ...this.state,
      })
    )
  }

  handleTouch = (e) => {
    //@ts-ignore
    this.setState({
      isTouch: true,
    })
  }

  handleSliceAddress = () => {
    const {
      itemData: { address },
    //@ts-ignore
    } = this.props

    const firstPart = address.substr(0, 6)
    const secondPart = address.substr(address.length - 4)

    return window.innerWidth < 700 || isMobile || address.length > 42
      ? `${firstPart}...${secondPart}`
      : address
  }

  handleTouchClear = (e) => {
    //@ts-ignore
    this.setState({
      isTouch: false,
    })
  }

  handleCopyAddress = () => {
    //@ts-ignore
    this.setState(
      {
        isAddressCopied: true,
      },
      () => {
        setTimeout(() => {
          //@ts-ignore
          this.setState({
            isAddressCopied: false,
          })
        }, 500)
      }
    )
  }

  handleDisconnectWallet() {
    if (metamask.isEnabled()) {
      metamask.disconnect().then(async () => {
        await actions.user.sign()
        await actions.user.getBalances()
      })
    }
  }

  handleConnectMetamask = () => {
    metamask.connect({}).then(async (connected) => {
      if (connected) {
        await actions.user.sign()
        await actions.user.getBalances()
      }
    })
  }

  handleWithdrawPopup = () => {
    const {
      itemData: { currency },
      itemData
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.Withdraw, itemData)
  }

  handleWithdraw = () => {
    const {
      itemData: { currency, address },
      history,
      intl: { locale },
    //@ts-ignore
    } = this.props

    if (currency.toLowerCase() === 'ghost') {
      this.handleWithdrawPopup()
      return
    }

    if (currency.toLowerCase() === 'next') {
      this.handleWithdrawPopup()
      return
    }

    let targetCurrency = currency
    switch (currency.toLowerCase()) {
      case 'btc (multisig)':
      case 'btc (sms-protected)':
      case 'btc (pin-protected)':
        targetCurrency = 'btc'
        break
    }

    const isToken = helpers.ethToken.isEthToken({ name: currency })

    history.push(
      localisedUrl(
        locale,
        (isToken ? '/token' : '') + `/${targetCurrency}/${address}/send`
      )
    )
  }

  handleHowToExport = () => {
    //@ts-ignore
    const { itemData } = this.props

    if (itemData.isUserProtected) {
      console.log('Not implements')
      return
    }
    if (itemData.isSmsProtected) {
      this.handleHowExportSMS()
      return
    }
    if (itemData.isPinProtected) {
      this.handleHowExportPIN()
      return
    }

    actions.modals.open(constants.modals.HowToExportModal, {
      item: itemData,
    })
  }

  handleHowExportSMS = () => {
    actions.modals.open(constants.modals.RegisterSMSProtected, {
      initStep: 'export',
    })
  }

  handleHowExportPIN = () => {
    actions.modals.open(constants.modals.RegisterPINProtected, {
      initStep: 'export',
    })
  }

  handleReceive = () => {
    const {
      itemData: { currency, address },
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.ReceiveModal, {
      currency,
      address,
    })
  }

  handleShowOptions = () => {
    //@ts-ignore
    this.setState({
      showMobileButtons: true,
    })
  }

  handleGoTrade = (currency) => {
    const {
      intl: { locale },
      decline,
    //@ts-ignore
    } = this.props

    const pair = currency.toLowerCase() === 'btc' ? 'eth' : 'btc'

    if (decline.length === 0) {
      window.scrollTo(0, 0)
      //@ts-ignore
      this.props.history.push(
        localisedUrl(
          locale,
          `${links.exchange}/${currency.toLowerCase()}-to-${pair}`
        )
      )
    } else {
      const getDeclinedExistedSwapIndex = helpers.handleGoTrade.getDeclinedExistedSwapIndex(
        { currency, decline }
      )
      if (getDeclinedExistedSwapIndex !== false) {
        this.handleDeclineOrdersModalOpen(getDeclinedExistedSwapIndex)
      } else {
        window.scrollTo(0, 0)
        //@ts-ignore
        this.props.history.push(
          localisedUrl(
            locale,
            `${links.exchange}/${currency.toLowerCase()}-to-${pair}`
          )
        )
      }
    }
  }

  handleDeclineOrdersModalOpen = (indexOfDecline) => {
    const orders = SwapApp.shared().services.orders.items
    const declineSwap = actions.core.getSwapById(
      //@ts-ignore
      this.props.decline[indexOfDecline]
    )

    if (declineSwap !== undefined) {
      actions.modals.open(constants.modals.DeclineOrdersModal, {
        declineSwap,
      })
    }
  }

  handleMarkCoinAsHidden = (coin) => {
    //@ts-ignore
    actions.core.markCoinAsHidden(coin)
  }

  handleActivateProtected = async () => {
    actions.modals.open(constants.modals.RegisterSMSProtected, {})
  }

  handleActivatePinProtected = async () => {
    actions.modals.open(constants.modals.RegisterPINProtected, {})
  }

  handleGenerateMultisignLink = async () => {
    actions.modals.open(constants.modals.MultisignJoinLink, {})
  }

  handleHowToWithdraw = () => {
    const {
      itemData: { currency, address },
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.HowToWithdrawModal, {
      currency,
      address,
    })
  }

  handleOpenDropdown = () => {
    //@ts-ignore
    this.setState({
      isDropdownOpen: true,
    })
  }

  handleCreateInvoiceLink = () => {
    const {
      itemData: { currency, address },
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.InvoiceLinkModal, {
      currency,
      address,
    })
  }

  handleSwitchMultisign = () => {
    //@ts-ignore
    actions.modals.open(constants.modals.BtcMultisignSwitch)
  }

  handleCreateInvoice = () => {
    const {
      itemData: {
        decimals,
        token,
        contractAddress,
        unconfirmedBalance,
        currency,
        address,
        balance,
      },
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.InvoiceModal, {
      currency,
      address,
      contractAddress,
      decimals,
      token,
      balance,
      unconfirmedBalance,
    })
  }

  goToHistory = () => {
    const {
      history,
      intl: { locale },
    //@ts-ignore
    } = this.props
    history.push(localisedUrl(locale, '/history'))
  }

  goToExchange = () => {
    const {
      history,
      intl: { locale },
    //@ts-ignore
    } = this.props
    history.push(localisedUrl(locale, '/exchange'))
  }

  goToBuy = () => {
    const {
      history,
      intl: { locale },
      currency,
    //@ts-ignore
    } = this.props

    // was pointOfSell

    history.push(
      localisedUrl(
        locale,
        `${links.exchange}/btc-to-${currency.currency.toLowerCase()}`
      )
    )
  }

  deleteThisSwap = () => {
    //@ts-ignore
    actions.core.forgetOrders(this.props.decline[0])
  }

  goToCurrencyHistory = () => {
    const {
      history,
      intl: { locale },
      itemData: { currency, balance, address },
    //@ts-ignore
    } = this.props

    let targetCurrency = currency
    switch (currency.toLowerCase()) {
      case 'btc (multisig)':
      case 'btc (sms-protected)':
      case 'btc (pin-protected)':
        targetCurrency = 'btc'
        break
    }

    const isToken = helpers.ethToken.isEthToken({ name: currency })

    history.push(
      localisedUrl(
        locale,
        (isToken ? '/token' : '') + `/${targetCurrency}/${address}`
      )
    )
  }

  hideCurrency = () => {
    const {
      itemData: { currency, address, balance },
    //@ts-ignore
    } = this.props

    if (balance > 0) {
      actions.modals.open(constants.modals.AlertModal, {
        message: (
          <FormattedMessage
            id="WalletRow_Action_HideNonZero_Message"
            defaultMessage="У этого кошелка положительный баланс. Его скрыть нельзя."
          />
        ),
      })
    } else {
      //@ts-ignore
      actions.core.markCoinAsHidden(`${currency}:${address}`)
      actions.notifications.show(constants.notifications.Message, {
        message: (
          <FormattedMessage
            id="WalletRow_Action_Hidden"
            defaultMessage="Кошелек скрыт"
          />
        ),
      })
    }
  }

  copy = () => {
    const {
      itemData: { address, fullName },
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.WalletAddressModal, {
      address,
      fullName,
    })
  }

  copyPrivateKey = () => {
    const {
      itemData: { address, privateKey, fullName },
      ethDataHelper,
    //@ts-ignore
    } = this.props

    actions.modals.open(constants.modals.PrivateKeysModal, {
      key: address === ethDataHelper.address ? ethDataHelper.privateKey : privateKey,
      fullName,
    })
  }



  getCustomRate = (cur) => {
    //@ts-ignore
    const wTokens = window.widgetERC20Tokens

    const dataobj = wTokens && Object.keys(wTokens).find(el => el === cur.toLowerCase())
    return dataobj ? (wTokens[dataobj] || { customEcxchangeRate: null }).customEcxchangeRate : null
  }

  handleShowMnemonic = () => {
    //@ts-ignore
    actions.modals.open(constants.modals.SaveMnemonicModal)
  }

  render() {
    const {
      isBalanceFetching,
      // @ToDo Remove this
      // tradeAllowed,
      isBalanceEmpty,
    } = this.state

    const {
      itemData,
      intl: { locale },
      intl,
      activeFiat,
      isDark,
      multisigStatus,
    } = this.props

    const {
      currency,
      balance,
      isBalanceFetched,
      fullName,
      title,
      unconfirmedBalance,
      balanceError,
    } = itemData

    let currencyView = currency

    let nodeDownErrorShow = true
    let currencyFiatBalance = 0

    const isWidgetBuild = config && config.isWidget

    if (itemData.infoAboutCurrency && itemData.infoAboutCurrency.price_fiat) {
      currencyFiatBalance = new BigNumber(balance).multipliedBy(itemData.infoAboutCurrency.price_fiat).dp(2, BigNumber.ROUND_FLOOR).toNumber()
    }

    let hasHowToWithdraw = false
    if (
      config &&
      config.erc20 &&
      //@ts-ignore
      config.erc20[this.props.currency.currency.toLowerCase()] &&
      //@ts-ignore
      config.erc20[this.props.currency.currency.toLowerCase()].howToWithdraw
    )
      hasHowToWithdraw = true

    const isSafari = 'safari' in window

    const mnemonic = localStorage.getItem(constants.privateKeyNames.twentywords)
    const mnemonicSaved = (mnemonic === `-`)

    let dropDownMenuItems = [
      {
        id: 1001,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_Deposit"
            defaultMessage="Deposit"
          />
        ),
        action: this.handleReceive,
        disabled: false,
      },
      ...(hasHowToWithdraw
        ? [
          {
            id: 10021,
            title: (
              <FormattedMessage
                id="WalletRow_Menu_HowToWithdraw"
                defaultMessage="How to withdraw"
              />
            ),
            action: this.handleHowToWithdraw,
          },
        ]
        : []),
      {
        id: 1002,
        title: (
          <FormattedMessage id="WalletRow_Menu_Send" defaultMessage="Send" />
        ),
        action: this.handleWithdraw,
        disabled: isBalanceEmpty,
      },
      !config.opts.exchangeDisabled && {
        id: 1004,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_Exchange"
            defaultMessage="Exchange"
          />
        ),
        action: this.goToExchange,
        disabled: false,
      },
      {
        id: 1003,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_History"
            defaultMessage="History"
          />
        ),
        action: this.goToCurrencyHistory,
        disabled: !mnemonicSaved,
      },
      !isSafari && {
        id: 1012,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_Сopy"
            defaultMessage="Copy address"
          />
        ),
        action: this.copy,
        disabled: !mnemonicSaved,
      },
      !config.opts.hideShowPrivateKey && {
        id: 1012,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_Сopy_PrivateKey"
            defaultMessage="Copy Private Key"
          />
        ),
        action: this.copyPrivateKey,
        disabled: false,
      },
      {
        id: 1011,
        title: (
          <FormattedMessage id="WalletRow_Menu_Hide" defaultMessage="Hide" />
        ),
        action: this.hideCurrency,
        disabled: false,
      },
    ].filter((el) => el)


    if (currencyView == 'BTC (Multisig)') currencyView = 'BTC'
    if (currencyView == 'BTC (SMS-Protected)') currencyView = 'BTC'
    if (currencyView == 'BTC (PIN-Protected)') currencyView = 'BTC'



    if (
      ['BTC', 'ETH'].includes(currencyView) &&
      !isWidgetBuild &&
      config.opts.invoiceEnabled
    ) {
      dropDownMenuItems.push({
        id: 1004,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_Invoice"
            defaultMessage="Выставить счет"
          />
        ),
        action: this.handleCreateInvoice,
        //@ts-ignore
        disable: false,
      })
      dropDownMenuItems.push({
        id: 1005,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_InvoiceLink"
            defaultMessage="Получить ссылку для выставления счета"
          />
        ),
        action: this.handleCreateInvoiceLink,
        //@ts-ignore
        disable: false,
      })
    }

    //@ts-ignore
    if (this.props.itemData.isMetamask
      //@ts-ignore
      && !this.props.itemData.isConnected
    ) {
      dropDownMenuItems = [{
        id: 1,
        title: (
          <FormattedMessage
            id="WalletRow_MetamaskConnect"
            defaultMessage="Подключить"
          />
        ),
        action: this.handleConnectMetamask,
        //@ts-ignore
        disable: false,
      }]
    }
    //@ts-ignore
    if (this.props.itemData.isMetamask
      //@ts-ignore
      && this.props.itemData.isConnected
    ) {
      dropDownMenuItems = [
        {
          id: 1123,
          title: (
            <FormattedMessage
              id="WalletRow_MetamaskDisconnect"
              defaultMessage="Отключить кошелек"
            />
          ),
          action: this.handleDisconnectWallet,
          //@ts-ignore
          disable: false
        },
        ...dropDownMenuItems
      ]
    }

    let showBalance = true
    let statusInfo = false


    if (
      //@ts-ignore
      this.props.itemData.isPinProtected &&
      //@ts-ignore
      !this.props.itemData.isRegistered
    ) {
      //@ts-ignore
      statusInfo = 'Not activated'
      showBalance = false
      nodeDownErrorShow = false
      dropDownMenuItems = [
        {
          id: 1,
          title: (
            <FormattedMessage
              id="WalletRow_Menu_ActivatePinProtected"
              defaultMessage="Activate"
            />
          ),
          action: this.handleActivatePinProtected,
          disabled: false,
        },
        {
          id: 1011,
          title: (
            <FormattedMessage id="WalletRow_Menu_Hide" defaultMessage="Hide" />
          ),
          action: this.hideCurrency,
          disabled: false,
        },
      ]
    }

    const msConfirmCount = (
      itemData.isUserProtected
      && multisigStatus
      && multisigStatus[itemData.address]
      && multisigStatus[itemData.address].count
    ) ? multisigStatus[itemData.address].count : false

    if (
      //@ts-ignore
      this.props.itemData.isSmsProtected &&
      //@ts-ignore
      !this.props.itemData.isRegistered
    ) {
      //@ts-ignore
      statusInfo = 'Not activated'
      showBalance = false
      nodeDownErrorShow = false
      dropDownMenuItems = [
        {
          id: 1,
          title: (
            <FormattedMessage
              id="WalletRow_Menu_ActivateSMSProtected"
              defaultMessage="Activate"
            />
          ),
          action: this.handleActivateProtected,
          disabled: false,
        },
        {
          id: 1011,
          title: (
            <FormattedMessage id="WalletRow_Menu_Hide" defaultMessage="Hide" />
          ),
          action: this.hideCurrency,
          disabled: false,
        },
      ]
    }
    //@ts-ignore
    if (this.props.itemData.isUserProtected) {
      //@ts-ignore
      if (!this.props.itemData.active) {
        //@ts-ignore
        statusInfo = 'Not joined'
        showBalance = false
        nodeDownErrorShow = false
        dropDownMenuItems = []
      } else {
        dropDownMenuItems.push({
          id: 1105,
          title: (
            <FormattedMessage
              id="WalletRow_Menu_BTCMS_SwitchMenu"
              defaultMessage="Switch wallet"
            />
          ),
          action: this.handleSwitchMultisign,
          disabled: false,
        })
      }
      dropDownMenuItems.push({
        id: 3,
        title: (
          <FormattedMessage
            id="WalletRow_Menu_BTCMS_GenerateJoinLink"
            defaultMessage="Generate join link"
          />
        ),
        action: this.handleGenerateMultisignLink,
        disabled: false,
      })
      //@ts-ignore
      if (!this.props.itemData.active) {
        dropDownMenuItems.push({
          id: 1011,
          title: (
            <FormattedMessage id="WalletRow_Menu_Hide" defaultMessage="Hide" />
          ),
          action: this.hideCurrency,
          disabled: false,
        })
      }
    }

    const metamaskIsOk = this.props.itemData.isMetamask && this.props.itemData.isConnected
    const addressIsOk = !metamaskIsOk && mnemonicSaved

    return (
      <tr>
        <td styleName={`assetsTableRow ${isDark ? 'dark' : ''}`}>
          <div styleName="assetsTableCurrency">
            {/* Currency icon */}
            {/*
            //@ts-ignore */}
            <Coin className={styles.assetsTableIcon} name={currency} />
            <div styleName="assetsTableInfo">
              <div styleName="nameRow">
                <a /* Redirect to history if connect wallet */
                  onClick={ addressIsOk || metamaskIsOk ? this.goToCurrencyHistory : () => null }
                  styleName={`${
                    addressIsOk && isMobile
                      ? 'linkToHistory mobile'
                      : addressIsOk || metamaskIsOk
                        ? 'linkToHistory desktop'
                        : ''
                  }`}
                  title={`Online ${fullName} wallet`}
                >
                  {fullName}
                </a>
              </div>
              {title ? <strong>{title}</strong> : ''}
            </div>
            {balanceError && nodeDownErrorShow ? (
              <div className={styles.errorMessage}>
                <FormattedMessage
                  id="RowWallet276"
                  defaultMessage=" node is down (You can not perform transactions). "
                />
                <a href="https://wiki.swaponline.io/faq/bitcoin-node-is-down-you-cannot-make-transactions/">
                  <FormattedMessage
                    id="RowWallet282"
                    defaultMessage="No connection..."
                  />
                </a>
              </div>
            ) : (
                ''
              )}
            <span styleName="assetsTableCurrencyWrapper">
              {showBalance && (
                <Fragment>
                  {!isBalanceFetched || isBalanceFetching ? (
                    //@ts-ignore
                    this.props.itemData.isUserProtected &&
                      //@ts-ignore
                      !this.props.itemData.active ? (
                        <span>
                          <FormattedMessage
                            id="walletMultisignNotJoined"
                            defaultMessage="Not joined"
                          />
                        </span>
                      ) : (
                        <div styleName="loader">
                          {!(balanceError && nodeDownErrorShow) && <InlineLoader />}
                        </div>
                      )
                  ) : (
                      <div
                        styleName="no-select-inline"
                        onClick={this.handleReloadBalance}
                      >
                        <i className="fas fa-sync-alt" styleName="icon" />
                        <span>
                          {balanceError
                            ? '?'
                            : new BigNumber(balance)
                              .dp(5, BigNumber.ROUND_FLOOR)
                              .toString()}{' '}
                        </span>
                        <span styleName="assetsTableCurrencyBalance">
                          {currencyView}
                        </span>
                        {unconfirmedBalance !== 0 && (
                          <Fragment>
                            <br />
                            <span
                              styleName="unconfirmedBalance"
                              title={intl.formatMessage(
                                langLabels.unconfirmedBalance
                              )}
                            >
                              {unconfirmedBalance > 0 && <>{'+'}</>}
                              {unconfirmedBalance}{' '}
                            </span>
                          </Fragment>
                        )}
                      </div>
                    )}
                </Fragment>
              )}
            </span>

            <Fragment>
              {statusInfo ?
                <p styleName="statusStyle">{statusInfo}</p>
                :
                //@ts-ignore
                !mnemonicSaved && !this.props.itemData.isMetamask ?
                  <p styleName="showAddressStyle" onClick={this.handleShowMnemonic}>
                    <FormattedMessage
                      id="WalletRow_ShowAddress"
                      defaultMessage="Show address"
                    />
                  </p>
                  :
                  //@ts-ignore
                  this.props.itemData.isMetamask && ! this.props.itemData.isConnected ?
                    <p styleName="addressStyle">
                      <FormattedMessage
                        id="WalletRow_MetamaskNotConnected"
                        defaultMessage="Not connected"
                      />
                    </p>
                    : // Address shows 
                    <div styleName="addressStyle">
                      {/*
                      //@ts-ignore */}
                      <Copy text={itemData.address}>
                        {
                          isMobile ?
                          <PartOfAddress {...itemData} style={{
                            position: 'relative',
                            bottom: '13px',
                          }} />
                          :
                          <p>{itemData.address}</p>
                        }
                      </Copy>
                    </div>
              }
            </Fragment>

            {(currencyFiatBalance && showBalance && !balanceError) || msConfirmCount ? (
              <div styleName="assetsTableValue">
                {msConfirmCount && !isMobile && (
                  <p styleName="txWaitConfirm" onClick={this.goToCurrencyHistory}>
                    {intl.formatMessage(
                      langLabels.msConfirmCount,
                      {
                        count: msConfirmCount,
                      }
                    )}
                  </p>
                )}  
                {currencyFiatBalance && showBalance && !balanceError && (
                  <>
                    <p>{currencyFiatBalance}</p>
                    <strong>{activeFiat}</strong>
                  </>
                )}
              </div>
            ) : (
                ''
              )}
          </div>

          <div onClick={this.handleOpenDropdown} styleName="assetsTableDots">
            {/*
            //@ts-ignore */}
            <DropdownMenu
              size="regular"
              classNames="walletControls"
              items={dropDownMenuItems}
            />
          </div>
        </td>
      </tr>
    )
  }
}
