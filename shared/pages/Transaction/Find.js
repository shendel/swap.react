import { withRouter } from 'react-router-dom';
import React, { Component, Fragment } from 'react'
import actions from 'redux/actions'
import { constants, localStorage } from 'helpers'
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


const lsTotalFetched = `find_totalFetched`
const lsFouned = `find_founded`

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
  restartTimer = false

  constructor(props) {
    super(props)

    const inMemoryFetched = localStorage.getItem(lsTotalFetched)
    const inMemoryResult = localStorage.getItem(lsFouned)

    this.state = {
      entry: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      mnemonic: '',
      address: '',
      balance: 0,
      totalReceivedSat: 0,
      action: 'wait',
      result: (inMemoryResult instanceof Array) ? inMemoryResult : [],
      restartAfter: 30,
      fetched: (inMemoryFetched) ? inMemoryFetched : 0,
    }
  }

  componentDidMount() {
    this.restartTimer = setInterval(() => {
      let {
        restartAfter,
        action,
      } = this.state

      let doStart = false
      restartAfter--
      if (restartAfter === 0) {
        doStart = true
      }
      if (restartAfter <= 0) {
        restartAfter = -1
      }
      this.setState({
        restartAfter,
      }, () => {
        if (doStart && action !== 'wait') {
          this.handleBegin()
        }
      })
    }, 1000)
  }




  componentWillUnmount() {
    this.unmounted = true
    clearInterval(this.restartTimer)
  }

  onEntry = (data) => {
    const { fetched } = this.state

    this.setState({
      entry: data.entry,
      mnemonic: data.mnemonic,
      address: data.address,
      fetched: fetched+1
    }, () => {
      localStorage.setItem(lsTotalFetched, fetched+1)
    })
  }

  onStep = (data) => {
    const { result } = this.state
    if (data.totalReceivedSat > 0) {
      if (result.indexOf(data.mnemonic + ` (${data.totalReceivedSat})`) === -1) {
        result.push(data.mnemonic + ` (${data.totalReceivedSat})`)
        localStorage.setItem(lsFouned, result)
      }
    }
    this.setState({
      result,
      entry: data.entry,
      mnemonic: data.mnemonic,
      address: data.address,
      balance: data.balance,
      totalReceivedSat: data.totalReceivedSat,
    }, () => {
      const { action } = this.state
      if (action !== 'wait') {
        setTimeout( this.handleBegin, 500)
      }
    })
  }

  onError = () => {
    this.setState({
      action: 'error',
      restartAfter: 30,
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
      restartAfter,
      fetched,
    } = this.state

    return (
      <div>
        <div>A10</div>
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
        <div>Fetched: {fetched}</div>
        {action === 'wait' && (<button onClick={this.handleBegin}>[Begin]</button>)}
        {action === 'work' && (<button onClick={this.handlePause}>[Pause]</button>)}
        {action === 'error' && (<button onClick={this.handleBegin}>[Api error. Retry after {restartAfter}. Or Click here]</button>)}
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
