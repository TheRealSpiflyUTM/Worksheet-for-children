import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { CloseOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./WorkSheetViewer.css";

const { Text, Title } = Typography;

function WorkSheetViewer() {
  const navigate = useNavigate();
  const [workSheets, setWorkSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingWorkSheetId, setDeletingWorkSheetId] = useState(null);
  const [form] = Form.useForm();

  async function loadWorkSheets() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/worksheets");

      if (!response.ok) {
        throw new Error("Could not load worksheets");
      }

      setWorkSheets(await response.json());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialWorkSheets() {
      try {
        const response = await fetch("/api/worksheets");

        if (!response.ok) {
          throw new Error("Could not load worksheets");
        }

        const data = await response.json();
        if (isCurrent) setWorkSheets(data);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadInitialWorkSheets();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function createWorkSheet({ name }) {
    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Could not create the worksheet");
      }

      const createdWorkSheet = await response.json();
      setWorkSheets((currentWorkSheets) => [createdWorkSheet, ...currentWorkSheets]);
      form.resetFields();
      setIsCreateOpen(false);
    } catch (requestError) {
      setCreateError(requestError.message);
    } finally {
      setIsCreating(false);
    }
  }

  function closeCreateModal() {
    if (isCreating) return;

    form.resetFields();
    setCreateError("");
    setIsCreateOpen(false);
  }

  function openWorkSheet() {
    navigate("/teacher");
  }

  function preventCardOpen(event) {
    event.stopPropagation();
  }

  async function removeWorkSheet(workSheetId) {
    setDeletingWorkSheetId(workSheetId);

    try {
      const response = await fetch(`/api/worksheets/${workSheetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete the worksheet");
      }

      setWorkSheets((currentWorkSheets) => (
        currentWorkSheets.filter((workSheet) => workSheet.id !== workSheetId)
      ));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingWorkSheetId(null);
    }
  }

  function handleWorkSheetKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWorkSheet();
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 240 }}>
        <Spin size="large" tip="Loading worksheets...">
          <div className="worksheetLoadingContent" />
        </Spin>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Could not load worksheets"
        description={error}
        showIcon
        action={<Button size="small" onClick={loadWorkSheets}>Try again</Button>}
      />
    );
  }

  console.log(workSheets);


  return (
    <section aria-labelledby="worksheets-title">
      <Card>
        <Flex justify="space-between" align="center" gap="middle" wrap>
          <div>
            <Title id="worksheets-title" level={2} style={{ margin: 0 }}>
              My worksheets
            </Title>
            <Text type="secondary">Create and manage your learning activities.</Text>
          </div>

          <Flex gap="small">
            <Tooltip title="Refresh worksheets">
              <Button icon={<ReloadOutlined />} onClick={loadWorkSheets} aria-label="Refresh worksheets" />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
              New worksheet
            </Button>
          </Flex>
        </Flex>

        <List
          dataSource={workSheets}
          locale={{ emptyText: "No worksheets yet. Create your first worksheet to begin." }}
          renderItem={(sheet) => (
            <List.Item key={sheet.id}>
              <Card
                className="worksheet-card"
                size="small"
                hoverable
                onClick={openWorkSheet}
                onKeyDown={handleWorkSheetKeyDown}
                role="button"
                tabIndex={0}
                style={{ width: "100%" }}
              >
                <Flex justify="space-between" align="center" gap="middle">
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{sheet.name}</Title>
                    {sheet.updatedAt && (
                      <Text type="secondary">
                        Last updated {new Date(sheet.updatedAt).toLocaleString()}
                      </Text>
                    )}
                  </div>

                  <Tooltip
                    title="Delete worksheet"
                    placement="top"
                    arrow={{ pointAtCenter: true }}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<CloseOutlined />}
                      aria-label={`Delete ${sheet.name}`}
                      loading={deletingWorkSheetId === sheet.id}
                      onClick={(event) => {
                        preventCardOpen(event);
                        removeWorkSheet(sheet.id);
                      }}
                    />
                  </Tooltip>
                </Flex>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Create worksheet"
        open={isCreateOpen}
        onCancel={closeCreateModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={createWorkSheet}>
          <Form.Item
            label="Worksheet name"
            name="name"
            rules={[
              { required: true, whitespace: true, message: "Enter a worksheet name." },
              { max: 150, message: "Use 150 characters or fewer." },
            ]}
          >
            <Input autoFocus maxLength={150} placeholder="For example: Animals and colours" />
          </Form.Item>

          {createError && <Alert type="error" message={createError} showIcon style={{ marginBottom: 16 }} />}

          <Flex justify="flex-end" gap="small">
            <Button onClick={closeCreateModal} disabled={isCreating}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isCreating}>Create worksheet</Button>
          </Flex>
        </Form>
      </Modal>
    </section>
  );
}

export default WorkSheetViewer;
