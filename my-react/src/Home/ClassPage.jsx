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
      setError(new Error("Scrie numele elevului."));
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
      message.success("Cod copiat");
    } catch {
      message.error("Nu s-a putut copia codul. Îl poți selecta manual.");
    }
  }

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[{ label: "Clase", to: "/classes" }, { label: "Elevi" }]}
      />
      <Resource resource={resource}>
        {({ classroom, students, worksheets }) => (
          <>
            <Card>
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
                    Începe un test
                  </Button>
                  <Button type="primary" onClick={() => edit()}>
                    Adaugă elev
                  </Button>
                </Flex>
              </Flex>
              {!editor && !testOpen && <ErrorNotice error={error} />}
              {testCode && (
                <div className="class-test-code">
                  <strong>{testCode.name}</strong>
                  <p>
                    Codul fișei:{" "}
                    <strong className="platformCode">{testCode.code}</strong>
                  </p>
                  <p>
                    Fiecare copil folosește codul său și acest cod pentru a
                    începe.
                  </p>
                  <Button onClick={() => copy(testCode.code)}>
                    Copiază codul fișei
                  </Button>
                </div>
              )}
              {students.length ? (
                <>
                  <div className="student-grid student-head">
                    <span>Nume / cod</span>
                    <span>Ultimul test</span>
                    <span>Media</span>
                    <span>Cel mai slab test</span>
                    <span>Acțiuni</span>
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
                                  aria-label={`Copiază codul lui ${student.name}`}
                                >
                                  Copiază
                                </Button>
                              </div>
                            )}
                          </div>
                          <span
                            className="student-metric"
                            data-label="Ultimul test"
                          >
                            {percent(student.lastTestPercent)}
                          </span>
                          <span className="student-metric" data-label="Media">
                            {percent(student.averagePercent)}
                          </span>
                          <span
                            className="student-metric"
                            data-label="Cel mai slab test"
                          >
                            {student.worstTest || "—"}
                          </span>
                          <Flex gap="small" wrap>
                            {student.email == null && (
                              <Button
                                size="small"
                                onClick={() => edit(student)}
                              >
                                Redenumește
                              </Button>
                            )}
                            {!student.studentCode && (
                              <Button
                                size="small"
                                onClick={() => issueCode(student)}
                              >
                                Generează cod
                              </Button>
                            )}
                            <Popconfirm
                              title="Ștergi elevul din clasă?"
                              description="Accesul la teste va fi revocat. Rezultatele rămân salvate."
                              onConfirm={() => removeStudent(student)}
                            >
                              <Button size="small" danger>
                                Șterge
                              </Button>
                            </Popconfirm>
                          </Flex>
                        </div>
                      </Card>
                    ))}
                </>
              ) : (
                <EmptyPanel description="Nu sunt elevi în clasă. Adaugă primul elev." />
              )}
            </Card>
            <Modal
              title={editor?.userId ? "Redenumește elevul" : "Elev nou"}
              open={editor !== null}
              onCancel={() => !busy && setEditor(null)}
              onOk={saveStudent}
              confirmLoading={busy}
              okText="Salvează"
              cancelText="Anulează"
            >
              <ErrorNotice error={error} />
              <Input
                autoFocus
                maxLength={100}
                aria-label="Numele elevului"
                placeholder="Numele elevului"
                value={name}
                disabled={busy}
                onChange={(event) => setName(event.target.value)}
                onPressEnter={saveStudent}
              />
            </Modal>
            <Modal
              title="Începe un test"
              open={testOpen}
              onCancel={() => !busy && setTestOpen(false)}
              footer={null}
            >
              <ErrorNotice error={error} />
              <Input.Search
                aria-label="Caută un test"
                placeholder="Caută un test"
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
                      {!worksheet.items.length && " (fără întrebări)"}
                    </Button>
                  ))}
                {!worksheets.length && (
                  <EmptyPanel description="Creează mai întâi o fișă de lucru." />
                )}
                {!students.length && (
                  <p>Adaugă elevi înainte de a începe testul.</p>
                )}
              </Flex>
            </Modal>
          </>
        )}
      </Resource>
    </section>
  );
}
