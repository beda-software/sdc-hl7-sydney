import React, { useState, useEffect }  from 'react';
import * as _ from 'lodash';
import { Spin, Table } from 'antd';
import * as ReactRouter from 'react-router';
import { History } from 'history';
import { useService } from '../../contrib/aidbox-react/hooks/service';
import { getFHIRResource } from '../../contrib/aidbox-react/services/fhir';
import { isSuccess, RemoteData, loading, notAsked } from '../../contrib/aidbox-react/libs/remoteData';
import { Questionnaire, QuestionnaireResponse, Bundle } from 'src/contrib/aidbox';
import { service } from '../../contrib/aidbox-react/services/service';
import { SearchParams } from '../../contrib/aidbox-react/services/search';

interface Props {
    history: History;
    match: ReactRouter.match<{ id: string }>;

}

export function useQuestionnaireResponseQuery(
    params: SearchParams,
): RemoteData<Bundle<QuestionnaireResponse>> {
    const [remoteData, setRemoteData] = useState<RemoteData<Bundle<QuestionnaireResponse>>>(notAsked);

    useEffect(() => {
        (async () => {
            setRemoteData(loading);
            const response = await service<Bundle<QuestionnaireResponse>>({
                method: "GET",
                url: '/alpha/QuestionnaireResponse',
                params,
            });
            setRemoteData(response);
        })();
    }, [params]);
    return remoteData;
}


export function QuestionnairesResponseView(props: Props) {
    const [questionnaire] = useService<Questionnaire>(async () => {
        return getFHIRResource<Questionnaire>({resourceType: 'Questionnaire', id: props.match.params.id});
    })
    if(isSuccess(questionnaire)) {
        return <QuestionnaireResponseTable questionnaire={questionnaire.data}/>;

    }
    return <Spin />
}
interface QuestionnaireResponseTableProps {
    questionnaire: Questionnaire;

}
function QuestionnaireResponseTable({ questionnaire }: QuestionnaireResponseTableProps) {
    const columns = _.map(questionnaire.item, (item) => ({
        title: item.text,
        dataIndex: item.linkId,
        key: item.linkId,
    }));
    const [params, setParams] = useState({ query: questionnaire['id'] });

    console.log(setParams);

    const questionnaireResponse = useQuestionnaireResponseQuery(params);

    if (isSuccess(questionnaireResponse)) {
        const dataSource = _.map(questionnaireResponse.data.entry, ({ resource }: {resource: QuestionnaireResponse}) => {
            const data = { key: resource.id, };
            _.each(resource.item, (item) => {
                data[item.linkId] = JSON.stringify(item.answer);
            });
            return data;
        });

        return <Table columns={columns} dataSource={dataSource} />;
    }

    return <Spin />
}