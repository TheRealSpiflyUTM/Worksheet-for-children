import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Avatar.css';

const AvatarExample = () => {
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    navigate('/auth');
  };

  return (
    <Avatar
      size={50}
      className="avatar-top-right"
      icon={<UserOutlined />}
      
    />
  );
};

export default AvatarExample;