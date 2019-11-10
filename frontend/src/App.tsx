import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useService } from './contrib/aidbox-react/hooks/service';
import { getFHIRResources } from './contrib/aidbox-react/services/fhir';

const App: React.FC = () => {

  const user = useService(() => getFHIRResources('User', {}))

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {JSON.stringify(user)}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
