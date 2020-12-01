### Installation guide

1. Fork this repository (Click "Fork" on top of this page)
2. Clone repository

```
git clone https://github.com/swaponline/MultiCurrencyWallet.git
```

3. Use Node 12

(For change Node version on Linux use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
(For Windows use [nvm for Windows](https://github.com/coreybutler/nvm-windows))

```
nvm install 12
nvm alias default 12
nvm use 12
```

4. Install modules

```
cd MultiCurrencyWallet
npm i
```

(Windows? Use [windows-build-tools](https://www.npmjs.com/package/windows-build-tools).)
(Linux? Install `build-essential`, `g++`, `python` and `make`)

5. Start dev mode

```
npm run start
```

The dev server is running! (http://localhost:9001)

To access from other devices on the local network, specify your IP address:

```
HOST=X.X.X.X npm run start
```

6. Build for prod

```
npm run build:mainnet https://yourcoolsite.com/
```

(don't forget to add a slash in the end of url)


Remember: you MUST be online for swaps and you can not process more than one exchange at the same time. 
