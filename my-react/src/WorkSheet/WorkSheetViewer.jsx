import { useEffect, useState } from "react";
import { Alert, Card, Flex, List, Spin, Typography } from "antd";

const { Title } = Typography;

function WorkSheetViewer() {
  const [workSheets, setWorkSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function loadWorkSheets() {
      try {
        const response = await fetch("/api/worksheets");

        if (!response.ok) {
          throw new Error("Could not load worksheets");
        }

        const data = await response.json();
        setWorkSheets(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkSheets();
  }, []);

  if (isLoading) {
    return (
      <Flex justify="center" align="center">
        <Spin size="large" tip="Loading worksheets...">
          <div className="worksheetLoadingContent" />
        </Spin>
      </Flex>
    );
  }

  if (error) {
    return <Alert type="error" message="Could not load worksheets" description={error} showIcon />;
  }

  return (
    <section>
      <Title level={2}>My worksheets</Title>
      <List
        dataSource={workSheets}
        locale={{ emptyText: "No worksheets yet" }}
        renderItem={(sheet) => (
          <List.Item key={sheet.id}>
            <Card title={sheet.name} className="worksheetCard" />
          </List.Item>
        )}
      />
    </section>
  );
}

export default WorkSheetViewer;
