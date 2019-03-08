import React, { Component } from 'react';
import { Layout, List, Icon, Input, Button, message, notification } from 'antd';

import styles from './App.module.scss';

const { Header, Content, Footer } = Layout;
const API_URL = 'https://email-sender-api.herokuapp.com/api/sendEmail';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      receipts: [],
      username: '',
      email: '',
      message: '',
      loading: false
    };
  }

  openNotificationWithIcon = (type, user) => {
    let message = type === 'success' ? 'Success' : 'Error';
    let description = type === 'success' ?
      `Email to ${user.username} is sent successfully!` :
      `Email to ${user.username} is not sent successfully!`;

    notification[type]({
      message,
      description,
    });
  };

  validateFields = () => {
    /*eslint-disable */
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    /*eslint-enable */
    let { username, email } = this.state;
    if (!username) {
      message.error('Username can\'t be empty');
      return false;
    }
    if (!email || !regEx.test(email)) {
      message.error('Invalid Email');
      return false;
    }
    return true;
  }

  handleInputChange = (key) => (e) => {
    this.setState({
      [key]: e.target.value
    });
  }

  handleAddClick = () => {
    // input fields validation
    this.setState({
      username: '',
      email: ''
    });
    if (!this.validateFields()) {
      return;
    }

    let { receipts, username, email } = this.state;
    receipts.push({
      username,
      email,
      status: ''
    });
    this.setState({ receipts });
  }

  handleRemoveReceipt = (index) => () => {
    let { receipts } = this.state;
    receipts.splice(index, 1);
    this.setState({ receipts });
  }

  handleSendSubmit = () => {
    let { receipts } = this.state;
    receipts = receipts.map(item => {
      item.status = 'SENDING';
      return item;
    });
    this.setState({ loading: !this.state.loading, receipts });

    fetch(API_URL,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts: this.state.receipts, message: this.state.message })
      })
      .then(response => response.json())
      .then(({ data }) => {
        data.map((item, index) => {
          let { receipts } = this.state;
          if (item[0].statusCode === 202) {
            receipts[index].status = 'DELIVERED';
            this.openNotificationWithIcon('success', this.state.receipts[index]);
          } else {
            receipts[index].status = 'FAILED';
            this.openNotificationWithIcon('error', this.state.receipts[index]);
          }
          this.setState({ receipts, loading: false });
        });
      })
      .catch(error => {
        message.error(error.message);
        this.setState({ loading: false });
      });
  }

  handleClearSubmit = () => {
    this.setState({
      username: '',
      email: '',
      receipts: [],
      message: ''
    });
  }

  renderReceipt = (item, index) => (
    <List.Item actions={[<a key={index} onClick={this.handleRemoveReceipt(index)}>Remove</a>]}>
      <List.Item.Meta title={item.username} description={item.email} />
      {item.status && (
        <div className={styles.receiptStatus}>
          {item.status}
        </div>
      )}
    </List.Item>
  )

  render() {
    return (
      <Layout className={styles.App}>
        <Header className={styles.header}>
          <h1> Email Sender</h1>
        </Header>
        <Content className={styles.content}>
          <div className={styles.inputGroup}>
            <Input
              className={styles.username}
              placeholder='Type Receipt Name here'
              prefix={<Icon type='user' style={{ color: 'rgba(0,0,0,.25)' }} />}
              value={this.state.username}
              onChange={this.handleInputChange('username')}
            />
            <Input
              className={styles.email}
              placeholder='Type Receipt Email here'
              prefix={<Icon type='mail' style={{ color: 'rgba(0,0,0,.25)' }} />}
              value={this.state.email}
              onChange={this.handleInputChange('email')}
            />
            <Button type='primary' onClick={this.handleAddClick}>Add to list</Button>
          </div>
          <List
            className={styles.receiptList}
            header={<h2>Receipts</h2>}
            bordered
            dataSource={this.state.receipts}
            renderItem={this.renderReceipt}
            locale={{ emptyText: 'No Receipts' }}
            extra={this.state.receipts}
          />
          <Input.TextArea
            rows={5}
            placeholder='Type message here...'
            className={styles.text}
            value={this.state.message}
            onChange={this.handleInputChange('message')}
          />
          <div className={styles.btnGroup}>
            <Button
              type='primary'
              disabled={!this.state.receipts.length || !this.state.message || this.state.loading}
              loading={this.state.loading}
              className={styles.sendBtn}
              onClick={this.handleSendSubmit}
            >
              Send
            </Button>
            <Button
              type='danger'
              className={styles.clearBtn}
              onClick={this.handleClearSubmit}
            >
              Clear
            </Button>
          </div>
        </Content>
        <Footer className={styles.footer}>
          Email Sender Test Project @2018
        </Footer>
      </Layout>
    );
  }
}

export default App;
