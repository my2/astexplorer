/**
 * @jsx React.DOM
 */
"use strict";

require('./Object.es7.shim');

var ASTOutput = require('./ASTOutput');
var Editor = require('./Editor');
var ErrorMessage = require('./ErrorMessage');
var PubSub = require('pubsub-js');
var React = require('react/addons');
var Snippet = require('./Snippet');
var Toolbar = require('./Toolbar');

var getFocusPath = require('./getFocusPath');
var esprima = require('esprima-fb');
var fs = require('fs');

var initialCode = fs.readFileSync(__dirname + '/codeExample.txt', 'utf8');

function updateHashWithIDAndRevision(id, rev) {
  global.location.hash = '/' + id + (rev && rev !== 0 ? '/' + rev : '');
}

var App = React.createClass({
  getInitialState: function() {
    var snippet = this.props.snippet;
    var revision = this.props.revision;
    if ((snippet && !revision) || (!snippet && revision)) {
      throw Error('Most set both, snippet and revision');
    }
    return {
      forking: false,
      saving: false,
      ast: null,
      focusPath: [],
      content: revision && revision.get('code') || initialCode,
      snippet: snippet,
      revision: revision,
    };
  },

  componentDidMount: function() {
    if (this.props.error) {
      this._showError(this.props.error);
    }
    global.onhashchange = function() {
      if (!this.state.saving || !this.state.forking) {
        Snippet.fetchFromURL().then(
          function(data) {
            if (data) {
              this._setRevision(data.snippet, data.revision);
            } else {
              this._clearRevision();
            }
          }.bind(this),
          function(error) {
            this._showError('Failed to fetch revision: ' + error.message);
          }.bind(this)
        );
      }
    }.bind(this);

    PubSub.subscribe('HIGHLIGHT', function(_, astNode) {
      PubSub.publish('CM.HIGHLIGHT', astNode.range);
    });
    PubSub.subscribe('CLEAR_HIGHLIGHT', function(_, astNode) {
      PubSub.publish('CM.CLEAR_HIGHLIGHT', astNode.range);
    });
  },

  _setRevision: function(snippet, revision) {
    if (!snippet || !revision) {
      this.setError('Something went wrong fetching the revision. Try to refresh!');
    }
    if (!this.state.snippet ||
        snippet.id !== this.state.snippet.id ||
        revision.id !== this.state.revision.id ||
        revision.get('code') !== this.state.revision.get('code')) {
      this.setState({
        snippet: snippet,
        revision: revision,
        content: revision.get('code'),
        focusPath: []
      });
    }
  },

  _clearRevision: function() {
    this.setState({
      ast: esprima.parse(initialCode, {range: true}),
      focusPath: [],
      content: initialCode,
      snippet: null,
      revision: null,
    });
  },

  onContentChange: function(data) {
    var content = data.value;
    var cursor = data.cursor;
    if (this.state.ast && this.state.content === content) {
      return;
    }

    var ast;
    try {
      ast = esprima.parse(content, {range: true});
    }
    catch(e) {
      this.setState({
        error: 'Syntax error: ' + e.message,
        content: content,
      });
    }

    if (ast) {
      this.setState({
        content: content,
        ast: ast,
        focusPath: this._getFocusPath(ast, cursor),
        error: null
      });
    }
  },

  onActivity: function(cursorPos) {
    this.setState({
      focusPath: this._getFocusPath(this.state.ast, cursorPos)
    });
  },

  _getFocusPath: function(ast, cursorPos) {
    var focus = {line: cursorPos.line + 1, column: cursorPos.ch};
    return getFocusPath(ast, focus);
  },

  _showError: function(msg) {
    this.setState({error: msg});
    setTimeout(function() {
      if (msg === this.state.error) {
        this.setState({error: false});
      }
    }.bind(this), 3000);
  },

  _save: function(fork) {
    var snippet = !fork && this.state.snippet || new Snippet();
    var code = this.refs.editor.getValue();
    if (snippet.get('code') === code) return;
    this.setState({saving: !fork, forking: fork});
    snippet.createNewRevision({code: code}).then(
      function(response) {
        if (response) {
          updateHashWithIDAndRevision(snippet.id, response.revisionNumber);
        }
        this.setState({
          saving: false,
          forking: false,
        });
      }.bind(this),
      function(snippet, error) {
        this._showError('Could not save: ' + error.message);
        this.setState({saving: false, forking: false});
      }.bind(this)
    );
  },

  _onSave: function() {
    this._save();
   },

  _onFork: function() {
    this._save(true);
   },

  render: function() {
    var revision = this.state.revision;
    return (
      <div>
        <Toolbar
          forking={this.state.forking}
          saving={this.state.saving}
          onSave={this._onSave}
          onFork={this._onFork}
          canSave={
            this.state.content !== initialCode && !revision ||
            revision && revision.get('code') !== this.state.content
          }
          canFork={!!revision}
        />
        {this.state.error ? <ErrorMessage message={this.state.error} /> : null}
        <Editor
          ref="editor"
          value={this.state.content}
          onContentChange={this.onContentChange}
          onActivity={this.onActivity}
        />
        <ASTOutput focusPath={this.state.focusPath} ast={this.state.ast} />
      </div>
    );
  }
});

function render(props) {
  React.render(
    <App {...props} />,
    document.getElementById('container')
  );
}

Snippet.fetchFromURL().then(
  function(data) {
    render(data);
  },
  function(error) {
    render({error: 'Failed to fetch revision: ' + error.message});
  }
);
