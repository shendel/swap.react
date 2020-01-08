/* eslint-disable max-len */
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withRouter } from 'react-router-dom'
import { isMobile } from 'react-device-detect'
import { connect } from 'redaction'

import links from 'helpers/links'
import actions from 'redux/actions'
import { constants, firebase } from 'helpers'
import config from 'app-config'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'

import CSSModules from 'react-css-modules'
import styles from './Header.scss'

import Nav from './Nav/Nav'
import User from './User/User'
import SignUpButton from './User/SignUpButton/SignUpButton'
import NavMobile from './NavMobile/NavMobile'

import LogoTooltip from 'components/Logo/LogoTooltip'
import WidthContainer from 'components/layout/WidthContainer/WidthContainer'
import TourPartial from './TourPartial/TourPartial'
import WalletTour from './WalletTour/WalletTour'

import Logo from 'components/Logo/Logo'
import Loader from 'components/loaders/Loader/Loader'
import { relocalisedUrl } from 'helpers/locale'
import { localisedUrl, unlocalisedUrl } from '../../helpers/locale'
import UserTooltip from 'components/Header/User/UserTooltip/UserTooltip'
import { messages, getMenuItems, getMenuItemsMobile } from "./config"

let lastScrollTop = 0

@injectIntl
@withRouter
@connect({
  feeds: 'feeds.items',
  peer: 'ipfs.peer',
  isSigned: 'signUp.isSigned',
  isInputActive: 'inputActive.isInputActive',
  reputation: 'ipfs.reputation',
})
@CSSModules(styles, { allowMultiple: true })
export default class Header extends Component {

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  static getDerivedStateFromProps({ history: { location: { pathname } } }) {
    if (pathname === '/ru' || pathname === '/' || pathname === links.wallet) {
      return { path: true }
    }
    return { path: false }
  }

  constructor(props) {
    super(props)

    const { location: { pathname }, intl } = props
    const { exchange, home, wallet, history: historyLink } = links
    const { products, invest, history } = messages
    const { lastCheckBalance, wasCautionPassed, isWalletCreate } = constants.localStorage

    if (localStorage.getItem(lastCheckBalance) || localStorage.getItem(wasCautionPassed)) {
      localStorage.setItem(isWalletCreate, true)
    }

    const dinamicPath = pathname.includes(exchange) ? `${unlocalisedUrl(intl.locale, pathname)}` : `${home}`
    const lsWalletCreated = localStorage.getItem(isWalletCreate)
    const isWalletPage = pathname === wallet || pathname === `/ru${wallet}`

    this.state = {
      isPartialTourOpen: false,
      path: false,
      isTourOpen: false,
      isShowingMore: false,
      sticky: false,
      isWallet: false,
      menuItemsFill: [
        {
          title: intl.formatMessage(products),
          link: 'openMySesamPlease',
          exact: true,
          haveSubmenu: true,
          icon: 'products',
          currentPageFlag: true,
        },
        {
          title: intl.formatMessage(invest),
          link: 'exchange/btc-to-usdt',
          icon: 'invest',
          haveSubmenu: false,
        },
        {
          title: intl.formatMessage(history),
          link: historyLink,
          icon: 'history',
          haveSubmenu: false,
        },
      ],
      menuItems: getMenuItems(props, lsWalletCreated, dinamicPath),
      menuItemsMobile: getMenuItemsMobile(props, lsWalletCreated, dinamicPath),
      createdWalletLoader: isWalletPage && !lsWalletCreated,
    }
    this.lastScrollTop = 0
  }

  componentDidMount() {
    this.handlerAsync()
  }

  handlerAsync = async () => {
    const { history } = this.props

    await this.tapCreateWalletButton()

    this.startTourAndSignInModal()

    history.listen(async (location) => {
      await this.tapCreateWalletButton({ location })

      this.startTourAndSignInModal({ location })
    })
  }

  tapCreateWalletButton = (customProps) => new Promise((resolve) => {
    const finishProps = { ...this.props, ...customProps }

    const { location, intl } = finishProps
    const { pathname } = location
    const { wallet, home } = links

    let isWalletCreate = localStorage.getItem(constants.localStorage.isWalletCreate)

    const isWalletPage = pathname === wallet
      || pathname === `/ru${wallet}`

    if (isWalletPage && !isWalletCreate) {
      isWalletCreate = true

      this.setState(() => ({
        menuItems: getMenuItems(this.props, isWalletCreate),
        menuItemsMobile: getMenuItemsMobile(this.props, isWalletCreate),
        createdWalletLoader: true,
      }), () => {
        setTimeout(() => {
          this.setState(() => ({
            createdWalletLoader: false,
          }))
          resolve()
        }, 4000)
      })
    } else {
      resolve()
    }
  })

