// Uncomment this for enable custom erc20 tokens
/*
window.widgetERC20Tokens = {
  // Symbol of ERC20 token in lowerCase
  proxima: {
    // Address of ERC20 contract
    address: '0xc060b26e60698e91a6acc84051a26b32e38dd1a4',
    // Count of decimals after dot
    decimals: 18,
    // Display name in wallet (By default - its symbol of ERC20, but can be other userfriendy text)
    fullName: 'Proxima',
    // Icon of currency (image)
    icon: 'https://growup.wpmix.net/wp-content/uploads/2016/10/favicon.png',
    // Background color of icon
    iconBgColor: '#ccc',
  },
  usdt: {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    fullName: 'Usdt'
  },
}
*/

// Uncomment this for enable comisions
/*
window.widgetERC20Comisions = {
  btc: {
    fee: 5,   // percent from withdraw amount
    address: '2MuXz9BErMbWmoTshGgkjd7aMHeaxV8Bdkk',  // wallet for fee
    min: 0.00001 // minimal fee amount
  },
  eth: {
    fee: 7,
    address: '0x276747801B0dbb7ba04685BA27102F1B27Ca0815',
    min: 0.01
  },
  erc20: {
    fee: 6,
    address: '0x276747801B0dbb7ba04685BA27102F1B27Ca0815',
    min: 1,
  }
}
*/
window.buildOptions = {
  showWalletBanners: true, // Allow to see banners
} 
