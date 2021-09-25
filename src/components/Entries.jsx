import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Card, Modal} from 'react-bootstrap';
import Big from 'big.js';

export default function Entries({entries, currentUser, onUpvote}) {
  console.log(entries);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    setIndex(id);
    setShow(true);
  }
  const [index, setIndex] = useState(null);

  return (
    <div className="entries">
      <h2>Entries</h2>
      {entries.map((entry, i) =>
        <div key={i}>
          <Card style={{width: '100%'}}>
            <Card.Body>
              <Card.Title><a href={entry.url} target="_blank">{entry.title}</a></Card.Title>
              <Card.Text>
                By: {entry.sender}
              </Card.Text>
              <Card.Text>
                {entry.description}
              </Card.Text>
              <Card.Text>
                Votes: {Big(entry.votes).div(10 ** 24).toFixed()} <span title="NEAR Tokens">Ⓝ</span>
              </Card.Text>
              {currentUser &&
              <Card.Text>
                <button onClick={() => {
                  handleShow(entry.id)
                }}>Upvote
                </button>
              </Card.Text>
              }
            </Card.Body>
          </Card>
        </div>
      )}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Upvote
            entry: {entries && index !== null && entries.find((ent) => ent.id === index).title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={onUpvote}>
            <fieldset id="fieldset">
              <p className="highlight">
                <label htmlFor="upvote">Upvote using NEAR Tokens:</label>
                <input
                  autoComplete="off"
                  defaultValue={'0'}
                  id="upvote"
                  max={Big(currentUser.balance).div(10 ** 24)}
                  min="0"
                  step="0.01"
                  type="number"
                  className="form-control"
                /> <span title="NEAR Tokens">Ⓝ</span>
              </p>
              <input type="hidden" value={index} id="index"/>
              <button type="submit">
                Sign
              </button>
            </fieldset>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

Entries.propTypes = {
  entries: PropTypes.array
};