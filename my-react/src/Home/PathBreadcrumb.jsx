import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";

// items: [{ label: "Clasa", to: "/home" }, { label: "Elevi" }]
// The last item has no `to`, so it is shown as plain text (current page).
function PathBreadcrumb({ items }) {
  const breadcrumbItems = items.map(function (item) {
    return {
      key: item.label,
      title: item.to ? <Link to={item.to}>{item.label}</Link> : item.label,
    };
  });

  return <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />;
}

export default PathBreadcrumb;