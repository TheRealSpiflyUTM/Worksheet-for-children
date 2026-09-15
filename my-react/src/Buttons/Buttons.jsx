import { Button, Flex } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import './Buttons.css';

function Navigator(){

  const navigate = useNavigate();
  const location = useLocation();

  <Flex className="button-container" gap="medium" vertical>
    <Button size="medium" type={location.pathname === "/teacher"  ? "primary" : "default"} onClick={() => navigate("/teacher")} >Profesor</Button>
    <Button size="medium" type={location.pathname === "/kids"     ? "primary" : "default"} onClick={() => navigate("/kids")}>Elev</Button>
  </Flex>
}


export default Navigator;