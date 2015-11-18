import Element from '../ast/Element';
import React from 'react';
import PubSub from 'pubsub-js';
import {getVisualizationSettings, setVisualizationSettings} from '../../LocalStorage';

const ID = 'tree';

export default class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.state = getVisualizationSettings(ID, {hideFunctions: true});
  }

  _setOption(name, event) {
    this.setState(
      {[name]: event.target.checked},
      () => setVisualizationSettings(ID, this.state)
    );
  }

  render() {
    return (
      <div className="tree-visualization container">
        <div className="toolbar">
          <label>
            <input
              type="checkbox"
              checked={this.state.hideFunctions}
              onChange={this._setOption.bind(this, 'hideFunctions')}
            />
            Hide functions
          </label>
          <label>
            <input
              type="checkbox"
              checked={this.state.hideEmptyKeys}
              onChange={this._setOption.bind(this, 'hideEmptyKeys')}
            />
            Hide empty keys
          </label>
        </div>
        <ul onMouseLeave={function() {PubSub.publish('CLEAR_HIGHLIGHT');}}>
          <Element
            focusPath={this.props.focusPath}
            value={this.props.ast}
            level={0}
            parser={this.props.parser}
            settings={this.state}
          />
        </ul>
      </div>
    );
  }
}
