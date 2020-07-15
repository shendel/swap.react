import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import cssModules from 'react-css-modules'
import { connect } from 'redaction'
import { constants } from 'helpers'
import { getActivatedCurrencies } from 'helpers/user'
import config from 'app-config'
import actions from 'redux/actions'
import { FormattedMessage, injectIntl } from 'react-intl'
import { isMobile } from 'react-device-detect'

import cx from 'classnames'

import Button from 'components/controls/Button/Button'
import Tabs from 'components/Tabs/Tabs'
import FAQ from 'components/FAQ/FAQ'
import { ModalConductorProvider } from 'components/modal'

import styles from './styles.scss'


const isWidgetBuild = config && config.isWidget
const isDark = localStorage.getItem(constants.localStorage.isDark)

const NewDesignLayout = (props) => {
  const {
    hiddenCoinsList,
    activeFiat,
    children,
    page,
    activeView,
    history,
    location,
    handleNavItemClick,
  } = props

  const balanceRef = React.useRef(null) // Create a ref object

  const isSweepReady = localStorage.getItem(
    constants.localStorage.isSweepReady
  )
  const isBtcSweeped = actions.btc.isSweeped()
  const isEthSweeped = actions.eth.isSweeped()

  let showSweepBanner = !isSweepReady

  if (isBtcSweeped || isEthSweeped) showSweepBanner = false

  const mnemonic = localStorage.getItem(constants.privateKeyNames.twentywords)

  const [commonState, setCommonState] = useState({
    activePage: page,
    btcBalance: 0,
    activeCurrency: activeFiat.toLowerCase(),
    walletTitle: 'Wallet',
    editTitle: false,
    enabledCurrencies: getActivatedCurrencies(),
    showSweepBanner,
    isMnemonicSaved: mnemonic === `-`,
  })

  const {
    enabledCurrencies,
    infoAboutCurrency
  } = commonState


  return (
    <article className="data-tut-start-widget-tour">
      {window.CUSTOM_LOGO && (
        <img className="cutomLogo" src={window.CUSTOM_LOGO} alt="logo" />
      )}
      <section
        styleName={`wallet ${window.CUSTOM_LOGO ? 'hasCusomLogo' : ''} ${isDark ? 'dark' : ''}`}
      >
        <Tabs onClick={handleNavItemClick} activeView={activeView} />
        <div
          className="data-tut-store"
          styleName="walletContent"
          ref={balanceRef}
        >
          <div styleName="walletBalance">

            {props.BalanceForm}

            <div
              className={cx({
                [styles.desktopEnabledViewForFaq]: true,
                [styles.faqWrapper]: true,
              })}
            >
              <FAQ />
            </div>
          </div>
          <div
            styleName={cx({
              'yourAssetsWrapper': activeView === 0,
              'activity': activeView === 1 || activeView === 2,
              'active': true,
            })}

          >
            {/* Sweep Banner */}
            {showSweepBanner && (
              <p styleName="sweepInfo">
                <Button blue onClick={this.handleMakeSweep}>
                  <FormattedMessage
                    id="SweepBannerButton"
                    defaultMessage="Done"
                  />
                </Button>
                <FormattedMessage
                  id="SweepBannerDescription"
                  defaultMessage={`Пожалуйста, переместите все средства на кошельки помеченные "new" 
                      (USDT и остальные токены переведите на Ethereum (new) адрес). 
                      Затем нажмите кнопку "DONE". Старые адреса будут скрыты.`}
                />
              </p>
            )}
            {/* (End) Sweep Banner */}
            <ModalConductorProvider>
              {children}
            </ModalConductorProvider>
          </div>
          <div
            className={cx({
              [styles.mobileEnabledViewForFaq]: true,
              [styles.faqWrapper]: true,
            })}
          >
            <FAQ />
          </div>
        </div>
      </section>
    </article>
  )
}

export default connect(
  ({
    core: { hiddenCoinsList },
    user,
    user: {
      activeFiat,
      ethData,
      btcData,
      btcMultisigSMSData,
      btcMultisigUserData,
      btcMultisigUserDataList,
      tokensData,
      isFetching,
      isBalanceFetching,
    },
    currencies: { items: currencies },
    createWallet: { currencies: assets },
    modals,
    ui: { dashboardModalsAllowed },
  }) => {
    let widgetMultiTokens = []
    if (
      window.widgetERC20Tokens &&
      Object.keys(window.widgetERC20Tokens).length
    ) {
      Object.keys(window.widgetERC20Tokens).forEach((key) => {
        widgetMultiTokens.push(key.toUpperCase())
      })
    }
    const tokens =
      config && config.isWidget
        ? window.widgetERC20Tokens &&
          Object.keys(window.widgetERC20Tokens).length
          ? widgetMultiTokens
          : [config.erc20token.toUpperCase()]
        : Object.keys(tokensData).map((k) => tokensData[k].currency)

    const tokensItems = Object.keys(tokensData).map((k) => tokensData[k])

    const allData = [
      btcData,
      btcMultisigSMSData,
      btcMultisigUserData,
      ethData,
      ...Object.keys(tokensData).map((k) => tokensData[k]),
    ].map(({ account, keyPair, ...data }) => ({
      ...data,
    }))

    const items = (config && config.isWidget
      ? [btcData, ethData]
      : [btcData, btcMultisigSMSData, btcMultisigUserData, ethData]
    ).map((data) => data.currency)

    return {
      tokens,
      items,
      allData,
      tokensItems,
      currencies,
      assets,
      isFetching,
      isBalanceFetching,
      hiddenCoinsList,
      userEthAddress: ethData.address,
      user,
      activeFiat,
      tokensData: {
        ethData,
        btcData,
        btcMultisigSMSData,
        btcMultisigUserData,
        btcMultisigUserDataList,
      },
      dashboardView: dashboardModalsAllowed,
      modals,
    }
  }
)(
  injectIntl(
    withRouter(cssModules(NewDesignLayout, styles, { allowMultiple: true }))
  )
)
