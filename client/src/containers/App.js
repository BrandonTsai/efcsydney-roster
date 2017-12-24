import React, { Component } from 'react';
import styled from 'styled-components';
import QuarterView from '../components/QuarterView';
import LoadingIndicator from '../components/LoadingIndicator';
import NavBar from '../components/NavBar';
import DateBar from '../components/DateBar';
import TagManager from '../components/TagManager';
import moment from 'moment';
import EditRole from './EditRole';
import EditDay from './EditDay';
import API from '../api';
import _ from 'lodash';
import { getQueryParams } from '../utils';

export default class App extends Component {
  state = {
    date: new Date(),
    isLoading: true,
    isEditingRole: false,
    isEditingDay: false,
    selectedData: {},
    selectedService: 'english',
    params: {}
  };
  loadData = ({ from, to }) => {
    let queryParams = {};
    if (document.location.search.length > 0) {
      queryParams = getQueryParams(document.location.search);
    }
    queryParams.from = from;
    queryParams.to = to;
    this.setState({ isLoading: true, params: queryParams });
    return API.retrieve(queryParams)
      .then(data => {
        this.setState({
          events: data,
          isLoading: false
        });
      })
      .catch(e => {
        console.error(e); // eslint-disable-line
        this.setState({ isLoading: false });
      });
  };
  handleButtonClick = direction => {
    const { date } = this.state;

    let newDate = moment(date).startOf('quarter');
    if (direction === 'prev') {
      newDate.subtract(1, 'Q');
    } else {
      newDate.add(1, 'Q');
    }
    this.setState({
      date: newDate.toDate()
    });

    this.loadData({
      from: newDate.format('YYYY-MM-DD'),
      to: newDate.endOf('quarter').format('YYYY-MM-DD')
    });
  };
  handleDayClick = ({ day, footnote }) => {
    this.setState({
      isEditingDay: true,
      selectedData: { date: day.toDate(), footnote }
    });
  };
  handleRoleClick = ({ day, member, role, names }) => {
    this.setState({
      isEditingRole: true,
      selectedData: { date: day.toDate(), member, role, names }
    });
  };
  handleEditDayClose = () => {
    this.setState({
      isEditingDay: false
    });
  };
  handleEditClose = () => {
    this.setState({
      isEditingRole: false,
      selectedData: null
    });
  };
  handleEditSave = form => {
    const { params: { mock } } = this.state;
    if (mock) {
      form.mock = mock;
    }
    API.modify(form).then(() => {
      const clonedEvents = _.clone(this.state.events);
      const i = _.findIndex(clonedEvents.data, {
        date: moment(form.date).format('YYYY-MM-DD')
      });
      const j = _.findIndex(clonedEvents.data[i].members, { role: form.role });
      _.set(clonedEvents, `data.${i}.members.${j}.name`, form.name);
      this.setState({
        events: clonedEvents,
        isEditingRole: false,
        selectedData: null
      });
    });
  };
  handleServiceChange = ({ value }) => {
    document.location.href = `#${value}`;
    this.setState({ selectedService: value });
  };
  handleEditDaySave = form => {
    const { params: { mock } } = this.state;
    if (mock) {
      form.mock = mock;
    }
    API.modify(form).then(() => {
      const events = _.clone(this.state.events);
      const date = moment(form.date).format('YYYY-MM-DD');
      const i = _.findIndex(events.data, { date });
      _.set(events, `data.${i}.footnote`, form.footnote);
      this.setState({
        events,
        isEditingDay: false
      });
    });
  };
  componentWillMount() {
    this.loadData({
      from: moment()
        .startOf('quarter')
        .format('YYYY-MM-DD'),
      to: moment()
        .endOf('quarter')
        .format('YYYY-MM-DD')
    });
  }
  renderTagManager() {
    console.log(process.env); // eslint-disable-line
    const env = process.env.REACT_APP_ENV;
    if (env === 'qa') {
      return <TagManager gtmId="GTM-W8CJV63" />;
    } else if (env === 'production') {
      return <TagManager gtmId="GTM-KS4KKTW" />;
    } else {
      return <div />;
    }
  }
  renderSentryCDN() {
    const env = process.env.REACT_APP_ENV;
    let SentryCDN = (
      <script
        src="http://cdn.ravenjs.com/3.21.0/raven.min.js"
        crossOrigin="anonymous"
      />
    );
    if (env !== 'qa' && env !== 'production') {
      SentryCDN = '';
    }

    return  SentryCDN;
  }
  renderSentryInit() {
    const env = process.env.REACT_APP_ENV;
    let SentryInit = (
      <script>
        {`Raven.config('http://77ecc83e23f04149ab73510390b284f2@sentry.io/260762', {
          release: '0e4fdef81448dcfa0e16ecc4433ff3997aa53572'
        })
        .install();
        //var aa = this_is_a_test_error_from_sentry_20171224;`}
      </script>
    );
    if (env !== 'qa' && env !== 'production') {
      SentryInit = '';
    }
    return  SentryInit;
  }
  render() {
    const {
      date,
      isLoading,
      isEditingDay,
      isEditingRole,
      selectedData,
      selectedService
    } = this.state;

    const barProps = {
      date,
      onPrevClick: this.handleButtonClick.bind(this, 'prev'),
      onNextClick: this.handleButtonClick.bind(this, 'next')
    };

    return (
      <Wrapper>
        {this.renderSentryCDN()}
        {this.renderSentryInit()}
        {this.renderTagManager()}
        <NavBar
          value={selectedService}
          onServiceChange={this.handleServiceChange}
        />
        <Content>
          <DateBar {...barProps} />
          <QuarterView
            date={date}
            data={this.state.events}
            onRoleClick={this.handleRoleClick}
            onDayClick={this.handleDayClick}
          />
          <DateBar position="bottom" {...barProps} />
        </Content>
        <LoadingIndicator
          overlay={true}
          active={isLoading}
          bgcolor="rgba(255, 255, 255, 0.7)"
        />
        {isEditingRole && (
          <EditRole
            title="Edit Event"
            isOpen={isEditingRole}
            {...selectedData}
            onClose={this.handleEditClose}
            onSave={this.handleEditSave}
          />
        )}
        {isEditingDay && (
          <EditDay
            title="Edit Day"
            isOpen={isEditingDay}
            {...selectedData}
            onClose={this.handleEditDayClose}
            onSave={this.handleEditDaySave}
          />
        )}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  padding: 0 0 3em 0;
`;
const Content = styled.div`
  position: relative;
  margin: 10px;
`;
