Near Registry
==========
Near Registry allows you to track popular content just like Hacker News. Anyone can post an entry to the Near Registry. 
Up voting the content requires you to attach NEAR. The registry is sorted based on the NEAR attached to the entries. 
Same logic can be extended for any other type of registry.

Quick Start
===========

To run this project locally:

1. Prerequisites: Make sure you have Node.js ≥ 14 installed (https://nodejs.org), then use it to install [yarn]: `npm install --global yarn` (or just `npm i -g yarn`)
2. Install dependencies: `yarn install` (or just `yarn`)


Exploring The Code
==================

1. The backend code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy`. This sort of
   code that runs on a blockchain is called a "smart contract". [Learn more
   about NEAR smart contracts][smart contract docs].
2. Tests: The backend code gets tested with the `yarn test` command for running the backend
   AssemblyScript tests.
3. The frontend code lies in the `/src` folder. It uses near-api-js which is a JavaScript/TypeScript library for 
   development of decentralized applications on the NEAR platform. It works in conjunction with NEAR RPC endpoints 
   to help you connect your application to the NEAR blockchain. [Learn more
    about NEAR Frontend][NEAR Frontend]. 

The NEAR platform supports writing contracts in Rust and AssemblyScript. This app uses AssemblyScript. 
AssemblyScript is a dialect of TypeScript that compiles to Wasm.

Contracts are a named collection of (exported) functions that have access (via near-sdk-as) to their execution 
context (sender, receiver, block height, etc) as well as storage services (key-value pair and convenience collections 
like Map, Vector and Deque), logging services and some utility functions.

To keep things organized, contracts can use one or more data objects which are commonly added to the model.ts file.
All contracts and models must explicitly import features of the NEAR they intend to use. Not all of these features are 
used all of the time of course.

#### assembly/model.ts
```
import {context, u128, PersistentVector} from "near-sdk-as";

/**
 * Exporting a new class Entry so it can be used outside of this file.
 */
@nearBindgen
export class Entry {
  sender: string;

  constructor(public title: string, public description: string, public url: string, public id: i32, public votes: u128) {
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
```

In the above models.ts file, we define a new type named Entry which is currently not available 
(as opposed to primitive types like integers, strings and bool which are always available). 
Since models are just AssemblyScript classes, they support custom constructors. Each entry has sender, title, 
description, url, id and votes. Each of these is associated with a specific type and is declared as public. In the 
constructor, we define the sender as  context.sender. The context object provides context for contract execution including 
information about the transaction sender, blockchain height, and attached deposit available for use during contract 
execution, etc.
                                                              
At the end, we define that entries is a PersistentVector (collection) of type Entry. The PersistentVector writes and reads 
from storage abstracting away a lot of what you might want to add to the storage object. These collection wrap 
the Storage class with convenience methods so you must always use a unique storage prefix for different collections 
to avoid data collision. PersistentVector acts like an array. To create entries, we use the synthax 
`new PersistentVector<Entry>("entries")`. The vector supports the methods like push, pop and length.

#### assembly/main.ts
```
import {Entry, entries} from './model';
import {context, u128} from "near-sdk-as";

// --- contract code goes below

/**
 * Adds a new entry under the name of the sender's account id.\
 * NOTE: This is a change method. Which means it will modify the state.\
 * But right now we don't distinguish them with annotations yet.
 */
export function addEntry(title: string, description: string, url: string): void {
  // Creating a new entry and populating fields with our data
  const entry = new Entry(title, description, url, entries.length, u128.fromU64(0));
  // Adding the entry to end of the the persistent collection
  entries.push(entry);
}


/**
 * Up vote an entry using attachedDeposit\
 * NOTE: This is a change method. Which means it will modify the state.\
 * But right now we don't distinguish them with annotations yet.
 */
export function upVoteEntry(index: i32): void {
  const entry = entries[i32(index)];
  entry.votes = u128.add(entry.votes, context.attachedDeposit);
  entries[i32(index)] = entry;
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

Contract function calls are stateless. Any state that you want to save to the blockchain needs to be explicitly 
saved by interacting with the storage object e.g. entries. In the main.ts file, the contract functions like 
`addEntry`, `upVoteEntry` and `getEntries` are defined. Function declarations follow standard AssemblyScript conventions, 
including the parameters they take, optional arguments and return values. 

There are two types of functions that can interact with the blockchain -- "view" functions and "change" functions. 
The difference, however, does not exist on the contract level. 
View functions like `getEntries` do not actually change the state of the blockchain. Change functions 
like `addEntry` and `upVoteEntry` modify the state.

In the addEntry function, we create a new Entry and add it to the entries PersistentVector using the push method. 
In the upVoteEntry function, we first fetch the entry from the entries PersistentVector using the index. Then we 
increment the entry votes using context.attachedDeposit. Then we update the entries PersistentVector using the index.

#### assembly/__tests__/registry.spec.ts
```
import {addEntry, getEntries, upVoteEntry} from '../main';
import {Entry, entries} from '../model';
import {VMContext, Context, u128} from 'near-sdk-as';

function createEntry(title: string, description: string, url: string): Entry {
  return new Entry(title, description, url, 0, u128.fromU64(0));
}

const entry = createEntry('Near Protocol - Infrastructure for Innovation',
  'NEAR is an open source platform that accelerates the development of decentralized applications.',
  'https://near.org/');

describe('entries tests', () => {
  afterEach(() => {
    while (entries.length > 0) {
      entries.pop();
    }
  });

  it('adds a entry', () => {
    addEntry('Near Protocol - Infrastructure for Innovation',
      'NEAR is an open source platform that accelerates the development of decentralized applications.',
      'https://near.org/');
    expect(entries.length).toBe(
      1,
      'should only contain one entry'
    );
    expect(entries[0].url).toStrictEqual(
      'https://near.org/',
      'url matches'
    );
  });

  it('check up vote', () => {
    addEntry('Near Protocol - Infrastructure for Innovation',
      'NEAR is an open source platform that accelerates the development of decentralized applications.',
      'https://near.org/');
    expect(entries[0].votes.toString()).toStrictEqual(u128.fromU32(0).toString(),
      'entry should have 0 vote'
    );
    VMContext.setAttached_deposit(u128.from('10000000000000000000000'));
    upVoteEntry(i32(0));
    expect(entries[0].votes.toString()).toStrictEqual(u128.from('10000000000000000000000').toString(),
      'entry should have a vote'
    );
  });

  it('retrieves entries', () => {
    addEntry('Near Protocol - Infrastructure for Innovation',
      'NEAR is an open source platform that accelerates the development of decentralized applications.',
      'https://near.org/');
    const entriesList = getEntries();
    expect(entriesList.length).toBe(
      1,
      'should be one entry'
    );
    expect(entriesList).toIncludeEqual(
      entry,
      'entries should include:\n' + entry.toJSON()
    );
  });
});

describe('attached deposit tests', () => {
  beforeEach(() => {
    VMContext.setAttached_deposit(u128.fromString('0'));
    VMContext.setAccount_balance(u128.fromString('0'));
  });

  it('attaches a deposit to a contract call', () => {
    log('Initial account balance: ' + Context.accountBalance.toString());

    addEntry('Near Protocol - Infrastructure for Innovation',
      'NEAR is an open source platform that accelerates the development of decentralized applications.',
      'https://near.org/');
    VMContext.setAttached_deposit(u128.from('10'));

    log('Attached deposit: 10');
    log('Account balance after deposit: ' + Context.accountBalance.toString());

    expect(Context.accountBalance.toString()).toStrictEqual(
      '10',
      'balance should be 10'
    );
  });
});
```

To make sure our smart contract works as expected, we have written the above JavaScript tests. It tests various cases
like add an entry, upvote an entry, retrieve entries and attach a deposit to a contract call. To run the tests, we use
`yarn test` command. It then prints the results to the console.

Setup
======
```
git clone https://github.com/viraja1/near-registry.git
cd near-registry
yarn install
yarn test
```

Deploy Smart Contract
=====================

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

Note down the smart contract account id from the console and update it in src/config.js:1


Run the Frontend
================

Run the following commands from the near-registry folder

```
cd src
yarn install
yarn start
```

Then visit http://localhost:1234 from your browser to test the Near Registry

Deploy the Frontend using netlify
=================================

Run the following commands from the near-registry folder

```
cd src
yarn build
yarn global add netlify-cli
netlify login
netlify deploy --prod
```

Then follow the instructions given by the netlify cli and specify `./dist` as the publish directory

Screenshots
===========
![](src/screenshots/near_registry_1.png)

![](src/screenshots/near_registry_2.png)

![](src/screenshots/near_registry_3.png)

![](src/screenshots/near_registry_4.png)


App Link (NEAR Testnet)
=======================
https://near-registry.netlify.app/


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
  [NEAR Frontend]: https://docs.near.org/docs/api/naj-quick-reference


Credits
===========
https://github.com/near-examples/guest-book/