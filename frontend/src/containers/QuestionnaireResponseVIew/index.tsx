import React, { useState, useEffect, useRef } from 'react';
import * as _ from 'lodash';
import { Spin, Table, Input, Button, Icon } from 'antd';
import * as ReactRouter from 'react-router';
import { History } from 'history';
import { useService } from '../../contrib/aidbox-react/hooks/service';
import { getFHIRResource } from '../../contrib/aidbox-react/services/fhir';
import { isSuccess, RemoteData, notAsked } from '../../contrib/aidbox-react/libs/remoteData';
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
            // setRemoteData(loading);
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
        return getFHIRResource<Questionnaire>({ resourceType: 'Questionnaire', id: props.match.params.id });
    })
    if (isSuccess(questionnaire)) {
        return <QuestionnaireResponseTable questionnaire={questionnaire.data} />;

    }
    return <Spin />
}
interface QuestionnaireResponseTableProps {
    questionnaire: Questionnaire;

}
function QuestionnaireResponseTable({ questionnaire }: QuestionnaireResponseTableProps) {
    const [params, setParams] = useState<any>({ query: questionnaire['id'] });

    const questionnaireResponse = useQuestionnaireResponseQuery(params);

    const searchInput = useRef<Input>(null);

    function handleSearch(linkId: string, keys: any, confirm: any) {
        confirm();
        setParams({ ...params, [linkId]: keys });
    }

    function handleReset(linkId: string, clearFilters: any) {
        clearFilters();
        setParams(_.omit(params, [linkId]))
    }

    const getColumnSearchProps = (dataIndex: string, type: string) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    type={type === 'integer' ? 'number' : 'string'}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(dataIndex, selectedKeys, confirm)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => handleSearch(dataIndex, selectedKeys, confirm)}
                    icon="search"
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                >
                    Search
            </Button>
                <Button onClick={() => handleReset(dataIndex, clearFilters)} size="small" style={{ width: 90 }}>
                    Reset
            </Button>
            </div>
        ),
        filterIcon: (filtered: any) => (
            <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilterDropdownVisibleChange: (visible: boolean) => {
            if (visible) {
                setTimeout(() => searchInput.current!.select());
            }
        },
    });

    const questionTypes = {};

    const columns = _.map(questionnaire.item, (item) => {
        questionTypes[item.linkId] = item.type;
        let column = {
            title: item.text,
            dataIndex: item.linkId,
            key: item.linkId,
        }
        if (item.type === "string" || item.type === "integer") {
            column = {
                ...column,
                ...getColumnSearchProps(item.linkId, item.type)
            }
        }
        return column;
    });


    if (isSuccess(questionnaireResponse)) {
        const dataSource = _.map(questionnaireResponse.data.entry, ({ resource }: { resource: QuestionnaireResponse }) => {
            const data = { key: resource.id, };
            _.each(resource.item, (item) => {
                try {
                    const type = questionTypes[item.linkId];
                    if (type === 'choice') {
                        data[item.linkId] = item.answer![0].value!.Coding!.display!;
                    } else {
                        data[item.linkId] = item.answer![0].value![type];
                    }
                }
                catch {
                    data[item.linkId] = 'null'
                }
            });
            return data;
        });

        return <Table columns={columns} dataSource={dataSource} scroll={{ x: true }} />;
    }

    return <Spin />
}