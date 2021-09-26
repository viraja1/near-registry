import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import Form from './components/Form';
import SignIn from './components/SignIn';
import Entries from './components/Entries';
import { Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = ({ contract, currentUser, nearConfig, wallet }) => {
  const [entries, setEntries] = useState([]);

  const sortEntries = (ent) => {
    const sorted = ent.sort((a, b) => b.votes - a.votes);
    return sorted;
  }


  useEffect(() => {
    contract.getEntries().then((ent) => setEntries(sortEntries(ent)));
  }, []);

  const onSubmit = (e, setShow) => {
    e.preventDefault();
    const { fieldset, title, description, url } = e.target.elements;
    fieldset.disabled = true;
    contract.addEntry(
      { title: title.value, description: description.value, url: url.value },
      BOATLOAD_OF_GAS
    ).then(() => {
      contract.getEntries().then(entries => {
        setEntries(sortEntries(entries));
        title.value = '';
        description.value = '';
        url.value = '';
        fieldset.disabled = false;
        title.focus();
        setShow(false);
      });
    });
  };

  const onUpvote = (e) => {
    e.preventDefault();
    const { fieldset, upvote, index } = e.target.elements;
    fieldset.disabled = true;
    contract.upVoteEntry(
      { index: parseInt(index.value) },
      BOATLOAD_OF_GAS,
      Big(upvote.value || '0').times(10 ** 24).toFixed()
    ).then(() => {
      contract.getEntries().then(entries => {
        setEntries(sortEntries(entries));
        fieldset.disabled = false;
      });
    });
  };

  const signIn = () => {
    wallet.requestSignIn(
      nearConfig.contractName,
      'NEAR Registry'
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <div>
    <Navbar bg="primary" variant="dark">
      <div className="nav-bar-container">
        <Navbar.Brand href="#home">Near Registry</Navbar.Brand>
      </div>
      { currentUser
        ? <button onClick={signOut}>Log out</button>
        : <button onClick={signIn}>Log in</button>
      }
    </Navbar>
    { currentUser
      ? <Form onSubmit={onSubmit} currentUser={currentUser} />
      : <SignIn/>
    }
    { !!currentUser && !!entries.length && <Entries entries={entries} currentUser={currentUser} onUpvote={onUpvote} /> }
    </div>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    addEntry: PropTypes.func.isRequired,
    getEntries: PropTypes.func.isRequired,
    upVoteEntry: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
};

export default App;