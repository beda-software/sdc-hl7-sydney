import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import { BaseLayout } from './components/BaseLayout';
import { QuestionnairesList } from './containers/QuestionnairesList';
import { QuestionnaireForm } from './containers/QuestionnaireFrom';
import { NewQuestionnaireResponseControl } from './containers/NewQuestionnaireResponseControl';

const App: React.FC = () => {

  return (
    <div className="App">
      <Router>
        <BaseLayout>
          <Switch>
            <Route
              path="/"
              exact
              render={(props) => <QuestionnairesList />}
            />
            <Route
              path="/questionnaire/new"
              exact
              render={(props) => <QuestionnaireForm />}
            />
            <Route
              path="/questionnaire/edit/:id"
              exact
              render={(props) => <QuestionnaireForm />}
            />
            <Route
              path="/questionnaire/fill/:id"
              exact
              render={(props) => <NewQuestionnaireResponseControl {...props} />}
            />
            <Route
              path="/questionnaire-response/:id"
              exact
              render={(props) => <p>Create questionnair response form</p>}
            />
            <Redirect to="/" />
          </Switch>
        </BaseLayout>
      </Router>
    </div>
  );
}

export default App;
