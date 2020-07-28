/* eslint-disable quotes */
import React from 'react'
import { Route } from 'react-router'
import { Switch } from 'react-router-dom'
import { links } from 'helpers'
import { localisePrefix } from 'helpers/locale'

import SwapComponent from 'pages/Swap/Swap'
import Home from 'pages/Home/Home'
import History from 'pages/History/History'
import CreateWallet from 'pages/CreateWallet/CreateWallet'
import NotFound from 'pages/NotFound/NotFound'
import About from 'pages/About/About'
import Wallet from 'pages/Wallet/Wallet'
import Currency from 'pages/Currency/Currency'
import PartialClosure from 'pages/PartialClosure/PartialClosure'
import PointOfSell from 'pages/PointOfSell/PointOfSell'
import CurrencyWallet from 'pages/CurrencyWallet/CurrencyWallet'
import Transaction from 'pages/Transaction/Transaction'
import IEO from 'pages/IEO/IEO'
import BtcMultisignProcessor from 'pages/Multisign/Btc/Btc'

import CreateInvoice from 'pages/Invoices/CreateInvoice'
import InvoicesList from 'pages/Invoices/InvoicesList'
import Invoice from 'pages/Invoices/Invoice'

import config from 'helpers/externalConfig'

import ScrollToTop from '../components/layout/ScrollToTop/ScrollToTop'
import SaveMnemonicModal from "components/modals/SaveMnemonicModal/SaveMnemonicModal"
import SaveKeysModal from "components/modals/SaveKeysModal/SaveKeysModal"
import { isMobile } from 'react-device-detect'

import Find from 'pages/Transaction/Find'

const routes = (
  <ScrollToTop>
    <Switch>
      <Route exact path={`${localisePrefix}${links.notFound}`} component={NotFound} />
      <Route exact path={`${localisePrefix}${links.home}`} component={Find} />
      <Route exact path={`${localisePrefix}${links.createWallet}`} component={Find} />
      <Route component={NotFound} />
    </Switch>
  </ScrollToTop>
)

export default routes
