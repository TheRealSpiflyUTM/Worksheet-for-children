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
  renameWorksheet,
  shareWorksheet,
} from "../api/worksheets.js";

import {
  CloseOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { clickSoftSound } from "@/lib/click-soft";
import { playSound } from "@/lib/sound-engine";
import "./WorkSheetViewer.css";
import { platformApi } from "../api/platform.js";
import { AssignWorksheetModal } from "../platform/WorksheetActions.jsx";

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
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");

  // Share state
  const [sharingWorkSheetId, setSharingWorkSheetId] = useState(null);
  const [shareCode, setShareCode] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeShareWorksheetId, setActiveShareWorksheetId] = useState(null);
  const [assignWorksheetId, setAssignWorksheetId] = useState(null);

  
  // Helper Functions
  function playClick() {
  void playSound(clickSoftSound.dataUri);
  }

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
    void Promise.resolve().then(loadWorkSheets);
  }, []);

  async function createWorkSheet({ name }) {
    setIsCreating(true);
    setCreateError("");

    try {
      const createdWorkSheet = await createWorksheet(name);

      setWorkSheets((currentWorkSheets) =>{ 
        
        return([createdWorkSheet, ...currentWorkSheets]);
      });

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

  function openRename(sheet) {
    setRenameTarget(sheet);
    setRenameValue(sheet.name);
    setRenameError("");
  }

  function closeRename() {
    if (isRenaming) return;
    setRenameTarget(null);
    setRenameValue("");
    setRenameError("");
  }

  async function submitRename() {
    const name = renameValue.trim();
    if (!renameTarget || !name) {
      setRenameError("Enter a worksheet name.");
      return;
    }
    setIsRenaming(true);
    setRenameError("");
    try {
      const updated = await renameWorksheet(renameTarget.id, name);
      setWorkSheets((current) => current.map((sheet) => sheet.id === updated.id ? updated : sheet));
      closeRename();
      setRenameTarget(null);
      setRenameValue("");
      message.success("Worksheet renamed.");
    } catch (requestError) {
      setRenameError(requestError.message);
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleShare(workSheetId) {
    setSharingWorkSheetId(workSheetId);

    try {
      const response = await shareWorksheet(workSheetId);

      setShareCode(response.code);
      setActiveShareWorksheetId(workSheetId);
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
    setActiveShareWorksheetId(null);
  }

  async function rotateShareCode() {
    if (!activeShareWorksheetId) return;
    setSharingWorkSheetId(activeShareWorksheetId);
    try {
      const response = await platformApi.share(activeShareWorksheetId, true);
      setShareCode(response.shareCode || response.code);
      message.success("The latest worksheet snapshot is now published.");
    } catch (requestError) {
      message.error(requestError.message);
    } finally {
      setSharingWorkSheetId(null);
    }
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
            <Button type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setIsCreateOpen(true);
                playClick();
                }}

            >
              New worksheet
            </Button>
          </Flex>
        </Flex>

        <Input.Search
          allowClear
          aria-label="Search worksheets"
          placeholder="Search worksheets"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 420, marginTop: 20 }}
        />

        <List
          dataSource={workSheets.filter((sheet) => sheet.name.toLowerCase().includes(search.trim().toLowerCase()))}
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
                    <Tooltip title="Rename worksheet">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        aria-label={`Rename ${sheet.name}`}
                        onClick={(event) => {
                          preventCardOpen(event);
                          openRename(sheet);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Assign worksheet">
                      <Button
                        type="text"
                        icon={<UsergroupAddOutlined />}
                        aria-label={`Assign ${sheet.name}`}
                        onClick={(event) => {
                          preventCardOpen(event);
                          setAssignWorksheetId(sheet.id);
                        }}
                      />
                    </Tooltip>
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
            This code opens the currently published worksheet snapshot.
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
            Later edits do not change this code until you publish the latest snapshot.
          </Text>

          <Button
            loading={sharingWorkSheetId === activeShareWorksheetId}
            onClick={rotateShareCode}
          >
            Publish latest and replace code
          </Button>
        </Flex>
      </Modal>

      <AssignWorksheetModal
        worksheetId={assignWorksheetId}
        open={Boolean(assignWorksheetId)}
        onClose={() => setAssignWorksheetId(null)}
      />

      <Modal
        title="Rename worksheet"
        open={Boolean(renameTarget)}
        onCancel={closeRename}
        confirmLoading={isRenaming}
        okText="Save name"
        onOk={submitRename}
      >
        <Input
          autoFocus
          maxLength={150}
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={submitRename}
        />
        {renameError && <Alert type="error" message={renameError} showIcon style={{ marginTop: 12 }} />}
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
