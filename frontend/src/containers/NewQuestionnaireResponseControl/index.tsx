import React from 'react'
// import { saveFHIRResource } from '../../contrib/aidbox-react/services/fhir'
// import { isSuccess } from 'src/contrib/aidbox-react/libs/remoteData'
// import { getFHIRCurrentDateTime } from 'src/utils/date'
// import { notification } from 'antd'
// import { QuestionnaireResponseForm } from 'src/components/QuestionnaireResponseForm'

interface Props {
    questionnaire: any // Questionnaire
}

export function NewQuestionnaireResponseControl(props: Props) {
    const { questionnaire } = props

    // const [visible, setVisible] = React.useState<boolean>(false);

    return (
        <>
            <p key={questionnaire.id}>
                {questionnaire.title}
            </p>
        </>
        // <QuestionnaireResponseForm
        //     questionnaire={questionnaire}
        //     resource={questionnaireResponseModal.questionnaireResponse!}
        //     onSave={async (resource) => {
        //         const response = await saveFHIRResource({
        //             ...resource,
        //             authored: resource.authored ? resource.authored : getFHIRCurrentDateTime(),
        //         });
        //         if (isSuccess(response)) {
        //             notification.success({
        //                 message: 'Questionnaire response successfully saved',
        //             });

        //             reload();
        //         } else {
        //             notification.error({ message: 'Something went wrong' });
        //         }
        //     }}
        // />
    )
}
