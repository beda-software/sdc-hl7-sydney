import React from 'react';
import './App.css';
import { QuestionnaireResponseList } from './containers/QuestionnaireResponseList';
import { BaseLayout } from './components/BaseLayout';

const App: React.FC = () => {

  return (
    <div className="App">
      <BaseLayout>
        <QuestionnaireResponseList />
      </BaseLayout>
    </div>
  );
}

export default App;
