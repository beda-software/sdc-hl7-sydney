import React from 'react'
import { Layout, Menu } from 'antd'
const { Header, Content } = Layout;


export function BaseLayout(props: any) {
    const { } = props

    return (
        <>
            <Layout className="layout">
                <Header>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        style={{ lineHeight: '64px' }}
                    >
                        <Menu.Item key='home'>Home</Menu.Item>
                    </Menu>
                </Header>
                <Content style={{ padding: '0 50px' }}>
                    <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>{props.children}</div>
                </Content>
            </Layout>
        </>
    )
}
