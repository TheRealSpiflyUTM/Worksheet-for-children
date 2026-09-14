import React from 'react';
import { Button, Flex } from 'antd';
import './Buttons.css';

const Button1 = () => (
  <Flex className="button-container" gap="medium" vertical>
    <Button size="medium">Profesor</Button>
    <Button size="medium">Elev</Button>
  </Flex>
);

export default Button1;