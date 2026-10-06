import { useState } from "react";
import { Button, Input, Modal, Popconfirm, Select, message } from "antd";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { platformApi } from "../api/platform.js";
import { usePlatform } from "./PlatformState.js";
import {
  EmptyPanel,
  ErrorNotice,
  PlatformPage,
  Resource,
} from "./PlatformUI.jsx";
import { useResource } from "./useResource.js";
import ClassPage from "../Home/ClassPage.jsx";
import Status from "./StatusBadge.jsx";
import TeacherAssignments from "./TeacherAssignments.jsx";
import { ShareWorksheetModal } from "./WorksheetActions.jsx";
import {
  ReadOutlined,
  TeamOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

export function ClassesPage() {
  const { user, t } = usePlatform();
  const teacher = user.role === "TEACHER" || user.role === "ADMIN";
  const classes = useResource(platformApi.classes);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const classroom = teacher
        ? await platformApi.createClass(value.trim())
        : await platformApi.joinClass(value);
      setOpen(false);
      setValue("");
      navigate(`/classes/${classroom.id}`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformPage
      title={t("Classes")}
      actions={
        <Button type="primary" onClick={() => setOpen(true)}>
          {t(teacher ? "New class" : "Join class")}
        </Button>
      }
    >
      <Resource resource={classes}>
        {(items) =>
          items.length ? (
            <div className="platformGrid">
              {items.map((classroom) => (
                <Link
                  className="platformCard"
                  key={classroom.id}
                  to={`/classes/${classroom.id}`}
                >
                  <h2>{classroom.name}</h2>
                  <p>{classroom.teacherName}</p>
                  <span className="platformMuted">{t("Open class")} →</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel description={t("No classes yet.")} />
          )
        }
      </Resource>
      <Modal
        open={open}
        title={t(teacher ? "New class" : "Join class")}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <ErrorNotice error={error} />
        <Input
          autoFocus
          value={value}
          placeholder={teacher ? t("Class name") : t("Class code")}
          onChange={(event) => setValue(event.target.value)}
          onPressEnter={submit}
        />
        <Button
          block
          type="primary"
          loading={busy}
          onClick={submit}
          style={{ marginTop: 16 }}
        >
          {t(teacher ? "New class" : "Join class")}
        </Button>
      </Modal>
    </PlatformPage>
  );
}

export function DashboardPage() {
  const { user, t } = usePlatform();
  const [shareId, setShareId] = useState(null);
  const teacher = user.role === "TEACHER" || user.role === "ADMIN";
  const resource = useResource(async () => {
    const [worksheets, classes, assignments] = await Promise.all([
      teacher ? platformApi.worksheets() : Promise.resolve([]),
      platformApi.classes(),
      platformApi.assignments(),
    ]);
    return { worksheets, classes, assignments };
  }, [teacher]);

  return (
    <PlatformPage
      title={`${t("Welcome")}, ${user.name}!`}
      actions={
        teacher && (
          <Link className="workbookAction" to="/sheets">
            <PlusOutlined aria-hidden="true" />
            {t("Create and edit activities")}
          </Link>
        )
      }
    >
      <Resource resource={resource}>
        {({ worksheets, classes, assignments }) => (
          <div className="dashboardLayout">
            {teacher && (
              <section className="platformPanel dashboardRecent">
                <div className="dashboardSectionHeader">
                  <h2>{t("Recent worksheets")}</h2>
                  <Link to="/sheets">{t("View all worksheets")}</Link>
                </div>
                {worksheets.length ? (
                  [...worksheets]
                    .sort(
                      (a, b) =>
                        (Date.parse(b.updatedAt) || 0) -
                        (Date.parse(a.updatedAt) || 0),
                    )
                    .slice(0, 4)
                    .map((sheet) => (
                      <div key={sheet.id} className="dashboardWorksheet">
                        <Link
                          className="dashboardWorksheetLink"
                          to={`/teacher/${sheet.id}`}
                        >
                          <span className="dashboardWorksheetIcon">
                            <ReadOutlined aria-hidden="true" />
                          </span>
                          <span className="dashboardWorksheetSummary">
                            <strong>{sheet.name}</strong>
                            <span className="platformMuted">
                              {t(
                                sheet.items?.length === 1
                                  ? "{count} activity"
                                  : "{count} activities",
                                {
                                  count: sheet.items?.length || 0,
                                },
                              )}
                            </span>
                          </span>
                        </Link>
                        <Button
                          icon={<ShareAltOutlined />}
                          disabled={!sheet.items?.length}
                          aria-label={`${t("Share worksheet")}: ${sheet.name}`}
                          onClick={() => setShareId(sheet.id)}
                        >
                          {t("Share worksheet")}
                        </Button>
                      </div>
                    ))
                ) : (
                  <div className="dashboardGettingStarted">
                    <ReadOutlined aria-hidden="true" />
                    <Link className="workbookAction" to="/sheets">
                      {t("Open worksheets")}
                    </Link>
                  </div>
                )}
              </section>
            )}
            {!teacher && (
              <section className="platformPanel dashboardRecent">
                <h2>{t("Continue learning")}</h2>
                {assignments.length ? (
                  <AssignmentList assignments={assignments.slice(0, 4)} />
                ) : (
                  <EmptyPanel description={t("No assignments yet.")} />
                )}
              </section>
            )}
            <div className="dashboardShortcuts">
              {teacher && (
                <Link
                  className="platformCard dashboardShortcut dashboardShortcut--purple"
                  to="/sheets"
                >
                  <ReadOutlined aria-hidden="true" />
                  <strong>{t("Worksheets")}</strong>
                  <span className="dashboardCount">{worksheets.length}</span>
                </Link>
              )}
              <Link
                className="platformCard dashboardShortcut dashboardShortcut--blue"
                to="/classes"
              >
                <TeamOutlined aria-hidden="true" />
                <strong>{t("Classes")}</strong>
                <span className="dashboardCount">{classes.length}</span>
              </Link>
              <Link
                className="platformCard dashboardShortcut dashboardShortcut--pink"
                to="/assignments"
              >
                <ReadOutlined aria-hidden="true" />
                <strong>{t("Assignments")}</strong>
                <span className="dashboardCount">{assignments.length}</span>
              </Link>
            </div>
          </div>
        )}
      </Resource>
      <ShareWorksheetModal
        worksheetId={shareId}
        open={shareId !== null}
        onClose={() => setShareId(null)}
      />
    </PlatformPage>
  );
}

export function AccountPage() {
  const { user, setUser, t } = usePlatform();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await platformApi.logout();
      setUser(null);
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError);
      setBusy(false);
    }
  }

  return (
    <PlatformPage title={t("Account")}>
      <ErrorNotice error={error} />
      <section className="platformPanel platformAccount">
        <div>
          <span className="platformMuted">{t("Name")}</span>
          <strong>{user.name}</strong>
        </div>
        <div>
          <span className="platformMuted">{t("Email")}</span>
          <strong>{user.email}</strong>
        </div>
        <div>
          <span className="platformMuted">{t("Role")}</span>
          <Status value={user.role} />
        </div>
        <Button danger loading={busy} onClick={logout}>
          {t("Log out")}
        </Button>
      </section>
    </PlatformPage>
  );
}

export function ClassDetailPage() {
  const { user } = usePlatform();
  return user.role === "TEACHER" ? <ClassPage /> : <JoinedClassDetailPage />;
}

function JoinedClassDetailPage() {
  const { id } = useParams();
  const { user, t } = usePlatform();
  const teacher = user.role === "TEACHER" || user.role === "ADMIN";
  const [error, setError] = useState(null);
  const resource = useResource(async () => {
    const [classroom, members, assignments] = await Promise.all([
      platformApi.classroom(id),
      teacher ? platformApi.members(id) : Promise.resolve([]),
      platformApi.assignments(),
    ]);
    return {
      classroom,
      members,
      assignments: assignments.filter(
        (assignment) => assignment.classroomId === Number(id),
      ),
    };
  }, [id, teacher]);

  async function act(action, success) {
    setError(null);
    try {
      await action();
      message.success(success);
      resource.reload();
    } catch (requestError) {
      setError(requestError);
    }
  }

  return (
    <Resource resource={resource}>
      {({ classroom, members, assignments }) => (
        <PlatformPage
          title={classroom.name}
          subtitle={t("Teacher: {name}", { name: classroom.teacherName })}
        >
          <ErrorNotice error={error} />
          {teacher && (
            <section className="platformPanel">
              <p>{t("Class code")}</p>
              <strong className="platformCode">{classroom.joinCode}</strong>
              <div className="platformCodeActions">
                <Button
                  onClick={() =>
                    navigator.clipboard.writeText(classroom.joinCode)
                  }
                >
                  {t("Copy code")}
                </Button>
                <Popconfirm
                  title={t("Replace this class code?")}
                  onConfirm={() =>
                    act(
                      () => platformApi.rotateClass(id),
                      t("Class code replaced."),
                    )
                  }
                >
                  <Button>{t("Rotate code")}</Button>
                </Popconfirm>
              </div>
            </section>
          )}
          {teacher && <h2>{t("Members")}</h2>}
          {teacher &&
            (members.length ? (
              <section className="platformPanel">
                {members.map((member) => (
                  <div className="platformRow" key={member.userId}>
                    <div>
                      <strong>{member.name}</strong>
                      <div className="platformMuted">{member.email}</div>
                    </div>
                    <Popconfirm
                      title={t(
                        "Remove this student? Their active class assignments will be revoked.",
                      )}
                      onConfirm={() =>
                        act(
                          () => platformApi.removeMember(id, member.userId),
                          t("Student removed."),
                        )
                      }
                    >
                      <Button danger>{t("Remove")}</Button>
                    </Popconfirm>
                  </div>
                ))}
              </section>
            ) : (
              <EmptyPanel description={t("No students have joined yet.")} />
            ))}
          <h2>{t("Assignments")}</h2>
          <AssignmentList assignments={assignments} />
        </PlatformPage>
      )}
    </Resource>
  );
}

function AssignmentList({ assignments }) {
  const { t } = usePlatform();
  return assignments.length ? (
    <section className="platformPanel">
      {assignments.map((assignment) => (
        <Link
          className="platformRow"
          key={assignment.id}
          to={`/assignments/${assignment.id}`}
        >
          <div>
            <strong>{assignment.worksheet.name}</strong>
            <div className="platformMuted">
              {assignment.userName || assignment.teacherName}
            </div>
          </div>
          <Status
            value={assignment.revokedAt ? "REVOKED" : assignment.status}
          />
        </Link>
      ))}
    </section>
  ) : (
    <EmptyPanel description={t("No assignments yet.")} />
  );
}

export function AssignmentsPage() {
  const { user } = usePlatform();
  return user.role === "TEACHER" ? (
    <TeacherAssignments />
  ) : (
    <StudentAssignmentsPage />
  );
}

function StudentAssignmentsPage() {
  const { user, t } = usePlatform();
  const assignments = useResource(platformApi.assignments);
  const [open, setOpen] = useState(() =>
    new URLSearchParams(location.search).has("join"),
  );
  const [code, setCode] = useState(
    () => sessionStorage.getItem("pending-worksheet-code") || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const result = await platformApi.joinWorksheet(code);
      sessionStorage.removeItem("pending-worksheet-code");
      navigate(`/assignments/${result.assignmentId}`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformPage
      title={t("Assignments")}
      actions={
        user.role === "USER" && (
          <Button type="primary" onClick={() => setOpen(true)}>
            {t("Join worksheet")}
          </Button>
        )
      }
    >
      <Resource resource={assignments}>
        {(items) => <AssignmentList assignments={items} />}
      </Resource>
      <Modal
        open={open}
        title={t("Join worksheet")}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <ErrorNotice error={error} />
        <Input
          value={code}
          placeholder={t("Worksheet code")}
          onChange={(event) => setCode(event.target.value)}
          onPressEnter={join}
        />
        <Button
          block
          type="primary"
          loading={busy}
          onClick={join}
          style={{ marginTop: 16 }}
        >
          {t("Join worksheet")}
        </Button>
      </Modal>
    </PlatformPage>
  );
}

export function AssignmentDetailPage({ personal = false }) {
  const params = useParams();
  const id = params.id || params.worksheetId;
  const { user, t } = usePlatform();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const resource = useResource(async () => {
    const [entry, history] = await Promise.all([
      personal ? platformApi.worksheet(id) : platformApi.assignment(id),
      platformApi.history(id, personal),
    ]);
    return { entry, history };
  }, [id, personal]);

  async function start(history) {
    setBusy(true);
    setError(null);
    try {
      const active =
        history.find((attempt) => attempt.status === "IN_PROGRESS") ||
        (await platformApi.start(id, personal));
      navigate(`/attempts/${active.id}`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Resource resource={resource}>
      {({ entry, history }) => {
        const worksheet = personal ? entry : entry.worksheet;
        const canPlay =
          personal || (entry.userId === user.id && !entry.revokedAt);
        return (
          <PlatformPage
            title={worksheet.name}
            subtitle={
              personal
                ? t("Personal practice")
                : t("Assigned by {name}", { name: entry.teacherName })
            }
          >
            <ErrorNotice error={error} />
            <section className="platformPanel">
              <div className="platformRow">
                <div>
                  <h2>
                    {t("{count} activities", { count: worksheet.items.length })}
                  </h2>
                  <p className="platformMuted">
                    {t("Completed activities stay saved when you return.")}
                  </p>
                </div>
                {canPlay && (
                  <Button
                    type="primary"
                    size="large"
                    loading={busy}
                    onClick={() => start(history)}
                  >
                    {t(
                      history.some(
                        (attempt) => attempt.status === "IN_PROGRESS",
                      )
                        ? "Continue learning"
                        : history.length
                          ? "Try again"
                          : "Start learning",
                    )}
                  </Button>
                )}
              </div>
            </section>
            <h2>{t("History")}</h2>
            {history.length ? (
              <section className="platformPanel">
                {history.map((attempt) => (
                  <Link
                    className="platformRow"
                    to={`/attempts/${attempt.id}`}
                    key={attempt.id}
                  >
                    <span>
                      {new Date(attempt.startedAt).toLocaleDateString()}
                    </span>
                    <Status value={attempt.status} />
                    <strong>
                      {attempt.totalScore} / {attempt.maxScore}
                    </strong>
                  </Link>
                ))}
              </section>
            ) : (
              <EmptyPanel description={t("No attempts yet.")} />
            )}
          </PlatformPage>
        );
      }}
    </Resource>
  );
}

export function LegacyWorksheetEntry() {
  const { worksheetId } = useParams();
  const resource = useResource(async () => {
    try {
      await platformApi.worksheet(worksheetId);
      return null;
    } catch (error) {
      if (error.status !== 404) throw error;
      const assignments = await platformApi.assignments();
      const assignment = assignments.find(
        (entry) =>
          entry.worksheet.id === Number(worksheetId) && !entry.revokedAt,
      );
      if (!assignment) throw error;
      return assignment.id;
    }
  }, [worksheetId]);
  return (
    <Resource resource={resource}>
      {(assignmentId) =>
        assignmentId ? (
          <Navigate to={`/assignments/${assignmentId}`} replace />
        ) : (
          <AssignmentDetailPage personal />
        )
      }
    </Resource>
  );
}

export function LanguageButton({ inline = false }) {
  const { language, setLanguage, t } = usePlatform();
  return (
    <div
      className={`platformLanguage${inline ? " platformLanguage--inline" : ""}`}
    >
      <Select
        aria-label={t("Language")}
        value={language}
        onChange={setLanguage}
        options={[
          { value: "en", label: "English" },
          { value: "ro", label: "Română" },
        ]}
      />
    </div>
  );
}
