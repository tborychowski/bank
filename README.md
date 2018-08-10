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
Show stats and auto-login
usage: bank [options] <code>

 <code>          Bank code (boi or aib or all)

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