  startTourAndSignInModal = (customProps) => {
    const finishProps = { ...this.props, ...customProps }
    const { wasOnExchange, wasOnWallet, isWalletCreate } = constants.localStorage
    const { location: { hash, pathname } } = finishProps
    const { wallet, exchange } = links
    const isGuestLink = !(!hash || hash.slice(1) !== 'guest')

    if (isGuestLink) {
      localStorage.setItem(wasOnWallet, true)
      localStorage.setItem(wasOnExchange, true)
      return
    }

    this.setState(() => ({
      menuItems: getMenuItems(this.props, true),
      menuItemsMobile: getMenuItemsMobile(this.props, true),
    }))

    const path = pathname.toLowerCase()
    const isWalletPage = path.includes(wallet) || path === `/` || path === '/ru'
    const isPartialPage = path.includes(exchange) || path === `/ru${exchange}`

    const didOpenWalletCreate = localStorage.getItem(isWalletCreate)

    const wasOnWalletLs = localStorage.getItem(wasOnWallet)
    const wasOnExchangeLs = localStorage.getItem(wasOnExchange)

    let tourEvent = () => { }

    switch (true) {
      case isWalletPage && !wasOnWalletLs:
        console.log("doooone")
        tourEvent = this.openWalletTour
        break
      case isPartialPage && !wasOnExchangeLs:
        tourEvent = this.openExchangeTour
        break
      default: return
    }

    if (!didOpenWalletCreate && isWalletPage) {
      this.openCreateWallet({ onClose: tourEvent })
      return
    }

    tourEvent()
  }

  declineRequest = (orderId, participantPeer) => {
    actions.core.declineRequest(orderId, participantPeer)
    actions.core.updateCore()
  }

  acceptRequest = async (orderId, participantPeer, link) => {
    const { toggle, history, intl: { locale } } = this.props

    actions.core.acceptRequest(orderId, participantPeer)
    actions.core.updateCore()

    if (typeof toggle === 'function') {
      toggle()
    }

    await history.replace(localisedUrl(locale, link))
    await history.push(localisedUrl(locale, link))
  }

  handleScroll = () => {
    if (this.props.history.location.pathname === '/') {
      this.setState(() => ({
        sticky: false,
      }))
      return
    }
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop
    if (scrollTop > this.lastScrollTop) {
      this.setState(() => ({ sticky: false }))
    }
    else {
      this.setState(() => ({ sticky: true }))
    }
    this.lastScrollTop = scrollTop
  }

  toggleShowMore = () => {
    this.setState(prevState => ({
      isShowingMore: !prevState.isShowingMore,
    }))
  }

  closeTour = () => {
    this.setState(() => ({ isTourOpen: false }))
  }

  closePartialTour = () => {
    this.setState(() => ({ isPartialTourOpen: false }))
  }

  openCreateWallet = (options) => {
    const { history, intl: { locale } } = this.props
    history.push(localisedUrl(locale, `createWallet`))
  }

  openWalletTour = () => {
    const { wasOnWallet } = constants.localStorage

    setTimeout(() => { this.setState(() => ({ isTourOpen: true })) }, 1000)
    localStorage.setItem(wasOnWallet, true)
  }

  openExchangeTour = () => {
    const { wasOnExchange } = constants.localStorage
    setTimeout(() => { this.setState(() => ({ isPartialTourOpen: true })) }, 1000)

    localStorage.setItem(wasOnExchange, true)

  }

  render() {
    const { sticky, isTourOpen, path, isPartialTourOpen, menuItems, menuItemsMobile, createdWalletLoader } = this.state
    const { intl: { formatMessage }, history: { location: { pathname } }, feeds, peer, isSigned, isInputActive } = this.props
    const { exchange, wallet } = links

    const accentColor = '#510ed8'

    const isWalletPage = pathname.includes(wallet)
      || pathname === `/ru${wallet}`
      || pathname === `/`

    const isExchange = pathname.includes(exchange);

    if (config && config.isWidget) {
      return (
        <User
          acceptRequest={this.acceptRequest}
          declineRequest={this.declineRequest}
        />
      )
    }
    if (pathname.includes('/createWallet') && isMobile) {
      return <span />
    }
    if (isMobile) {
      return (
        <div styleName={isInputActive ? 'header-mobile header-mobile__hidden' : 'header-mobile'}>
          {
            createdWalletLoader && (
              <div styleName="loaderCreateWallet">
                <Loader showMyOwnTip={formatMessage({ id: 'createWalletLoaderTip', defaultMessage: 'Creating wallet... Please wait.' })} />
              </div>
            )
          }
          <UserTooltip
            feeds={feeds}
            peer={peer}
            acceptRequest={this.acceptRequest}
            declineRequest={this.declineRequest}
          />
          <NavMobile menu={menuItemsMobile} />
          {!isSigned && (<SignUpButton mobile />)}
        </div>
      )
    }

    return (
      <div styleName={sticky ? 'header header-fixed' : isWalletPage ? 'header header-promo' : 'header'}>
        {
          createdWalletLoader && (
            <div styleName="loaderCreateWallet">
              <Loader showMyOwnTip={formatMessage({ id: 'createWalletLoaderTip', defaultMessage: 'Creating wallet... Please wait.' })} />
            </div>
          )
        }
        <WidthContainer styleName="container" className="data-tut-preview">
          <LogoTooltip withLink isColored isExchange={isWalletPage} />
          <Nav menu={menuItems} />
          <Logo withLink mobile />
          {isPartialTourOpen && isExchange && <TourPartial isTourOpen={isPartialTourOpen} closeTour={this.closePartialTour} />}
          <User
            openTour={isWalletPage ? this.openExchangeTour : this.openWalletTour}
            path={path}
            acceptRequest={this.acceptRequest}
            declineRequest={this.declineRequest}
          />
          {isTourOpen && isWalletPage && <WalletTour isTourOpen={isTourOpen} closeTour={this.closeTour} />}
        </WidthContainer>
      </div>
    )
  }
}
