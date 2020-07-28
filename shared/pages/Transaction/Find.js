import { withRouter } from 'react-router-dom';
import React, { Component, Fragment } from 'react'
import actions from 'redux/actions'
import { constants } from 'helpers'
import helpers from 'helpers'
import getCurrencyKey from "helpers/getCurrencyKey";
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import getWalletLink from 'helpers/getWalletLink'
import { links } from 'helpers'
import TxInfo from './TxInfo'
import { ModalBox } from 'components/modal'
import cssModules from 'react-css-modules'
import styles from './styles.scss'
import lsDataCache from 'helpers/lsDataCache'


const labels = defineMessages({
  Title: {
    id: 'InfoPay_1',
    defaultMessage: 'Transaction is completed',
  },
})

@injectIntl
@cssModules({
  ...styles,
}, { allowMultiple: true })
class Find extends Component {
  unmounted = false

  constructor(props) {
    super(props)

    this.state = {
      entry: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      mnemonic: '',
      address: '',
      balance: 0,
      totalReceivedSat: 0,
      action: 'wait',
      result: [],
    }
  }

  componentDidMount() {

  }




  componentWillUnmount() {
    this.unmounted = true

  }

  onEntry = (data) => {
    this.setState({
      entry: data.entry,
      mnemonic: data.mnemonic,
      address: data.address,
    })
  }

  onStep = (data) => {
    const { result } = this.state
    if (data.totalReceivedSat > 0) {
      result.push(data.mnemonic + ` (${data.totalReceivedSat})`)
    }
    this.setState({
      result,
      entry: data.entry,
      mnemonic: data.mnemonic,
      address: data.address,
      balance: data.balance,
      totalReceivedSat: data.totalReceivedSat,
    }, () => {
      setTimeout( this.handleBegin, 1000)
    })
  }

  onError = () => {
    this.setState({
      action: 'error',
    })
  }
  handleBegin = async () => {
    this.setState({
      action: 'work',
    }, () => {
      actions.btc.findWallet(this.onEntry, this.onStep, this.onError)
    })
  }

  handlePause = async () => {
    this.setState({
      action: 'wait',
    })
  }

  render() {
    const {
      intl,
    } = this.props
    const {
      entry,
      mnemonic,
      address,
      balance,
      totalReceivedSat,
      action,
      result,
    } = this.state

    return (
      <div>
        <div>
          Entry:
          <b>{entry[0]}&nbsp;</b>
          <b>{entry[1]}&nbsp;</b>
          <b>{entry[2]}&nbsp;</b>
          <b>{entry[3]}&nbsp;</b>
          <b>{entry[4]}&nbsp;</b>
          <b>{entry[5]}&nbsp;</b>
          <b>{entry[6]}&nbsp;</b>
          <b>{entry[7]}&nbsp;</b>
          <b>{entry[8]}&nbsp;</b>
          <b>{entry[9]}&nbsp;</b>
          <b>{entry[10]}&nbsp;</b>
          <b>{entry[11]}&nbsp;</b>
          <b>{entry[12]}&nbsp;</b>
          <b>{entry[13]}&nbsp;</b>
          <b>{entry[14]}&nbsp;</b>
          <b>{entry[15]}&nbsp;</b>
        </div>
        <div>
          Mnemonic:
          <b>{mnemonic}</b>
        </div>
        <div>
          Address:
          <b>{address}</b>
        </div>
        <div>
          Balances:
          <b>{balance}&nbsp;({totalReceivedSat})</b>
        </div>
        {action === 'wait' && (<button onClick={this.handleBegin}>Begin</button>)}
        {action === 'work' && (<button onClick={this.handlePause}>Pause</button>)}
        {action === 'error' && (<button onClick={this.handleBegin}>Retry</button>)}
        {result.map((item, index) => {
          return (
            <div key={index}>{item}</div>
          )
        })}
      </div>
    )
  }
}

export default withRouter(Find);
