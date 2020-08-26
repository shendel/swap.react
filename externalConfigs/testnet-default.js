// mainnet-localhost

window.widgetERC20Comisions = {
  btc: {
    fee: "5",
    address: '2MuXz9BErMbWmoTshGgkjd7aMHeaxV8Bdkk',
    min: "0.00001"
  },
  ghost: {
    fee: "5",
    address: 'XUmEvrKkTEGPr8WaktQVVE49ZBxcaPUmwv',
    min: "0.00001"
  },
  eth: {
    fee: "7",
    address: '0x276747801B0dbb7ba04685BA27102F1B27Ca0815',
    min: "0,01"
  },
  erc20: {
    address: '0x276747801B0dbb7ba04685BA27102F1B27Ca0815',
  }
}


window.widgetERC20Tokens = {
  usdt: {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    fullName: 'Usdt',
    icon: 'https://growup.wpmix.net/wp-content/uploads/2016/10/favicon.png',
  },
  // Symbol of ERC20 token in lowerCase
  ghost: {
		address: '0x14f5af6b1a4a9a10fb8c3717499ddefa85195914',
		decimals: 18,
		fullName: 'GHOST',
		icon: 'https://ghostx.live/wp-content/uploads/2020/06/ghostlogo-black.png',
		customEcxchangeRate: '',
		iconBgColor: '',
		howToDeposit: '',
		howToWithdraw: '',
	}
}

window.buildOptions = {
  ownTokens: true, // Will be inited from window.widgetERC20Tokens
  addCustomERC20: true, // Allow user add custom erc20 tokens
  curEnabled: false,
  showWalletBanners: true, // Allow to see banners
  invoiceEnabled: true, // Allow create invoices
  hideShowPrivateKey: true, // Hide 'Copy Private Key' Menu item, default false, inited also from window.SWAP_HIDE_EXPORT_PRIVATEKEY
//  fee: { btc .... }, // Can be inited from window.widgetERC20Comisions
  // inited from window.EXCHANGE_DISABLED
  exchangeDisabled: true,
  curEnabled: { // Or 'false' if enabled all
    // inited from window.CUR_BTC_DISABLED
    btc: true,
    // inited from window.CUR_ETH_DISABLED
    eth: true,
    ghost: true
  },
}


window.buildOptions = {
  showWalletBanners: true, // Allow to see banners
  showHowItsWork: true, // Can be inited from window.showHowItWorksOnExchangePage
  // inited from window.EXCHANGE_DISABLED
  exchangeDisabled: false,
  
  curEnabled: { // Or 'false' if enabled all
    // inited from window.CUR_BTC_DISABLED
    btc: true,
    // inited from window.CUR_ETH_DISABLED
    eth: true,
    ghost: true,
  },
}
