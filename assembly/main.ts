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
