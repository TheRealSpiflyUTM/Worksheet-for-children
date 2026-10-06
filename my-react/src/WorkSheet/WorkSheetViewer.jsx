import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  createWorksheet,
  deleteWorksheet,
  getWorksheets,
} from "../api/worksheets.js";
import { usePlatform } from "../platform/PlatformState.js";
import { PlatformPage, Resource } from "../platform/PlatformUI.jsx";
import { useResource } from "../platform/useResource.js";
import { ShareWorksheetModal } from "../platform/WorksheetActions.jsx";
import "./WorkSheetViewer.css";

const { Text } = Typography;

export default function WorkSheetViewer() {
  const { t, language } = usePlatform();
  const navigate = useNavigate();
  const resource = useResource(getWorksheets);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [form] = Form.useForm();

  async function create(values) {
    setCreating(true);
    setCreateError(null);
    try {
      const worksheet = await createWorksheet(values.name.trim());
      form.resetFields();
      setCreateOpen(false);
      navigate(`/teacher/${worksheet.id}`);
    } catch (requestError) {
      setCreateError(requestError);
    } finally {
      setCreating(false);
    }
  }

  async function remove(id) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWorksheet(id);
      resource.setData(resource.data.filter((sheet) => sheet.id !== id));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setDeletingId(null);
    }
  }

  function closeCreate() {
    if (creating) return;
    form.resetFields();
    setCreateError(null);
    setCreateOpen(false);
  }

  return (
    <PlatformPage
      title={t("My worksheets")}
      actions={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          {t("New worksheet")}
        </Button>
      }
    >
      <section className="platformPanel">
        {error && <Alert type="error" showIcon title={t(error.message)} />}
        <Resource resource={resource}>
          {(sheets) => (
            <List
              dataSource={sheets}
              locale={{
                emptyText: t(
                  "No worksheets yet. Create your first worksheet to begin.",
                ),
              }}
              renderItem={(sheet) => (
                <List.Item key={sheet.id}>
                  <Card
                    className="worksheet-card"
                    size="small"
                    style={{ width: "100%" }}
                    onClick={(event) => {
                      if (
                        event.target.closest("button, [data-worksheet-actions]")
                      )
                        return;
                      navigate(`/teacher/${sheet.id}`);
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      gap="middle"
                      wrap
                    >
                      <div className="worksheetSummary">
                        <Button
                          type="link"
                          className="worksheetOpenButton"
                          onClick={() => navigate(`/teacher/${sheet.id}`)}
                        >
                          {sheet.name}
                        </Button>
                        {sheet.updatedAt && (
                          <div>
                            <Text type="secondary">
                              {t("Last updated {date}", {
                                date: new Date(sheet.updatedAt).toLocaleString(
                                  language === "ro" ? "ro-RO" : "en-GB",
                                ),
                              })}
                            </Text>
                          </div>
                        )}
                        <Text
                          type="secondary"
                          className="worksheetActivityCount"
                        >
                          {t(
                            sheet.items?.length === 1
                              ? "{count} activity"
                              : "{count} activities",
                            {
                              count: sheet.items?.length || 0,
                            },
                          )}
                        </Text>
                      </div>
                      <Flex
                        gap="small"
                        data-worksheet-actions
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          icon={<ShareAltOutlined />}
                          disabled={!sheet.items?.length}
                          aria-label={t("Share worksheet") + ": " + sheet.name}
                          onClick={() => setShareId(sheet.id)}
                        >
                          {t("Share worksheet")}
                        </Button>
                        <Popconfirm
                          title={t("Delete this worksheet?")}
                          description={t(
                            "This removes the editable worksheet. This action cannot be undone.",
                          )}
                          okText={t("Delete")}
                          cancelText={t("Cancel")}
                          onConfirm={() => remove(sheet.id)}
                        >
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            disabled={deletingId !== null}
                            loading={deletingId === sheet.id}
                            aria-label={
                              t("Delete worksheet") + ": " + sheet.name
                            }
                          />
                        </Popconfirm>
                      </Flex>
                    </Flex>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Resource>
      </section>
      <ShareWorksheetModal
        worksheetId={shareId}
        open={shareId !== null}
        onClose={() => setShareId(null)}
      />
      <Modal
        title={t("Create worksheet")}
        open={createOpen}
        onCancel={closeCreate}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item
            label={t("Worksheet name")}
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("Enter a worksheet name."),
              },
              { max: 150, message: t("Use 150 characters or fewer.") },
            ]}
          >
            <Input
              autoFocus
              maxLength={150}
              disabled={creating}
              placeholder={t("For example: Animals and colours")}
            />
          </Form.Item>
          {createError && (
            <Alert type="error" showIcon title={t(createError.message)} />
          )}
          <Flex justify="flex-end" gap="small">
            <Button disabled={creating} onClick={closeCreate}>
              {t("Cancel")}
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              {t("Create worksheet")}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </PlatformPage>
  );
}
