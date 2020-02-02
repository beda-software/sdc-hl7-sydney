import React from 'react'
import { Layout, Menu } from 'antd'
import { Link } from 'react-router-dom';
const { Header, Content } = Layout;


export function BaseLayout(props: any) {
    const { } = props

    return (
        <>
            <Layout className="layout" style={{ textAlign: 'left' }}>
                <Header>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        style={{ lineHeight: '64px' }}
                    >
                        <Menu.Item key='home'><Link to='/'>HL7 SDC Connectathon</Link></Menu.Item>
                        <Menu.Item key='beda'><a target="_blank" href='http://beda.software'>Build by Beda.Software</a></Menu.Item>
                        <Menu.Item key='samurai'><a target="_blank" href='https://www.health-samurai.io/aidbox'>on top of AidBox</a></Menu.Item>
                    </Menu>
                </Header>
                <Content style={{ padding: '0 50px' }}>
                    <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>{props.children}</div>
                </Content>
            </Layout>
        </>
    )
}
