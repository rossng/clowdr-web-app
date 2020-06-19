import {AuthUserContext} from "../Session";
import React from "react";
import {Alert, Button, Card, Form, Input, Result, Space, Spin, Steps, Typography} from "antd";
import Parse from "parse";
import {LoadingOutlined} from '@ant-design/icons';
import LandingContainer from "../LandingContainer";
import Account from "./Account";

class SlackToVideo extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {

        let confID = this.props.match.params.conferenceID;
        let userID = this.props.match.params.userID;
        let token = this.props.match.params.token;
        try {
            if(this.props.authContext.user){
                let currentStep =1;
                if(this.props.authContext.user.get("passwordSet")){
                    currentStep =2;
                }
                this.setState({loading: false, step: currentStep});
            }
            else {
                let res = await Parse.Cloud.run("login-fromToken", {
                    token: token,
                    userID: userID
                });
                try {
                    let u = await Parse.User.become(res.token);
                    let confQ = new Parse.Query("ClowdrInstance");
                    let conf = await confQ.get(confID);
                    await this.props.authContext.refreshUser(conf, true);
                    let currentStep =1;
                    if(this.props.authContext.user.get("passwordSet")){
                        currentStep =2;
                    }
                    this.setState({loading: false, step: currentStep});
                } catch (err) {
                    console.log(err);
                    this.setState({error: "Invalid signup link. "});
                }
            }
        }catch(err){
            console.log(err);
        }

    }

    async setPassword(values){
        this.setState({updating: true});
        this.props.authContext.user.setPassword(values.password);
        this.props.authContext.user.set("passwordSet",true);
        await this.props.authContext.user.save();
        this.setState({updating: false, step: 2});

    }

    render() {
        if (this.state.error) {
            return <Alert message="Invalid magic link." description={this.state.error} type="error"/>
        }
        const antIcon = <LoadingOutlined color="white" style={{ fontSize: 96 }} spin />;

        if(this.props.authContext.user){
            let action = <></>
            if(this.state.step == 1){
                let password1Rules = [
                    {
                        required: true,
                        message: 'Please input your password!',
                    }
                ];
                let password2Rules = [
                    {
                        required: true,
                        message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                        validator(rule, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject('The two passwords that you entered do not match!');
                        },
                    }),
                ];
                const layout = {
                    labelCol: { span: 8 },
                    wrapperCol: { span: 16 },
                };
                const tailLayout = {
                    wrapperCol: { offset: 8, span: 16 },
                };

                action = <div>

                    <Card title="Create a Password for Clowdr.org" style={{maxWidth: "500px", marginLeft:"auto",marginRight:"auto"}}>
                        <Typography.Paragraph>{this.props.authContext.currentConference.get("conferenceName")} is using Clowdr.org to power its
                        virtual conference. Each attendee has their own profile that lets them customize their virtual
                        conference experience. Please choose a password to use to login.</Typography.Paragraph>
                        <Form       {...layout}
                                    onFinish={this.setPassword.bind(this)}>
                            <Form.Item label="Email Address"
                                       extra={"This is the email that you used to register for "+this.props.authContext.currentConference.get("conferenceName")+" and can't be changed"}
                            >
                                <Input value={this.props.authContext.user.getEmail()}
                                       name="email"
                                       type="text"
                                       disabled={true}
                                />
                            </Form.Item>
                            <Form.Item label="Password"
                                       name="password"
                                       rules={password1Rules}
                                       hasFeedback
                            >
                                <Input.Password placeholder="input password"
                                />
                            </Form.Item>
                            <Form.Item label="Confirm Password"
                                       name="confirm"
                                       rules={password2Rules}
                            >
                                <Input.Password
                                    placeholder="input password"
                                />
                            </Form.Item>
                            <Form.Item {...tailLayout}>
                                <Button type="primary" htmlType="submit" loading={this.state.updating}>
                                    Submit
                                </Button>
                            </Form.Item>
                        </Form></Card>
                </div>
            }else if(this.state.step == 2){
                action = <Card title="Complete Your Virtual Badge" style={{marginLeft:"auto",marginRight:"auto",maxWidth:"700px"}}>
                    <Typography.Paragraph>Make it easier for others to find you by uploading an avatar and completing your profile. We've pre-filled some of this information from your conference registration.</Typography.Paragraph>
                    <Account embedded={true} onFinish={()=>{this.setState({step: 3})}}/></Card>
            }
            else if(this.state.step == 3){
                action = <Result
                    status="success"
                    title={"You're ready to explore Virtual " + this.props.authContext.currentConference.get("conferenceName")+"!"}
                    subTitle={"You can now log back in to " + this.props.authContext.currentConference.get("conferenceName") + " at any time by returning to this site. Feel free to use the navigation above to explore the conference, or start with some of the most popular pages:"}
                    extra={[
                        <Button type="primary" key="console" onClick={()=>this.props.history.push("/live")}>
                            Live Sessions
                        </Button>,
                        <Button type="primary" key="programButton" onClick={()=>this.props.history.push("/program")}>
                          Program
                        </Button>,
                        <Button key="lobbyButton" type="primary" onClick={()=>this.props.history.push("/lobby")}>Lobby Session</Button>,
                    ]}
                />
            }
            return <div>
                <Steps current={this.state.step}>
                    <Steps.Step title="Register" description={"You have registered for "+this.props.authContext.currentConference.get("conferenceName") +", and are almost ready to visit the virtual conference!"} />
                    <Steps.Step title="Create Password" description="You'll use this password to sign in directly to this app."/>
                    <Steps.Step title="Complete Your Virtual Badge" description="Tell other attendees who you are."/>
                    <Steps.Step title="Visit the Virtual Conference" description="Streaming videos, schedules, social features and more!"/>

                </Steps>
                <Space />
                {action}
            </div>
        }
        return <div id="landing-page">
            <LandingContainer>
                <div className="header-content" style={{top: "33%"}}>
                    <div className="header-content-inner"
                         style={{backgroundColor: "rgba(1,1,1,.5)", maxWidth: "800px"}}>

                        <Typography.Title>Just a minute...</Typography.Title>
                        <div style={{marginLeft: 'auto', marginRight: 'auto'}}>
                            <Spin indicator={antIcon}/>
                        </div>
                    </div>
                </div>
            </LandingContainer>
        </div>
    }
}

const
    AuthConsumer = (props) => (
        <AuthUserContext.Consumer>
            {value => (
                <SlackToVideo {...props} user={value.user} authContext={value}/>
            )}
        </AuthUserContext.Consumer>
    );

export default AuthConsumer;