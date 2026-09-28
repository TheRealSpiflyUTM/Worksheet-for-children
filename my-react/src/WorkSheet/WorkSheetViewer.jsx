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
  message,
} from "antd";

import {
  createWorksheet,
  deleteWorksheet,
  getWorksheets,
  shareWorksheet,
} from "../api/worksheets.js";

import {
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

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

  // Share state
  const [sharingWorkSheetId, setSharingWorkSheetId] = useState(null);
  const [shareCode, setShareCode] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [form] = Form.useForm();

  async function loadWorkSheets() {
    setIsLoading(true);
    setError("");

    try {
      const worksheets = await getWorksheets();
      setWorkSheets(worksheets);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkSheets();
  }, []);

  async function createWorkSheet({ name }) {
    setIsCreating(true);
    setCreateError("");

    try {
      const createdWorkSheet = await createWorksheet(name);

      setWorkSheets((currentWorkSheets) => [
        createdWorkSheet,
        ...currentWorkSheets,
      ]);

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

  function openWorkSheet(workSheetId) {
    navigate(`/teacher/${workSheetId}`);
  }

  function preventCardOpen(event) {
    event.stopPropagation();
  }

  async function removeWorkSheet(workSheetId) {
    setDeletingWorkSheetId(workSheetId);
    setError("");

    try {
      await deleteWorksheet(workSheetId);

      setWorkSheets((currentWorkSheets) =>
        currentWorkSheets.filter(
          (workSheet) => workSheet.id !== workSheetId
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingWorkSheetId(null);
    }
  }

  async function handleShare(workSheetId) {
    setSharingWorkSheetId(workSheetId);

    try {
      const response = await shareWorksheet(workSheetId);

      setShareCode(response.code);
      setIsShareOpen(true);
    } catch (requestError) {
      message.error(requestError.message);
    } finally {
      setSharingWorkSheetId(null);
    }
  }

  async function copyShareCode() {
    try {
      await navigator.clipboard.writeText(shareCode);
      message.success("Code copied!");
    } catch (error) {
      console.error(error);
      message.error("Could not copy the code.");
    }
  }

  function closeShareModal() {
    setIsShareOpen(false);
    setShareCode("");
  }

  function handleWorkSheetKeyDown(event, worksheetId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWorkSheet(worksheetId);
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
        action={
          <Button size="small" onClick={loadWorkSheets}>
            Try again
          </Button>
        }
      />
    );
  }

  console.log(workSheets);

  return (
    <section aria-labelledby="worksheets-title">
      <Card>
        <Flex
          justify="space-between"
          align="center"
          gap="middle"
          wrap
        >
          <div>
            <Title
              id="worksheets-title"
              level={2}
              style={{ margin: 0 }}
            >
              My worksheets
            </Title>

            <Text type="secondary">
              Create and manage your learning activities.
            </Text>
          </div>

          <Flex gap="small">
            <Tooltip title="Refresh worksheets">
              <Button
                icon={<ReloadOutlined />}
                onClick={loadWorkSheets}
                aria-label="Refresh worksheets"
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
            >
              New worksheet
            </Button>
          </Flex>
        </Flex>

        <List
          dataSource={workSheets}
          locale={{
            emptyText:
              "No worksheets yet. Create your first worksheet to begin.",
          }}
          renderItem={(sheet) => (
            <List.Item key={sheet.id}>
              <Card
                className="worksheet-card"
                size="small"
                hoverable
                onClick={() => openWorkSheet(sheet.id)}
                onKeyDown={(event) =>
                  handleWorkSheetKeyDown(event, sheet.id)
                }
                role="button"
                tabIndex={0}
                style={{ width: "100%" }}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  gap="middle"
                >
                  <div>
                    <Title
                      level={4}
                      style={{ margin: 0 }}
                    >
                      {sheet.name}
                    </Title>

                    {sheet.updatedAt && (
                      <Text type="secondary">
                        Last updated{" "}
                        {new Date(
                          sheet.updatedAt
                        ).toLocaleString()}
                      </Text>
                    )}
                  </div>

                  <Flex gap="small">
                    <Tooltip
                      title="Share worksheet"
                      placement="top"
                      arrow={{ pointAtCenter: true }}
                    >
                      <Button
                        type="text"
                        icon={<ShareAltOutlined />}
                        aria-label={`Share ${sheet.name}`}
                        loading={
                          sharingWorkSheetId === sheet.id
                        }
                        onClick={(event) => {
                          preventCardOpen(event);
                          handleShare(sheet.id);
                        }}
                      />
                    </Tooltip>

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
                        loading={
                          deletingWorkSheetId === sheet.id
                        }
                        onClick={(event) => {
                          preventCardOpen(event);
                          removeWorkSheet(sheet.id);
                        }}
                      />
                    </Tooltip>
                  </Flex>
                </Flex>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Share worksheet"
        open={isShareOpen}
        onCancel={closeShareModal}
        footer={[
          <Button
            key="close"
            onClick={closeShareModal}
          >
            Close
          </Button>,

          <Button
            key="copy"
            type="primary"
            onClick={copyShareCode}
          >
            Copy code
          </Button>,
        ]}
      >
        <Flex
          vertical
          align="center"
          gap="middle"
          style={{ padding: "20px 0" }}
        >
          <Text type="secondary">
            Give this code to the student:
          </Text>

          <Title
            level={2}
            style={{
              margin: 0,
              letterSpacing: "4px",
            }}
          >
            {shareCode}
          </Title>

          <Text type="secondary">
            The student can enter this code to open
            your worksheet.
          </Text>
        </Flex>
      </Modal>

      <Modal
        title="Create worksheet"
        open={isCreateOpen}
        onCancel={closeCreateModal}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createWorkSheet}
        >
          <Form.Item
            label="Worksheet name"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter a worksheet name.",
              },
              {
                max: 150,
                message:
                  "Use 150 characters or fewer.",
              },
            ]}
          >
            <Input
              autoFocus
              maxLength={150}
              placeholder="For example: Animals and colours"
            />
          </Form.Item>

          {createError && (
            <Alert
              type="error"
              message={createError}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Flex justify="flex-end" gap="small">
            <Button
              onClick={closeCreateModal}
              disabled={isCreating}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
            >
              Create worksheet
            </Button>
          </Flex>
        </Form>
      </Modal>
    </section>
  );
}

export default WorkSheetViewer;
