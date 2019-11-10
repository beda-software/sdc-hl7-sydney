import React from 'react';
import './App.css';
import { useService } from './contrib/aidbox-react/hooks/service';
import { getFHIRResources } from './contrib/aidbox-react/services/fhir';
import { QuestionnaireResponseList } from './containers/QuestionnaireResponseList';
import { BaseLayout } from './components/BaseLayout';

const App: React.FC = () => {

  const user = useService(() => getFHIRResources('User', {}))

  return (
    <div className="App">
      <BaseLayout>
        <p>
          {JSON.stringify(user)}
        </p>
        <QuestionnaireResponseList />
      </BaseLayout>
    </div>
  );
}

export default App;
