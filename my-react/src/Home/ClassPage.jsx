import { usePlatform } from "../platform/PlatformState.js";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Typography,
  message,
} from "antd";
import { platformApi } from "../api/platform.js";
import { useResource } from "../platform/useResource.js";
import { EmptyPanel, ErrorNotice, Resource } from "../platform/PlatformUI.jsx";
import PathBreadcrumb from "./PathBreadcrumb.jsx";
import "./Menu.css";
import "./Classpage.css";

const percent = (value) => (value == null ? "—" : `${value}%`);

export default function ClassPage() {
  const { t } = usePlatform();
  const { id } = useParams();
  const resource = useResource(async () => {
    const [classroom, students, worksheets] = await Promise.all([
      platformApi.classroom(id),
      platformApi.members(id),
      platformApi.worksheets(),
    ]);
    return { classroom, students, worksheets };
  }, [id]);
  const [editor, setEditor] = useState(null);
  const [name, setName] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [testCode, setTestCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function edit(student = {}) {
    setError(null);
    setName(student.name || "");
    setEditor(student);
  }

  async function saveStudent() {
    if (busy) return;
    if (!name.trim()) {
      setError(new Error(t("Enter the student's name.")));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editor.userId)
        await platformApi.renameStudent(id, editor.userId, name.trim());
      else await platformApi.addStudent(id, name.trim());
      setEditor(null);
      resource.reload();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent(student) {
    setError(null);
    try {
      await platformApi.removeMember(id, student.userId);
      resource.reload();
    } catch (requestError) {
      setError(requestError);
    }
  }

  async function startTest(worksheet) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await platformApi.startClassTest(id, worksheet.id);
      setTestCode({ name: worksheet.name, code: result.code });
      setTestOpen(false);
      resource.reload();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function issueCode(student) {
    setError(null);
    try {
      await platformApi.issueStudentCode(id, student.userId);
      resource.reload();
    } catch (requestError) {
      setError(requestError);
    }
  }

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      message.success(t("Code copied!"));
    } catch {
      message.error(t("Could not copy the code. You can select it manually."));
    }
  }

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[
          { label: t("Classes"), to: "/classes" },
          { label: t("Members") },
        ]}
      />
      <Resource resource={resource}>
        {({ classroom, students, worksheets }) => (
          <>
            <section className="platformPanel">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <Typography.Title level={2} style={{ margin: 0 }}>
                  {classroom.name}
                </Typography.Title>
                <Flex gap="small" wrap>
                  <Button
                    onClick={() => {
                      setError(null);
                      setSearch("");
                      setTestOpen(true);
                    }}
                  >
                    {t("Start a test")}{" "}
                  </Button>
                  <Button type="primary" onClick={() => edit()}>
                    {t("Add student")}{" "}
                  </Button>
                </Flex>
              </Flex>
              {!editor && !testOpen && <ErrorNotice error={error} />}
              {testCode && (
                <div className="class-test-code">
                  <strong>{testCode.name}</strong>
                  <p>
                    {t("Worksheet code")}:{" "}
                    <strong className="platformCode">{testCode.code}</strong>
                  </p>
                  <p>
                    {t(
                      "Each child uses their own code and this code to start.",
                    )}{" "}
                  </p>
                  <Button onClick={() => copy(testCode.code)}>
                    {t("Copy worksheet code")}{" "}
                  </Button>
                </div>
              )}
              {students.length ? (
                <>
                  <div className="student-grid student-head">
                    <span>{t("Name / code")}</span>
                    <span>{t("Last test")}</span>
                    <span>{t("Average")}</span>
                    <span>{t("Lowest scoring test")}</span>
                    <span>{t("Actions")}</span>
                  </div>
                  {[...students]
                    .sort((a, b) => a.name.localeCompare(b.name, "ro"))
                    .map((student) => (
                      <Card
                        className="student-block"
                        size="small"
                        key={student.userId}
                      >
                        <div className="student-grid">
                          <div>
                            <Link
                              className="student-name-button"
                              to={`/classes/${id}/children/${student.userId}`}
                            >
                              {student.name}
                            </Link>
                            {student.studentCode && (
                              <div className="student-access-code">
                                <code>{student.studentCode}</code>
                                <Button
                                  size="small"
                                  onClick={() => copy(student.studentCode)}
                                  aria-label={t("Copy {name}'s code", {
                                    name: student.name,
                                  })}
                                >
                                  {t("Copy")}{" "}
                                </Button>
                              </div>
                            )}
                          </div>
                          <span
                            className="student-metric"
                            data-label={t("Last test")}
                          >
                            {percent(student.lastTestPercent)}
                          </span>
                          <span
                            className="student-metric"
                            data-label={t("Average")}
                          >
                            {percent(student.averagePercent)}
                          </span>
                          <span
                            className="student-metric"
                            data-label={t("Lowest scoring test")}
                          >
                            {student.worstTest || "—"}
                          </span>
                          <Flex gap="small" wrap>
                            {student.email == null && (
                              <Button
                                size="small"
                                onClick={() => edit(student)}
                              >
                                {t("Rename")}{" "}
                              </Button>
                            )}
                            {!student.studentCode && (
                              <Button
                                size="small"
                                onClick={() => issueCode(student)}
                              >
                                {t("Generate code")}{" "}
                              </Button>
                            )}
                            <Popconfirm
                              title={t("Remove the student from this class?")}
                              description={t(
                                "Test access will be revoked. Results remain saved.",
                              )}
                              onConfirm={() => removeStudent(student)}
                            >
                              <Button size="small" danger>
                                {t("Delete")}{" "}
                              </Button>
                            </Popconfirm>
                          </Flex>
                        </div>
                      </Card>
                    ))}
                </>
              ) : (
                <EmptyPanel
                  description={t(
                    "No students in this class. Add your first student.",
                  )}
                />
              )}
            </section>
            <Modal
              title={editor?.userId ? t("Rename student") : t("New student")}
              open={editor !== null}
              onCancel={() => !busy && setEditor(null)}
              onOk={saveStudent}
              confirmLoading={busy}
              okText={t("Save")}
              cancelText={t("Cancel")}
            >
              <ErrorNotice error={error} />
              <Input
                autoFocus
                maxLength={100}
                aria-label={t("Student name")}
                placeholder={t("Student name")}
                value={name}
                disabled={busy}
                onChange={(event) => setName(event.target.value)}
                onPressEnter={saveStudent}
              />
            </Modal>
            <Modal
              title={t("Start a test")}
              open={testOpen}
              onCancel={() => !busy && setTestOpen(false)}
              footer={null}
            >
              <ErrorNotice error={error} />
              <Input.Search
                aria-label={t("Search for a test")}
                placeholder={t("Search for a test")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                allowClear
              />
              <Flex vertical gap="small" style={{ marginTop: 16 }}>
                {worksheets
                  .filter((worksheet) =>
                    worksheet.name
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  )
                  .map((worksheet) => (
                    <Button
                      key={worksheet.id}
                      disabled={
                        busy || !students.length || !worksheet.items.length
                      }
                      onClick={() => startTest(worksheet)}
                    >
                      {worksheet.name}
                      {!worksheet.items.length && " " + t("(no questions)")}
                    </Button>
                  ))}
                {!worksheets.length && (
                  <EmptyPanel description={t("Create a worksheet first.")} />
                )}
                {!students.length && (
                  <p>{t("Add students before starting a test.")}</p>
                )}
              </Flex>
            </Modal>
          </>
        )}
      </Resource>
    </section>
  );
}
