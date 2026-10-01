import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";

export default function PathBreadcrumb({ items }) {
  return (
    <Breadcrumb
      items={items.map((item, index) => ({
        key: index,
        title: item.to ? <Link to={item.to}>{item.label}</Link> : item.label,
      }))}
      style={{ marginBottom: 16 }}
    />
  );
}
