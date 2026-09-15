import React from 'react';
import { Input, Button } from 'antd';
import './Auth.css';

const AuthExample = () => {
const [passwordVisible, setPasswordVisible] = React.useState(false);

return ( <div className="auth-container"> <div className="auth-form">


    <Input
      placeholder="Username"
      className="username-input"
    />

    <div className="password-row">
      <Input.Password
        placeholder="Password"
        visibilityToggle={{
          visible: passwordVisible,
          onVisibleChange: setPasswordVisible
        }}
        className="password-input"
      />

      
    </div>

    <Button type="primary" className="enter-button">
      Enter
    </Button>

  </div>
</div>


);
};

export default AuthExample;
