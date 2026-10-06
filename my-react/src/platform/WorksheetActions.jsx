import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Typography,
  message,
} from "antd";
import { platformApi } from "../api/platform.js";
import { usePlatform } from "./PlatformState.js";

export function ShareWorksheetModal({ worksheetId, open, onClose }) {
  // Remount for each worksheet so a previous worksheet's code is never displayed.
  return open ? (
    <ShareWorksheetContent
      key={worksheetId}
      worksheetId={worksheetId}
      onClose={onClose}
    />
  ) : null;
}

function ShareWorksheetContent({ worksheetId, onClose }) {
  const { t } = usePlatform();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!worksheetId) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return;
        setLoading(true);
        setError(null);
        return platformApi.share(worksheetId);
      })
      .then(
        (result) => active && setCode(result.shareCode || result.code),
        (requestError) => active && setError(requestError),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [worksheetId]);

  async function rotate() {
    setLoading(true);
    setError(null);
    try {
      const result = await platformApi.share(worksheetId, true);
      setCode(result.shareCode || result.code);
      message.success(t("The latest worksheet version is published."));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      message.success(t("Code copied!"));
    } catch {
      message.error(t("Could not copy the code. You can select it manually."));
    }
  }

  return (
    <Modal open title={t("Share worksheet")} onCancel={onClose} footer={null}>
      {error && <Alert type="error" showIcon title={t(error.message)} />}
      <p>
        {t(
          "This code opens a saved version. Later edits do not change what children receive.",
        )}
      </p>
      <Typography.Title className="platformCode" level={2}>
        {loading ? t("Loading code…") : code}
      </Typography.Title>
      <div className="platformActions">
        <Button disabled={!code || loading} onClick={copy}>
          {t("Copy code")}
        </Button>
        <Popconfirm
          title={t("Replace the worksheet code?")}
          description={t(
            "The old code will stop working. Existing assignments keep their original version.",
          )}
          okText={t("Publish latest and replace code")}
          cancelText={t("Cancel")}
          onConfirm={rotate}
        >
          <Button type="primary" disabled={!code} loading={loading}>
            {t("Publish latest and replace code")}
          </Button>
        </Popconfirm>
      </div>
      <p className="platformMuted">
        {t("Give each child their personal code and this worksheet code.")}
      </p>
    </Modal>
  );
}

export function AssignWorksheetModal({ worksheetId, open, onClose }) {
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [classId, setClassId] = useState(null);
  const [studentId, setStudentId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    Promise.resolve()
      .then(() => setLoading(true))
      .then(platformApi.classes)
      .then(setClasses, setError)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!classId) return;
    platformApi.members(classId).then(setMembers, setError);
  }, [classId]);

  async function assign() {
    setLoading(true);
    setError(null);
    try {
      await platformApi.assign(
        worksheetId,
        studentId === "all" ? { classroomId: classId } : { userId: studentId },
      );
      message.success("Worksheet assigned successfully.");
      onClose();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Assign worksheet"
      onCancel={onClose}
      footer={null}
    >
      {error && <Alert type="error" showIcon title={error.message} />}
      <div style={{ display: "grid", gap: 14 }}>
        <label>
          Class
          <Select
            style={{ width: "100%" }}
            value={classId}
            onChange={(value) => {
              setClassId(value);
              setStudentId("all");
              setMembers([]);
            }}
            options={classes.map((classroom) => ({
              value: classroom.id,
              label: classroom.name,
            }))}
          />
        </label>
        <label>
          Student
          <Select
            style={{ width: "100%" }}
            disabled={!classId}
            value={studentId}
            onChange={setStudentId}
            options={[
              { value: "all", label: "Whole class" },
              ...members.map((member) => ({
                value: member.userId,
                label: member.name,
              })),
            ]}
          />
        </label>
        <Button
          type="primary"
          disabled={!classId}
          loading={loading}
          onClick={assign}
        >
          Assign
        </Button>
      </div>
    </Modal>
  );
}

export function JoinWorksheetCard({ onJoined }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function join() {
    setBusy(true);
    setError(null);
    try {
      const result = await platformApi.joinWorksheet(code);
      onJoined(result);
    } catch (requestError) {
      if (requestError.status === 401) {
        sessionStorage.setItem("pending-worksheet-code", code);
      }
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {error && <Alert type="error" showIcon title={error.message} />}
      <Input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onPressEnter={join}
        placeholder="Worksheet code"
      />
      <Button type="primary" loading={busy} onClick={join}>
        Open worksheet
      </Button>
    </div>
  );
}
