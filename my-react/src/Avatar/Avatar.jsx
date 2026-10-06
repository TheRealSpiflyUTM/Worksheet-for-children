import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import "./Avatar.css";
import { usePlatform } from "../platform/PlatformState.js";

const AvatarExample = () => {
  const { t } = usePlatform();
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    navigate("/account");
  };

  return (
    <Avatar
      size={50}
      className="avatar-top-right"
      icon={<UserOutlined />}
      onClick={handleAvatarClick}
      role="button"
      aria-label={t("Account")}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleAvatarClick();
        }
      }}
      tabIndex={0}
    />
  );
};

export default AvatarExample;
