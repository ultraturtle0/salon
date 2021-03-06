/*  Importing React allows JSX to work.
    Importing { Component } shortens React.Component syntax to Component.
    Using Component, we can define functions/classes with special features like
    statefulness. */
import React, { Component } from 'react';
/*  Import front-end framework tools for React. */
import { Grid, Row, Col } from 'react-bootstrap';
/*  Import HTTP client axios */
import axios from 'axios';
/*  Import for real-time data transfer */
import io from 'socket.io-client';

import parseTags from './util/parseTags';

import TextEdit from './components/TextEdit.js';
import './css/index.css';



class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        hash: window.location.pathname,
        editable: -1,
        token: '',
        posts: [],
        tags: {}
    }

    this.connectSocket = this.connectSocket.bind(this);

    axios.get('http://localhost:8500' + this.state.hash)
        .then((res) => {
            this.connectSocket(res);
        })
        .catch((err) => {
            console.log(err);
        });
  }

  connectSocket(result) {
      this.socket = io('localhost:8500', {
          query: 'token=' + result.data.token
      });

      this.setState((oldState) => (
          {
              token: result.data.token,
              editable: result.data.editor
          }
      ));

      this.socket
          .on('connect', () => {
              console.log('authenticated');
          })
          .on('disconnect', () => console.log('disconnected'))
          .on('update', (posts) => {
              console.log('updated.');
              var tags = {}
              posts.forEach((post) => tags[post._id] = parseTags(post.BODY));
              console.log(tags);
              this.setState((oldState) => ({posts: posts, tags: tags}));
          })
          .on('save_status', (status) => console.log(status));

      this.saver = (_id, BODY) => this.socket.emit('save', {_id, BODY});

      this.tagger = (id, tags) => {
          var oldTags = this.state.tags;
          oldTags[id] = tags;
          this.setState((oldState) => ({tags: oldTags}));
      }

  }

  render() {

    var essay;
    var editors = (this.state.posts || (new Array(10)).fill(0))
        .map((post, index) => {
            var id = post ? post._id : index;
            if (this.state.editable !== id) return (<TextEdit className="col-sm-6" key={id} id={id} save={this.saver} tagger={this.tagger} body={post.BODY} readOnly={true} />);
            essay = <TextEdit key={id} id={id} save={this.saver} tagger={this.tagger} body={post.BODY} readOnly={false} />
        });

    var editorHalves = [[], []];
    editors.forEach((editor, index) => editorHalves[index % 2].push(editor));

    var tags = Object.keys(this.state.tags)
        .map(key => this.state.tags[key])
        .filter((item) => item.length ? true : false)
        .reduce((accum, val) => accum.concat(val), [])
        .sort()
        .map((tag) => (<p>#{tag}</p>));


    return (
      <div className="App" id='app'>
        <Grid className="viewport"> 
            <Row>
                <Grid className="editors col-sm-4">
                    {editorHalves[0]}
                    {/*<div className="col-sm-6">hi</div>
                    <div className="col-sm-6">hi</div>
                    <div className="col-sm-6">hi</div>
                    <div className="col-sm-6">hi</div>
                    */}
                </Grid>
                {essay ? <div className="essay col-sm-4">{essay}</div> : null}
                <Grid className="editors col-sm-4">
                    {editorHalves[1]}
                </Grid>
                {/*<div className="hashtags col-sm-3">
                    {tags}
                </div>*/} 
            </Row>
        </Grid>

      </div>
    );
  }
}

export default App;
