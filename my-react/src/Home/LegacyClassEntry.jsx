import { Navigate, useParams } from "react-router-dom";
import { platformApi } from "../api/platform.js";
import { Resource } from "../platform/PlatformUI.jsx";
import { useResource } from "../platform/useResource.js";

export default function LegacyClassEntry() {
  const { className, kidName } = useParams();
  const resource = useResource(async () => {
    const classes = await platformApi.classes();
    const classroom = classes.find((entry) => entry.name === className);
    if (!classroom) throw new Error("Clasa nu a fost găsită.");
    if (!kidName) return `/classes/${classroom.id}`;
    const students = await platformApi.members(classroom.id);
    const student = students.find((entry) => entry.name === kidName);
    if (!student) throw new Error("Elevul nu a fost găsit.");
    return `/classes/${classroom.id}/children/${student.userId}`;
  }, [className, kidName]);
  return (
    <Resource resource={resource}>
      {(path) => <Navigate to={path} replace />}
    </Resource>
  );
}
