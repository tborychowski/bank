NO LONGER USABLE, DUE TO REQUIRED 2FA.


# bank
scraper & auto-login for BoI and AIB.


# install
```sh
yarn
```

# link to ~/bin
```sh
ln -s ~/Projects/bank/index.js  $HOME/bin/bank
```

# run
```sh
node .      # from within the folder
bank        # if linked to ~/bin and ~/bin is in your $PATH
```


# config
rename `config-sample.json` to `config.json` and update the login details.

# usage
```sh
Show stats or auto-login
usage: bank [options] <code>

 <code>          This can be one of the following:
                   bank code: boi, aib, wbk, mbank - show stats for 1 bank
                   all - show stats from all banks
                   storeConfig - put your config file into the keychain
                   restoreConfig - restore your config file from the keychain

 -o, --open      open browser and auto log-in
 -h, --help      display help & usage
 -v, --version   display cli name & version
 ```

 # examples
 ```sh
bank aib       # show stats from aib
bank boi -o    # open boi in browser and log-in
bank aib boi   # show stats from both banks
bank all       # same as above
 ```
