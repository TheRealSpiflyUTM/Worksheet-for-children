import { useState } from "react";
import { Button, Input, Modal, Popconfirm, Select, message } from "antd";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { platformApi } from "../api/platform.js";
import { usePlatform } from "./PlatformState.js";
import { EmptyPanel, ErrorNotice, PlatformPage, Resource } from "./PlatformUI.jsx";
import { useResource } from "./useResource.js";

function Status({ value }) {
  return <span className="platformStatus">{String(value || "ACTIVE").replaceAll("_", " ")}</span>;
}

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
      subtitle={teacher ? "Create a class and invite students with a code." : "Join a class with your teacher's code."}
      actions={<Button type="primary" onClick={() => setOpen(true)}>{t(teacher ? "New class" : "Join class")}</Button>}
    >
      <Resource resource={classes}>
        {(items) => items.length ? (
          <div className="platformGrid">
            {items.map((classroom) => (
              <article className="platformCard" key={classroom.id} onClick={() => navigate(`/classes/${classroom.id}`)}>
                <h2>{classroom.name}</h2>
                <p>{classroom.teacherName}</p>
                <span className="platformMuted">Open class →</span>
              </article>
            ))}
          </div>
        ) : <EmptyPanel description="No classes yet." />}
      </Resource>
      <Modal open={open} title={t(teacher ? "New class" : "Join class")} onCancel={() => setOpen(false)} footer={null}>
        <ErrorNotice error={error} />
        <Input
          autoFocus
          value={value}
          placeholder={teacher ? "Class name" : "Class code"}
          onChange={(event) => setValue(event.target.value)}
          onPressEnter={submit}
        />
        <Button block type="primary" loading={busy} onClick={submit} style={{ marginTop: 16 }}>
          {t(teacher ? "New class" : "Join class")}
        </Button>
      </Modal>
    </PlatformPage>
  );
}

export function DashboardPage() {
  const { user, t } = usePlatform();
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
      subtitle={teacher ? "Create, share and assign playful learning activities." : "Continue your activities and see your saved progress."}
    >
      <Resource resource={resource}>
        {({ worksheets, classes, assignments }) => (
          <div className="platformGrid">
            {teacher && (
              <Link className="platformCard" to="/sheets">
                <h2>{worksheets.length}</h2>
                <strong>{t("Worksheets")}</strong>
                <p className="platformMuted">Create and edit activities →</p>
              </Link>
            )}
            <Link className="platformCard" to="/classes">
              <h2>{classes.length}</h2>
              <strong>{t("Classes")}</strong>
              <p className="platformMuted">{teacher ? "Manage students and class codes" : "See your learning groups"} →</p>
            </Link>
            <Link className="platformCard" to="/assignments">
              <h2>{assignments.length}</h2>
              <strong>{t("Assignments")}</strong>
              <p className="platformMuted">Open activities and results →</p>
            </Link>
          </div>
        )}
      </Resource>
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
    <PlatformPage title={t("Account")} subtitle="Your profile and current access level.">
      <ErrorNotice error={error} />
      <section className="platformPanel platformAccount">
        <div><span className="platformMuted">Name</span><strong>{user.name}</strong></div>
        <div><span className="platformMuted">Email</span><strong>{user.email}</strong></div>
        <div><span className="platformMuted">Role</span><Status value={user.role} /></div>
        <Button danger loading={busy} onClick={logout}>{t("Log out")}</Button>
      </section>
    </PlatformPage>
  );
}

export function ClassDetailPage() {
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
      assignments: assignments.filter((assignment) => assignment.classroomId === Number(id)),
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
        <PlatformPage title={classroom.name} subtitle={`Teacher: ${classroom.teacherName}`}>
          <ErrorNotice error={error} />
          {teacher && (
            <section className="platformPanel">
              <p>{t("Class code")}</p>
              <strong className="platformCode">{classroom.joinCode}</strong>
              <div className="platformCodeActions">
                <Button onClick={() => navigator.clipboard.writeText(classroom.joinCode)}>Copy code</Button>
                <Popconfirm title="Replace this class code?" onConfirm={() => act(() => platformApi.rotateClass(id), "Class code replaced.")}>
                  <Button>Rotate code</Button>
                </Popconfirm>
              </div>
            </section>
          )}
          {teacher && <h2>{t("Members")}</h2>}
          {teacher && (members.length ? (
            <section className="platformPanel">
              {members.map((member) => (
                <div className="platformRow" key={member.userId}>
                  <div><strong>{member.name}</strong><div className="platformMuted">{member.email}</div></div>
                  <Popconfirm title="Remove this student? Their active class assignments will be revoked." onConfirm={() => act(() => platformApi.removeMember(id, member.userId), "Student removed.")}>
                    <Button danger>Remove</Button>
                  </Popconfirm>
                </div>
              ))}
            </section>
          ) : <EmptyPanel description="No students have joined yet." />)}
          <h2>{t("Assignments")}</h2>
          <AssignmentList assignments={assignments} />
        </PlatformPage>
      )}
    </Resource>
  );
}

