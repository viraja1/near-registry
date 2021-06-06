Near Registry
==========
Near Registry allows you to track popular content just like Hacker News. Anyone can post an entry to the Near Registry. 
Up voting the content requires you to attach NEAR. Same logic can be extended for any other type of registry.

Quick Start
===========

To run this project locally:

1. Prerequisites: Make sure you have Node.js ≥ 14 installed (https://nodejs.org), then use it to install [yarn]: `npm install --global yarn` (or just `npm i -g yarn`)
2. Install dependencies: `yarn install` (or just `yarn`)


Exploring The Code
==================

1. The backend code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. Tests: The backend code gets tested with the `yarn test` command for running the backend
   AssemblyScript tests.

#### model.ts
```
import {context, u128, PersistentVector, PersistentMap} from "near-sdk-as";

/**
 * Exporting a new class Entry so it can be used outside of this file.
 */
@nearBindgen
export class Entry {
  sender: string;

  constructor(public title: string, public description: string, public url: string) {
    this.sender = context.sender;
  }
}

/**
 * collections.vector is a persistent collection. Any changes to it will
 * be automatically saved in the storage.
 * The parameter to the constructor needs to be unique across a single contract.
 * It will be used as a prefix to all keys required to store data in the storage.
 */
export const entries = new PersistentVector<Entry>("entries");
export const votes = new PersistentMap<u32, u128>("votes");
```

#### main.ts
```
import {Entry, entries, votes} from './model';
import {context, u128} from "near-sdk-as";

// --- contract code goes below

/**
 * Adds a new entry under the name of the sender's account id.\
 * NOTE: This is a change method. Which means it will modify the state.\
 * But right now we don't distinguish them with annotations yet.
 */
export function addEntry(title: string, description: string, url: string): void {
  // Creating a new entry and populating fields with our data
  const entry = new Entry(title, description, url);
  // Adding the entry to end of the the persistent collection
  entries.push(entry);
  votes.set(entries.length - 1, u128.fromU32(0));
}


/**
 * Up vote an entry using attachedDeposit\
 * NOTE: This is a change method. Which means it will modify the state.\
 * But right now we don't distinguish them with annotations yet.
 */
export function upVoteEntry(index: u32): void {
  votes.set(index, votes.getSome(index) + context.attachedDeposit);
}

/**
 * Returns an array of entries.\
 * NOTE: This is a view method. Which means it should NOT modify the state.
 */
export function getEntries(): Entry[] {
  const result = new Array<Entry>(entries.length);
  for (let i = 0; i < entries.length; i++) {
    result[i] = entries[i];
  }
  return result;
}
```

Setup
======
```
git clone https://github.com/viraja1/near-registry.git
cd near-registry
yarn install
yarn test
```

Deploy
======

Every smart contract in NEAR has its [own associated account][NEAR accounts]. 
When you run `yarn dev`, your smart contracts get deployed to the live NEAR TestNet with a throwaway account. When you're ready to make it permanent, here's how.


Step 0: Install near-cli
--------------------------

You need near-cli installed globally. Here's how:

    npm install --global near-cli

This will give you the `near` [CLI] tool. Ensure that it's installed with:

    near --version


Step 1: Create an account for the contract
------------------------------------------

Visit [NEAR Wallet] and make a new account. You'll be deploying these smart contracts to this new account.

Now authorize NEAR CLI for this new account, and follow the instructions it gives you:

    near login

Step 2: deploy!
---------------

One command:

    yarn deploy

As you can see in `package.json`, this builds & deploys smart contracts to NEAR TestNet.


  [NEAR]: https://nearprotocol.com/
  [yarn]: https://yarnpkg.com/
  [AssemblyScript]: https://docs.assemblyscript.org/
  [smart contract docs]: https://docs.nearprotocol.com/docs/roles/developer/contracts/assemblyscript
  [asp]: https://www.npmjs.com/package/@as-pect/cli
  [NEAR accounts]: https://docs.nearprotocol.com/docs/concepts/account
  [NEAR Wallet]: https://wallet.nearprotocol.com
  [near-cli]: https://github.com/nearprotocol/near-cli
  [CLI]: https://www.w3schools.com/whatis/whatis_cli.asp
  [create-near-app]: https://github.com/nearprotocol/create-near-app


Credits
===========
https://github.com/near-examples/guest-book/