import React from 'react'
import { useService } from '../../contrib/aidbox-react/hooks/service'
import { getFHIRResources } from '../../contrib/aidbox-react/services/fhir'



interface Props { }

export function QuestionnaireResponseList(props: Props) {
    const { } = props

    const questionnaire = useService(() => getFHIRResources('Questionnaire', {}))

    return (
        <>
            <h2>QuestionnaireResponseList</h2>
            <pre>{JSON.stringify(questionnaire, undefined, 2)}</pre>
        </>
    )
}