function AssignmentList({ assignments }) {
  return assignments.length ? (
    <section className="platformPanel">
      {assignments.map((assignment) => (
        <Link className="platformRow" key={assignment.id} to={`/assignments/${assignment.id}`}>
          <div><strong>{assignment.worksheet.name}</strong><div className="platformMuted">{assignment.userName || assignment.teacherName}</div></div>
          <Status value={assignment.revokedAt ? "REVOKED" : assignment.status} />
        </Link>
      ))}
    </section>
  ) : <EmptyPanel description="No assignments yet." />;
}

export function AssignmentsPage() {
  const { user, t } = usePlatform();
  const assignments = useResource(platformApi.assignments);
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has("join"));
  const [code, setCode] = useState(() => sessionStorage.getItem("pending-worksheet-code") || "");
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
      subtitle="Worksheets assigned to students, with saved progress and results."
      actions={user.role === "USER" && <Button type="primary" onClick={() => setOpen(true)}>{t("Join worksheet")}</Button>}
    >
      <Resource resource={assignments}>{(items) => <AssignmentList assignments={items} />}</Resource>
      <Modal open={open} title={t("Join worksheet")} onCancel={() => setOpen(false)} footer={null}>
        <ErrorNotice error={error} />
        <Input value={code} placeholder={t("Worksheet code")} onChange={(event) => setCode(event.target.value)} onPressEnter={join} />
        <Button block type="primary" loading={busy} onClick={join} style={{ marginTop: 16 }}>{t("Join worksheet")}</Button>
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
      const active = history.find((attempt) => attempt.status === "IN_PROGRESS") || await platformApi.start(id, personal);
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
        const canPlay = personal || (entry.userId === user.id && !entry.revokedAt);
        return (
          <PlatformPage title={worksheet.name} subtitle={personal ? "Personal practice" : `Assigned by ${entry.teacherName}`}>
            <ErrorNotice error={error} />
            <section className="platformPanel">
              <div className="platformRow">
                <div><h2>{worksheet.items.length} activities</h2><p className="platformMuted">Completed activities stay saved when you return.</p></div>
                {canPlay && <Button type="primary" size="large" loading={busy} onClick={() => start(history)}>{t(history.some((attempt) => attempt.status === "IN_PROGRESS") ? "Continue learning" : history.length ? "Try again" : "Start learning")}</Button>}
              </div>
            </section>
            <h2>{t("History")}</h2>
            {history.length ? (
              <section className="platformPanel">
                {history.map((attempt) => (
                  <Link className="platformRow" to={`/attempts/${attempt.id}`} key={attempt.id}>
                    <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                    <Status value={attempt.status} />
                    <strong>{attempt.totalScore} / {attempt.maxScore}</strong>
                  </Link>
                ))}
              </section>
            ) : <EmptyPanel description="No attempts yet." />}
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
        (entry) => entry.worksheet.id === Number(worksheetId) && !entry.revokedAt
      );
      if (!assignment) throw error;
      return assignment.id;
    }
  }, [worksheetId]);
  return (
    <Resource resource={resource}>
      {(assignmentId) => assignmentId
        ? <Navigate to={`/assignments/${assignmentId}`} replace />
        : <AssignmentDetailPage personal />}
    </Resource>
  );
}

export function LanguageButton() {
  const { language, setLanguage, t } = usePlatform();
  return (
    <div className="platformLanguage">
      <Select
        aria-label={t("Language")}
        value={language}
        onChange={setLanguage}
        options={[{ value: "en", label: "English" }, { value: "ro", label: "Română" }]}
      />
    </div>
  );
}
