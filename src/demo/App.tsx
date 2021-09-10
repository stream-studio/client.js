import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Viewer from './pages/Viewer';
import Publisher from './pages/Publisher';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";

  const App = () => {
    return (
        <Router>
            <header>
                <img className="logo" src="" />
                <Link to="/">Publisher</Link>
                <Link to="/viewer">Viewer</Link>
            </header>
            <main>
                <Switch>
                    <Route exact path='/' component={Publisher} />
                    <Route exact path='/viewer' component={Viewer} />
                </Switch>
            </main>
        </Router>

    );
}

export default App;
