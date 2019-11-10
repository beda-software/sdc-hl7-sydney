import React, { useState } from 'react';
import * as _ from 'lodash';
import { Col, Row, Button, List, Spin } from 'antd';
import { getFHIRResources, extractBundleResources } from '../../contrib/aidbox-react/services/fhir';
import { useService } from '../../contrib/aidbox-react/hooks/service';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';
import { Questionnaire } from '../../contrib/aidbox';
import { Link } from 'react-router-dom';

interface Props {
}

export function QuestionnairesList(props: Props) {
    const [showFrom, setShowFrom] = useState<boolean>(false);

    const [bundleResponse] = useService(() => getFHIRResources<Questionnaire>('Questionnaire', {}), [])
    if (isSuccess(bundleResponse)) {
        const resourcesByType = extractBundleResources(bundleResponse.data);
        const questionnaires = resourcesByType.Questionnaire
        console.log(questionnaires)

        return (
            <Row>
                <Col span={24}>
                    <Button type='default' onClick={() => setShowFrom(true)}>CreateQuestionnaire</Button>
                </Col>
                {showFrom && (
                    <Col>

                    </Col>
                )}
                <h2>Add new response</h2>
                <List>
                    {questionnaires && questionnaires.length ? (
                        _.map(questionnaires, (questionnaire) => (
                            <List.Item key={questionnaire.id}>
                                {questionnaire.title}{'  '}
                                <Link to={`/questionnaire/fill/${questionnaire.id}`}>
                                    <Button type='primary'>Add response</Button>
                                </Link>

                            </List.Item>
                        ))
                    ) : <p>No questionnaires added</p>}
                </ List>
            </Row>
        );
    }
    return <Spin />
}