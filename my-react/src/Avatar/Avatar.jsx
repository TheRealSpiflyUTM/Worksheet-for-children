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
      className="avatar-top-right"
      size={48}
      icon={<UserOutlined />}
      onClick={handleAvatarClick}
    />
  );
};

export default AvatarExample;