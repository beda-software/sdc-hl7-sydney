import * as _ from 'lodash';
import * as React from 'react';
import { Spin } from 'antd';

import { isFailure, isSuccess, notAsked, RemoteData, success } from '../contrib/aidbox-react/libs/remoteData';

interface SuccessRenderProps<T> {
    data: T;
    setData: (newData: T) => void;
}
type SuccessRender<T> = (props: SuccessRenderProps<T>) => React.ReactNode;
type FailureRender<E> = (error: E) => React.ReactNode;
type LoadingRender = () => React.ReactNode;
interface RenderMap<T, E> {
    success: SuccessRender<T>;
    failure?: FailureRender<E>;
    loading?: LoadingRender;
}

type Children<T, E> = RenderMap<T, E> | SuccessRender<T>;

interface Props<T, E> {
    resolve: () => Promise<RemoteData<T>>;
    children: Children<T, E>;
}

function isRenderMap<T, E>(children: Children<T, E>): children is RenderMap<T, E> {
    return _.isPlainObject(children);
}

export class Resolver<T, E = any> extends React.Component<Props<T, E>, { response: RemoteData<T> }> {
    constructor(props: Props<T, E>) {
        super(props);

        this.state = {
            response: notAsked,
        };
    }

    public async doResolve() {
        const { resolve } = this.props;

        this.setState({ response: await resolve() });
    }

    public async componentDidMount() {
        this.doResolve();
    }

    // public async componentDidUpdate() {
    //     TODO declarative API
    //     this.doResolve();
    // }

    public renderLoading() {
        const { children } = this.props;

        if (isRenderMap(children) && children.loading) {
            return children.loading();
        }

        return <Spin />;
    }

    public renderFailure(error: E) {
        const { children } = this.props;

        if (isRenderMap(children) && children.failure) {
            return children.failure(error);
        }

        return <div>Unable to load resource {JSON.stringify(error)}</div>;
    }

    public renderSuccess(props: SuccessRenderProps<T>) {
        const { children } = this.props;

        if (isRenderMap(children)) {
            return children.success(props);
        }

        return children(props);
    }

    public renderContent() {
        const { response } = this.state;

        if (isFailure(response)) {
            return this.renderFailure(response.error);
        }

        if (isSuccess(response)) {
            return this.renderSuccess({
                data: response.data,
                setData: (newData) => this.setState({ response: success(newData) }),
            });
        }

        return this.renderLoading();
    }

    public render() {
        return this.renderContent();
    }
}
