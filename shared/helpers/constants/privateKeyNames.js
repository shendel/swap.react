export default {
  btcMnemonic: `${process.env.ENTRY}:btc:mnemonicKey`,
  ethMnemonic: `${process.env.ENTRY}:eth:mnemonicKey`,
  eth: `${process.env.ENTRY}:eth:privateKey`,
  btc: `${process.env.ENTRY}:btc:privateKey`,
  ethOld: `${process.env.ENTRY}:eth:privateKey:old`, // Sweep
  btcOld: `${process.env.ENTRY}:btc:privateKey:old`, // Sweep
  twentywords: `${process.env.ENTRY}:twentywords`,
  btcMultisig: `${process.env.ENTRY}:btcMultisig:privateKey`,
  btcMultisigOtherOwnerKey: `${process.env.ENTRY}:btcMultisig:otherOwnerKey`,
  btcMultisigOtherOwnerKeyMnemonic: `${process.env.ENTRY}:btcMultisig:otherOwnerKey:Mnemonic`, // Sweep
  btcMultisigOtherOwnerKeyOld: `${process.env.ENTRY}:btcMultisig:otherOwnerKey:old`, // Sweep
  btcSmsMnemonicKey: `${process.env.ENTRY}:btcSmsMnemonicKey`,
  btcSmsMnemonicKeyMnemonic: `${process.env.ENTRY}:btcSmsMnemonicKey:Mnemonic`, // Sweep
  btcSmsMnemonicKeyOld: `${process.env.ENTRY}:btcSmsMnemonicKey:old`, // Sweep
  ethKeychainPublicKey: `${process.env.ENTRY}:eth:keychainPublicKey`,
  btcKeychainPublicKey: `${process.env.ENTRY}:btc:keychainPublicKey`,
  btcMultisigKeychainPublicKey: `${process.env.ENTRY}:btcMultisig:keychainPublicKey`,
  // xlm: `${process.env.ENTRY}:xlm:privateKey`,
  bch: `${process.env.ENTRY}:bch:privateKey`,
  bchOld: `${process.env.ENTRY}:bch:privateKey:old`,
  bchMnemonic: `${process.env.ENTRY}:bch:mnemonicKey`,
  ltc: `${process.env.ENTRY}:ltc:privateKey`,
  ltcOld: `${process.env.ENTRY}:ltc:privateKey:old`,
  ltcMnemonic: `${process.env.ENTRY}:ltc:mnemonicKey`,
  qtum: `${process.env.ENTRY}:qtum:privateKey`,
}
