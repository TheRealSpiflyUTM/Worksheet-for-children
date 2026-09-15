import React from 'react';
import { Button, Flex } from 'antd';
import './Buttons.css';

const Button1 = ({isTeacher , setIsTeacher}) => (
  <Flex className="button-container" gap="medium" vertical>
    <Button size="medium" type={isTeacher ?   "primary" : "default"} onClick={() => setIsTeacher(true)} >Profesor</Button>
    <Button size="medium" type={!isTeacher ?  "primary" : "default"} onClick={() => setIsTeacher(false)}>Elev</Button>
  </Flex>
);

export default Button1;