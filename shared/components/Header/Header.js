/* eslint-disable max-len */
import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { withRouter, Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { connect } from "redaction";

import links from "helpers/links";
import actions from "redux/actions";
import { constants } from "helpers";
import config from 'helpers/externalConfig'
import { injectIntl } from "react-intl";

import CSSModules from "react-css-modules";
import styles from "./Header.scss";

import Nav from "./Nav/Nav";
import User from "./User/User";
import SignUpButton from "./User/SignUpButton/SignUpButton";
import NavMobile from "./NavMobile/NavMobile";

import LogoTooltip from "components/Logo/LogoTooltip";
import WidthContainer from "components/layout/WidthContainer/WidthContainer";
import TourPartial from "./TourPartial/TourPartial";
import WalletTour from "./WalletTour/WalletTour";
import { WidgetWalletTour } from "./WidgetTours";

import Loader from "components/loaders/Loader/Loader";
import { localisedUrl, unlocalisedUrl } from "../../helpers/locale";
import UserTooltip from "components/Header/User/UserTooltip/UserTooltip";
import { messages, getMenuItems, getMenuItemsMobile } from "./config";
import { getActivatedCurrencies } from "helpers/user";
import { WidgetHeader } from "./WidgetHeader";
import { Switcher } from "./Switcher"


const isWidgetBuild = config && config.isWidget
const isDark = localStorage.getItem(constants.localStorage.isDark)

@injectIntl
@withRouter
@connect({
  feeds: "feeds.items",
  peer: "ipfs.peer",
  isSigned: "signUp.isSigned",
  isInputActive: "inputActive.isInputActive",
  reputation: "ipfs.reputation",
  dashboardView: "ui.dashboardModalsAllowed",
  modals: "modals",
  hiddenCoinsList: "core.hiddenCoinsList",
})
@CSSModules(styles, { allowMultiple: true })
export default class Header extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  static getDerivedStateFromProps({
    history: {
      location: { pathname },
    },
  }) {
    if (pathname === "/ru" || pathname === "/" || pathname === links.wallet) {
      return { path: true };
    }
    return { path: false };
  }

  constructor(props) {
    super(props);

    const {
      location: { pathname },
      intl,
    } = props;
    const { exchange, home, wallet, history: historyLink } = links;
    const { products, invest, history } = messages;
    const { isWalletCreate } = constants.localStorage;

    const dinamicPath = pathname.includes(exchange)
      ? `${unlocalisedUrl(intl.locale, pathname)}`
      : `${home}`;
    let lsWalletCreated = localStorage.getItem(isWalletCreate);
    if (config && config.isWidget) lsWalletCreated = true;
    const isWalletPage = pathname === wallet || pathname === `/ru${wallet}`;

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
          link: "openMySesamPlease",
          exact: true,
          haveSubmenu: true,
          icon: "products",
          currentPageFlag: true,
        },
        !config.opts.exchangeDisabled && {
          title: intl.formatMessage(invest),
          link: "exchange/btc-to-usdt",
          icon: "invest",
          haveSubmenu: false,
        },
        {
          title: intl.formatMessage(history),
          link: historyLink,
          icon: "history",
          haveSubmenu: false,
        },
      ],
      menuItems: getMenuItems(props, lsWalletCreated, dinamicPath),
      menuItemsMobile: getMenuItemsMobile(props, lsWalletCreated, dinamicPath),
      createdWalletLoader: isWalletPage && !lsWalletCreated,
    };
    this.lastScrollTop = 0;
  }

  componentDidMount() {
    this.handlerAsync();
  }

  handlerAsync = async () => {
    const { history } = this.props;

    await this.tapCreateWalletButton();

    this.startTourAndSignInModal();

    history.listen(async (location) => {
      await this.tapCreateWalletButton({ location });

      this.startTourAndSignInModal({ location });
    });
  };

  tapCreateWalletButton = (customProps) =>
    new Promise((resolve) => {
      const finishProps = { ...this.props, ...customProps };

      const { location, intl } = finishProps;
      const { pathname } = location;
      const { wallet, home } = links;

      let isWalletCreate = localStorage.getItem(
        constants.localStorage.isWalletCreate
      );

      if (config && config.isWidget) isWalletCreate = true;

      const isWalletPage = pathname === wallet || pathname === `/ru${wallet}`;

      if (isWalletPage && !isWalletCreate) {
        isWalletCreate = true;

        this.setState(
          () => ({
            menuItems: getMenuItems(this.props, isWalletCreate),
            menuItemsMobile: getMenuItemsMobile(this.props, isWalletCreate),
            createdWalletLoader: true,
          }),
          () => {
            setTimeout(() => {
              this.setState(() => ({
                createdWalletLoader: false,
              }));
              resolve();
            }, 4000);
          }
        );
      } else {
        resolve();
      }
    });

  startTourAndSignInModal = (customProps) => {
    const finishProps = { ...this.props, ...customProps };
    const {
      wasOnExchange,
      wasOnWallet,
      isWalletCreate,
      wasOnWidgetWallet,
    } = constants.localStorage;
    const {
      hiddenCoinsList,
      location: { hash, pathname },
    } = finishProps;
    const { wallet, exchange } = links;
    const isGuestLink = !(!hash || hash.slice(1) !== "guest");

    if (isGuestLink) {
      localStorage.setItem(wasOnWallet, true);
      localStorage.setItem(wasOnExchange, true);
      localStorage.setItem(wasOnWidgetWallet, true);
      return;
    }

    this.setState(() => ({
      menuItems: getMenuItems(this.props, true),
      menuItemsMobile: getMenuItemsMobile(this.props, true),
    }));

    const path = pathname.toLowerCase();
    const isWalletPage =
      path.includes(wallet) || path === `/` || path === "/ru";
    const isPartialPage = path.includes(exchange) || path === `/ru${exchange}`;

    const didOpenWalletCreate = localStorage.getItem(isWalletCreate);

    const wasOnWalletLs = localStorage.getItem(wasOnWallet);
    const wasOnExchangeLs = localStorage.getItem(wasOnExchange);
    const wasOnWidgetWalletLs = localStorage.getItem(wasOnWidgetWallet);

    let tourEvent = () => { };

    const allData = actions.core.getWallets();

    const widgetCurrencies = ["BTC", "ETH"];
    const optionsalCur = [
      "BTC (SMS-Protected)",
      "BTC (Multisig)",
      "BTC (PIN-Protected)",
    ];

    optionsalCur.forEach((el) => {
      if (!hiddenCoinsList.includes(el)) {
        widgetCurrencies.push(el);
      }
    });

    if (isWidgetBuild) {
      if (
        window.widgetERC20Tokens &&
        Object.keys(window.widgetERC20Tokens).length
      ) {
        // Multi token widget build
        Object.keys(window.widgetERC20Tokens).forEach((key) => {
          widgetCurrencies.push(key.toUpperCase());
        });
      } else {
        widgetCurrencies.push(config.erc20token.toUpperCase());
      }
    }

    let userCurrencies = allData.filter(({ currency, address, balance }) => {
      return (
        (!hiddenCoinsList.includes(currency) &&
          !hiddenCoinsList.includes(`${currency}:${address}`)) ||
        balance > 0
      );
    });

    if (isWidgetBuild) {
      userCurrencies = allData.filter(
        ({ currency, address }) =>
          !hiddenCoinsList.includes(currency) &&
          !hiddenCoinsList.includes(`${currency}:${address}`)
      );
      userCurrencies = userCurrencies.filter(({ currency }) =>
        widgetCurrencies.includes(currency)
      );
    }

    userCurrencies = userCurrencies.filter(({ currency }) =>
      getActivatedCurrencies().includes(currency)
    );

    switch (true) {
      case isWalletPage && !wasOnWalletLs:
        tourEvent = this.openWalletTour;
        break;
      case isPartialPage && !wasOnExchangeLs:
        tourEvent = this.openExchangeTour;
        break;
      case isWidgetBuild && !wasOnWidgetWalletLs:
        tourEvent = this.openWidgetWalletTour;
        break;
      case !userCurrencies.length && isWalletPage:
        this.openCreateWallet({ onClose: tourEvent });
        break;
      default:
        return;
    }

    if (!didOpenWalletCreate && isWalletPage) {
      this.openCreateWallet({ onClose: tourEvent });
      return;
    }

    tourEvent();
  };

  declineRequest = (orderId, participantPeer) => {
    actions.core.declineRequest(orderId, participantPeer);
    actions.core.updateCore();
  };

  acceptRequest = async (orderId, participantPeer, link) => {
    const {
      toggle,
      history,
      intl: { locale },
    } = this.props;

    actions.core.acceptRequest(orderId, participantPeer);
    actions.core.updateCore();

    if (typeof toggle === "function") {
      toggle();
    }

    console.log("-Accepting request", link);
    await history.replace(localisedUrl(locale, link));
    await history.push(localisedUrl(locale, link));
  };

  handleScroll = () => {
    if (this.props.history.location.pathname === "/") {
      this.setState(() => ({
        sticky: false,
      }));
      return;
    }
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > this.lastScrollTop) {
      this.setState(() => ({ sticky: false }));
    } else {
      this.setState(() => ({ sticky: true }));
    }
    this.lastScrollTop = scrollTop;
  };

  toggleShowMore = () => {
    this.setState((prevState) => ({
      isShowingMore: !prevState.isShowingMore,
    }));
  };

  closeTour = () => {
    this.setState(() => ({ isTourOpen: false }));
  };

  closeWidgetTour = () => {
    this.setState(() => ({ isWidgetTourOpen: false }));
  };

  closePartialTour = () => {
    this.setState(() => ({ isPartialTourOpen: false }));
  };

  openCreateWallet = (options) => {
    const {
      history,
      intl: { locale },
    } = this.props;
    history.push(localisedUrl(locale, links.createWallet));
  };

  openWalletTour = () => {
    const { wasOnWallet } = constants.localStorage;

    setTimeout(() => {
      this.setState(() => ({ isTourOpen: true }));
    }, 1000);
    localStorage.setItem(wasOnWallet, true);
  };

  openWidgetWalletTour = () => {
    const { wasOnWidgetWallet } = constants.localStorage;

    setTimeout(() => {
      this.setState(() => ({ isWidgetTourOpen: true }));
    }, 1000);
    localStorage.setItem(wasOnWidgetWallet, true);
  };

  openExchangeTour = () => {
    const { wasOnExchange } = constants.localStorage;
    setTimeout(() => {
      this.setState(() => ({ isPartialTourOpen: true }));
    }, 1000);

    localStorage.setItem(wasOnExchange, true);
  };

  handleSetDark = () => {
    this.setState(() => ({ themeSwapAnimation: true }))
    if (localStorage.getItem(constants.localStorage.isDark)) {
      localStorage.removeItem(constants.localStorage.isDark);
    } else {
      localStorage.setItem(constants.localStorage.isDark, true);
    }
    window.location.reload();
  }

  render() {
    const {
      sticky,
      isTourOpen,
      path,
      isPartialTourOpen,
      menuItems,
      menuItemsMobile,
      createdWalletLoader,
      isWidgetTourOpen,
      themeSwapAnimation
    } = this.state;
    const {
      intl: { formatMessage, locale },
      history: {
        location: { pathname },
      },
      feeds,
      peer,
      isSigned,
      isInputActive,
    } = this.props;

    const { exchange, wallet } = links;
    const onLogoClickLink =
      window && window.LOGO_REDIRECT_LINK
        ? window.LOGO_REDIRECT_LINK
        : localisedUrl(locale, links.home);
    const hasOwnLogoLink = window && window.LOGO_REDIRECT_LINK;

    const isWalletPage =
      pathname.includes(wallet) ||
      pathname === `/ru${wallet}` ||
      pathname === `/`;

    const isExchange = pathname.includes(exchange);

    const imgNode = (
      <img
        styleName="otherHeaderLogo"
        onClick={this.handleGoHome}
        className="site-logo-header"
        src={isDark ? window.darkLogoUrl : window.logoUrl}
        alt="logo"
      />
    );

    const isOurMainDomain = [
      'localhost',
      'swaponline.github.io',
      'swaponline.io'
    ].includes(window.location.hostname)

    const logoRenderer = isOurMainDomain ?
      <>
        <LogoTooltip withLink isColored isExchange={isWalletPage} />
        <Switcher themeSwapAnimation={themeSwapAnimation} onClick={this.handleSetDark} />
      </>
      :
      <div styleName="flexebleHeader">
        {window.logoUrl !== "#" && (
          <div styleName="imgWrapper">
            {hasOwnLogoLink ? (
              <a href={onLogoClickLink}>{imgNode}</a>
            ) : (
                <Link to={onLogoClickLink}>{imgNode}</Link>
              )}
          </div>
        )}
        <div styleName="rightArea">
          {isWidgetBuild && <WidgetHeader />}
          <Switcher withExit themeSwapAnimation={themeSwapAnimation} onClick={this.handleSetDark} />
        </div>
      </div>

    // if (config && config.isWidget && !config.isFullBuild) {
    //   return <>
    //     {
    //       !isMobile ? (
    //         <WidthContainer styleName="container" className="data-tut-preview">
    //           {logoRenderer}
    //           <Nav menu={menuItems} />
    //         </WidthContainer>
    //       ) : <NavMobile menu={menuItemsMobile} />
    //     }
    //     <User acceptRequest={this.acceptRequest} declineRequest={this.declineRequest} />
    //   </>;
    // }
    if (pathname.includes("/createWallet") && isMobile) {
      return <span />;
    }

    if (isMobile && window.logoUrl) {
      return (
        <header className="data-tut-widget-tourFinish" id="header-mobile" styleName="header-mobile">
          {logoRenderer}
          {createdWalletLoader && (
            <div styleName="loaderCreateWallet">
              <Loader
                showMyOwnTip={formatMessage({
                  id: "createWalletLoaderTip",
                  defaultMessage: "Creating wallet... Please wait.",
                })}
              />
            </div>
          )}
          <UserTooltip
            feeds={feeds}
            peer={peer}
            acceptRequest={this.acceptRequest}
            declineRequest={this.declineRequest}
          />
          <NavMobile menu={menuItemsMobile} isHidden={isInputActive} />
          {!isSigned && <SignUpButton mobile />}
          {isWidgetTourOpen && isWalletPage && (
            <WidgetWalletTour
              isTourOpen={isWidgetTourOpen}
              closeTour={this.closeWidgetTour}
            />
          )}
        </header>
      );
    }

    if (isMobile) {
      return (
        <header id="header-mobile" styleName="header-mobile">
          {createdWalletLoader && (
            <div styleName="loaderCreateWallet">
              <Loader
                showMyOwnTip={formatMessage({
                  id: "createWalletLoaderTip",
                  defaultMessage: "Creating wallet... Please wait.",
                })}
              />
            </div>
          )}
          <UserTooltip
            feeds={feeds}
            peer={peer}
            acceptRequest={this.acceptRequest}
            declineRequest={this.declineRequest}
          />
          <NavMobile menu={menuItemsMobile} isHidden={isInputActive} />
          {!isSigned && <SignUpButton mobile />}
          {isWidgetTourOpen && isWalletPage && (
            <WidgetWalletTour
              isTourOpen={isWidgetTourOpen}
              closeTour={this.closeWidgetTour}
            />
          )}
          <Switcher themeSwapAnimation={themeSwapAnimation} onClick={this.handleSetDark} />
        </header>
      );
    }

    return (
      <header
        className={cx({
          [styles["header"]]: true,
          [styles["widgetHeader"]]: isWidgetBuild && window.logoUrl !== "#",
          [styles["header-fixed"]]: Boolean(sticky),
          [styles["header-promo"]]: isWalletPage && !sticky,
        })}
      >
        {createdWalletLoader && (
          <div styleName="loaderCreateWallet">
            <Loader
              showMyOwnTip={formatMessage({
                id: "createWalletLoaderTip",
                defaultMessage: "Creating wallet... Please wait.",
              })}
            />
          </div>
        )}
        <WidthContainer
          styleName={`container ${isWidgetBuild ? "contawidge_container" : ""}`}
          className="data-tut-preview"
        >
          {logoRenderer}
          <Nav menu={menuItems} />
          {isPartialTourOpen && isExchange && (
            <TourPartial
              isTourOpen={isPartialTourOpen}
              closeTour={this.closePartialTour}
            />
          )}
          <User
            openTour={
              isWalletPage ? this.openExchangeTour : this.openWalletTour
            }
            path={path}
            acceptRequest={this.acceptRequest}
            declineRequest={this.declineRequest}
          />
          {isTourOpen && isWalletPage && (
            <WalletTour isTourOpen={isTourOpen} closeTour={this.closeTour} />
          )}
          {isWidgetTourOpen && isWalletPage && (
            <WidgetWalletTour
              isTourOpen={isWidgetTourOpen}
              closeTour={this.closeWidgetTour}
            />
          )}
        </WidthContainer>
      </header>
    );
  }
}
